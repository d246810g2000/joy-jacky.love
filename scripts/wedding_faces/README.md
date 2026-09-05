# 婚禮人臉標記工具（第一階段）

本地可疊代的人臉辨識 + Google 相簿風格標記 UI。

## 快速開始

```bash
cd scripts/wedding_faces
source .venv/bin/activate

# 一次性初始化（EXIF + 人臉偵測 + 聚類，約 1–2 小時）
./run_phase1.sh

# 或分步執行：
python extract_exif.py
python detect_and_cluster.py
python propagate_labels.py
python build_photos_manifest.py

# 啟動標記 UI
python label_server.py
# 瀏覽器開 http://localhost:8765
```

## 標記 UI 操作

- **點臉框** → 搜尋姓名 → 確認（可勾選「套用到同群所有臉孔」）
- **← →** 切換照片（優先「待標記」模式）
- **擴散 (P)** → 將已確認的臉擴散到全部 643 張
- 建議流程：先標新人/父母 → 按擴散 → 再標高頻 cluster

## 產出檔案

| 檔案 | 說明 |
|------|------|
| `data/photo_meta/face_index.json` | 每張照片的臉 + bbox |
| `data/photo_meta/known_faces.json` | 已確認臉庫（疊代核心） |
| `data/photo_meta/photo_names.json` | 每張照片的 names/tables |
| `data/photos.json` | 第一階段最終 manifest |
| `data/photo_meta/cloudinary_map.json` | 上傳進度（resume 用，不進 git） |
| `data/weddingPhotos.ts` | 網站相簿資料（由腳本生成） |

## 收尾：上傳已標記照片

標記告一段落後，在終端機執行（需本機已設定 `CLOUDINARY_URL`）：

```bash
cd scripts/wedding_faces
source .venv/bin/activate
chmod +x finish_upload.sh
./finish_upload.sh
```

或分步：

```bash
python propagate_labels.py
python build_photos_manifest.py
python upload_cloudinary.py          # 只上傳有姓名的照片，中斷可再跑
python build_wedding_photos_ts.py    # 寫入 data/weddingPhotos.ts
```

上傳腳本會把進度寫入 `data/photo_meta/cloudinary_map.json`，重跑會跳過已上傳的。

## 隱私

`data/face_crops/`、`data/face_embeddings/`、`data/photo_meta/` 已加入 `.gitignore`，不會上傳 git。
