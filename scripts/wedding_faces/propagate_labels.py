#!/usr/bin/env python3
"""Iterative label propagation using known face embeddings."""
from __future__ import annotations

import csv
import json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

from config import (
    AUTO_THRESHOLD,
    DET_SCORE_MIN,
    EMB_DIR,
    META_DIR,
    SUGGEST_THRESHOLD,
    ensure_dirs,
)


def load_json(path: Path, default=None):
    if not path.exists():
        return default if default is not None else {}
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def load_cluster_labels() -> dict[str, dict]:
    path = META_DIR / "cluster_labels.csv"
    labels = {}
    if not path.exists():
        return labels
    with path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cid = row.get("clusterId", "").strip()
            if not cid:
                continue
            labels[cid] = {
                "guestId": int(row["guestId"]) if row.get("guestId") else None,
                "name": row.get("name") or None,
                "table": int(row["table"]) if row.get("table") else None,
                "status": row.get("status") or "confirmed",
            }
    return labels


def update_known_faces_centroids(known_faces: dict) -> dict:
    for key, entry in known_faces.items():
        paths = entry.get("embeddings", [])
        if not paths:
            continue
        vecs = []
        for rel in paths:
            p = Path(rel)
            if not p.is_absolute():
                p = META_DIR.parent.parent / rel
            if not p.exists():
                p = EMB_DIR / Path(rel).name
            if p.exists():
                vecs.append(np.load(p))
        if vecs:
            centroid = np.mean(vecs, axis=0)
            centroid = centroid / np.linalg.norm(centroid)
            centroid_path = EMB_DIR / f"{key.replace(':', '_')}_centroid.npy"
            np.save(centroid_path, centroid)
            entry["centroidPath"] = str(centroid_path.relative_to(META_DIR.parent.parent))
    return known_faces


def cosine_sim(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b))


def clear_prediction_fields(face: dict) -> None:
    face["status"] = "unknown"
    face["name"] = None
    face["guestId"] = None
    face["table"] = None
    face["suggestion"] = None
    face["suggestionScore"] = None
    face["companionOfGuestId"] = None
    face["companionOfName"] = None
    face["nameType"] = None


def reset_face_for_repredict(face: dict) -> bool:
    """Reset auto/manual-dismiss states so cluster + embedding prediction can re-run.

    Keeps intentional confirmed guest/companion/custom names and staff marks.
    """
    current = face.get("status", "unknown")
    if current == "staff":
        return False
    if current == "confirmed" and face.get("name"):
        return False
    clear_prediction_fields(face)
    return True


def build_centroids(known_faces: dict) -> list[tuple]:
    centroids = []
    for key, entry in known_faces.items():
        cp = entry.get("centroidPath")
        if not cp:
            continue
        p = META_DIR.parent.parent / cp
        if p.exists():
            centroids.append(
                (
                    entry.get("name"),
                    key,
                    entry.get("guestId"),
                    entry.get("table"),
                    entry.get("companionOfGuestId"),
                    entry.get("companionOfName"),
                    entry.get("nameType"),
                    np.load(p),
                )
            )
    return centroids


def predict_face(
    face: dict,
    cluster_labels: dict[str, dict],
    centroids: list[tuple],
) -> str | None:
    """Apply cluster inheritance + embedding match to one face. Returns action tag."""
    cid = face.get("clusterId")
    current = face.get("status", "unknown")

    if current in ("not_face", "skipped", "staff"):
        return None
    if current == "confirmed" and face.get("name"):
        return None
    det = face.get("detScore")
    if det is not None and det < DET_SCORE_MIN:
        return None

    if cid and cid in cluster_labels:
        lbl = cluster_labels[cid]
        lbl_status = lbl.get("status") or "confirmed"
        if lbl_status == "not_face":
            face["status"] = "not_face"
            face["name"] = None
            face["guestId"] = None
            face["table"] = None
            face["suggestion"] = None
            face["suggestionScore"] = None
            face["companionOfGuestId"] = None
            face["companionOfName"] = None
            face["nameType"] = None
            return "cluster"
        if lbl_status == "confirmed" and lbl.get("name"):
            face["status"] = "confirmed"
            face["name"] = lbl["name"]
            face["guestId"] = lbl.get("guestId")
            face["table"] = lbl.get("table")
            face["suggestion"] = None
            face["suggestionScore"] = None
            if lbl.get("guestId"):
                face["nameType"] = "guest"
            return "cluster"

    emb_path = EMB_DIR / f"{face['faceId']}.npy"
    if not emb_path.exists():
        return None
    emb = np.load(emb_path)

    best = None
    best_score = 0.0
    for name, _key, guest_id, table, companion_of_guest_id, companion_of_name, name_type, centroid in centroids:
        score = cosine_sim(emb, centroid)
        if score > best_score:
            best_score = score
            best = (name, guest_id, table, companion_of_guest_id, companion_of_name, name_type)

    if best_score >= AUTO_THRESHOLD and best and best[0]:
        name, guest_id, table, companion_of_guest_id, companion_of_name, name_type = best
        face["status"] = "confirmed"
        face["name"] = name
        face["guestId"] = guest_id
        face["table"] = table
        face["suggestion"] = None
        face["suggestionScore"] = best_score
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
        return "auto"
    if best_score >= SUGGEST_THRESHOLD and best and best[0]:
        name, guest_id, table, companion_of_guest_id, companion_of_name, name_type = best
        face["status"] = "suggested"
        face["suggestion"] = name
        face["suggestionScore"] = best_score
        face["guestId"] = guest_id
        face["table"] = table
        face["companionOfGuestId"] = companion_of_guest_id
        face["companionOfName"] = companion_of_name
        if name_type:
            face["nameType"] = name_type
        return "suggest"

    face["status"] = "unknown"
    face["suggestion"] = None
    face["suggestionScore"] = None
    return None


def recompute_progress(face_index: dict, *, auto_count=0, suggest_count=0, cluster_inherit=0) -> dict:
    photo_names = {}
    total_faces = 0
    named_faces = 0
    photos_with_names = 0

    for pid, faces in face_index.items():
        names = []
        tables = []
        for f in faces:
            total_faces += 1
            if f.get("status") == "confirmed" and f.get("name"):
                named_faces += 1
                names.append(f["name"])
                if f.get("table"):
                    tables.append(f["table"])
        names = list(dict.fromkeys(names))
        tables = sorted(set(tables))
        photo_names[pid] = {"names": names, "tables": tables}
        if names:
            photos_with_names += 1

    progress = {
        "totalPhotos": len(face_index),
        "photosWithNames": photos_with_names,
        "totalFaces": total_faces,
        "namedFaces": named_faces,
        "namedFaceRate": round(named_faces / max(total_faces, 1), 4),
        "photoNameRate": round(photos_with_names / max(len(face_index), 1), 4),
        "lastPropagatedAt": datetime.now(timezone.utc).isoformat(),
        "autoLabeled": auto_count,
        "suggestions": suggest_count,
        "clusterInherited": cluster_inherit,
    }
    save_json(META_DIR / "photo_names.json", photo_names)
    save_json(META_DIR / "label_progress.json", progress)
    return progress


def propagate(photo_ids: set[str] | None = None, *, reset: bool = False) -> dict:
    """Propagate labels. Optionally limit to photo_ids and/or reset those photos first."""
    ensure_dirs()
    face_index = load_json(META_DIR / "face_index.json", {})
    cluster_labels = load_cluster_labels()
    known_faces = load_json(META_DIR / "known_faces.json", {})
    known_faces = update_known_faces_centroids(known_faces)
    centroids = build_centroids(known_faces)

    auto_count = 0
    suggest_count = 0
    cluster_inherit = 0
    reset_count = 0

    for pid, faces in face_index.items():
        if photo_ids is not None and pid not in photo_ids:
            continue

        if reset:
            for face in faces:
                if reset_face_for_repredict(face):
                    reset_count += 1

        for face in faces:
            action = predict_face(face, cluster_labels, centroids)
            if action == "auto":
                auto_count += 1
            elif action == "suggest":
                suggest_count += 1
            elif action == "cluster":
                cluster_inherit += 1

    save_json(META_DIR / "face_index.json", face_index)
    save_json(META_DIR / "known_faces.json", known_faces)

    progress = recompute_progress(
        face_index,
        auto_count=auto_count,
        suggest_count=suggest_count,
        cluster_inherit=cluster_inherit,
    )
    progress["resetCount"] = reset_count
    print(
        f"Propagated: auto={auto_count}, suggested={suggest_count}, "
        f"cluster={cluster_inherit}, reset={reset_count}"
    )
    print(
        f"Coverage: {progress['namedFaces']}/{progress['totalFaces']} faces "
        f"({progress['namedFaceRate']*100:.1f}%), "
        f"{progress['photosWithNames']}/{progress['totalPhotos']} photos "
        f"({progress['photoNameRate']*100:.1f}%)"
    )
    return progress


def repredict_photo(photo_id: str) -> dict:
    """Reset dismiss/pending faces on one photo, then re-apply cluster + auto naming."""
    face_index = load_json(META_DIR / "face_index.json", {})
    if photo_id not in face_index:
        raise KeyError(f"photo not found: {photo_id}")
    return propagate(photo_ids={photo_id}, reset=True)


if __name__ == "__main__":
    propagate()
