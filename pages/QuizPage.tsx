import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Confetti } from '../components/Confetti';
import quizData from '../data/quiz_data.json';

// --- Types ---
interface Choice {
  text: string;
  isCorrect: boolean;
  answersCount: number;
  avgTime: number;
  players?: string[];
}

interface Question {
  index: number;
  type: string; // "poll" | "quiz"
  question: string;
  duration: number;
  choices: Choice[];
  noAnswerPlayers?: string[];
}

interface LeaderboardEntry {
  rank: number;
  player: string;
  score: number;
  correctAnswers: number;
  incorrectAnswers: number;
}

// --- Web Audio API 音效合成器 ─────────────────────────────────
class QuizSoundSynthesizer {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // 倒數計時的「滴答」聲
  playTick() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {
      console.warn("AudioContext tick sound failed", e);
    }
  }

  // 準備畫面的倒數嗶聲
  playCountdownBeep(freq = 440) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {
      console.warn("AudioContext beep failed", e);
    }
  }

  // 答對的清脆鈴聲
  playCorrect() {
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
        osc.frequency.setValueAtTime(freq, now + i * 0.06);

        gain.gain.setValueAtTime(0.12, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.5);
      });
    } catch (e) {
      console.warn("AudioContext correct sound failed", e);
    }
  }

  // 答錯的低沈嗡聲
  playIncorrect() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(80, now + 0.35);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn("AudioContext incorrect sound failed", e);
    }
  }

  // 登頂或勝利的華麗和弦
  playFanfare() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 升級版大三和弦 + 疊加音
      const chords = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4~C6
      chords.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = i >= 4 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.12, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.8);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.8);
      });
    } catch (e) {
      console.warn("AudioContext fanfare failed", e);
    }
  }
}

const sounds = new QuizSoundSynthesizer();

// Kahoot 經典的幾何圖形與顏色配置
const KAHOOT_COLORS = [
  {
    bg: 'bg-red-500 hover:bg-red-600 active:bg-red-700',
    text: 'text-red-500',
    border: 'border-red-500',
    icon: '▲',
    shape: 'triangle',
    style: { backgroundColor: '#e21b3c' }
  },
  {
    bg: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700',
    text: 'text-blue-500',
    border: 'border-blue-500',
    icon: '◆',
    shape: 'diamond',
    style: { backgroundColor: '#1368ce' }
  },
  {
    bg: 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700',
    text: 'text-amber-500',
    border: 'border-amber-500',
    icon: '●',
    shape: 'circle',
    style: { backgroundColor: '#d89e00' }
  },
  {
    bg: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800',
    text: 'text-emerald-500',
    border: 'border-emerald-600',
    icon: '■',
    shape: 'square',
    style: { backgroundColor: '#26890c' }
  }
];

export default function QuizPage() {
  const navigate = useNavigate();

  // 遊戲狀態機
  // 'LOBBY' | 'PREPARE' | 'ANSWERING' | 'REVEALING' | 'RESULT' | 'SCOREBOARD' | 'GAMEOVER' | 'REVIEW'
  const [gameState, setGameState] = useState<string>('LOBBY');

  const [nickname, setNickname] = useState<string>(() => {
    return localStorage.getItem('quiz_nickname') || '';
  });

  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [expandedChoiceIdx, setExpandedChoiceIdx] = useState<number | null>(null);
  const [lastPointsGained, setLastPointsGained] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState<number | null>(null);

  // 用於記錄單題答題時間
  const [timer, setTimer] = useState<number>(10);
  const startTimeRef = useRef<number>(0);
  const [timeTaken, setTimeTaken] = useState<number>(0);

  // 倒數準備 (PREPARE 狀態) 的 3, 2, 1 計時
  const [prepCountdown, setPrepCountdown] = useState<number>(3);

  // 煙火特效控制
  const [isConfettiActive, setIsConfettiActive] = useState<boolean>(false);

  // 所有的題目與歷史排行榜數據
  const questions: Question[] = quizData.questions;
  const originalLeaderboard: LeaderboardEntry[] = quizData.leaderboard;

  // 整合玩家目前分數與現場排行榜後的即時名次計算
  const getPlayerRank = () => {
    // 複製現場排行榜
    const tempBoard = originalLeaderboard.map(e => ({ ...e }));
    // 將玩家插入
    const playerEntry = {
      rank: 999,
      player: nickname || '挑戰者',
      score: score,
      correctAnswers: correctCount,
      incorrectAnswers: currentQIndex - (currentQIndex > 0 ? 1 : 0) - correctCount // 扣掉 Poll 之後的錯誤數
    };
    tempBoard.push(playerEntry);
    // 依分數與答對題數排序
    tempBoard.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.correctAnswers - a.correctAnswers;
    });

    // 尋找玩家在排好序的陣列中的名次
    const idx = tempBoard.findIndex(e => e.player === playerEntry.player && e.score === playerEntry.score);
    return idx + 1;
  };

  // 獲取某一特定題目的排行榜狀態（含玩家）
  const getLeaderboardAtQuestion = useCallback((qIdx: number, userScore: number) => {
    if (qIdx < 0) return [];
    const question = questions[qIdx];
    if (!question || !question.scores) return [];

    const list: {
      player: string;
      score: number;
      isSelf: boolean;
      correctAnswers: number;
      rank: number;
    }[] = [];

    // 1. 加入現場賓客的累計分數
    Object.entries(question.scores).forEach(([player, scoreVal]) => {
      const finalEntry = originalLeaderboard.find(e => e.player === player);
      const finalCorrect = finalEntry ? finalEntry.correctAnswers : 0;
      list.push({
        player,
        score: scoreVal,
        isSelf: false,
        correctAnswers: finalCorrect,
        rank: 999
      });
    });

    // 2. 加入玩家本人
    list.push({
      player: nickname || '挑戰者',
      score: userScore,
      isSelf: true,
      correctAnswers: correctCount,
      rank: 999
    });

    // 3. 排序 (分數由高到低)
    list.sort((a, b) => b.score - a.score);

    // 4. 分配排名
    list.forEach((item, index) => {
      item.rank = index + 1;
    });

    return list;
  }, [questions, originalLeaderboard, nickname, correctCount]);

  const userRank = getPlayerRank();
  const currentQuestion = questions[currentQIndex];

  // --- 音效輔助 ---
  const handlePlayTick = useCallback(() => {
    sounds.playTick();
  }, []);

  // --- 倒數準備計時器 (PREPARE) ---
  useEffect(() => {
    if (gameState !== 'PREPARE') return;

    // 每次進入 prepare 播放一次 beep
    sounds.playCountdownBeep(440);

    const interval = setInterval(() => {
      setPrepCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // 準備結束，進入答題狀態
          setGameState('ANSWERING');
          setTimer(questions[currentQIndex].duration);
          startTimeRef.current = Date.now();
          return 3;
        }
        sounds.playCountdownBeep(440);
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, currentQIndex, questions]);

  // --- 答題計時器 (ANSWERING) ---
  useEffect(() => {
    if (gameState !== 'ANSWERING') return;

    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // 時間到，強制送出答題（未選擇）
          handleAnswerSelect(-1);
          return 0;
        }
        // 倒數 3 秒播放更清脆的警示音
        if (prev <= 4) {
          sounds.playCountdownBeep(550);
        } else {
          handlePlayTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, handlePlayTick]);

  // --- 開始挑戰 ---
  const handleStartGame = () => {
    const finalName = nickname.trim() || `挑戰者${Math.floor(1000 + Math.random() * 9000)}`;
    setNickname(finalName);
    localStorage.setItem('quiz_nickname', finalName);

    setScore(0);
    setStreak(0);
    setCorrectCount(0);
    setCurrentQIndex(0);
    setPrepCountdown(3);
    setExpandedChoiceIdx(null);
    setLastPointsGained(0);
    setGameState('VIDEO');
  };

  // --- 選擇答案與計分 ---
  const handleAnswerSelect = (choiceIdx: number) => {
    if (gameState !== 'ANSWERING') return;

    // 計算答題所花時間
    const now = Date.now();
    const elapsed = (now - startTimeRef.current) / 1000;
    const finalTime = Math.min(elapsed, currentQuestion.duration);
    setTimeTaken(finalTime);
    setSelectedChoiceIndex(choiceIdx);

    // 進入 Reveling（送出中的短暫緩衝）
    setGameState('REVEALING');

    setTimeout(() => {
      let isCorrect = false;
      let pointsGained = 0;

      if (currentQuestion.type === 'quiz') {
        const selectedChoice = choiceIdx >= 0 ? currentQuestion.choices[choiceIdx] : null;
        isCorrect = selectedChoice ? selectedChoice.isCorrect : false;

        if (isCorrect) {
          // Kahoot 計分公式：基準分數 1000 分，根據作答速度進行扣分折價，最高 1000 分，最低 500 分
          const ratio = finalTime / currentQuestion.duration;
          pointsGained = Math.round(1000 * (1 - ratio * 0.5));
          pointsGained = Math.max(500, pointsGained);

          // 連續答對加成 (Streak bonus: 每連對 1 題額外加 100 分，上限 500 分)
          const streakBonus = Math.min(streak * 100, 500);
          pointsGained += streakBonus;

          setScore(prev => prev + pointsGained);
          setStreak(prev => prev + 1);
          setCorrectCount(prev => prev + 1);
          setLastPointsGained(pointsGained);
          sounds.playCorrect();
        } else {
          setStreak(0);
          setLastPointsGained(0);
          sounds.playIncorrect();
        }
      } else {
        // Poll 類型，純回饋不計分，不計入連勝或正確率
        setLastPointsGained(0);
        sounds.playCorrect();
      }

      setGameState('RESULT');
    }, 600);
  };

  // --- 下一步 (從結果前往記分板，或從記分板前往下一題) ---
  const handleNext = () => {
    setExpandedChoiceIdx(null);
    if (gameState === 'RESULT') {
      // 進入中場分數排行榜畫面
      setGameState('SCOREBOARD');
    } else if (gameState === 'SCOREBOARD') {
      // 檢查是否為最後一題
      if (currentQIndex < questions.length - 1) {
        setCurrentQIndex(prev => prev + 1);
        setPrepCountdown(3);
        setSelectedChoiceIndex(null);
        setGameState('PREPARE');
      } else {
        // 遊戲結束，進入結算畫面
        setGameState('GAMEOVER');
        setIsConfettiActive(true);
        sounds.playFanfare();
      }
    }
  };

  return (
    <main className="w-full min-h-screen bg-transparent text-[#1a1a1a] selection:bg-[#b08d55] selection:text-white pb-12 relative overflow-hidden flex flex-col justify-between">
      {/* 頂部婚禮主題 Bar */}
      <header className="w-full px-6 py-4 flex items-center justify-between z-20 bg-white/40 backdrop-blur-md border-b border-stone-200/40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (window.confirm("確定要結束遊戲返回首頁嗎？")) {
                navigate('/');
              }
            }}
            className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-white/60 border border-[#8E3535]/20 text-[#8E3535] hover:bg-[#8E3535] hover:text-white transition-all shadow-xs group"
            title="返回首頁"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <button
            onClick={() => {
              if (window.confirm("確定要結束遊戲返回首頁嗎？")) {
                navigate('/');
              }
            }}
            className="font-display text-sm tracking-[0.2em] font-bold text-[#8E3535] hover:opacity-80 transition-opacity"
          >
            ✦ Joy & Jacky ✦
          </button>
        </div>
        <span className="font-serif text-xs md:text-sm text-stone-600">
          快問快答：新人大考驗
        </span>
      </header>

      {/* Confetti 慶祝特效 */}
      <Confetti isActive={isConfettiActive} />

      <section className="flex-grow flex items-center justify-center p-4 md:p-6 z-10 w-full max-w-4xl mx-auto">
        <AnimatePresence mode="wait">

          {/* ────────────────────────────────────────────────────────
              LOBBY - 大廳與暱稱輸入 + 現場排行榜
              ──────────────────────────────────────────────────────── */}
          {gameState === 'LOBBY' && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              className="w-full flex flex-col items-center gap-8"
            >
              <div className="text-center space-y-3">
                <h1 className="font-serif text-3xl md:text-4xl text-[#1a1a1a] leading-tight tracking-wider">
                  甜蜜告白與趣味冷知識
                </h1>
                <p className="font-display text-xs md:text-sm text-[#b08d55] tracking-[0.3em] uppercase">
                  新人故事大考驗 ‧ 互動複現
                </p>
                <div className="h-[2px] w-20 bg-[#b08d55]/30 mx-auto mt-4" />
              </div>

              {/* 大廳卡片 */}
              <div className="glass-panel rounded-2xl p-4 md:p-8 w-full shadow-xl space-y-4 md:space-y-6">
                <div className="space-y-3">
                  <label htmlFor="nickname" className="block font-serif text-base text-stone-700 font-medium">
                    輸入暱稱以開始遊戲：
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-grow flex gap-2">
                      <input
                        id="nickname"
                        type="text"
                        maxLength={10}
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="例如：中央小金泰熙、蘆洲彭于晏..."
                        className="flex-grow px-4 py-3 rounded-lg border border-stone-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#8E3535]/30 focus:border-[#8E3535] text-stone-800 transition-all font-sans text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleStartGame();
                        }}
                      />
                      <button
                        onClick={handleStartGame}
                        className="px-5 py-3 bg-gradient-to-r from-[#8E3535] to-[#a34b4b] text-white rounded-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 font-serif tracking-wider text-xs md:text-sm font-medium whitespace-nowrap"
                      >
                        開始挑戰
                      </button>
                    </div>
                    <button
                      onClick={() => setGameState('REVIEW')}
                      className="px-5 py-3 bg-white border border-[#b08d55]/50 text-[#8E3535] rounded-lg shadow-sm hover:bg-stone-50 active:scale-[0.98] transition-all duration-300 font-serif tracking-wider text-xs md:text-sm font-medium whitespace-nowrap"
                    >
                      📊 直接看統計結果
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-400 font-sans">
                    * 輸入暱稱即可點擊「開始挑戰」重溫大考驗；或點擊「直接看統計結果」瀏覽全部題目的現場答題比例。
                  </p>
                </div>

                {/* 排行榜展示 */}
                <div className="pt-4 border-t border-stone-200/40">
                  <h3 className="font-serif text-sm text-stone-700 font-bold mb-3 flex items-center justify-between">
                    <span>🏆 婚禮現場真實排行前 20 名</span>
                    <span className="text-xs text-stone-400 font-sans font-normal">
                      共 171 名現場玩家
                    </span>
                  </h3>
                  <div className="max-h-[260px] overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
                    {originalLeaderboard.slice(0, 20).map((entry, idx) => {
                      const isTop3 = entry.rank <= 3;
                      const badgeBg = entry.rank === 1 ? 'bg-amber-100 text-amber-700 border-amber-300'
                                    : entry.rank === 2 ? 'bg-slate-100 text-slate-700 border-slate-300'
                                    : entry.rank === 3 ? 'bg-orange-100 text-orange-700 border-orange-300'
                                    : 'bg-stone-50 text-stone-500 border-stone-100';

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-lg border border-stone-100 bg-white/50 text-xs font-sans"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 flex items-center justify-center rounded-full border text-[10px] font-bold ${badgeBg}`}>
                              {entry.rank}
                            </span>
                            <span className="font-medium text-stone-800">{entry.player}</span>
                          </div>
                          <div className="flex items-center gap-4 text-stone-500 text-[11px]">
                            <span>🎯 {entry.correctAnswers} 答對</span>
                            <span className="font-mono font-bold text-stone-700">{entry.score} 分</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ────────────────────────────────────────────────────────
              VIDEO - 愛情影片放映室
              ──────────────────────────────────────────────────────── */}
          {gameState === 'VIDEO' && (
            <motion.div
              key="video"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-2xl mx-auto flex flex-col items-center gap-6"
            >
              <div className="text-center space-y-2">
                <span className="font-display text-xs md:text-sm text-[#b08d55] tracking-[0.3em] uppercase animate-pulse">
                  🎬 新人愛情影片
                </span>
                <h2 className="font-serif text-2xl md:text-3xl text-stone-800 font-bold leading-tight">
                  挑戰前，先來回味新人的故事吧！
                </h2>
                <div className="h-[2px] w-12 bg-[#b08d55]/30 mx-auto mt-2" />
              </div>

              {/* 16:9 YouTube 播放器嵌入 */}
              <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-stone-200/60 bg-black relative">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/Bjd1enMNOa8"
                  title="Joy & Jacky Love Story"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>

              {/* 按鈕操作區 */}
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-2">
                <button
                  onClick={() => setGameState('PREPARE')}
                  className="px-8 py-4 bg-gradient-to-r from-[#8E3535] to-[#a34b4b] text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 font-serif tracking-widest text-sm font-semibold"
                >
                  我準備好了，開始作答！ 🚀
                </button>
                <button
                  onClick={() => setGameState('LOBBY')}
                  className="px-6 py-4 bg-white border border-stone-200 text-stone-600 rounded-xl shadow-sm hover:bg-stone-50 active:scale-[0.98] transition-all duration-300 font-serif tracking-widest text-xs font-semibold"
                >
                  返回大廳
                </button>
              </div>
            </motion.div>
          )}

          {/* ────────────────────────────────────────────────────────
              PREPARE - 3-2-1 準備倒數
              ──────────────────────────────────────────────────────── */}
          {gameState === 'PREPARE' && (
            <motion.div
              key="prepare"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.3 }}
              className="text-center space-y-6"
            >
              <p className="font-display text-[#b08d55] text-xs tracking-[0.4em] uppercase">
                Question {currentQuestion.index} of {questions.length}
              </p>
              <h2 className="font-serif text-2xl md:text-3xl text-stone-800 max-w-xl mx-auto leading-relaxed">
                {currentQuestion.question}
              </h2>
              <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                {/* 倒數大數字 */}
                <motion.span
                  key={prepCountdown}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 10 }}
                  className="font-display text-7xl font-bold text-[#8E3535] relative z-10"
                >
                  {prepCountdown}
                </motion.span>
                <div className="absolute inset-0 rounded-full border-4 border-dashed border-[#8E3535]/20 animate-spin" style={{ animationDuration: '8s' }} />
              </div>
              <p className="font-serif text-stone-500 tracking-widest text-sm">
                準備好，即將開始計時作答！
              </p>
            </motion.div>
          )}

          {/* ────────────────────────────────────────────────────────
              ANSWERING & REVEALING - 作答進行中 & 送出緩衝
              ──────────────────────────────────────────────────────── */}
          {(gameState === 'ANSWERING' || gameState === 'REVEALING') && (
            <motion.div
              key="answering"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className="w-full flex flex-col gap-6"
            >
              {/* 題號與類型 */}
              <div className="flex justify-between items-center px-2">
                <span className="font-serif text-xs md:text-sm text-stone-500">
                  題目 {currentQuestion.index} / {questions.length} (
                  {currentQuestion.type === 'poll' ? '現場人氣投票' : '大考驗單選題'})
                </span>
                {currentQuestion.type === 'quiz' && streak > 0 && (
                  <span className="text-amber-600 text-xs font-bold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 animate-pulse">
                    🔥 連勝中：{streak}
                  </span>
                )}
              </div>

              {/* 題目框 */}
              <div className="glass-panel rounded-2xl p-6 md:p-8 text-center shadow-lg border border-white/60">
                <h2 className="font-serif text-xl md:text-2xl text-stone-800 leading-relaxed font-semibold">
                  {currentQuestion.question}
                </h2>
              </div>

              {/* 計時器 (只在 ANSWERING 顯示) */}
              <div className="h-16 flex items-center justify-center">
                {gameState === 'ANSWERING' ? (
                  <div className="relative w-16 h-16 flex items-center justify-center rounded-full border-2 border-stone-200 bg-white shadow-md">
                    <span className="font-mono text-xl font-bold text-stone-700">
                      {timer}
                    </span>
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="29"
                        fill="transparent"
                        stroke={timer <= 3 ? '#ef4444' : timer <= 5 ? '#f59e0b' : '#b08d55'}
                        strokeWidth="3"
                        strokeDasharray={2 * Math.PI * 29}
                        strokeDashoffset={
                          2 * Math.PI * 29 * (1 - timer / currentQuestion.duration)
                        }
                        className="transition-all duration-1000 ease-linear"
                      />
                    </svg>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-stone-500 font-serif text-sm">
                    <div className="w-4 h-4 border-2 border-[#8E3535] border-t-transparent rounded-full animate-spin" />
                    送出作答中，即將公佈答案...
                  </div>
                )}
              </div>

              {/* 四色作答按鈕 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
                {currentQuestion.choices.map((choice, idx) => {
                  const isSelected = selectedChoiceIndex === idx;
                  const colorConfig = KAHOOT_COLORS[idx % 4];

                  // 如果已送出，但不是選中的，則淡出
                  const opacityClass =
                    gameState === 'REVEALING' && !isSelected ? 'opacity-40 scale-95' : 'opacity-100';

                  return (
                    <button
                      key={idx}
                      disabled={gameState === 'REVEALING'}
                      onClick={() => handleAnswerSelect(idx)}
                      className={`relative flex items-center gap-3 sm:gap-4 px-4 py-3.5 sm:px-6 sm:py-5 rounded-xl text-white font-sans text-sm sm:text-base md:text-lg font-medium shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:pointer-events-none ${colorConfig.bg} ${opacityClass}`}
                    >
                      {/* 經典幾何形狀 */}
                      <span className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/20 text-lg">
                        {colorConfig.icon}
                      </span>
                      <span className="text-left leading-snug">{choice.text}</span>

                      {/* 選中的高亮框 */}
                      {isSelected && (
                        <div className="absolute inset-0 border-4 border-white rounded-xl animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ────────────────────────────────────────────────────────
              RESULT - 答題結果顯示 + 現場賓客數據直條圖
              ──────────────────────────────────────────────────────── */}
          {gameState === 'RESULT' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className="w-full flex flex-col gap-6"
            >
              {/* 答對答錯的大 Banner */}
              {currentQuestion.type === 'quiz' ? (
                (() => {
                  const isCorrect =
                    selectedChoiceIndex !== null &&
                    selectedChoiceIndex >= 0 &&
                    currentQuestion.choices[selectedChoiceIndex]?.isCorrect;
                  const pts = isCorrect
                    ? Math.round(1000 * (1 - (timeTaken / currentQuestion.duration) * 0.5)) +
                      Math.min((streak - 1) * 100, 500)
                    : 0;

                  return (
                    <div
                      className={`rounded-2xl p-4 sm:p-6 text-center text-white shadow-lg flex flex-col items-center gap-1.5 sm:gap-2 ${
                        isCorrect
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                          : 'bg-gradient-to-r from-rose-500 to-red-600'
                      }`}
                    >
                      <span className="text-4xl sm:text-5xl">{isCorrect ? '✅' : '❌'}</span>
                      <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-wider">
                        {isCorrect ? '答對了！' : selectedChoiceIndex === -1 ? '時間到！' : '答錯了！'}
                      </h2>
                      <p className="font-sans text-xs sm:text-sm opacity-90">
                        {isCorrect
                          ? `作答時間：${timeTaken.toFixed(2)} 秒，獲得 +${pts} 分！`
                          : selectedChoiceIndex === -1
                            ? '別氣餒，下一題請把握時間作答！'
                            : '正確答案就在下方，看現場數據吧！'}
                      </p>
                    </div>
                  );
                })()
              ) : (
                <div className="rounded-2xl p-4 sm:p-6 text-center text-white shadow-lg bg-gradient-to-r from-[#b08d55] to-[#c7a976] flex flex-col items-center gap-1.5 sm:gap-2">
                  <span className="text-4xl sm:text-5xl">📊</span>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-wider">感謝您的回饋！</h2>
                  <p className="font-sans text-xs sm:text-sm opacity-90">
                    此題為投票題，不列入積分計分。讓我們看看當時現場大家的感受！
                  </p>
                </div>
              )}

              {/* 現場作答統計直條圖 */}
              <div className="glass-panel rounded-2xl p-6 md:p-8 shadow-md">
                <h3 className="font-serif text-base text-stone-700 font-bold mb-5 flex items-center justify-between">
                  <span>📊 婚禮當天現場 171 位賓客真實數據</span>
                  <span className="text-xs text-stone-400 font-sans font-normal">
                    正確答案以綠色外框顯示
                  </span>
                </h3>

                <div className="space-y-4">
                  {currentQuestion.choices.map((choice, idx) => {
                    const colorConfig = KAHOOT_COLORS[idx % 4];
                    const isUserChoice = selectedChoiceIndex === idx;

                    // 計算百分比
                    const totalAnswers = currentQuestion.choices.reduce((sum, c) => sum + c.answersCount, 0);
                    const percentage = totalAnswers > 0 ? Math.round((choice.answersCount / totalAnswers) * 100) : 0;
                    const hasPlayers = choice.players && choice.players.length > 0;

                    return (
                      <div
                        key={idx}
                        onClick={() => hasPlayers && setExpandedChoiceIdx(expandedChoiceIdx === idx ? null : idx)}
                        className={`space-y-1.5 p-2 rounded-xl transition-all ${
                          hasPlayers ? 'cursor-pointer hover:bg-stone-50/50 hover:shadow-sm' : ''
                        }`}
                      >
                        <div className="flex justify-between items-center text-xs font-sans">
                          <div className="flex items-center gap-2">
                            {/* 三角形、圓形小標誌 */}
                            <span className={`w-5 h-5 flex items-center justify-center rounded text-[10px] text-white ${colorConfig.bg}`}>
                              {colorConfig.icon}
                            </span>
                            <span className="font-medium text-stone-800">{choice.text}</span>
                            {isUserChoice && (
                              <span className="px-1.5 py-0.5 bg-[#8E3535]/10 text-[#8E3535] rounded-[4px] text-[9px] font-bold">
                                您的選擇
                              </span>
                            )}
                          </div>
                          <div className="text-stone-500 font-medium flex items-center gap-1">
                            <span>
                              {choice.answersCount} 票 ({percentage}%)
                              {choice.avgTime > 0 && ` ‧ 平均答題 ${choice.avgTime}秒`}
                            </span>
                            {hasPlayers && (
                              <span className="text-[10px] text-[#8E3535] font-bold ml-1 flex items-center gap-0.5">
                                👥 看名單 {expandedChoiceIdx === idx ? '▲' : '▼'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 長條進度條 */}
                        <div
                          className={`w-full h-8 rounded-lg bg-stone-100 overflow-hidden relative ${
                            choice.isCorrect ? 'ring-2 ring-emerald-500 ring-offset-1' : ''
                          }`}
                        >
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full rounded-lg"
                            style={{
                              backgroundColor: choice.isCorrect
                                ? colorConfig.style.backgroundColor
                                : `color-mix(in srgb, ${colorConfig.style.backgroundColor} 40%, #e5e7eb)`
                            }}
                          />
                          {choice.isCorrect && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 text-xs font-bold">
                              ✓ 正確答案
                            </span>
                          )}
                        </div>

                        {/* 展開名單 */}
                        <AnimatePresence>
                          {expandedChoiceIdx === idx && choice.players && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.25 }}
                              className="p-3 bg-white/60 border border-stone-200/40 rounded-lg text-[11px] text-stone-600 space-y-1.5 mt-1 overflow-hidden"
                            >
                              <div className="font-bold text-[#8E3535] flex justify-between items-center">
                                <span>👥 選擇此項目的賓客名單 ({choice.players.length} 人)：</span>
                                <span className="text-[9px] text-stone-400 font-normal">可向下滑動看完整名單</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1 scrollbar-thin leading-relaxed">
                                {choice.players.map((name, pIdx) => (
                                  <span
                                    key={pIdx}
                                    className="px-2 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-full border border-stone-200/20 transition-colors"
                                  >
                                    {name}
                                  </span>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}

                  {/* 逾時未作答名單 */}
                  {currentQuestion.noAnswerPlayers && currentQuestion.noAnswerPlayers.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-stone-200/40 px-2">
                      <button
                        onClick={() => setExpandedChoiceIdx(expandedChoiceIdx === -2 ? null : -2)}
                        className="flex justify-between items-center w-full text-xs text-stone-500 hover:text-stone-700 transition-colors font-medium select-none"
                      >
                        <span className="flex items-center gap-1">
                          ⏳ 逾時未作答賓客 ({currentQuestion.noAnswerPlayers.length} 人)
                        </span>
                        <span className="text-[10px]">{expandedChoiceIdx === -2 ? '收合 ▲' : '展開 ▼'}</span>
                      </button>
                      <AnimatePresence>
                        {expandedChoiceIdx === -2 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="p-3 bg-stone-50/60 border border-stone-200/30 rounded-lg mt-2 overflow-hidden"
                          >
                            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1 scrollbar-thin leading-relaxed">
                              {currentQuestion.noAnswerPlayers.map((name, pIdx) => (
                                <span
                                  key={pIdx}
                                  className="px-2 py-0.5 bg-stone-200/50 text-stone-600 rounded-full text-[10px]"
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>

              {/* 按鈕 */}
              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  className="px-8 py-3 bg-stone-800 text-white rounded-lg shadow-md hover:bg-stone-900 active:scale-[0.98] transition-all font-serif tracking-widest text-sm"
                >
                  {currentQIndex === questions.length - 1 ? '查看最終結果' : '下一題 (查看記分板)'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ────────────────────────────────────────────────────────
              SCOREBOARD - 中場積分與現場名次對比
              ──────────────────────────────────────────────────────── */}
          {gameState === 'SCOREBOARD' && (
            <motion.div
              key="scoreboard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className="w-full flex flex-col gap-6"
            >
              {(() => {
                // 1. 計算當前與前一題的即時排行榜
                const currLeaderboard = getLeaderboardAtQuestion(currentQIndex, score);
                const prevLeaderboard = getLeaderboardAtQuestion(currentQIndex - 1, score - lastPointsGained);

                const selfCurr = currLeaderboard.find(item => item.isSelf);
                const selfPrev = prevLeaderboard.find(item => item.isSelf);

                const selfCurrRank = selfCurr ? selfCurr.rank : 999;
                const selfPrevRank = selfPrev ? selfPrev.rank : 999;
                const selfRankChange = currentQIndex > 0 ? selfPrevRank - selfCurrRank : 0;

                // 2. 決定列表要展示的玩家名單：前 5 名 + (若玩家在 5 名外) 加上分割線及前後名次
                const finalDisplayList: any[] = [];
                const topCount = Math.min(5, currLeaderboard.length);
                for (let i = 0; i < topCount; i++) {
                  finalDisplayList.push({ ...currLeaderboard[i], id: `top-${i}` });
                }

                const userIndex = currLeaderboard.findIndex(item => item.isSelf);
                if (userIndex >= topCount) {
                  finalDisplayList.push({ isDivider: true, id: 'divider-scoreboard' });
                  
                  // 玩家前一位
                  if (currLeaderboard[userIndex - 1]) {
                    finalDisplayList.push({ ...currLeaderboard[userIndex - 1], id: 'user-prev' });
                  }
                  // 玩家本人
                  finalDisplayList.push({ ...currLeaderboard[userIndex], id: 'user-self' });
                  // 玩家後一位
                  if (currLeaderboard[userIndex + 1]) {
                    finalDisplayList.push({ ...currLeaderboard[userIndex + 1], id: 'user-next' });
                  }
                }

                return (
                  <>
                    <div className="text-center space-y-3">
                      <p className="font-display text-[#b08d55] text-xs tracking-[0.3em] uppercase">
                        Scoreboard
                      </p>
                      <h2 className="font-serif text-2xl text-stone-800">
                        您的累計分數：<span className="font-mono text-3xl font-bold text-[#8E3535]">{score}</span> 分
                      </h2>

                      {/* 投票題說明提示 */}
                      {questions[currentQIndex]?.type === 'poll' && (
                        <div className="max-w-md mx-auto p-3.5 rounded-xl border border-amber-200/50 bg-amber-50/70 text-xs text-amber-800 text-center font-sans space-y-1.5 shadow-sm">
                          <p className="font-bold flex items-center justify-center gap-1.5 text-sm">
                            💡 溫馨提示：本題為熱身投票題
                          </p>
                          <p className="text-amber-700/90 leading-relaxed font-medium">
                            投票題是不計入分數的喔！所以大家目前累計得分皆為 0 分。
                            從下一題開始將會正式累計分數與計算名次，準備迎接挑戰吧！
                          </p>
                        </div>
                      )}
                      
                      {/* 個人名次變動大 Banner */}
                      <div className="max-w-md mx-auto py-2.5 px-4 rounded-xl border border-stone-200/50 bg-white/60 text-xs font-medium text-stone-600 flex items-center justify-center gap-1.5 shadow-sm font-sans">
                        <span>目前排名：第 <strong className="text-stone-800 text-sm">{selfCurrRank}</strong> 名</span>
                        {currentQIndex > 0 ? (
                          selfRankChange > 0 ? (
                            <span className="text-emerald-600 font-bold flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                              ▲ 名次上升了 {selfRankChange} 名！ 📈
                            </span>
                          ) : selfRankChange < 0 ? (
                            <span className="text-rose-600 font-bold flex items-center gap-0.5 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                              ▼ 名次下降了 {Math.abs(selfRankChange)} 名 📉
                            </span>
                          ) : (
                            <span className="text-stone-500 font-bold flex items-center gap-0.5 bg-stone-50 px-2 py-0.5 rounded border border-stone-200/50">
                              ● 名次持平 ✊
                            </span>
                          )
                        ) : (
                          <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-100 animate-pulse">
                            ✨ 新加入戰局！
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 積分榜清單 */}
                    <div className="glass-panel rounded-2xl p-6 shadow-md space-y-4">
                      <h3 className="font-serif text-sm text-stone-700 font-bold border-b border-stone-200/40 pb-2">
                        🏁 即時名次與變化
                      </h3>

                      <div className="space-y-1.5">
                        {finalDisplayList.map((item, idx) => {
                          if (item.isDivider) {
                            return (
                              <div key={item.id} className="text-center py-1 text-stone-400 font-bold text-xs select-none">
                                ‧ ‧ ‧ ‧ ‧ ‧ ‧ ‧ ‧ ‧ ‧ ‧ ‧ ‧
                              </div>
                            );
                          }

                          const isSelf = item.isSelf;
                          const rowStyle = isSelf
                            ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 ring-1 ring-amber-300 shadow-sm'
                            : 'bg-white/50 border-stone-100';

                          // 計算該玩家在此題的名次變化
                          let playerRankChange = 0;
                          if (currentQIndex > 0) {
                            const prevEntry = prevLeaderboard.find(p => p.player === item.player);
                            if (prevEntry) {
                              playerRankChange = prevEntry.rank - item.rank;
                            }
                          }

                          return (
                            <div
                              key={item.id}
                              className={`flex items-center justify-between p-3 rounded-lg border text-xs font-sans transition-all ${rowStyle}`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold ${
                                  item.rank <= 3
                                    ? item.rank === 1 ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                      : item.rank === 2 ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                      : 'bg-orange-100 text-orange-700 border border-orange-200'
                                    : 'bg-stone-50 text-stone-500 border border-stone-100'
                                }`}>
                                  {item.rank}
                                </span>
                                <span className={`font-medium ${isSelf ? 'text-amber-800 font-bold text-sm' : 'text-stone-800'}`}>
                                  {item.player} {isSelf && ' (您)'}
                                </span>

                                {/* 榜單內的名次升降箭頭指標 */}
                                {currentQIndex > 0 && playerRankChange !== 0 && (
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                                    playerRankChange > 0 
                                      ? 'text-emerald-600 bg-emerald-50/50' 
                                      : 'text-rose-600 bg-rose-50/50'
                                  }`}>
                                    {playerRankChange > 0 ? `▲ ${playerRankChange}` : `▼ ${Math.abs(playerRankChange)}`}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-4 text-stone-500">
                                <span className={`font-mono font-bold ${isSelf ? 'text-amber-700 text-sm' : 'text-stone-700'}`}>
                                  {item.score} 分
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                );
              })()}

              {/* 按鈕 */}
              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  className="px-8 py-3 bg-stone-800 text-white rounded-lg shadow-md hover:bg-stone-900 active:scale-[0.98] transition-all font-serif tracking-widest text-sm"
                >
                  {currentQIndex === questions.length - 1 ? '查看最終頒獎台' : '進入下一題'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ────────────────────────────────────────────────────────
              GAMEOVER - 遊戲結束、頒獎台 Podium
              ──────────────────────────────────────────────────────── */}
          {gameState === 'GAMEOVER' && (
            <motion.div
              key="gameover"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              className="w-full flex flex-col items-center gap-6"
            >
              <div className="text-center space-y-2">
                <h2 className="font-serif text-3xl md:text-4xl text-stone-800 font-bold">
                  🎉 挑戰完成！
                </h2>
                <p className="font-display text-[#b08d55] text-xs tracking-[0.3em] uppercase">
                  Wedding Quiz Podium
                </p>
                <div className="h-[2px] w-20 bg-[#b08d55]/30 mx-auto mt-3" />
              </div>

              {/* 3D 模擬頒獎台 */}
              <div className="w-full py-8 glass-panel rounded-2xl shadow-xl flex flex-col items-center justify-end min-h-[300px] relative px-4">
                <h3 className="font-serif text-sm text-stone-600 mb-6 font-medium">
                  👑 結合您成績後的最終大合影 (頒獎台)
                </h3>

                <div className="flex items-end justify-center w-full max-w-md gap-2 md:gap-4 font-sans text-xs">
                  {/* 排行榜邏輯：取得前三名 */}
                  {(() => {
                    const tempBoard = originalLeaderboard.map((e, index) => ({
                      ...e,
                      id: `leader-${index}`,
                      isPlayer: false
                    }));
                    tempBoard.push({
                      rank: 999,
                      player: nickname,
                      score: score,
                      correctAnswers: correctCount,
                      incorrectAnswers: questions.length - 1 - correctCount,
                      id: 'player-id',
                      isPlayer: true
                    });
                    tempBoard.sort((a, b) => {
                      if (b.score !== a.score) return b.score - a.score;
                      return b.correctAnswers - a.correctAnswers;
                    });

                    // 取前 3 名
                    const podium1 = tempBoard[0];
                    const podium2 = tempBoard[1];
                    const podium3 = tempBoard[2];

                    const isMobilePodium = typeof window !== 'undefined' && window.innerWidth < 640;

                    return (
                      <>
                        {/* 第二名 */}
                        {podium2 && (
                          <div className="flex flex-col items-center flex-1">
                            <span className="font-bold text-stone-700 mb-1.5 text-center truncate max-w-[60px] sm:max-w-[80px] text-[10px] sm:text-xs">
                              {podium2.player} {podium2.isPlayer && '(您)'}
                            </span>
                            <span className="text-[9px] sm:text-[10px] text-stone-500 font-mono mb-2">
                              {podium2.score} pts
                            </span>
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: isMobilePodium ? 60 : 80 }}
                              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                              className="w-full bg-slate-300 rounded-t-lg flex items-center justify-center border-t-2 border-slate-200 shadow-md relative"
                            >
                              <span className="text-2xl sm:text-3xl font-bold text-slate-500">2</span>
                              {podium2.isPlayer && (
                                <div className="absolute -top-3 w-3 h-3 bg-amber-500 rounded-full animate-ping" />
                              )}
                            </motion.div>
                          </div>
                        )}

                        {/* 第一名 */}
                        {podium1 && (
                          <div className="flex flex-col items-center flex-1">
                            <span className="font-bold text-amber-600 mb-1.5 text-center truncate max-w-[70px] sm:max-w-[90px] text-xs sm:text-sm flex items-center justify-center gap-0.5">
                              👑{podium1.player} {podium1.isPlayer && '(您)'}
                            </span>
                            <span className="text-[10px] sm:text-[11px] text-amber-700 font-mono mb-2 font-bold">
                              {podium1.score} pts
                            </span>
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: isMobilePodium ? 90 : 120 }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                              className="w-full bg-amber-400 rounded-t-lg flex items-center justify-center border-t-2 border-amber-300 shadow-lg relative"
                            >
                              <span className="text-3xl sm:text-4xl font-bold text-amber-700">1</span>
                              {podium1.isPlayer && (
                                <div className="absolute -top-3 w-4 h-4 bg-orange-500 rounded-full animate-ping" />
                              )}
                            </motion.div>
                          </div>
                        )}

                        {/* 第三名 */}
                        {podium3 && (
                          <div className="flex flex-col items-center flex-1">
                            <span className="font-bold text-orange-700 mb-1.5 text-center truncate max-w-[60px] sm:max-w-[80px] text-[10px] sm:text-xs">
                              {podium3.player} {podium3.isPlayer && '(您)'}
                            </span>
                            <span className="text-[9px] sm:text-[10px] text-orange-600 font-mono mb-2">
                              {podium3.score} pts
                            </span>
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: isMobilePodium ? 45 : 60 }}
                              transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                              className="w-full bg-orange-300 rounded-t-lg flex items-center justify-center border-t-2 border-orange-200 shadow-md relative"
                            >
                              <span className="text-xl sm:text-2xl font-bold text-orange-600">3</span>
                              {podium3.isPlayer && (
                                <div className="absolute -top-3 w-3 h-3 bg-amber-500 rounded-full animate-ping" />
                              )}
                            </motion.div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* 玩家個人報告 */}
              <div className="glass-panel rounded-2xl p-6 w-full shadow-lg border border-stone-100 flex flex-col md:flex-row items-center justify-around gap-6 text-center md:text-left">
                <div className="space-y-1">
                  <h4 className="font-serif text-xs text-stone-400 uppercase tracking-widest">玩家暱稱</h4>
                  <p className="font-serif text-lg font-bold text-stone-800">{nickname}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif text-xs text-stone-400 uppercase tracking-widest">最終得分</h4>
                  <p className="font-mono text-2xl font-bold text-[#8E3535]">{score} 分</p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif text-xs text-stone-400 uppercase tracking-widest">正確率</h4>
                  <p className="font-serif text-lg font-bold text-stone-800">
                    答對 {correctCount} 題 / 共 {questions.length - 1} 題
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif text-xs text-stone-400 uppercase tracking-widest">綜合排行</h4>
                  <p className="font-serif text-lg font-bold text-amber-600">
                    第 {userRank} 名 / 172 人
                  </p>
                </div>
              </div>

              {/* 按鈕組 */}
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:justify-center">
                <button
                  onClick={handleStartGame}
                  className="px-8 py-3.5 bg-gradient-to-r from-[#8E3535] to-[#a34b4b] text-white rounded-lg shadow-md hover:scale-[1.01] hover:shadow-lg active:scale-[0.99] transition-all font-serif tracking-widest text-sm font-medium"
                >
                  再挑戰一次
                </button>
                <button
                  onClick={() => setGameState('REVIEW')}
                  className="px-8 py-3.5 bg-white border border-stone-200 text-stone-700 rounded-lg shadow-sm hover:bg-stone-50 active:scale-[0.99] transition-all font-serif tracking-widest text-sm"
                >
                  完整題庫與現場統計回顧
                </button>
              </div>
            </motion.div>
          )}

          {/* ────────────────────────────────────────────────────────
              REVIEW - 完整題庫回顧模式
              ──────────────────────────────────────────────────────── */}
          {gameState === 'REVIEW' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="font-serif text-2xl md:text-3xl text-stone-800 font-bold">
                  大考驗完整題目回顧
                </h2>
                <p className="font-sans text-xs text-stone-500">
                  可展開各題查看詳細的正確答案與現場統計分佈。
                </p>
              </div>

              {/* 題目列表 */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                {questions.map((q, qIdx) => {
                  return (
                    <QuestionReviewRow
                      key={q.index}
                      question={q}
                      qIdx={qIdx}
                      questions={questions}
                      colorConfig={KAHOOT_COLORS}
                    />
                  );
                })}
              </div>

              {/* 按鈕組 */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <button
                  onClick={() => {
                    setIsConfettiActive(false);
                    setGameState('LOBBY');
                  }}
                  className="px-8 py-3 bg-stone-800 text-white rounded-lg shadow-md hover:bg-stone-900 active:scale-[0.98] transition-all font-serif tracking-widest text-sm"
                >
                  回大廳
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="px-8 py-3 bg-white border border-stone-200 text-stone-700 rounded-lg shadow-sm hover:bg-stone-50 active:scale-[0.98] transition-all font-serif tracking-widest text-sm"
                >
                  回網頁首頁
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </section>

      {/* 底部裝飾 */}
      <footer className="w-full text-center text-[10px] text-stone-400 uppercase tracking-[0.3em] py-2 z-10">
        Joy & Jacky Wedding Quiz Replay
      </footer>
    </main>
  );
}

// --- 題目回顧列子組件 (摺疊展開) ---
function QuestionReviewRow({
  question,
  qIdx,
  questions,
  colorConfig
}: {
  question: Question;
  qIdx: number;
  questions: Question[];
  colorConfig: any[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'leaderboard'>('stats');
  const [expandedChoiceIdx, setExpandedChoiceIdx] = useState<number | null>(null);
  const [isShowAllLeaderboard, setIsShowAllLeaderboard] = useState(false);

  // 當收合整個題目時，重置選項展開與 Tab 狀態
  useEffect(() => {
    if (!isOpen) {
      setExpandedChoiceIdx(null);
      setActiveTab('stats');
      setIsShowAllLeaderboard(false);
    }
  }, [isOpen]);

  // 計算某題的積分榜 (不含挑戰者本人，純現場 171 名賓客)
  const getReviewLeaderboard = useCallback((idx: number) => {
    if (idx < 0) return [];
    const q = questions[idx];
    if (!q || !q.scores) return [];

    const list = Object.entries(q.scores).map(([player, scoreVal]) => ({
      player,
      score: scoreVal as number,
      rank: 999
    }));

    // 依分數降序排序
    list.sort((a, b) => b.score - a.score);

    // 指派排名
    list.forEach((item, index) => {
      item.rank = index + 1;
    });

    return list;
  }, [questions]);

  const currBoard = useMemo(() => getReviewLeaderboard(qIdx), [qIdx, getReviewLeaderboard]);
  const prevBoard = useMemo(() => {
    if (qIdx <= 0) return [];
    return getReviewLeaderboard(qIdx - 1);
  }, [qIdx, getReviewLeaderboard]);

  return (
    <div className="glass-panel rounded-xl overflow-hidden shadow-sm border border-stone-100/60 font-sans">
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-stone-50/50 transition-colors"
      >
        <div className="space-y-1">
          <span className="text-[10px] text-[#b08d55] font-bold uppercase tracking-widest">
            第 {question.index} 題 ‧ {question.type === 'poll' ? '投票題' : '問答題'}
          </span>
          <h4 className="font-serif text-sm font-semibold text-stone-800 leading-relaxed">
            {question.question}
          </h4>
        </div>
        <span className="text-stone-400 font-bold text-sm ml-4 shrink-0 select-none">
          {isOpen ? '收合 ▲' : '展開 ▼'}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-stone-100 bg-stone-50/40 px-5 py-4 space-y-4 overflow-hidden"
          >
            {/* Tabs 切換按鈕 */}
            <div className="flex gap-2 border-b border-stone-200/40 pb-2">
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all duration-200 ${
                  activeTab === 'stats'
                    ? 'bg-[#8E3535] text-white shadow-xs'
                    : 'bg-stone-100 hover:bg-stone-200/70 text-stone-600'
                }`}
              >
                📊 答題統計
              </button>
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all duration-200 ${
                  activeTab === 'leaderboard'
                    ? 'bg-[#8E3535] text-white shadow-xs'
                    : 'bg-stone-100 hover:bg-stone-200/70 text-stone-600'
                }`}
              >
                🏆 現場即時積分榜
              </button>
            </div>

            {/* Tab 1: 答題統計 */}
            {activeTab === 'stats' && (
              <div className="space-y-3.5">
                {question.choices.map((choice, idx) => {
                  const totalAnswers = question.choices.reduce((sum, c) => sum + c.answersCount, 0);
                  const percentage = totalAnswers > 0 ? Math.round((choice.answersCount / totalAnswers) * 100) : 0;
                  const col = colorConfig[idx % 4];
                  const hasPlayers = choice.players && choice.players.length > 0;

                  return (
                    <div
                      key={idx}
                      onClick={() => hasPlayers && setExpandedChoiceIdx(expandedChoiceIdx === idx ? null : idx)}
                      className={`space-y-1.5 p-1.5 rounded-lg transition-all ${
                        hasPlayers ? 'cursor-pointer hover:bg-white/40 hover:shadow-xs' : ''
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5 font-medium text-stone-700">
                          <span className={`w-4 h-4 flex items-center justify-center rounded-[3px] text-[8px] text-white ${col.bg}`}>
                            {col.icon}
                          </span>
                          <span>{choice.text}</span>
                        </div>
                        <div className="text-stone-500 font-mono flex items-center gap-1">
                          <span>
                            {choice.answersCount} 票 ({percentage}%) {choice.avgTime > 0 && ` ‧ 平均答題 ${choice.avgTime}秒`}
                          </span>
                          {hasPlayers && (
                            <span className="text-[9px] text-[#8E3535] font-bold ml-1 flex items-center gap-0.5">
                              👥 名單 {expandedChoiceIdx === idx ? '▲' : '▼'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className={`w-full h-6 rounded bg-stone-100 overflow-hidden relative ${
                        choice.isCorrect ? 'ring-1 ring-emerald-500' : ''
                      }`}>
                        <div
                          className="h-full rounded"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: choice.isCorrect
                              ? col.style.backgroundColor
                              : `color-mix(in srgb, ${col.style.backgroundColor} 30%, #e5e7eb)`
                          }}
                        />
                        {choice.isCorrect && (
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-600 text-[10px] font-bold">
                            ✓ 正確答案
                          </span>
                        )}
                      </div>

                      {/* 展開名單 */}
                      <AnimatePresence>
                        {expandedChoiceIdx === idx && choice.players && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="p-2.5 bg-white/80 border border-stone-200/30 rounded-md text-[10px] text-stone-600 space-y-1 mt-1 overflow-hidden"
                          >
                            <div className="font-bold text-[#8E3535]">
                              👥 選擇此項目的賓客名單 ({choice.players.length} 人)：
                            </div>
                            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1 scrollbar-thin leading-relaxed">
                              {choice.players.map((name, pIdx) => (
                                <span
                                  key={pIdx}
                                  className="px-1.5 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md border border-stone-200/10 transition-colors"
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {/* 逾時未作答名單 */}
                {question.noAnswerPlayers && question.noAnswerPlayers.length > 0 && (
                  <div className="pt-2 border-t border-stone-200/30">
                    <button
                      onClick={() => setExpandedChoiceIdx(expandedChoiceIdx === -2 ? null : -2)}
                      className="flex justify-between items-center w-full text-xs text-stone-500 hover:text-stone-700 transition-colors font-medium select-none"
                    >
                      <span>⏳ 逾時未作答賓客 ({question.noAnswerPlayers.length} 人)</span>
                      <span className="text-[10px]">{expandedChoiceIdx === -2 ? '收合 ▲' : '展開 ▼'}</span>
                    </button>
                    <AnimatePresence>
                      {expandedChoiceIdx === -2 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="p-2.5 bg-stone-50/60 border border-stone-200/30 rounded-md mt-1.5 overflow-hidden"
                        >
                          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1 scrollbar-thin leading-relaxed">
                            {question.noAnswerPlayers.map((name, pIdx) => (
                              <span
                                key={pIdx}
                                className="px-1.5 py-0.5 bg-stone-200/50 text-stone-600 rounded text-[9px]"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: 現場即時積分榜 */}
            {activeTab === 'leaderboard' && (
              <div className="space-y-4">
                {question.type === 'poll' ? (
                  <div className="text-center py-6 text-stone-500 font-sans text-xs bg-stone-50/50 rounded-lg border border-stone-200/20">
                    <span className="block text-xl mb-1">📢</span>
                    本題為熱身投票題，不計入分數。<br/>
                    此時所有人分數皆為 0 分，從下一題（第 2 題）開始正式累計分數！
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center text-xs text-stone-500 border-b border-stone-200/40 pb-1.5">
                      <span className="font-bold text-stone-700">🏆 本題結束時累計積分榜</span>
                      <span>共 {currBoard.length} 名現場賓客</span>
                    </div>

                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                      {currBoard
                        .slice(0, isShowAllLeaderboard ? currBoard.length : 5)
                        .map((item) => {
                          let rankChange = 0;
                          if (qIdx > 0) {
                            const prevItem = prevBoard.find((p) => p.player === item.player);
                            if (prevItem) {
                              rankChange = prevItem.rank - item.rank;
                            }
                          }

                          return (
                            <div
                              key={item.player}
                              className="flex items-center justify-between p-2.5 rounded-lg border border-stone-100 bg-white/60 text-xs font-sans"
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className={`w-5 h-5 flex items-center justify-center rounded-full text-[9px] font-bold ${
                                    item.rank === 1
                                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                      : item.rank === 2
                                      ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                      : item.rank === 3
                                      ? 'bg-orange-100 text-orange-700 border border-orange-200'
                                      : 'bg-stone-50 text-stone-500 border border-stone-100'
                                  }`}
                                >
                                  {item.rank}
                                </span>
                                <span className="font-semibold text-stone-800">{item.player}</span>

                                {/* 升降指標 */}
                                {qIdx > 0 && rankChange !== 0 && (
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                                      rankChange > 0
                                        ? 'text-emerald-600 bg-emerald-50/50'
                                        : 'text-rose-600 bg-rose-50/50'
                                    }`}
                                  >
                                    {rankChange > 0 ? `▲ ${rankChange}` : `▼ ${Math.abs(rankChange)}`}
                                  </span>
                                )}
                                {qIdx > 0 && rankChange === 0 && (
                                  <span className="text-[9px] text-stone-400 font-bold px-1.5 py-0.5 rounded bg-stone-50/50">
                                    ● 持平
                                  </span>
                                )}
                              </div>
                              <div className="font-mono font-bold text-stone-700">{item.score} 分</div>
                            </div>
                          );
                        })}
                    </div>

                    {/* 展開 / 收合全部按鈕 */}
                    {currBoard.length > 5 && (
                      <button
                        onClick={() => setIsShowAllLeaderboard((prev) => !prev)}
                        className="w-full py-2 bg-stone-100 hover:bg-stone-200/80 active:scale-[0.99] transition-all text-stone-600 rounded-lg text-xs font-semibold tracking-wider text-center"
                      >
                        {isShowAllLeaderboard ? '收合完整排行 ▲' : '展開完整現場排行 (共 171 名) ▼'}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
