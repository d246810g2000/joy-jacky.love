import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

interface Song {
  id: string;
  lang: string[];
  name: string;
  artist: string;
  tag?: string;
}

interface PlaylistSection {
  id: number;
  title: string;
  time: string;
  duration: string;
  bgColor: string;
  borderColor: string;
  numBgColor: string;
  songs: Song[];
}

const PLAYLIST_DATA: PlaylistSection[] = [
  {
    id: 1,
    title: '迎賓',
    time: '11:30-12:00',
    duration: '30分鐘',
    bgColor: 'bg-[#FFF0F0]/80',
    borderColor: 'border-[#FFE3E3]',
    numBgColor: 'bg-[#FFA5A5]',
    songs: [
      { id: '1.1', lang: ['中'], name: '告白氣球', artist: '周杰倫' },
      { id: '1.2', lang: ['英'], name: 'Espresso', artist: 'Sabrina Carpenter' },
      { id: '1.3', lang: ['日'], name: '庫洛魔法使OP1-Catch You Catch Me', artist: 'GUMI' },
      { id: '1.4', lang: ['韓'], name: 'Love Maybe', artist: 'MeloMance' },
      { id: '1.5', lang: ['中'], name: '少女', artist: '林宥嘉' },
      { id: '1.6', lang: ['英'], name: 'Perfect', artist: 'Ed Sheeran' },
      { id: '1.7', lang: ['日'], name: '獵人OP1-早安', artist: 'Keno' },
      { id: '1.8', lang: ['韓'], name: '為什麼會這樣呢', artist: '裴秀智' }
    ]
  },
  {
    id: 2,
    title: '一進',
    time: '12:00-12:20',
    duration: '20分鐘',
    bgColor: 'bg-[#F0F7FF]/80',
    borderColor: 'border-[#E1EEFF]',
    numBgColor: 'bg-[#9CD2FF]',
    songs: [
      { id: '2.1', lang: ['英'], name: 'Try Everything', artist: 'Shakira', tag: '花童進場' },
      { id: '2.2', lang: ['英'], name: 'Marry You', artist: 'Bruno Mars', tag: '儐相進場' },
      { id: '2.3', lang: ['英'], name: 'Beauty and the Beast', artist: 'Ariana&John', tag: '新人進場' },
      { id: '2.4', lang: ['英'], name: 'Wherever you are', artist: 'ONE OK ROCK', tag: '證婚儀式' },
      { id: '2.5', lang: ['中'], name: '世界上最重要的人', artist: '韋禮安', tag: '感謝父母' },
      { id: '2.6', lang: ['韓'], name: 'Alcohol-Free', artist: 'TWICE', tag: '舉杯音樂' }
    ]
  },
  {
    id: 3,
    title: '用餐',
    time: '12:20-13:00',
    duration: '40分鐘',
    bgColor: 'bg-[#F2FCF5]/80',
    borderColor: 'border-[#E3F7EA]',
    numBgColor: 'bg-[#9CE2B8]',
    songs: [
      { id: '3.1', lang: ['中'], name: '有點甜', artist: '汪蘇瀧&BY2' },
      { id: '3.2', lang: ['英'], name: '10000 Hours', artist: 'Dan&Shay,Justin Bieber' },
      { id: '3.3', lang: ['日'], name: 'I LOVE...', artist: 'Official髭男dism' },
      { id: '3.4', lang: ['韓'], name: '我眼裡只有你', artist: '10cm' },
      { id: '3.5', lang: ['中'], name: '與你共赴', artist: '很美味' },
      { id: '3.6', lang: ['英'], name: 'Blink', artist: '周子瑜&Corbyn' },
      { id: '3.7', lang: ['日'], name: 'Sukidakara', artist: 'Yuika' },
      { id: '3.8', lang: ['韓'], name: 'Celebrity', artist: 'IU' },
      { id: '3.9', lang: ['中'], name: '慢慢喜歡你', artist: '莫文蔚' },
      { id: '3.10', lang: ['英'], name: 'Best Day Of My Life', artist: 'American Authors' },
      { id: '3.11', lang: ['日'], name: '火影忍者OP- Silhouette', artist: 'KANA-BOON' },
      { id: '3.12', lang: ['韓'], name: 'Love Lee', artist: 'AKMU' }
    ]
  },
  {
    id: 4,
    title: '二進',
    time: '13:00-13:40',
    duration: '40分鐘',
    bgColor: 'bg-[#FFFBF0]/80',
    borderColor: 'border-[#FFF5D6]',
    numBgColor: 'bg-[#FFDE8E]',
    songs: [
      { id: '4.1', lang: ['中', '韓'], name: '愛你&What is Love?', artist: '王心凌&TWICE', tag: '新人進場' },
      { id: '4.2', lang: ['日'], name: '相反的你和我OP-Lose the Frames', artist: '乃紫noa', tag: '猜新娘禮服' },
      { id: '4.3', lang: ['中'], name: '七彩的微風', artist: '真珠美人魚', tag: '賓果遊戲' },
      { id: '4.4', lang: ['中'], name: '相信自己', artist: '真珠美人魚', tag: '賓果遊戲' },
      { id: '4.5', lang: ['中'], name: '黑暗的巴洛克', artist: '黑美人姊妹花', tag: '快問快答' },
      { id: '4.6', lang: ['中'], name: '鼓動', artist: '真珠美人魚', tag: '快問快答' }
    ]
  },
  {
    id: 5,
    title: '敬酒',
    time: '13:40-14:40',
    duration: '60分鐘',
    bgColor: 'bg-[#FAF5FF]/80',
    borderColor: 'border-[#F3E8FF]',
    numBgColor: 'bg-[#DCB6FF]',
    songs: [
      { id: '5.1', lang: ['中'], name: '代客求婚', artist: '林宥嘉' },
      { id: '5.2', lang: ['英'], name: 'A Sky Full of Stars', artist: 'Coldplay' },
      { id: '5.3', lang: ['日'], name: '戀', artist: '星野源' },
      { id: '5.4', lang: ['韓'], name: '第一個見面不會按照計畫進行', artist: 'TWS' },
      { id: '5.5', lang: ['中'], name: '我多喜歡你你會知道', artist: '王俊琪' },
      { id: '5.6', lang: ['英'], name: 'I Really Like You', artist: 'Carly Rae Jepsen' },
      { id: '5.7', lang: ['日'], name: '數碼寶貝OP-Butter-Fly', artist: '和田光司' },
      { id: '5.8', lang: ['韓'], name: 'Reaching for you', artist: 'ZB1' },
      { id: '5.9', lang: ['中'], name: '寄明月', artist: '虞書欣&丁禹兮' },
      { id: '5.10', lang: ['英'], name: 'Beauty And A Beat', artist: 'Justin Bieber' },
      { id: '5.11', lang: ['日'], name: '庫洛魔法使OP2-扉をあけて', artist: 'ANZA' },
      { id: '5.12', lang: ['韓'], name: 'Really Like You', artist: 'Gyubin' },
      { id: '5.13', lang: ['中'], name: '只想把你偷偷藏好', artist: '汪蘇瀧&趙露思' },
      { id: '5.14', lang: ['英'], name: 'ME!', artist: '周子瑜&方燦' },
      { id: '5.15', lang: ['日'], name: 'Confetti', artist: 'MISAMO' },
      { id: '5.16', lang: ['韓'], name: 'Heart Shaker', artist: 'TWICE' }
    ]
  },
  {
    id: 6,
    title: '送客',
    time: '14:40-15:40',
    duration: '60分鐘',
    bgColor: 'bg-[#F2F4FF]/80',
    borderColor: 'border-[#E4E9FF]',
    numBgColor: 'bg-[#BCC6FF]',
    songs: [
      { id: '6.1', lang: ['中'], name: '惡作劇', artist: '王藍茵' },
      { id: '6.2', lang: ['英'], name: 'Good Time', artist: 'Owl City&Carly Rae Jepsen' },
      { id: '6.3', lang: ['日'], name: '前前前世', artist: 'RADWIMPS' },
      { id: '6.4', lang: ['韓'], name: '未來', artist: 'Red Velvet' },
      { id: '6.5', lang: ['中'], name: '戀愛ing', artist: '五月天' },
      { id: '6.6', lang: ['英'], name: 'Sugar', artist: 'Maroon 5' },
      { id: '6.7', lang: ['日'], name: 'ハルカ', artist: 'YOASOBI' },
      { id: '6.8', lang: ['韓'], name: 'Dance The Night Away', artist: 'TWICE' },
      { id: '6.9', lang: ['中'], name: '女孩', artist: '韋禮安' },
      { id: '6.10', lang: ['英'], name: 'What Makes You Beautiful', artist: 'One Direction' },
      { id: '6.11', lang: ['日'], name: 'Lycoris Recoil ED-花之塔', artist: 'さユり' },
      { id: '6.12', lang: ['韓'], name: 'Blueming', artist: 'IU' },
      { id: '6.13', lang: ['中'], name: '愛上你', artist: 'S.H.E' },
      { id: '6.14', lang: ['英'], name: 'Love Story', artist: 'Taylor Swift' },
      { id: '6.15', lang: ['日'], name: '庫洛魔法使OP3-プラチナ', artist: '坂本真綾' },
      { id: '6.16', lang: ['韓'], name: 'Dynamite', artist: 'BTS' }
    ]
  }
];

export default function PlaylistPage() {
  const navigate = useNavigate();
  const playlistUrl = 'https://www.youtube.com/watch?v=bu7nU9Mhpyo&list=PLi04bcKLB_UKiOQqeZh0yRTypJ4BcHTFr';

  // 取得語言徽章的色彩樣式
  const getLangBadgeStyle = (lang: string) => {
    switch (lang) {
      case '中':
        return 'bg-[#E57373] text-white'; // 粉紅/紫紅圓圈
      case '英':
        return 'bg-[#D4AF37] text-white'; // 金黃/黃褐圓圈
      case '日':
        return 'bg-[#4FC3F7] text-white'; // 天藍圓圈
      case '韓':
        return 'bg-[#5C6BC0] text-white'; // 靛藍/深藍圓圈
      default:
        return 'bg-stone-400 text-white';
    }
  };

  const handlePlaySong = (song: Song) => {
    const query = `${song.artist} ${song.name}`;
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    window.open(searchUrl, '_blank');
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center text-stone-800 relative pb-8 overflow-x-hidden select-none"
      style={{ background: 'linear-gradient(135deg, #fdf6f0 0%, #fce8e8 40%, #f0e6f6 100%)' }}
    >
      {/* 頂部 Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between z-30 bg-white/40 backdrop-blur-md border-b border-stone-200/40 sticky top-0 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-white/60 border border-[#8E3535]/20 text-[#8E3535] hover:bg-[#8E3535] hover:text-white transition-all shadow-xs group cursor-pointer"
            title="返回首頁"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <button
            onClick={() => navigate('/')}
            className="font-display text-sm tracking-[0.2em] font-bold text-[#8E3535] hover:opacity-80 transition-opacity cursor-pointer"
          >
            ✦ Joy & Jacky ✦
          </button>
        </div>
        <span className="font-serif text-xs md:text-sm text-stone-600">
          婚禮歌單：Playlist
        </span>
      </header>

      {/* 內容區塊 */}
      <main className="w-full max-w-4xl flex flex-col items-center z-20 my-6 px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full bg-white/70 backdrop-blur-lg border border-white/50 rounded-3xl p-6 md:p-10 shadow-[0_15px_40px_-15px_rgba(142,53,53,0.1)] flex flex-col items-center space-y-8"
        >
          {/* 海報風格大標題 */}
          <div className="text-center space-y-4 w-full">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-[#b08d55] font-light tracking-[0.1em] italic">
              J & J ♡
            </h1>
            <div className="flex items-center justify-center gap-4 text-stone-500 font-serif text-sm tracking-[0.2em] uppercase">
              <span className="h-[1px] w-8 bg-stone-300"></span>
              <span>2026.05.30</span>
              <span className="h-[1px] w-8 bg-stone-300"></span>
            </div>
            <h2 className="font-display text-xs md:text-sm tracking-[0.4em] uppercase text-stone-500 font-semibold pt-1">
              WEDDING PLAYLIST
            </h2>

            {/* 互動按鈕組（手機垂直，電腦並排） */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-lg mx-auto">
              {/* YouTube 播放 */}
              <a
                href={playlistUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto py-3 px-6 bg-[#C62828] hover:bg-[#B71C1C] text-white rounded-full text-xs font-bold tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 transform active:scale-95 cursor-pointer shrink-0"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816-.029 6.185.428 8.564 4.385 8.817 3.6.246 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.817.029-6.186-.428-8.563-4.385-8.816zm-10.615 12.816v-8l8 4-8 4z"/>
                </svg>
                一鍵收聽 YouTube 完整歌單
              </a>

              {/* 下載海報 */}
              <a
                href={`${import.meta.env.BASE_URL}playlist.jpg`}
                download="Joy_Jacky_Wedding_Playlist.jpg"
                className="w-full sm:w-auto py-3 px-6 bg-[#8E3535] hover:bg-[#7a2e2e] text-white rounded-full text-xs font-bold tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 transform active:scale-95 cursor-pointer shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                下載歌單海報圖片
              </a>
            </div>
          </div>

          {/* 6 大馬卡龍色系時段區塊 */}
          <div className="w-full space-y-6">
            {PLAYLIST_DATA.map((section) => (
              <div
                key={section.id}
                className={`${section.bgColor} border ${section.borderColor} rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-stretch shadow-xs transition-all duration-300 hover:shadow-md group/section`}
              >
                {/* 左側時段資訊 */}
                <div className="flex flex-row flex-wrap items-center justify-between w-full md:w-1/4 border-b md:border-b-0 md:border-r border-stone-200/30 pb-3 md:pb-0 md:pr-6 shrink-0 gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-8 h-8 rounded-xl ${section.numBgColor} text-white flex items-center justify-center font-bold text-sm shadow-xs transition-transform duration-300 group-hover/section:scale-110 group-hover/section:rotate-3`}>
                      {section.id}
                    </span>
                    <span className="font-serif text-lg font-bold text-stone-800">
                      {section.title}
                    </span>
                  </div>
                  <div className="flex flex-row items-center gap-2 sm:gap-3 md:flex-col md:items-start md:gap-0.5">
                    <p className="text-stone-500 font-mono text-xs tracking-wider">
                      {section.time}
                    </p>
                    <p className="text-stone-400 text-[11px] font-serif">
                      {section.duration}
                    </p>
                  </div>
                </div>

                {/* 右側歌曲清單 */}
                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3.5 align-middle">
                  {/* 左半部歌曲 (由上至下) */}
                  <div className="flex flex-col gap-y-2">
                    {section.songs.slice(0, Math.ceil(section.songs.length / 2)).map((song) => (
                      <div
                        key={song.id}
                        onClick={() => handlePlaySong(song)}
                        className="flex items-center justify-between p-2 rounded-xl border border-transparent hover:border-[#8E3535]/15 hover:bg-white/60 active:bg-white/80 transition-all duration-200 cursor-pointer group shadow-2xs hover:shadow-xs"
                        title={`點選在 YouTube 上播放: ${song.artist} - ${song.name}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {/* 歌曲序號 */}
                          <span className="text-stone-400 font-mono text-xs shrink-0 w-6">
                            {song.id}
                          </span>

                          {/* 語言標籤 */}
                          <div className="flex gap-0.5 shrink-0">
                            {song.lang.map((l, i) => (
                              <span
                                key={i}
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-2xs ${getLangBadgeStyle(l)}`}
                              >
                                {l}
                              </span>
                            ))}
                          </div>

                          {/* 歌名歌手 */}
                          <div className="truncate text-xs md:text-sm pl-1">
                            <span className="font-semibold text-stone-800 group-hover:text-[#8E3535] transition-colors">
                              {song.tag && (
                                <span className="inline-block bg-[#8E3535]/5 border border-[#8E3535]/15 text-[#8E3535] text-[10px] px-1.5 py-0.5 rounded-md mr-1.5 font-normal tracking-wide">
                                  {song.tag}
                                </span>
                              )}
                              {song.name}
                            </span>
                            <span className="text-stone-500 font-light ml-1.5 font-sans text-[11px] md:text-xs">
                              {song.artist}
                            </span>
                          </div>
                        </div>

                        {/* 右側 YouTube 播放 Icon */}
                        <span className="text-stone-300 group-hover:text-red-600 transition-all duration-300 transform group-hover:scale-125 group-hover:rotate-12 shrink-0 pl-2">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                          </svg>
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* 右半部歌曲 (由上至下) */}
                  <div className="flex flex-col gap-y-2">
                    {section.songs.slice(Math.ceil(section.songs.length / 2)).map((song) => (
                      <div
                        key={song.id}
                        onClick={() => handlePlaySong(song)}
                        className="flex items-center justify-between p-2 rounded-xl border border-transparent hover:border-[#8E3535]/15 hover:bg-white/60 active:bg-white/80 transition-all duration-200 cursor-pointer group shadow-2xs hover:shadow-xs"
                        title={`點選在 YouTube 上播放: ${song.artist} - ${song.name}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {/* 歌曲序號 */}
                          <span className="text-stone-400 font-mono text-xs shrink-0 w-6">
                            {song.id}
                          </span>

                          {/* 語言標籤 */}
                          <div className="flex gap-0.5 shrink-0">
                            {song.lang.map((l, i) => (
                              <span
                                key={i}
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-2xs ${getLangBadgeStyle(l)}`}
                              >
                                {l}
                              </span>
                            ))}
                          </div>

                          {/* 歌名歌手 */}
                          <div className="truncate text-xs md:text-sm pl-1">
                            <span className="font-semibold text-stone-800 group-hover:text-[#8E3535] transition-colors">
                              {song.tag && (
                                <span className="inline-block bg-[#8E3535]/5 border border-[#8E3535]/15 text-[#8E3535] text-[10px] px-1.5 py-0.5 rounded-md mr-1.5 font-normal tracking-wide">
                                  {song.tag}
                                </span>
                              )}
                              {song.name}
                            </span>
                            <span className="text-stone-500 font-light ml-1.5 font-sans text-[11px] md:text-xs">
                              {song.artist}
                            </span>
                          </div>
                        </div>

                        {/* 右側 YouTube 播放 Icon */}
                        <span className="text-stone-300 group-hover:text-red-600 transition-all duration-300 transform group-hover:scale-125 group-hover:rotate-12 shrink-0 pl-2">
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                          </svg>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
