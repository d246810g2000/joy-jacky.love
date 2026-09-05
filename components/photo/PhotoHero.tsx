import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { getBlurUrl, getHeroCoverUrl } from '../../utils/photoUrls';
import { APP_CONTENT } from '../../constants';
import { PHOTO_THEME } from '../../utils/photoTheme';

interface PhotoHeroProps {
  coverPublicId: string;
  compact?: boolean;
  welcomeTitle?: string;
  onScrollDown: () => void;
  onWatchFilm: () => void;
  onQuickSearch: () => void;
}

export const PhotoHero: React.FC<PhotoHeroProps> = ({
  coverPublicId,
  compact = false,
  welcomeTitle,
  onScrollDown,
  onWatchFilm,
  onQuickSearch,
}) => {
  const [coverLoaded, setCoverLoaded] = useState(false);
  const coverUrl = getHeroCoverUrl(coverPublicId);
  const blurUrl = getBlurUrl(coverPublicId);

  if (compact) {
    return (
      <section className="relative border-b border-white/10 bg-[#0c0b0a] px-4 pb-4 pt-[max(3.5rem,calc(env(safe-area-inset-top)+2.5rem))]">
        <p className="font-serif text-lg text-white">{welcomeTitle ?? '為您準備的照片'}</p>
        <p className="mt-1 text-sm text-white/50">{APP_CONTENT.chineseNames}</p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onWatchFilm}
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/80"
          >
            ▶ 婚宴影片
          </button>
          <button
            type="button"
            onClick={onQuickSearch}
            className="rounded-full bg-[#B08D55] px-4 py-2 text-xs text-white"
          >
            換人搜尋
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="photo-hero relative h-[85dvh] min-h-[480px] w-full overflow-hidden bg-[#0c0b0a] md:h-[100dvh] md:min-h-[560px]">
      <div className="photo-hero-kenburns absolute inset-0">
        {!coverLoaded && (
          <img
            src={blurUrl}
            alt=""
            className="absolute inset-0 h-full w-full scale-105 object-cover blur-md"
            aria-hidden
          />
        )}
        <img
          src={coverUrl}
          alt="Jacky & Joy 婚禮相簿"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
            coverLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          fetchPriority="high"
          onLoad={() => setCoverLoaded(true)}
        />
      </div>

      <div className="photo-film-grain pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-[#0c0b0a]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0c0b0a] via-transparent to-black/20" />

      <div className="relative z-10 flex h-full flex-col items-center justify-end px-5 pb-28 text-center md:px-6 md:pb-32">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7 }}
          className="font-mono text-[10px] tracking-[0.35em] text-[var(--photo-gold-light,#e6c896)]/90 md:text-xs md:tracking-[0.4em]"
        >
          WEDDING FILM & GALLERY
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="font-serif mt-3 text-3xl text-white md:mt-4 md:text-6xl"
        >
          {APP_CONTENT.coupleName}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.7 }}
          className="mt-2 text-sm text-white/65 md:mt-3 md:text-base"
        >
          {APP_CONTENT.chineseNames} · {APP_CONTENT.date}
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.7 }}
          className="mt-3 max-w-md text-sm font-light italic text-white/50"
        >
          {PHOTO_THEME.tagline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.7 }}
          className="mt-6 flex w-full max-w-sm flex-col gap-2.5 md:mt-8 md:max-w-none md:flex-row md:justify-center md:gap-3"
        >
          <button
            type="button"
            onClick={onQuickSearch}
            className="order-first rounded-full bg-[var(--photo-accent,#B08D55)] px-5 py-3.5 text-sm font-medium text-white shadow-lg shadow-[#B08D55]/25 md:order-none md:px-6 md:py-3"
          >
            🔍 輸入姓名找照片
          </button>
          <button
            type="button"
            onClick={onWatchFilm}
            className="flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/5 px-5 py-3.5 text-sm text-white/90 backdrop-blur-sm md:px-6 md:py-3"
          >
            <span aria-hidden>▶</span>
            觀看婚宴影片
          </button>
          <button
            type="button"
            onClick={onScrollDown}
            className="hidden rounded-full border border-white/15 px-5 py-3 text-sm text-white/70 md:inline"
          >
            瀏覽照片
          </button>
        </motion.div>
      </div>

      <button
        type="button"
        onClick={onScrollDown}
        aria-label="向下捲動瀏覽照片"
        className="photo-scroll-cta absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1 text-[10px] tracking-[0.3em] text-white/40 md:bottom-8"
      >
        <span>SCROLL</span>
        <svg
          className="h-4 w-4 animate-bounce motion-reduce:animate-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </section>
  );
};
