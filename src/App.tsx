import React, { useState, useEffect } from 'react';
import Game from './components/Game';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Play, RotateCcw, Pause, Volume2, VolumeX } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('lissana-gaha-highscore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('lissana-gaha-highscore', score.toString());
    }
  }, [score, highScore]);

  const startGame = () => {
    setGameState('PLAYING');
    setScore(0);
    setIsPaused(false);
  };

  const handleGameOver = (finalScore: number) => {
    setScore(finalScore);
    setGameState('GAMEOVER');
  };

  return (
    <div className="min-h-screen bg-[#fdf6e3] flex flex-col items-center justify-center font-sans text-[#5d4037] overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-red-500 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-500 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <AnimatePresence mode="wait">
        {gameState === 'START' && (
          <motion.div 
            key="start"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="z-20 flex flex-col items-center text-center p-8 bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border-4 border-amber-600"
          >
            <h1 className="text-5xl font-black mb-2 tracking-tighter text-amber-900 font-serif">
              ලිස්සන ගහ
            </h1>
            <p className="text-lg mb-8 text-amber-800 font-bold">
              ලිස්සන ගහේ අභියෝගය
            </p>
            
            <div className="flex gap-4 mb-8">
              <div className="flex flex-col items-center">
                <span className="text-xs uppercase tracking-widest opacity-60 font-bold">වැඩිම ලකුණු</span>
                <span className="text-2xl font-bold">{highScore}m</span>
              </div>
            </div>

            <button 
              onClick={startGame}
              className="group relative flex items-center justify-center w-24 h-24 bg-amber-600 rounded-full text-white shadow-lg hover:bg-amber-700 transition-all hover:scale-110 active:scale-95"
            >
              <Play className="w-12 h-12 fill-current" />
              <div className="absolute inset-0 rounded-full border-4 border-amber-600 animate-ping opacity-20 group-hover:opacity-40" />
            </button>
            
            <p className="mt-8 text-sm font-bold text-amber-900/60 max-w-xs">
              පැත්ත මාරු කිරීමට තට්ටු කරන්න. තෙල් බින්දු මගහැර ඉහළටම යන්න!
            </p>

            {/* Power-up Guide */}
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-amber-200 pt-6">
              <div className="flex flex-col items-center gap-1">
                <img src="/assets/shield.png" alt="Shield" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
                <span className="text-[10px] font-bold text-blue-600">ආරක්ෂාව</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <img src="/assets/slowmo.png" alt="Slow-mo" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
                <span className="text-[10px] font-bold text-purple-600">වේගය අඩු කිරීම</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <img src="/assets/multiplier.png" alt="Multiplier" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
                <span className="text-[10px] font-bold text-amber-600">ලකුණු 2x</span>
              </div>
            </div>
          </motion.div>
        )}

        {gameState === 'PLAYING' && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative w-full h-screen flex items-center justify-center"
          >
            <Game onGameOver={handleGameOver} isPaused={isPaused} isMuted={isMuted} />
            
            {/* HUD */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/40 transition-colors"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <button 
                onClick={() => setIsPaused(!isPaused)}
                className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/40 transition-colors"
              >
                {isPaused ? <Play size={20} /> : <Pause size={20} />}
              </button>
            </div>

            {isPaused && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-30 flex items-center justify-center">
                <div className="bg-white p-8 rounded-2xl text-center shadow-xl">
                  <h2 className="text-2xl font-bold mb-4">විරාමය</h2>
                  <button 
                    onClick={() => setIsPaused(false)}
                    className="px-8 py-3 bg-amber-600 text-white rounded-full font-bold hover:bg-amber-700"
                  >
                    නැවත ආරම්භ කරන්න
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {gameState === 'GAMEOVER' && (
          <motion.div 
            key="gameover"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="z-20 flex flex-col items-center text-center p-8 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border-4 border-red-600"
          >
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Trophy className="w-10 h-10 text-red-600" />
            </div>
            
            <h2 className="text-4xl font-black mb-2 text-red-900 font-serif uppercase">
              ක්‍රීඩාව අවසන්!
            </h2>
            
            <div className="my-6">
              <div className="text-sm uppercase tracking-widest opacity-60 font-bold">ඔබ නැග්ග දුර</div>
              <div className="text-6xl font-black text-amber-900">{score}m</div>
            </div>

            {score >= highScore && score > 0 && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mb-6 px-4 py-1 bg-yellow-400 text-yellow-900 font-bold rounded-full text-sm uppercase tracking-tighter"
              >
                අලුත් වාර්තාවක්!
              </motion.div>
            )}

            <div className="flex flex-col gap-3 w-full">
              <button 
                onClick={startGame}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-amber-600 text-white rounded-full font-bold shadow-lg hover:bg-amber-700 transition-all hover:scale-105 active:scale-95"
              >
                <RotateCcw size={20} />
                නැවත උත්සාහ කරන්න
              </button>
              
              <button 
                onClick={() => setGameState('START')}
                className="px-8 py-3 bg-white border-2 border-amber-600 text-amber-600 rounded-full font-bold hover:bg-amber-50 transition-all"
              >
                මෙනුවට යන්න
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Branding */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] opacity-30 font-bold">
        Avurudu Traditional Games
      </div>
    </div>
  );
}
