import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { PhotoCommandDock } from '../components/photo/PhotoCommandDock';
import { PhotoHero } from '../components/photo/PhotoHero';
import { PhotoTimelineNav } from '../components/photo/PhotoTimelineNav';
import { PhotoMasonryGrid } from '../components/photo/PhotoMasonryGrid';
import { PhotoSearchBar } from '../components/photo/PhotoSearchBar';
import { PhotoFilterDrawer } from '../components/photo/PhotoFilterDrawer';
import { PhotoLightbox } from '../components/photo/PhotoLightbox';
import { PhotoVideoPlayer } from '../components/photo/PhotoVideoPlayer';
import {
  EMPTY_FILTER,
  filterPhotos,
  filterLabel,
  isFilterEmpty,
} from '../utils/photoFilters';
import { getLightboxUrl } from '../utils/photoUrls';
import { getStageFilmMarker, getStageFilmStart } from '../utils/weddingFilm';
import { addRecentSearch } from '../utils/photoRecentSearch';
import { useTimelineSync } from '../hooks/useTimelineSync';
import { usePhotoDeepLink } from '../hooks/usePhotoDeepLink';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useModalHistory } from '../hooks/useModalHistory';
import { useWeddingPhotos } from '../hooks/useWeddingPhotos';
import { useIsMobile } from '../hooks/useIsMobile';
import type { PhotoFilter, WeddingPhoto } from '../types';

function GridSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`space-y-10 px-4 ${compact ? 'pb-8 pt-4' : 'space-y-14 pb-32 pt-8'} md:px-8`}>
      {[0, 1].map((section) => (
        <div key={section}>
          <div className="photo-skeleton-dark mb-6 h-28 rounded-2xl" />
          <div className="photo-masonry">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="photo-skeleton-dark mb-3 break-inside-avoid rounded-2xl"
                style={{ height: i % 2 === 0 ? 220 : 280 }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface VideoState {
  startSec: number;
  title: string;
  subtitle?: string;
}

const PhotoPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const { data, loading, error } = useWeddingPhotos();
  const useDockLayout = isMobile;

  const tableParam = searchParams.get('table');
  const nameParam = searchParams.get('name');
  const skipHero = !!(tableParam || nameParam);

  const [filter, setFilter] = useState<PhotoFilter>(EMPTY_FILTER);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<WeddingPhoto | null>(null);
  const [videoState, setVideoState] = useState<VideoState | null>(null);
  const [showNav, setShowNav] = useState(skipHero);
  const [welcomeMsg, setWelcomeMsg] = useState<string | null>(null);
  const [expandSearch, setExpandSearch] = useState(false);
  const scrolledToResults = useRef(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const [galleryEl, setGalleryEl] = useState<HTMLElement | null>(null);

  const stages = data?.WEDDING_STAGES ?? [];
  const allPhotos = data?.ALL_WEDDING_PHOTOS ?? [];
  const heroCoverId = data?.HERO_COVER_PUBLIC_ID ?? 'disney-v-01';

  const navItems = useMemo(
    () =>
      stages.map((s) => ({
        id: s.id,
        time: s.time,
        label: s.title.replace(/^\d{1,2}:\d{2}\s*/, '') || s.title,
      })),
    [stages]
  );

  const isFiltered = !isFilterEmpty(filter);
  const filteredPhotos = useMemo(
    () => (isFiltered && data ? filterPhotos(stages, filter) : null),
    [filter, isFiltered, stages, data]
  );

  const stageIds = stages.map((s) => s.id);
  const { activeStageId, scrollToStage, registerSection } = useTimelineSync(
    stageIds,
    useDockLayout && !isFiltered ? galleryEl : null
  );

  useEffect(() => {
    setGalleryEl(galleryRef.current);
  }, [loading, useDockLayout]);

  const activeMarker = getStageFilmMarker(activeStageId);

  const displayPhotos = filteredPhotos ?? allPhotos;
  const currentFilterLabel = filterLabel(filter);

  const welcomeTitle = tableParam
    ? `第 ${tableParam} 桌的照片`
    : nameParam
      ? `「${nameParam}」的照片`
      : undefined;

  const closeLightbox = useCallback(() => {
    setSelectedPhoto(null);
    const path = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, '', path);
  }, []);

  const closeVideo = useCallback(() => setVideoState(null), []);

  useModalHistory(!!selectedPhoto, closeLightbox);

  const openVideo = useCallback(
    (stageId: string) => {
      if (useDockLayout) {
        scrollToStage(stageId);
        return;
      }
      const marker = getStageFilmMarker(stageId);
      const stage = stages.find((s) => s.id === stageId);
      setVideoState({
        startSec: getStageFilmStart(stageId),
        title: stage?.title.replace(/^\d{1,2}:\d{2}\s*/, '') || marker?.label || '婚宴影片',
        subtitle: marker
          ? `影片 ${marker.filmTime} · ${stage?.description || marker.description}`
          : stage?.description,
      });
    },
    [stages, useDockLayout, scrollToStage]
  );

  const openFullFilm = useCallback(() => {
    setVideoState({
      startSec: 0,
      title: '完整婚宴紀錄',
      subtitle: 'Joy & Jacky · 2026.05.30',
    });
  }, []);

  const openPhoto = useCallback((photo: WeddingPhoto) => {
    setSelectedPhoto(photo);
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${window.location.search}#${photo.id}`
    );
  }, []);

  const { syncUrl, clearDeepLink } = usePhotoDeepLink({
    filter,
    setFilter,
    onOpenPhoto: (id) => {
      const photo = allPhotos.find((p) => p.id === id);
      if (photo) setSelectedPhoto(photo);
    },
  });

  useEffect(() => {
    if (!data) return;
    const hash = window.location.hash.replace(/^#/, '');
    if (hash && !selectedPhoto) {
      const photo = allPhotos.find((p) => p.id === hash);
      if (photo) setSelectedPhoto(photo);
    }
  }, [data, allPhotos, selectedPhoto]);

  useEffect(() => {
    if (!useDockLayout) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [useDockLayout]);

  useEffect(() => {
    if (!skipHero || scrolledToResults.current || loading) return;
    scrolledToResults.current = true;
    requestAnimationFrame(() => {
      if (galleryRef.current) {
        galleryRef.current.scrollTo({ top: 0, behavior: 'auto' });
      } else {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    });
  }, [skipHero, loading]);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Joy & Jacky 婚禮相簿';

    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const ogImage = document.querySelector('meta[property="og:image"]');
    const prevOgTitle = ogTitle?.getAttribute('content') ?? '';
    const prevOgDesc = ogDesc?.getAttribute('content') ?? '';
    const prevOgImage = ogImage?.getAttribute('content') ?? '';

    ogTitle?.setAttribute('content', 'Joy & Jacky 婚禮相簿');
    ogDesc?.setAttribute(
      'content',
      '沿著婚禮影片時間軸，重溫照片與影像交織的每個精彩瞬間。輸入姓名或桌號，秒找屬於您的照片。'
    );

    if (tableParam) setWelcomeMsg(`為您顯示第 ${tableParam} 桌的照片`);
    else if (nameParam) setWelcomeMsg(`為您顯示「${nameParam}」的照片`);

    return () => {
      document.title = prevTitle;
      ogTitle?.setAttribute('content', prevOgTitle);
      ogDesc?.setAttribute('content', prevOgDesc);
      ogImage?.setAttribute('content', prevOgImage);
    };
  }, [tableParam, nameParam]);

  useEffect(() => {
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) return;
    if (selectedPhoto) {
      ogImage.setAttribute('content', getLightboxUrl(selectedPhoto.publicId));
    }
  }, [selectedPhoto]);

  useEffect(() => {
    if (!isFiltered) return;
    if (galleryRef.current) {
      galleryRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isFiltered, currentFilterLabel]);

  useEffect(() => {
    if (useDockLayout) return;
    const onScroll = () => {
      if (skipHero) {
        setShowNav(true);
        return;
      }
      setShowNav(window.scrollY > window.innerHeight * 0.5);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [skipHero, useDockLayout]);

  useBodyScrollLock(drawerOpen || !!selectedPhoto);

  useEffect(() => {
    if (isFiltered) syncUrl(filter, selectedPhoto?.id ?? null);
  }, [filter, isFiltered, syncUrl, selectedPhoto?.id]);

  const handleClearFilter = () => {
    setFilter(EMPTY_FILTER);
    clearDeepLink();
  };

  const handleTagClick = (tag: string) => {
    const next: PhotoFilter = { ...EMPTY_FILTER, tag, query: tag };
    setFilter(next);
    setSelectedPhoto(null);
    syncUrl(next);
  };

  const handleNameClick = (name: string) => {
    const next: PhotoFilter = { ...EMPTY_FILTER, name, query: name };
    setFilter(next);
    setSelectedPhoto(null);
    syncUrl(next);
  };

  const handleFilterChange = (next: PhotoFilter) => {
    setFilter(next);
    syncUrl(next);
  };

  const handleQuickSearch = (query: string) => {
    addRecentSearch(query);
    const trimmed = query.trim();
    const tableNum = parseInt(trimmed, 10);
    if (!Number.isNaN(tableNum) && String(tableNum) === trimmed) {
      handleFilterChange({ ...EMPTY_FILTER, table: tableNum, query: trimmed });
    } else {
      handleFilterChange({ ...EMPTY_FILTER, name: trimmed, query: trimmed });
    }
  };

  const handleScrollDown = () => {
    const firstStage = document.getElementById(`stage-${stageIds[0]}`);
    firstStage?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleWatchFromLightbox = (stageId: string) => {
    closeLightbox();
    openVideo(stageId);
  };

  const hideSearchBar = !!selectedPhoto || !!videoState || useDockLayout;

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0b0a] p-8 text-center">
        <p className="text-white/80">相簿載入失敗，請重新整理頁面</p>
      </div>
    );
  }

  return (
    <div
      className={`photo-page photo-page-immersive relative ${
        useDockLayout ? 'flex h-dvh flex-col overflow-hidden' : 'min-h-screen'
      }`}
      style={
        activeMarker && !isFiltered
          ? ({ '--stage-glow': activeMarker.accent } as React.CSSProperties)
          : undefined
      }
    >
      <div className="photo-ambient-glow pointer-events-none fixed inset-0 -z-10" aria-hidden />
      <div className="fixed inset-0 -z-20 bg-[#0c0b0a]" aria-hidden />

      {useDockLayout ? (
        <>
          <PhotoCommandDock
            navItems={isFiltered ? [] : navItems}
            activeStageId={activeStageId}
            onStageSelect={scrollToStage}
            welcomeTitle={welcomeTitle}
            resultCount={isFiltered ? displayPhotos.length : null}
            hasFilter={isFiltered}
            filterLabel={currentFilterLabel}
            autoExpandSearch={expandSearch}
            onExpandSearchHandled={() => setExpandSearch(false)}
            onSearch={handleQuickSearch}
            onOpenDrawer={() => setDrawerOpen(true)}
            onClearFilter={handleClearFilter}
          />

          {welcomeMsg && isFiltered && (
            <div className="shrink-0 border-b border-white/10 bg-black/50 px-4 py-2 text-center text-xs text-white/80">
              {welcomeMsg}
              <button
                type="button"
                onClick={() => setWelcomeMsg(null)}
                className="ml-2 text-[#e6c896]"
              >
                知道了
              </button>
            </div>
          )}

          <div
            ref={galleryRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
          >
            {loading ? (
              <GridSkeleton compact />
            ) : (
              <PhotoMasonryGrid
                stages={stages}
                filteredPhotos={filteredPhotos}
                isFiltered={isFiltered}
                onPhotoClick={openPhoto}
                onTagClick={handleTagClick}
                onNameClick={handleNameClick}
                onWatchVideo={openVideo}
                registerSection={registerSection}
                filterLabel={currentFilterLabel}
                onClearFilter={handleClearFilter}
                compactHeaders
              />
            )}
          </div>
        </>
      ) : (
        <>
      <Link
        to="/"
        className="fixed left-4 top-4 z-40 rounded-full border border-white/15 bg-black/40 px-3 py-2 text-xs text-white/85 shadow-sm backdrop-blur-md photo-safe-top hover:bg-black/55"
      >
        ← 返回喜帖
      </Link>

      <PhotoHero
        coverPublicId={heroCoverId}
        compact={skipHero}
        welcomeTitle={welcomeTitle}
        onScrollDown={handleScrollDown}
        onWatchFilm={openFullFilm}
        onQuickSearch={() => setExpandSearch(true)}
      />

      {showNav && !isFiltered && !loading && navItems.length > 0 && (
        <PhotoTimelineNav
          items={navItems}
          activeStageId={activeStageId}
          onSelect={scrollToStage}
        />
      )}

      {welcomeMsg && isFiltered && !skipHero && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-14 z-20 mx-4 mt-2 rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-center text-sm text-white/85 shadow-sm backdrop-blur-md md:mx-8"
        >
          {welcomeMsg}
          <button
            type="button"
            onClick={() => setWelcomeMsg(null)}
            className="ml-2 text-[#e6c896] hover:underline"
          >
            知道了
          </button>
        </motion.div>
      )}

      {loading ? (
        <GridSkeleton />
      ) : (
        <PhotoMasonryGrid
          stages={stages}
          filteredPhotos={filteredPhotos}
          isFiltered={isFiltered}
          onPhotoClick={openPhoto}
          onTagClick={handleTagClick}
          onNameClick={handleNameClick}
          onWatchVideo={openVideo}
          registerSection={registerSection}
          filterLabel={currentFilterLabel}
          onClearFilter={handleClearFilter}
        />
      )}

      <PhotoSearchBar
        resultCount={isFiltered ? displayPhotos.length : null}
        hasFilter={isFiltered}
        filterLabel={currentFilterLabel}
        hidden={hideSearchBar}
        autoExpand={expandSearch}
        onExpandHandled={() => setExpandSearch(false)}
        onSearch={handleQuickSearch}
        onOpenDrawer={() => setDrawerOpen(true)}
        onClearFilter={handleClearFilter}
      />
        </>
      )}

      <PhotoFilterDrawer
        open={drawerOpen}
        filter={filter}
        onChange={handleFilterChange}
        onClose={() => setDrawerOpen(false)}
        resultCount={isFiltered ? displayPhotos.length : undefined}
      />

      <AnimatePresence>
        {selectedPhoto && (
          <PhotoLightbox
            photo={selectedPhoto}
            allPhotos={displayPhotos}
            filter={filter}
            onClose={closeLightbox}
            onChange={(p) => {
              setSelectedPhoto(p);
              window.history.replaceState(
                null,
                '',
                `${window.location.pathname}${window.location.search}#${p.id}`
              );
            }}
            onTagClick={(tag) => {
              closeLightbox();
              handleTagClick(tag);
              setDrawerOpen(false);
            }}
            onNameClick={(name) => {
              closeLightbox();
              handleNameClick(name);
              setDrawerOpen(false);
            }}
            onWatchFilm={handleWatchFromLightbox}
          />
        )}
      </AnimatePresence>

      {!useDockLayout && (
      <PhotoVideoPlayer
        open={!!videoState}
        startSec={videoState?.startSec ?? 0}
        title={videoState?.title ?? ''}
        subtitle={videoState?.subtitle}
        onClose={closeVideo}
      />
      )}
    </div>
  );
};

export default PhotoPage;
