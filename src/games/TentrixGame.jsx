import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiArrowLeft, FiCoins, FiRotateCcw, FiPlay, FiHome } = FiIcons;

// Game Constants
const GRID_SIZE = 10;
const SHAPES = [
  { id: '1x1', shape: [[1]], color: 'bg-yellow-400' },
  { id: '2x1', shape: [[1, 1]], color: 'bg-blue-400' },
  { id: '2x2', shape: [[1, 1], [1, 1]], color: 'bg-green-400' },
  { id: '3x1', shape: [[1, 1, 1]], color: 'bg-red-400' },
  { id: '4x1', shape: [[1, 1, 1, 1]], color: 'bg-purple-400' },
  { id: '5x1', shape: [[1, 1, 1, 1, 1]], color: 'bg-orange-400' },
  { id: 'L', shape: [[1, 0], [1, 0], [1, 1]], color: 'bg-pink-400' },
  { id: 'J', shape: [[0, 1], [0, 1], [1, 1]], color: 'bg-cyan-400' },
  { id: 'T', shape: [[1, 1, 1], [0, 1, 0]], color: 'bg-indigo-400' }
];

const TentrixGame = () => {
  const { addPoints, updateGameStats, showRewardAd, showInterstitial } = useGame();
  const [gameState, setGameState] = useState('menu'); // menu, playing, gameOver
  const [grid, setGrid] = useState(Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null)));
  const [score, setScore] = useState(0);
  const [currentShapes, setCurrentShapes] = useState([]);
  const [selectedShape, setSelectedShape] = useState(null); // index in currentShapes

  // Initialize Game
  const startGame = () => {
    setGrid(Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null)));
    setScore(0);
    generateShapes();
    setGameState('playing');
    setSelectedShape(null);
    showInterstitial(); // Ad on Start
  };

  const generateShapes = () => {
    const newShapes = [];
    for (let i = 0; i < 3; i++) {
      const randomShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      newShapes.push({ ...randomShape, used: false, uniqueId: Math.random() });
    }
    setCurrentShapes(newShapes);
  };

  const checkCollision = (r, c, shapeMatrix) => {
    for (let i = 0; i < shapeMatrix.length; i++) {
      for (let j = 0; j < shapeMatrix[i].length; j++) {
        if (shapeMatrix[i][j] === 1) {
          if (r + i >= GRID_SIZE || c + j >= GRID_SIZE || grid[r + i][c + j] !== null) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const placeShape = (r, c) => {
    if (selectedShape === null) return;
    const shapeObj = currentShapes[selectedShape];
    if (shapeObj.used) return;

    const shapeMatrix = shapeObj.shape;

    if (!checkCollision(r, c, shapeMatrix)) {
      // Place it
      const newGrid = grid.map(row => [...row]);
      let points = 0;
      for (let i = 0; i < shapeMatrix.length; i++) {
        for (let j = 0; j < shapeMatrix[i].length; j++) {
          if (shapeMatrix[i][j] === 1) {
            newGrid[r + i][c + j] = shapeObj.color;
            points++;
          }
        }
      }

      // Update grid and score
      setGrid(newGrid);
      setScore(s => s + points);

      // Mark shape as used
      const newShapes = [...currentShapes];
      newShapes[selectedShape].used = true;
      setCurrentShapes(newShapes);
      setSelectedShape(null);

      // Check lines
      checkLines(newGrid);

      // Check if all shapes used
      if (newShapes.every(s => s.used)) {
        setTimeout(generateShapes, 500);
      }
    }
  };

  const checkLines = (currentGrid) => {
    let linesCleared = 0;
    let rowsToClear = [];
    let colsToClear = [];

    // Check Rows
    for (let i = 0; i < GRID_SIZE; i++) {
      if (currentGrid[i].every(cell => cell !== null)) {
        rowsToClear.push(i);
      }
    }

    // Check Cols
    for (let j = 0; j < GRID_SIZE; j++) {
      let full = true;
      for (let i = 0; i < GRID_SIZE; i++) {
        if (currentGrid[i][j] === null) {
          full = false;
          break;
        }
      }
      if (full) colsToClear.push(j);
    }

    if (rowsToClear.length > 0 || colsToClear.length > 0) {
      const newGrid = currentGrid.map(row => [...row]);
      rowsToClear.forEach(r => {
        for (let c = 0; c < GRID_SIZE; c++) newGrid[r][c] = null;
      });
      colsToClear.forEach(c => {
        for (let r = 0; r < GRID_SIZE; r++) newGrid[r][c] = null;
      });
      setGrid(newGrid);
      setScore(s => s + (rowsToClear.length + colsToClear.length) * 10);
    }
  };

  // Check Game Over Effect
  useEffect(() => {
    if (gameState !== 'playing') return;

    // Check if any unused shape can fit anywhere
    const unusedShapes = currentShapes.filter(s => !s.used);
    if (unusedShapes.length === 0) return; // Will generate new ones soon

    let canMove = false;
    // Iterate all empty cells
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        // Check if ANY unused shape fits here
        for (const shape of unusedShapes) {
          if (!checkCollision(r, c, shape.shape)) {
            canMove = true;
            break;
          }
        }
        if (canMove) break;
      }
      if (canMove) break;
    }

    if (!canMove) {
      setGameState('gameOver');
      showInterstitial(); // Ad on Game Over
      updateGameStats('tentrix', score);
      addPoints(Math.floor(score / 10));
    }
  }, [currentShapes, grid, gameState]);

  const handleCellClick = (r, c) => {
    if (gameState === 'playing' && selectedShape !== null) {
      placeShape(r, c);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-slate-900 p-4 pb-20"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pt-4">
        <Link to="/games" className="text-white hover:text-blue-400">
          <SafeIcon icon={FiArrowLeft} className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold text-white">Tentrix</h1>
        <div className="text-blue-400 font-bold">Score: {score}</div>
      </div>

      {/* Grid */}
      <div className="flex justify-center mb-8">
        <div 
          className="grid gap-[2px] bg-slate-700 p-1 rounded-lg"
          style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(20px, 32px))` }}
        >
          {grid.map((row, r) => (
            row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                className={`
                  aspect-square rounded-[2px] cursor-pointer transition-colors
                  ${cell ? cell : 'bg-slate-800'}
                  ${selectedShape !== null && !cell ? 'hover:bg-slate-700' : ''}
                `}
              />
            ))
          ))}
        </div>
      </div>

      {/* Shape Selector */}
      {gameState === 'playing' && (
        <div className="flex justify-center gap-4 min-h-[100px]">
          {currentShapes.map((shape, idx) => (
            !shape.used && (
              <motion.div
                key={shape.uniqueId}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedShape(selectedShape === idx ? null : idx)}
                className={`
                  p-2 rounded-lg cursor-pointer transition-all
                  ${selectedShape === idx ? 'bg-white/10 ring-2 ring-blue-400' : 'bg-white/5'}
                `}
              >
                <div 
                  className="grid gap-[2px]"
                  style={{ gridTemplateColumns: `repeat(${shape.shape[0].length}, 12px)` }}
                >
                  {shape.shape.map((row, r) => 
                    row.map((cell, c) => (
                      <div 
                        key={`${r}-${c}`} 
                        className={`w-3 h-3 rounded-[1px] ${cell ? shape.color : 'bg-transparent'}`}
                      />
                    ))
                  )}
                </div>
              </motion.div>
            )
          ))}
        </div>
      )}

      {/* Game Over Modal */}
      {gameState === 'gameOver' && (
        <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50 p-4">
          <h2 className="text-3xl font-bold text-white mb-4">Game Over</h2>
          <p className="text-gray-300 mb-6">Final Score: {score}</p>
          <div className="flex flex-col gap-4 w-full max-w-xs">
            <button 
              onClick={() => showRewardAd(50)}
              className="px-6 py-3 bg-yellow-500 rounded-xl font-bold text-black flex items-center justify-center gap-2"
            >
              <SafeIcon icon={FiCoins} className="w-5 h-5" /> Bonus (+50)
            </button>
            <div className="flex gap-2">
                <button 
                  onClick={startGame}
                  className="flex-1 px-6 py-3 bg-blue-500 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                >
                  <SafeIcon icon={FiRotateCcw} className="w-5 h-5" /> Try Again
                </button>
                <Link to="/" className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center">
                    <SafeIcon icon={FiHome} className="w-5 h-5" />
                </Link>
            </div>
          </div>
        </div>
      )}

      {/* Menu */}
      {gameState === 'menu' && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 z-20">
          <div className="text-center p-8 bg-slate-800 rounded-2xl border border-white/10 mx-4">
            <div className="text-6xl mb-4">🧩</div>
            <h1 className="text-2xl font-bold text-white mb-4">Tentrix Puzzle</h1>
            <p className="text-gray-400 mb-6">Tap a shape to select, then tap grid to place!</p>
            <button 
              onClick={startGame}
              className="w-full py-4 bg-blue-500 rounded-xl font-bold text-white text-lg flex items-center justify-center gap-2"
            >
              <SafeIcon icon={FiPlay} className="w-6 h-6" /> Start Game
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default TentrixGame;