#!/usr/bin/env python3
"""Normalize companion labels to 「主人 眷」/「主人 眷2」 form across meta + site data."""

from __future__ import annotations

import json
import re
from pathlib import Path

from config import META_DIR, PROJECT_ROOT, PUBLIC_GUEST_INDEX, WEDDING_PHOTOS_TS

# 「某某眷」「某某眷2」→「某某 眷」「某某 眷2」；已有空格則正規化空白
COMPANION_LABEL = re.compile(r"^(.*?)眷(\d*)$")
SKIP_SUBSTRINGS = ("眷屬",)


def normalize_companion_label(value: str) -> str:
    text = (value or "").strip()
    if not text:
        return text
    if any(token in text for token in SKIP_SUBSTRINGS):
        return text
    match = COMPANION_LABEL.match(text)
    if not match:
        return text
    host = match.group(1).rstrip()
    suffix = match.group(2)
    if len(host) < 2:
        return text
    return f"{host} 眷{suffix}"


def rewrite_string(value: str) -> str:
    return normalize_companion_label(value)


def rewrite_obj(node):
    if isinstance(node, dict):
        out = {}
        for key, value in node.items():
            new_key = rewrite_string(key) if isinstance(key, str) else key
            if key == "centroidPath" and isinstance(value, str):
                out[new_key] = _rewrite_centroid_path(value)
            else:
                out[new_key] = rewrite_obj(value)
        return out
    if isinstance(node, list):
        return [rewrite_obj(item) for item in node]
    if isinstance(node, str):
        return rewrite_string(node)
    return node


def _rewrite_centroid_path(path: str) -> str:
    name = Path(path).name
    match = re.match(r"^(name_)(.+)(_centroid\.npy)$", name)
    if not match:
        return path
    new_mid = normalize_companion_label(match.group(2))
    if new_mid == match.group(2):
        return path
    new_name = f"{match.group(1)}{new_mid}{match.group(3)}"
    new_rel = str(Path(path).with_name(new_name))
    old_file = PROJECT_ROOT / path
    new_file = PROJECT_ROOT / new_rel
    if old_file.exists() and old_file.resolve() != new_file.resolve():
        if new_file.exists():
            old_file.unlink()
        else:
            old_file.rename(new_file)
    return new_rel


def rewrite_json_file(path: Path) -> int:
    raw = path.read_text(encoding="utf-8")
    data = json.loads(raw)
    rewritten = rewrite_obj(data)
    path.write_text(
        json.dumps(rewritten, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    before = set(COMPANION_LABEL.findall(raw))
    after = path.read_text(encoding="utf-8")
    # count remaining unspaced labels of form X眷 (no space before 眷)
    remaining = re.findall(r"(?<!\s)眷\d*", after)
    # Rough: strings that still look unspaced companion names
    unspaced = [
        m.group(0)
        for m in re.finditer(r"[\u4e00-\u9fffA-Za-z0-9]{2,}眷\d*", after)
        if "眷屬" not in m.group(0)
    ]
    print(f"  {path.relative_to(PROJECT_ROOT)}: unspaced left={len(set(unspaced))}")
    return len(set(unspaced))


def rewrite_ts_string_literals(path: Path) -> None:
    text = path.read_text(encoding="utf-8")

    def repl(match: re.Match[str]) -> str:
        quote = match.group(1)
        inner = match.group(2)
        return f"{quote}{normalize_companion_label(inner)}{quote}"

    # Only rewrite string literals that are companion-like labels
    updated = re.sub(
        r"(['\"])([^'\"\n]*眷\d*)\1",
        repl,
        text,
    )
    path.write_text(updated, encoding="utf-8")
    unspaced = [
        m.group(0)
        for m in re.finditer(r"[\u4e00-\u9fffA-Za-z0-9]{2,}眷\d*", path.read_text(encoding="utf-8"))
        if "眷屬" not in m.group(0)
    ]
    print(f"  {path.relative_to(PROJECT_ROOT)}: unspaced left={len(set(unspaced))}")


def main() -> None:
    print("Normalizing companion labels → 「主人 眷」")
    json_files = [
        META_DIR / "known_faces.json",
        META_DIR / "photo_names.json",
        META_DIR / "face_index.json",
        META_DIR / "prune_known_faces_report.json",
        META_DIR / "optimize_report_opening_mermaid.json",
        PROJECT_ROOT / "data" / "photos.json",
    ]
    for path in json_files:
        if path.exists():
            rewrite_json_file(path)

    for path in [
        WEDDING_PHOTOS_TS,
        PUBLIC_GUEST_INDEX,
        PROJECT_ROOT / "data" / "companionIndex.ts",
    ]:
        if path.exists():
            rewrite_ts_string_literals(path)

    # Rebuild companion index from normalized sources
    from generate_companion_index import main as regen_index

    regen_index()
    print("Done.")


if __name__ == "__main__":
    main()
