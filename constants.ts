
import { Photo } from './types';

// ==========================================
// ☁️ CLOUDINARY CONFIGURATION
// ==========================================

const CLOUD_NAME = "djqnqxzha"; 
const FOLDER_NAME = ""; 

const getCloudinaryUrl = (publicId: string) => {
  const folderPath = FOLDER_NAME ? `${FOLDER_NAME}/` : "";
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,w_1600/${folderPath}${publicId}`;
};

// ==========================================
// 📸 PHOTO MANIFEST
// ==========================================

// Exact IDs with suffixes as provided by the user
const RAW_IDS = [
  "w-00001_nkvkpg", "w-00002_eghizu", "w-00003_wmeyxa", "w-00004_a5tdct", "w-00005_semqkz",
  "w-00006_k7viwm", "w-00007_xdy22y", "w-00008_yehbvm", "w-00009_tn73xz", "w-00010_poaypf",
  "w-00011_bkggj5", "w-00012_oue15q", "w-00013_hc1oaz", "w-00014_mzujn8", "w-00015_csxgx8",
  "w-00016_y1bj66", "w-00017_ofd3cx", "w-00018_doxmiz", "w-00019_dsnnw0", "w-00020_frhhnj"
];

export const BACKGROUND_IMAGE = getCloudinaryUrl(RAW_IDS[0]); 

const PHOTO_ENTRIES = RAW_IDS.map((publicId, i) => {
  const num = i + 1;
  // User specified: 6, 7, 8, 9 are portrait
  const portraitIds = [6, 7, 8, 9];
  const isPortrait = portraitIds.includes(num);

  return {
    publicId,
    alt: `Our Story - Moment ${num}`,
    orientation: (isPortrait ? 'portrait' : 'landscape') as 'portrait' | 'landscape',
    rotation: num % 2 === 0 ? (num % 3) + 1 : -((num % 3) + 1), 
    description: `Joy & Jacky - Moment ${num}`
  };
});

const BASE_PHOTOS: Photo[] = PHOTO_ENTRIES.map((entry, index) => ({
  id: `photo-${index}`,
  url: getCloudinaryUrl(entry.publicId),
  alt: entry.alt,
  orientation: entry.orientation,
  rotation: entry.rotation,
  description: entry.description
}));

// ==========================================
// 🧩 GENERATED CONTENT
// ==========================================

export const WEDDING_PHOTOS: Photo[] = [
  ...BASE_PHOTOS
];

export const APP_CONTENT = {
  coupleName: "Joy & Jacky",
  chineseNames: "李謦伊 ❤️ 張家銘",
  date: "2026年5月30日",
  dateISO: "2026-05-30T12:00:00",
  location: "新竹, 台灣",
  venueName: "晶宴會館 御豐館", 
  venueHall: "璀燦劇場",
  venueAddress: "新竹市東區公道五路二段105號 (TFC ONE商業大樓)",
  venueDescription: "晶宴御豐館位於新竹東區菁華區位，鄰近艾司摩爾科技公司園區，壯觀秀麗的外觀形塑新竹地區婚宴地標。我們所在的璀燦劇場，以現代時尚設計貫穿，不落俗套的色系跳脫廳房既有視覺感受，大氣又兼具格調。",
  quote: "在時間的畫布上，我們即將用愛，畫上最燦爛的一筆。誠邀您來見證，我們的永恆。",
  intro: "We invite you to celebrate our love story.",
  // ★★★ 修正點：網址必須包含 /exec 結尾 ★★★
  googleScriptUrl: "https://script.google.com/macros/s/AKfycbxNy1_3RYRt-I2sT3qaRFx2wY4OalCjpbN0xlAB7fM7Bzu3sYoI4tsflv5yNMqnli_F/exec" 
};

export const TIMELINE_EVENTS = [
  {
    time: "12:00",
    title: "Guest Arrival",
    chineseTitle: "賓客入席",
    description: "老朋友們可以聚一聚，用拍拍印與朋友們留下美好回憶"
  },
  {
    time: "12:30",
    title: "Grand Opening",
    chineseTitle: "幸福開席",
    description: "婚禮正式開始，敬備佳餚，共饗盛宴"
  },
  {
    time: "15:30",
    title: "Farewell",
    chineseTitle: "送客合影",
    description: "感謝您的參與，與新人留下美好回憶"
  }
];

export const TRANSPORT_INFO = [
  {
    icon: "🚗",
    title: "Driving",
    chineseTitle: "自行開車",
    description: "本館位於 TFC ONE 商業大樓，地下室備有特約停車場。由國道一號公道五路交流道下，沿公道五路二段直行即可抵達。"
  },
  {
    icon: "🚆",
    title: "Train",
    chineseTitle: "台鐵火車",
    description: "搭乘火車至【北新竹站】下車，轉乘計程車約 1-2 公里即可抵達 (車資約 $110-140)。"
  },
  {
    icon: "🚄",
    title: "HSR",
    chineseTitle: "台灣高鐵",
    description: "於【高鐵新竹站】下車，轉乘計程車至公道五路與忠孝路口 TFC ONE 大樓，約 8 公里 (車資約 $250-300)。"
  }
];
