#!/bin/bash
# 收尾：擴散標記 → 產出 manifest → 上傳 Cloudinary → 生成 weddingPhotos.ts
set -euo pipefail
cd "$(dirname "$0")"
source .venv/bin/activate

echo "==> 1/5 extract_exif (影片時間軸)"
python extract_exif.py

echo "==> 2/5 propagate_labels"
python propagate_labels.py

echo "==> 3/5 build_photos_manifest"
python build_photos_manifest.py

if [ -z "${CLOUDINARY_URL:-}" ] && { [ -z "${CLOUDINARY_API_KEY:-}" ] || [ -z "${CLOUDINARY_API_SECRET:-}" ]; }; then
  echo ""
  echo "請先設定 Cloudinary 憑證，例如："
  echo '  export CLOUDINARY_URL="cloudinary://API_KEY:API_SECRET@djqnqxzha"'
  echo "然後再執行："
  echo "  python upload_cloudinary.py"
  echo "  python build_wedding_photos_ts.py"
  exit 1
fi

echo "==> 4/5 upload_cloudinary (全部照片，可中斷後再跑會 resume)"
python upload_cloudinary.py --all

echo "==> 5/5 build_wedding_photos_ts"
python build_wedding_photos_ts.py

echo ""
echo "完成！請 commit data/weddingPhotos.ts 並部署。"
