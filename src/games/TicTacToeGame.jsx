import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { showRewardAd, safeAlert, showInterstitial } from '../utils/gameMonetize';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiArrowLeft, FiCoins, FiHome, FiCpu, FiUser } = FiIcons;

const TicTacToeGame = () => {
  const { addPoints, updateGameStats } = useGame();
  
  // Game State
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true); // Player is X
  const [gameState, setGameState] = useState('menu'); // menu, playing, won, draw, lost
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState([]);
  const [wins, setWins] = useState(0);
  const [isComputerTurn, setIsComputerTurn] = useState(false);

  // --- Logic ---
  const winCombs = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  const checkWinner = (squares) => {
    for (let i = 0; i < winCombs.length; i++) {
      const [a, b, c] = winCombs[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: winCombs[i] };
      }
    }
    return null;
  };

  const handleGameEnd = (result, currentBoard) => {
    if (result) {
      setWinner(result.winner);
      setWinningLine(result.line);
      
      if (result.winner === 'X') {
         setGameState('won');
         setWins(p => p + 1);
         updateGameStats('tictactoe', 20);
         addPoints(20);
      } else {
         setGameState('lost');
      }
      showInterstitial(); 
    } else if (!currentBoard.includes(null)) {
      setGameState('draw');
      showInterstitial();
    }
  };

  const handleClick = (index) => {
    if (gameState !== 'playing' || board[index] || winner || isComputerTurn) return;

    // Player Move
    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);
    setIsXNext(false);

    const winResult = checkWinner(newBoard);
    if (winResult || !newBoard.includes(null)) {
        handleGameEnd(winResult, newBoard);
    } else {
        // Trigger Computer Move
        setIsComputerTurn(true);
    }
  };

  // Computer Logic
  const makeComputerMove = useCallback(() => {
    if (gameState !== 'playing' || winner) return;

    // Simulate thinking time
    setTimeout(() => {
        setBoard(prevBoard => {
            const emptyIndices = prevBoard.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
            
            if (emptyIndices.length === 0) return prevBoard;

            let moveIndex;

            // 1. Check for winning move
            for (let idx of emptyIndices) {
                const tempBoard = [...prevBoard];
                tempBoard[idx] = 'O';
                if (checkWinner(tempBoard)) {
                    moveIndex = idx;
                    break;
                }
            }

            // 2. Block player winning move
            if (moveIndex === undefined) {
                for (let idx of emptyIndices) {
                    const tempBoard = [...prevBoard];
                    tempBoard[idx] = 'X';
                    if (checkWinner(tempBoard)) {
                        moveIndex = idx;
                        break;
                    }
                }
            }

            // 3. Take Center
            if (moveIndex === undefined && prevBoard[4] === null) {
                moveIndex = 4;
            }

            // 4. Random move
            if (moveIndex === undefined) {
                moveIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
            }

            const newBoard = [...prevBoard];
            newBoard[moveIndex] = 'O';
            
            // Check Computer Win inside setter to ensure sync
            const winResult = checkWinner(newBoard);
            if (winResult || !newBoard.includes(null)) {
                // We need to defer state update slightly to avoid update loop warning if necessary, but here is fine
                // However, we can't call setGameState inside setBoard. 
                // We'll use an effect to check for win after board update.
            }
            
            setIsXNext(true);
            setIsComputerTurn(false);
            return newBoard;
        });
    }, 600);
  }, [gameState, winner]);

  // Effect to trigger computer move
  useEffect(() => {
    if (isComputerTurn) {
        makeComputerMove();
    }
  }, [isComputerTurn, makeComputerMove]);

  // Effect to check game end after board update
  useEffect(() => {
    if (gameState === 'playing' && !isXNext && !isComputerTurn) {
        // Board was just updated by computer
        const winResult = checkWinner(board);
        if (winResult || !board.includes(null)) {
            handleGameEnd(winResult, board);
        }
    }
  }, [board, gameState, isXNext, isComputerTurn]);


  const initGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine([]);
    setGameState('playing');
    setIsComputerTurn(false);
  };

  const handleWatchAd = () => {
    showRewardAd(50).then(res => {
      if(res === 'completed') {
        safeAlert("Reward: +50 Points");
      }
    });
  };

  // --- Styles ---
  const backgroundStyle = {
    background: 'linear-gradient(to right, #C06C84, #6C5B7B, #355C7D)'
  };

  const titleStyle = {
    background: 'radial-gradient(circle farthest-corner at center center, #FF0000 0%, #FFFF00 25%, #05C1FF 50%, #FFFF00 75%, #FF0000 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  };

  const getCellColor = (value) => {
    if (value === 'X') return 'text-[#FFF8DC]'; // Cornsilk
    if (value === 'O') return 'text-[#AFEEEE]'; // Paleturquoise
    return 'text-transparent hover:text-white/20';
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={backgroundStyle}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-black/20 backdrop-blur-sm">
        <Link to="/games" className="text-white hover:text-pink-300 transition-colors">
          <SafeIcon icon={FiArrowLeft} className="w-6 h-6" />
        </Link>
        <div className="flex items-center gap-2">
            <span className="text-white font-bold">Wins: {wins}</span>
        </div>
      </div>

      {/* Game Content */}
      <div className="z-10 flex flex-col items-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-8 drop-shadow-lg tracking-tighter text-center" style={titleStyle}>
          TIC TAC TOE
        </h1>

        {/* Turn Indicator */}
        <div className="flex items-center gap-4 mb-8">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${isXNext ? 'bg-white/20 border-2 border-[#FFF8DC]' : 'opacity-50'}`}>
                <SafeIcon icon={FiUser} className="text-[#FFF8DC]" />
                <span className="text-[#FFF8DC] font-bold">YOU (X)</span>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${!isXNext ? 'bg-white/20 border-2 border-[#AFEEEE]' : 'opacity-50'}`}>
                <SafeIcon icon={FiCpu} className="text-[#AFEEEE]" />
                <span className="text-[#AFEEEE] font-bold">CPU (O)</span>
            </div>
        </div>

        {/* Board */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-white/10 rounded-2xl backdrop-blur-sm shadow-2xl">
          {board.map((cell, index) => {
            const isWinningCell = winningLine.includes(index);
            return (
              <motion.button
                key={index}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleClick(index)}
                disabled={cell !== null || isComputerTurn || gameState !== 'playing'}
                className={`
                  w-20 h-20 md:w-28 md:h-28 rounded-xl text-6xl md:text-7xl font-cursive flex items-center justify-center
                  bg-white/25 shadow-inner transition-all duration-200
                  ${getCellColor(cell)}
                  ${isWinningCell ? 'bg-green-500/50 scale-105 ring-4 ring-yellow-400' : ''}
                  ${!cell && gameState === 'playing' && !isComputerTurn ? 'cursor-pointer hover:bg-white/30' : 'cursor-default'}
                `}
              >
                {cell}
              </motion.button>
            );
          })}
        </div>
        
        {isComputerTurn && (
            <div className="mt-4 text-white font-bold animate-pulse">
                CPU is thinking...
            </div>
        )}
      </div>

      {/* Menu Overlay */}
      {gameState === 'menu' && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6">
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#faf0e6] text-[#800000] p-8 rounded-3xl shadow-[6px_7px_42px_0px_rgba(0,0,0,0.9)] text-center max-w-sm w-full"
            >
                <h2 className="text-4xl font-bold font-cursive mb-6 text-maroon">Ready?</h2>
                <button 
                    onClick={initGame}
                    className="w-full bg-gradient-to-r from-[#fff6b7] to-[#f6416c] text-[#8d2929] font-bold py-4 rounded-xl shadow-lg text-xl hover:scale-105 transition-transform"
                >
                    Start Game
                </button>
            </motion.div>
        </div>
      )}

      {/* Game Over Overlay */}
      {['won', 'lost', 'draw'].includes(gameState) && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6">
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#faf0e6] p-8 rounded-3xl shadow-[6px_7px_42px_0px_rgba(0,0,0,0.9)] text-center max-w-sm w-full border-4 border-white/50"
            >
                <div className="text-4xl font-bold font-cursive mb-2 text-[#800000]">
                    {gameState === 'draw' ? "It's a Draw!" : gameState === 'won' ? "You Won!" : "CPU Won!"}
                </div>
                
                {gameState === 'won' && (
                    <div className="text-green-600 font-bold mb-6">+20 Points Earned</div>
                )}
                {gameState === 'lost' && (
                    <div className="text-red-500 font-bold mb-6">Better luck next time!</div>
                )}

                <div className="space-y-3 mt-4">
                     <button 
                        onClick={handleWatchAd}
                        className="w-full bg-yellow-400 text-yellow-900 font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-2 hover:bg-yellow-300"
                     >
                        <SafeIcon icon={FiCoins} className="w-5 h-5" />
                        Bonus +50 Points
                     </button>
                     
                     <div className="flex gap-2">
                         <button 
                            onClick={initGame}
                            className="flex-1 bg-gradient-to-r from-[#fff6b7] to-[#f6416c] text-[#8d2929] font-bold py-3 rounded-xl shadow-md hover:brightness-110"
                         >
                            Play Again
                         </button>
                         
                         <Link
                           to="/"
                           className="bg-gray-700 text-white font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-center hover:bg-gray-600"
                         >
                            <SafeIcon icon={FiHome} className="w-5 h-5" />
                         </Link>
                     </div>
                </div>
            </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default TicTacToeGame;