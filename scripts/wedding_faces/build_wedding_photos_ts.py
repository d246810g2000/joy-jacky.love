#!/usr/bin/env python3
"""Generate data/weddingPhotos.ts from photos.json + Cloudinary upload map."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from config import (
    CLOUDINARY_MAP,
    PHOTOS_JSON,
    STAGE_DESCRIPTIONS,
    STAGE_ORDER,
    STAGE_TITLES,
    stage_clock_time,
    WEDDING_PHOTOS_TS,
    ensure_dirs,
)


def load_json(path: Path, default=None):
    if not path.exists():
        return default if default is not None else {}
    return json.loads(path.read_text(encoding="utf-8"))


def ts_string(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def orientation_from_dims(width: int | None, height: int | None) -> str:
    if width and height and width > height:
        return "landscape"
    return "portrait"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--require-upload",
        action="store_true",
        default=True,
        help="Only include photos present in cloudinary_map (default)",
    )
    parser.add_argument(
        "--all-labeled",
        dest="require_upload",
        action="store_false",
        help="Include all photos even if not uploaded yet",
    )
    parser.add_argument(
        "--labeled-only",
        action="store_true",
        default=False,
        help="Only include photos with at least one name",
    )
    parser.add_argument(
        "--hero",
        default="",
        help="publicId for HERO_COVER (default: first grand_entrance photo)",
    )
    args = parser.parse_args()

    ensure_dirs()
    if not PHOTOS_JSON.exists():
        print(f"Missing {PHOTOS_JSON}", file=sys.stderr)
        sys.exit(1)

    manifest = load_json(PHOTOS_JSON)
    cmap = load_json(CLOUDINARY_MAP, {})

    stages_out: list[dict] = []
    hero_public_id = args.hero or None
    total = 0

    manifest_stages = {s["id"]: s for s in manifest.get("stages", [])}

    for stage_id in STAGE_ORDER:
        stage_src = manifest_stages.get(stage_id)
        if not stage_src:
            continue

        photos_out = []
        for photo in stage_src.get("photos", []):
            if args.labeled_only and not photo.get("names"):
                continue
            if args.require_upload and photo["id"] not in cmap:
                continue

            entry = cmap.get(photo["id"], {})
            public_id = entry.get("publicId") or photo.get("publicId")
            orientation = orientation_from_dims(entry.get("width"), entry.get("height"))

            photos_out.append(
                {
                    "id": photo["id"],
                    "publicId": public_id,
                    "time": photo.get("time") or "",
                    "videoTime": photo.get("videoTime") or "",
                    "caption": photo.get("caption") or "",
                    "tables": photo.get("tables") or [],
                    "tags": photo.get("tags") or [],
                    "names": photo.get("names") or [],
                    "stageId": stage_id,
                    "orientation": orientation,
                }
            )
            total += 1
            if hero_public_id is None and stage_id == "grand_entrance":
                hero_public_id = public_id

        if not photos_out:
            continue

        stages_out.append(
            {
                "id": stage_id,
                "time": stage_clock_time(stage_id),
                "title": STAGE_TITLES.get(stage_id, stage_src.get("title", stage_id)),
                "description": STAGE_DESCRIPTIONS.get(stage_id, stage_src.get("description", "")),
                "photos": photos_out,
            }
        )

    if hero_public_id is None:
        for stage in stages_out:
            if stage["photos"]:
                hero_public_id = stage["photos"][0]["publicId"]
                break
    hero_public_id = hero_public_id or "wedding_20260530/placeholder"

    def emit_photo(p: dict) -> str:
        video_time_line = (
            f"        videoTime: {ts_string(p['videoTime'])},\n" if p.get("videoTime") else ""
        )
        lines = [
            "      {",
            f"        id: {ts_string(p['id'])},",
            f"        publicId: {ts_string(p['publicId'])},",
            f"        time: {ts_string(p['time'])},",
            video_time_line.rstrip("\n"),
            f"        caption: {ts_string(p['caption'])},",
            f"        tables: {json.dumps(p['tables'])},",
            f"        tags: {json.dumps(p['tags'], ensure_ascii=False)},",
            f"        names: {json.dumps(p['names'], ensure_ascii=False)},",
            f"        stageId: {ts_string(p['stageId'])},",
            f"        orientation: {ts_string(p['orientation'])},",
            "      },",
        ]
        return "\n".join(line for line in lines if line)

    stage_blocks = []
    for stage in stages_out:
        photo_lines = "\n".join(emit_photo(p) for p in stage["photos"])
        block = f"""  {{
    id: {ts_string(stage['id'])},
    time: {ts_string(stage['time'])},
    title: {ts_string(stage['title'])},
    description: {ts_string(stage['description'])},
    photos: [
{photo_lines}
    ],
  }}"""
        stage_blocks.append(block)

    stages_joined = ",\n".join(stage_blocks)

    content = f"""import type {{ WeddingStage }} from '../types';

/** Public derived album manifest — do not store private face metadata here. */
export const WEDDING_STAGES: WeddingStage[] = [
{stages_joined}
];

export const ALL_WEDDING_PHOTOS = WEDDING_STAGES.flatMap((s) => s.photos);

export const STAGE_NAV_ITEMS = WEDDING_STAGES.map((s) => ({{
  id: s.id,
  time: s.time,
  label: s.title.split(' ').slice(1).join(' ') || s.title,
}}));

export const HERO_COVER_PUBLIC_ID = {ts_string(hero_public_id)};
"""

    WEDDING_PHOTOS_TS.write_text(content, encoding="utf-8")
    print(f"Wrote {WEDDING_PHOTOS_TS} ({total} photos, {len(stages_out)} stages, hero={hero_public_id})")


if __name__ == "__main__":
    main()
