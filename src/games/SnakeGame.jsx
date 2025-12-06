import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { showRewardAd, safeAlert, showInterstitial } from '../utils/gameMonetize';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiArrowLeft, FiPlay, FiPause, FiRotateCcw, FiCoins, FiHome } = FiIcons;

const SnakeGame = () => {
  const { addPoints, updateGameStats, isGamePaused } = useGame();

  function handleWatchAd() {
    showRewardAd(100)
      .then((res) => {
        if (res === 'completed') {
          safeAlert("Reward: +100 Points!");
        }
      })
      .catch((err) => {
        console.warn("Ad not completed:", err);
      });
  }

  const [gameState, setGameState] = useState('menu');
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 15, y: 15 });
  const [direction, setDirection] = useState({ x: 0, y: 0 });
  const [score, setScore] = useState(0);
  const [gameSpeed, setGameSpeed] = useState(200);

  // Sync with global pause state from SDK
  useEffect(() => {
    if (isGamePaused && gameState === 'playing') {
      setGameState('paused');
    }
  }, [isGamePaused]);

  const BOARD_SIZE = 20;

  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * BOARD_SIZE),
      y: Math.floor(Math.random() * BOARD_SIZE)
    };
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood(generateFood());
    setDirection({ x: 0, y: 0 });
    setScore(0);
    setGameSpeed(200);
    setGameState('menu');
  };

  const startGame = () => {
    showInterstitial(); // Show ad on start too? Maybe just game over.
    setGameState('playing');
    setDirection({ x: 1, y: 0 });
  };

  const pauseGame = () => {
    setGameState('paused');
  };

  const resumeGame = () => {
    setGameState('playing');
  };

  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;

    setSnake(prevSnake => {
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] };

      head.x += direction.x;
      head.y += direction.y;

      if (head.x < 0 || head.x >= BOARD_SIZE || head.y < 0 || head.y >= BOARD_SIZE) {
        setGameState('gameOver');
        return prevSnake;
      }

      if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameState('gameOver');
        return prevSnake;
      }

      newSnake.unshift(head);

      if (head.x === food.x && head.y === food.y) {
        setScore(prevScore => {
          const newScore = prevScore + 10;
          return newScore;
        });
        setFood(generateFood());
        setGameSpeed(prevSpeed => Math.max(prevSpeed - 5, 100));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameState, generateFood]);

  useEffect(() => {
    const gameInterval = setInterval(gameLoop, gameSpeed);
    return () => clearInterval(gameInterval);
  }, [gameLoop, gameSpeed]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameState !== 'playing') return;
      switch (e.key) {
        case 'ArrowUp': if (direction.y === 0) setDirection({ x: 0, y: -1 }); break;
        case 'ArrowDown': if (direction.y === 0) setDirection({ x: 0, y: 1 }); break;
        case 'ArrowLeft': if (direction.x === 0) setDirection({ x: -1, y: 0 }); break;
        case 'ArrowRight': if (direction.x === 0) setDirection({ x: 1, y: 0 }); break;
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction, gameState]);

  useEffect(() => {
    if (gameState === 'gameOver') {
      showInterstitial(); // Play Ad
      if (score > 0) {
        const points = Math.floor(score / 2);
        addPoints(points);
        updateGameStats('snake', score);
      }
    }
  }, [gameState]); // Only run when state changes to gameOver

  const handleDirectionChange = (newDirection) => {
    if (gameState !== 'playing') return;
    if (newDirection.x !== -direction.x && newDirection.y !== -direction.y) {
      setDirection(newDirection);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 p-4 pb-24"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pt-4">
        <Link to="/games" className="text-white hover:text-green-400 transition-colors">
          <SafeIcon icon={FiArrowLeft} className="w-6 h-6" />
        </Link>
        <h1 className="text-xl md:text-2xl font-bold text-white">🐍 Snake</h1>
        <div className="text-green-400 font-bold">Score: {score}</div>
      </div>

      {/* Game Board */}
      <div className="flex justify-center mb-6">
        <div
          className="snake-game-board grid gap-0.5 bg-black/50 p-2 rounded-xl w-full max-w-[340px] aspect-square mx-auto shadow-2xl shadow-black/50"
          style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)` }}
        >
          {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, index) => {
            const x = index % BOARD_SIZE;
            const y = Math.floor(index / BOARD_SIZE);
            const isSnake = snake.some(segment => segment.x === x && segment.y === y);
            const isHead = snake[0] && snake[0].x === x && snake[0].y === y;
            const isFood = food.x === x && food.y === y;
            return (
              <div
                key={index}
                className={`w-full h-full rounded-[1px] transition-all duration-75 ${isFood ? 'bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]' : isHead ? 'bg-green-400 z-10' : isSnake ? 'bg-green-600' : 'bg-white/5'}`}
              />
            );
          })}
        </div>
      </div>

      {/* Game State Overlays */}
      {gameState === 'menu' && (
        <div className="fixed inset-0 flex items-center justify-center z-20 pointer-events-none p-4">
          <div className="bg-black/80 backdrop-blur-md rounded-2xl p-6 md:p-8 max-w-sm w-full border border-white/10 pointer-events-auto text-center shadow-xl">
            <div className="text-6xl mb-4">🐍</div>
            <h2 className="text-2xl font-bold text-white mb-4">Snake Classic</h2>
            <p className="text-gray-300 mb-6 text-sm">
              Eat the red food to grow longer. Don't hit the walls or yourself!
            </p>
            <button
              onClick={startGame}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-green-500/20"
            >
              <SafeIcon icon={FiPlay} className="w-5 h-5" />
              <span>Start Game</span>
            </button>
          </div>
        </div>
      )}

      {/* ... (Rest of UI similar to before) ... */}
      {gameState === 'paused' && (
        <div className="fixed inset-0 flex items-center justify-center z-20 pointer-events-none p-4">
          <div className="bg-black/80 backdrop-blur-md rounded-2xl p-6 md:p-8 max-w-sm w-full border border-white/10 pointer-events-auto text-center shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4">Game Paused</h2>
            <div className="space-y-3">
              <button
                onClick={resumeGame}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
              >
                Resume
              </button>
              <button
                onClick={resetGame}
                className="w-full bg-gray-600 text-white font-bold py-3 rounded-xl hover:bg-gray-700 transition-all"
              >
                Restart
              </button>
            </div>
          </div>
        </div>
      )}

      {gameState === 'gameOver' && (
        <div className="fixed inset-0 flex items-center justify-center z-20 pointer-events-none p-4">
          <div className="bg-black/80 backdrop-blur-md rounded-2xl p-6 md:p-8 max-w-sm w-full border border-white/10 pointer-events-auto text-center shadow-xl">
            <div className="text-6xl mb-4">💀</div>
            <h2 className="text-2xl font-bold text-white mb-2">Game Over!</h2>
            <p className="text-gray-300 mb-4">Final Score: {score}</p>
            <div className="bg-green-500/20 rounded-xl p-3 mb-6 border border-green-500/30">
              <div className="flex items-center justify-center space-x-2 text-green-400">
                <SafeIcon icon={FiCoins} className="w-5 h-5" />
                <span className="font-bold">+{Math.floor(score / 2)} Points Earned!</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleWatchAd}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-3 rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all shadow-lg"
              >
                Watch Ad for +100 Points
              </button>
              
              <div className="flex gap-2">
                  <button
                    onClick={resetGame}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center space-x-2 shadow-lg"
                  >
                    <SafeIcon icon={FiRotateCcw} className="w-5 h-5" />
                    <span>Retry</span>
                  </button>
                  
                  <Link
                    to="/"
                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-colors flex items-center justify-center"
                  >
                     <SafeIcon icon={FiHome} className="w-5 h-5" />
                  </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      {gameState === 'playing' && (
        <>
          <div className="flex justify-center mb-6">
            <button
              onClick={pauseGame}
              className="bg-white/10 backdrop-blur-sm text-white px-6 py-2 rounded-full hover:bg-white/20 transition-all flex items-center space-x-2 border border-white/10"
            >
              <SafeIcon icon={FiPause} className="w-4 h-4" />
              <span className="text-sm font-bold">Pause</span>
            </button>
          </div>

          {/* D-Pad Controls */}
          <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto select-none touch-manipulation">
            <div />
            <button
              onTouchStart={(e) => { e.preventDefault(); handleDirectionChange({ x: 0, y: -1 }); }}
              onClick={() => handleDirectionChange({ x: 0, y: -1 })}
              className="bg-white/10 backdrop-blur-sm active:bg-green-500/50 text-white p-4 rounded-xl border border-white/10 transition-all text-2xl flex items-center justify-center aspect-square shadow-lg"
            >
              <span className="transform -rotate-90">➤</span>
            </button>
            <div />
            <button
              onTouchStart={(e) => { e.preventDefault(); handleDirectionChange({ x: -1, y: 0 }); }}
              onClick={() => handleDirectionChange({ x: -1, y: 0 })}
              className="bg-white/10 backdrop-blur-sm active:bg-green-500/50 text-white p-4 rounded-xl border border-white/10 transition-all text-2xl flex items-center justify-center aspect-square shadow-lg"
            >
              <span className="transform rotate-180">➤</span>
            </button>
            <div />
            <button
              onTouchStart={(e) => { e.preventDefault(); handleDirectionChange({ x: 1, y: 0 }); }}
              onClick={() => handleDirectionChange({ x: 1, y: 0 })}
              className="bg-white/10 backdrop-blur-sm active:bg-green-500/50 text-white p-4 rounded-xl border border-white/10 transition-all text-2xl flex items-center justify-center aspect-square shadow-lg"
            >
              <span>➤</span>
            </button>
            <div />
            <button
              onTouchStart={(e) => { e.preventDefault(); handleDirectionChange({ x: 0, y: 1 }); }}
              onClick={() => handleDirectionChange({ x: 0, y: 1 })}
              className="bg-white/10 backdrop-blur-sm active:bg-green-500/50 text-white p-4 rounded-xl border border-white/10 transition-all text-2xl flex items-center justify-center aspect-square shadow-lg"
            >
              <span className="transform rotate-90">➤</span>
            </button>
            <div />
          </div>
        </>
      )}
    </motion.div>
  );
};

export default SnakeGame;