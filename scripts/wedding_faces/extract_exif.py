#!/usr/bin/env python3
"""Extract photo sort order and assign wedding video timeline stages."""
from __future__ import annotations

import json
import re
from pathlib import Path

from config import (
    META_DIR,
    PHOTO_SOURCE,
    assign_stage_from_sort_index,
    clock_time_for_sort_index,
    ensure_dirs,
    video_time_for_sort_index,
)


def file_sort_key(path: Path) -> int:
    m = re.search(r"(\d+)\s*$", path.stem)
    return int(m.group(1)) if m else 0


def main():
    ensure_dirs()
    files = sorted(
        [p for p in PHOTO_SOURCE.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png"}],
        key=file_sort_key,
    )
    sort_indices = [file_sort_key(p) for p in files]
    min_si, max_si = min(sort_indices), max(sort_indices)

    results = {}
    for path in files:
        pid = path.stem
        si = file_sort_key(path)
        stage_id = assign_stage_from_sort_index(si, min_si, max_si)
        video_time = video_time_for_sort_index(si, min_si, max_si)
        clock_time = clock_time_for_sort_index(si, min_si, max_si)

        results[pid] = {
            "filename": path.name,
            "sourcePath": str(path),
            "capturedAt": "",
            "time": clock_time,
            "videoTime": video_time,
            "stageId": stage_id,
            "sortIndex": si,
        }

    out = META_DIR / "exif_times.json"
    out.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(results)} entries (video timeline by sort index) -> {out}")


if __name__ == "__main__":
    main()
