
import { Photo } from './types';

// ==========================================
// ☁️ CLOUDINARY CONFIGURATION
// ==========================================
// 高清：https://res.cloudinary.com/djqnqxzha/image/upload/v1769804093/disney-v-01.jpg
// 縮圖：publicId 前加 s-，https://res.cloudinary.com/djqnqxzha/image/upload/v1770141066/s-disney-v-01.jpg
// folderPath 不使用，直接以 publicId 路徑為主。

const CLOUD_NAME = "djqnqxzha";

const withExt = (id: string) => (id.includes(".") ? id : `${id}.jpg`);

/** 高清圖 URL（藝廊大圖、Lightbox） */
const getCloudinaryUrl = (publicId: string) =>
  `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${withExt(publicId)}`;

/** 縮圖 URL（相簿網格、飛出照片）；publicId 前加 s-，加轉換參數縮小體積加快載入 */
const getCompressedUrl = (publicId: string) =>
  `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_600,q_auto,f_auto/${withExt(`s-${publicId}`)}`;

// ==========================================
// 📸 PHOTO MANIFEST — 婚紗藝廊（精彩瞬間標題、註解、地點）
// ==========================================

interface GalleryEntry {
  publicId: string;
  title: string;
  description: string;
  location: string;
  country: string;
}

const GALLERY_DATA: GalleryEntry[] = [
  { publicId: "disney-h-01", title: "幸福拼圖", description: "地板上的字母拼出了 \"Will You Marry Me\"，這不僅是一個問句，更是我們未來的序章。", location: "香港迪士尼樂園酒店", country: "香港" },
  { publicId: "disney-v-01", title: "童話成真", description: "抱著妳喜歡的史黛拉，在城堡前單膝下跪，這一刻，王子與公主的故事有了真實的體溫。", location: "香港迪士尼·奇妙夢想城堡", country: "香港" },
  { publicId: "disney-v-02", title: "甜蜜依偎", description: "在夢幻小鎮的街角，不需要華麗的魔法，只要並肩坐著緊握雙手，就是最踏實的幸福。", location: "香港迪士尼·美國小鎮大街", country: "香港" },
  { publicId: "disney-v-03", title: "冰雪奇緣", description: "在城堡的噴泉前，陽光正好，我們的愛情像永不融化的冰雪魔法，晶瑩剔透。", location: "香港迪士尼·魔雪奇緣世界", country: "香港" },
  { publicId: "antique-v-01", title: "一眼萬年", description: "撐起油紙傘，點亮手中的花燈，彷彿穿越了千年時光，只為在豫園的燈火闌珊處與你相遇。", location: "上海豫園", country: "上海" },
  { publicId: "antique-v-02", title: "九曲良緣", description: "輕搖團扇，笑意盈盈，身後的飛簷樓閣是風景，而眼前的你是我的專屬劇情。", location: "上海豫園·九曲橋", country: "上海" },
  { publicId: "jinghua-v-01", title: "光影之間", description: "窗邊的自然光灑落，純白的禮服與妳溫柔的眼神，交織成一幅看不膩的畫。", location: "京華婚紗·韓系光影棚", country: "台灣" },
  { publicId: "jinghua-v-02", title: "心動瞬間", description: "額頭輕靠，閉上雙眼，世界安靜得只剩下我們的心跳聲，如此契合，如此安心。", location: "京華婚紗·唯美窗邊", country: "台灣" },
  { publicId: "jinghua-v-03", title: "擁抱暖陽", description: "逆光下的高高擁抱，妳的笑容比陽光更燦爛，我願用雙手撐起妳所有的快樂。", location: "京華婚紗·歐式庭園", country: "台灣" },
  { publicId: "jinghua-v-04", title: "粉紅泡泡", description: "換上粉色便服的居家時刻，妳在背後偷偷一吻，這就是我們最自在、最可愛的日常模樣。", location: "京華婚紗·溫馨居家", country: "台灣" },
  { publicId: "jinghua-v-05", title: "囍悅相伴", description: "手拿雙喜，相視而笑，紅紅火火的背景裡，洋溢著我們要一起熱鬧過日子的決心。", location: "京華婚紗·東方喜堂", country: "台灣" },
  { publicId: "jinghua-v-06", title: "扇語傳情", description: "團扇半遮面，藏不住的是愛意，在古典的圓窗前，許下三生三世的諾言。", location: "京華婚紗·復古圓窗", country: "台灣" },
  { publicId: "manhattan-v-01", title: "純粹時光", description: "簡單的背景，淡雅的藍色禮服，這一刻不用太多裝飾，我們的愛本身就很美。", location: "曼哈頓·光影攝影棚", country: "台灣" },
  { publicId: "manhattan-v-02", title: "攜手旅途", description: "在陽明山蜿蜒的公路上回頭相視而笑，只要有你，前方的路就是最美的風景。", location: "台北·陽明山公路", country: "台灣" },
  { publicId: "manhattan-v-03", title: "幸福宣告", description: "在充滿日式風情的老屋前，高舉玫瑰揮手，我們向世界大聲宣告：我們要結婚啦！", location: "淡水·多田榮吉故居", country: "台灣" },
  { publicId: "manhattan-v-04", title: "夕陽見證", description: "當金色的夕陽灑落在沙崙海灘，時光彷彿凝結，我的眼裡，只剩下妳深情的剪影。", location: "淡水·沙崙海灘", country: "台灣" },
  { publicId: "abroad-h-01", title: "神聖誓約", description: "在馬加什教堂的哥德式拱門前，長頭紗揚起了夢幻的弧度，我們在歷史見證下吻上永恆。", location: "布達佩斯·馬加什教堂", country: "匈牙利" },
  { publicId: "abroad-h-02", title: "白色戀曲", description: "藍天下的白色堡壘，妳穿著白紗向我走來，彷彿皇室庭園裡的公主，圓滿了我的夢。", location: "布達佩斯·聖伊斯特萬紀念碑", country: "匈牙利" },
  { publicId: "abroad-h-03", title: "湖畔情詩", description: "漫步在古堡旁的湖畔，微風吹過綠葉與髮梢，世界很安靜，只聽得見我們互訴的情話。", location: "布達佩斯·沃伊達奇城堡", country: "匈牙利" },
  { publicId: "abroad-h-04", title: "時光印記", description: "斑駁的石牆與黃葉記錄了歷史，而我們用快門記錄愛情，牽手走過未來的每一個秋冬。", location: "匈牙利農業博物館", country: "匈牙利" },
  { publicId: "abroad-h-05", title: "流金歲月", description: "當國會大廈點亮萬丈金光，我們並肩而坐，眼前的璀璨夜景，都不及你眼底的溫柔。", location: "匈牙利國會大廈", country: "匈牙利" },
  { publicId: "abroad-h-06", title: "情定多瑙", description: "鎖鏈橋上的燈火如珍珠般串聯，倒映在多瑙河上，流動的河水見證了我們堅定的愛。", location: "布達佩斯·塞切尼鏈橋", country: "匈牙利" },
  { publicId: "abroad-v-01", title: "拱廊之約", description: "在白色拱廊下牽手佇立，框住了身後的藍天與城市，這一刻的風景只屬於我們。", location: "布達佩斯·漁人堡拱廊", country: "匈牙利" },
  { publicId: "abroad-v-02", title: "童話漫步", description: "漫步在夢幻的尖塔與階梯前，陽光灑落，我們彷彿走進了中世紀的童話故事裡。", location: "布達佩斯·漁人堡", country: "匈牙利" },
];

const RAW_IDS = GALLERY_DATA.map((e) => e.publicId);

// 網頁背景、月曆封面、Threads 貼文使用指定圖片
export const BACKGROUND_IMAGE = getCloudinaryUrl("abroad-h-01");
export const CALENDAR_COVER_IMAGE = getCloudinaryUrl("jinghua-v-01");
export const THREADS_POST_IMAGE = getCloudinaryUrl("disney-v-02");

// 檔名含 -h- 為橫向(landscape)，含 -v- 為直向(portrait)
const BASE_PHOTOS: Photo[] = GALLERY_DATA.map((entry, index) => {
  const isPortrait = entry.publicId.includes("-v-");
  return {
    id: `photo-${index}`,
    url: getCloudinaryUrl(entry.publicId),
    compressedUrl: getCompressedUrl(entry.publicId),
    alt: entry.title,
    title: entry.title,
    description: entry.description,
    location: entry.location,
    country: entry.country,
    orientation: (isPortrait ? "portrait" : "landscape") as "portrait" | "landscape",
    rotation: index % 2 === 0 ? (index % 3) + 1 : -((index % 3) + 1),
  };
});

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
  googleScriptUrl: "https://script.google.com/macros/s/AKfycbxNy1_3RYRt-I2sT3qaRFx2wY4OalCjpbN0xlAB7fM7Bzu3sYoI4tsflv5yNMqnli_F/exec",
  lineLink: "https://line.me/ti/p/%40853lqpar",
  lineQrCode: "qrcode.png"
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
