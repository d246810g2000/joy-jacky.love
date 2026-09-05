#!/usr/bin/env python3
"""Build photos.json from exif, face labels, and guest data."""
from __future__ import annotations

import json
from pathlib import Path

from config import (
    META_DIR,
    PHOTOS_JSON,
    STAGE_DESCRIPTIONS,
    STAGE_ORDER,
    STAGE_TAGS,
    STAGE_TITLES,
    stage_clock_time,
    ensure_dirs,
)


def load_json(path: Path, default=None):
    if not path.exists():
        return default if default is not None else {}
    return json.loads(path.read_text(encoding="utf-8"))


def stage_tags(stage_id: str) -> list[str]:
    return STAGE_TAGS.get(stage_id, [])


def main():
    ensure_dirs()
    exif = load_json(META_DIR / "exif_times.json", {})
    face_index = load_json(META_DIR / "face_index.json", {})
    photo_names = load_json(META_DIR / "photo_names.json", {})
    progress = load_json(META_DIR / "label_progress.json", {})

    stages_map: dict[str, dict] = {}
    for stage_id in STAGE_ORDER:
        title = STAGE_TITLES.get(stage_id, stage_id)
        stages_map[stage_id] = {
            "id": stage_id,
            "time": stage_clock_time(stage_id),
            "title": title,
            "description": STAGE_DESCRIPTIONS.get(stage_id, ""),
            "photos": [],
        }

    for pid, meta in sorted(exif.items(), key=lambda x: x[1].get("sortIndex", 0)):
        stage_id = meta.get("stageId", STAGE_ORDER[0])
        if stage_id not in stages_map:
            stage_id = STAGE_ORDER[0]

        pn = photo_names.get(pid, {})
        names = pn.get("names", [])
        tables = pn.get("tables", [])

        faces = face_index.get(pid, [])
        face_list = []
        for f in faces:
            if f.get("status") == "not_face":
                continue
            face_list.append(
                {
                    "faceId": f.get("faceId"),
                    "clusterId": f.get("clusterId"),
                    "box": f.get("box"),
                    "name": f.get("name"),
                    "guestId": f.get("guestId"),
                    "table": f.get("table"),
                    "status": f.get("status"),
                    "suggestion": f.get("suggestion"),
                    "companionOfGuestId": f.get("companionOfGuestId"),
                    "companionOfName": f.get("companionOfName"),
                    "nameType": f.get("nameType"),
                }
            )

        photo = {
            "id": pid,
            "publicId": f"wedding_20260530/{pid}",
            "time": meta.get("time") or "",
            "videoTime": meta.get("videoTime") or "",
            "caption": "",
            "tables": tables,
            "names": names,
            "tags": stage_tags(stage_id),
            "stageId": stage_id,
            "sourcePath": meta.get("sourcePath"),
            "faces": face_list,
        }
        stages_map[stage_id]["photos"].append(photo)

    output = {
        "meta": {
            **progress,
            "totalPhotos": len(exif),
        },
        "stages": [stages_map[s] for s in STAGE_ORDER if stages_map[s]["photos"]],
    }

    PHOTOS_JSON.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {PHOTOS_JSON} ({len(exif)} photos, {len(output['stages'])} stages)")


if __name__ == "__main__":
    main()
