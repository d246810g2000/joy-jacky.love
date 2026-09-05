#!/usr/bin/env python3
"""Upload wedding photos to Cloudinary (resume-safe)."""
from __future__ import annotations

import argparse
import json
import os
import sys
import tempfile
import time
from pathlib import Path

from config import CLOUDINARY_FOLDER, CLOUDINARY_MAP, PHOTOS_JSON, ensure_dirs

# Cloudinary direct upload limit is 10MB on most plans.
MAX_UPLOAD_BYTES = 10 * 1024 * 1024 - 64 * 1024


def load_json(path: Path, default=None):
    if not path.exists():
        return default if default is not None else {}
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def iter_photos(manifest: dict, labeled_only: bool):
    seen: set[str] = set()
    for stage in manifest.get("stages", []):
        for photo in stage.get("photos", []):
            if labeled_only and not photo.get("names"):
                continue
            if photo["id"] in seen:
                continue
            seen.add(photo["id"])
            yield photo


def prepare_upload_file(src: Path) -> tuple[Path, Path | None]:
    """Return upload path; compress to a temp JPEG if the source exceeds Cloudinary limits."""
    if src.stat().st_size <= MAX_UPLOAD_BYTES:
        return src, None

    from PIL import Image

    img = Image.open(src)
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")

    tmp = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
    tmp_path = Path(tmp.name)
    tmp.close()

    original_size = src.stat().st_size
    for quality in (92, 88, 85, 80, 75, 70, 65, 60, 55, 50):
        img.save(tmp_path, format="JPEG", quality=quality, optimize=True)
        if tmp_path.stat().st_size <= MAX_UPLOAD_BYTES:
            print(
                f"  compressed {src.name}: {original_size} -> {tmp_path.stat().st_size} bytes (q={quality})",
                flush=True,
            )
            return tmp_path, tmp_path

    w, h = img.size
    for scale in (0.9, 0.8, 0.7, 0.6, 0.5):
        resized = img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
        resized.save(tmp_path, format="JPEG", quality=80, optimize=True)
        if tmp_path.stat().st_size <= MAX_UPLOAD_BYTES:
            print(
                f"  compressed {src.name}: {original_size} -> {tmp_path.stat().st_size} bytes (scale={scale})",
                flush=True,
            )
            return tmp_path, tmp_path

    raise RuntimeError(f"Could not compress {src} below {MAX_UPLOAD_BYTES} bytes")


def main():
    parser = argparse.ArgumentParser(description="Upload wedding photos to Cloudinary")
    parser.add_argument("--labeled-only", action="store_true", default=True, help="Only photos with names (default)")
    parser.add_argument("--all", dest="labeled_only", action="store_false", help="Upload every photo in manifest")
    parser.add_argument("--limit", type=int, default=0, help="Max uploads this run (0 = no limit)")
    parser.add_argument("--dry-run", action="store_true", help="List what would upload, no API calls")
    args = parser.parse_args()

    ensure_dirs()
    if not PHOTOS_JSON.exists():
        print(f"Missing {PHOTOS_JSON}; run build_photos_manifest.py first", file=sys.stderr)
        sys.exit(1)

    manifest = load_json(PHOTOS_JSON)
    cmap = load_json(CLOUDINARY_MAP, {})

    candidates = list(iter_photos(manifest, args.labeled_only))
    pending = [p for p in candidates if p["id"] not in cmap]

    print(f"Manifest: {len(candidates)} photos ({'labeled only' if args.labeled_only else 'all'})")
    print(f"Already uploaded: {len(cmap)}, pending: {len(pending)}")

    if args.dry_run:
        for p in pending[:20]:
            print(f"  would upload {p['id']} -> {p.get('publicId', CLOUDINARY_FOLDER + '/' + p['id'])}")
        if len(pending) > 20:
            print(f"  ... and {len(pending) - 20} more")
        return

    if not pending:
        print("Nothing to upload.")
        return

    if not os.environ.get("CLOUDINARY_URL") and not (
        os.environ.get("CLOUDINARY_CLOUD_NAME")
        and os.environ.get("CLOUDINARY_API_KEY")
        and os.environ.get("CLOUDINARY_API_SECRET")
    ):
        print("Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET", file=sys.stderr)
        sys.exit(1)

    import cloudinary
    import cloudinary.uploader

    cloudinary.config(secure=True)

    uploaded = 0
    errors = 0
    for photo in pending:
        if args.limit and uploaded >= args.limit:
            break

        pid = photo["id"]
        src = Path(photo.get("sourcePath") or "")
        if not src.is_file():
            print(f"SKIP {pid}: missing file {src}")
            errors += 1
            continue

        public_id = photo.get("publicId") or f"{CLOUDINARY_FOLDER}/{pid}"
        upload_path = src
        temp_path: Path | None = None
        try:
            upload_path, temp_path = prepare_upload_file(src)
            result = cloudinary.uploader.upload(
                str(upload_path),
                public_id=public_id,
                folder=None,
                overwrite=True,
                resource_type="image",
            )
            cmap[pid] = {
                "publicId": result.get("public_id", public_id),
                "version": result.get("version"),
                "bytes": result.get("bytes"),
                "width": result.get("width"),
                "height": result.get("height"),
                "uploadedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "compressed": temp_path is not None,
            }
            save_json(CLOUDINARY_MAP, cmap)
            uploaded += 1
            print(f"[{uploaded}/{len(pending)}] {pid} -> {cmap[pid]['publicId']}", flush=True)
        except Exception as exc:
            errors += 1
            print(f"ERROR {pid}: {exc}", file=sys.stderr, flush=True)
        finally:
            if temp_path and temp_path.exists():
                temp_path.unlink()

    print(f"Done. uploaded={uploaded}, errors={errors}, total in map={len(cmap)}")


if __name__ == "__main__":
    main()
