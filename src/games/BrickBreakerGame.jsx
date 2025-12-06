import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { showRewardAd, safeAlert, showInterstitial } from '../utils/gameMonetize';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiArrowLeft, FiPlay, FiRotateCcw, FiCoins, FiArrowDown, FiHome } = FiIcons;

const BrickBreakerGame = () => {
  const canvasRef = useRef(null);
  const { addPoints, updateGameStats } = useGame();
  
  // Game State accessible to React
  const [gameState, setGameState] = useState('menu'); // menu, playing, gameOver
  const [score, setScore] = useState(0);

  // Game State accessible to Loop (Ref pattern to avoid stale closures)
  const gameStateRef = useRef('menu');
  const managerRef = useRef(null);
  
  // Sync React state to Ref for the loop
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // --- Game Configuration & Logic ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = 720;
    const height = 880;
    
    // Scale canvas for retina/high-dpi if needed, but for now fixed coordinate system
    // We handle visual scaling via CSS, logical size is fixed
    canvas.width = width;
    canvas.height = height;

    const uiOffsetY = 100; // Space for top UI

    // --- Helpers ---
    const randomInt = (min, max) => {
        if (max === undefined) return Math.ceil(Math.random() * min);
        return Math.ceil(Math.random() * (max - min)) + min;
    };
    const range = (n) => Array.from({ length: n }).map((_, i) => i);
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    // --- Vector Class ---
    class Vector {
        constructor(x = 0, y = 0) {
            this.x = x;
            this.y = y;
        }
        add(v) { this.x += v.x; this.y += v.y; }
        mult(n) { this.x *= n; this.y *= n; }
        mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }
        copy() { return new Vector(this.x, this.y); }
    }

    // --- Drawing Helpers ---
    const drawDashLine = (x1, y1, x2, y2) => {
        ctx.beginPath();
        ctx.setLineDash([10, 15]);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 3;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);
    };

    // Safe Round Rect for all browsers
    const fillRoundRect = (x, y, w, h, radius, color) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + w - radius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
        ctx.lineTo(x + w, y + h - radius);
        ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        ctx.lineTo(x + radius, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    };

    const drawCircle = (x, y, r, color) => {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.closePath();
    };

    // --- Game Entities ---
    let Mouse = { position: new Vector(0, 0) };

    class Ball {
        constructor(x, y) {
            this.position = new Vector(x, y);
            this.velocity = new Vector(0, 0);
            this.acceleration = new Vector(0, 0);
            this.r = 9;
            this.downing = false;
        }

        update() {
            this.velocity.add(this.acceleration);
            this.position.add(this.velocity);
            this.acceleration.mult(0);
        }

        stop(targetX, targetY) {
            this.velocity = new Vector(0, 0);
            this.position.x = targetX;
            this.position.y = targetY;
            this.downing = false;
        }

        shoot(mx, my) {
            const angle = Math.atan2(my - this.position.y, mx - this.position.x);
            const speed = 18; // Constant speed
            this.velocity = new Vector(Math.cos(angle) * speed, Math.sin(angle) * speed);
        }

        display() {
            drawCircle(this.position.x, this.position.y, this.r, "#3b82f6");
        }

        collideWith(brick) {
            if (this.downing) return false;
            const { x, y } = this.position;
            const r = this.r;
            
            // Find closest point on rect
            const closestX = clamp(x, brick.x, brick.x + brick.w);
            const closestY = clamp(y, brick.y, brick.y + brick.h);

            const dx = x - closestX;
            const dy = y - closestY;
            const distSq = dx * dx + dy * dy;

            if (distSq < r * r) {
                // Resolve collision
                if (Math.abs(dx) > Math.abs(dy)) {
                    this.velocity.x *= -1;
                    this.position.x += (dx > 0 ? 1 : -1) * (r - Math.abs(dx) + 1);
                } else {
                    this.velocity.y *= -1;
                    this.position.y += (dy > 0 ? 1 : -1) * (r - Math.abs(dy) + 1);
                }
                return true;
            }
            return false;
        }

        checkEdges(width, height, onBottom) {
            let hitWall = false;
            if (this.position.x > width - this.r) {
                this.position.x = width - this.r;
                this.velocity.x *= -1;
                hitWall = true;
            } else if (this.position.x < this.r) {
                this.position.x = this.r;
                this.velocity.x *= -1;
                hitWall = true;
            }

            if (this.position.y < uiOffsetY + this.r) {
                this.position.y = uiOffsetY + this.r;
                this.velocity.y *= -1;
                hitWall = true;
            } else if (this.position.y > height - 60) { // Hit bottom
                this.velocity = new Vector(0, 0);
                this.position.y = height - 60;
                if(onBottom) onBottom(this);
            }
            return hitWall;
        }
    }

    class Brick {
        constructor(n, col, row) {
            this.n = n;
            this.startN = n;
            this.col = col;
            this.row = row;
            // Grid: 6 columns
            const margin = 10;
            const colWidth = (width - (margin * 7)) / 6;
            this.w = colWidth;
            this.h = 60;
            this.x = margin + col * (colWidth + margin);
            this.y = uiOffsetY + 20 + (row * (this.h + 10)); 
        }

        display(level) {
            // Color gradient
            const ratio = Math.min(1, this.n / (level * 2 + 1));
            const hue = 120 - (ratio * 120); // Green to Red
            // HSL lightness increased to 80% for better contrast with black text
            const color = `hsl(${hue}, 80%, 75%)`; 

            fillRoundRect(this.x, this.y, this.w, this.h, 8, color);
            
            // Text Color changed to BLACK for visibility
            ctx.fillStyle = "#000000"; 
            ctx.font = "bold 28px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(this.n, this.x + this.w / 2, this.y + this.h / 2);
        }

        moveDown() {
            this.y += (this.h + 10);
        }

        hit() {
            this.n--;
        }

        get broken() {
            return this.n <= 0;
        }
    }

    class BonusBall {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.r = 12;
            this.active = true;
            this.collected = false;
        }

        display() {
            if(this.collected) return;
            drawCircle(this.x, this.y, this.r, "#10b981");
            // Ring
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r + 4, 0, Math.PI*2);
            ctx.strokeStyle = "#10b981";
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        moveDown() {
            this.y += 70; 
        }

        checkCollision(ball) {
            if(this.collected) return false;
            const dx = ball.position.x - this.x;
            const dy = ball.position.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if(dist < (ball.r + this.r + 5)) {
                this.collected = true;
                return true;
            }
            return false;
        }
    }

    class GameManager {
        constructor() {
            this.reset();
        }

        reset() {
            this.balls = [];
            this.bricks = [];
            this.bonusBalls = [];
            this.level = 1;
            this.score = 0;
            this.ballCount = 1;
            this.ballPos = { x: width / 2, y: height - 60 };
            this.state = 'idle'; // idle, aiming, shooting, ending_turn
            this.ballsToShoot = 0;
            this.firstBallReturned = false;
            
            // Initial setup
            this.balls.push(new Ball(this.ballPos.x, this.ballPos.y));
            this.addNewRow();
        }

        addNewRow() {
            // Shift existing down
            this.bricks.forEach(b => b.moveDown());
            this.bonusBalls.forEach(b => b.moveDown());

            // Check Game Over
            if (this.bricks.some(b => b.y + b.h >= height - 100)) {
                if (window.handleGameOver) window.handleGameOver(this.level - 1);
                return;
            }

            // Add new row
            const count = randomInt(1, 4);
            const cols = range(6).sort(() => Math.random() - 0.5);
            
            for(let i=0; i<count; i++) {
                const hp = this.level;
                this.bricks.push(new Brick(hp, cols[i], 0));
            }

            // Add Bonus Ball
            if (Math.random() > 0.3) {
                const occupied = this.bricks.filter(b => b.y < uiOffsetY + 100).map(b => b.col);
                const empty = range(6).filter(c => !occupied.includes(c));
                if(empty.length > 0) {
                    const col = empty[Math.floor(Math.random() * empty.length)];
                    const margin = 10;
                    const colWidth = (width - (margin * 7)) / 6;
                    const x = margin + col * (colWidth + margin) + (colWidth/2);
                    const y = uiOffsetY + 20 + 30; // Center of row
                    this.bonusBalls.push(new BonusBall(x, y));
                }
            }
        }

        update() {
            if (gameStateRef.current !== 'playing') return;

            // Shooting Logic
            if (this.state === 'shooting' && this.ballsToShoot > 0) {
                const now = Date.now();
                if(now - this.lastShotTime > 100) { 
                    const ball = this.balls.find(b => b.velocity.x === 0 && b.velocity.y === 0 && Math.abs(b.position.y - (height - 60)) < 5);
                    if(ball) {
                        ball.shoot(this.targetMx, this.targetMy);
                        this.ballsToShoot--;
                        this.lastShotTime = now;
                    }
                }
            }

            // Update Balls
            let movingCount = 0;
            this.balls.forEach(ball => {
                if (ball.velocity.mag() > 0) {
                    movingCount++;
                    ball.update();

                    // Brick Collision
                    for(let brick of this.bricks) {
                        if(!brick.broken && ball.collideWith(brick)) {
                            brick.hit();
                        }
                    }

                    // Bonus Collision
                    this.bonusBalls.forEach(bb => {
                        if(bb.checkCollision(ball)) {
                            // Collected
                        }
                    });

                    // Edge Collision
                    ball.checkEdges(width, height, (b) => {
                        // Ball hit bottom
                        if(this.firstBallReturned === false) {
                            this.firstBallReturned = true;
                            this.newBallPos = { x: b.position.x, y: height - 60 };
                        }
                        // Move to new anchor
                        if (this.newBallPos) {
                            b.stop(this.newBallPos.x, height - 60);
                        } else {
                            b.stop(b.position.x, height - 60);
                        }
                    });
                } else {
                    // Ball is stationary at bottom
                    if(this.firstBallReturned && this.newBallPos) {
                        b.position.x += (this.newBallPos.x - b.position.x) * 0.2;
                    }
                }
            });

            // Cleanup broken bricks
            this.bricks = this.bricks.filter(b => !b.broken);

            // Turn End Check
            if (this.state === 'shooting' && movingCount === 0 && this.ballsToShoot === 0) {
                this.endTurn();
            }
        }

        endTurn() {
            this.state = 'idle';
            this.level++;
            if (window.setScore) window.setScore(this.level - 1);

            // Collect bonuses
            const collected = this.bonusBalls.filter(b => b.collected).length;
            if (collected > 0) {
                this.ballCount += collected;
                for(let i=0; i<collected; i++) {
                    this.balls.push(new Ball(this.ballPos.x, this.ballPos.y));
                }
                this.bonusBalls = this.bonusBalls.filter(b => !b.collected);
            }

            // Update main ball pos
            if(this.newBallPos) {
                this.ballPos = this.newBallPos;
                // Snap all balls
                this.balls.forEach(b => {
                    b.position.x = this.ballPos.x;
                    b.position.y = this.ballPos.y;
                    b.velocity = new Vector(0, 0);
                });
            }

            this.addNewRow();
        }

        draw() {
            ctx.clearRect(0, 0, width, height);

            // Draw Aim Line
            if (this.state === 'aiming' || (this.state === 'idle' && gameStateRef.current === 'playing')) {
                 // Clamp aiming to not go below the ball
                 let targetY = Mouse.position.y;
                 if (targetY > this.ballPos.y - 50) targetY = this.ballPos.y - 50;
                 // Visual guide only
                 drawDashLine(this.ballPos.x, this.ballPos.y, Mouse.position.x, targetY);
            }

            // Draw Balls
            this.balls.forEach(b => b.display());

            // Draw Ball Count
            if(this.state === 'idle') {
                ctx.fillStyle = "#fff";
                ctx.font = "14px Arial";
                ctx.fillText(`x${this.ballCount}`, this.ballPos.x, this.ballPos.y + 25);
            }

            // Draw Bricks
            this.bricks.forEach(b => b.display(this.level));

            // Draw Bonus Balls
            this.bonusBalls.forEach(b => b.display());

            // Draw Floor
            ctx.fillStyle = "#222";
            ctx.fillRect(0, height - 5, width, 5);
        }

        startShoot(mx, my) {
            if(this.state !== 'idle') return;
            // Constrain angle to be generally upwards
            if(my > this.ballPos.y - 20) return; // Prevent shooting down

            this.state = 'shooting';
            this.ballsToShoot = this.balls.length;
            this.lastShotTime = 0;
            this.targetMx = mx;
            this.targetMy = my;
            this.firstBallReturned = false;
            this.newBallPos = null;
        }

        forceDown() {
            if(this.state !== 'shooting') return;
            this.balls.forEach(b => {
                if(b.velocity.mag() > 0) {
                    b.velocity.mult(3);
                }
            });
        }
    }

    // --- Loop ---
    const manager = new GameManager();
    managerRef.current = manager;
    
    let frameId;
    const loop = () => {
        manager.update();
        manager.draw();
        frameId = requestAnimationFrame(loop);
    };
    loop();

    // --- Events ---
    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const handleMove = (e) => {
        if(gameStateRef.current !== 'playing') return;
        const pos = getPos(e);
        Mouse.position.x = pos.x;
        Mouse.position.y = pos.y;
        
        if(manager.state === 'idle') {
            manager.state = 'aiming';
        }
    };

    const handleEnd = (e) => {
        if(gameStateRef.current !== 'playing') return;
        
        if(manager.state === 'aiming' || manager.state === 'idle') {
            manager.startShoot(Mouse.position.x, Mouse.position.y);
        }
    };

    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); handleMove(e); }, { passive: false });
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('touchend', handleEnd);

    return () => {
        cancelAnimationFrame(frameId);
        canvas.removeEventListener('mousemove', handleMove);
        canvas.removeEventListener('mouseup', handleEnd);
    };
  }, []); // Run once

  // --- React Handlers ---
  const handleGameOver = (finalScore) => {
    setGameState('gameOver');
    setScore(finalScore);
    showInterstitial();
    if (finalScore > 0) {
        addPoints(finalScore);
        updateGameStats('brick', finalScore);
    }
  };

  // Expose callbacks globally for the loop
  const gameOverRef = useRef(handleGameOver);
  const setScoreRef = useRef(setScore);

  useEffect(() => {
    gameOverRef.current = handleGameOver;
    setScoreRef.current = setScore;
  });

  useEffect(() => {
    window.handleGameOver = (s) => gameOverRef.current(s);
    window.setScore = (s) => setScoreRef.current(s);
    return () => {
        window.handleGameOver = null;
        window.setScore = null;
    };
  }, []);

  const handleStart = () => {
    setGameState('playing');
    if (managerRef.current) {
        managerRef.current.reset(); // Ensure fresh start
    }
    showInterstitial();
  };

  const handleWatchAd = () => {
    showRewardAd(50).then(res => {
      if(res === 'completed') {
        safeAlert("Reward: +50 Points");
      }
    });
  };

  const handleRestart = () => {
    handleStart();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-gray-900 p-0 overflow-hidden flex flex-col items-center justify-center font-sans touch-none"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gray-900/90 backdrop-blur-sm border-b border-white/10">
        <Link to="/games" className="text-white hover:text-blue-400">
          <SafeIcon icon={FiArrowLeft} className="w-6 h-6" />
        </Link>
        <div className="text-white font-bold text-xl">Brick Breaker</div>
        <div className="bg-white/10 px-3 py-1 rounded-full text-blue-400 font-bold flex items-center gap-1">
          <SafeIcon icon={FiCoins} className="w-4 h-4" />
          {score}
        </div>
      </div>

      {/* Canvas */}
      <div className="relative w-full max-w-md aspect-[9/16] max-h-[85vh] mt-12 bg-black rounded-lg shadow-2xl overflow-hidden border border-white/10">
        <canvas 
            ref={canvasRef} 
            className="w-full h-full block cursor-crosshair"
            style={{ touchAction: 'none' }}
        />
        
        {/* Force Down Button */}
        {gameState === 'playing' && (
            <button 
                onClick={() => managerRef.current?.forceDown()}
                className="absolute bottom-4 right-4 bg-white/10 hover:bg-white/20 backdrop-blur-md p-4 rounded-full text-white transition-all active:scale-95 border border-white/20 z-20"
            >
                <SafeIcon icon={FiArrowDown} className="w-6 h-6" />
            </button>
        )}
      </div>

      {/* Menus */}
      {gameState === 'menu' && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30 p-6">
            <div className="text-6xl mb-6 animate-bounce">🧱</div>
            <h1 className="text-4xl font-bold text-white mb-2">Brick Breaker</h1>
            <p className="text-gray-400 mb-8 text-center max-w-xs">Drag to aim. Release to shoot. Don't let the bricks hit the bottom!</p>
            <button 
                onClick={handleStart}
                className="w-full max-w-xs bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold py-4 rounded-xl shadow-lg text-xl flex items-center justify-center gap-2 hover:scale-105 transition-transform"
            >
                <SafeIcon icon={FiPlay} className="w-6 h-6" /> Play Now
            </button>
        </div>
      )}

      {gameState === 'gameOver' && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-40 p-6">
            <div className="text-6xl mb-4">💥</div>
            <h2 className="text-3xl font-bold text-white mb-2">Game Over</h2>
            <div className="bg-white/10 rounded-xl p-6 mb-8 w-full max-w-xs text-center border border-white/10">
                <div className="text-gray-400 text-sm uppercase font-bold tracking-wider mb-2">Level Reached</div>
                <div className="text-6xl font-black text-white">{score}</div>
            </div>
            
            <div className="space-y-3 w-full max-w-xs">
                 <button 
                    onClick={handleWatchAd}
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2"
                 >
                    <SafeIcon icon={FiCoins} className="w-5 h-5" /> Bonus +50 Points
                 </button>
                 
                 <div className="flex gap-2">
                     <button 
                        onClick={handleRestart}
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl border border-white/20 flex items-center justify-center gap-2"
                     >
                        <SafeIcon icon={FiRotateCcw} className="w-5 h-5" /> Retry
                     </button>
                     
                     <Link
                       to="/"
                       className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg border border-white/10 flex items-center justify-center"
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

export default BrickBreakerGame;