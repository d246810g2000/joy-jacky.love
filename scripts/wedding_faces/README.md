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
| `$WEDDING_PRIVATE_DATA_DIR/photos.json` | 第一階段最終 manifest（私有，不進 git） |
| `data/photo_meta/cloudinary_map.json` | 上傳進度（resume 用，不進 git） |
| `data/weddingPhotos.ts` | 公開網站使用的最小相簿 manifest |

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

Label UI 賓客搜尋讀取已進 git 的 `data/publicGuestIndex.ts`。

若要在私有環境重新產生相簿 manifest，請將 `photos.json` 放在 `data/` 或設定：

```bash
export WEDDING_PRIVATE_DATA_DIR="/path/to/private/wedding-data"
```

## 清理臉庫（unused bank vectors）

標記過程中臉庫只會「新增」、略過／改標不會自動從 `known_faces.json` 移除向量。
若要清掉沒用到的臉庫向量：

```bash
cd scripts/wedding_faces
source .venv/bin/activate
python prune_known_faces.py          # 先看會刪什麼（不會寫入）
python prune_known_faces.py --apply  # 實際清理並重建 centroid
# 若也要把「已確認但沒進臉庫」的臉補進去：
# python prune_known_faces.py --sync --apply
```

這會：
- 只保留「目前仍是 confirmed」的臉向量進臉庫
- 刪掉已無人確認的人名條目（例如誤建的「張」「張師」）
- 刪掉對應的孤兒 `*_centroid.npy`

**不會**刪偵測產生的 `data/face_embeddings/<faceId>.npy`（重新預測還用得到）。

## 隱私

`photos.json`、`data/face_crops/`、`data/face_embeddings/`、`data/photo_meta/`
已加入 `.gitignore`，不會上傳 git。公開版本只提交網站運作所需的衍生索引與相簿
manifest。
