import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { showRewardAd, safeAlert } from '../utils/gameMonetize';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiArrowLeft, FiPlay, FiRotateCcw, FiCoins, FiClock, FiHome } = FiIcons;

const MemoryGame = () => {
  const { addPoints, updateGameStats, showInterstitial } = useGame();

  function handleWatchAd() {
    showRewardAd(60)
      .then(() => {
        // Points are added globally
        safeAlert("Reward: +60 Points!");
      })
      .catch((err) => {
        console.error("Ad failed:", err);
      });
  }

  const [gameState, setGameState] = useState('menu');
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [moves, setMoves] = useState(0);

  const cardEmojis = ['🎮', '🎯', '🏆', '⭐', '💎', '🚀', '🎪', '🎨'];

  const generateCards = () => {
    return [...cardEmojis, ...cardEmojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false
      }));
  };

  const resetGame = () => {
    setCards([]);
    setFlippedCards([]);
    setMatchedCards([]);
    setScore(0);
    setTimeLeft(60);
    setMoves(0);
    setGameState('menu');
  };

  const startGame = () => {
    setCards(generateCards());
    setFlippedCards([]);
    setMatchedCards([]);
    setScore(0);
    setTimeLeft(60);
    setMoves(0);
    setGameState('playing');
    showInterstitial(); // Show ad on start
  };

  const flipCard = (cardId) => {
    if (gameState !== 'playing' || flippedCards.length >= 2) return;
    const card = cards.find(c => c.id === cardId);
    if (card.isFlipped || matchedCards.includes(cardId) || flippedCards.includes(cardId)) return;

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setMoves(prev => prev + 1);
      const [firstId, secondId] = newFlippedCards;
      const firstCard = cards.find(c => c.id === firstId);
      const secondCard = cards.find(c => c.id === secondId);

      if (firstCard.emoji === secondCard.emoji) {
        setTimeout(() => {
          setMatchedCards(prev => [...prev, firstId, secondId]);
          setFlippedCards([]);
          setScore(prev => prev + 100);
        }, 500);
      } else {
        setTimeout(() => {
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'playing' && timeLeft === 0) {
      setGameState('gameOver');
    }
  }, [gameState, timeLeft]);

  useEffect(() => {
    if (gameState === 'playing' && matchedCards.length === cards.length && cards.length > 0) {
      const timeBonus = timeLeft * 10;
      const moveBonus = Math.max(0, (50 - moves) * 5);
      setScore(prev => prev + timeBonus + moveBonus);
      setGameState('gameOver');
    }
  }, [matchedCards, cards, gameState, timeLeft, moves]);

  useEffect(() => {
    if (gameState === 'gameOver') {
      showInterstitial();
      // Show ad on Game Over
      if (score > 0) {
        const points = Math.floor(score / 10);
        addPoints(points);
        updateGameStats('memory', score);
      }
    }
  }, [gameState]); // Removed score dependency to prevent multiple ad calls if score updates

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900 p-4 pb-24"
    >
      <div className="flex justify-between items-center mb-6 pt-4">
        <Link to="/games" className="text-white hover:text-purple-400 transition-colors">
          <SafeIcon icon={FiArrowLeft} className="w-6 h-6" />
        </Link>
        <h1 className="text-xl md:text-2xl font-bold text-white">🧠 Memory</h1>
        <div className="text-purple-400 font-bold">Score: {score}</div>
      </div>

      {gameState === 'playing' && (
        <div className="flex justify-between max-w-sm mx-auto mb-4 bg-white/5 rounded-xl p-2 border border-white/10">
          <div className="flex items-center space-x-2 text-blue-400 text-sm md:text-base">
            <SafeIcon icon={FiClock} className="w-4 h-4" />
            <span className="font-bold">{timeLeft}s</span>
          </div>
          <div className="text-yellow-400 font-bold text-sm md:text-base">Moves: {moves}</div>
          <div className="text-green-400 font-bold text-sm md:text-base">
            Pairs: {matchedCards.length / 2}/{cardEmojis.length}
          </div>
        </div>
      )}

      {/* Responsive Grid */}
      <div className="flex justify-center mb-6">
        <div className="grid grid-cols-4 gap-2 md:gap-3 w-full max-w-sm mx-auto">
          {cards.map((card) => {
            const isFlipped = flippedCards.includes(card.id) || matchedCards.includes(card.id);
            const isMatched = matchedCards.includes(card.id);
            return (
              <motion.button
                key={card.id}
                onClick={() => flipCard(card.id)}
                whileTap={{ scale: 0.95 }}
                className={`
                  aspect-square rounded-xl border-2 flex items-center justify-center transition-all duration-300 shadow-lg
                  ${isFlipped
                    ? isMatched
                      ? 'bg-green-500/30 border-green-400'
                      : 'bg-purple-500/30 border-purple-400'
                    : 'bg-white/10 border-white/20 hover:bg-white/20'}
                `}
              >
                <div className="text-2xl md:text-3xl">
                  {isFlipped ? card.emoji : '❓'}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Overlays */}
      {(gameState === 'menu' || gameState === 'gameOver') && (
        <div className="fixed inset-0 flex items-center justify-center z-20 p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-black/80 backdrop-blur-md rounded-2xl p-6 md:p-8 max-w-sm w-full border border-white/10 text-center shadow-2xl">
            {gameState === 'menu' ? (
              <>
                <div className="text-6xl mb-4">🧠</div>
                <h2 className="text-2xl font-bold text-white mb-4">Memory Match</h2>
                <p className="text-gray-300 mb-6 text-sm">Find all matching pairs before time runs out!</p>
                <button
                  onClick={startGame}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold py-3 rounded-xl shadow-lg"
                >
                  Start Game
                </button>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">{matchedCards.length === cards.length ? '🎉' : '⏰'}</div>
                <h2 className="text-2xl font-bold text-white mb-2">{matchedCards.length === cards.length ? 'Won!' : 'Time\'s Up!'}</h2>
                <p className="text-gray-300 mb-4">Score: {score}</p>
                <div className="bg-purple-500/20 rounded-xl p-3 mb-6 border border-purple-500/30">
                  <div className="flex items-center justify-center space-x-2 text-purple-400">
                    <SafeIcon icon={FiCoins} className="w-5 h-5" />
                    <span className="font-bold">+{Math.floor(score / 10)} Points</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleWatchAd}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-3 rounded-xl shadow-lg"
                  >
                    Watch Ad (+60)
                  </button>
                  <div className="flex gap-2">
                    <button
                        onClick={resetGame}
                        className="flex-1 bg-purple-600 text-white font-bold py-3 rounded-xl shadow-lg"
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

export default MemoryGame;