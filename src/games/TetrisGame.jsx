import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiArrowLeft, FiPlay, FiPause, FiRotateCcw, FiCoins, FiHome } = FiIcons;

const TetrisGame = () => {
  const { addPoints, updateGameStats, showRewardAd, showInterstitial } = useGame();
  const [gameState, setGameState] = useState('menu');
  const [board, setBoard] = useState([]);
  const [currentPiece, setCurrentPiece] = useState(null);
  const [nextPiece, setNextPiece] = useState(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [dropTime, setDropTime] = useState(1000);

  const BOARD_WIDTH = 10;
  const BOARD_HEIGHT = 20;

  const PIECES = {
    I: { shape: [[1, 1, 1, 1]], color: 'bg-cyan-500' },
    O: { shape: [[1, 1], [1, 1]], color: 'bg-yellow-500' },
    T: { shape: [[0, 1, 0], [1, 1, 1]], color: 'bg-purple-500' },
    S: { shape: [[0, 1, 1], [1, 1, 0]], color: 'bg-green-500' },
    Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 'bg-red-500' },
    J: { shape: [[1, 0, 0], [1, 1, 1]], color: 'bg-blue-500' },
    L: { shape: [[0, 0, 1], [1, 1, 1]], color: 'bg-orange-500' }
  };

  const createEmptyBoard = () => {
    return Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
  };

  const getRandomPiece = () => {
    const pieceTypes = Object.keys(PIECES);
    const randomType = pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
    return {
      type: randomType,
      shape: PIECES[randomType].shape,
      color: PIECES[randomType].color,
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor(PIECES[randomType].shape[0].length / 2),
      y: 0
    };
  };

  const rotatePiece = (piece) => {
    const rotated = piece.shape[0].map((_, index) =>
      piece.shape.map(row => row[index]).reverse()
    );
    return { ...piece, shape: rotated };
  };

  const isValidMove = (piece, board, dx = 0, dy = 0) => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = piece.x + x + dx;
          const newY = piece.y + y + dy;
          if (
            newX < 0 || newX >= BOARD_WIDTH ||
            newY >= BOARD_HEIGHT ||
            (newY >= 0 && board[newY][newX])
          ) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const placePiece = (piece, board) => {
    const newBoard = board.map(row => [...row]);
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardY = piece.y + y;
          const boardX = piece.x + x;
          if (boardY >= 0) {
            newBoard[boardY][boardX] = piece.type;
          }
        }
      }
    }
    return newBoard;
  };

  const clearLines = (board) => {
    const newBoard = board.filter(row => row.some(cell => cell === 0));
    const linesCleared = BOARD_HEIGHT - newBoard.length;
    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(0));
    }
    return { board: newBoard, linesCleared };
  };

  const resetGame = () => {
    setBoard(createEmptyBoard());
    setCurrentPiece(null);
    setNextPiece(null);
    setScore(0);
    setLines(0);
    setLevel(1);
    setDropTime(1000);
    setGameState('menu');
  };

  const startGame = () => {
    const newBoard = createEmptyBoard();
    const firstPiece = getRandomPiece();
    const secondPiece = getRandomPiece();
    setBoard(newBoard);
    setCurrentPiece(firstPiece);
    setNextPiece(secondPiece);
    setScore(0);
    setLines(0);
    setLevel(1);
    setDropTime(1000);
    setGameState('playing');
    showInterstitial();
  };

  const pauseGame = () => setGameState('paused');
  const resumeGame = () => setGameState('playing');

  const dropPiece = useCallback(() => {
    if (gameState !== 'playing' || !currentPiece) return;

    if (isValidMove(currentPiece, board, 0, 1)) {
      setCurrentPiece(prev => ({ ...prev, y: prev.y + 1 }));
    } else {
      const newBoard = placePiece(currentPiece, board);
      const { board: clearedBoard, linesCleared } = clearLines(newBoard);
      setBoard(clearedBoard);
      setLines(prev => prev + linesCleared);
      if (linesCleared > 0) {
        const points = [40, 100, 300, 1200][linesCleared - 1] * level;
        setScore(prev => prev + points);
      }

      if (!isValidMove(nextPiece, clearedBoard)) {
        setGameState('gameOver');
        return;
      }
      setCurrentPiece(nextPiece);
      setNextPiece(getRandomPiece());
    }
  }, [currentPiece, nextPiece, board, gameState, level]);

  const movePiece = (dx, dy = 0) => {
    if (gameState !== 'playing' || !currentPiece) return;
    if (isValidMove(currentPiece, board, dx, dy)) {
      setCurrentPiece(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    }
  };

  const rotatePieceHandler = () => {
    if (gameState !== 'playing' || !currentPiece) return;
    const rotated = rotatePiece(currentPiece);
    if (isValidMove(rotated, board)) {
      setCurrentPiece(rotated);
    }
  };

  const hardDrop = () => {
    if (gameState !== 'playing' || !currentPiece) return;
    let piece = { ...currentPiece };
    while (isValidMove(piece, board, 0, 1)) {
      piece.y += 1;
    }
    setCurrentPiece(piece);
  };

  useEffect(() => {
    if (gameState === 'playing') {
      const gameInterval = setInterval(dropPiece, dropTime);
      return () => clearInterval(gameInterval);
    }
  }, [dropPiece, dropTime, gameState]);

  useEffect(() => {
    const newLevel = Math.floor(lines / 10) + 1;
    if (newLevel !== level) {
      setLevel(newLevel);
      setDropTime(Math.max(50, 1000 - (newLevel - 1) * 50));
    }
  }, [lines, level]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameState !== 'playing') return;
      switch (e.key) {
        case 'ArrowLeft': movePiece(-1); break;
        case 'ArrowRight': movePiece(1); break;
        case 'ArrowDown': movePiece(0, 1); break;
        case 'ArrowUp': rotatePieceHandler(); break;
        case ' ': e.preventDefault(); hardDrop(); break;
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, currentPiece, board]);

  useEffect(() => {
    if (gameState === 'gameOver') {
      showInterstitial();
      // Show Ad
      if (score > 0) {
        const points = Math.floor(score / 50);
        addPoints(points);
        updateGameStats('tetris', score);
      }
    }
  }, [gameState]);

  const renderBoard = () => {
    let displayBoard = board.map(row => [...row]);
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = currentPiece.y + y;
            const boardX = currentPiece.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = currentPiece.type;
            }
          }
        }
      }
    }
    return displayBoard;
  };

  const getCellColor = (cell) => {
    if (!cell) return 'bg-gray-800/50';
    return PIECES[cell]?.color || 'bg-gray-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4 pb-24"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4 pt-4">
        <Link to="/games" className="text-white hover:text-indigo-400 transition-colors">
          <SafeIcon icon={FiArrowLeft} className="w-6 h-6" />
        </Link>
        <h1 className="text-xl md:text-2xl font-bold text-white">🧩 Tetris</h1>
        <div className="text-indigo-400 font-bold">Score: {score}</div>
      </div>

      {/* Game Layout - Flex Column on Mobile */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-center gap-6">
        {/* Game Board */}
        <div className="flex justify-center">
          <div
            className="tetris-board grid gap-0.5 p-2 rounded-xl w-full max-w-[280px] aspect-[10/20] shadow-2xl"
            style={{
              gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
            }}
          >
            {renderBoard().map((row, y) =>
              row.map((cell, x) => (
                <div
                  key={`${y}-${x}`}
                  className={`w-full h-full rounded-[1px] ${getCellColor(cell)}`}
                />
              ))
            )}
          </div>
        </div>

        {/* Side Panel & Controls Overlay for Mobile */}
        {gameState === 'playing' && (
          <div className="flex flex-col gap-4 w-full max-w-[300px] mx-auto">
            {/* Info Panel - Hidden on very small screens if needed, or compact */}
            <div className="grid grid-cols-2 gap-2">
              {/* Next Piece */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 flex flex-col items-center justify-center">
                <h3 className="text-white text-xs font-bold mb-2">NEXT</h3>
                <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  {nextPiece && Array(4).fill().map((_, y) =>
                    Array(4).fill().map((_, x) => {
                      const hasBlock = nextPiece.shape[y] && nextPiece.shape[y][x];
                      return (
                        <div
                          key={`${y}-${x}`}
                          className={`w-3 h-3 md:w-4 md:h-4 rounded-[1px] ${hasBlock ? nextPiece.color : 'bg-transparent'}`}
                        />
                      );
                    })
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-xs md:text-sm space-y-1">
                <div className="text-white">Lvl: <span className="text-yellow-400 font-bold">{level}</span></div>
                <div className="text-white">Lines: <span className="text-green-400 font-bold">{lines}</span></div>
                <button
                  onClick={pauseGame}
                  className="mt-2 w-full bg-white/10 hover:bg-white/20 text-white py-1.5 rounded-lg flex items-center justify-center space-x-1 transition-colors"
                >
                  <SafeIcon icon={FiPause} className="w-3 h-3" />
                  <span>Pause</span>
                </button>
              </div>
            </div>

            {/* Mobile Controls */}
            <div className="grid grid-cols-3 gap-2 mt-2 select-none touch-manipulation">
              <button
                onTouchStart={(e) => { e.preventDefault(); movePiece(-1); }}
                onClick={() => movePiece(-1)}
                className="bg-white/10 active:bg-indigo-500/50 backdrop-blur-sm text-white p-4 rounded-xl text-2xl flex items-center justify-center shadow-lg aspect-square"
              >
                ⬅️
              </button>
              <div className="grid grid-rows-2 gap-2">
                <button
                  onTouchStart={(e) => { e.preventDefault(); rotatePieceHandler(); }}
                  onClick={rotatePieceHandler}
                  className="bg-white/10 active:bg-indigo-500/50 backdrop-blur-sm text-white rounded-xl text-xl flex items-center justify-center shadow-lg"
                >
                  🔄
                </button>
                <button
                  onTouchStart={(e) => { e.preventDefault(); movePiece(0, 1); }}
                  onClick={() => movePiece(0, 1)}
                  className="bg-white/10 active:bg-indigo-500/50 backdrop-blur-sm text-white rounded-xl text-xl flex items-center justify-center shadow-lg"
                >
                  ⬇️
                </button>
              </div>
              <button
                onTouchStart={(e) => { e.preventDefault(); movePiece(1); }}
                onClick={() => movePiece(1)}
                className="bg-white/10 active:bg-indigo-500/50 backdrop-blur-sm text-white p-4 rounded-xl text-2xl flex items-center justify-center shadow-lg aspect-square"
              >
                ➡️
              </button>
            </div>
            {/* Hard Drop Button */}
            <button
              onClick={hardDrop}
              className="bg-indigo-500/80 active:bg-indigo-600 backdrop-blur-sm text-white py-3 rounded-xl font-bold shadow-lg mt-1"
            >
              HARD DROP
            </button>
          </div>
        )}
      </div>

      {/* Game Over / Menu Overlays */}
      {(gameState === 'menu' || gameState === 'paused' || gameState === 'gameOver') && (
        <div className="fixed inset-0 flex items-center justify-center z-20 pointer-events-none p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-black/80 backdrop-blur-md rounded-2xl p-6 max-w-sm w-full border border-white/10 pointer-events-auto text-center shadow-2xl">
            {gameState === 'menu' && (
              <>
                <div className="text-6xl mb-4">🧩</div>
                <h2 className="text-2xl font-bold text-white mb-4">Tetris</h2>
                <p className="text-gray-300 mb-6 text-sm">Stack blocks and clear lines!</p>
                <button
                  onClick={startGame}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3 rounded-xl shadow-lg"
                >Start Game</button>
              </>
            )}

            {gameState === 'paused' && (
              <>
                <h2 className="text-2xl font-bold text-white mb-4">Paused</h2>
                <div className="space-y-3">
                  <button
                    onClick={resumeGame}
                    className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg"
                  >Resume</button>
                  <button
                    onClick={resetGame}
                    className="w-full bg-gray-700 text-white font-bold py-3 rounded-xl"
                  >Restart</button>
                </div>
              </>
            )}

            {gameState === 'gameOver' && (
              <>
                <div className="text-6xl mb-4">💥</div>
                <h2 className="text-2xl font-bold text-white mb-2">Game Over</h2>
                <p className="text-gray-300 mb-4">Score: {score}</p>
                <div className="bg-indigo-500/20 rounded-xl p-3 mb-6 border border-indigo-500/30">
                  <div className="flex items-center justify-center space-x-2 text-indigo-400">
                    <SafeIcon icon={FiCoins} className="w-5 h-5" />
                    <span className="font-bold">+{Math.floor(score / 50)} Points</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => showRewardAd(80)}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-3 rounded-xl shadow-lg"
                  >
                    Watch Ad (+80)
                  </button>
                  <div className="flex gap-2">
                    <button
                        onClick={resetGame}
                        className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg"
                    >
                        Play Again
                    </button>
                    <Link to="/" className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center">
                        <SafeIcon icon={FiHome} className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default TetrisGame;