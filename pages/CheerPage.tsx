import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function CheerPage() {
  const navigate = useNavigate();
  const cheerImg1 = `${import.meta.env.BASE_URL}cheer_1.jpg`;
  const cheerImg2 = `${import.meta.env.BASE_URL}cheer_2.jpg`;

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
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/60 border border-[#8E3535]/20 text-[#8E3535] hover:bg-[#8E3535] hover:text-white transition-all shadow-xs group cursor-pointer"
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
          婚禮應援：Cheer
        </span>
      </header>

      {/* 內容區塊 */}
      <main className="w-full max-w-4xl flex flex-col items-center z-20 my-6 px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full bg-white/60 backdrop-blur-lg border border-white/50 rounded-3xl p-6 md:p-10 shadow-[0_15px_40px_-15px_rgba(142,53,53,0.1)] flex flex-col items-center text-center space-y-8"
        >
          {/* 文案介紹區 */}
          <div className="space-y-6 max-w-xl">
            <h2 className="text-[#8E3535] text-2xl md:text-3xl font-bold tracking-wider font-serif">
              💓 心跳節奏 即將解鎖 ♫
            </h2>
            
            <div className="text-stone-600 leading-loose text-sm md:text-base space-y-4 font-serif">
              <p>有些旋律，藏著青春裡的熱血；</p>
              <p>有些節拍，等待大家一起大聲回應。</p>
              <p>我們把滿滿的歡笑與悸動，悄悄寫進了這場婚禮應援裡 ✨</p>
            </div>

            {/* 黃底高亮歌詞提示 */}
            <div className="pt-2">
              <span className="bg-amber-100/80 border border-amber-200/60 px-4 py-2 rounded-full inline-block text-[#8E3535] font-semibold text-xs md:text-sm shadow-xs animate-pulse">
                黃底歌詞出現的時候，記得一起大聲喊出來吧！🎤🔥
              </span>
            </div>
          </div>

          {/* 圖片展示區 */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden rounded-2xl shadow-md border border-white/40 bg-stone-100"
            >
              <img
                src={cheerImg1}
                alt="婚禮應援 1"
                className="w-full h-auto object-cover max-h-[500px]"
                loading="lazy"
              />
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden rounded-2xl shadow-md border border-white/40 bg-stone-100"
            >
              <img
                src={cheerImg2}
                alt="婚禮應援 2"
                className="w-full h-auto object-cover max-h-[500px]"
                loading="lazy"
              />
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
