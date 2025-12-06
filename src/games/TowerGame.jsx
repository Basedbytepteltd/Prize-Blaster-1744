import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { showRewardAd, safeAlert, showInterstitial } from '../utils/gameMonetize';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiArrowLeft, FiPlay, FiRotateCcw, FiCoins, FiHome, FiLayers } = FiIcons;

const TowerGame = () => {
  const canvasRef = useRef(null);
  const { addPoints, updateGameStats } = useGame();
  
  // Game State
  const [gameState, setGameState] = useState('menu'); // menu, playing, gameOver
  const [score, setScore] = useState(0);
  const [perfectCount, setPerfectCount] = useState(0);

  // mutable game state
  const stateRef = useRef({
    blocks: [],
    debris: [],
    currentBlock: null,
    direction: 1, // 1 or -1
    speed: 4,
    width: 200,
    cameraY: 0,
    gameRunning: false,
    hue: 0
  });

  const requestRef = useRef(null);

  // --- Constants ---
  const BLOCK_HEIGHT = 30;
  const INITIAL_WIDTH = 200;
  const CANVAS_WIDTH = 400; // Logical width
  const CANVAS_HEIGHT = 600; // Logical height

  // --- Game Logic ---
  const initGame = () => {
    stateRef.current = {
      blocks: [],
      debris: [],
      currentBlock: {
        x: (CANVAS_WIDTH - INITIAL_WIDTH) / 2,
        y: CANVAS_HEIGHT - 200,
        w: INITIAL_WIDTH,
        h: BLOCK_HEIGHT,
        color: `hsl(200, 70%, 60%)`
      },
      direction: 1,
      speed: 3,
      width: INITIAL_WIDTH,
      cameraY: 0,
      gameRunning: true,
      hue: 200
    };

    // Add base block
    stateRef.current.blocks.push({
      x: (CANVAS_WIDTH - INITIAL_WIDTH) / 2,
      y: CANVAS_HEIGHT - 200 + BLOCK_HEIGHT,
      w: INITIAL_WIDTH,
      h: BLOCK_HEIGHT,
      color: `hsl(200, 70%, 50%)` // Darker base
    });

    setScore(0);
    setPerfectCount(0);
    setGameState('playing');
  };

  const spawnNextBlock = () => {
    const { blocks, width, hue, speed } = stateRef.current;
    const topBlock = blocks[blocks.length - 1];
    
    const nextHue = (hue + 10) % 360;
    stateRef.current.hue = nextHue;

    // Increase speed slightly
    const newSpeed = Math.min(15, 3 + (blocks.length * 0.1));

    stateRef.current.currentBlock = {
      x: -width * 1.5, // Start off screen
      y: topBlock.y - BLOCK_HEIGHT,
      w: width,
      h: BLOCK_HEIGHT,
      color: `hsl(${nextHue}, 70%, 60%)`
    };
    
    stateRef.current.speed = newSpeed;
    // Alternate direction
    stateRef.current.direction = 1;
  };

  const placeBlock = () => {
    const state = stateRef.current;
    const { currentBlock, blocks } = state;
    if (!currentBlock) return;

    const topBlock = blocks[blocks.length - 1];
    
    // Calculate overlap
    let delta = currentBlock.x - topBlock.x;
    
    // Check if missed completely
    if (Math.abs(delta) >= currentBlock.w) {
      gameOver();
      return;
    }

    // Snap if close enough (Perfect!)
    const SNAP_TOLERANCE = 5;
    let cutWidth = 0;
    let isPerfect = false;

    if (Math.abs(delta) < SNAP_TOLERANCE) {
      currentBlock.x = topBlock.x;
      delta = 0;
      isPerfect = true;
      setPerfectCount(p => p + 1);
      // Bonus size for perfect streak? (Optional mechanics)
      // For now just consistent size
    } else {
      setPerfectCount(0);
      // Cut the block
      cutWidth = Math.abs(delta);
      currentBlock.w -= cutWidth;
      
      if (delta > 0) {
        // Overhang on right
        // currentBlock.x stays same, but width reduced
        // Add debris
        addDebris(currentBlock.x + currentBlock.w, currentBlock.y, cutWidth, currentBlock.h, currentBlock.color);
      } else {
        // Overhang on left
        currentBlock.x = topBlock.x; // Align to left edge of top block
        // Add debris
        addDebris(currentBlock.x - cutWidth, currentBlock.y, cutWidth, currentBlock.h, currentBlock.color);
      }
      state.width = currentBlock.w; // Update global width for next block
    }

    // Add to stack
    state.blocks.push(currentBlock);
    
    // Update Score
    setScore(blocks.length - 1); // -1 because of base block

    // Move next
    spawnNextBlock();
  };

  const addDebris = (x, y, w, h, color) => {
    stateRef.current.debris.push({
      x, y, w, h, color,
      vx: (Math.random() - 0.5) * 2,
      vy: Math.random() * -5, // Jump up slightly
      rot: 0,
      vRot: (Math.random() - 0.5) * 0.2,
      opacity: 1
    });
  };

  const update = () => {
    const state = stateRef.current;
    if (!state.gameRunning) return;

    // Move Current Block
    if (state.currentBlock) {
      state.currentBlock.x += state.speed * state.direction;

      // Bounce off walls (or wrap, but bouncing is standard for this)
      // Usually in Tower game it goes back and forth
      const limit = CANVAS_WIDTH;
      if (state.currentBlock.x > limit && state.direction > 0) {
        state.direction = -1;
      } else if (state.currentBlock.x < -state.currentBlock.w - 50 && state.direction < 0) {
        state.direction = 1;
      }
    }

    // Update Debris
    state.debris.forEach(d => {
      d.x += d.vx;
      d.y += d.vy;
      d.vy += 0.5; // Gravity
      d.rot += d.vRot;
      d.opacity -= 0.02;
    });
    state.debris = state.debris.filter(d => d.opacity > 0);

    // Update Camera
    const targetY = state.blocks.length * BLOCK_HEIGHT;
    const centerOffset = CANVAS_HEIGHT / 2;
    if (targetY > centerOffset) {
        state.cameraY += (targetY - centerOffset - state.cameraY) * 0.1;
    }
  };

  const draw = (ctx) => {
    const state = stateRef.current;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.save();
    // Apply Camera
    // We want the stack to move DOWN, so we translate UP relative to block Y
    // But blocks are built UP (decreasing Y in canvas?). 
    // Wait, my initial Y was CANVAS_HEIGHT - 200.
    // So Y decreases as we go up.
    // If Y < 200 (top of screen), we need to shift everything DOWN.
    
    const topBlock = state.blocks[state.blocks.length - 1];
    let offsetY = 0;
    if (topBlock && topBlock.y < CANVAS_HEIGHT / 2) {
       offsetY = (CANVAS_HEIGHT / 2) - topBlock.y;
    }
    // We can just track a smooth camera offset
    // Let's use the calculated cameraY logic differently
    // Just force the top block to be around 60% height
    
    ctx.translate(0, offsetY);

    // Draw Blocks
    state.blocks.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      // Highlight top edge
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(b.x, b.y, b.w, 4);
      // Shadow bottom edge
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(b.x, b.y + b.h - 4, b.w, 4);
    });

    // Draw Current Block
    if (state.currentBlock) {
      const b = state.currentBlock;
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(b.x, b.y, b.w, 4);
    }

    // Draw Debris
    state.debris.forEach(d => {
      ctx.save();
      ctx.translate(d.x + d.w/2, d.y + d.h/2);
      ctx.rotate(d.rot);
      ctx.globalAlpha = d.opacity;
      ctx.fillStyle = d.color;
      ctx.fillRect(-d.w/2, -d.h/2, d.w, d.h);
      ctx.restore();
    });

    ctx.restore();

    // Draw Perfect Effect Text
    if (perfectCount > 1) {
       ctx.fillStyle = "#fbbf24";
       ctx.font = "bold 20px Arial";
       ctx.textAlign = "center";
       ctx.fillText(`${perfectCount}x PERFECT!`, CANVAS_WIDTH/2, 100);
    }
  };

  const loop = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    
    update();
    draw(ctx);
    
    requestRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    // Setup Canvas
    const canvas = canvasRef.current;
    if (canvas) {
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
    }
    
    // Start Loop
    requestRef.current = requestAnimationFrame(loop);
    
    return () => cancelAnimationFrame(requestRef.current);
  }, [loop]);

  const handleTap = (e) => {
    if (e) e.preventDefault();
    if (gameState === 'playing') {
      placeBlock();
    }
  };

  const gameOver = () => {
    stateRef.current.gameRunning = false;
    setGameState('gameOver');
    showInterstitial(); // Play Ad
    if (score > 0) {
      updateGameStats('tower', score);
      addPoints(score * 2);
    }
  };

  const handleRestart = () => {
    initGame();
  };

  const handleWatchAd = () => {
    showRewardAd(50).then(res => {
      if(res === 'completed') {
        safeAlert("Reward: +50 Points");
      }
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900 to-black p-0 overflow-hidden flex flex-col items-center justify-center font-sans touch-none"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10">
        <Link to="/games" className="bg-black/20 backdrop-blur-md p-2 rounded-xl text-white hover:text-blue-400 border border-white/10">
          <SafeIcon icon={FiArrowLeft} className="w-6 h-6" />
        </Link>
        <div className="flex flex-col items-center">
            <h1 className="text-white font-black text-4xl drop-shadow-lg">{score}</h1>
            {perfectCount > 1 && (
                <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="text-yellow-400 font-bold text-xs tracking-widest uppercase"
                >
                    Perfect Streak
                </motion.div>
            )}
        </div>
        <div className="w-10"></div>
      </div>

      {/* Canvas Container */}
      <div 
        className="relative w-full max-w-md h-[85vh] mt-4 bg-gray-900/50 rounded-xl shadow-2xl overflow-hidden border border-white/5 cursor-pointer tap-highlight-transparent"
        onMouseDown={handleTap}
        onTouchStart={handleTap}
      >
        <canvas 
            ref={canvasRef} 
            className="w-full h-full block"
        />
        
        {/* Tap Hint */}
        {gameState === 'playing' && score === 0 && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-white/50 text-sm font-bold animate-pulse pointer-events-none">
                TAP TO PLACE
            </div>
        )}
      </div>

      {/* Menu Overlay */}
      {gameState === 'menu' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-30 p-6">
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
            >
                <div className="text-7xl mb-6 animate-bounce">🏗️</div>
                <h1 className="text-5xl font-black text-white mb-2">TOWER</h1>
                <p className="text-blue-400 font-bold mb-8 text-xl tracking-widest">BUILDER</p>
                
                <button 
                    onClick={initGame}
                    className="w-64 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-4 rounded-2xl shadow-lg text-xl flex items-center justify-center gap-2 hover:scale-105 transition-transform"
                >
                    <SafeIcon icon={FiPlay} className="w-6 h-6" />
                    START BUILDING
                </button>
            </motion.div>
        </div>
      )}

      {/* Game Over Overlay */}
      {gameState === 'gameOver' && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-40 p-6">
            <div className="text-6xl mb-4">💥</div>
            <h2 className="text-3xl font-bold text-white mb-2">Toppled!</h2>
            
            <div className="bg-white/10 rounded-2xl p-6 mb-8 w-full max-w-xs text-center border border-white/10">
                <div className="text-gray-400 text-sm uppercase font-bold tracking-wider mb-2">Final Height</div>
                <div className="text-6xl font-black text-white">{score}</div>
                <div className="text-green-400 text-sm mt-2 font-bold">+{score * 2} Points Earned</div>
            </div>
            
            <div className="space-y-3 w-full max-w-xs">
                 <button 
                    onClick={handleWatchAd}
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2"
                 >
                    <SafeIcon icon={FiCoins} className="w-5 h-5" />
                    Bonus +50 Points
                 </button>
                 
                 <div className="flex gap-3">
                     <button 
                        onClick={handleRestart}
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-xl border border-white/20 flex items-center justify-center gap-2"
                     >
                        <SafeIcon icon={FiRotateCcw} className="w-5 h-5" />
                        Retry
                     </button>
                     
                     <Link
                       to="/"
                       className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 px-6 rounded-xl border border-white/10 flex items-center justify-center"
                     >
                        <SafeIcon icon={FiHome} className="w-5 h-5" />
                     </Link>
                 </div>
            </div>
        </div>
      )}
    </motion.div>
  );
};

export default TowerGame;