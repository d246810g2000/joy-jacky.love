
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ScrollExperience } from './components/ScrollExperience';
import { EnvelopeInvitation } from './components/EnvelopeInvitation';
import { CalendarRevealSection } from './components/CalendarRevealSection';
import { Timeline } from './components/Timeline';
import { LocationInfo } from './components/LocationInfo';
import { GuestBook } from './components/GuestBook';
import { Lightbox } from './components/Lightbox';
import { BackgroundMusic } from './components/BackgroundMusic';
import { LoadingScreen } from './components/LoadingScreen';
import { APP_CONTENT, WEDDING_PHOTOS, BACKGROUND_IMAGE, THREADS_POST_IMAGE, BINGO_SHOW_ON_HOME_KEY } from './constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Photo } from './types';
import { useIsMobile } from './hooks/useIsMobile';

// --- Assets & Icons ---

// Solid Heart for the Home/Top Button
const HeartSolidIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);

const PenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
  </svg>
);

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
  </svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const InvitationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

const HelpCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
  </svg>
);

const VideoPlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-amber-600">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
  </svg>
);

const BingoGridIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-emerald-600">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6zM3.75 9h16.5M3.75 15h16.5M9 3.75v16.5M15 3.75v16.5" />
  </svg>
);

const HeartPulseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-rose-600">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 11.5h1.5l1.5-3 1.5 5 1.5-3H16" />
  </svg>
);

const MusicNoteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-indigo-600">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 10l12-3" />
    <circle cx="6" cy="19" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-[#B08D55]">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
  </svg>
);

const GamepadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.25 15a.75.75 0 11-.75-.75.75.75 0 01.75.75zm1.5-2.25a.75.75 0 11-.75-.75.75.75 0 01.75.75zM7.5 12h3m-1.5-1.5v3m-5-2.25C4 9.172 6.015 7.5 8.5 7.5h7c2.485 0 4.5 1.672 4.5 3.75v1.5c0 2.078-2.015 3.75-4.5 3.75h-7C6.015 16.5 4 14.828 4 12.75v-1.5z" />
  </svg>
);

import { useModalHistory } from './hooks/useModalHistory';
function App() {
  const navigate = useNavigate();
  // Check session storage to skip loading if already visited
  const [isInitialLoading, setIsInitialLoading] = useState(() => {
    return !sessionStorage.getItem('hasVisited');
  });
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showNav, setShowNav] = useState(false);
  const [showRSVPButton, setShowRSVPButton] = useState(false);
  const [activeSection, setActiveSection] = useState('timeline');
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isGuestBookExpanded, setIsGuestBookExpanded] = useState(false);
  const [visitCount, setVisitCount] = useState<number | null>(null);
  const [displayCount, setDisplayCount] = useState(0);

  // New State for Collapsible Nav
  const [isNavExpanded, setIsNavExpanded] = useState(false);

  // Ref to ignore scroll events when clicking nav items
  const isNavigatingRef = useRef(false);

  const [guestBookRefresh, setGuestBookRefresh] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isHoveringFlyingPhoto, setIsHoveringFlyingPhoto] = useState(false);

  // --- Modal History Integration ---
  useModalHistory(!!selectedPhoto, () => setSelectedPhoto(null));
  useModalHistory(isGuestBookExpanded, () => setIsGuestBookExpanded(false));

  const hoverCountRef = useRef(0);
  const onPhotoHoverChange = useCallback((hovering: boolean) => {
    hoverCountRef.current = Math.max(0, hoverCountRef.current + (hovering ? 1 : -1));
    setIsHoveringFlyingPhoto(hoverCountRef.current > 0);
  }, []);
  const isMobile = useIsMobile(768);

  // --- Auto Scroll Logic ---
  const lastInteractionRef = useRef(Date.now());
  const autoScrollRef = useRef<number | null>(null);

  const stopAutoScroll = () => {
    if (autoScrollRef.current) {
      cancelAnimationFrame(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  };

  const startAutoScroll = () => {
    if (autoScrollRef.current) return;

    const scroll = () => {
      // Check if we reached the bottom
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1) {
        stopAutoScroll();
        return;
      }

      // 到達跑馬燈時停止自動滾動
      const marqueeEl = document.getElementById('sticky-marquee');
      if (marqueeEl) {
        const rect = marqueeEl.getBoundingClientRect();
        if (rect.top <= 0) {
          stopAutoScroll();
          return;
        }
      }

      // Dynamic speed for better UX
      // Progress calculation based on the ScrollExperience container
      const scrollRange = window.innerHeight * 1.8;
      const progress = Math.min(Math.max(window.scrollY / scrollRange, 0), 1);

      let speed = isMobile ? 2.8 : 2.2;
      if (progress < 0.25) {
        speed = isMobile ? 4.5 : 3.5; // Faster before the album flips
      } else if (progress < 0.5) {
        // Gradient slow down
        const t = (progress - 0.25) / (0.5 - 0.25);
        const startSpeed = isMobile ? 4.5 : 3.5;
        const endSpeed = isMobile ? 1.8 : 1.5;
        speed = startSpeed - (startSpeed - endSpeed) * t;
      } else if (progress < 0.85) {
        speed = isMobile ? 1.8 : 1.5; // Maintain slow speed during photo interaction
      }

      window.scrollBy(0, speed);
      autoScrollRef.current = requestAnimationFrame(scroll);
    };

    autoScrollRef.current = requestAnimationFrame(scroll);
  };

  useEffect(() => {
    // 剛載入或從其他頁面返回首頁時，提供 4 秒緩衝防抖，防止一進來就立刻自動滾動
    lastInteractionRef.current = Date.now() + 4000;

    const updateInteraction = (e: Event) => {
      const target = e.target as HTMLElement;
      // 點選音樂開啟不算觸碰螢幕，不重置計時
      if (target?.closest?.('[data-no-interaction]')) return;
      lastInteractionRef.current = Date.now();
      stopAutoScroll();
    };

    const events = ['mousedown', 'wheel', 'touchstart', 'touchmove', 'keydown'];
    events.forEach(event => window.addEventListener(event, updateInteraction, { passive: true }));

    const inactivityInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastInteraction = now - lastInteractionRef.current;

      // 停留 1 秒就開始自動捲動（手機與電腦皆同）
      if (
        timeSinceLastInteraction >= 1000 &&
        !isInitialLoading &&
        !isGuestBookExpanded &&
        !isNavigatingRef.current &&
        !selectedPhoto &&
        !isHoveringFlyingPhoto
      ) {
        startAutoScroll();
      }
    }, 1000);

    return () => {
      events.forEach(event => window.removeEventListener(event, updateInteraction));
      clearInterval(inactivityInterval);
      stopAutoScroll();
    };
  }, [isInitialLoading, isGuestBookExpanded, selectedPhoto, isHoveringFlyingPhoto]);

  // 滑鼠放在飛出相片上時停止自動捲動
  useEffect(() => {
    if (isHoveringFlyingPhoto) stopAutoScroll();
  }, [isHoveringFlyingPhoto]);

  // --- 記憶與還原首頁滾動高度 (Scroll Restoration) ---
  useEffect(() => {
    let isReadyToSave = false;
    
    // 延遲 1800ms 才允許儲存滾動高度，防止路由切換重置滾動時的錯誤觸發覆蓋
    const readyTimer = setTimeout(() => {
      isReadyToSave = true;
    }, 1800);

    const handleSaveScroll = () => {
      if (!isInitialLoading && isReadyToSave && window.scrollY > 0) {
        sessionStorage.setItem('home_scroll_y', String(window.scrollY));
      }
    };
    window.addEventListener('scroll', handleSaveScroll, { passive: true });
    return () => {
      clearTimeout(readyTimer);
      window.removeEventListener('scroll', handleSaveScroll);
    };
  }, [isInitialLoading]);

  useEffect(() => {
    if (!isInitialLoading) {
      const savedScrollY = sessionStorage.getItem('home_scroll_y');
      if (savedScrollY) {
        const y = parseInt(savedScrollY, 10);
        // 使用多階段時間差滾動，確保在非同步圖片、組件載入撐開高度後能精準還原滾動高度
        const scrollTicks = [30, 80, 150, 300, 600, 1000, 1500];
        const timers = scrollTicks.map(delay =>
          setTimeout(() => {
            window.scrollTo({
              top: y,
              behavior: 'auto'
            });
          }, delay)
        );
        return () => timers.forEach(clearTimeout);
      }
    }
  }, [isInitialLoading]);

  // --- Asset Preloading（只擋關鍵資源，其餘 lazy 載入）---
  useEffect(() => {
    const compressedUrls = WEDDING_PHOTOS.map(p => p.compressedUrl ?? p.url);

    // 關鍵資源：背景 + 封面 + 頭像 + 預覽圖 + 前 6 張照片
    // 確保這些都在 Loading 結束前載好
    const criticalUrls = [
      BACKGROUND_IMAGE,
      `${import.meta.env.BASE_URL}book-cover.png`, // Album Cover
      WEDDING_PHOTOS[0].url, // Avatar (used in GuestBook/Threads)
      THREADS_POST_IMAGE, // Threads Post Image
      ...compressedUrls.slice(0, 6)
    ];

    const CRITICAL_COUNT = criticalUrls.length;
    const allUrls = [BACKGROUND_IMAGE, ...compressedUrls];
    let loadedCount = 0;
    let criticalLoaded = 0;

    const finishWhenReady = () => {
      if (criticalLoaded >= CRITICAL_COUNT) setLoadingProgress(100);
    };

    const updateProgress = (isCritical: boolean) => () => {
      loadedCount++;
      if (isCritical) criticalLoaded++;
      const progress = Math.min(100, (loadedCount / allUrls.length) * 100);
      setLoadingProgress(progress);
      finishWhenReady();
    };

    criticalUrls.forEach((url, i) => {
      const img = new Image();
      img.src = url;
      img.onload = updateProgress(true);
      img.onerror = updateProgress(true);
    });
    allUrls.slice(CRITICAL_COUNT).forEach(url => {
      const img = new Image();
      img.src = url;
      img.onload = updateProgress(false);
      img.onerror = updateProgress(false);
    });

    const timer = setTimeout(() => setLoadingProgress(100), 4000);
    return () => clearTimeout(timer);
  }, []);

  // --- Countdown Logic ---
  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(APP_CONTENT.dateISO) - +new Date();
      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        };
      }
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- Visit Counter Logic ---
  useEffect(() => {
    const fetchVisitCount = async () => {
      if (!APP_CONTENT.googleScriptUrl || !APP_CONTENT.googleScriptUrl.startsWith('http')) {
        return;
      }
      try {
        const hasCounted = sessionStorage.getItem('has_counted_visit');
        const action = hasCounted ? 'get_visit' : 'visit';
        
        const separator = APP_CONTENT.googleScriptUrl.includes('?') ? '&' : '?';
        const url = `${APP_CONTENT.googleScriptUrl}${separator}action=${action}&t=${Date.now()}`;
        
        const response = await fetch(url, {
          method: 'GET',
          redirect: 'follow',
        });

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          throw new Error("HTML_RESPONSE");
        }

        if (response.ok) {
          const data = await response.json();
          if (data && typeof data.count === 'number') {
            setVisitCount(data.count);
            sessionStorage.setItem('has_counted_visit', 'true');
          }
        }
      } catch (error) {
        console.warn("Failed to fetch/update visit count:", error);
      }
    };

    fetchVisitCount();
  }, []);

  // --- Visit Counter Dynamic Rolling Animation ---
  useEffect(() => {
    if (visitCount === null) return;
    let start = 0;
    if (visitCount > 80) {
      start = Math.floor(visitCount * 0.85); // 從 85% 開始跑數，提升大數值下的動畫流暢度
    }
    const end = visitCount;
    const duration = 1200; // 1.2 秒完成跑動
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // 減速動畫曲線 (easeOutQuad)
      const easeProgress = progress * (2 - progress);
      const current = Math.floor(start + (end - start) * easeProgress);
      setDisplayCount(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [visitCount]);

  // --- Scroll Detection & Spy ---
  // --- 捲動事件偵測與監控 (IntersectionObserver 優化版) ---
  useEffect(() => {
    // 1. 設定觀察者
    const observerOptions = {
      root: null,
      rootMargin: '-50% 0px -50% 0px', // 視窗中心點
      threshold: 0
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !isNavigatingRef.current) {
          setActiveSection(entry.target.id);
        }
      });
    }, observerOptions);

    // 觀察主要區塊
    const sections = ['timeline', 'location', 'guestbook', 'photos', 'games'];
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) sectionObserver.observe(el);
    });

    // 2. 導覽列顯示控制 - 觀察 Sticky Marquee 上方的哨兵元素
    const navSentinelObserver = new IntersectionObserver(([entry]) => {
      // 若哨兵元素（位於 Marquee 上方）離開畫面頂部，代表 Marquee 已固定 -> 顯示導覽列
      if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
        setShowNav(true);
      } else if (entry.isIntersecting) {
        setShowNav(false);
      }
    }, { rootMargin: "0px 0px 0px 0px", threshold: 0 });

    const navSentinel = document.getElementById('nav-sentinel');
    if (navSentinel) navSentinelObserver.observe(navSentinel);

    // 3. RSVP 按鈕顯示控制 - 觀察 Invitation 區塊內的哨兵元素
    const rsvpSentinelObserver = new IntersectionObserver(([entry]) => {
      // 若哨兵元素（位於約 45vh 處）離開畫面頂部，代表已捲動至足夠深處 -> 顯示 RSVP 按鈕
      if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
        setShowRSVPButton(true);
      } else if (entry.isIntersecting) {
        setShowRSVPButton(false);
      }
    }, { root: null, threshold: 0 });

    const rsvpSentinel = document.getElementById('rsvp-sentinel');
    if (rsvpSentinel) rsvpSentinelObserver.observe(rsvpSentinel);

    return () => {
      sectionObserver.disconnect();
      navSentinelObserver.disconnect();
      rsvpSentinelObserver.disconnect();
    };
  }, []);

  // Navigation Items Config
  const navItems = [
    { id: 'timeline', icon: ClockIcon, label: '婚禮流程', targetId: 'timeline' },
    { id: 'location', icon: PinIcon, label: '婚宴地點', targetId: 'location' },
    { id: 'guestbook', icon: PenIcon, label: '祝福留言', targetId: 'guestbook' },
    { id: 'photos', icon: CameraIcon, label: '婚禮相簿', targetId: 'photos' },
    { id: 'games', icon: GamepadIcon, label: '互動遊戲', targetId: 'games' },
  ];

  const handleNavClick = (id: string, targetId: string) => {
    isNavigatingRef.current = true;
    setActiveSection(id); // Immediate UI update

    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const el = document.getElementById(targetId);
      if (el) {
        const marqueeHeight = 48;
        const elementPosition = el.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - marqueeHeight;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    }

    // Auto collapse after selection for cleaner UX
    // setTimeout(() => setIsNavExpanded(false), 300);

    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 1000);
  };

  const fmt = (n: number) => String(n).padStart(2, '0');

  const MarqueeContent = () => {
    const isWeddingEnded = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

    return (
      <div className="flex items-center gap-6 md:gap-12 px-3 md:px-6 select-none whitespace-nowrap">
        {visitCount !== null && (
          <>
            <span className="font-serif text-xs md:text-sm text-[#8E3535] font-medium tracking-wide">
              親友足跡 ✦ <span className="font-sans font-semibold text-[#b08d55]">{displayCount.toLocaleString()}</span>
            </span>
            <span className="text-[#b08d55] text-[10px]">✦</span>
          </>
        )}
        <span className="font-display text-xs md:text-sm tracking-[0.25em] font-bold uppercase text-[#2c3e50]">
          Joy & Jacky
        </span>
        <span className="text-[#b08d55] text-[10px]">✦</span>
        <span className="font-serif text-sm md:text-base text-[#8E3535] font-medium tracking-wide">
          2026.05.30 週六午宴
        </span>
        <span className="text-[#b08d55] text-[10px]">✦</span>
        {isWeddingEnded ? (
          <>
            <span className="font-serif text-xs md:text-sm text-[#8E3535] font-semibold tracking-wider">
              🎉 婚禮已圓滿落幕，感謝大家的出席與溫馨祝福！
            </span>
            <Link
              to="/photo"
              onClick={() => sessionStorage.setItem('home_scroll_y', String(window.scrollY))}
              className="font-serif text-xs md:text-sm text-[#B08D55] font-medium hover:underline"
            >
              瀏覽婚禮相簿 →
            </Link>
          </>
        ) : (
          <span className="font-mono text-[10px] md:text-xs text-[#555] tracking-wider tabular-nums">
            {timeLeft.days}天 {fmt(timeLeft.hours)}時 {fmt(timeLeft.minutes)}分 {fmt(timeLeft.seconds)}秒
          </span>
        )}
        <span className="text-[#b08d55] text-[10px]">✦</span>
      </div>
    );
  };

  return (
    <main className="w-full min-h-screen bg-transparent text-[#1a1a1a] selection:bg-[#b08d55] selection:text-white">

      <AnimatePresence>
        {isInitialLoading && (
          <LoadingScreen
            progress={loadingProgress}
            isMobile={isMobile}
            onComplete={() => {
              setIsInitialLoading(false);
              sessionStorage.setItem('hasVisited', 'true');
              // Set last interaction to 3s ago, so the 5s inactivity check will trigger in 2s
              lastInteractionRef.current = Date.now() - 3000;
            }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10">
        <ScrollExperience
          selectedPhoto={selectedPhoto}
          setSelectedPhoto={setSelectedPhoto}
          isMobile={isMobile}
          isHoveringFlyingPhoto={isHoveringFlyingPhoto}
          onPhotoHoverChange={onPhotoHoverChange}
        />
      </div>

      <AnimatePresence>
        {selectedPhoto && (
          <Lightbox
            photo={selectedPhoto}
            allPhotos={WEDDING_PHOTOS}
            onClose={() => setSelectedPhoto(null)}
            onPhotoChange={setSelectedPhoto}
            isMobile={isMobile}
          />
        )}
      </AnimatePresence>

      <div className="relative z-20 -mt-[100vh]">
        <section id="invitation-section" className="bg-transparent relative">
          <EnvelopeInvitation isMobile={isMobile} />
          {/* RSVP 按鈕顯示觸發點（約捲動至 45% 時） */}
          <div id="rsvp-sentinel" className="absolute top-[45vh] left-0 w-full h-px pointer-events-none opacity-0" />
        </section>

        <section id="calendar-section" className="bg-transparent relative z-30">
          <CalendarRevealSection isMobile={isMobile} />
        </section>

        {/* 導覽列顯示觸發點（當 Marquee 頂到畫面頂部時） */}
        <div id="nav-sentinel" className="absolute w-full h-px -mt-px z-50 pointer-events-none opacity-0" />
        <div id="sticky-marquee" className={`sticky top-0 z-40 ${isMobile ? 'bg-white/95 border-b border-stone-100' : 'bg-white/60 backdrop-blur-md border-y border-white/40'} shadow-sm overflow-hidden h-[48px] flex items-center transition-opacity duration-300 ${isGuestBookExpanded ? 'invisible opacity-0 pointer-events-none' : 'visible opacity-100'}`}>
          <motion.div
            className="flex flex-nowrap min-w-max"
            animate={{ x: "-50%" }}
            transition={{ repeat: Infinity, duration: 45, ease: "linear" }}
          >
            <div className="flex items-center">
              {[...Array(6)].map((_, i) => (
                <MarqueeContent key={`set1-${i}`} />
              ))}
            </div>
            <div className="flex items-center">
              {[...Array(6)].map((_, i) => (
                <MarqueeContent key={`set2-${i}`} />
              ))}
            </div>
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent pointer-events-none mix-blend-overlay" />
        </div>

        <section id="timeline" className={`py-20 px-6 ${isMobile ? 'bg-white' : 'bg-white/20 backdrop-blur-sm'}`}>
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 border-b border-[#2c3e50]/10 pb-10 gap-6">
              <div className="space-y-2">
                <p className="font-display text-[10px] text-[#b08d55] uppercase tracking-[0.4em]">01 / Program</p>
                <h2 className="font-serif text-3xl md:text-4xl text-[#1a1a1a]">婚禮流程</h2>
              </div>
              <p className="text-[#717171] text-xs max-w-[240px] leading-relaxed">
                誠摯邀請您共度這美好的午後時光，分享我們的喜悅。
              </p>
            </div>
            <Timeline />
          </div>
        </section>

        <section id="location" className={`py-32 px-6 border-t border-white/40 ${isMobile ? 'bg-stone-50' : 'bg-white/10 backdrop-blur-sm'}`}>
          <div className="max-w-5xl mx-auto">
            <div className="mb-20">
              <p className="font-display text-[10px] text-[#b08d55] uppercase tracking-[0.4em] mb-3">02 / Venue</p>
              <h2 className="font-serif text-3xl md:text-4xl text-[#1a1a1a]">交通資訊</h2>
            </div>
            <LocationInfo />
          </div>
        </section>

        <section id="guestbook" className={`py-32 px-6 border-t border-white/40 ${isMobile ? 'bg-white' : 'bg-white/20 backdrop-blur-sm'}`}>
          <div className="max-w-5xl mx-auto mb-16">
            <p className="font-display text-[10px] text-[#b08d55] uppercase tracking-[0.4em] mb-3">03 / Memories</p>
            <h2 className="font-serif text-3xl md:text-4xl text-[#1a1a1a]">祝福留言</h2>
          </div>
          <GuestBook
            onExpandChange={setIsGuestBookExpanded}
            refreshTrigger={guestBookRefresh}
            onWriteMessage={() => navigate('/rsvp')}
          />
        </section>

        {/* 婚禮相簿 — 精選入口 */}
        <section id="photos" className={`py-20 px-6 border-t border-white/40 ${isMobile ? 'bg-[#FDFBF7]' : 'bg-white/20 backdrop-blur-sm'}`}>
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
              <div className="space-y-2">
                <p className="font-display text-[10px] text-[#b08d55] uppercase tracking-[0.4em]">Wedding Gallery</p>
                <h2 className="font-serif text-3xl md:text-4xl text-[#1a1a1a]">婚禮相簿</h2>
              </div>
              <p className="text-[#717171] text-xs max-w-[320px] leading-relaxed font-light">
                輸入姓名或桌號，秒找屬於您的照片。依時間軸重溫迎賓、二進、敬酒到送客的每個精彩瞬間。
              </p>
            </div>

            <Link
              to="/photo"
              onClick={() => sessionStorage.setItem('home_scroll_y', String(window.scrollY))}
              className="group block overflow-hidden rounded-2xl border border-[#E8E1D5] bg-white shadow-md hover:shadow-xl transition-all duration-300"
            >
              <div className="grid md:grid-cols-5">
                <div className="md:col-span-2 relative min-h-[200px] md:min-h-[260px] overflow-hidden">
                  <img
                    src="https://res.cloudinary.com/djqnqxzha/image/upload/f_auto,q_auto,w_800/wedding_20260530/260530-57.jpg"
                    alt="婚禮相簿預覽"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-white/10" />
                </div>
                <div className="md:col-span-3 p-6 md:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#FDFBF7] border border-[#E8E1D5] flex items-center justify-center">
                      <CameraIcon />
                    </div>
                    <span className="text-xs tracking-[0.2em] text-[#B08D55] uppercase font-display">Photo Album</span>
                  </div>
                  <h3 className="font-serif text-2xl md:text-3xl text-[#2C3E50] mb-3">找回您的婚禮瞬間</h3>
                  <p className="text-stone-500 text-sm leading-relaxed mb-6 max-w-lg">
                    支援桌號 1–27、姓名與親友關係搜尋。掃描桌卡 QR 亦可直達專屬照片，並可下載原檔、分享給親友。
                  </p>
                  <span className="inline-flex items-center gap-2 self-start rounded-full bg-[#B08D55] px-6 py-2.5 text-sm font-semibold text-white group-hover:bg-[#9a7849] transition-colors">
                    進入婚禮相簿
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </section>

        <section id="games" className={`py-32 px-6 border-t border-white/40 ${isMobile ? 'bg-stone-50' : 'bg-white/10 backdrop-blur-sm'}`}>
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 border-b border-[#2c3e50]/10 pb-10 gap-6">
              <div className="space-y-2">
                <p className="font-display text-[10px] text-[#b08d55] uppercase tracking-[0.4em]">04 / Celebration Zone</p>
                <h2 className="font-serif text-3xl md:text-4xl text-[#1a1a1a]">婚禮同樂區</h2>
              </div>
              <p className="text-[#717171] text-xs max-w-[280px] leading-relaxed font-light">
                現場備有婚禮相簿、互動遊戲、婚禮應援與專屬歌單，歡迎點擊與我們一起同樂！
              </p>
            </div>

            {/* 遊戲卡片排版 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              {/* 卡片 1: 快問快答 */}
              <div className="glass-panel p-4 sm:p-6 md:p-8 rounded-2xl border border-stone-200/50 shadow-md flex flex-col justify-between items-start space-y-4 md:space-y-6 hover:shadow-xl transition-all duration-300">
                <div className="space-y-3 w-full">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                    <VideoPlayIcon />
                  </div>
                  <h3 className="font-serif text-base md:text-xl text-stone-800 font-bold">新人故事考驗</h3>
                  <p className="text-stone-500 text-[10px] md:text-xs leading-relaxed font-light line-clamp-3 lg:line-clamp-none">
                    在遊戲開始前，重溫新人甜蜜愛情影片！挑戰 13 道趣味問答，看看您對新人的故事有多熟悉，還能與賓客一較高下！
                  </p>
                </div>
                <Link
                  to="/quiz"
                  onClick={() => sessionStorage.setItem('home_scroll_y', String(window.scrollY))}
                  className="w-full text-center px-3 py-2 sm:px-6 sm:py-2.5 bg-[#8E3535] hover:bg-[#7a2e2e] active:scale-[0.98] text-white rounded-lg text-[10px] sm:text-xs font-semibold tracking-wider transition-all shadow-sm"
                >
                  開始快問快答
                </Link>
              </div>

              {/* 卡片 2: 賓果遊戲 */}
              <div className="glass-panel p-4 sm:p-6 md:p-8 rounded-2xl border border-stone-200/50 shadow-md flex flex-col justify-between items-start space-y-4 md:space-y-6 hover:shadow-xl transition-all duration-300">
                <div className="space-y-3 w-full">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <BingoGridIcon />
                  </div>
                  <h3 className="font-serif text-base md:text-xl text-stone-800 font-bold">賓果抽獎遊戲</h3>
                  <p className="text-stone-500 text-[10px] md:text-xs leading-relaxed font-light line-clamp-3 lg:line-clamp-none">
                    直接顯示的幸運賓果！挑選喜愛的 5x5 動物字卡，點擊選取完成送出，即可與現場同步開獎，祝您幸運連線！
                  </p>
                </div>
                <Link
                  to="/bingo"
                  onClick={() => sessionStorage.setItem('home_scroll_y', String(window.scrollY))}
                  className="w-full text-center px-3 py-2 sm:px-6 sm:py-2.5 bg-[#8E3535] hover:bg-[#7a2e2e] active:scale-[0.98] text-white rounded-lg text-[10px] sm:text-xs font-semibold tracking-wider transition-all shadow-sm"
                >
                  開始賓果連線
                </Link>
              </div>

              {/* 卡片 3: 婚禮應援 */}
              <div className="glass-panel p-4 sm:p-6 md:p-8 rounded-2xl border border-stone-200/50 shadow-md flex flex-col justify-between items-start space-y-4 md:space-y-6 hover:shadow-xl transition-all duration-300">
                <div className="space-y-3 w-full">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-rose-50 flex items-center justify-center">
                    <HeartPulseIcon />
                  </div>
                  <h3 className="font-serif text-base md:text-xl text-stone-800 font-bold">婚禮應援</h3>
                  <p className="text-stone-500 text-[10px] md:text-xs leading-relaxed font-light line-clamp-3 lg:line-clamp-none">
                    💓 心跳節奏 即將解鎖 ♫ 有些旋律，藏著青春裡的熱血；有些節拍，等待大家大聲回應。黃底歌詞出現時，一起喊出來吧！🎤🔥
                  </p>
                </div>
                <Link
                  to="/cheer"
                  onClick={() => sessionStorage.setItem('home_scroll_y', String(window.scrollY))}
                  className="w-full text-center px-3 py-2 sm:px-6 sm:py-2.5 bg-[#8E3535] hover:bg-[#7a2e2e] active:scale-[0.98] text-white rounded-lg text-[10px] sm:text-xs font-semibold tracking-wider transition-all shadow-sm"
                >
                  查看應援指南
                </Link>
              </div>

              {/* 卡片 4: 婚禮歌單 */}
              <div className="glass-panel p-4 sm:p-6 md:p-8 rounded-2xl border border-stone-200/50 shadow-md flex flex-col justify-between items-start space-y-4 md:space-y-6 hover:shadow-xl transition-all duration-300">
                <div className="space-y-3 w-full">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <MusicNoteIcon />
                  </div>
                  <h3 className="font-serif text-base md:text-xl text-stone-800 font-bold">婚禮歌單</h3>
                  <p className="text-stone-500 text-[10px] md:text-xs leading-relaxed font-light line-clamp-3 lg:line-clamp-none">
                    🎵 幸福旋律 即將播放 💓 有些歌收藏著年少悸動；有些旋律承載著專屬默契。我們把心動與陪伴寫進這份歌單，讓音符溫慢每個片刻 ♡
                  </p>
                </div>
                <Link
                  to="/playlist"
                  onClick={() => sessionStorage.setItem('home_scroll_y', String(window.scrollY))}
                  className="w-full text-center px-3 py-2 sm:px-6 sm:py-2.5 bg-[#8E3535] hover:bg-[#7a2e2e] active:scale-[0.98] text-white rounded-lg text-[10px] sm:text-xs font-semibold tracking-wider transition-all shadow-sm"
                >
                  前往婚禮歌單
                </Link>
              </div>

              {/* 卡片 5: 婚禮相簿 */}
              <div className="glass-panel p-4 sm:p-6 md:p-8 rounded-2xl border border-stone-200/50 shadow-md flex flex-col justify-between items-start space-y-4 md:space-y-6 hover:shadow-xl transition-all duration-300">
                <div className="space-y-3 w-full">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[#FDFBF7] border border-[#E8E1D5] flex items-center justify-center">
                    <CameraIcon />
                  </div>
                  <h3 className="font-serif text-base md:text-xl text-stone-800 font-bold">婚禮相簿</h3>
                  <p className="text-stone-500 text-[10px] md:text-xs leading-relaxed font-light line-clamp-3 lg:line-clamp-none">
                    📸 輸入姓名或桌號，秒找您的照片。時間軸重溫迎賓到送客，支援下載原檔與分享連結。
                  </p>
                </div>
                <Link
                  to="/photo"
                  onClick={() => sessionStorage.setItem('home_scroll_y', String(window.scrollY))}
                  className="w-full text-center px-3 py-2 sm:px-6 sm:py-2.5 bg-[#B08D55] hover:bg-[#9a7849] active:scale-[0.98] text-white rounded-lg text-[10px] sm:text-xs font-semibold tracking-wider transition-all shadow-sm"
                >
                  瀏覽婚禮照片
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="py-40 px-6 text-center bg-transparent border-t border-stone-200 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.4] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none mix-blend-multiply" />
          <div className="relative z-10 max-w-lg mx-auto">
            <span className="font-display text-[10px] tracking-[0.5em] uppercase text-[#b08d55] mb-8 block">Joy & Jacky Wedding</span>
            <h2 className="font-script text-7xl text-[#2c3e50] mb-8">RSVP</h2>

            {/* 連結按鈕組 */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <Link
                to="/invitation"
                className="inline-flex items-center gap-2.5 px-7 py-3 rounded-full border border-[#b08d55]/50 text-[#8E3535] text-sm tracking-[0.3em] uppercase font-display hover:bg-[#8E3535] hover:text-white hover:border-[#8E3535] transition-all duration-400 shadow-sm hover:shadow-lg group w-full sm:w-auto justify-center"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                查看電子喜帖
              </Link>
              <Link
                to="/photo"
                className="inline-flex items-center gap-2.5 px-7 py-3 rounded-full border border-[#E8E1D5] text-[#B08D55] text-sm tracking-[0.2em] uppercase font-display hover:bg-[#B08D55] hover:text-white hover:border-[#B08D55] transition-all duration-400 shadow-sm hover:shadow-lg group w-full sm:w-auto justify-center"
              >
                <CameraIcon />
                婚禮相簿
              </Link>
            </div>
            <p className="text-stone-500 mb-12 text-sm tracking-wide leading-relaxed font-light">
              您的蒞臨將是我們最大的榮幸。<br /> 請於 4月30日 前確認出席。
            </p>

            <div className="flex flex-col md:flex-row items-stretch justify-center gap-10 md:gap-16">
              {/* Vertical RSVP Button */}
              <motion.div
                whileHover={{ y: -5 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="flex flex-col w-auto self-center md:w-auto px-4 md:px-0"
              >
                <Link
                  to="/rsvp"
                  className="relative group overflow-hidden rounded-[4px] 
                                 bg-gradient-to-br from-[#8E3535] via-[#752a2a] to-[#5d2121]
                                 border border-[#b08d55]/40
                                 shadow-[0_10px_25px_-5px_rgba(142,53,53,0.3)]
                                 hover:shadow-[0_20px_40px_-10px_rgba(142,53,53,0.4)]
                                 transition-all duration-500 ease-out
                                 flex flex-col items-center justify-center
                                 /* Mobile: Balanced Horizontal, Desktop: Elegant Vertical */
                                 px-8 py-5 md:px-10 md:py-0 md:h-full md:min-h-[320px]
                                 min-w-[200px] md:min-w-0"
                >
                  {/* Inner Decorative Border */}
                  <div className="absolute inset-1.5 border border-[#b08d55]/20 rounded-[2px] pointer-events-none" />

                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 ease-in-out z-0" />

                  <div className="relative z-10 flex flex-col items-center">
                    <div className="flex flex-row md:flex-col items-center gap-3 md:gap-0">
                      <span
                        className="font-serif text-white tracking-[0.3em] text-base md:text-xl font-medium"
                        style={{ writingMode: isMobile ? 'horizontal-tb' : 'vertical-rl' } as any}
                      >
                        填寫出席回函
                      </span>

                      <div className="h-px w-8 bg-[#d4af37]/30 my-2 hidden md:block" />

                      <span className="text-[#d4af37] transition-transform duration-500 group-hover:translate-x-1 md:group-hover:translate-x-0 md:group-hover:translate-y-1">
                        {isMobile ? '→' : '↓'}
                      </span>
                    </div>
                  </div>

                  {/* Corner Accents */}
                  <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#d4af37]/40 m-2" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-[#d4af37]/40 m-2" />
                </Link>
              </motion.div>

              {/* LINE Contact - Styled as a matching card */}
              <div className="flex flex-col items-center group relative px-4 md:px-0">
                <motion.div
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="relative h-full"
                >
                  <div className="absolute -inset-4 bg-[#b08d55]/5 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  <div className="relative h-full rounded-xl overflow-hidden shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12)] group-hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.18)] transition-all duration-500 border border-stone-100 bg-white">
                    <img
                      src={APP_CONTENT.lineQrCode}
                      alt="LINE QR Code"
                      className="w-56 h-auto md:w-64 block mx-auto"
                    />
                    {/* Clickable Area Overlay */}
                    <a
                      href={APP_CONTENT.lineLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute z-10 hover:bg-black/[0.02] transition-all duration-300 flex items-center justify-center"
                      style={{
                        left: '14.12%',   // 240 / 1699
                        top: '75.27%',    // 1620 / 2152
                        width: '72.16%',  // (1466-240) / 1699
                        height: '14.68%'  // (1936-1620) / 2152
                      }}
                      title="點擊加入 LINE 官方帳號"
                    >
                      <motion.span
                        animate={{ opacity: [0.6, 1, 0.6], y: [0, -1, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="font-serif text-[#8E3535] text-[10px] md:text-[13px] tracking-[0.2em] font-medium"
                      >
                        點擊加入 LINE 好友
                      </motion.span>
                    </a>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          <div className="mt-32 pt-10 border-t border-stone-200/60 text-[9px] text-stone-400 uppercase tracking-[0.4em]">
            Designed for Joy & Jacky
          </div>
        </footer>

      </div>

      {/* --- REIMAGINED NAVIGATION DOCK：電腦版直接展開，手機版可收合為漢堡 --- */}
      {(() => {
        const navExpanded = !isMobile || isNavExpanded;
        return (
          <div
            className={`fixed bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out ${showNav && !isGuestBookExpanded ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0 pointer-events-none'}`}
          >
            <motion.div
              layout
              initial={false}
              animate={{
                width: navExpanded ? "auto" : "var(--collapsed-width)",
                borderRadius: "9999px"
              }}
              style={{ "--collapsed-width": typeof window !== 'undefined' && window.innerWidth >= 768 ? "3.5rem" : "3.2rem" } as any}
              className={`
                ${isMobile ? 'bg-white/95 border-stone-200' : 'bg-white/95 backdrop-blur-md md:backdrop-blur-xl border-white/80'} 
                border shadow-[0_8px_32px_rgba(0,0,0,0.12)] 
                flex items-center overflow-hidden h-12 md:h-14
            `}
            >
              <AnimatePresence mode="wait">
                {navExpanded ? (
                  <motion.div
                    key="expanded"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center px-1.5 gap-1"
                  >
                    {/* RSVP Button */}
                    <button
                      onClick={() => {
                        navigate('/rsvp');
                        if (isMobile) setIsNavExpanded(false);
                      }}
                      className="w-11 h-11 md:w-12 md:h-12 flex items-center justify-center rounded-full text-[#8E3535] hover:bg-stone-50 transition-colors duration-300 shrink-0"
                      aria-label="RSVP"
                    >
                      <InvitationIcon />
                    </button>

                    {/* Photo Gallery */}
                    <button
                      onClick={() => {
                        navigate('/photo');
                        if (isMobile) setIsNavExpanded(false);
                      }}
                      className="w-11 h-11 md:w-12 md:h-12 flex items-center justify-center rounded-full text-[#B08D55] hover:bg-stone-50 transition-colors duration-300 shrink-0"
                      aria-label="婚禮相簿"
                    >
                      <CameraIcon />
                    </button>

                    {/* Left Divider */}
                    <div className="w-px h-5 bg-stone-200 mx-0.5" />

                    {/* Nav Items */}
                    {navItems.map((item) => {
                      const isActive = activeSection === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => { handleNavClick(item.id, item.targetId); if (isMobile) setIsNavExpanded(false); }}
                          className="relative w-11 h-11 md:w-12 md:h-12 flex items-center justify-center rounded-full z-10 transition-colors duration-200 group shrink-0"
                          aria-label={item.label}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="active-pill"
                              className="absolute inset-1 bg-[#8E3535] rounded-full shadow-[0_4px_12px_rgba(142,53,53,0.4)] z-0"
                              transition={{ type: "spring", stiffness: 350, damping: 28, mass: 0.8 }}
                            />
                          )}
                          <span className={`relative z-10 transition-colors duration-200 ${isActive ? 'text-white' : 'text-stone-400 group-hover:text-stone-600'}`}>
                            <item.icon />
                          </span>
                        </button>
                      );
                    })}

                    {/* Divider */}
                    <div className="w-px h-5 bg-stone-200 mx-0.5" />

                    {/* Home Button */}
                    <button
                      onClick={() => { handleNavClick('home', 'home'); if (isMobile) setIsNavExpanded(false); }}
                      className="w-11 h-11 md:w-12 md:h-12 flex items-center justify-center rounded-full text-[#8E3535] hover:bg-stone-50 transition-colors duration-300 shrink-0"
                      aria-label="Back to Top"
                    >
                      <HeartSolidIcon />
                    </button>

                    {/* 僅手機版顯示收合按鈕；電腦版導覽列常駐展開 */}
                    {isMobile && (
                      <button
                        onClick={() => setIsNavExpanded(false)}
                        className="w-11 h-11 md:w-12 md:h-12 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-colors duration-300 shrink-0 ml-1"
                      >
                        <XIcon />
                      </button>
                    )}
                  </motion.div>
                ) : (
                  <motion.button
                    key="collapsed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsNavExpanded(true)}
                    className="w-full h-full flex items-center justify-center text-[#8E3535] hover:text-[#7a2e2e] transition-colors"
                    aria-label="Open Menu"
                  >
                    <MenuIcon />
                  </motion.button>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        );
      })()}

      {/* Standalone Audio Button（點選音樂不算觸碰螢幕，不影響 1 秒後自動捲動） */}
      <div
        data-no-interaction
        className={`fixed bottom-8 right-8 md:bottom-8 md:right-8 z-50 transition-all duration-500 ease-out ${!isGuestBookExpanded ? (isNavExpanded && isMobile ? '-translate-y-20 opacity-100' : 'translate-y-0 opacity-100') : 'translate-y-32 opacity-0 pointer-events-none'}`}
      >
        <BackgroundMusic className="w-12 h-12 md:w-14 md:h-14 shadow-lg" />
      </div>

      {/* Floating RSVP Button (Bottom Left) */}
      <div
        className={`fixed bottom-8 left-8 z-50 transition-all duration-500 ease-out ${showRSVPButton && !isGuestBookExpanded && !showNav ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0 pointer-events-none'}`}
      >
        <Link
          to="/rsvp"
          className={`flex items-center justify-center rounded-full ${isMobile ? 'bg-white/95 border-stone-200/50' : 'bg-white/95 backdrop-blur-md md:backdrop-blur-xl border-[#8E3535]/20'} border shadow-[0_8px_32px_rgba(0,0,0,0.12)] group hover:scale-105 transition-all duration-300 ${showNav ? 'w-12 h-12 p-0' : 'px-6 py-3 gap-2.5'}`}
        >
          <span className="text-[#8E3535] group-hover:scale-110 transition-transform duration-300">
            <InvitationIcon />
          </span>
          {!showNav && (
            <span className="font-serif text-[#8E3535] text-sm md:text-base tracking-widest font-medium">
              出席回函
            </span>
          )}
        </Link>
      </div>

    </main>
  );
}

export default App;
