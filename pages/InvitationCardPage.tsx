import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

// ── 常數 ──────────────────────────────────────────────────
const FRONT_IMG = `${import.meta.env.BASE_URL}wedding_front.png`;
const BACK_IMG  = `${import.meta.env.BASE_URL}wedding_back.png`;

// 拖曳靈敏度
const DRAG_SENSITIVITY = 0.4;
// 陀螺儀靈敏度
const GYRO_SENSITIVITY = 12;
// 彈回阻尼
const SPRING_DAMPING = 0.08;
// 最大傾斜角度
const MAX_TILT = 35;
// 翻面閥值（Y 軸旋轉超過此角度即觸發翻面）
const FLIP_THRESHOLD = 90;

// ── 工具函數 ──────────────────────────────────────────────
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const lerp  = (a: number, b: number, t: number) => a + (b - a) * t;

// ── 珠光紙質感 (Pearlescent) 優化版 ──────────────────────────
const Shine: React.FC<{ rotX: number; rotY: number }> = ({ rotX, rotY }) => {
  const normalizedY = ((rotY + 90) % 180) - 90;
  
  // 計算總傾斜度，用來控制光影的強度（正面對觀眾時光影最淡）
  const tiltEffect = Math.min(Math.max((Math.abs(normalizedY) + Math.abs(rotX)) / 30, 0), 1);
  
  // 光源掃掠位置
  const shinePos = 50 + normalizedY * 1.5;
  
  return (
    <div className="absolute inset-0 rounded-[20px] pointer-events-none z-10 overflow-hidden">
      {/* 層 1: 極淡的線性掃掠光 (模擬光線掃過紙面) */}
      <div 
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: `linear-gradient(${135 + rotX}deg, 
            transparent 0%, 
            rgba(255, 255, 255, ${0.15 * tiltEffect}) ${shinePos - 15}%, 
            rgba(255, 255, 255, ${0.4 * tiltEffect}) ${shinePos}%, 
            rgba(255, 255, 255, ${0.15 * tiltEffect}) ${shinePos + 15}%, 
            transparent 100%)`,
          opacity: 0.8,
        }}
      />
      
      {/* 層 2: 極微弱的虹彩 (僅在傾斜時出現) */}
      <div 
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: `linear-gradient(${rotY}deg, 
            rgba(255, 192, 203, ${0.05 * tiltEffect}) 0%, 
            rgba(173, 216, 230, ${0.05 * tiltEffect}) 50%, 
            rgba(255, 250, 205, ${0.05 * tiltEffect}) 100%)`,
          mixBlendMode: 'color-dodge',
        }}
      />

      {/* 層 3: 紙張顆粒感 (保留質感核心) */}
      <div 
        className="absolute inset-0 opacity-[0.04] mix-blend-multiply"
        style={{
          backgroundImage: `url("https://www.transparenttextures.com/patterns/stardust.png")`,
        }}
      />
    </div>
  );
};

// ── 主頁面 ────────────────────────────────────────────────
const InvitationCardPage: React.FC = () => {
  // 基本旋轉角度 (0, 180, 360...)
  const [baseRotY, setBaseRotY] = useState(0);
  
  // 目標偏移角度（拖曳驅動）
  const targetOffsetX = useRef(0);
  const targetOffsetY = useRef(0);
  
  // 當前平滑後的總角度
  const currentRotX = useRef(0);
  const currentRotY = useRef(0);
  
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);

  const isDragging = useRef(false);
  const lastMouse  = useRef({ x: 0, y: 0 });
  const lastTouch  = useRef({ x: 0, y: 0 });
  const rafId      = useRef<number | null>(null);
  
  // 最後互動時間與自動旋轉量
  const lastInteractionRef = useRef(Date.now());
  const autoRotY = useRef(0);
  
  // ── 動畫迴圈 ──
  const animate = useCallback(() => {
    const now = Date.now();
    const idleTime = now - lastInteractionRef.current;
    
    // 閒置超過 5 秒開始自動旋轉
    if (idleTime > 5000) {
      autoRotY.current += 0.4; // 極慢速旋轉 (約每秒 24 度)
    } else {
      // 互動時讓自動旋轉量平滑歸零，避免跳動
      autoRotY.current = lerp(autoRotY.current, 0, 0.08);
    }

    // X 軸維持簡單的插值
    currentRotX.current = lerp(currentRotX.current, targetOffsetX.current, SPRING_DAMPING);
    
    // Y 軸 = 基礎角度 + 偏移角度 + 自動旋轉角度
    const targetTotalY = baseRotY + targetOffsetY.current + autoRotY.current;
    currentRotY.current = lerp(currentRotY.current, targetTotalY, SPRING_DAMPING);

    setRotX(currentRotX.current);
    setRotY(currentRotY.current);

    rafId.current = requestAnimationFrame(animate);
  }, [baseRotY]);

  useEffect(() => {
    rafId.current = requestAnimationFrame(animate);
    return () => { if (rafId.current) cancelAnimationFrame(rafId.current); };
  }, [animate]);

  // ── 重置閒置計時 ──
  const updateInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now();
  }, []);

  // ── 靜止後自動回正偏移量 ──
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      targetOffsetX.current = 0;
      targetOffsetY.current = 0;
    }, 2000);
  }, []);

  // ── 翻面邏輯 ──
  const triggerFlip = useCallback(() => {
    setBaseRotY(prev => prev + 180);
    targetOffsetX.current = 0;
    targetOffsetY.current = 0;
    updateInteraction();
    resetIdleTimer();
  }, [resetIdleTimer, updateInteraction]);

  // 判斷目前是正面還是背面 (根據角度)
  const isFront = Math.round((baseRotY + autoRotY.current) / 180) % 2 === 0;

  // ── 滑鼠事件 ──
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    lastMouse.current  = { x: e.clientX, y: e.clientY };
    updateInteraction();
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  }, [updateInteraction]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    updateInteraction();
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };

    targetOffsetY.current = clamp(targetOffsetY.current + dx * DRAG_SENSITIVITY, -MAX_TILT, MAX_TILT);
    targetOffsetX.current = clamp(targetOffsetX.current - dy * DRAG_SENSITIVITY, -MAX_TILT, MAX_TILT);
  }, [updateInteraction]);

  const onMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    updateInteraction();
    resetIdleTimer();
  }, [resetIdleTimer, updateInteraction]);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  // ── 觸控事件 ──
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    isDragging.current = true;
    const t = e.touches[0];
    lastTouch.current = { x: t.clientX, y: t.clientY };
    updateInteraction();
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
  }, [updateInteraction]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    if (e.cancelable) e.preventDefault(); // 防止手機網頁捲動
    const t = e.touches[0];
    updateInteraction();
    const dx = t.clientX - lastTouch.current.x;
    const dy = t.clientY - lastTouch.current.y;
    lastTouch.current = { x: t.clientX, y: t.clientY };

    targetOffsetY.current = clamp(targetOffsetY.current + dx * DRAG_SENSITIVITY, -MAX_TILT, MAX_TILT);
    targetOffsetX.current = clamp(targetOffsetX.current - dy * DRAG_SENSITIVITY, -MAX_TILT, MAX_TILT);
  }, [updateInteraction]);

  const onTouchEnd = useCallback(() => {
    isDragging.current = false;
    updateInteraction();
    resetIdleTimer();
  }, [resetIdleTimer, updateInteraction]);

  // 點擊翻面（不是拖曳才算點擊）
  const clickStartPos = useRef<{ x: number; y: number } | null>(null);
  const onCardPointerDown = (e: React.PointerEvent) => {
    clickStartPos.current = { x: e.clientX, y: e.clientY };
  };
  const onCardPointerUp = (e: React.PointerEvent) => {
    if (!clickStartPos.current) return;
    const dx = Math.abs(e.clientX - clickStartPos.current.x);
    const dy = Math.abs(e.clientY - clickStartPos.current.y);
    if (dx < 5 && dy < 5) {
      // 純點擊 → 翻面
      triggerFlip();
    }
    clickStartPos.current = null;
  };

  // ── 組合 transform ──
  const shadowOffset = (rotY % 360) * 0.5;
  const cardStyle: React.CSSProperties = {
    transform: `
      perspective(1200px)
      rotateX(${rotX}deg)
      rotateY(${rotY}deg)
    `,
    transformStyle: 'preserve-3d',
    boxShadow: `
      ${shadowOffset}px 30px 80px rgba(0,0,0,0.25),
      ${shadowOffset * 0.4}px 10px 30px rgba(0,0,0,0.15)
    `,
    willChange: 'transform',
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center overflow-hidden select-none"
      style={{ background: 'linear-gradient(135deg, #fdf6f0 0%, #fce8e8 40%, #f0e6f6 100%)' }}
    >
      {/* 頂部導航列 */}
      <header className="fixed top-0 left-0 w-full px-6 py-4 flex items-center justify-between z-30 bg-white/40 backdrop-blur-md border-b border-stone-200/40">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/60 border border-[#8E3535]/20 text-[#8E3535] hover:bg-[#8E3535] hover:text-white transition-all shadow-xs group"
            title="返回首頁"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <Link
            to="/"
            className="font-display text-sm tracking-[0.2em] font-bold text-[#8E3535] hover:opacity-80 transition-opacity"
          >
            ✦ Joy & Jacky ✦
          </Link>
        </div>
        <span className="font-serif text-xs md:text-sm text-stone-600">
          電子喜帖：Invitation
        </span>
      </header>

      {/* 背景裝飾粒子 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              width: `${8 + (i % 5) * 6}px`,
              height: `${8 + (i % 5) * 6}px`,
              background: i % 3 === 0 ? '#c9a96e' : i % 3 === 1 ? '#d4a5a5' : '#c4b5c4',
              left: `${(i * 37 + 7) % 100}%`,
              top: `${(i * 53 + 13) % 100}%`,
              animation: `float-particle ${4 + (i % 4)}s ease-in-out infinite`,
              animationDelay: `${(i * 0.7) % 3}s`,
            }}
          />
        ))}
      </div>

      {/* 卡片容器 */}
      <div
        className="relative z-10 cursor-grab active:cursor-grabbing mt-8"
        style={{ width: 'min(85vw, 360px)', aspectRatio: '9/16', touchAction: 'none' }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onPointerDown={(e) => {
            onCardPointerDown(e);
        }}
        onPointerUp={onCardPointerUp}
      >
        <div
          style={{
            ...cardStyle,
            width: '100%',
            height: '100%',
            position: 'relative',
            borderRadius: '20px',
          }}
        >
          {/* 正面 */}
          <div
            className="absolute inset-0 rounded-[20px] overflow-hidden shadow-inner"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <img
              src={FRONT_IMG}
              alt="喜帖正面"
              className="w-full h-full object-cover rounded-[20px]"
              draggable={false}
            />
            <Shine rotX={rotX} rotY={rotY} />
          </div>

          {/* 背面 */}
          <div
            className="absolute inset-0 rounded-[20px] overflow-hidden shadow-inner"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <img
              src={BACK_IMG}
              alt="喜帖背面"
              className="w-full h-full object-cover rounded-[20px]"
              draggable={false}
            />
            <Shine rotX={rotX} rotY={rotY} />
          </div>
        </div>
      </div>

      {/* 操作提示 */}
      <div className="relative z-10 mt-10 md:mt-12 flex flex-col items-center gap-5 px-4">
        <div className="flex items-center gap-4">
          <div
            className="w-1.5 h-1.5 rounded-full transition-all duration-500 shadow-sm"
            style={{ background: isFront ? '#8E3535' : '#d1d1d1' }}
          />
          <span className="text-[9px] text-[#b08d55] tracking-[0.4em] uppercase font-display font-bold opacity-80">
            {isFront ? 'Front' : 'Back'}
          </span>
          <div
            className="w-1.5 h-1.5 rounded-full transition-all duration-500 shadow-sm"
            style={{ background: !isFront ? '#8E3535' : '#d1d1d1' }}
          />
        </div>

        <p className="text-[#8a7a7a] text-[9px] tracking-[0.3em] font-light opacity-50 uppercase">
          Tap or Drag to Flip
        </p>
      </div>

      {/* 浮動粒子動畫 CSS */}
      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.15; }
          50%       { transform: translateY(-20px) rotate(180deg); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
};

export default InvitationCardPage;
