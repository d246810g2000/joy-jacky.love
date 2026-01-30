
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GuestBookEntry } from '../types';
import { WEDDING_PHOTOS, APP_CONTENT, THREADS_POST_IMAGE } from '../constants';

// --- Mock Data for Fallback ---
const MOCK_ENTRIES: GuestBookEntry[] = [
  {
    id: 'mock-1',
    name: 'Emily Chen',
    message: '恭喜 Joy & Jacky！祝你們永浴愛河，白頭偕老！💖 婚禮當天見～',
    timestamp: Date.now() - 1000 * 60 * 30, // 30 mins ago
    likes: 12,
    isLiked: false
  },
  {
    id: 'mock-2',
    name: 'Michael Chang',
    message: '終於等到這一天了！看著你們一路走來真的很感動，一定要幸福喔！🥂',
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    likes: 8,
    isLiked: true
  },
  {
    id: 'mock-3',
    name: 'Sarah Lin',
    message: 'So happy for you two! Can\'t wait to celebrate your big day! 🎉',
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    likes: 5,
    isLiked: false
  },
  {
    id: 'mock-4',
    name: 'David Wu',
    message: '新婚快樂！祝早生貴子👶',
    timestamp: Date.now() - 1000 * 60 * 60 * 48, // 2 days ago
    likes: 3,
    isLiked: false
  }
];

// --- Threads Style Icons ---
const ThreadsBackIcon = () => (
  <svg aria-label="Back" fill="none" height="24" role="img" viewBox="0 0 24 24" width="24">
    <path d="M21 12H3m0 0l7.7-7.7M3 12l7.7 7.7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
  </svg>
);

const ThreadsLikeIcon = ({ filled, size = 20 }: { filled: boolean, size?: number }) => (
  <svg aria-label="Like" fill={filled ? "#ff3040" : "none"} height={size} role="img" viewBox="0 0 24 24" width={size}>
    <path d={filled ? "M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.956-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938Z" : "M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.956-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938Z"} stroke={filled ? "none" : "currentColor"} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
  </svg>
);

const ThreadsCommentIcon = () => (
  <svg aria-label="Comment" fill="none" height="20" role="img" viewBox="0 0 24 24" width="20">
    <path d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"></path>
  </svg>
);

const ThreadsShareIcon = () => (
    <svg aria-label="Share" fill="none" height="20" role="img" viewBox="0 0 24 24" width="20">
        <line fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" x1="22" x2="9.218" y1="3" y2="10.083"></line>
        <polygon fill="none" points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"></polygon>
    </svg>
);

const ThreadsMoreIcon = () => (
  <svg aria-label="More" fill="currentColor" height="20" role="img" viewBox="0 0 24 24" width="20">
    <circle cx="12" cy="12" r="1.5"></circle>
    <circle cx="6" cy="12" r="1.5"></circle>
    <circle cx="18" cy="12" r="1.5"></circle>
  </svg>
);

const MiniHeartIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-[#ff3040]">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

// Helper to format time loosely
const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return '剛剛';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分鐘`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小時`;
    return `${Math.floor(diff / 86400000)}天`;
};

// Helper for generating consistent avatar colors
const getAvatarColor = (name: string) => {
    const colors = ['bg-red-100 text-red-600', 'bg-blue-100 text-blue-600', 'bg-green-100 text-green-600', 'bg-yellow-100 text-yellow-600', 'bg-purple-100 text-purple-600', 'bg-pink-100 text-pink-600', 'bg-stone-100 text-stone-600'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
};

// --- Extracted Components ---

interface CouplePostProps {
  likes: number;
  isLiked: boolean;
  onLike: () => void;
  onComment: () => void;
}

const CouplePost: React.FC<CouplePostProps> = ({ likes, isLiked, onLike, onComment }) => {
    return (
      <div className="flex gap-3 relative">
          <div className="flex flex-col items-center gap-2">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-stone-100 bg-stone-50 z-10 cursor-pointer">
                  <img src={WEDDING_PHOTOS[0].url} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              {/* Thread Line */}
              <div className="w-[2px] flex-grow bg-stone-200/60 my-1 rounded-full min-h-[40px]" />
          </div>

          <div className="flex-1 pb-4">
              <div className="flex justify-between items-start">
                  <div>
                      <h3 className="text-[15px] font-bold text-black leading-none">joy-jacky.love</h3>
                      <div className="text-[13px] text-stone-500 mt-0.5 flex items-center gap-1">
                        <span>李謦伊</span>
                        <MiniHeartIcon />
                        <span>張家銘</span>
                      </div>
                  </div>
                  <div className="flex items-center gap-3">
                      <span className="text-[13px] text-stone-400">2026-05-30</span>
                      <ThreadsMoreIcon />
                  </div>
              </div>

              <p className="text-[15px] text-black mt-2 leading-relaxed whitespace-pre-line">
                  我們要結婚啦！💍🤵👰‍♀️ {"\n"}
                  誠摯邀請大家來參加我們的婚禮，見證我們的幸福時刻！
              </p>

              <div className="mt-3 rounded-xl overflow-hidden border border-stone-100 shadow-sm relative bg-stone-100 h-[280px] sm:h-[340px] md:h-[400px]">
                  <img src={THREADS_POST_IMAGE} alt="Wedding" className="w-full h-full object-cover object-[center_65%]" />
              </div>

              <div className="flex items-center gap-4 mt-3 text-black">
                  <button 
                      onClick={onLike} 
                      className="group flex items-center gap-1.5 -ml-2 p-2 hover:bg-stone-50 rounded-full transition-colors active:scale-95"
                  >
                       <motion.div 
                          key={isLiked ? 'liked' : 'unliked'}
                          animate={{ scale: isLiked ? [1, 1.3, 1] : 1 }}
                          transition={{ duration: 0.3 }}
                       >
                          <ThreadsLikeIcon filled={isLiked} size={22} />
                       </motion.div>
                  </button>
                  <button 
                      onClick={onComment}
                      className="group -ml-2 p-2 hover:bg-stone-50 rounded-full transition-colors active:scale-95"
                  >
                      <ThreadsCommentIcon />
                  </button>
                  <button className="group -ml-2 p-2 hover:bg-stone-50 rounded-full transition-colors">
                      <ThreadsShareIcon />
                  </button>
              </div>

              <div className="mt-1 text-[13px] text-stone-400 font-medium">
                  {likes} 個讚
              </div>
          </div>
      </div>
    );
};

interface GuestEntryProps {
  entry: GuestBookEntry;
  isLast: boolean;
  onLike: (id: string) => void;
}

const GuestEntry: React.FC<GuestEntryProps> = ({ entry, isLast, onLike }) => {
    const avatarStyle = getAvatarColor(entry.name);
    
    // Calculate Wedding Relative Time
    const weddingTime = new Date(APP_CONTENT.dateISO).getTime();
    const timeDiff = weddingTime - entry.timestamp;
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    let relativeTag = '';
    let tagStyle = '';

    if (Math.abs(daysDiff) === 0) {
        relativeTag = "婚禮當日";
        tagStyle = "bg-[#8E3535]/10 text-[#8E3535]";
    } else if (daysDiff > 0) {
        relativeTag = `婚禮前 ${daysDiff} 天`;
        tagStyle = "bg-amber-50 text-amber-600";
    } else {
        relativeTag = `婚禮後 ${Math.abs(daysDiff)} 天`;
        tagStyle = "bg-emerald-50 text-emerald-600";
    }

    return (
      <div className="flex gap-3 relative">
          <div className="flex flex-col items-center gap-2">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${avatarStyle} z-10 ring-2 ring-white`}>
                  {entry.name.charAt(0)}
              </div>
              {/* Thread Line - only if not last */}
              {!isLast && <div className="w-[2px] flex-grow bg-stone-200/60 my-1 rounded-full min-h-[20px]" />}
          </div>

          <div className="flex-1 pb-5">
              <div className="flex justify-between items-start">
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                      <h4 className="text-[14px] font-bold text-black">{entry.name}</h4>
                      {/* Visual Timeline Badge */}
                      <span className={`text-[10px] px-2 py-[2px] rounded-[4px] font-medium tracking-wide w-fit ${tagStyle}`}>
                          {relativeTag}
                      </span>
                  </div>
                  <span className="text-[12px] text-stone-400 whitespace-nowrap ml-2">{formatTime(entry.timestamp)}</span>
              </div>
              
              <p className="text-[14px] text-black mt-2 whitespace-pre-line leading-relaxed">
                  {entry.message}
              </p>

              <div className="flex items-center gap-4 mt-2.5">
                  <button 
                      onClick={() => onLike(entry.id)}
                      className="flex items-center gap-1.5 group -ml-2 p-1.5 hover:bg-stone-50 rounded-full transition-colors active:scale-95"
                  >
                       <motion.div 
                          key={entry.isLiked ? 'liked' : 'unliked'}
                          animate={{ scale: entry.isLiked ? [1, 1.3, 1] : 1 }}
                          transition={{ duration: 0.3 }}
                       >
                           <ThreadsLikeIcon filled={entry.isLiked} size={18} />
                       </motion.div>
                       {(entry.likes > 0) && (
                           <span className={`text-[12px] ${entry.isLiked ? 'text-red-500' : 'text-stone-400'}`}>
                               {entry.likes}
                           </span>
                       )}
                  </button>
              </div>
          </div>
      </div>
    );
};

// --- Main Component ---

interface GuestBookProps {
  onExpandChange?: (isExpanded: boolean) => void;
  refreshTrigger?: number;
  onWriteMessage?: () => void;
}

export const GuestBook: React.FC<GuestBookProps> = ({ onExpandChange, refreshTrigger, onWriteMessage }) => {
  const [entries, setEntries] = useState<GuestBookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorType, setErrorType] = useState<'fetch' | 'permission' | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [sortType, setSortType] = useState<'hot' | 'recent'>('hot');
  
  // Local state for the main couple's post
  const [mainPostLikes, setMainPostLikes] = useState(520);
  const [mainPostLiked, setMainPostLiked] = useState(false);

  // Notify parent component about expansion state
  useEffect(() => {
    if (onExpandChange) {
      onExpandChange(isExpanded);
    }
  }, [isExpanded, onExpandChange]);

  // Fetch entries from Google Apps Script
  const fetchEntries = async () => {
    if (!APP_CONTENT.googleScriptUrl || !APP_CONTENT.googleScriptUrl.startsWith('http')) {
        setEntries(MOCK_ENTRIES); 
        setLoading(false);
        return;
    }

    try {
        setLoading(true);
        setErrorType(null);
        // Important: Append timestamp to prevent browser caching of the script response
        // Also explicitly set redirect: 'follow' to handle Google's 302 redirects
        const separator = APP_CONTENT.googleScriptUrl.includes('?') ? '&' : '?';
        const url = `${APP_CONTENT.googleScriptUrl}${separator}t=${Date.now()}`;
        
        console.log("Fetching Guestbook from:", url); // Debugging Log

        const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow',
        });
        
        // If Google sends a redirect to a login page due to "Only Myself" permission, 
        // the response comes back as Opaque or 200 OK but with HTML content.
        // We must check if we got HTML instead of JSON.
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
             throw new Error("HTML_RESPONSE"); // Custom error for permissions
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Use text() first to safely try parsing
        const textData = await response.text();
        let data;
        try {
            data = JSON.parse(textData);
        } catch (e) {
             throw new Error("JSON_PARSE_ERROR"); // Response wasn't valid JSON
        }
        
        if (Array.isArray(data)) {
            // Check local storage for "isLiked" state persistence (since backend doesn't know WHO liked it)
            const localLikes = JSON.parse(localStorage.getItem('wedding_guestbook_user_likes') || '{}');
            
            const processed = data.map((item: any) => ({
                id: item.id,
                name: item.name,
                message: item.message,
                timestamp: item.timestamp,
                likes: item.likes,
                isLiked: !!localLikes[item.id]
            }));
            setEntries(processed);
        } else {
            console.warn("Unexpected data format, using mock data:", data);
            setEntries(MOCK_ENTRIES);
        }
    } catch (e: any) {
        console.warn("Failed to fetch guestbook entries:", e);
        // GAS often throws a generic "TypeError: Failed to fetch" for CORS/Auth issues when permissions are wrong
        // We can assume if it fails, it's likely permissions in this context
        setErrorType('permission'); 
        setEntries(MOCK_ENTRIES);
    } finally {
        setLoading(false);
    }
  };

  // Initial Fetch & Refresh Trigger
  useEffect(() => {
    fetchEntries();
  }, [refreshTrigger]);

  const handleMainLike = () => {
    setMainPostLiked(!mainPostLiked);
    setMainPostLikes(prev => mainPostLiked ? prev - 1 : prev + 1);
  };

  // Helper handler: Close the threads view AND open the RSVP modal
  const handleWriteMessage = () => {
      setIsExpanded(false);
      onWriteMessage?.();
  };

  const handleGuestLike = async (id: string) => {
      // 1. Optimistic Update
      setEntries(prev => prev.map(entry => {
          if (entry.id === id) {
              const newLiked = !entry.isLiked;
              
              // Persist "My Like" status locally
              const localLikes = JSON.parse(localStorage.getItem('wedding_guestbook_user_likes') || '{}');
              if (newLiked) localLikes[id] = true;
              else delete localLikes[id];
              localStorage.setItem('wedding_guestbook_user_likes', JSON.stringify(localLikes));

              return {
                  ...entry,
                  isLiked: newLiked,
                  likes: newLiked ? entry.likes + 1 : entry.likes - 1
              };
          }
          return entry;
      }));

      // 2. Sync with Backend
      // Skip sync for mock entries
      if (id.startsWith('mock-')) return;

      try {
          const entry = entries.find(e => e.id === id);
          if (entry && !entry.isLiked) { // Only send "Like" to server
             // GAS Fix: use 'no-cors' and 'text/plain' to ensure successful POST without preflight issues
             await fetch(APP_CONTENT.googleScriptUrl, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({ action: 'like', id: id })
             });
          }
      } catch (e) {
          // Suppress error for demo/mock mode
          // console.error("Like sync failed", e);
      }
  };

  // Sorting Logic
  const sortedEntries = useMemo(() => {
      const copy = [...entries];
      if (sortType === 'hot') {
          return copy.sort((a, b) => b.likes - a.likes);
      } else {
          return copy.sort((a, b) => b.timestamp - a.timestamp);
      }
  }, [entries, sortType]);

  // If NOT expanded, we only show top 3 of "Hot"
  const displayEntries = isExpanded 
      ? sortedEntries 
      : [...entries].sort((a, b) => b.likes - a.likes).slice(0, 3);

  // --- Main Render ---

  // Lock scroll when expanded - More robust implementation
  useEffect(() => {
    if (isExpanded) {
        // Prevent background scrolling
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }
  }, [isExpanded]);

  return (
    <>
        {/* === PREVIEW CARD === */}
        <div className="w-full max-w-[600px] mx-auto bg-white rounded-2xl md:rounded-3xl shadow-xl overflow-hidden border border-stone-100">
            <div className="p-4 md:p-6 pb-2">
                <CouplePost 
                  likes={mainPostLikes}
                  isLiked={mainPostLiked}
                  onLike={handleMainLike}
                  onComment={handleWriteMessage}
                />

                {/* Divider */}
                <div className="relative py-3">
                     <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-stone-100"></div>
                     </div>
                     <div className="relative flex justify-center">
                        <span className="bg-white px-2 text-[10px] text-stone-400 tracking-widest uppercase">熱門留言</span>
                     </div>
                </div>

                <div className="mt-2 min-h-[100px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8 text-stone-400 gap-2">
                           <div className="w-5 h-5 border-2 border-stone-200 border-t-[#8E3535] rounded-full animate-spin" />
                           <span className="text-xs">載入祝福中...</span>
                        </div>
                    ) : (errorType === 'permission' || errorType === 'fetch') ? (
                         <div className="text-center py-8 text-stone-400 text-sm flex flex-col items-center gap-3">
                             <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 mb-1 max-w-[90%] md:max-w-xs text-left shadow-sm">
                                <p className="text-amber-700 text-xs font-bold mb-2 flex items-center gap-1">
                                    ⚠️ 連線設定提示
                                </p>
                                <ul className="text-amber-600 text-[11px] leading-relaxed list-disc list-inside space-y-1">
                                   <li>執行身分需設為：<strong>我 (Me)</strong></li>
                                   <li>誰可以存取：<strong>所有人 (Anyone)</strong></li>
                                   <li><strong>重要：</strong>修改後請務必建立 <strong>新版本 (New Version)</strong> 部署</li>
                                </ul>
                             </div>
                             <span className="text-xs text-stone-400">目前顯示測試資料</span>
                             <button onClick={() => fetchEntries()} className="text-[#8E3535] text-xs underline hover:text-[#7a2e2e]">重試連線</button>
                         </div>
                    ) : entries.length === 0 ? (
                        <div className="text-center py-8 text-stone-400 text-sm">
                           目前還沒有留言，快來搶頭香！
                        </div>
                    ) : (
                        displayEntries.map((entry, idx) => (
                            <GuestEntry 
                                key={entry.id} 
                                entry={entry} 
                                isLast={idx === displayEntries.length - 1 && !isExpanded} 
                                onLike={handleGuestLike}
                            />
                        ))
                    )}
                </div>

                {/* "View All" Button */}
                <div 
                    className="py-6 text-center border-t border-stone-50 mt-2 cursor-pointer hover:bg-stone-50 transition-colors group"
                    onClick={() => setIsExpanded(true)}
                >
                    <span className="text-[14px] text-stone-500 group-hover:text-black font-medium">
                        查看全部 {entries.length} 則留言
                    </span>
                </div>
            </div>
        </div>


        {/* === EXPANDED MODAL (PORTAL) === */}
        {createPortal(
            <AnimatePresence>
                {isExpanded && (
                    <motion.div 
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        // Using Portal puts this at the root. Z-index ensures it covers everything.
                        // bg-white ensures no transparency leakage.
                        className="fixed inset-0 z-[100000] bg-white flex flex-col h-[100dvh]"
                    >
                        {/* Header */}
                        <div className="flex-none h-14 border-b border-stone-100 flex items-center justify-between px-4 sticky top-0 bg-white/95 backdrop-blur-sm z-50">
                            <button 
                                onClick={() => setIsExpanded(false)}
                                className="p-2 -ml-2 text-black hover:bg-stone-50 rounded-full"
                            >
                                <ThreadsBackIcon />
                            </button>
                            <span className="font-bold text-[16px] text-black">貼文</span>
                            <div className="w-8" />
                        </div>

                        {/* Scrollable Content Container */}
                        {/* Explicit touch scrolling for iOS and safe area padding */}
                        <div 
                            className="flex-1 overflow-y-auto bg-white overscroll-none scroll-smooth"
                            style={{ WebkitOverflowScrolling: 'touch' }}
                        >
                            <div className="max-w-[600px] mx-auto p-4 md:p-6 min-h-full pb-32">
                                
                                <CouplePost 
                                  likes={mainPostLikes}
                                  isLiked={mainPostLiked}
                                  onLike={handleMainLike}
                                  onComment={handleWriteMessage}
                                />

                                <div className="h-px bg-stone-100 w-full my-2" />

                                {/* Sorting Tabs - Sticky within scroll container */}
                                <div className="flex gap-6 py-4 border-b border-stone-100 mb-4 sticky top-0 bg-white/95 backdrop-blur-sm z-40">
                                    <button 
                                        onClick={() => setSortType('hot')}
                                        className={`text-[14px] font-bold pb-2 border-b-2 transition-colors ${sortType === 'hot' ? 'text-black border-black' : 'text-stone-400 border-transparent hover:text-stone-600'}`}
                                    >
                                        最熱門
                                    </button>
                                    <button 
                                        onClick={() => setSortType('recent')}
                                        className={`text-[14px] font-bold pb-2 border-b-2 transition-colors ${sortType === 'recent' ? 'text-black border-black' : 'text-stone-400 border-transparent hover:text-stone-600'}`}
                                    >
                                        最新
                                    </button>
                                </div>

                                {/* Full List */}
                                <div className="pb-8">
                                    {loading ? (
                                        <div className="flex justify-center py-10">
                                            <div className="w-6 h-6 border-2 border-stone-200 border-t-[#8E3535] rounded-full animate-spin" />
                                        </div>
                                    ) : (
                                        sortedEntries.map((entry, idx) => (
                                            <GuestEntry 
                                                key={entry.id} 
                                                entry={entry} 
                                                isLast={idx === sortedEntries.length - 1} 
                                                onLike={handleGuestLike}
                                            />
                                        ))
                                    )}
                                </div>

                                <div className="text-center text-stone-300 text-[12px] py-8">
                                    — 已顯示所有留言 —
                                </div>
                            </div>
                        </div>

                        {/* Fixed Reply Bar (Threads Style) */}
                        <div className="flex-none p-3 border-t border-stone-100 bg-white pb-safe z-50">
                           <div 
                             onClick={handleWriteMessage}
                             className="w-full max-w-[600px] mx-auto bg-stone-100 rounded-full h-11 flex items-center px-4 text-stone-400 text-[15px] cursor-pointer hover:bg-stone-200/70 transition-colors"
                           >
                              回覆 joy-jacky.love...
                           </div>
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>,
            document.body
        )}
    </>
  );
};
