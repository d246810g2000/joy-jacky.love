import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { WEDDING_PHOTOS, BINGO_SUPPORT_CARDS } from '../constants';

// ── Web Audio API 音效合成器 ─────────────────────────────────
class SoundSynthesizer {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // 滾動數字的「噠噠」聲
  playTick() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {
      console.warn("AudioContext tick sound failed", e);
    }
  }

  // 一般抽中號碼的「叮～」清脆鈴聲
  playSuccess() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 雙音符清脆和弦
      const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
      freqs.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.12, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.6);
      });
    } catch (e) {
      console.warn("AudioContext success sound failed", e);
    }
  }

  // 幸運獎號抽中的「Tada!」華麗和弦鈴聲
  playLucky() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 升級版大三和弦 + 顫音
      const chords = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      chords.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = i === 3 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        osc.frequency.linearRampToValueAtTime(freq * 1.01, now + 0.8);

        gain.gain.setValueAtTime(0.15, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 1.2);
      });
    } catch (e) {
      console.warn("AudioContext lucky sound failed", e);
    }
  }
}

const sounds = new SoundSynthesizer();

// ── 應援小卡正面 10 張網址 (來自 constants.ts 中的 BINGO_SUPPORT_CARDS) ─────
const VERTICAL_CARD_FRONT_IMAGES = BINGO_SUPPORT_CARDS;

// ── 應援小卡背面 2 張 (粉、藍) ───────────────────────────────────
const CARD_BACK_PINK = `${import.meta.env.BASE_URL}support_card_back_pink.png`;
const CARD_BACK_BLUE = `${import.meta.env.BASE_URL}support_card_back_blue.png`;

// ── 應援手幅圖片 2 張 (粉、藍) ───────────────────────────────────
const SLOGAN_BANNER_PINK = `${import.meta.env.BASE_URL}support_pink.png`;
const SLOGAN_BANNER_BLUE = `${import.meta.env.BASE_URL}support_blue.png`;

// ── 珠光紙光澤 (Pearlescent Shine) ───────────────────────────
const Shine: React.FC<{ rotX: number; rotY: number }> = ({ rotX, rotY }) => {
  const normalizedY = ((rotY + 90) % 180) - 90;
  const tiltEffect = Math.min(Math.max((Math.abs(normalizedY) + Math.abs(rotX)) / 30, 0), 1);
  const shinePos = 50 + normalizedY * 1.5;

  return (
    <div className="absolute inset-0 rounded-[16px] pointer-events-none z-10 overflow-hidden">
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
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: `linear-gradient(${rotY}deg, 
            rgba(255, 192, 203, ${0.04 * tiltEffect}) 0%, 
            rgba(173, 216, 230, ${0.04 * tiltEffect}) 50%, 
            rgba(255, 250, 205, ${0.04 * tiltEffect}) 100%)`,
          mixBlendMode: 'color-dodge',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-multiply"
        style={{
          backgroundImage: `url("https://www.transparenttextures.com/patterns/stardust.png")`,
        }}
      />
    </div>
  );
};

// ── 1. 全螢幕 Canvas 粒子特效組件 ──────────────────────────────────
interface ParticleSystemProps {
  type: 'heart' | 'gold' | 'rose' | 'star' | 'balloon' | 'bubble' | 'sakura' | 'dandelion' | null;
  active: boolean;
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({ type, active }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active || !type) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // 粒子類別定義
    interface Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      rotation: number;
      rotSpeed: number;
      color: string;
      opacity: number;
      decay: number;
    }

    const particles: Particle[] = [];

    // 初始化粒子
    const createParticle = (burst = false): Particle => {
      const isHeart = type === 'heart';
      const isGold = type === 'gold';
      const isRose = type === 'rose';
      const isStar = type === 'star';
      const isBalloon = type === 'balloon';
      const isBubble = type === 'bubble';
      const isSakura = type === 'sakura';
      const isDandelion = type === 'dandelion';

      let px = Math.random() * width;
      let py = -20;
      let sx = (Math.random() - 0.5) * 1.5;
      let sy = Math.random() * 2 + 1.2;

      // 氣球與泡泡由下往上飄
      if (isBalloon || isBubble) {
        py = height + 40;
        sy = -(Math.random() * 1.2 + 0.8);
        sx = (Math.random() - 0.5) * 0.8;
      }

      // 櫻花雨與蒲公英種子飄入
      if (isSakura) {
        px = Math.random() * (width * 0.9) - 40;
        sx = Math.random() * 1.0 + 0.4;
        sy = Math.random() * 1.2 + 1.0;
      }

      if (isDandelion) {
        px = Math.random() * width;
        sx = (Math.random() - 0.3) * 0.8;
        sy = Math.random() * 0.8 + 0.6;
      }

      if (burst) {
        // 從中央噴發
        px = width / 2;
        py = height / 2 - 50;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2.5;
        sx = Math.cos(angle) * speed;
        sy = Math.sin(angle) * speed - (isBalloon || isBubble ? 3 : 2);
      }

      // 顏色挑選
      let color = '#ffb6c1';
      if (isHeart) {
        const colors = ['#FF6B8B', '#FF8EAA', '#FF477E', '#FFB7B2', '#FFF0F5'];
        color = colors[Math.floor(Math.random() * colors.length)];
      } else if (isGold) {
        const colors = ['#D4AF37', '#FFDF00', '#CFB53B', '#F3E5AB', '#B8860B'];
        color = colors[Math.floor(Math.random() * colors.length)];
      } else if (isRose) {
        const colors = ['#9B111E', '#B80F0A', '#8E3535', '#E32636', '#C21E56'];
        color = colors[Math.floor(Math.random() * colors.length)];
      } else if (isStar) {
        const colors = ['#FFF', '#FFFDD0', '#FAFAD2', '#FFFFE0', '#FFD700'];
        color = colors[Math.floor(Math.random() * colors.length)];
      } else if (isBalloon) {
        // 夢幻馬卡龍粉、馬卡龍藍、馬卡龍紫、粉金、明黃
        const colors = ['#FFB7B2', '#B5EAD7', '#C7CEEA', '#FFDAC1', '#E2F0CB', '#FF9AA2'];
        color = colors[Math.floor(Math.random() * colors.length)];
      } else if (isBubble) {
        color = 'rgba(255, 255, 255, 0.45)';
      } else if (isSakura) {
        const colors = ['#FFF0F5', '#FFECEF', '#FFD1DC', '#FFA6C9', '#FFB7C5'];
        color = colors[Math.floor(Math.random() * colors.length)];
      } else if (isDandelion) {
        const colors = ['#FFF', '#FFFFE0', '#FAFAD2', '#FFFDD0'];
        color = colors[Math.floor(Math.random() * colors.length)];
      }

      return {
        x: px,
        y: py,
        size: isBalloon
          ? Math.random() * 15 + 18 // 氣球大一點 18~33px
          : isBubble
            ? Math.random() * 12 + 10 // 泡泡 10~22px
            : isSakura
              ? Math.random() * 8 + 6 // 櫻花 6~14px
              : isDandelion
                ? Math.random() * 6 + 6 // 蒲公英 6~12px
                : Math.random() * (isRose ? 16 : isHeart ? 14 : isGold ? 8 : 12) + (isRose ? 8 : 6),
        speedX: sx,
        speedY: sy,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.05,
        color,
        opacity: 1,
        decay: burst
          ? Math.random() * 0.008 + 0.004
          : isBalloon || isBubble
            ? Math.random() * 0.0008 + 0.0004
            : Math.random() * 0.002 + 0.001,
      };
    };

    // 初始噴發一次
    const burstCount = type === 'gold' ? 180
      : type === 'heart' ? 100
        : type === 'rose' ? 60
          : type === 'star' ? 120
            : type === 'balloon' ? 25
              : type === 'bubble' ? 40
                : type === 'sakura' ? 80
                  : 100;

    for (let i = 0; i < burstCount; i++) {
      particles.push(createParticle(true));
    }

    // 繪製心形
    const drawHeart = (c: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      c.beginPath();
      c.moveTo(x, y + size / 4);
      c.quadraticCurveTo(x, y, x + size / 2, y);
      c.quadraticCurveTo(x + size, y, x + size, y + size / 3);
      c.quadraticCurveTo(x + size, y + (size * 2) / 3, x + size / 2, y + size);
      c.quadraticCurveTo(x, y + (size * 2) / 3, x, y + size / 3);
      c.quadraticCurveTo(x, y, x, y + size / 4);
      c.closePath();
      c.fill();
    };

    // 繪製十字星芒
    const drawStar = (c: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      c.beginPath();
      c.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        c.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        c.lineTo(x, y);
        rot += step;
      }
      c.lineTo(cx, cy - outerRadius);
      c.closePath();
      c.fill();
    };

    // 繪製玫瑰花瓣
    const drawPetal = (c: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      c.beginPath();
      c.moveTo(x, y);
      c.bezierCurveTo(x - size, y - size / 2, x - size, y + size, x, y + size);
      c.bezierCurveTo(x + size, y + size, x + size, y - size / 2, x, y);
      c.closePath();
      c.fill();
    };

    // 繪製氣球
    const drawBalloon = (c: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      // 氣球主體 (拉長的水滴形)
      c.beginPath();
      c.moveTo(x, y - size / 2);
      c.bezierCurveTo(x + size / 1.5, y - size / 2, x + size / 1.5, y + size / 2, x, y + size / 1.8);
      c.bezierCurveTo(x - size / 1.5, y + size / 2, x - size / 1.5, y - size / 2, x, y - size / 2);
      c.closePath();
      c.fill();

      // 氣球底部的結 (小三角形)
      c.beginPath();
      c.moveTo(x, y + size / 1.8);
      c.lineTo(x - size / 6, y + size / 1.5);
      c.lineTo(x + size / 6, y + size / 1.5);
      c.closePath();
      c.fill();

      // 氣球繫線 (微彎細線)
      c.beginPath();
      c.moveTo(x, y + size / 1.5);
      c.bezierCurveTo(x - size / 4, y + size * 1.2, x + size / 4, y + size * 1.8, x, y + size * 2.5);
      c.strokeStyle = 'rgba(150, 150, 150, 0.4)';
      c.lineWidth = 1;
      c.stroke();
    };

    // 繪製炫彩泡泡
    const drawBubble = (c: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      c.beginPath();
      c.arc(x, y, size, 0, Math.PI * 2);

      // 泡泡彩虹漸層
      const grad = c.createRadialGradient(x - size / 3, y - size / 3, size / 10, x, y, size);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
      grad.addColorStop(0.7, 'rgba(255, 182, 193, 0.2)'); // 粉
      grad.addColorStop(0.85, 'rgba(173, 216, 230, 0.25)'); // 藍
      grad.addColorStop(0.95, 'rgba(255, 255, 255, 0.4)'); // 邊緣高光
      grad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');

      c.fillStyle = grad;
      c.fill();

      // 月牙型反光點
      c.beginPath();
      c.arc(x - size / 3, y - size / 3, size / 4, 0, Math.PI * 2);
      c.fillStyle = 'rgba(255, 255, 255, 0.3)';
      c.fill();
    };

    // 繪製櫻花瓣
    const drawSakura = (c: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      c.beginPath();
      c.moveTo(x, y);
      c.bezierCurveTo(x - size / 2, y - size / 2, x - size, y + size / 3, x, y + size);
      c.bezierCurveTo(x + size, y + size / 3, x + size / 2, y - size / 2, x, y);
      c.closePath();
      c.fill();
    };

    // 繪製蒲公英微光
    const drawDandelion = (c: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      // 繪製中心點
      c.beginPath();
      c.arc(x, y, 1.2, 0, Math.PI * 2);
      c.fillStyle = '#fff';
      c.fill();

      // 繪製毛冠線
      c.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      c.lineWidth = 0.8;
      const rays = 8;
      for (let i = 0; i < rays; i++) {
        const angle = (i * Math.PI * 2) / rays;
        const rx = x + Math.cos(angle) * size;
        const ry = y + Math.sin(angle) * size;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(rx, ry);
        c.stroke();

        c.beginPath();
        c.arc(rx, ry, 0.8, 0, Math.PI * 2);
        c.fillStyle = 'rgba(255, 255, 255, 0.6)';
        c.fill();
      }
    };

    // 動畫 Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 持續產生新粒子
      const maxParticles = type === 'balloon' ? 40
        : type === 'bubble' ? 80
          : type === 'dandelion' ? 120
            : 350;

      if (particles.length < maxParticles && Math.random() < 0.25) {
        particles.push(createParticle(false));
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotSpeed;
        p.opacity -= p.decay;

        // 星星與金紙隨風擺動效果
        if (type === 'gold' || type === 'star') {
          p.speedX += Math.sin(p.y / 30) * 0.05;
        } else if (type === 'rose') {
          p.speedX += Math.sin(p.y / 50) * 0.08;
        } else if (type === 'balloon') {
          p.speedX += Math.sin(p.y / 40) * 0.02;
        } else if (type === 'bubble') {
          p.speedX += Math.sin(p.y / 30) * 0.04;
        } else if (type === 'sakura') {
          p.speedX += Math.sin(p.y / 40) * 0.05;
        } else if (type === 'dandelion') {
          p.speedX += Math.sin(p.y / 20) * 0.03;
        }

        const isUpward = type === 'balloon' || type === 'bubble';
        const isOut = isUpward
          ? (p.y < -80 || p.x < -40 || p.x > width + 40)
          : (p.y > height + 20 || p.x < -20 || p.x > width + 20);

        if (p.opacity <= 0 || isOut) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (type === 'heart') {
          drawHeart(ctx, -p.size / 2, -p.size / 2, p.size);
        } else if (type === 'rose') {
          drawPetal(ctx, 0, -p.size / 2, p.size);
        } else if (type === 'star') {
          drawStar(ctx, 0, 0, 4, p.size, p.size / 3);
        } else if (type === 'balloon') {
          drawBalloon(ctx, 0, 0, p.size);
        } else if (type === 'bubble') {
          drawBubble(ctx, 0, 0, p.size);
        } else if (type === 'sakura') {
          drawSakura(ctx, 0, 0, p.size);
        } else if (type === 'dandelion') {
          drawDandelion(ctx, 0, 0, p.size);
        } else {
          // gold (Confetti / 亮片紙張)
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }
        ctx.restore();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [active, type]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-40 w-full h-full"
    />
  );
};

// ── 2. 3D 直式應援小卡組件 (ThreeDCard) ─────────────────────────────
interface ThreeDCardProps {
  frontImg: string;
  backImg: string;
  title: string;
  description: string;
  onClose: () => void;
}

const ThreeDCard: React.FC<ThreeDCardProps> = ({ frontImg, backImg, title, description, onClose }) => {
  const [backImgFailed, setBackImgFailed] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const isPink = backImg.includes('pink');
  const themeBg = isPink ? 'bg-[#fef6f6]' : 'bg-[#f5f9ff]';
  const themeBorder = isPink
    ? 'border-pink-200/60 shadow-[0_0_15px_rgba(244,143,177,0.2)]'
    : 'border-blue-200/60 shadow-[0_0_15px_rgba(144,202,249,0.2)]';

  // 預設為 1260 度 (3.5 圈，背面朝上)
  const [baseRotY, setBaseRotY] = useState(1260);
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(1260);

  const targetOffsetX = useRef(0);
  const targetOffsetY = useRef(0);
  const currentRotX = useRef(0);
  const currentRotY = useRef(1260);

  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const lastTouch = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);

  const DRAG_SENSITIVITY = 0.45;
  const SPRING_DAMPING = 0.085;
  const MAX_TILT = 35;

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

  const animate = useCallback(() => {
    currentRotX.current = lerp(currentRotX.current, targetOffsetX.current, SPRING_DAMPING);
    currentRotY.current = lerp(currentRotY.current, baseRotY + targetOffsetY.current, SPRING_DAMPING);

    setRotX(currentRotX.current);
    setRotY(currentRotY.current);

    rafId.current = requestAnimationFrame(animate);
  }, [baseRotY]);

  useEffect(() => {
    rafId.current = requestAnimationFrame(animate);
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [animate]);

  // ── 自動翻轉與自動退出機制 ──
  useEffect(() => {
    // 由下往上持續 1.5 秒到中間，再停留 0.5 秒，所以是 2.0 秒後開始旋轉翻到正面
    const flipTimer = setTimeout(() => {
      setBaseRotY(0);
    }, 2000);

    // 5.2秒後自動關閉退場 (翻轉約在 3.0~3.2秒完成，在正面定格展示 2 秒後於 5.2秒消失)
    const closeTimer = setTimeout(() => {
      setIsClosing(true);
      onClose();
    }, 5200);

    return () => {
      clearTimeout(flipTimer);
      clearTimeout(closeTimer);
    };
  }, [onClose]);

  // 滑鼠事件
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };

    targetOffsetY.current = clamp(targetOffsetY.current + dx * DRAG_SENSITIVITY, -MAX_TILT, MAX_TILT);
    targetOffsetX.current = clamp(targetOffsetX.current - dy * DRAG_SENSITIVITY, -MAX_TILT, MAX_TILT);
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    setTimeout(() => {
      if (!isDragging.current) {
        targetOffsetX.current = 0;
        targetOffsetY.current = 0;
      }
    }, 2000);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // 觸控事件
  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    const t = e.touches[0];
    lastTouch.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const t = e.touches[0];
    const dx = t.clientX - lastTouch.current.x;
    const dy = t.clientY - lastTouch.current.y;
    lastTouch.current = { x: t.clientX, y: t.clientY };

    targetOffsetY.current = clamp(targetOffsetY.current + dx * DRAG_SENSITIVITY, -MAX_TILT, MAX_TILT);
    targetOffsetX.current = clamp(targetOffsetX.current - dy * DRAG_SENSITIVITY, -MAX_TILT, MAX_TILT);
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    targetOffsetX.current = 0;
    targetOffsetY.current = 0;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 pointer-events-none flex flex-col items-center justify-center z-50 p-4"
    >
      {/* 3D 卡片主體 (新增進場及退場縮放動畫) */}
      <motion.div
        initial={{ scale: 0.3, y: 80, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.3, y: -80, opacity: 0 }}
        transition={isClosing ? { type: "spring", stiffness: 100, damping: 15 } : {
          y: { duration: 1.5, ease: "easeOut" },
          scale: { duration: 1.5, ease: "easeOut" },
          opacity: { duration: 1.5, ease: "easeOut" }
        }}
        className={`relative cursor-grab active:cursor-grabbing select-none ${isClosing ? 'pointer-events-none' : 'pointer-events-auto'
          }`}
        style={{ width: 'min(75vw, 320px)', aspectRatio: '9/16', touchAction: 'none' }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            borderRadius: '16px',
            transform: `perspective(1200px) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
            transformStyle: 'preserve-3d',
            boxShadow: `${(rotY % 360) * 0.4}px 25px 60px rgba(0,0,0,0.45)`,
            transition: 'box-shadow 0.1s ease',
            willChange: 'transform',
          }}
        >
          {/* 背面 (粉或藍) */}
          <div
            className={`absolute inset-0 rounded-[16px] overflow-hidden ${themeBg} border ${themeBorder}`}
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            {!backImgFailed ? (
              <img
                src={backImg}
                alt="應援小卡背面"
                className="w-full h-full object-cover rounded-[16px]"
                draggable={false}
                onError={() => {
                  setBackImgFailed(true);
                }}
              />
            ) : (
              /* 備用文字排版 (若沒圖片) */
              <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-br ${isPink ? 'from-[#8E3535] to-[#5a1b1b]' : 'from-[#2a4e80] to-[#122440]'
                } text-center`}>
                <div className={`border ${isPink ? 'border-pink-300/30' : 'border-blue-300/30'} p-8 rounded-lg flex flex-col items-center`}>
                  <span className="text-3xl mb-4">❤️</span>
                  <span className={`font-serif tracking-widest text-lg font-bold ${isPink ? 'text-pink-200' : 'text-blue-100'}`}>Joy & Jacky</span>
                  <span className="text-stone-300 text-xs mt-2">Wedding Bingo</span>
                </div>
              </div>
            )}
            <Shine rotX={rotX} rotY={rotY} />
          </div>

          {/* 正面 (直式婚紗照) */}
          <div
            className={`absolute inset-0 rounded-[16px] overflow-hidden ${themeBg} border ${themeBorder}`}
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <img
              src={frontImg}
              alt="直式婚紗照"
              className="w-full h-full object-cover rounded-[16px]"
              draggable={false}
            />
            <Shine rotX={rotX} rotY={rotY} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const AirplaneIcon = () => (
  <svg viewBox="0 0 64 64" className="w-16 h-16 md:w-20 md:h-20 text-amber-400 fill-current drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] shrink-0 select-none">
    <path d="M54,26 L42,26 L30,10 L26,10 L32,26 L14,26 L8,18 L4,18 L8,29 L8,35 L4,46 L8,46 L14,38 L32,38 L26,54 L30,54 L42,38 L54,38 C58.4,38 62,34.4 62,30 C62,25.6 58.4,26 54,26 Z" />
    <line x1="60" y1="18" x2="60" y2="42" stroke="#b08d55" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// ── 3. 橫式手幅飄浮展示組件 (SloganBannerReveal) ────────────────────────
interface SloganBannerRevealProps {
  bannerImg: string;
  photoImg: string;
  title: string;
  description: string;
  onClose: () => void;
}

const SloganBannerReveal: React.FC<SloganBannerRevealProps> = ({ bannerImg, photoImg, title, description, onClose }) => {
  // 隨機產生 15vh 到 50vh 的飛行高度
  const [randomY] = useState(() => Math.floor(Math.random() * 35) + 15);

  // ── 自動飄走關閉機制 ──
  useEffect(() => {
    // 5.5秒後飛出螢幕自動銷毀
    const timer = setTimeout(() => {
      onClose();
    }, 5500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden bg-black/[0.03]"
    >
      {/* 整組飛機與手幅 (自左向右橫穿螢幕，帶有 y 軸微幅上下顛簸起伏) */}
      {/* pointer-events-none 確保可以完全穿透點擊背後網格數字 */}
      <motion.div
        initial={{ x: "-110%", y: `${randomY}vh`, opacity: 0 }}
        animate={{
          x: "100vw",
          y: [`${randomY}vh`, `${randomY - 3}vh`, `${randomY + 3}vh`, `${randomY}vh`],
          opacity: [0, 1, 1, 0]
        }}
        transition={{
          x: { duration: 5.5, ease: "linear" },
          y: { duration: 5.5, ease: "easeInOut" },
          opacity: { times: [0, 0.1, 0.95, 1], duration: 5.5 }
        }}
        className="absolute flex flex-row items-center pointer-events-none"
      >
        {/* 手幅與婚紗照組合 (被飛機拖曳在後面) */}
        <div className="flex flex-col items-center max-w-md w-full shrink-0 shadow-2xl">
          {/* 手幅 */}
          <div className="z-20 relative w-full aspect-[3/1] rounded-t-xl overflow-hidden border-x border-t border-amber-400/30">
            <img
              src={bannerImg}
              alt="手幅圖片"
              className="w-full h-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 mix-blend-overlay" />
          </div>

          {/* 橫式婚紗照 (掛載在手幅下方) */}
          <div className="bg-stone-900 border-x border-b border-amber-400/30 rounded-b-xl p-4 pt-6 w-full flex flex-col items-center">
            {/* 照片 */}
            <div className="w-full aspect-[16/10] bg-stone-950 rounded-lg p-1.5 border border-amber-500/20 shadow-inner">
              <img
                src={photoImg}
                alt="精選橫式婚紗照"
                className="w-full h-full object-cover rounded-md"
                draggable={false}
              />
            </div>
          </div>
        </div>

        {/* 牽引繩 (連結手幅與飛機) */}
        <div className="w-16 border-t-2 border-dashed border-amber-400/50 self-center shrink-0" />

        {/* 小飛機 */}
        <AirplaneIcon />
      </motion.div>
    </motion.div>
  );
};

// ── 主頁面 ──────────────────────────────────────────────────
const BingoPage: React.FC = () => {
  // ── 遊戲狀態 ──
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>(() => {
    const saved = localStorage.getItem('bingo_drawn_numbers');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentNum, setCurrentNum] = useState<number | null>(() => {
    const saved = localStorage.getItem('bingo_current_num');
    return saved ? parseInt(saved, 10) : null;
  });

  const [isRolling, setIsRolling] = useState(false);
  const rollingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── 特效與 Modal 狀態 ──
  const [activeEffect, setActiveEffect] = useState<'heart' | 'gold' | 'rose' | 'star' | 'balloon' | 'bubble' | 'sakura' | 'dandelion' | null>(null);
  const [showEffect, setShowEffect] = useState(false);

  const [luckyCardData, setLuckyCardData] = useState<{
    frontImg: string;
    backImg: string;
    title: string;
    description: string;
    triggerId: number;
  } | null>(null);

  const [sloganBannerData, setSloganBannerData] = useState<{
    bannerImg: string;
    photoImg: string;
    title: string;
    description: string;
    triggerId: number;
  } | null>(null);

  // ── 設定面板 ──
  const [showSettings, setShowSettings] = useState(false);

  // 10 個直式小卡幸運數字（可自訂）
  const [cardLuckyNumbers, setCardLuckyNumbers] = useState<number[]>(() => {
    const saved = localStorage.getItem('bingo_card_lucky_nums');
    // 預設一組
    return saved ? JSON.parse(saved) : [7, 13, 20, 25, 30, 52, 59, 66, 70, 74];
  });

  // 10 個橫式手幅幸運數字（可自訂）
  const [bannerLuckyNumbers, setBannerLuckyNumbers] = useState<number[]>(() => {
    const saved = localStorage.getItem('bingo_banner_lucky_nums');
    // 預設一組
    return saved ? JSON.parse(saved) : [3, 9, 17, 24, 36, 45, 50, 60, 68, 72];
  });

  // ── 設定檢查錯誤狀態 ──
  const [settingError, setSettingError] = useState<string | null>(null);

  // ── 檢查號碼是否重複 ──
  const checkDuplicate = (cards: number[], banners: number[]): string | null => {
    // 檢查直式卡片號碼自己是否重複
    const cardSet = new Set(cards);
    if (cardSet.size !== cards.length) {
      return "直式小卡的號碼設定中有重複的數字！";
    }
    // 檢查橫式手幅號碼自己是否重複
    const bannerSet = new Set(banners);
    if (bannerSet.size !== banners.length) {
      return "橫式手幅的號碼設定中有重複的數字！";
    }
    // 檢查兩組號碼是否有交集
    const intersect = cards.filter(n => banners.includes(n));
    if (intersect.length > 0) {
      return `小卡與手幅的設定號碼有重疊：${intersect.join(", ")}，請修正避免觸發衝突！`;
    }
    return null;
  };

  useEffect(() => {
    const error = checkDuplicate(cardLuckyNumbers, bannerLuckyNumbers);
    setSettingError(error);
  }, [cardLuckyNumbers, bannerLuckyNumbers]);

  // 存檔設定
  useEffect(() => {
    localStorage.setItem('bingo_card_lucky_nums', JSON.stringify(cardLuckyNumbers));
  }, [cardLuckyNumbers]);

  useEffect(() => {
    localStorage.setItem('bingo_banner_lucky_nums', JSON.stringify(bannerLuckyNumbers));
  }, [bannerLuckyNumbers]);

  // 保存抽獎進度
  useEffect(() => {
    localStorage.setItem('bingo_drawn_numbers', JSON.stringify(drawnNumbers));
  }, [drawnNumbers]);

  useEffect(() => {
    if (currentNum !== null) {
      localStorage.setItem('bingo_current_num', currentNum.toString());
    } else {
      localStorage.removeItem('bingo_current_num');
    }
  }, [currentNum]);

  // ── 元件卸載時清理計時器與動畫 ──
  useEffect(() => {
    return () => {
      if (rollingInterval.current) {
        clearInterval(rollingInterval.current);
      }
    };
  }, []);

  // ── 取得相片對應（從藝廊資料過濾） ──
  const allPhotos = WEDDING_PHOTOS;
  const landscapePhotos = allPhotos.filter(p => p.orientation === 'landscape');
  const portraitPhotos = allPhotos.filter(p => p.orientation === 'portrait');

  // ── 預載入所有卡片、手幅與婚紗相片 ──
  const [preloadingProgress, setPreloadingProgress] = useState(0);
  const [preloadingDone, setPreloadingDone] = useState(false);

  useEffect(() => {
    const urlsToPreload = [
      ...BINGO_SUPPORT_CARDS,
      CARD_BACK_PINK,
      CARD_BACK_BLUE,
      SLOGAN_BANNER_PINK,
      SLOGAN_BANNER_BLUE,
      ...landscapePhotos.slice(0, 10).map(p => p.url)
    ];

    let loadedCount = 0;
    const totalCount = urlsToPreload.length;

    urlsToPreload.forEach(url => {
      const img = new Image();
      img.src = url;
      img.onload = img.onerror = () => {
        loadedCount++;
        const prog = Math.round((loadedCount / totalCount) * 100);
        setPreloadingProgress(prog);
        if (loadedCount >= totalCount) {
          setPreloadingDone(true);
          console.log("Bingo game assets preloaded successfully!");
        }
      };
    });
  }, [landscapePhotos]);

  // ── 特效派發器 ──
  const triggerSpecialEffects = (num: number) => {
    // 隨機在 8 個全螢幕浪漫特效中挑選
    const effects: ('heart' | 'gold' | 'rose' | 'star' | 'balloon' | 'bubble' | 'sakura' | 'dandelion')[] = [
      'heart', 'gold', 'rose', 'star', 'balloon', 'bubble', 'sakura', 'dandelion'
    ];
    const randomIndex = Math.floor(Math.random() * effects.length);
    const effect = effects[randomIndex];

    setActiveEffect(effect);
    setShowEffect(true);

    // 判斷是否是「直式應援小卡組」
    const cardIndex = cardLuckyNumbers.indexOf(num);
    if (cardIndex !== -1) {
      sounds.playLucky();
      const photoIndex = cardIndex % VERTICAL_CARD_FRONT_IMAGES.length;
      // 找對應的直式婚紗照說明
      const pPhoto = portraitPhotos[photoIndex % portraitPhotos.length];

      setLuckyCardData({
        frontImg: VERTICAL_CARD_FRONT_IMAGES[photoIndex],
        backImg: Math.random() < 0.5 ? CARD_BACK_PINK : CARD_BACK_BLUE,
        title: pPhoto?.title ?? "浪漫放閃瞬間",
        description: pPhoto?.description ?? "我們即將用愛，畫上最燦爛的一筆。誠邀您來見證我們的永恆。",
        triggerId: Date.now()
      });
      return;
    }

    // 判斷是否是「橫式手幅組」
    const bannerIndex = bannerLuckyNumbers.indexOf(num);
    if (bannerIndex !== -1) {
      sounds.playLucky();
      const photoIndex = bannerIndex % landscapePhotos.length;
      const lPhoto = landscapePhotos[photoIndex];

      setSloganBannerData({
        bannerImg: Math.random() < 0.5 ? SLOGAN_BANNER_PINK : SLOGAN_BANNER_BLUE,
        photoImg: lPhoto?.url ?? 'https://res.cloudinary.com/djqnqxzha/image/upload/abroad-h-01.jpg',
        title: lPhoto?.title ?? "幸福應援瞬間",
        description: lPhoto?.description ?? "手拉手並肩坐著緊握雙手，就是最踏實的幸福。",
        triggerId: Date.now()
      });
      return;
    }

    // 一般數字
    sounds.playSuccess();
  };

  // ── 核心抽獎函式 ──
  const drawNumber = () => {
    if (isRolling) return;

    // 檢查是否抽完
    if (drawnNumbers.length >= 75) {
      alert("所有號碼 1-75 已全部抽完！");
      return;
    }

    setIsRolling(true);
    let tempNum = 1;
    let rollCount = 0;

    // 找出所有還沒被抽出的數字
    const availableNumbers = Array.from({ length: 75 }, (_, i) => i + 1)
      .filter(n => !drawnNumbers.includes(n));

    // 滾動效果
    rollingInterval.current = setInterval(() => {
      // 隨機在尚未抽出的數字中跳動，增加真實感
      const randomIndex = Math.floor(Math.random() * availableNumbers.length);
      tempNum = availableNumbers[randomIndex];
      setCurrentNum(tempNum);
      sounds.playTick();

      rollCount++;
      // 滾動約 25 次 (大約 1.8 秒) 後停止
      if (rollCount >= 25 && rollingInterval.current) {
        clearInterval(rollingInterval.current);

        // 最終抽出號碼
        const finalNum = tempNum;
        setCurrentNum(finalNum);
        setDrawnNumbers(prev => [...prev, finalNum]);
        setIsRolling(false);

        // 觸發特定中獎特效
        triggerSpecialEffects(finalNum);
      }
    }, 70);
  };

  // ── 重置遊戲 ──
  const resetGame = () => {
    if (window.confirm("確定要重置所有抽獎紀錄嗎？這會清除所有已抽出的數字。")) {
      setDrawnNumbers([]);
      setCurrentNum(null);
      setActiveEffect(null);
      setShowEffect(false);
      setLuckyCardData(null);
      setSloganBannerData(null);
      localStorage.removeItem('bingo_drawn_numbers');
      localStorage.removeItem('bingo_current_num');
    }
  };

  // ── 設定特定的幸運號碼 ──
  const updateCardNumber = (index: number, val: number) => {
    const next = [...cardLuckyNumbers];
    next[index] = Math.min(Math.max(val, 1), 75);
    setCardLuckyNumbers(next);
  };

  const updateBannerNumber = (index: number, val: number) => {
    const next = [...bannerLuckyNumbers];
    next[index] = Math.min(Math.max(val, 1), 75);
    setBannerLuckyNumbers(next);
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-between text-stone-800 relative py-8 px-4 overflow-x-hidden md:px-8 select-none"
      style={{ background: 'linear-gradient(135deg, #fdf6f0 0%, #fce8e8 40%, #f0e6f6 100%)' }}
    >
      {/* 4類全螢幕特效 (Canvas 實現) */}
      <ParticleSystem type={activeEffect} active={showEffect} />

      {/* 頂部 Header */}
      <header className="w-full max-w-6xl flex justify-between items-center z-30 pb-4 border-b border-[#8E3535]/10">
        <Link
          to="/"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/50 backdrop-blur-md border border-white/60 text-[#8E3535] hover:bg-[#8E3535] hover:text-white transition-all shadow-sm"
          title="回首頁"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <div className="text-center">
          <h1 className="font-serif text-xl md:text-2xl text-[#8E3535] font-bold tracking-widest">Joy & Jacky 婚禮賓果抽獎</h1>
          <p className="text-[10px] text-[#b08d55] tracking-[0.3em] uppercase mt-0.5">Wedding Bingo Party</p>
        </div>
        <div className="w-10 h-10 opacity-0 pointer-events-none" />
      </header>

      {/* 中間大螢幕展示區 */}
      <main className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 items-center justify-center my-6 z-20">
        {/* 左側：抽獎看板與抽獎按鈕 */}
        <div className="w-full lg:w-[45%] flex flex-col items-center space-y-6">
          <div className="bg-white/70 backdrop-blur-lg border-2 border-[#b08d55]/30 rounded-3xl p-8 w-full shadow-[0_15px_40px_-15px_rgba(142,53,53,0.15)] relative overflow-hidden flex flex-col items-center">
            {/* 角飾 */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#b08d55]/40 m-4 rounded-tl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#b08d55]/40 m-4 rounded-br-lg" />

            <span className="font-serif text-xs text-[#b08d55] tracking-[0.4em] uppercase mb-4">LUCKY NUMBER</span>

            {/* 大數字呈現 */}
            <div className="w-56 h-56 rounded-full bg-gradient-to-br from-[#8E3535]/5 to-[#8E3535]/15 border border-[#8E3535]/20 flex items-center justify-center relative shadow-inner">
              <span className={`font-serif text-8xl md:text-9xl text-[#8E3535] tabular-nums font-bold drop-shadow-sm select-none ${isRolling ? 'animate-pulse scale-95' : ''}`}>
                {currentNum !== null ? String(currentNum).padStart(2, '0') : '--'}
              </span>
            </div>

            {/* 抽獎按鈕 */}
            <button
              onClick={drawNumber}
              disabled={!preloadingDone || isRolling || drawnNumbers.length >= 75}
              className={`mt-8 px-12 py-4 rounded-full font-serif text-lg tracking-widest text-white shadow-lg transition-all duration-300 transform ${!preloadingDone || isRolling || drawnNumbers.length >= 75
                  ? 'bg-stone-400 cursor-not-allowed scale-95 opacity-80'
                  : 'bg-gradient-to-r from-[#8E3535] to-[#aa4747] hover:scale-105 hover:shadow-xl active:scale-95 shadow-[#8E3535]/20'
                }`}
            >
              {!preloadingDone
                ? `加載婚禮資源 (${preloadingProgress}%)...`
                : isRolling
                  ? '號碼抽取中...'
                  : drawnNumbers.length >= 75
                    ? '已全部抽完'
                    : '開始抽取號碼'}
            </button>

            <p className="text-[10px] text-stone-500 tracking-[0.2em] uppercase mt-3">
              已抽過: {drawnNumbers.length} / 75 個號碼
            </p>
          </div>
        </div>

        {/* 右側：1-75 歷史點亮網格牆 */}
        <div className="w-full lg:w-[55%] bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-5 border-b border-[#8E3535]/10 pb-3">
            <h2 className="font-serif text-md text-[#8E3535] font-bold tracking-wider">已抽出號碼紀錄牆</h2>
            <div className="flex gap-4 text-[10px] text-stone-600 font-light">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-[#8E3535] rounded-full" />已抽</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-white border border-[#b08d55]/30 rounded-full" />未抽</span>
            </div>
          </div>

          {/* 1-75 網格 */}
          <div className="grid grid-cols-10 gap-1.5 md:gap-2">
            {Array.from({ length: 75 }, (_, i) => {
              const num = i + 1;
              const isDrawn = drawnNumbers.includes(num);
              const isCurrent = currentNum === num;

              // 特效號碼加上特殊發光外框標註
              const isSpecial = cardLuckyNumbers.includes(num) || bannerLuckyNumbers.includes(num);

              return (
                <div
                  key={num}
                  onClick={() => {
                    if (isDrawn && !isRolling) {
                      setCurrentNum(num);
                      triggerSpecialEffects(num);
                    }
                  }}
                  className={`aspect-square flex items-center justify-center text-xs md:text-sm font-semibold rounded-md transition-all duration-500 ${isDrawn ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
                    } ${isCurrent
                      ? 'bg-amber-400 text-stone-900 scale-110 shadow-lg z-10 font-bold animate-bounce'
                      : isDrawn
                        ? 'bg-gradient-to-br from-[#8E3535] to-[#aa4747] text-white shadow-md'
                        : 'bg-white/70 border border-[#b08d55]/20 text-stone-500 hover:bg-stone-50/50'
                    } ${isSpecial && !isDrawn ? 'border-[#b08d55] border-2 border-dashed animate-pulse' : ''}`}
                  title={`${num}${isSpecial ? ' (幸運彩蛋號碼 - 點擊可重播特效)' : isDrawn ? ' (點擊可播放特效)' : ''}`}
                >
                  {num}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* 底部 Footer 提示 */}
      <footer className="w-full text-center py-4 text-[10px] text-stone-500 tracking-[0.2em] uppercase z-30">
        Designed for Joy & Jacky Wedding • 2026.05.30
      </footer>

      {/* ── 3D 直式小卡 展示 Modal ── */}
      <AnimatePresence>
        {luckyCardData && (
          <ThreeDCard
            key={`lucky-card-modal-${luckyCardData.triggerId}`}
            frontImg={luckyCardData.frontImg}
            backImg={luckyCardData.backImg}
            title={luckyCardData.title}
            description={luckyCardData.description}
            onClose={() => {
              const myId = luckyCardData.triggerId;
              setLuckyCardData(prev => {
                if (prev && prev.triggerId === myId) {
                  return null;
                }
                return prev;
              });
            }}
          />
        )}
      </AnimatePresence>

      {/* ── 橫式手幅 展開 Modal ── */}
      <AnimatePresence>
        {sloganBannerData && (
          <SloganBannerReveal
            key={`slogan-banner-modal-${sloganBannerData.triggerId}`}
            bannerImg={sloganBannerData.bannerImg}
            photoImg={sloganBannerData.photoImg}
            title={sloganBannerData.title}
            description={sloganBannerData.description}
            onClose={() => {
              const myId = sloganBannerData.triggerId;
              setSloganBannerData(prev => {
                if (prev && prev.triggerId === myId) {
                  return null;
                }
                return prev;
              });
            }}
          />
        )}
      </AnimatePresence>

      {/* ── 4. 隱藏設定面板入口 (右下角微小的齒輪按鈕) ── */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-md border border-[#8E3535]/20 shadow-lg text-stone-500 hover:text-[#8E3535] hover:bg-white/80 transition-all flex items-center justify-center text-lg"
          title="主持後台設定"
        >
          ⚙️
        </button>
      </div>

      {/* 後台設定 Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-[#b08d55]/30 flex flex-col max-h-[85vh] overflow-hidden"
            >
              {/* 設定頂部 */}
              <div className="flex justify-between items-center border-b pb-4 mb-4">
                <h3 className="font-serif text-lg text-[#8E3535] font-bold">設定</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-stone-400 hover:text-stone-700 text-lg"
                >
                  ✕
                </button>
              </div>

              {/* 設定主體 (滾動區域) */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-6 text-sm text-stone-700">

                {/* 數據重置 */}
                <div className="bg-stone-50 p-4 rounded-xl space-y-3">
                  <h4 className="font-bold text-[#8E3535] flex items-center gap-1.5">🚨 遊戲重置管理</h4>
                  <p className="text-xs text-stone-500">如果需要重新開始一輪，請點擊下方重置按鈕。這會清除瀏覽器中的抽獎進度。</p>
                  <button
                    onClick={resetGame}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-semibold tracking-wider transition-colors"
                  >
                    清除並重置抽獎數據
                  </button>
                </div>



                {/* 幸運數字修改 - 直式小卡 */}
                <div className="space-y-3">
                  <h4 className="font-bold text-[#8E3535] flex items-center gap-1.5">🎴 直式小卡彩蛋號碼 (1-75)</h4>
                  <p className="text-xs text-stone-500">抽中這 10 個號碼之一，會彈出 3D 直式小卡。請輸入想要設定的數字：</p>
                  <div className="grid grid-cols-5 gap-2">
                    {cardLuckyNumbers.map((num, i) => (
                      <div key={`card-num-${i}`} className="flex flex-col items-center">
                        <label className="text-[9px] text-stone-400">小卡 #{i + 1}</label>
                        <input
                          type="number"
                          min="1"
                          max="75"
                          value={num}
                          onChange={(e) => updateCardNumber(i, parseInt(e.target.value, 10) || 1)}
                          className="w-full text-center border rounded-md p-1 bg-white text-xs text-stone-800"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 幸運數字修改 - 橫式手幅 */}
                <div className="space-y-3">
                  <h4 className="font-bold text-[#8E3535] flex items-center gap-1.5">🎗️ 橫式手幅彩蛋號碼 (1-75)</h4>
                  <p className="text-xs text-stone-500">抽中這 10 個號碼之一，會由下往上飄出手幅並拉出橫式婚紗照。請輸入數字：</p>
                  <div className="grid grid-cols-5 gap-2">
                    {bannerLuckyNumbers.map((num, i) => (
                      <div key={`banner-num-${i}`} className="flex flex-col items-center">
                        <label className="text-[9px] text-stone-400">手幅 #{i + 1}</label>
                        <input
                          type="number"
                          min="1"
                          max="75"
                          value={num}
                          onChange={(e) => updateBannerNumber(i, parseInt(e.target.value, 10) || 1)}
                          className="w-full text-center border rounded-md p-1 bg-white text-xs text-stone-800"
                        />
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* 設定錯誤提示 */}
              {settingError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium animate-pulse">
                  {settingError}
                </div>
              )}

              {/* 設定底部 */}
              <div className="border-t pt-4 mt-4 flex justify-between items-center">
                <span className="text-[10px] text-stone-400">
                  {settingError ? "請先排除號碼重複設定" : "幸運號碼設定無重複"}
                </span>
                <button
                  onClick={() => {
                    if (!settingError) setShowSettings(false);
                  }}
                  disabled={!!settingError}
                  className={`px-6 py-2 rounded-md text-xs font-semibold tracking-wider transition-all ${settingError
                      ? 'bg-stone-300 text-stone-500 cursor-not-allowed opacity-70'
                      : 'bg-[#8E3535] hover:bg-[#722a2a] text-white'
                    }`}
                >
                  確認並關閉設定
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default BingoPage;
