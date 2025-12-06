import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { showRewardAd, safeAlert, showInterstitial } from '../utils/gameMonetize';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiArrowLeft, FiPlay, FiRotateCcw, FiCoins, FiTarget, FiHome } = FiIcons;

// --- Constants ---
const LOG_SIZE = 160;
const LOG_RADIUS = LOG_SIZE / 2;
const KNIFE_HEIGHT = 80;
const KNIFE_WIDTH = 18;
const KNIFE_PENETRATION = 12;
const THROW_DURATION = 0.12;
const ROTATION_SPEED_BASE = 2.5;

const KnifeHitGame = () => {
  const { addPoints, updateGameStats } = useGame();

  function handleWatchAd() {
    showRewardAd()
      .then(() => {
        addPoints(50);
        resetGame();
        safeAlert("Reward: +50 Points!");
      })
      .catch((err) => {
        console.error("Ad failed:", err);
      });
  }

  // Game State
  const [gameState, setGameState] = useState('menu');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [knivesRemaining, setKnivesRemaining] = useState(7);

  // Physics State
  const [stuckKnives, setStuckKnives] = useState([]);
  const [activeKnife, setActiveKnife] = useState(null);
  const [flash, setFlash] = useState(false);
  const [particles, setParticles] = useState([]);

  // Refs for High Performance Animation
  const logRef = useRef(null);
  const requestRef = useRef();
  const rotationSpeedRef = useRef(ROTATION_SPEED_BASE);
  const currentRotationRef = useRef(0);
  const isGameOverRef = useRef(false);

  // --- Game Control ---
  const startGame = () => {
    setLevel(1);
    setScore(0);
    startLevel(1);
  };

  const startLevel = (lvl) => {
    setStuckKnives([]);
    setKnivesRemaining(5 + Math.min(lvl, 5));
    setGameState('playing');
    setParticles([]);
    
    // Reset Physics
    rotationSpeedRef.current = (2 + (lvl * 0.5)) * (Math.random() > 0.5 ? 1 : -1);
    isGameOverRef.current = false;
    currentRotationRef.current = 0;
    
    if (logRef.current) {
      logRef.current.style.transform = `rotate(0deg)`;
    }
    
    startLoop();
  };

  const resetGame = () => {
    startGame();
  };

  // --- Animation Loop ---
  const animate = useCallback(() => {
    if (isGameOverRef.current || gameState !== 'playing') return;

    // Update Rotation
    currentRotationRef.current = (currentRotationRef.current + rotationSpeedRef.current) % 360;
    
    // Apply to DOM directly (bypassing React render cycle for smoothness)
    if (logRef.current) {
      logRef.current.style.transform = `rotate(${currentRotationRef.current}deg)`;
    }

    // Dynamic difficulty: Randomly change speed/direction
    if (Math.random() < 0.005 * level) {
      rotationSpeedRef.current *= -1;
    } else if (Math.random() < 0.01 * level) {
      rotationSpeedRef.current = (Math.random() * 2 + 2) * (rotationSpeedRef.current > 0 ? 1 : -1);
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [gameState, level]);

  const startLoop = useCallback(() => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(animate);
  }, [animate]);

  useEffect(() => {
    if (gameState === 'playing') {
      startLoop();
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState, startLoop]);

  // --- Actions ---
  const throwKnife = () => {
    if (gameState !== 'playing' || activeKnife || isGameOverRef.current) return;

    // 1. Animate throw
    setActiveKnife({ id: Date.now() });

    // 2. Calculate impact after animation finishes
    // Using setTimeout to match the CSS transition/Framer animation time
    setTimeout(() => {
      handleImpact();
    }, THROW_DURATION * 1000);
  };

  const handleImpact = () => {
    setActiveKnife(null);

    // Calculate Hit Angle
    let hitAngle = (360 - currentRotationRef.current) % 360;

    // Collision Detection
    // Tighter tolerance for smaller log (12 degrees approx matches the new width ratio)
    const collision = stuckKnives.some(angle => {
      const diff = Math.abs(angle - hitAngle);
      return diff < 12 || (360 - diff) < 12;
    });

    if (collision) {
      gameOver();
    } else {
      // Success
      setStuckKnives(prev => [...prev, hitAngle]);
      setScore(s => s + 1);
      setKnivesRemaining(prev => prev - 1);
      
      // Visual Feedback
      setFlash(true);
      setTimeout(() => setFlash(false), 50);
      spawnParticles();

      if (knivesRemaining - 1 <= 0) {
        levelComplete();
      }
    }
  };

  const spawnParticles = () => {
    const newParticles = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      vx: (Math.random() - 0.5) * 15,
      vy: Math.random() * 15,
      rotation: Math.random() * 360
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 500);
  };

  const gameOver = () => {
    isGameOverRef.current = true;
    cancelAnimationFrame(requestRef.current);
    setGameState('gameOver');
    showInterstitial(); // Play Ad
    
    // Add effect: Log jumps slightly on fail
    if (logRef.current) {
      logRef.current.style.transform = `rotate(${currentRotationRef.current}deg) scale(0.95)`;
    }
    
    if (score > 0) {
      updateGameStats('knife', score);
      addPoints(score * 2);
    }
  };

  const levelComplete = () => {
    isGameOverRef.current = true;
    cancelAnimationFrame(requestRef.current);
    setTimeout(() => {
      setGameState('levelComplete');
      setTimeout(() => {
        setLevel(l => l + 1);
        startLevel(level + 1);
      }, 1500);
    }, 200);
  };

  // --- Render Helpers ---
  const renderStuckKnife = (angle, index) => (
    <div
      key={index}
      className="absolute top-1/2 left-1/2 w-0 h-0"
      style={{
        transform: `rotate(${angle}deg)`, // Rotate wrapper to the correct angle
        zIndex: 20
      }}
    >
      <div
        className="absolute -translate-x-1/2"
        style={{
          top: `${LOG_RADIUS - KNIFE_PENETRATION}px`, // Push out to edge from center
          width: `${KNIFE_WIDTH}px`,
          height: `${KNIFE_HEIGHT}px`,
          transformOrigin: 'top center'
        }}
      >
        <KnifeGraphic />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center overflow-hidden touch-none select-none">
      {/* --- Header --- */}
      <div className="w-full flex justify-between items-start p-6 z-30">
        <Link to="/games" className="text-white/80 hover:text-white transition-colors p-2 bg-black/20 rounded-xl backdrop-blur-sm">
          <SafeIcon icon={FiArrowLeft} className="w-6 h-6" />
        </Link>
        <div className="flex flex-col items-center">
          <div className="text-5xl font-black text-white drop-shadow-lg tracking-wider font-mono">
            {score}
          </div>
          <div className="text-emerald-400 font-bold text-sm tracking-widest uppercase mt-1">
            Stage {level}
          </div>
        </div>
        <div className="w-10"></div>
      </div>

      {/* --- Game Area --- */}
      <div className="flex-1 w-full max-w-md relative flex flex-col items-center justify-start pt-16">
        
        {/* LOG & TARGET CONTAINER */}
        <div className="relative z-10">
           {/* Shake Wrapper (Animated by React/Framer) */}
           <motion.div
             animate={flash ? { y: [0, -6, 0], scale: [1, 1.02, 1] } : {}}
             transition={{ duration: 0.1 }}
             className="relative"
           >
              {/* The Rotating Log (Animated by Ref/JS) */}
              <div
                ref={logRef}
                style={{ width: LOG_SIZE, height: LOG_SIZE, willChange: 'transform' }}
                className="relative rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
              >
                  {/* Log Graphics */}
                  <div className="absolute inset-0 rounded-full bg-[#5D4037] border-[5px] border-[#3E2723] overflow-hidden">
                      {/* Wood Texture Rings */}
                      <div className="absolute inset-3 rounded-full border-[3px] border-[#4E342E] opacity-50"></div>
                      <div className="absolute inset-8 rounded-full border-[3px] border-[#3E2723] opacity-40"></div>
                      <div className="absolute inset-16 rounded-full border-[3px] border-[#4E342E] opacity-60"></div>
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-30 mix-blend-overlay"></div>
                      {/* Center Knot */}
                      <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-[#3E2723] shadow-inner"></div>
                      </div>
                  </div>

                  {/* Stuck Knives container inside the rotating log */}
                  {stuckKnives.map((angle, i) => renderStuckKnife(angle, i))}
              </div>
           </motion.div>

           {/* Impact Particles (Outside rotation) */}
           {particles.map(p => (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: LOG_RADIUS, opacity: 1, scale: 1 }}
                animate={{ x: p.vx * 15, y: LOG_RADIUS + p.vy * 15, opacity: 0, scale: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute left-1/2 top-1/2 w-2 h-2 bg-[#F5DEB3] rounded-sm z-20 shadow-sm"
                style={{ marginLeft: -4, marginTop: -4 }}
              />
           ))}
        </div>

        {/* --- Throwing Station --- */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 h-40 w-24 flex flex-col justify-end items-center z-20">
            {/* Active Throwing Knife Animation */}
            <AnimatePresence>
                {activeKnife && (
                    <motion.div
                        initial={{ y: 0 }}
                        animate={{ y: -450 }}
                        transition={{ duration: THROW_DURATION, ease: "linear" }}
                        className="absolute bottom-0"
                        style={{ width: KNIFE_WIDTH, height: KNIFE_HEIGHT }}
                    >
                        <KnifeGraphic />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Idle Knife (Ready to throw) */}
            {!activeKnife && gameState === 'playing' && (
                <div 
                    className="cursor-pointer hover:scale-105 transition-transform"
                    style={{ width: KNIFE_WIDTH, height: KNIFE_HEIGHT }}
                >
                    <KnifeGraphic />
                </div>
            )}
            
            {/* Tap Hint */}
            {!activeKnife && gameState === 'playing' && (
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-60">
                    <span className="text-white text-xs font-bold tracking-widest animate-pulse">TAP TO THROW</span>
                </div>
            )}
        </div>

        {/* Tap Area (Full Screen) */}
        {gameState === 'playing' && (
            <div className="absolute inset-0 z-50 cursor-pointer" onClick={throwKnife} />
        )}

        {/* Knife Counter */}
        <div className="absolute bottom-8 left-6 flex flex-col gap-2">
            {Array.from({ length: Math.max(knivesRemaining, 0) }).map((_, i) => (
                <SafeIcon key={i} icon={FiTarget} className="w-5 h-5 text-emerald-500 drop-shadow-md filter brightness-125" />
            ))}
            {Array.from({ length: Math.max(0, (5 + Math.min(level, 5)) - knivesRemaining) }).map((_, i) => (
                <SafeIcon key={`used-${i}`} icon={FiTarget} className="w-5 h-5 text-gray-700 opacity-50" />
            ))}
        </div>

      </div>

      {/* --- Overlays --- */}
      
      {/* Menu */}
      {gameState === 'menu' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-8">
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
            >
                <div className="text-7xl mb-6">🗡️</div>
                <h1 className="text-6xl font-black text-white mb-2 italic tracking-tighter">KNIFE<br/><span className="text-emerald-500">HIT</span></h1>
                <p className="text-gray-400 mb-10 font-bold tracking-wide text-lg">MASTER THE THROW</p>
                <button
                    onClick={startGame}
                    className="group relative px-10 py-5 bg-emerald-500 text-white font-black text-2xl rounded-2xl shadow-[0_10px_20px_rgba(16,185,129,0.4)] hover:shadow-[0_15px_30px_rgba(16,185,129,0.6)] hover:-translate-y-1 transition-all active:translate-y-0 active:shadow-none"
                >
                    <span className="relative z-10 flex items-center gap-3">
                        <SafeIcon icon={FiPlay} className="w-8 h-8" />
                        PLAY
                    </span>
                </button>
            </motion.div>
        </div>
      )}

      {/* Game Over */}
      {gameState === 'gameOver' && (
        <div className="absolute inset-0 bg-red-900/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-8">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center w-full max-w-sm"
            >
                <div className="text-7xl mb-4">💥</div>
                <h2 className="text-5xl font-black text-white mb-2 uppercase italic">Failed!</h2>
                <div className="bg-black/30 rounded-2xl p-6 mb-8 border border-white/10">
                    <div className="text-gray-400 text-sm font-bold uppercase mb-1">Score</div>
                    <div className="text-6xl font-black text-white">{score}</div>
                </div>
                
                <button
                    onClick={handleWatchAd}
                    className="w-full mb-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 text-lg"
                >
                    <SafeIcon icon={FiCoins} className="w-6 h-6" />
                    Continue (+50)
                </button>
                
                <div className="flex gap-2">
                    <button
                        onClick={resetGame}
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-xl border-2 border-white/20 transition-all flex items-center justify-center gap-2 text-lg"
                    >
                        <SafeIcon icon={FiRotateCcw} className="w-6 h-6" />
                        Retry
                    </button>
                    
                    <Link
                        to="/"
                        className="bg-black/40 hover:bg-black/60 text-white font-bold py-4 px-6 rounded-xl border-2 border-white/10 transition-all flex items-center justify-center"
                    >
                         <SafeIcon icon={FiHome} className="w-6 h-6" />
                    </Link>
                </div>
            </motion.div>
        </div>
      )}

      {/* Level Complete */}
      {gameState === 'levelComplete' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 1 }}
                exit={{ scale: 2, opacity: 0 }}
                className="text-emerald-400 font-black text-6xl drop-shadow-[0_4px_0_rgba(0,0,0,0.5)] italic"
            >
                CLEARED!
            </motion.div>
        </div>
      )}
    </div>
  );
};

// --- Reusable Knife Graphic ---
const KnifeGraphic = () => (
    <div className="w-full h-full relative drop-shadow-2xl filter">
        {/* Blade */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[60%] bg-gradient-to-r from-gray-300 via-white to-gray-400 rounded-t-full clip-path-blade z-10 box-decoration-clone"></div>
        {/* Center Ridge */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[1px] h-[55%] bg-gray-500/30 z-20"></div>
        {/* Guard */}
        <div className="absolute top-[58%] left-1/2 -translate-x-1/2 w-[140%] h-2 bg-gradient-to-b from-yellow-600 to-yellow-800 rounded-sm z-30 shadow-md border-b border-yellow-900"></div>
        {/* Handle */}
        <div className="absolute top-[60%] left-1/2 -translate-x-1/2 w-[80%] h-[40%] bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 rounded-b-md z-20 border-x border-slate-900">
            {/* Grip Texture */}
            <div className="w-full h-[1px] bg-black/40 mt-2"></div>
            <div className="w-full h-[1px] bg-black/40 mt-2"></div>
            <div className="w-full h-[1px] bg-black/40 mt-2"></div>
        </div>
    </div>
);

export default KnifeHitGame;