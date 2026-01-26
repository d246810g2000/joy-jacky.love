
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MUSIC_URL = "https://res.cloudinary.com/djqnqxzha/video/upload/v1769361018/weeding-music_eo92yn.mp3";

// 歌詞數據
const LYRICS = [
  { "time": 17.50, "text": "天晴空萬里" },
  { "time": 19.50, "text": "有一片白雲" },
  { "time": 21.26, "text": "映入了我眼簾就像你一樣純淨" },
  { "time": 25.53, "text": "蔚藍色是夢境" },
  { "time": 27.28, "text": "化成個漂流瓶" },
  { "time": 29.29, "text": "帶領我向你心裡慢慢靠近" },
  { "time": 34.00, "text": "風思念的聲音" },
  { "time": 36.00, "text": "雲一定能感應" },
  { "time": 38.00, "text": "才會在我們頭頂凝聚成雨降臨" },
  { "time": 42.50, "text": "在地球某個裂縫" },
  { "time": 44.30, "text": "有片平行時空" },
  { "time": 46.30, "text": "那裡有我們最美的光景" },
  { "time": 50.00, "text": "想陪你一起看璀璨煙火" },
  { "time": 54.00, "text": "想和你去世界每個角落" },
  { "time": 58.30, "text": "哪怕風雨再多" },
  { "time": 60.30, "text": "我們一起走過" },
  { "time": 62.50, "text": "中途波折也是另一種景色" },
  { "time": 66.50, "text": "想陪你一起去江海湖泊" },
  { "time": 70.70, "text": "想和你天涯海角都不分隔" },
  { "time": 75.00, "text": "看那滿天星河" },
  { "time": 77.00, "text": "我們時間還多" },
  { "time": 79.00, "text": "有你的每分每秒都是彩色" },
  { "time": 83.00, "text": "多麼難得" },
  { "time": 86.00, "text": "" },
  { "time": 101.00, "text": "天晴空萬里" },
  { "time": 103.00, "text": "有一片白雲" },
  { "time": 104.70, "text": "映入了我眼簾就像你一樣純淨" },
  { "time": 109.00, "text": "蔚藍色是夢境" },
  { "time": 110.70, "text": "化成個漂流瓶" },
  { "time": 112.70, "text": "帶領我向你心裡慢慢靠近" },
  { "time": 117.50, "text": "風思念的聲音" },
  { "time": 119.50, "text": "雲一定能感應" },
  { "time": 121.50, "text": "才會在我們頭頂凝聚成雨降臨" },
  { "time": 126.00, "text": "在地球某個裂縫" },
  { "time": 127.80, "text": "有片平行時空" },
  { "time": 129.80, "text": "那裡有我們最美的光景" },
  { "time": 133.50, "text": "想陪你一起看璀璨煙火" },
  { "time": 137.50, "text": "想和你去世界每個角落" },
  { "time": 141.80, "text": "哪怕風雨再多" },
  { "time": 143.80, "text": "我們一起走過" },
  { "time": 145.80, "text": "中途波折也是另一種景色" },
  { "time": 150.00, "text": "想陪你一起去江海湖泊" },
  { "time": 154.20, "text": "想和你天涯海角都不分隔" },
  { "time": 158.50, "text": "看那滿天星河" },
  { "time": 160.50, "text": "我們時間還多" },
  { "time": 162.50, "text": "有你的每分每秒都是彩色" },
  { "time": 166.50, "text": "多麼難得" },
  { "time": 169.00, "text": "想陪你一起看璀璨煙火" },
  { "time": 173.00, "text": "想和你去世界每個角落" },
  { "time": 177.30, "text": "哪怕風雨再多" },
  { "time": 179.30, "text": "我們一起走過" },
  { "time": 181.30, "text": "中途波折也是另一種景色" },
  { "time": 185.50, "text": "想陪你一起去江海湖泊" },
  { "time": 189.70, "text": "想和你天涯海角都不分隔" },
  { "time": 194.00, "text": "看那滿天星河" },
  { "time": 196.00, "text": "我們時間還多" },
  { "time": 198.00, "text": "有你的每分每秒都是彩色" },
  { "time": 202.00, "text": "多麼難得" }
];

interface BackgroundMusicProps {
    className?: string;
    minimal?: boolean; // New prop for embedding in dock
}

export const BackgroundMusic: React.FC<BackgroundMusicProps> = ({ className = "", minimal = false }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLyric, setCurrentLyric] = useState<string>("");

  useEffect(() => {
    // Initialize Audio Object
    if (!audioRef.current) {
        audioRef.current = new Audio(MUSIC_URL);
        audioRef.current.loop = true;
        audioRef.current.volume = 0.5;
    }
    const audio = audioRef.current;

    // Time Update Listener for Lyrics
    const handleTimeUpdate = () => {
        const currentTime = audio.currentTime;
        // Find the active lyric: The latest one that is past its timestamp
        // We reverse the array to find the *last* matching item efficiently
        const activeItem = [...LYRICS].reverse().find(item => currentTime >= item.time);
        
        // Only update if text changes to avoid re-renders
        if (activeItem) {
            setCurrentLyric(activeItem.text);
        } else {
            setCurrentLyric("");
        }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);

    // Robust Autoplay Strategy
    const attemptAutoPlay = async () => {
        try {
            audio.muted = false;
            await audio.play();
            setIsPlaying(true);
        } catch (error) {
            try {
                audio.muted = true;
                await audio.play();
                setIsPlaying(true);
            } catch (mutedError) {
                setIsPlaying(false);
            }
        }
    };

    const enableSound = () => {
        if (audio) {
            if (audio.muted) audio.muted = false;
            if (audio.paused) {
                audio.play()
                    .then(() => setIsPlaying(true))
                    .catch(e => console.warn("Interaction play failed", e));
            }
        }
        ['click', 'touchstart', 'keydown'].forEach(event => 
            document.removeEventListener(event, enableSound)
        );
    };

    attemptAutoPlay();

    ['click', 'touchstart', 'keydown'].forEach(event => 
        document.addEventListener(event, enableSound, { once: true })
    );

    return () => {
        if (audio) {
            audio.pause();
            audio.removeEventListener('timeupdate', handleTimeUpdate);
        }
        ['click', 'touchstart', 'keydown'].forEach(event => 
            document.removeEventListener(event, enableSound)
        );
    };
  }, []);

  const toggleMusic = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.muted = false; 
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(e => console.error("Manual play failed", e));
    }
  };

  // Styles depending on minimal prop
  const containerStyle = minimal 
    ? "relative w-full h-full flex items-center justify-center text-[#8E3535] hover:text-[#7a2e2e] transition-colors"
    : `relative z-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-md border border-white/60 shadow-lg transition-all duration-500 hover:scale-110 active:scale-95 group overflow-hidden ${className}`;

  // Lyric position adjustment based on minimal/docked state
  const lyricPositionClass = minimal 
     ? "bottom-full mb-4 left-1/2 -translate-x-1/2 text-center" 
     : "bottom-full mb-3 right-0 md:bottom-auto md:right-full md:mr-6 md:top-1/2 md:-translate-y-1/2 justify-end";

  return (
    <div className={`relative ${!minimal ? 'group' : ''}`}>
        {/* --- Floating Lyrics Display --- */}
        <div className={`absolute ${lyricPositionClass} w-[280px] md:w-auto flex pointer-events-none z-0`}>
            <AnimatePresence mode="wait">
                {isPlaying && currentLyric && (
                    <motion.div
                        key={currentLyric}
                        initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -10, filter: "blur(2px)", transition: { duration: 0.5 } }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-lg border border-[#8E3535]/10 shadow-[0_4px_20px_rgba(142,53,53,0.08)]"
                    >
                        <p className="font-serif text-[#8E3535] text-sm md:text-base tracking-widest whitespace-nowrap italic">
                           {currentLyric}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* --- Music Button --- */}
        <button
          onClick={toggleMusic}
          className={containerStyle}
          aria-label={isPlaying ? "Mute background music" : "Play background music"}
        >
            <div className={`relative w-full h-full flex items-center justify-center ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
                {!minimal && <div className="absolute inset-[2px] rounded-full border-[1.5px] border-[#8E3535]/20 border-t-[#8E3535] border-l-[#8E3535]" />}
                
                <div className={`relative ${minimal ? 'w-5 h-5' : 'w-1/2 h-1/2'} text-current`}>
                    {isPlaying ? (
                         <div className="flex items-end justify-center gap-[2px] h-full pb-1">
                            <span className="w-1 bg-current rounded-t-sm animate-[pulse_1s_ease-in-out_infinite] h-[60%]" />
                            <span className="w-1 bg-current rounded-t-sm animate-[pulse_1.5s_ease-in-out_infinite_0.2s] h-[100%]" />
                            <span className="w-1 bg-current rounded-t-sm animate-[pulse_1.2s_ease-in-out_infinite_0.4s] h-[40%]" />
                         </div>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-full h-full pl-0.5">
                            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                            <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                        </svg>
                    )}
                </div>
            </div>

            {!isPlaying && !minimal && (
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[60%] h-[2px] bg-[#8E3535] rotate-45 rounded-full ring-1 ring-white" />
               </div>
            )}
            {!isPlaying && minimal && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <div className="w-[120%] h-[1.5px] bg-current rotate-45 rounded-full opacity-60" />
                </div>
            )}
        </button>
    </div>
  );
};
