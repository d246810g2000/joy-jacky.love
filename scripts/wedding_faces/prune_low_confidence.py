#!/usr/bin/env python3
"""Mark low-confidence detections as not_face so they stay out of the labeling UI."""
from __future__ import annotations

import json
from pathlib import Path

from config import DET_SCORE_MIN, META_DIR, ensure_dirs


def main():
    ensure_dirs()
    path = META_DIR / "face_index.json"
    face_index = json.loads(path.read_text(encoding="utf-8"))
    changed = 0

    for faces in face_index.values():
        for face in faces:
            if face.get("status") not in (None, "unknown", "suggested"):
                continue
            det = face.get("detScore")
            if det is None or det >= DET_SCORE_MIN:
                continue
            face["status"] = "not_face"
            face["name"] = None
            face["guestId"] = None
            face["table"] = None
            face["suggestion"] = None
            face["suggestionScore"] = None
            changed += 1

    path.write_text(json.dumps(face_index, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Marked {changed} low-confidence faces as not_face (threshold={DET_SCORE_MIN})")


if __name__ == "__main__":
    main()
