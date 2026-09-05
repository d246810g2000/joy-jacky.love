import React, { useState } from 'react';
import { getFilmEmbedUrl, getFilmWatchUrl } from '../../utils/weddingFilm';

interface PhotoInlineFilmProps {
  startSec: number;
  title: string;
  filmTime: string;
  accent?: string;
}

export const PhotoInlineFilm: React.FC<PhotoInlineFilmProps> = ({
  startSec,
  title,
  filmTime,
  accent = '#B08D55',
}) => {
  const [playing, setPlaying] = useState(false);
  const watchUrl = getFilmWatchUrl(startSec);

  return (
    <div className="photo-inline-film">
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        {playing ? (
          <iframe
            key={startSec}
            src={getFilmEmbedUrl(startSec)}
            title={title}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-black/40 to-black/70"
            style={{
              background: `linear-gradient(160deg, ${accent}33 0%, rgba(0,0,0,0.85) 55%)`,
            }}
            aria-label={`播放 ${title}`}
          >
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full text-lg text-white shadow-lg"
              style={{ background: `${accent}cc` }}
            >
              ▶
            </span>
            <span className="px-4 text-center text-sm font-medium text-white">{title}</span>
            <span className="text-xs text-white/50">影片 {filmTime}</span>
          </button>
        )}
      </div>
      {playing && (
        <div className="flex items-center justify-between gap-2 border-t border-white/8 bg-black/40 px-3 py-1.5">
          <p className="min-w-0 truncate text-[11px] text-white/55">
            {title} · 影片 {filmTime}
          </p>
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-[11px] text-[#e6c896]"
          >
            YouTube ↗
          </a>
        </div>
      )}
    </div>
  );
};
