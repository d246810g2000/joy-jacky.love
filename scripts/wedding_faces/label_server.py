#!/usr/bin/env python3
"""Local Flask server for Google Photos-style face labeling UI."""
from __future__ import annotations

import csv
import io
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

import cv2
import numpy as np
from flask import Flask, jsonify, request, send_file

from config import (
    AUTO_THRESHOLD,
    CROPS_DIR,
    DET_SCORE_MIN,
    EMB_DIR,
    META_DIR,
    PHOTO_SOURCE,
    PROJECT_ROOT,
    PUBLIC_GUEST_INDEX,
    SUGGEST_THRESHOLD,
    ensure_dirs,
)

UI_DIR = Path(__file__).parent / "label_ui"

app = Flask(__name__, static_folder=str(UI_DIR), static_url_path="")


@app.after_request
def disable_ui_cache(response):
    if request.path == "/" or request.path.endswith((".js", ".css", ".html")):
        response.headers["Cache-Control"] = "no-store"
    return response


def load_json(path: Path, default=None):
    if not path.exists():
        return default if default is not None else {}
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def stable_extra_id(key: str) -> int:
    """Synthetic searchable id for known_faces people not in the roster."""
    import zlib

    return 100000 + (zlib.adler32(key.encode("utf-8")) % 800000)


def _parse_public_guest_index(path: Path) -> tuple[dict[int, str], list[tuple[str, str, str, int | None]]]:
    """Parse data/publicGuestIndex.ts → (table_names, rows of name/side/relation/table)."""
    text = path.read_text(encoding="utf-8")
    table_names: dict[int, str] = {}
    tables_block = re.search(
        r"PUBLIC_TABLE_NAMES[^=]*=\s*\{(.*?)\};",
        text,
        re.S,
    )
    if tables_block:
        for m in re.finditer(r"(\d+)\s*:\s*'([^']*)'", tables_block.group(1)):
            table_names[int(m.group(1))] = m.group(2)

    rows: list[tuple[str, str, str, int | None]] = []
    rows_block = re.search(
        r"PUBLIC_GUEST_ROWS[^=]*=\s*\[(.*?)\];",
        text,
        re.S,
    )
    block = rows_block.group(1) if rows_block else text
    for m in re.finditer(
        r"\['([^']*)',\s*'([^']*)',\s*'([^']*)',\s*(null|\d+)\]",
        block,
    ):
        table = None if m.group(4) == "null" else int(m.group(4))
        rows.append((m.group(1), m.group(2), m.group(3), table))
    return table_names, rows


def _guest_ids_from_known() -> dict[str, tuple[int, str]]:
    """name → (guestId, knownKey) from existing face bank (preserves guest:N continuity)."""
    known = load_json(META_DIR / "known_faces.json", {})
    by_name: dict[str, tuple[int, str]] = {}
    for key, entry in known.items():
        name = (entry.get("name") or "").strip()
        if not name:
            continue
        guest_id = entry.get("guestId")
        if key.startswith("guest:") and guest_id is not None:
            by_name[name] = (int(guest_id), key)
        elif name not in by_name and guest_id is not None:
            by_name[name] = (int(guest_id), f"guest:{int(guest_id)}")
    return by_name


def load_guests() -> list[dict]:
    """Load searchable roster from publicGuestIndex.ts."""
    guests: list[dict] = []
    if not PUBLIC_GUEST_INDEX.exists():
        return guests

    table_names, rows = _parse_public_guest_index(PUBLIC_GUEST_INDEX)
    known_ids = _guest_ids_from_known()

    for name, side, relation, table in rows:
        name = name.strip()
        if not name:
            continue
        table_label = ""
        if table is not None:
            nice = table_names.get(table)
            table_label = f"{table:02d}. {nice}" if nice else str(table)

        if name in known_ids:
            guest_id, known_key = known_ids[name]
            person_id = guest_id
        else:
            guest_id = None
            known_key = f"name:{name}"
            person_id = stable_extra_id(known_key)

        guests.append(
            {
                "id": person_id,
                "name": name,
                "table": table,
                "side": side.strip(),
                "relation": relation.strip(),
                "tableLabel": table_label,
                "nameType": "guest",
                "source": "roster",
                "companionOfGuestId": None,
                "companionOfName": None,
                "knownKey": known_key,
                # Real known-faces id when available; synthetic search ids stay in "id" only
                "guestId": guest_id,
            }
        )
    return guests


def load_known_extra_people() -> list[dict]:
    """Companions / custom names saved in known_faces (selectable in search)."""
    known = load_json(META_DIR / "known_faces.json", {})
    roster_names = {g["name"] for g in load_guests()}
    people = []
    for key, entry in known.items():
        name = (entry.get("name") or "").strip()
        if not name:
            continue
        # Roster guests already covered by load_guests()
        if name in roster_names:
            continue
        if entry.get("guestId") and key.startswith("guest:"):
            continue
        name_type = entry.get("nameType") or ("companion" if entry.get("companionOfName") else "custom")
        if name_type == "staff":
            continue
        host = (entry.get("companionOfName") or "").strip()
        relation = f"{host} 眷" if host else "自填姓名"
        people.append(
            {
                "id": stable_extra_id(key),
                "name": name,
                "table": entry.get("table"),
                "side": "",
                "relation": relation,
                "tableLabel": "",
                "nameType": name_type,
                "source": "known",
                "companionOfGuestId": entry.get("companionOfGuestId"),
                "companionOfName": entry.get("companionOfName"),
                "knownKey": key,
            }
        )
    people.sort(key=lambda p: p["name"])
    return people


def load_all_people(*, hosts_only: bool = False) -> list[dict]:
    guests = load_guests()
    if hosts_only:
        return guests
    extras = load_known_extra_people()
    # Prefer roster if same display name also exists as guest
    guest_names = {g["name"] for g in guests}
    extras = [p for p in extras if p["name"] not in guest_names]
    return guests + extras


def is_roster_guest(person: dict) -> bool:
    return person.get("source") == "roster" or person.get("nameType") == "guest"


def next_companion_auto_name(host_name: str, host_id=None) -> str:
    """Auto name when companion host is known but personal name is not.

    Format: 「主人 眷」「主人 眷2」…
    """
    host_name = (host_name or "").strip()
    if not host_name:
        return "未命名眷屬"
    known = load_json(META_DIR / "known_faces.json", {})
    existing = set()
    for entry in known.values():
        n = (entry.get("name") or "").strip()
        if not n:
            continue
        same_host = False
        if host_id is not None and entry.get("companionOfGuestId") == host_id:
            same_host = True
        if entry.get("companionOfName") == host_name:
            same_host = True
        if same_host:
            # Compare with/without space before 眷
            existing.add(re.sub(r"\s+眷", "眷", n))

    def label(n: int | None = None) -> str:
        return f"{host_name} 眷" if not n or n == 1 else f"{host_name} 眷{n}"

    base_key = f"{host_name}眷"
    if base_key not in existing:
        return label()
    n = 2
    while f"{host_name}眷{n}" in existing:
        n += 1
    return label(n)


def load_face_embedding(face_id: str) -> np.ndarray | None:
    path = EMB_DIR / f"{face_id}.npy"
    if not path.exists():
        return None
    emb = np.load(path)
    norm = np.linalg.norm(emb)
    if norm <= 0:
        return None
    return emb / norm


def find_face_meta(face_id: str) -> dict | None:
    face_index = load_json(META_DIR / "face_index.json", {})
    for faces in face_index.values():
        for face in faces:
            if face.get("faceId") == face_id:
                return face
    return None


def guest_embedding_scores(face_id: str) -> tuple[dict[int, float], dict[str, float]]:
    """Return (csv_guest_id -> score, knownKey -> score)."""
    emb = load_face_embedding(face_id)
    if emb is None:
        return {}, {}

    known_faces = load_json(META_DIR / "known_faces.json", {})
    by_guest_id: dict[int, float] = {}
    by_key: dict[str, float] = {}
    for key, entry in known_faces.items():
        centroid = None
        cp = entry.get("centroidPath")
        if cp:
            path = PROJECT_ROOT / cp
            if path.exists():
                centroid = np.load(path)
        if centroid is None:
            vecs = []
            for rel in entry.get("embeddings", []):
                path = PROJECT_ROOT / rel if not Path(rel).is_absolute() else Path(rel)
                if not path.exists():
                    path = EMB_DIR / Path(rel).name
                if path.exists():
                    vecs.append(np.load(path))
            if vecs:
                centroid = np.mean(vecs, axis=0)
                norm = np.linalg.norm(centroid)
                if norm > 0:
                    centroid = centroid / norm
        if centroid is None:
            continue

        score = float(np.dot(emb, centroid))
        by_key[key] = max(by_key.get(key, 0.0), score)
        guest_id = entry.get("guestId")
        if guest_id:
            by_guest_id[int(guest_id)] = max(by_guest_id.get(int(guest_id), 0.0), score)
    return by_guest_id, by_key


def known_label_counts() -> tuple[dict[str, int], dict[str, int]]:
    """Return (knownKey -> count, displayName -> count) from face bank embeddings."""
    known = load_json(META_DIR / "known_faces.json", {})
    by_key: dict[str, int] = {}
    by_name: dict[str, int] = {}
    for key, entry in known.items():
        n = len(entry.get("embeddings") or [])
        if n <= 0:
            continue
        by_key[key] = by_key.get(key, 0) + n
        name = (entry.get("name") or "").strip()
        if name:
            by_name[name] = by_name.get(name, 0) + n
    return by_key, by_name


def label_count_for_person(person: dict, by_key: dict[str, int], by_name: dict[str, int]) -> int:
    known_key = person.get("knownKey")
    if known_key and known_key in by_key:
        return int(by_key[known_key])
    return int(by_name.get(person.get("name") or "", 0))


def rank_guests(guests: list[dict], *, face_id: str | None, query: str) -> list[dict]:
    q = query.strip().lower()
    face_meta = find_face_meta(face_id) if face_id else None
    emb_by_id, emb_by_key = guest_embedding_scores(face_id) if face_id else ({}, {})
    by_key_count, by_name_count = known_label_counts()

    suggestion = (face_meta or {}).get("suggestion")
    suggestion_score = float((face_meta or {}).get("suggestionScore") or 0)
    suggestion_guest_id = (face_meta or {}).get("guestId")
    suggestion_name = (face_meta or {}).get("name") or suggestion

    ranked: list[dict] = []
    for guest in guests:
        guest_id = guest["id"]
        known_key = guest.get("knownKey")
        roster_id = guest.get("guestId") if guest.get("guestId") is not None else guest_id
        match_score = (
            emb_by_id.get(roster_id, 0.0)
            if is_roster_guest(guest) and isinstance(roster_id, int) and roster_id < 100000
            else 0.0
        )
        if known_key and known_key in emb_by_key:
            match_score = max(match_score, emb_by_key[known_key])
        if suggestion and guest["name"] == suggestion:
            match_score = max(match_score, suggestion_score)
        if suggestion_name and guest["name"] == suggestion_name:
            match_score = max(match_score, suggestion_score)
        if (
            suggestion_guest_id
            and is_roster_guest(guest)
            and roster_id == suggestion_guest_id
            and suggestion_score
        ):
            match_score = max(match_score, suggestion_score)

        haystack = " ".join(
            [
                guest["name"].lower(),
                str(guest.get("table") or ""),
                guest.get("relation", "").lower(),
                guest.get("side", "").lower(),
                (guest.get("companionOfName") or "").lower(),
            ]
        )
        text_match = bool(q and q in haystack)

        if q and not text_match:
            continue

        label_count = label_count_for_person(guest, by_key_count, by_name_count)
        ranked.append(
            {
                **guest,
                "matchScore": round(match_score, 4),
                "textMatch": text_match,
                "labelCount": label_count,
            }
        )

    if q:
        # 搜尋姓名：優先入庫次數，其次臉部相似度
        ranked.sort(
            key=lambda g: (
                -g.get("labelCount", 0),
                -g["matchScore"],
                0 if is_roster_guest(g) else 1,
                g["name"],
            )
        )
    else:
        # 無搜尋字：先看臉部相似度，再看入庫次數
        ranked.sort(
            key=lambda g: (
                -g["matchScore"],
                -g.get("labelCount", 0),
                0 if is_roster_guest(g) else 1,
                g["name"],
            )
        )

    if not q:
        likely = [g for g in ranked if g["matchScore"] >= 0.45]
        if likely:
            return likely[:20]
        if suggestion:
            by_name = [g for g in ranked if g["name"] == suggestion]
            if by_name:
                return by_name[:20]
        # 手框臉尚無高分時：仍回傳入庫次數最高的前幾名當參考
        if face_id and ranked:
            return ranked[:12]

    return ranked[:20]


def clear_face_label(face: dict) -> None:
    face["name"] = None
    face["guestId"] = None
    face["table"] = None
    face["suggestion"] = None
    face["suggestionScore"] = None
    face["companionOfGuestId"] = None
    face["companionOfName"] = None
    face["nameType"] = None


def build_label_payload(
    *,
    name: str | None,
    guest_id=None,
    table=None,
    companion_of_guest_id=None,
    companion_of_name: str | None = None,
) -> dict:
    payload = {
        "name": name,
        "guestId": guest_id,
        "table": table,
        "companionOfGuestId": companion_of_guest_id,
        "companionOfName": companion_of_name,
    }
    if companion_of_guest_id or companion_of_name:
        payload["nameType"] = "companion"
    elif guest_id:
        payload["nameType"] = "guest"
    elif name:
        payload["nameType"] = "custom"
    else:
        payload["nameType"] = None
    return payload


def apply_label_to_face(face: dict, status: str, label: dict | None = None) -> None:
    label = label or {}
    name = label.get("name")
    if status == "confirmed" and name:
        face["status"] = "confirmed"
        face["name"] = name
        face["guestId"] = label.get("guestId")
        face["table"] = label.get("table")
        face["companionOfGuestId"] = label.get("companionOfGuestId")
        face["companionOfName"] = label.get("companionOfName")
        face["nameType"] = label.get("nameType")
        face["suggestion"] = None
        face["suggestionScore"] = None
    elif status == "not_face":
        face["status"] = "not_face"
        clear_face_label(face)
    elif status == "skipped":
        face["status"] = "skipped"
        clear_face_label(face)
    elif status == "staff":
        face["status"] = "staff"
        face["name"] = "非賓客"
        face["guestId"] = None
        face["table"] = None
        face["companionOfGuestId"] = None
        face["companionOfName"] = None
        face["nameType"] = "staff"
        face["suggestion"] = None
        face["suggestionScore"] = None


def apply_status_to_face(
    face: dict,
    status: str,
    name=None,
    guest_id=None,
    table=None,
    label: dict | None = None,
) -> None:
    if label is None and status == "confirmed" and name:
        label = build_label_payload(name=name, guest_id=guest_id, table=table)
    apply_label_to_face(face, status, label)


def save_cluster_label(cluster_id: str, *, status: str, name=None, guest_id=None, table=None) -> None:
    labels_path = META_DIR / "cluster_labels.csv"
    rows = []
    if labels_path.exists():
        with labels_path.open(encoding="utf-8") as f:
            rows = [r for r in csv.DictReader(f) if r.get("clusterId") != cluster_id]
    rows.append(
        {
            "clusterId": cluster_id,
            "guestId": str(guest_id) if guest_id else "",
            "name": name or "",
            "table": str(table) if table else "",
            "status": status,
        }
    )
    with labels_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["clusterId", "guestId", "name", "table", "status"])
        writer.writeheader()
        writer.writerows(rows)


def apply_status_to_cluster(
    face_index: dict,
    cluster_id: str,
    status: str,
    *,
    name=None,
    guest_id=None,
    table=None,
    label: dict | None = None,
) -> None:
    if label is None and status == "confirmed" and name:
        label = build_label_payload(name=name, guest_id=guest_id, table=table)
    for faces in face_index.values():
        for face in faces:
            if face.get("clusterId") != cluster_id:
                continue
            current = face.get("status", "unknown")
            if status == "confirmed" and current in ("not_face", "skipped", "staff"):
                continue
            if status == "not_face" and current == "confirmed":
                continue
            apply_label_to_face(face, status, label)


def is_visible_face(face: dict) -> bool:
    status = face.get("status", "unknown")
    if status in ("not_face", "skipped", "staff"):
        return False
    if status == "confirmed":
        return True
    det = face.get("detScore")
    if det is not None and det < DET_SCORE_MIN:
        return False
    return True


def is_pending_face(face: dict) -> bool:
    if not is_visible_face(face):
        return False
    return face.get("status", "unknown") in ("unknown", "suggested")


def finalize_photo_faces(faces: list[dict]) -> int:
    """Mark unknown/suggested faces as not_face. Returns cleared count."""
    cleared = 0
    for face in faces:
        current = face.get("status", "unknown")
        if current not in ("unknown", "suggested"):
            continue
        apply_status_to_face(face, "not_face")
        cleared += 1
    return cleared


THUMB_CACHE = PROJECT_ROOT / "data" / "photo_meta" / "thumbs"
_FACE_APP = None


def get_source_path(photo_id: str) -> Path | None:
    exif = load_json(META_DIR / "exif_times.json", {})
    meta = exif.get(photo_id, {})
    src = Path(meta.get("sourcePath", ""))
    if src.exists():
        return src
    fallback = PHOTO_SOURCE / f"{photo_id}.jpg"
    return fallback if fallback.exists() else None


def load_source_image(photo_id: str):
    src = get_source_path(photo_id)
    if not src:
        return None
    return cv2.imread(str(src))


def get_face_app():
    global _FACE_APP
    if _FACE_APP is None:
        from insightface.app import FaceAnalysis

        app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
        app.prepare(ctx_id=-1, det_size=(640, 640))
        _FACE_APP = app
    return _FACE_APP


def next_face_idx(faces: list[dict]) -> int:
    max_idx = -1
    for face in faces:
        idx = face.get("faceIdx")
        if isinstance(idx, int):
            max_idx = max(max_idx, idx)
            continue
        suffix = face.get("faceId", "").rsplit("_", 1)[-1]
        if suffix.isdigit():
            max_idx = max(max_idx, int(suffix))
    return max_idx + 1


def next_cluster_id(cluster_map: dict) -> str:
    max_n = -1
    for cid in cluster_map:
        if cid.startswith("c") and cid[1:].isdigit():
            max_n = max(max_n, int(cid[1:]))
    return f"c{max_n + 1:04d}"


def extract_embedding_from_crop(img: np.ndarray, x1: int, y1: int, x2: int, y2: int):
    """Try InsightFace on padded crop; return (emb, det_score) or (None, None)."""
    h, w = img.shape[:2]
    pad_x = int((x2 - x1) * 0.35)
    pad_y = int((y2 - y1) * 0.35)
    px1 = max(0, x1 - pad_x)
    py1 = max(0, y1 - pad_y)
    px2 = min(w, x2 + pad_x)
    py2 = min(h, y2 + pad_y)
    crop = img[py1:py2, px1:px2]
    if crop.size == 0:
        return None, None
    try:
        faces = get_face_app().get(crop)
        if not faces:
            # fallback: raw crop without padding
            faces = get_face_app().get(img[y1:y2, x1:x2])
        if not faces:
            return None, None
        best = max(faces, key=lambda f: float(f.det_score or 0))
        if best.embedding is None:
            return None, float(best.det_score or 0)
        emb = best.embedding / np.linalg.norm(best.embedding)
        return emb, float(best.det_score or 0.99)
    except Exception:
        return None, None


def best_known_match(emb: np.ndarray) -> tuple[float, dict | None, str | None]:
    """Return (score, known_faces entry, knownKey)."""
    known_faces = load_json(META_DIR / "known_faces.json", {})
    best_score = 0.0
    best_entry = None
    best_key = None
    for key, entry in known_faces.items():
        if not entry.get("name"):
            continue
        centroid = None
        cp = entry.get("centroidPath")
        if cp:
            path = PROJECT_ROOT / cp
            if path.exists():
                centroid = np.load(path)
        if centroid is None:
            vecs = []
            for rel in entry.get("embeddings", []):
                path = PROJECT_ROOT / rel if not Path(rel).is_absolute() else Path(rel)
                if not path.exists():
                    path = EMB_DIR / Path(rel).name
                if path.exists():
                    vecs.append(np.load(path))
            if vecs:
                centroid = np.mean(vecs, axis=0)
                norm = np.linalg.norm(centroid)
                if norm > 0:
                    centroid = centroid / norm
        if centroid is None:
            continue
        score = float(np.dot(emb, centroid))
        if score > best_score:
            best_score = score
            best_entry = entry
            best_key = key
    return best_score, best_entry, best_key


def apply_suggestion_from_known(face: dict, emb: np.ndarray) -> None:
    score, entry, _key = best_known_match(emb)
    if not entry or score < SUGGEST_THRESHOLD:
        return
    face["suggestion"] = entry.get("name")
    face["suggestionScore"] = round(score, 4)
    face["guestId"] = entry.get("guestId")
    face["table"] = entry.get("table")
    face["companionOfGuestId"] = entry.get("companionOfGuestId")
    face["companionOfName"] = entry.get("companionOfName")
    face["nameType"] = entry.get("nameType")
    face["status"] = "suggested"
    # 很高相似度時仍只建議、不自動確認（手框需人工點一次）
    if score >= AUTO_THRESHOLD:
        face["suggestionScore"] = round(score, 4)


def add_manual_face(photo_id: str, box_norm: list[float]) -> dict:
    if len(box_norm) != 4:
        raise ValueError("box must be [x, y, w, h]")
    bx, by, bw, bh = box_norm
    if bw < 0.02 or bh < 0.02:
        raise ValueError("框選範圍太小")

    img = load_source_image(photo_id)
    if img is None:
        raise ValueError("找不到原始照片")

    h, w = img.shape[:2]
    x1 = max(0, int(bx * w))
    y1 = max(0, int(by * h))
    x2 = min(w, int((bx + bw) * w))
    y2 = min(h, int((by + bh) * h))
    if x2 <= x1 or y2 <= y1:
        raise ValueError("無效的框選範圍")

    crop = img[y1:y2, x1:x2]
    emb, det_score = extract_embedding_from_crop(img, x1, y1, x2, y2)
    if det_score is None:
        det_score = 0.99

    face_index = load_json(META_DIR / "face_index.json", {})
    cluster_map = load_json(META_DIR / "cluster_map.json", {})
    photo_faces = face_index.setdefault(photo_id, [])

    face_idx = next_face_idx(photo_faces)
    face_id = f"{photo_id}_{face_idx}"
    # 手框一律新 cluster：只做「可能是誰」建議，不併群，避免同張兩人被套成同一人
    cluster_id = next_cluster_id(cluster_map)

    crop_path = CROPS_DIR / f"{face_id}.jpg"
    cv2.imwrite(str(crop_path), crop, [cv2.IMWRITE_JPEG_QUALITY, 85])

    if emb is not None:
        np.save(EMB_DIR / f"{face_id}.npy", emb)

    face = {
        "faceId": face_id,
        "photoId": photo_id,
        "faceIdx": face_idx,
        "detScore": float(det_score),
        "box": [x1 / w, y1 / h, (x2 - x1) / w, (y2 - y1) / h],
        "status": "unknown",
        "name": None,
        "guestId": None,
        "table": None,
        "suggestion": None,
        "suggestionScore": None,
        "companionOfGuestId": None,
        "companionOfName": None,
        "nameType": None,
        "clusterId": cluster_id,
        "manual": True,
    }

    if emb is not None:
        apply_suggestion_from_known(face, emb)

    photo_faces.append(face)
    cluster_map.setdefault(cluster_id, []).append(face_id)

    save_json(META_DIR / "face_index.json", face_index)
    save_json(META_DIR / "cluster_map.json", cluster_map)
    return face


def get_thumb_path(photo_id: str) -> Path:
    THUMB_CACHE.mkdir(parents=True, exist_ok=True)
    out = THUMB_CACHE / f"{photo_id}.jpg"
    if out.exists():
        return out
    exif = load_json(META_DIR / "exif_times.json", {})
    meta = exif.get(photo_id, {})
    src = Path(meta.get("sourcePath", ""))
    if not src.exists():
        src = PHOTO_SOURCE / f"{photo_id}.jpg"
    if not src.exists():
        return out
    img = cv2.imread(str(src))
    if img is None:
        return out
    h, w = img.shape[:2]
    max_side = 1600
    if max(h, w) > max_side:
        scale = max_side / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)))
    cv2.imwrite(str(out), img, [cv2.IMWRITE_JPEG_QUALITY, 88])
    return out


@app.route("/")
def index():
    return send_file(UI_DIR / "index.html")


@app.route("/api/guests")
def api_guests():
    q = request.args.get("q", "").strip()
    face_id = request.args.get("faceId", "").strip() or None
    hosts_only = request.args.get("hostsOnly", "").strip() in {"1", "true", "yes"}
    guests = load_all_people(hosts_only=hosts_only)
    return jsonify(rank_guests(guests, face_id=face_id, query=q))


@app.route("/api/progress")
def api_progress():
    return jsonify(load_json(META_DIR / "label_progress.json", {}))


@app.route("/api/clusters")
def api_clusters():
    cluster_map = load_json(META_DIR / "cluster_map.json", {})
    cluster_labels = {}
    labels_path = META_DIR / "cluster_labels.csv"
    if labels_path.exists():
        with labels_path.open(encoding="utf-8") as f:
            for row in csv.DictReader(f):
                cluster_labels[row["clusterId"]] = row

    items = []
    for cid, face_ids in cluster_map.items():
        sample = face_ids[0] if face_ids else None
        crop_url = f"/api/crop/{sample}" if sample else None
        items.append(
            {
                "clusterId": cid,
                "count": len(face_ids),
                "sampleFaceId": sample,
                "cropUrl": crop_url,
                "labeled": cid in cluster_labels,
                "name": cluster_labels.get(cid, {}).get("name"),
                "status": cluster_labels.get(cid, {}).get("status"),
            }
        )
    items.sort(key=lambda x: -x["count"])
    return jsonify(items[:200])


@app.route("/api/photos")
def api_photos():
    mode = request.args.get("mode", "pending")
    exif = load_json(META_DIR / "exif_times.json", {})
    face_index = load_json(META_DIR / "face_index.json", {})

    photos = []
    for pid, meta in sorted(exif.items(), key=lambda x: x[1].get("sortIndex", 0)):
        faces = face_index.get(pid, [])
        visible = [f for f in faces if is_visible_face(f)]
        has_pending = any(is_pending_face(f) for f in faces)
        if mode == "pending" and not has_pending:
            continue
        if mode == "labeled" and has_pending:
            continue
        confirmed = sum(1 for f in visible if f.get("status") == "confirmed")
        photos.append(
            {
                "id": pid,
                "time": meta.get("time"),
                "stageId": meta.get("stageId"),
                "faceCount": len(visible),
                "confirmedCount": confirmed,
                "hasPending": has_pending,
            }
        )
    return jsonify(photos)


@app.route("/api/photo/<photo_id>")
def api_photo(photo_id: str):
    exif = load_json(META_DIR / "exif_times.json", {})
    face_index = load_json(META_DIR / "face_index.json", {})
    meta = exif.get(photo_id, {})
    faces = [f for f in face_index.get(photo_id, []) if is_visible_face(f)]
    return jsonify(
        {
            "id": photo_id,
            "time": meta.get("time"),
            "stageId": meta.get("stageId"),
            "imageUrl": f"/api/image/{photo_id}",
            "faces": [
                {
                    **f,
                    "cropUrl": f"/api/crop/{f['faceId']}",
                }
                for f in faces
            ],
        }
    )


@app.route("/api/image/<photo_id>")
def api_image(photo_id: str):
    thumb = get_thumb_path(photo_id)
    if thumb.exists():
        return send_file(thumb, mimetype="image/jpeg")
    return ("Not found", 404)


@app.route("/api/crop/<face_id>")
def api_crop(face_id: str):
    path = CROPS_DIR / f"{face_id}.jpg"
    if path.exists():
        return send_file(path, mimetype="image/jpeg")
    return ("Not found", 404)


@app.route("/api/face/<face_id>/confirm-suggestion", methods=["POST"])
def api_confirm_suggestion(face_id: str):
    face_index = load_json(META_DIR / "face_index.json", {})
    for _pid, faces in face_index.items():
        for face in faces:
            if face["faceId"] == face_id and face.get("suggestion"):
                return api_label_face_impl(
                    face_id,
                    {
                        "name": face["suggestion"],
                        "guestId": face.get("guestId"),
                        "table": face.get("table"),
                        "applyCluster": True,
                        "status": "confirmed",
                        "autoPropagate": True,
                    },
                )
    return jsonify({"ok": False}), 404


def api_label_face_impl(face_id: str, data: dict):
    name = data.get("name")
    guest_id = data.get("guestId")
    table = data.get("table")
    companion_of_guest_id = data.get("companionOfGuestId")
    companion_of_name = data.get("companionOfName")
    name_type = data.get("nameType")
    apply_cluster = data.get("applyCluster", True)
    status = data.get("status", "confirmed")
    allowed = {"confirmed", "not_face", "skipped", "staff"}
    if status not in allowed:
        return jsonify({"ok": False, "error": f"invalid status: {status}"}), 400

    if companion_of_guest_id and not companion_of_name:
        for guest in load_guests():
            if guest["id"] == companion_of_guest_id:
                companion_of_name = guest["name"]
                if table is None:
                    table = guest.get("table")
                break

    # Unknown companion name → auto 「某某 眷」
    if status == "confirmed" and (companion_of_guest_id or companion_of_name):
        if not (name or "").strip():
            name = next_companion_auto_name(companion_of_name or "", companion_of_guest_id)
            name_type = "companion"
        elif not name_type:
            name_type = "companion"

    label = build_label_payload(
        name=name,
        guest_id=guest_id,
        table=table,
        companion_of_guest_id=companion_of_guest_id,
        companion_of_name=companion_of_name,
    )
    if name_type:
        label["nameType"] = name_type

    # Synthetic search ids must not be persisted as CSV guestId
    if guest_id is not None and int(guest_id) >= 100000:
        label["guestId"] = None
        guest_id = None
        if label.get("nameType") == "guest":
            label["nameType"] = name_type or "custom"

    face_index = load_json(META_DIR / "face_index.json", {})
    known_faces = load_json(META_DIR / "known_faces.json", {})
    cluster_id = None
    updated_face = None

    for faces in face_index.values():
        for face in faces:
            if face["faceId"] == face_id:
                cluster_id = face.get("clusterId")
                apply_label_to_face(face, status, label if status == "confirmed" else None)
                updated_face = face
                break

    if status == "confirmed" and name and cluster_id:
        save_cluster_label(
            cluster_id,
            status="confirmed",
            name=name,
            guest_id=guest_id,
            table=table,
        )
        if apply_cluster:
            apply_status_to_cluster(
                face_index,
                cluster_id,
                "confirmed",
                label=label,
            )

        key = f"guest:{guest_id}" if guest_id else f"name:{name}"
        emb_path = EMB_DIR / f"{face_id}.npy"
        rel_emb = str(emb_path.relative_to(PROJECT_ROOT))
        if key not in known_faces:
            known_faces[key] = {
                "guestId": guest_id,
                "name": name,
                "table": table,
                "companionOfGuestId": companion_of_guest_id,
                "companionOfName": companion_of_name,
                "nameType": label.get("nameType"),
                "embeddings": [],
                "sourceClusterId": cluster_id,
                "confirmedAt": datetime.now(timezone.utc).isoformat(),
            }
        if rel_emb not in known_faces[key]["embeddings"]:
            known_faces[key]["embeddings"].append(rel_emb)

    elif status == "not_face":
        # Skip / not interested: only this face. No cluster inheritance, no special meaning.
        pass
    save_json(META_DIR / "face_index.json", face_index)
    save_json(META_DIR / "known_faces.json", known_faces)

    if data.get("autoPropagate", True) and status == "confirmed":
        subprocess.run(
            [sys.executable, str(Path(__file__).parent / "propagate_labels.py")],
            check=False,
        )

    progress = load_json(META_DIR / "label_progress.json", {})
    if updated_face is None:
        return jsonify({"ok": False, "error": f"face not found: {face_id}"}), 404
    return jsonify(
        {
            "ok": True,
            "progress": progress,
            "face": {
                "faceId": face_id,
                "status": updated_face.get("status"),
                "name": updated_face.get("name"),
                "companionOfName": updated_face.get("companionOfName"),
            },
        }
    )


@app.route("/api/face/<face_id>/label", methods=["POST"])
def api_label_face(face_id: str):
    data = request.json or {}
    return api_label_face_impl(face_id, data)


@app.route("/api/photo/<photo_id>/faces", methods=["POST"])
def api_add_manual_face(photo_id: str):
    data = request.json or {}
    box = data.get("box")
    if not isinstance(box, list) or len(box) != 4:
        return jsonify({"ok": False, "error": "需要 box: [x, y, w, h]（0–1 相對座標）"}), 400
    try:
        box_norm = [float(v) for v in box]
        face = add_manual_face(photo_id, box_norm)
    except ValueError as exc:
        return jsonify({"ok": False, "error": str(exc)}), 400
    except Exception as exc:
        return jsonify({"ok": False, "error": f"新增失敗: {exc}"}), 500

    return jsonify(
        {
            "ok": True,
            "face": {
                **face,
                "cropUrl": f"/api/crop/{face['faceId']}",
            },
        }
    )


@app.route("/api/photo/<photo_id>/finalize", methods=["POST"])
def api_finalize_photo(photo_id: str):
    """Mark remaining unnamed faces as not_face so the photo becomes labeled."""
    face_index = load_json(META_DIR / "face_index.json", {})
    faces = face_index.get(photo_id)
    if faces is None:
        return jsonify({"ok": False, "error": f"photo not found: {photo_id}"}), 404

    cleared = finalize_photo_faces(faces)
    if cleared:
        save_json(META_DIR / "face_index.json", face_index)

    progress = load_json(META_DIR / "label_progress.json", {})
    return jsonify(
        {
            "ok": True,
            "cleared": cleared,
            "photoId": photo_id,
            "progress": progress,
        }
    )


@app.route("/api/photo/<photo_id>/repredict", methods=["POST"])
def api_repredict_photo(photo_id: str):
    """Reset dismiss/pending faces on this photo, then re-apply cluster + auto naming."""
    try:
        from propagate_labels import repredict_photo

        progress = repredict_photo(photo_id)
    except KeyError as exc:
        return jsonify({"ok": False, "error": str(exc)}), 404
    except Exception as exc:
        return jsonify({"ok": False, "error": str(exc)}), 500

    return jsonify({"ok": True, "photoId": photo_id, "progress": progress})


@app.route("/api/propagate", methods=["POST"])
def api_propagate():
    result = subprocess.run(
        [sys.executable, str(Path(__file__).parent / "propagate_labels.py")],
        capture_output=True,
        text=True,
    )
    progress = load_json(META_DIR / "label_progress.json", {})
    return jsonify({"ok": result.returncode == 0, "progress": progress, "log": result.stdout})


def main():
    ensure_dirs()
    if not (META_DIR / "face_index.json").exists():
        print("Warning: face_index.json not found. Run detect_and_cluster.py first.")
    print("Face Label UI: http://localhost:8765")
    app.run(host="0.0.0.0", port=8765, debug=False)


if __name__ == "__main__":
    main()
