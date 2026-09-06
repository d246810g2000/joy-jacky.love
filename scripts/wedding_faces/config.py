from pathlib import Path
from typing import Dict, List, Optional, Tuple
import os

PROJECT_ROOT = Path(__file__).resolve().parents[2]
PRIVATE_DATA_DIR = Path(
    os.getenv("WEDDING_PRIVATE_DATA_DIR", str(PROJECT_ROOT / "data"))
).expanduser()
PHOTO_SOURCE = Path("/Users/d246810g2000/Downloads/20260530家銘&謦伊 婚禮記錄")
META_DIR = PROJECT_ROOT / "data" / "photo_meta"
CROPS_DIR = PROJECT_ROOT / "data" / "face_crops"
EMB_DIR = PROJECT_ROOT / "data" / "face_embeddings"
# Label UI 賓客搜尋來源（已進 git）
PUBLIC_GUEST_INDEX = PROJECT_ROOT / "data" / "publicGuestIndex.ts"
PHOTOS_JSON = PRIVATE_DATA_DIR / "photos.json"

AUTO_THRESHOLD = 0.75
SUGGEST_THRESHOLD = 0.55
# InsightFace det_score cutoff. Lower = more small/side faces enter review.
DET_SCORE_MIN = 0.55

# Faces the user chose to ignore (not interested) or otherwise leave alone.
PROTECTED_STATUSES = frozenset({"confirmed", "not_face", "skipped", "staff"})
# Faces excluded from the labeling queue (not_face = skipped / not interested).
RESOLVED_STATUSES = frozenset({"not_face", "skipped", "staff", "confirmed"})

# 婚宴章節切點：對章節首張 EXIF 取「最近 10 分鐘」，但不得晚於實際時間
# 二進 #279 @ 13:41、遊戲 #331 @ 13:45 同落 13:40 格 → 遊戲改用首張實際分鐘 13:45
BANQUET_ARRIVAL_CLOCK = (11, 0)          # #1   @ 11:00 → 11:00
BANQUET_ENTRANCE_CLOCK = (12, 10)        # #107 @ 12:17 → 12:10
BANQUET_CEREMONY_CLOCK = (12, 20)        # #157 @ 12:24 → 12:20（交換婚戒起）
BANQUET_SECOND_ENTRANCE_CLOCK = (13, 40) # #279 @ 13:41 → 13:40
BANQUET_GAMES_CLOCK = (13, 45)           # #331 @ 13:45（避免與二進同為 13:40）
BANQUET_TOAST_CLOCK = (14, 10)           # #440 @ 14:17 → 14:10
BANQUET_FAREWELL_CLOCK = (14, 30)        # #526 @ 14:36 → 14:30

# 新人形象照（穿插於相本編號，獨立成章、不插入宴席時間軸）
COUPLE_PORTRAIT_RANGES: Tuple[Tuple[int, int], ...] = (
    (103, 106),
    (240, 278),
    (519, 525),
    (624, 640),
)

# 照片章節 — 依檔名編號（260530-N 的 N）
# 1–102（含 14–33 綵排）→ 溫馨開場
# 103–106、240–278、519–525、624–640 → 新人形象照
# 107–156 → 璀璨進場（愛之雨與誓言；至交換婚戒前）
# 157–239 → 儀式時刻（婚戒／父母／舉杯）
# 279–330 → 二進驚喜
# 331–439 → 互動遊戲
# 440–518 → 逐桌敬酒
# 526–623、641–643 → 送客合照
PHOTO_STAGES = [
    {
        "id": "opening_mermaid",
        "label": "溫馨開場",
        "description": "真珠美人魚浪漫序幕 🧜‍♀️",
        "clockStart": BANQUET_ARRIVAL_CLOCK,
        "clockEnd": (12, 20),  # #102 @ 12:12
        "filmStartSec": 0,
        "filmEndSec": 4 * 60 + 37,
        "accent": "#c9a87c",
    },
    {
        "id": "grand_entrance",
        "label": "璀璨進場",
        "description": "男女主角璀璨進場｜愛之雨星光燈海 💖",
        "clockStart": BANQUET_ENTRANCE_CLOCK,
        "clockEnd": (12, 24),  # #156 @ 12:24
        "filmStartSec": 4 * 60 + 37,
        "filmEndSec": 9 * 60 + 33,
        "accent": "#e6c07a",
    },
    {
        "id": "ceremony_vows",
        "label": "儀式時刻",
        "description": "交換婚戒、感恩父母與舉杯 💍",
        "clockStart": BANQUET_CEREMONY_CLOCK,
        "clockEnd": (12, 50),  # #239 @ 12:42
        "filmStartSec": 9 * 60 + 33,
        "filmEndSec": 17 * 60 + 31,
        "accent": "#c97b84",
    },
    {
        "id": "second_entrance",
        "label": "二進驚喜",
        "description": "浪漫開唱與熱舞表演 🕺💃",
        "clockStart": BANQUET_SECOND_ENTRANCE_CLOCK,
        "clockEnd": (13, 50),  # #330 @ 13:44
        "filmStartSec": 17 * 60 + 31,
        "filmEndSec": 20 * 60 + 21,
        "accent": "#e0a86e",
    },
    {
        "id": "interactive_games",
        "label": "互動遊戲",
        "description": "猜禮服、賓果、快問快答 🎲",
        "clockStart": BANQUET_GAMES_CLOCK,
        "clockEnd": (14, 20),  # #439 @ 14:17
        "filmStartSec": 20 * 60 + 21,
        "filmEndSec": 47 * 60 + 35,
        "accent": "#9a8ed4",
    },
    {
        "id": "table_toast",
        "label": "逐桌敬酒",
        "description": "溫馨逐桌敬酒 🍷",
        "clockStart": BANQUET_TOAST_CLOCK,
        "clockEnd": (14, 40),  # #518 @ 14:33
        "filmStartSec": 47 * 60 + 35,
        "filmEndSec": 53 * 60 + 35,
        "accent": "#a85858",
    },
    {
        "id": "farewell",
        "label": "送客合照",
        "description": "幸福送客與合照 📷",
        "clockStart": BANQUET_FAREWELL_CLOCK,
        "clockEnd": (16, 0),  # #643 @ 15:51
        "filmStartSec": 53 * 60 + 35,
        "filmEndSec": 53 * 60 + 35,
        "accent": "#7a8eb0",
    },
    {
        "id": "couple_portraits",
        "label": "新人形象照",
        "description": "新人形象寫真精選 ✨",
        # 非宴席時段切點；僅供缺 EXIF 時插值。標題不顯示時鐘。
        "clockStart": (12, 10),  # 最早一段 #103 @ 12:14
        "clockEnd": (15, 50),  # 最末一段 #640 @ 15:50
        "filmStartSec": 53 * 60 + 35,
        "filmEndSec": 53 * 60 + 35,
        "accent": "#b08a6a",
    },
]

STAGE_ORDER = [s["id"] for s in PHOTO_STAGES]

STAGE_BY_ID = {s["id"]: s for s in PHOTO_STAGES}

STAGE_LABELS = {s["id"]: s["label"] for s in PHOTO_STAGES}
STAGE_DESCRIPTIONS = {s["id"]: s["description"] for s in PHOTO_STAGES}

STAGE_TAGS = {
    "opening_mermaid": ["開場", "綵排"],
    "grand_entrance": ["進場", "一進", "愛之雨"],
    "ceremony_vows": ["儀式", "婚戒", "舉杯"],
    "second_entrance": ["二進"],
    "interactive_games": ["互動遊戲", "猜禮服", "賓果", "快問快答"],
    "table_toast": ["敬酒", "逐桌敬酒"],
    "farewell": ["送客", "送客合照"],
    "couple_portraits": ["形象照", "新人形象"],
}

# 預先展開各章節的照片編號（用於時間插值）
_STAGE_PHOTO_NUMS: Optional[Dict[str, List[int]]] = None


def _in_range(n: int, start: int, end: int) -> bool:
    return start <= n <= end


def is_couple_portrait(sort_index: int) -> bool:
    return any(_in_range(sort_index, a, b) for a, b in COUPLE_PORTRAIT_RANGES)


def assign_stage_from_sort_index(sort_index: int, min_index: int = 0, max_index: int = 0) -> str:
    n = sort_index
    if is_couple_portrait(n):
        return "couple_portraits"
    if n <= 102:
        return "opening_mermaid"  # 含 #14–33 進場綵排
    if _in_range(n, 107, 156):
        return "grand_entrance"
    if _in_range(n, 157, 239):
        return "ceremony_vows"
    if _in_range(n, 279, 330):
        return "second_entrance"
    if _in_range(n, 331, 439):
        return "interactive_games"
    if _in_range(n, 440, 518):
        return "table_toast"
    if n >= 526:
        return "farewell"  # 含 #641–643
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
    if stage_id == "couple_portraits":
        return ""  # 非宴席時段切點，標題不顯示時鐘
    stage = STAGE_BY_ID.get(stage_id)
    if not stage:
        return "12:00"
    return format_clock_time(_clock_sec(*stage["clockStart"]))


STAGE_TITLES = {
    sid: (
        STAGE_LABELS[sid]
        if sid == "couple_portraits"
        else f"{stage_clock_time(sid)} {STAGE_LABELS[sid]}"
    )
    for sid in STAGE_ORDER
}


CLOUDINARY_FOLDER = "wedding_20260530"
CLOUDINARY_MAP = META_DIR / "cloudinary_map.json"
WEDDING_PHOTOS_TS = PROJECT_ROOT / "data" / "weddingPhotos.ts"


def ensure_dirs():
    META_DIR.mkdir(parents=True, exist_ok=True)
    CROPS_DIR.mkdir(parents=True, exist_ok=True)
    EMB_DIR.mkdir(parents=True, exist_ok=True)
