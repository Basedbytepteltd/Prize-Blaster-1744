import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { showRewardAd, safeAlert, showInterstitial } from '../utils/gameMonetize';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiArrowLeft, FiPlay, FiRotateCcw, FiCoins, FiHome, FiArrowUp } = FiIcons;

const FlappyGame = () => {
  const { addPoints, updateGameStats } = useGame();

  // --- Ad Handler ---
  function handleWatchAd() {
    showRewardAd(100)
      .then((res) => {
        if (res === 'completed') {
          safeAlert("Reward: +100 Points!");
        }
      })
      .catch((err) => {
        console.error("Ad failed:", err);
      });
  }

  // --- Configuration ---
  const GAME_HEIGHT = 500;
  const GAME_WIDTH = 350;
  const BIRD_X = 50;
  const BIRD_SIZE = 30;
  const PIPE_WIDTH = 52;
  const PIPE_GAP = 140;
  const GRAVITY = 0.5;
  const JUMP_STRENGTH = -7.5;
  const PIPE_SPEED = 2.5;
  const SPAWN_RATE = 110;

  // --- React State ---
  const [gameState, setGameState] = useState('menu'); // menu, countdown, playing, gameOver
  const [countdown, setCountdown] = useState(3);
  const [score, setScore] = useState(0);
  const [gameScale, setGameScale] = useState(1);
  const [renderTrigger, setRenderTrigger] = useState(0);

  // --- Mutable Game State (Refs) ---
  const birdRef = useRef({ y: 250, velocity: 0, rotation: 0 });
  const pipesRef = useRef([]);
  const scoreRef = useRef(0);
  const frameRef = useRef(0);
  const requestRef = useRef(null);
  const gameActiveRef = useRef(false);

  // --- Scaling Logic ---
  useEffect(() => {
    const handleResize = () => {
      const maxWidth = window.innerWidth - 32;
      const scale = Math.min(1, maxWidth / GAME_WIDTH);
      setGameScale(scale);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Countdown Effect ---
  useEffect(() => {
    if (gameState === 'countdown') {
      if (countdown > 0) {
        const timer = setTimeout(() => {
          setCountdown(countdown - 1);
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        // Countdown finished, start game
        setGameState('playing');
        gameActiveRef.current = true;
        cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(animate);
      }
    }
  }, [gameState, countdown]);

  // --- Game Loop ---
  const animate = useCallback(() => {
    if (!gameActiveRef.current) return;

    // 1. Physics: Bird
    birdRef.current.velocity += GRAVITY;
    birdRef.current.y += birdRef.current.velocity;
    birdRef.current.rotation = Math.min(Math.max(birdRef.current.velocity * 4, -25), 90);

    // 2. Physics: Pipes
    frameRef.current++;
    if (frameRef.current % SPAWN_RATE === 0) {
      const minPipeHeight = 50;
      const maxPipeHeight = GAME_HEIGHT - PIPE_GAP - minPipeHeight - 50;
      const randomHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1)) + minPipeHeight;
      pipesRef.current.push({ x: GAME_WIDTH, topHeight: randomHeight, passed: false });
    }

    pipesRef.current.forEach(pipe => {
      pipe.x -= PIPE_SPEED;
    });

    if (pipesRef.current.length > 0 && pipesRef.current[0].x < -PIPE_WIDTH) {
      pipesRef.current.shift();
    }

    // 3. Collision Detection
    const birdY = birdRef.current.y;
    if (birdY >= GAME_HEIGHT - BIRD_SIZE - 20 || birdY < -50) {
      gameOver();
      return;
    }

    const HITBOX_PADDING = 4;
    for (let pipe of pipesRef.current) {
      if (
        BIRD_X + BIRD_SIZE - HITBOX_PADDING > pipe.x &&
        BIRD_X + HITBOX_PADDING < pipe.x + PIPE_WIDTH
      ) {
        if (
          birdY + HITBOX_PADDING < pipe.topHeight ||
          birdY + BIRD_SIZE - HITBOX_PADDING > pipe.topHeight + PIPE_GAP
        ) {
          gameOver();
          return;
        }
      }

      if (!pipe.passed && BIRD_X > pipe.x + PIPE_WIDTH) {
        pipe.passed = true;
        scoreRef.current += 1;
        setScore(scoreRef.current);
      }
    }

    // 4. Trigger Render
    setRenderTrigger(prev => prev + 1);

    // 5. Next Frame
    requestRef.current = requestAnimationFrame(animate);
  }, []);

  // --- Controls ---
  const startGame = () => {
    // Reset State
    birdRef.current = { y: 250, velocity: 0, rotation: 0 };
    pipesRef.current = [];
    scoreRef.current = 0;
    frameRef.current = 0;
    gameActiveRef.current = false;
    setScore(0);
    setCountdown(3);
    setGameState('countdown');
  };

  const gameOver = () => {
    gameActiveRef.current = false;
    cancelAnimationFrame(requestRef.current);
    setGameState('gameOver');
    showInterstitial(); // Play Ad immediately
    if (scoreRef.current > 0) {
      const points = scoreRef.current * 5;
      addPoints(points);
      updateGameStats('flappy', scoreRef.current);
    }
  };

  const jump = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (gameState === 'playing') {
      birdRef.current.velocity = JUMP_STRENGTH;
    } else if (gameState === 'menu') {
      startGame();
    }
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        jump(e);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Cleanup
  useEffect(() => {
    return () => {
      cancelAnimationFrame(requestRef.current);
      gameActiveRef.current = false;
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-blue-900 via-cyan-900 to-teal-900 p-4 overflow-hidden touch-none"
    >
      <div className="flex justify-between items-center mb-4 pt-4 relative z-10">
        <Link to="/games" className="text-white hover:text-blue-400 transition-colors">
          <SafeIcon icon={FiArrowLeft} className="w-6 h-6" />
        </Link>
        <h1 className="text-xl md:text-2xl font-bold text-white">🐦 Flappy</h1>
        <div className="text-blue-400 font-bold">Score: {score}</div>
      </div>

      <div className="flex justify-center items-center flex-1 min-h-[60vh] select-none relative">
        <div
          className="relative bg-gradient-to-b from-sky-400 to-blue-600 rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl"
          style={{
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            transform: `scale(${gameScale})`,
            transformOrigin: 'top center',
            marginBottom: `${(GAME_HEIGHT * (1 - gameScale)) / 2}px`
          }}
          onMouseDown={jump}
          onTouchStart={jump}
        >
          {/* Background Clouds */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute text-white/20 text-4xl"
                style={{
                  left: `${(i * 120 + frameRef.current * 0.5) % GAME_WIDTH}px`,
                  top: `${50 + (i * 60)}px`
                }}
              >
                ☁️
              </div>
            ))}
          </div>

          {/* Pipes */}
          {pipesRef.current.map((pipe, index) => (
            <React.Fragment key={`pipe-${index}`}>
              <div
                className="absolute bg-green-600 border-x-2 border-b-2 border-green-800 rounded-b-lg"
                style={{
                  left: pipe.x,
                  top: 0,
                  width: PIPE_WIDTH,
                  height: pipe.topHeight,
                  transition: 'none'
                }}
              >
                <div className="absolute bottom-0 w-[110%] -left-[5%] h-6 bg-green-600 border-2 border-green-800 rounded-sm" />
              </div>
              <div
                className="absolute bg-green-600 border-x-2 border-t-2 border-green-800 rounded-t-lg"
                style={{
                  left: pipe.x,
                  top: pipe.topHeight + PIPE_GAP,
                  width: PIPE_WIDTH,
                  height: GAME_HEIGHT - (pipe.topHeight + PIPE_GAP),
                  transition: 'none'
                }}
              >
                <div className="absolute top-0 w-[110%] -left-[5%] h-6 bg-green-600 border-2 border-green-800 rounded-sm" />
              </div>
            </React.Fragment>
          ))}

          {/* Bird */}
          <div
            className="absolute z-20 flex items-center justify-center text-3xl"
            style={{
              left: BIRD_X,
              top: birdRef.current.y,
              width: BIRD_SIZE,
              height: BIRD_SIZE,
              transform: `rotate(${birdRef.current.rotation}deg)`,
              transition: 'none'
            }}
          >
            🐦
          </div>

          {/* Ground */}
          <div className="absolute bottom-0 w-full h-5 bg-[#DED895] border-t-4 border-[#73BF2E] z-30 flex">
            <div
              className="h-full w-[200%] flex"
              style={{ transform: `translateX(-${(frameRef.current * PIPE_SPEED) % 20}px)` }}
            >
              {[...Array(20)].map((_, i) => (
                <div key={i} className="w-4 h-full border-r border-[#CBB968]/50 skew-x-[-45deg]" />
              ))}
            </div>
          </div>

          {/* Countdown Overlay */}
          <AnimatePresence>
            {gameState === 'countdown' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-40 pointer-events-none"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={countdown}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-white font-black text-9xl drop-shadow-2xl"
                  >
                    {countdown > 0 ? countdown : 'GO!'}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Dedicated Jump Button Helper */}
        {gameState === 'playing' && (
             <button 
                onMouseDown={(e) => { e.stopPropagation(); jump(e); }}
                onTouchStart={(e) => { e.stopPropagation(); jump(e); }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full w-20 h-20 flex items-center justify-center border-4 border-white/30 active:scale-95 transition-all shadow-lg z-50 text-white"
             >
                <SafeIcon icon={FiArrowUp} className="w-8 h-8 font-bold" />
             </button>
        )}
      </div>

      {/* Overlays */}
      {(gameState === 'menu' || gameState === 'gameOver') && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900/90 rounded-2xl p-8 max-w-sm w-full border border-white/10 text-center shadow-2xl"
          >
            {gameState === 'menu' ? (
              <>
                <div className="text-6xl mb-4 animate-bounce">🐦</div>
                <h2 className="text-2xl font-bold text-white mb-4">Flappy Bird</h2>
                <p className="text-gray-300 mb-6">Avoid the pipes! Tap to fly.</p>
                <button
                  onClick={startGame}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold py-3 rounded-xl shadow-lg hover:scale-105 transition-transform"
                >
                  Start Flying
                </button>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">💥</div>
                <h2 className="text-2xl font-bold text-white mb-2">Crashed!</h2>
                <div className="bg-white/10 rounded-xl p-4 mb-6">
                  <div className="text-gray-400 text-xs uppercase font-bold tracking-wider">Score</div>
                  <div className="text-4xl font-black text-white">{score}</div>
                </div>
                
                <div className="bg-blue-500/20 rounded-xl p-3 mb-6 border border-blue-500/30">
                  <div className="flex items-center justify-center space-x-2 text-blue-400">
                    <SafeIcon icon={FiCoins} className="w-5 h-5" />
                    <span className="font-bold">+{score * 5} Points Earned</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={handleWatchAd}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-3 rounded-xl shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
                  >
                    <SafeIcon icon={FiPlay} className="w-5 h-5" />
                    Watch Ad (+100)
                  </button>
                  
                  <div className="flex gap-2">
                      <button
                        onClick={startGame}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <SafeIcon icon={FiRotateCcw} className="w-5 h-5" />
                        Retry
                      </button>
                      
                      <Link
                        to="/"
                        className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-colors flex items-center justify-center"
                      >
                         <SafeIcon icon={FiHome} className="w-5 h-5" />
                      </Link>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default FlappyGame;