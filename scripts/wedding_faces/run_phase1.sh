#!/usr/bin/env bash
# 第一階段一鍵初始化：EXIF + 人臉偵測聚類 + 首次擴散 + manifest
set -e
cd "$(dirname "$0")"
DIR="$(pwd)"

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q -r requirements.txt

echo "=== Step 1: EXIF ==="
python extract_exif.py

echo "=== Step 2: Face detect + cluster (may take 1-2 hours) ==="
python detect_and_cluster.py

echo "=== Step 3: Initial propagate ==="
python propagate_labels.py

echo "=== Step 4: Build photos.json ==="
python build_photos_manifest.py

echo ""
echo "Done! Start labeling UI:"
echo "  source .venv/bin/activate && python label_server.py"
echo "  Open http://localhost:8765"
