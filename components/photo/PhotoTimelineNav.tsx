import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { getStageAccent, getStageNavTime } from '../../utils/photoStageMeta';

export interface TimelineNavItem {
  id: string;
  time: string;
  label: string;
}

interface PhotoTimelineNavProps {
  items: TimelineNavItem[];
  activeStageId: string;
  onSelect: (stageId: string) => void;
  isSticky?: boolean;
  variant?: 'default' | 'dock';
}

function itemTime(item: TimelineNavItem): string {
  return getStageNavTime(item.id, item.time);
}

export const PhotoTimelineNav: React.FC<PhotoTimelineNavProps> = ({
  items,
  activeStageId,
  onSelect,
  isSticky = true,
  variant = 'default',
}) => {
  const isMobile = useIsMobile();
  const useDockPills = variant === 'dock' || !isMobile;
  const [sheetOpen, setSheetOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  const activeItem = items.find((i) => i.id === activeStageId) ?? items[0];
  const activeAccent = getStageAccent(activeStageId);

  useBodyScrollLock(sheetOpen);

  useEffect(() => {
    if (!useDockPills && isMobile) return;
    activeRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeStageId, isMobile, useDockPills]);

  const handleSelect = (id: string) => {
    onSelect(id);
    setSheetOpen(false);
  };

  if (isMobile && !useDockPills) {
    return (
      <>
        <nav
          className={`photo-timeline-nav ${isSticky ? 'sticky top-0 z-30' : ''}`}
          aria-label="婚禮時間軸"
        >
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3"
            aria-expanded={sheetOpen}
          >
            <div className="min-w-0 text-left">
              <p className="font-mono text-[10px] tracking-widest text-white/40">目前章節</p>
              <p className="truncate text-sm font-medium text-white">
                {itemTime(activeItem) && (
                  <span className="font-mono" style={{ color: activeAccent }}>
                    {itemTime(activeItem)}
                  </span>
                )}
                <span className={itemTime(activeItem) ? 'ml-2' : ''}>{activeItem?.label}</span>
              </p>
            </div>
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70"
              aria-hidden
            >
              ▼
            </span>
          </button>
        </nav>

        <AnimatePresence>
          {sheetOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/60"
                onClick={() => setSheetOpen(false)}
                aria-hidden
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="選擇婚禮章節"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                className="fixed inset-x-0 bottom-0 z-50 max-h-[75dvh] overflow-y-auto rounded-t-3xl bg-[#141210] p-4 photo-safe-bottom"
              >
                <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
                <h2 className="mb-4 px-1 font-serif text-lg text-white">婚禮時間軸</h2>
                <div className="flex flex-col gap-1.5">
                  {items.map((item) => {
                    const isActive = item.id === activeStageId;
                    const accent = getStageAccent(item.id);
                    const time = itemTime(item);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelect(item.id)}
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
                          isActive ? 'bg-white/10' : 'hover:bg-white/5'
                        }`}
                      >
                        {time ? (
                          <span
                            className="w-10 shrink-0 font-mono text-sm tabular-nums"
                            style={{ color: isActive ? accent : 'rgba(255,255,255,0.5)' }}
                          >
                            {time}
                          </span>
                        ) : (
                          <span className="w-10 shrink-0" aria-hidden />
                        )}
                        <span className={`text-sm ${isActive ? 'text-white' : 'text-white/70'}`}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <nav
      className={`photo-timeline-nav ${isSticky ? 'sticky top-0 z-30' : ''} ${
        variant === 'dock' ? 'border-t-0' : ''
      }`}
      aria-label="婚禮時間軸"
      style={{ '--nav-accent': activeAccent } as React.CSSProperties}
    >
      <div
        ref={navRef}
        className={`no-scrollbar flex snap-x snap-mandatory gap-1.5 overflow-x-auto ${
          variant === 'dock' ? 'px-3 py-2' : 'px-3 py-2.5 md:justify-center md:px-6 md:py-3'
        }`}
      >
        {items.map((item) => {
          const isActive = item.id === activeStageId;
          const accent = getStageAccent(item.id);
          const isDock = variant === 'dock';
          const time = itemTime(item);
          return (
            <button
              key={item.id}
              ref={isActive ? activeRef : undefined}
              type="button"
              onClick={() => onSelect(item.id)}
              aria-current={isActive ? 'step' : undefined}
              title={isDock ? `${time} ${item.label}`.trim() : undefined}
              className={`shrink-0 snap-center rounded-full border px-3 py-1.5 text-xs transition-all duration-300 ${
                isDock ? 'py-1.5' : 'md:px-4 md:py-2 md:text-sm'
              } ${
                isActive
                  ? 'photo-timeline-nav-active border-transparent text-white'
                  : 'border-white/10 bg-white/5 text-white/65 hover:border-white/25 hover:bg-white/10'
              } ${isActive && isDock ? 'scale-105' : ''}`}
              style={
                isActive
                  ? {
                      background: `linear-gradient(135deg, ${accent}cc, ${accent}88)`,
                      boxShadow: isDock
                        ? `0 0 20px ${accent}55, 0 4px 12px rgba(0,0,0,0.35)`
                        : undefined,
                    }
                  : undefined
              }
            >
              {isDock ? (
                <span className="flex items-center gap-1.5 font-medium">
                  {time && (
                    <span className="font-mono text-[10px] tabular-nums opacity-75">{time}</span>
                  )}
                  <span>{item.label}</span>
                </span>
              ) : (
                <>
                  {time && <span className="font-mono font-medium tabular-nums">{time}</span>}
                  <span className={time ? 'ml-1.5' : ''}>{item.label}</span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
