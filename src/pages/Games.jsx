import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiPlay, FiTrophy, FiClock } = FiIcons;

const Games = () => {
  const { gameStats } = useGame();

  const games = [
    {
      id: 'tower',
      name: 'Tower Builder',
      description: 'Stack blocks as high as you can!',
      emoji: '🏗️',
      difficulty: 'Medium',
      pointsRange: '50-1000',
      color: 'from-blue-600 to-cyan-500',
      estimatedTime: '2-5 min'
    },
    {
      id: 'tictactoe',
      name: 'Tic-Tac-Toe',
      description: 'Classic X vs O strategy game',
      emoji: '❌',
      difficulty: 'Easy',
      pointsRange: '20-50',
      color: 'from-[#C06C84] to-[#355C7D]',
      estimatedTime: '1 min'
    },
    {
      id: 'brick',
      name: 'Brick Breaker',
      description: 'Aim, shoot, and break the blocks!',
      emoji: '🧱',
      difficulty: 'Hard',
      pointsRange: '50-500',
      color: 'from-orange-500 to-amber-600',
      estimatedTime: '3-10 min'
    },
    {
      id: 'knife',
      name: 'Knife Hit',
      description: 'Throw knives and avoid obstacles',
      emoji: '🎯',
      difficulty: 'Medium',
      pointsRange: '20-100',
      color: 'from-red-500 to-rose-600',
      estimatedTime: '1-3 min'
    },
    {
      id: 'snake',
      name: 'Snake Classic',
      description: 'Classic snake game with modern twist',
      emoji: '🐍',
      difficulty: 'Easy',
      pointsRange: '50-200',
      color: 'from-green-500 to-emerald-600',
      estimatedTime: '2-5 min'
    },
    {
      id: 'flappy',
      name: 'Flappy Bird',
      description: 'Navigate through pipes and earn points',
      emoji: '🐦',
      difficulty: 'Medium',
      pointsRange: '30-150',
      color: 'from-blue-500 to-cyan-600',
      estimatedTime: '1-3 min'
    },
    {
      id: 'memory',
      name: 'Memory Match',
      description: 'Match cards and test your memory',
      emoji: '🧠',
      difficulty: 'Easy',
      pointsRange: '40-180',
      color: 'from-purple-500 to-pink-600',
      estimatedTime: '3-6 min'
    },
    {
      id: 'tetris',
      name: 'Tetris Blocks',
      description: 'Classic block-stacking puzzle',
      emoji: '🧩',
      difficulty: 'Hard',
      pointsRange: '60-300',
      color: 'from-indigo-500 to-purple-600',
      estimatedTime: '5-10 min'
    },
    {
      id: 'solitaire',
      name: 'Solitaire',
      description: 'Classic Klondike card game',
      emoji: '🃏',
      difficulty: 'Medium',
      pointsRange: '50-500',
      color: 'from-emerald-600 to-green-700',
      estimatedTime: '5-10 min'
    },
    {
      id: 'tentrix',
      name: 'Tentrix',
      description: '10x10 Block Puzzle Strategy',
      emoji: '🔳',
      difficulty: 'Hard',
      pointsRange: '50-300',
      color: 'from-orange-500 to-red-500',
      estimatedTime: '3-8 min'
    }
  ];

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-400';
      case 'Medium': return 'text-yellow-400';
      case 'Hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 pb-24"
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-8 pt-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2">🎮 Mini Games</h1>
        <p className="text-gray-300">Choose your favorite game and start earning!</p>
      </motion.div>

      <div className="space-y-4">
        {games.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={`/game/${game.id}`}>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/20 transition-all hover:scale-105">
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`bg-gradient-to-r ${game.color} p-3 rounded-xl text-2xl`}>
                    {game.emoji}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">{game.name}</h3>
                    <p className="text-gray-300 text-sm">{game.description}</p>
                  </div>
                  <SafeIcon icon={FiPlay} className="w-6 h-6 text-gray-400" />
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className={`font-bold ${getDifficultyColor(game.difficulty)}`}>
                      {game.difficulty}
                    </div>
                    <div className="text-gray-400 text-xs">Difficulty</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-400 font-bold">{game.pointsRange}</div>
                    <div className="text-gray-400 text-xs">Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-blue-400 font-bold flex items-center justify-center space-x-1">
                      <SafeIcon icon={FiClock} className="w-3 h-3" />
                      <span className="text-xs">{game.estimatedTime}</span>
                    </div>
                    <div className="text-gray-400 text-xs">Duration</div>
                  </div>
                </div>

                {gameStats[game.id] && (
                  <div className="border-t border-white/10 pt-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2 text-yellow-400">
                        <SafeIcon icon={FiTrophy} className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          High Score: {gameStats[game.id].highScore.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-gray-400 text-sm">
                        Played {gameStats[game.id].gamesPlayed} times
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default Games;