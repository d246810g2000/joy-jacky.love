from pathlib import Path
from typing import Dict, List, Optional
import os

PROJECT_ROOT = Path(__file__).resolve().parents[2]
PRIVATE_DATA_DIR = Path(
    os.getenv("WEDDING_PRIVATE_DATA_DIR", str(PROJECT_ROOT / "data"))
).expanduser()
PHOTO_SOURCE = Path("/Users/d246810g2000/Downloads/20260530家銘&謦伊 婚禮記錄")
META_DIR = PROJECT_ROOT / "data" / "photo_meta"
CROPS_DIR = PROJECT_ROOT / "data" / "face_crops"
EMB_DIR = PROJECT_ROOT / "data" / "face_embeddings"
GUEST_CSV = PRIVATE_DATA_DIR / "guest.csv"
PHOTOS_JSON = PRIVATE_DATA_DIR / "photos.json"

AUTO_THRESHOLD = 0.75
SUGGEST_THRESHOLD = 0.55
# InsightFace det_score cutoff; raise to reduce false-positive labeling load.
DET_SCORE_MIN = 0.65

# Faces that should not be overwritten by cluster/propagation rules.
PROTECTED_STATUSES = frozenset({"confirmed", "not_face", "skipped", "staff"})
# Faces excluded from the labeling queue.
RESOLVED_STATUSES = frozenset({"not_face", "skipped", "staff", "confirmed"})

# 婚宴實際時間（顯示用）
BANQUET_ARRIVAL_CLOCK = (11, 30)
BANQUET_ENTRANCE_CLOCK = (12, 0)
BANQUET_SECOND_ENTRANCE_CLOCK = (13, 0)
BANQUET_GAMES_CLOCK = (13, 0)
BANQUET_TOAST_CLOCK = (13, 40)
BANQUET_FAREWELL_CLOCK = (14, 40)

# 照片章節 — 依檔名編號（260530-N 的 N）手動對應
# 106 以前（含 106）除了 14–33 → 溫馨開場
# 14–33、107–278 → 新人進場
# 279–329 → 二進驚喜
# 330–442 → 互動遊戲
# 443–521 → 逐桌敬酒
# 522+     → 送客合照
PHOTO_STAGES = [
    {
        "id": "opening_mermaid",
        "label": "溫馨開場",
        "description": "真珠美人魚浪漫序幕 🧜‍♀️",
        "clockStart": BANQUET_ARRIVAL_CLOCK,
        "clockEnd": (11, 59),
        "filmStartSec": 0,
        "filmEndSec": 4 * 60 + 37,
        "accent": "#c9a87c",
    },
    {
        "id": "grand_entrance",
        "label": "新人進場",
        "description": "男女主角璀璨進場｜愛之雨星光燈海 💖",
        "clockStart": BANQUET_ENTRANCE_CLOCK,
        "clockEnd": (12, 59),
        "filmStartSec": 4 * 60 + 37,
        "filmEndSec": 17 * 60 + 31,
        "accent": "#e6c07a",
    },
    {
        "id": "second_entrance",
        "label": "二進驚喜",
        "description": "浪漫開唱與熱舞表演 🕺💃",
        "clockStart": BANQUET_SECOND_ENTRANCE_CLOCK,
        "clockEnd": (13, 29),
        "filmStartSec": 17 * 60 + 31,
        "filmEndSec": 20 * 60 + 21,
        "accent": "#e0a86e",
    },
    {
        "id": "interactive_games",
        "label": "互動遊戲",
        "description": "猜禮服、賓果、快問快答 🎲",
        "clockStart": BANQUET_GAMES_CLOCK,
        "clockEnd": (13, 39),
        "filmStartSec": 20 * 60 + 21,
        "filmEndSec": 47 * 60 + 35,
        "accent": "#9a8ed4",
    },
    {
        "id": "table_toast",
        "label": "逐桌敬酒",
        "description": "溫馨逐桌敬酒 🍷",
        "clockStart": BANQUET_TOAST_CLOCK,
        "clockEnd": (14, 39),
        "filmStartSec": 47 * 60 + 35,
        "filmEndSec": 53 * 60 + 35,
        "accent": "#a85858",
    },
    {
        "id": "farewell",
        "label": "送客合照",
        "description": "幸福送客與合照 📷",
        "clockStart": BANQUET_FAREWELL_CLOCK,
        "clockEnd": BANQUET_FAREWELL_CLOCK,
        "filmStartSec": 53 * 60 + 35,
        "filmEndSec": 53 * 60 + 35,
        "accent": "#7a8eb0",
    },
]

STAGE_ORDER = [s["id"] for s in PHOTO_STAGES]

STAGE_BY_ID = {s["id"]: s for s in PHOTO_STAGES}

STAGE_LABELS = {s["id"]: s["label"] for s in PHOTO_STAGES}
STAGE_DESCRIPTIONS = {s["id"]: s["description"] for s in PHOTO_STAGES}

STAGE_TAGS = {
    "opening_mermaid": ["開場"],
    "grand_entrance": ["進場", "一進"],
    "second_entrance": ["二進"],
    "interactive_games": ["互動遊戲", "猜禮服", "賓果", "快問快答"],
    "table_toast": ["敬酒", "逐桌敬酒"],
    "farewell": ["送客", "送客合照"],
}

# 預先展開各章節的照片編號（用於時間插值）
_STAGE_PHOTO_NUMS: Optional[Dict[str, List[int]]] = None


def _in_range(n: int, start: int, end: int) -> bool:
    return start <= n <= end


def assign_stage_from_sort_index(sort_index: int, min_index: int = 0, max_index: int = 0) -> str:
    n = sort_index
    if _in_range(n, 14, 33) or _in_range(n, 107, 278):
        return "grand_entrance"
    if n <= 106 and not _in_range(n, 14, 33):
        return "opening_mermaid"
    if _in_range(n, 279, 329):
        return "second_entrance"
    if _in_range(n, 330, 442):
        return "interactive_games"
    if _in_range(n, 443, 521):
        return "table_toast"
    if n >= 522:
        return "farewell"
    return "opening_mermaid"


def _build_stage_photo_nums() -> dict[str, list[int]]:
    nums: dict[str, list[int]] = {sid: [] for sid in STAGE_ORDER}
    for n in range(1, 644):
        nums[assign_stage_from_sort_index(n)].append(n)
    return nums


def stage_photo_nums(stage_id: str) -> list[int]:
    global _STAGE_PHOTO_NUMS
    if _STAGE_PHOTO_NUMS is None:
        _STAGE_PHOTO_NUMS = _build_stage_photo_nums()
    return _STAGE_PHOTO_NUMS.get(stage_id, [])


def _clock_sec(h: int, m: int) -> int:
    return h * 3600 + m * 60


def format_clock_time(clock_sec: int) -> str:
    h = clock_sec // 3600
    m = (clock_sec % 3600) // 60
    return f"{h}:{m:02d}"


def format_video_time(total_sec: int) -> str:
    return f"{total_sec // 60:02d}:{total_sec % 60:02d}"


def _interpolate_clock(sort_index: int, stage_id: str) -> str:
    stage = STAGE_BY_ID[stage_id]
    nums = stage_photo_nums(stage_id)
    if not nums:
        return format_clock_time(_clock_sec(*stage["clockStart"]))

    start_sec = _clock_sec(*stage["clockStart"])
    end_sec = _clock_sec(*stage["clockEnd"])
    if len(nums) == 1 or start_sec == end_sec:
        return format_clock_time(start_sec)

    pos = nums.index(sort_index) if sort_index in nums else 0
    ratio = pos / (len(nums) - 1)
    return format_clock_time(int(start_sec + ratio * (end_sec - start_sec)))


def _interpolate_video_sec(sort_index: int, stage_id: str) -> int:
    stage = STAGE_BY_ID[stage_id]
    nums = stage_photo_nums(stage_id)
    film_start = stage["filmStartSec"]
    film_end = stage["filmEndSec"]
    if not nums or film_start == film_end:
        return film_start

    pos = nums.index(sort_index) if sort_index in nums else 0
    ratio = pos / (len(nums) - 1)
    return int(film_start + ratio * (film_end - film_start))


def clock_time_for_sort_index(sort_index: int, min_index: int = 0, max_index: int = 0) -> str:
    stage_id = assign_stage_from_sort_index(sort_index, min_index, max_index)
    return _interpolate_clock(sort_index, stage_id)


def video_time_for_sort_index(sort_index: int, min_index: int = 0, max_index: int = 0) -> str:
    stage_id = assign_stage_from_sort_index(sort_index, min_index, max_index)
    return format_video_time(_interpolate_video_sec(sort_index, stage_id))


def stage_clock_time(stage_id: str) -> str:
    stage = STAGE_BY_ID.get(stage_id)
    if not stage:
        return "12:00"
    return format_clock_time(_clock_sec(*stage["clockStart"]))


STAGE_TITLES = {
    sid: f"{stage_clock_time(sid)} {STAGE_LABELS[sid]}"
    for sid in STAGE_ORDER
}


CLOUDINARY_FOLDER = "wedding_20260530"
CLOUDINARY_MAP = META_DIR / "cloudinary_map.json"
WEDDING_PHOTOS_TS = PROJECT_ROOT / "data" / "weddingPhotos.ts"


def ensure_dirs():
    META_DIR.mkdir(parents=True, exist_ok=True)
    CROPS_DIR.mkdir(parents=True, exist_ok=True)
    EMB_DIR.mkdir(parents=True, exist_ok=True)
