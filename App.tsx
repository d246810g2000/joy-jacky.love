
import React, { useState, useEffect, useRef } from 'react';
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
import { APP_CONTENT, WEDDING_PHOTOS, BACKGROUND_IMAGE } from './constants';
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

function App() {
  const navigate = useNavigate();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showNav, setShowNav] = useState(false);
  const [showRSVPButton, setShowRSVPButton] = useState(false);
  const [activeSection, setActiveSection] = useState('timeline');
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isGuestBookExpanded, setIsGuestBookExpanded] = useState(false);
  
  // New State for Collapsible Nav
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  
  // Ref to ignore scroll events when clicking nav items
  const isNavigatingRef = useRef(false);
  
  const [guestBookRefresh, setGuestBookRefresh] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
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
      
      // Dynamic speed for better UX
      // Progress calculation based on the ScrollExperience container
      const scrollRange = window.innerHeight * 1.8;
      const progress = Math.min(Math.max(window.scrollY / scrollRange, 0), 1);
      
      let speed = isMobile ? 1.4 : 2.2;
      if (progress < 0.25) {
        speed = isMobile ? 2.2 : 3.5; // Faster before the album flips
      } else if (progress < 0.5) {
        // Gradient slow down
        const t = (progress - 0.25) / (0.5 - 0.25);
        const startSpeed = isMobile ? 2.2 : 3.5;
        const endSpeed = isMobile ? 1.0 : 1.5;
        speed = startSpeed - (startSpeed - endSpeed) * t;
      } else if (progress < 0.85) {
        speed = isMobile ? 1.0 : 1.5; // Maintain slow speed during photo interaction
      }
      
      window.scrollBy(0, speed); 
      autoScrollRef.current = requestAnimationFrame(scroll);
    };
    
    autoScrollRef.current = requestAnimationFrame(scroll);
  };

  useEffect(() => {
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
        !selectedPhoto
      ) {
        startAutoScroll();
      }
    }, 1000);

    return () => {
      events.forEach(event => window.removeEventListener(event, updateInteraction));
      clearInterval(inactivityInterval);
      stopAutoScroll();
    };
  }, [isInitialLoading, isGuestBookExpanded, selectedPhoto]);

  // --- Asset Preloading ---
  useEffect(() => {
    const assetsToLoad = [BACKGROUND_IMAGE, ...WEDDING_PHOTOS.map(p => p.url), 'favicon.png'];
    const totalAssets = assetsToLoad.length;
    let loadedCount = 0;

    const updateProgress = () => {
      loadedCount++;
      const progress = (loadedCount / totalAssets) * 100;
      setLoadingProgress(progress);
    };

    assetsToLoad.forEach(url => {
      const img = new Image();
      img.src = url;
      img.onload = updateProgress;
      img.onerror = updateProgress; // Count as loaded even on error to avoid hanging
    });

    // Fallback timer to ensure it doesn't hang forever
    const timer = setTimeout(() => {
      setLoadingProgress(100);
    }, 10000);

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

  // --- Scroll Detection & Spy ---
  useEffect(() => {
    const handleScroll = () => {
      // 1. Show/Hide Nav based on Marquee Position
      // Nav items appear when marquee sticks to top
      const marquee = document.getElementById('sticky-marquee');
      if (marquee) {
          const rect = marquee.getBoundingClientRect();
          // We use 2px tolerance
          setShowNav(rect.top <= 2);
      }

      // 2. Show RSVP Button when invitation section starts appearing
      const invitation = document.getElementById('invitation-section');
      if (invitation) {
          const rect = invitation.getBoundingClientRect();
          // 出現時機：當信封完全消失時 (約在 invitation 區塊捲動 0.45 進度時)
          // 區塊高度為 150vh，0.45 進度即捲動 45vh (150vh - 100vh = 50vh 總捲動量)
          setShowRSVPButton(rect.top <= -window.innerHeight * 0.45);
      }

      // 3. Active Section Spy (Only if not manually navigating)
      if (!isNavigatingRef.current) {
          const viewportCenter = window.scrollY + (window.innerHeight / 2);
          
          const timeline = document.getElementById('timeline');
          const location = document.getElementById('location');
          const guestbook = document.getElementById('guestbook');
          
          // Default to timeline if we are past the marquee
          let current = 'timeline';

          if (guestbook && viewportCenter >= guestbook.offsetTop) {
             current = 'guestbook';
          } else if (location && viewportCenter >= location.offsetTop) {
             current = 'location';
          } else if (timeline && viewportCenter >= timeline.offsetTop) {
             current = 'timeline';
          }
          
          setActiveSection(current);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Navigation Items Config
  const navItems = [
    { id: 'timeline', icon: ClockIcon, label: '婚禮流程', targetId: 'timeline' },
    { id: 'location', icon: PinIcon, label: '婚宴地點', targetId: 'location' },
    { id: 'guestbook', icon: PenIcon, label: '祝福留言', targetId: 'guestbook' },
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

  const MarqueeContent = () => (
    <div className="flex items-center gap-6 md:gap-12 px-3 md:px-6 select-none whitespace-nowrap">
       <span className="font-display text-xs md:text-sm tracking-[0.25em] font-bold uppercase text-[#2c3e50]">
          Joy & Jacky
       </span>
       <span className="text-[#b08d55] text-[10px]">✦</span>
       <span className="font-serif text-sm md:text-base text-[#8E3535] font-medium tracking-wide">
          2026.05.30 週六午宴
       </span>
       <span className="text-[#b08d55] text-[10px]">✦</span>
       <span className="font-mono text-[10px] md:text-xs text-[#555] tracking-wider tabular-nums">
          {timeLeft.days}天 {fmt(timeLeft.hours)}時 {fmt(timeLeft.minutes)}分 {fmt(timeLeft.seconds)}秒
       </span>
       <span className="text-[#b08d55] text-[10px]">✦</span>
    </div>
  );

  return (
    <main className="w-full min-h-screen bg-transparent text-[#1a1a1a] selection:bg-[#b08d55] selection:text-white">
      
      <AnimatePresence>
        {isInitialLoading && (
          <LoadingScreen 
            progress={loadingProgress} 
            isMobile={isMobile}
            onComplete={() => {
              setIsInitialLoading(false);
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
        <section id="invitation-section" className="bg-transparent">
           <EnvelopeInvitation isMobile={isMobile} />
        </section>
        
        <section id="calendar-section" className="bg-transparent relative z-30">
            <CalendarRevealSection isMobile={isMobile} />
        </section>

        <div id="sticky-marquee" className={`sticky top-0 z-40 bg-white/60 backdrop-blur-md border-y border-white/40 shadow-sm overflow-hidden h-[48px] flex items-center transition-opacity duration-300 ${isGuestBookExpanded ? 'invisible opacity-0 pointer-events-none' : 'visible opacity-100'}`}>
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

        <section id="timeline" className="py-20 px-6 bg-white/20 backdrop-blur-sm">
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

        <section id="location" className="py-32 px-6 border-t border-white/40 bg-white/10 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto">
            <div className="mb-20">
               <p className="font-display text-[10px] text-[#b08d55] uppercase tracking-[0.4em] mb-3">02 / Venue</p>
               <h2 className="font-serif text-3xl md:text-4xl text-[#1a1a1a]">交通資訊</h2>
            </div>
            <LocationInfo />
          </div>
        </section>

        <section id="guestbook" className="py-32 px-6 border-t border-white/40 bg-white/20 backdrop-blur-sm">
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

        <footer className="py-40 px-6 text-center bg-transparent border-t border-stone-200 relative overflow-hidden">
           <div className="absolute inset-0 opacity-[0.4] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none mix-blend-multiply" />
           <div className="relative z-10 max-w-lg mx-auto">
              <span className="font-display text-[10px] tracking-[0.5em] uppercase text-[#b08d55] mb-8 block">Joy & Jacky Wedding</span>
              <h2 className="font-script text-7xl text-[#2c3e50] mb-8">RSVP</h2>
              <p className="text-stone-500 mb-12 text-sm tracking-wide leading-relaxed font-light">
                您的蒞臨將是我們最大的榮幸。<br/> 請於 4月30日 前確認出席。
              </p>
              
              <Link 
                to="/rsvp"
                className="relative group px-12 py-5 overflow-hidden rounded-[2px] 
                           bg-gradient-to-b from-[#9E4242] to-[#752a2a]
                           border border-[#b08d55]/30
                           shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_10px_30px_-10px_rgba(142,53,53,0.6)]
                           hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_20px_40px_-10px_rgba(142,53,53,0.8)]
                           transform hover:scale-[1.03] hover:-translate-y-1
                           transition-all duration-500 ease-out
                           inline-block"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-in-out z-0" />
                <div className="relative z-10 flex items-center gap-3">
                  <span className="font-serif text-white tracking-[0.3em] text-sm md:text-base font-medium">
                    填寫出席回函
                  </span>
                  <span className="text-[#d4af37] group-hover:translate-x-1 transition-transform duration-300">
                    →
                  </span>
                </div>
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20 pointer-events-none" />
              </Link>
           </div>
           
           <div className="mt-32 pt-10 border-t border-stone-200/60 text-[9px] text-stone-400 uppercase tracking-[0.4em]">
              Designed for Joy & Jacky
           </div>
        </footer>

      </div>

      {/* --- REIMAGINED NAVIGATION DOCK (Collapsible Pill) --- */}
      <div 
        className={`fixed bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out ${showNav && !isGuestBookExpanded ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0 pointer-events-none'}`}
      >
          <motion.div 
            layout
            initial={false}
            animate={{ 
                width: isNavExpanded ? "auto" : "var(--collapsed-width)",
                borderRadius: "9999px"
            }}
            // Match the Audio Button dimensions exactly (w-12 h-12 or w-14 h-14)
            style={{ "--collapsed-width": typeof window !== 'undefined' && window.innerWidth >= 768 ? "3.5rem" : "3.2rem" } as any}
            className={`
                bg-white/95 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.12)] 
                flex items-center overflow-hidden h-12 md:h-14
            `}
          >
             <AnimatePresence mode="wait">
                {isNavExpanded ? (
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
                                setIsNavExpanded(false);
                            }}
                            className="w-11 h-11 md:w-12 md:h-12 flex items-center justify-center rounded-full text-[#8E3535] hover:bg-stone-50 transition-colors duration-300 shrink-0"
                            aria-label="RSVP"
                         >
                            <InvitationIcon />
                         </button>

                         {/* Left Divider */}
                         <div className="w-px h-5 bg-stone-200 mx-0.5" />

                         {/* Nav Items */}
                         {navItems.map((item) => {
                           const isActive = activeSection === item.id;
                           return (
                              <button 
                                 key={item.id}
                                 onClick={() => handleNavClick(item.id, item.targetId)}
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
                            onClick={() => handleNavClick('home', 'home')}
                            className="w-11 h-11 md:w-12 md:h-12 flex items-center justify-center rounded-full text-[#8E3535] hover:bg-stone-50 transition-colors duration-300 shrink-0"
                            aria-label="Back to Top"
                        >
                            <HeartSolidIcon />
                        </button>
                        
                        {/* Close Button */}
                        <button 
                            onClick={() => setIsNavExpanded(false)}
                            className="w-11 h-11 md:w-12 md:h-12 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-colors duration-300 shrink-0 ml-1"
                        >
                            <XIcon />
                        </button>
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

      {/* Standalone Audio Button（點選音樂不算觸碰螢幕，不影響 1 秒後自動捲動） */}
      <div 
        data-no-interaction
        className={`fixed bottom-8 right-8 md:bottom-8 md:right-8 z-50 transition-all duration-500 ease-out ${!isGuestBookExpanded ? (isNavExpanded && isMobile ? '-translate-y-20 opacity-100' : 'translate-y-0 opacity-100') : 'translate-y-32 opacity-0 pointer-events-none'}`}
      >
          <BackgroundMusic className="w-12 h-12 md:w-14 md:h-14 shadow-lg" />
      </div>

      {/* Floating RSVP Button (Bottom Left) */}
      <div 
        className={`fixed bottom-8 left-8 z-50 transition-all duration-500 ease-out ${showRSVPButton && !isGuestBookExpanded && !isNavExpanded ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0 pointer-events-none'}`}
      >
        <Link 
          to="/rsvp"
          className={`flex items-center justify-center rounded-full bg-white/95 backdrop-blur-xl border border-[#8E3535]/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)] group hover:scale-105 transition-all duration-300 ${showNav ? 'w-12 h-12 p-0' : 'px-6 py-3 gap-2.5'}`}
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
