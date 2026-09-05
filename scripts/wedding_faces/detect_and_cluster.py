#!/usr/bin/env python3
"""Detect faces, extract embeddings, cluster into anonymous person groups."""
from __future__ import annotations

import json
import sys
from pathlib import Path

import cv2
import numpy as np
from sklearn.cluster import AgglomerativeClustering

from config import CROPS_DIR, EMB_DIR, META_DIR, PHOTO_SOURCE, ensure_dirs, DET_SCORE_MIN


def load_face_app():
    from insightface.app import FaceAnalysis

    app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
    app.prepare(ctx_id=-1, det_size=(640, 640))
    return app


def photo_files():
    files = [p for p in PHOTO_SOURCE.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png"}]
    return sorted(files, key=lambda p: int("".join(filter(str.isdigit, p.stem)) or 0))


def resize_for_detect(img: np.ndarray, max_side: int = 1600) -> tuple[np.ndarray, float]:
    h, w = img.shape[:2]
    if max(h, w) <= max_side:
        return img, 1.0
    scale = max_side / max(h, w)
    return cv2.resize(img, (int(w * scale), int(h * scale))), scale


def main():
    ensure_dirs()
    app = load_face_app()
    files = photo_files()
    print(f"Processing {len(files)} photos from {PHOTO_SOURCE}")

    face_index: dict = {}
    all_embeddings: list[np.ndarray] = []
    all_meta: list[dict] = []

    for idx, path in enumerate(files):
        pid = path.stem
        if (idx + 1) % 25 == 0 or idx == 0:
            print(f"  [{idx + 1}/{len(files)}] {path.name}")

        img = cv2.imread(str(path))
        if img is None:
            continue

        img_small, scale = resize_for_detect(img)
        faces = app.get(img_small)

        photo_faces = []
        for face_idx, face in enumerate(faces):
            if face.det_score is None or face.det_score < DET_SCORE_MIN:
                continue
            emb = face.embedding
            if emb is None:
                continue

            emb = emb / np.linalg.norm(emb)
            face_id = f"{pid}_{face_idx}"
            emb_path = EMB_DIR / f"{face_id}.npy"
            np.save(emb_path, emb)

            x1, y1, x2, y2 = face.bbox
            if scale != 1.0:
                x1, y1, x2, y2 = x1 / scale, y1 / scale, x2 / scale, y2 / scale
            h, w = img.shape[:2]
            x1, y1 = max(0, int(x1)), max(0, int(y1))
            x2, y2 = min(w, int(x2)), min(h, int(y2))
            crop = img[y1:y2, x1:x2]
            if crop.size == 0:
                continue

            crop_path = CROPS_DIR / f"{face_id}.jpg"
            cv2.imwrite(str(crop_path), crop, [cv2.IMWRITE_JPEG_QUALITY, 85])

            box_norm = [x1 / w, y1 / h, (x2 - x1) / w, (y2 - y1) / h]
            meta = {
                "faceId": face_id,
                "photoId": pid,
                "faceIdx": face_idx,
                "detScore": float(face.det_score),
                "box": box_norm,
                "status": "unknown",
                "name": None,
                "guestId": None,
                "table": None,
                "suggestion": None,
                "suggestionScore": None,
            }
            photo_faces.append(meta)
            all_embeddings.append(emb)
            all_meta.append(meta)

        if photo_faces:
            face_index[pid] = photo_faces

    print(f"Detected {len(all_meta)} faces across {len(face_index)} photos")

    if len(all_embeddings) < 2:
        print("Not enough faces to cluster.")
        sys.exit(1)

    X = np.vstack(all_embeddings)
    clustering = AgglomerativeClustering(
        n_clusters=None,
        distance_threshold=0.45,
        metric="cosine",
        linkage="average",
    )
    labels = clustering.fit_predict(X)

    cluster_map: dict[str, list] = {}
    for meta, label in zip(all_meta, labels):
        cid = f"c{label:04d}"
        meta["clusterId"] = cid
        cluster_map.setdefault(cid, []).append(meta["faceId"])

    (META_DIR / "face_index.json").write_text(
        json.dumps(face_index, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (META_DIR / "cluster_map.json").write_text(
        json.dumps(cluster_map, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    if not (META_DIR / "known_faces.json").exists():
        (META_DIR / "known_faces.json").write_text("{}", encoding="utf-8")
    if not (META_DIR / "cluster_labels.csv").exists():
        (META_DIR / "cluster_labels.csv").write_text(
            "clusterId,guestId,name,table,status\n", encoding="utf-8"
        )

    print(f"Clusters: {len(cluster_map)}")
    print("Done.")


if __name__ == "__main__":
    main()
