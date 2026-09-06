#!/usr/bin/env python3
"""Prune the known_faces bank so it only keeps currently confirmed vectors.

What this cleans
----------------
- `known_faces.json` embedding refs that no longer belong to a confirmed face
  with the same person (e.g. you later marked the face as 略過, or replaced the box).
- Entire people entries that end up with zero usable embeddings
  (typos / abandoned custom names).
- Orphan `*_centroid.npy` files for deleted keys.

What this does NOT delete
-------------------------
- Per-face `data/face_embeddings/<faceId>.npy` from detection.
  Those are needed for repredict / optimize even when a face is 略過.

Usage
-----
  cd scripts/wedding_faces && source .venv/bin/activate
  python prune_known_faces.py                 # dry-run: drop stale only
  python prune_known_faces.py --apply         # write prune
  python prune_known_faces.py --sync --apply  # also backfill missing confirmed faces
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
from pathlib import Path

from config import EMB_DIR, META_DIR, PROJECT_ROOT, ensure_dirs
from propagate_labels import load_json, save_json, update_known_faces_centroids


def face_stem(rel: str) -> str:
    return Path(str(rel)).stem


def person_key(face: dict) -> str | None:
    if face.get("status") != "confirmed" or not face.get("name"):
        return None
    guest_id = face.get("guestId")
    if guest_id is not None:
        return f"guest:{guest_id}"
    return f"name:{face['name']}"


def rel_emb_for(face_id: str) -> str:
    return str((EMB_DIR / f"{face_id}.npy").relative_to(PROJECT_ROOT))


def collect_confirmed(face_index: dict) -> dict[str, dict]:
    """knownKey -> metadata + faceIds currently confirmed for that person."""
    by_key: dict[str, dict] = {}
    for faces in face_index.values():
        for face in faces:
            key = person_key(face)
            if not key:
                continue
            entry = by_key.setdefault(
                key,
                {
                    "guestId": face.get("guestId"),
                    "name": face.get("name"),
                    "table": face.get("table"),
                    "companionOfGuestId": face.get("companionOfGuestId"),
                    "companionOfName": face.get("companionOfName"),
                    "nameType": face.get("nameType"),
                    "faceIds": set(),
                },
            )
            for field in (
                "guestId",
                "table",
                "companionOfGuestId",
                "companionOfName",
                "nameType",
            ):
                if entry.get(field) is None and face.get(field) is not None:
                    entry[field] = face.get(field)
            entry["faceIds"].add(face["faceId"])
    return by_key


def refs_for_face_ids(face_ids: set[str], missing_counter: list) -> list[str]:
    refs: list[str] = []
    seen: set[str] = set()
    for fid in sorted(face_ids):
        path = EMB_DIR / f"{fid}.npy"
        if not path.exists():
            missing_counter[0] += 1
            continue
        ref = rel_emb_for(fid)
        if ref not in seen:
            seen.add(ref)
            refs.append(ref)
    return refs


def prune(
    known_faces: dict,
    confirmed_by_key: dict[str, dict],
    *,
    sync_missing: bool,
) -> tuple[dict, dict]:
    missing = [0]
    report = {
        "beforePeople": len(known_faces),
        "beforeEmbeddingRefs": sum(len(e.get("embeddings") or []) for e in known_faces.values()),
        "removedPeople": [],
        "trimmedPeople": [],
        "addedPeople": [],
        "staleRefsRemoved": 0,
        "syncMissing": sync_missing,
    }

    pruned: dict = {}

    for key, entry in known_faces.items():
        conf = confirmed_by_key.get(key)
        if not conf:
            report["removedPeople"].append(
                {
                    "key": key,
                    "name": entry.get("name"),
                    "hadEmbeddings": len(entry.get("embeddings") or []),
                    "reason": "no confirmed faces for this key",
                }
            )
            continue

        old_refs = list(entry.get("embeddings") or [])
        live_ids = conf["faceIds"]

        # Keep only refs that are still confirmed for this person AND file exists.
        new_refs: list[str] = []
        seen: set[str] = set()
        for rel in old_refs:
            stem = face_stem(rel)
            if stem not in live_ids:
                report["staleRefsRemoved"] += 1
                continue
            path = EMB_DIR / f"{stem}.npy"
            if not path.exists():
                missing[0] += 1
                continue
            ref = rel_emb_for(stem)
            if ref not in seen:
                seen.add(ref)
                new_refs.append(ref)

        if sync_missing:
            for fid in sorted(live_ids):
                if fid in seen:
                    continue
                path = EMB_DIR / f"{fid}.npy"
                if not path.exists():
                    missing[0] += 1
                    continue
                ref = rel_emb_for(fid)
                seen.add(fid)
                new_refs.append(ref)

        if not new_refs:
            report["removedPeople"].append(
                {
                    "key": key,
                    "name": conf.get("name") or entry.get("name"),
                    "hadEmbeddings": len(old_refs),
                    "reason": "no usable embeddings left after prune",
                }
            )
            continue

        if len(new_refs) != len(old_refs):
            report["trimmedPeople"].append(
                {
                    "key": key,
                    "name": conf.get("name") or entry.get("name"),
                    "before": len(old_refs),
                    "after": len(new_refs),
                }
            )

        pruned[key] = {
            **entry,
            "guestId": conf.get("guestId", entry.get("guestId")),
            "name": conf.get("name") or entry.get("name"),
            "table": conf.get("table", entry.get("table")),
            "companionOfGuestId": conf.get(
                "companionOfGuestId", entry.get("companionOfGuestId")
            ),
            "companionOfName": conf.get(
                "companionOfName", entry.get("companionOfName")
            ),
            "nameType": conf.get("nameType", entry.get("nameType")),
            "embeddings": new_refs,
        }

    if sync_missing:
        for key, conf in confirmed_by_key.items():
            if key in pruned:
                continue
            new_refs = refs_for_face_ids(conf["faceIds"], missing)
            if not new_refs:
                continue
            pruned[key] = {
                "guestId": conf.get("guestId"),
                "name": conf.get("name"),
                "table": conf.get("table"),
                "companionOfGuestId": conf.get("companionOfGuestId"),
                "companionOfName": conf.get("companionOfName"),
                "nameType": conf.get("nameType"),
                "embeddings": new_refs,
                "confirmedAt": datetime.now(timezone.utc).isoformat(),
            }
            report["addedPeople"].append(
                {
                    "key": key,
                    "name": conf.get("name"),
                    "embeddings": len(new_refs),
                }
            )

    report["missingFilesSkipped"] = missing[0]
    report["keptPeople"] = len(pruned)
    report["keptEmbeddingRefs"] = sum(len(e.get("embeddings") or []) for e in pruned.values())
    return pruned, report


def orphan_centroids(known_faces: dict) -> list[Path]:
    keep = set()
    for key, entry in known_faces.items():
        keep.add(f"{key.replace(':', '_')}_centroid.npy")
        cp = entry.get("centroidPath")
        if cp:
            keep.add(Path(cp).name)
    if not EMB_DIR.exists():
        return []
    return [p for p in EMB_DIR.glob("*_centroid.npy") if p.name not in keep]


def main() -> None:
    parser = argparse.ArgumentParser(description="Prune unused known_faces bank vectors")
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write known_faces.json, rebuild centroids, delete orphan centroid files",
    )
    parser.add_argument(
        "--sync",
        action="store_true",
        help="Also add any currently confirmed faces that are missing from the bank",
    )
    args = parser.parse_args()
    ensure_dirs()

    face_index = load_json(META_DIR / "face_index.json", {})
    known_faces = load_json(META_DIR / "known_faces.json", {})
    confirmed_by_key = collect_confirmed(face_index)

    pruned, report = prune(known_faces, confirmed_by_key, sync_missing=args.sync)

    preview = {k: dict(v) for k, v in pruned.items()}
    for key in preview:
        preview[key]["centroidPath"] = str(
            (EMB_DIR / f"{key.replace(':', '_')}_centroid.npy").relative_to(PROJECT_ROOT)
        )
    centroid_orphans = orphan_centroids(preview)

    print("=== prune known_faces (bank) ===")
    print(f"mode: {'APPLY' if args.apply else 'DRY-RUN'}")
    print(f"people: {report['beforePeople']} → {report['keptPeople']}")
    print(
        f"embedding refs: {report['beforeEmbeddingRefs']} → {report['keptEmbeddingRefs']}"
        f"  (stale removed {report['staleRefsRemoved']}, missing files {report['missingFilesSkipped']})"
    )
    print(f"people removed: {len(report['removedPeople'])}")
    for row in report["removedPeople"]:
        print(
            f"  - {row['key']} 「{row.get('name')}」 had={row.get('hadEmbeddings')}"
            f"  ({row.get('reason')})"
        )
    print(f"people trimmed: {len(report['trimmedPeople'])}")
    for row in sorted(
        report["trimmedPeople"], key=lambda r: r["before"] - r["after"], reverse=True
    )[:25]:
        print(f"  - {row['key']} 「{row.get('name')}」 {row['before']} → {row['after']}")
    if len(report["trimmedPeople"]) > 25:
        print(f"  … +{len(report['trimmedPeople']) - 25} more")
    print(f"people added (were confirmed but missing from bank): {len(report['addedPeople'])}")
    for row in report["addedPeople"][:20]:
        print(f"  - {row['key']} 「{row.get('name')}」 embeddings={row['embeddings']}")
    print(f"orphan centroid files: {len(centroid_orphans)}")
    for p in centroid_orphans[:20]:
        print(f"  - {p.name}")

    save_json(
        META_DIR / "prune_known_faces_report.json",
        {
            **report,
            "orphanCentroids": [p.name for p in centroid_orphans],
            "dryRun": not args.apply,
            "createdAt": datetime.now(timezone.utc).isoformat(),
        },
    )
    print(f"\nreport → {META_DIR / 'prune_known_faces_report.json'}")

    if not args.apply:
        print("\nNo files changed. Re-run with --apply to write.")
        return

    known_faces = update_known_faces_centroids(pruned)
    save_json(META_DIR / "known_faces.json", known_faces)

    deleted = []
    for path in orphan_centroids(known_faces):
        path.unlink(missing_ok=True)
        deleted.append(path.name)

    print(f"\nWrote known_faces.json ({len(known_faces)} people).")
    print(f"Deleted orphan centroids: {len(deleted)}")
    print("Done. Restart label_server.py if it is running.")


if __name__ == "__main__":
    main()
