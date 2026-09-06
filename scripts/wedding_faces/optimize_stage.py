#!/usr/bin/env python3
"""Re-scan faces in one photo stage against the labeled knowledge bank.

Optimization intent:
- Use the matured known_faces bank to re-label faces the user previously
  skipped (not_face), plus remaining unknown / suggested.
- not_face only means "skipped for now" — during optimize we DO score them
  and bring matches back (suggest / confirm / replace).
- staff stays untouched.
- If a match overlaps an already-confirmed same name (IoU), confirm the new
  box and retire the old one. Each photo keeps unique confirmed names.
"""
from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from datetime import datetime, timezone

import numpy as np

from config import (
    AUTO_THRESHOLD,
    DET_SCORE_MIN,
    EMB_DIR,
    META_DIR,
    STAGE_BY_ID,
    STAGE_LABELS,
    STAGE_ORDER,
    SUGGEST_THRESHOLD,
    assign_stage_from_sort_index,
    ensure_dirs,
)
from propagate_labels import (
    build_centroids,
    cosine_sim,
    load_json,
    recompute_progress,
    save_json,
    update_known_faces_centroids,
)

SAFE_AUTO_THRESHOLD = max(AUTO_THRESHOLD, 0.80)
# Bring skipped (not_face) back when bank match is good enough
RESURRECT_THRESHOLD = 0.58
REPLACE_IOU = 0.25


def load_stage_photo_ids(stage_id: str) -> list[str]:
    exif = load_json(META_DIR / "exif_times.json", {})
    ids: list[str] = []
    for pid, meta in exif.items():
        si = meta.get("sortIndex")
        if si is None:
            try:
                si = int(str(pid).split("-")[1])
            except Exception:
                continue
        if assign_stage_from_sort_index(int(si)) == stage_id:
            ids.append(pid)
    return sorted(ids, key=lambda x: int(str(x).split("-")[1]))


def box_iou_xywh(a, b) -> float:
    """IoU for normalized [x, y, w, h] boxes."""
    if not a or not b or len(a) < 4 or len(b) < 4:
        return 0.0
    ax, ay, aw, ah = [float(v) for v in a[:4]]
    bx, by, bw, bh = [float(v) for v in b[:4]]
    a2x, a2y = ax + aw, ay + ah
    b2x, b2y = bx + bw, by + bh
    ix1, iy1 = max(ax, bx), max(ay, by)
    ix2, iy2 = min(a2x, b2x), min(a2y, b2y)
    iw, ih = max(0.0, ix2 - ix1), max(0.0, iy2 - iy1)
    inter = iw * ih
    if inter <= 0:
        return 0.0
    union = aw * ah + bw * bh - inter
    return float(inter / union) if union > 0 else 0.0


def best_match(emb: np.ndarray, centroids: list[tuple]):
    best = None
    best_score = 0.0
    for name, key, guest_id, table, companion_of_guest_id, companion_of_name, name_type, centroid in centroids:
        score = cosine_sim(emb, centroid)
        if score > best_score:
            best_score = score
            best = (
                name,
                key,
                guest_id,
                table,
                companion_of_guest_id,
                companion_of_name,
                name_type,
            )
    return best, best_score


def clear_to_skip(face: dict) -> None:
    """Retire a replaced duplicate box — user can skip again if unwanted."""
    face["status"] = "not_face"
    face["name"] = None
    face["guestId"] = None
    face["table"] = None
    face["suggestion"] = None
    face["suggestionScore"] = None
    face["companionOfGuestId"] = None
    face["companionOfName"] = None
    face["nameType"] = None


def apply_label(face: dict, match: tuple, score: float, *, status: str) -> None:
    name, _key, guest_id, table, companion_of_guest_id, companion_of_name, name_type = match
    face["guestId"] = guest_id
    face["table"] = table
    face["companionOfGuestId"] = companion_of_guest_id
    face["companionOfName"] = companion_of_name
    if name_type:
        face["nameType"] = name_type
    elif guest_id:
        face["nameType"] = "guest"
    elif companion_of_name:
        face["nameType"] = "companion"
    else:
        face["nameType"] = "custom"

    if status == "confirmed":
        face["status"] = "confirmed"
        face["name"] = name
        face["suggestion"] = None
        face["suggestionScore"] = round(float(score), 4)
    else:
        face["status"] = "suggested"
        face["name"] = None
        face["suggestion"] = name
        face["suggestionScore"] = round(float(score), 4)


def confirmed_with_name(faces: list[dict], name: str) -> list[dict]:
    return [
        f
        for f in faces
        if f.get("status") == "confirmed" and (f.get("name") or "").strip() == name
    ]


def face_quality(face: dict) -> float:
    det = float(face.get("detScore") or 0)
    sug = float(face.get("suggestionScore") or 0)
    return max(det, sug)


def enforce_unique_names(faces: list[dict], *, dry_run: bool) -> list[dict]:
    """Keep at most one confirmed face per name; retire the rest as skip."""
    changes = []
    by_name: dict[str, list[dict]] = defaultdict(list)
    for face in faces:
        if face.get("status") == "confirmed" and face.get("name"):
            by_name[face["name"]].append(face)

    for name, group in by_name.items():
        if len(group) <= 1:
            continue
        winner = max(group, key=face_quality)
        for face in group:
            if face is winner:
                continue
            changes.append(
                {
                    "faceId": face.get("faceId"),
                    "name": name,
                    "action": "unique_retire",
                    "keptFaceId": winner.get("faceId"),
                    "detScore": face.get("detScore"),
                }
            )
            if not dry_run:
                clear_to_skip(face)

    confirmed_names = {
        f.get("name")
        for f in faces
        if f.get("status") == "confirmed" and f.get("name")
    }
    for face in faces:
        if face.get("status") != "suggested":
            continue
        sug = (face.get("suggestion") or "").strip()
        if not sug or sug not in confirmed_names:
            continue
        changes.append(
            {
                "faceId": face.get("faceId"),
                "name": sug,
                "action": "drop_dup_suggestion",
                "detScore": face.get("detScore"),
            }
        )
        if not dry_run:
            clear_to_skip(face)
    return changes


def optimize_stage(stage_id: str, *, dry_run: bool = False) -> dict:
    if stage_id not in STAGE_BY_ID:
        raise SystemExit(f"Unknown stage: {stage_id}. Choose from {STAGE_ORDER}")

    ensure_dirs()
    photo_ids = load_stage_photo_ids(stage_id)
    face_index = load_json(META_DIR / "face_index.json", {})
    known_faces = load_json(META_DIR / "known_faces.json", {})
    known_faces = update_known_faces_centroids(known_faces)
    centroids = build_centroids(known_faces)

    before = Counter()
    after = Counter()
    changes: list[dict] = []
    scanned = 0
    skipped_confirmed = 0
    scanned_not_face = 0
    missing_emb = 0

    target_pids = [pid for pid in photo_ids if pid in face_index]

    for pid in target_pids:
        for face in face_index[pid]:
            before[face.get("status") or "unknown"] += 1

    for pid in target_pids:
        faces = face_index[pid]
        for face in faces:
            st = face.get("status") or "unknown"
            # confirmed / staff stay; not_face IS scored (revive from bank)
            if st in ("confirmed", "staff"):
                if st == "confirmed":
                    skipped_confirmed += 1
                continue

            det = face.get("detScore")
            if det is not None and det < DET_SCORE_MIN:
                continue

            emb_path = EMB_DIR / f"{face['faceId']}.npy"
            if not emb_path.exists():
                missing_emb += 1
                continue

            scanned += 1
            if st == "not_face":
                scanned_not_face += 1

            emb = np.load(emb_path)
            match, score = best_match(emb, centroids)
            if not match or not match[0]:
                continue

            name = match[0]
            # Skipped faces need at least resurrect threshold to come back
            min_score = RESURRECT_THRESHOLD if st == "not_face" else SUGGEST_THRESHOLD
            if score < min_score:
                continue

            prev = {
                "photoId": pid,
                "faceId": face["faceId"],
                "fromStatus": st,
                "name": name,
                "score": round(float(score), 4),
                "detScore": det,
                "clusterId": face.get("clusterId"),
            }

            same_name = confirmed_with_name(faces, name)
            overlapping = [
                f
                for f in same_name
                if box_iou_xywh(face.get("box"), f.get("box")) >= REPLACE_IOU
            ]

            if overlapping:
                if not dry_run:
                    apply_label(face, match, score, status="confirmed")
                    for old in overlapping:
                        if old is face:
                            continue
                        clear_to_skip(old)
                prev["action"] = "replace_confirm"
                prev["replacedFaceIds"] = [f.get("faceId") for f in overlapping if f is not face]
                prev["iou"] = round(
                    max(box_iou_xywh(face.get("box"), f.get("box")) for f in overlapping),
                    4,
                )
                changes.append(prev)
                continue

            if same_name:
                best_old = max(same_name, key=face_quality)
                if face_quality(face) >= face_quality(best_old) or score >= SAFE_AUTO_THRESHOLD:
                    if not dry_run:
                        apply_label(face, match, score, status="confirmed")
                        for old in same_name:
                            clear_to_skip(old)
                    prev["action"] = "unique_replace"
                    prev["replacedFaceIds"] = [f.get("faceId") for f in same_name]
                    changes.append(prev)
                continue

            if score >= SAFE_AUTO_THRESHOLD:
                if not dry_run:
                    apply_label(face, match, score, status="confirmed")
                prev["action"] = "auto_confirm" if st != "not_face" else "resurrect_confirm"
                changes.append(prev)
            else:
                if (
                    st == "suggested"
                    and face.get("suggestion") == name
                    and abs(float(face.get("suggestionScore") or 0) - score) < 0.001
                ):
                    continue
                if not dry_run:
                    apply_label(face, match, score, status="suggested")
                prev["action"] = "resurrect_suggest" if st == "not_face" else "suggest"
                changes.append(prev)

        for ch in enforce_unique_names(faces, dry_run=dry_run):
            ch["photoId"] = pid
            changes.append(ch)

    for pid in target_pids:
        for face in face_index[pid]:
            after[face.get("status") or "unknown"] += 1

    progress = None
    if not dry_run:
        save_json(META_DIR / "face_index.json", face_index)
        save_json(META_DIR / "known_faces.json", known_faces)
        progress = recompute_progress(face_index)

    report = {
        "stageId": stage_id,
        "stageLabel": STAGE_LABELS.get(stage_id, stage_id),
        "dryRun": dry_run,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "thresholds": {
            "suggest": SUGGEST_THRESHOLD,
            "resurrect": RESURRECT_THRESHOLD,
            "safeAuto": SAFE_AUTO_THRESHOLD,
            "detMin": DET_SCORE_MIN,
            "replaceIou": REPLACE_IOU,
        },
        "photosInStage": len(photo_ids),
        "photosWithFaces": len(target_pids),
        "centroids": len(centroids),
        "scannedEligibleFaces": scanned,
        "scannedNotFace": scanned_not_face,
        "skippedConfirmed": skipped_confirmed,
        "missingEmbeddings": missing_emb,
        "beforeStatus": dict(before),
        "afterStatus": dict(after),
        "changeCounts": dict(Counter(c["action"] for c in changes)),
        "changes": changes,
        "progress": progress,
    }

    report_path = META_DIR / f"optimize_report_{stage_id}.json"
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    report["reportPath"] = str(report_path)
    return report


def main():
    parser = argparse.ArgumentParser(description="Optimize one wedding photo stage with known face bank")
    parser.add_argument("--stage", default=STAGE_ORDER[0], choices=STAGE_ORDER)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    report = optimize_stage(args.stage, dry_run=args.dry_run)
    print(f"Stage: {report['stageLabel']} ({report['stageId']})")
    print(f"Photos: {report['photosWithFaces']}/{report['photosInStage']} with faces")
    print(f"Before: {report['beforeStatus']}")
    print(f"After:  {report['afterStatus']}")
    print(
        f"Scanned not_face: {report['scannedNotFace']}; "
        f"all eligible: {report['scannedEligibleFaces']}"
    )
    print(f"Changes: {report['changeCounts']}")
    print(f"Report: {report['reportPath']}")
    for c in report["changes"][:40]:
        extra = ""
        if c.get("replacedFaceIds"):
            extra += f" replace={c['replacedFaceIds']}"
        if c.get("iou") is not None:
            extra += f" iou={c['iou']}"
        print(
            f"  {c.get('action', '?'):18} {c.get('photoId')} {c.get('faceId')} "
            f"{c.get('fromStatus', '')} -> {c.get('name')} @ {float(c.get('score') or 0):.3f}{extra}"
        )
    if len(report["changes"]) > 40:
        print(f"  ... +{len(report['changes']) - 40} more")


if __name__ == "__main__":
    main()
