#!/usr/bin/env python3
"""Extract EXIF capture times and assign wedding video timeline stages."""
from __future__ import annotations

import json
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path

from PIL import Image
from PIL.ExifTags import IFD

from config import (
    META_DIR,
    PHOTO_SOURCE,
    assign_stage_from_sort_index,
    clock_time_for_sort_index,
    ensure_dirs,
    video_time_for_sort_index,
)

TW = timezone(timedelta(hours=8))


def file_sort_key(path: Path) -> int:
    m = re.search(r"(\d+)\s*$", path.stem)
    return int(m.group(1)) if m else 0


def read_captured_at(path: Path) -> datetime | None:
    """Return DateTimeOriginal (with subseconds/offset when present)."""
    try:
        img = Image.open(path)
        exif = img.getexif()
        if not exif:
            return None
        exif_ifd = exif.get_ifd(IFD.Exif)
        raw = exif_ifd.get(36867) or exif.get(306)  # DateTimeOriginal / DateTime
        if not raw:
            return None
        dt = datetime.strptime(str(raw), "%Y:%m:%d %H:%M:%S")
        sub = exif_ifd.get(37521)  # SubsecTimeOriginal
        if sub:
            try:
                frac = int(str(sub).ljust(6, "0")[:6])
                dt = dt.replace(microsecond=frac)
            except ValueError:
                pass
        off = exif_ifd.get(36881)  # OffsetTimeOriginal e.g. +08:00
        if off and re.fullmatch(r"[+-]\d{2}:\d{2}", str(off)):
            sign = 1 if str(off)[0] == "+" else -1
            hh, mm = map(int, str(off)[1:].split(":"))
            dt = dt.replace(tzinfo=timezone(sign * timedelta(hours=hh, minutes=mm)))
        else:
            dt = dt.replace(tzinfo=TW)
        return dt
    except Exception:
        return None


def format_display_time(dt: datetime) -> str:
    return f"{dt.hour}:{dt.minute:02d}"


def main():
    ensure_dirs()
    files = sorted(
        [p for p in PHOTO_SOURCE.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png"}],
        key=file_sort_key,
    )
    sort_indices = [file_sort_key(p) for p in files]
    min_si, max_si = min(sort_indices), max(sort_indices)

    results = {}
    missing_exif = 0
    for path in files:
        pid = path.stem
        si = file_sort_key(path)
        stage_id = assign_stage_from_sort_index(si, min_si, max_si)
        video_time = video_time_for_sort_index(si, min_si, max_si)
        captured = read_captured_at(path)
        if captured:
            clock_time = format_display_time(captured)
            captured_at = captured.isoformat()
        else:
            missing_exif += 1
            clock_time = clock_time_for_sort_index(si, min_si, max_si)
            captured_at = ""

        results[pid] = {
            "filename": path.name,
            "sourcePath": str(path),
            "capturedAt": captured_at,
            "time": clock_time,
            "videoTime": video_time,
            "stageId": stage_id,
            "sortIndex": si,
        }

    out = META_DIR / "exif_times.json"
    out.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(results)} entries -> {out}")
    print(f"EXIF capturedAt: {len(results) - missing_exif}/{len(results)}")
    if missing_exif:
        print(f"Missing EXIF (fell back to stage interpolation): {missing_exif}")


if __name__ == "__main__":
    main()
