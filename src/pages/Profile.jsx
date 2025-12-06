import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiUser, FiEdit2, FiTrophy, FiCoins, FiTrendingUp, FiGamepad2, FiStar, FiCalendar, FiShield, FiLock, FiLogOut, FiAlertCircle } = FiIcons;

const Profile = () => {
  const { user, setUser, gameStats, logout } = useGame();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const avatarOptions = ['🎮', '👾', '🕹️', '🎯', '⭐', '🏆', '💎', '🚀'];

  const handleSave = () => {
    setUser(prev => ({ ...prev, name: editName }));
    setIsEditing(false);
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const totalGamesPlayed = Object.values(gameStats).reduce((sum, stat) => sum + (stat?.gamesPlayed || 0), 0);
  const highestScore = Math.max(...Object.values(gameStats).map(stat => stat?.highScore || 0));

  const achievements = [
    { name: 'First Steps', description: 'Play your first game', earned: totalGamesPlayed >= 1, icon: '🎯' },
    { name: 'Game Enthusiast', description: 'Play 10 games', earned: totalGamesPlayed >= 10, icon: '🎮' },
    { name: 'Point Collector', description: 'Earn 1,000 points', earned: user.points >= 1000, icon: '💰' },
    { name: 'High Scorer', description: 'Score over 1,000 in any game', earned: highestScore >= 1000, icon: '🏆' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 pb-24"
    >
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-8 pt-8 relative">
        <h1 className="text-3xl font-bold text-white mb-2">👤 Profile</h1>
        <p className="text-gray-300">Your gaming stats and achievements</p>
        <button 
          onClick={handleLogoutClick}
          className="absolute top-8 right-0 text-red-400 hover:text-red-300 p-2 bg-white/10 rounded-lg backdrop-blur-sm"
          title="Log Out"
        >
          <SafeIcon icon={FiLogOut} className="w-5 h-5" />
        </button>
      </motion.div>

      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-white/10">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">{user.avatar}</div>
          {isEditing ? (
            <div className="space-y-4">
              <input 
                type="text" 
                value={editName} 
                onChange={(e) => setEditName(e.target.value)} 
                className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white text-center text-xl font-bold focus:outline-none focus:border-green-500"
              />
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {avatarOptions.map((avatar) => (
                  <button 
                    key={avatar} 
                    onClick={() => setUser(prev => ({ ...prev, avatar }))}
                    className={`text-2xl p-2 rounded-lg transition-all ${user.avatar === avatar ? 'bg-green-500/30 border-2 border-green-500' : 'bg-white/10 hover:bg-white/20'}`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
              <div className="flex space-x-3 justify-center">
                <button onClick={handleSave} className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-600 transition-colors">
                  Save
                </button>
                <button onClick={() => { setIsEditing(false); setEditName(user.name); }} className="bg-gray-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-700 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{user.name}</h2>
              <p className="text-green-400 font-medium mb-4">Level {user.level} Player</p>
              <button 
                onClick={() => setIsEditing(true)}
                className="text-blue-400 hover:text-blue-300 transition-colors flex items-center space-x-2 mx-auto"
              >
                <SafeIcon icon={FiEdit2} className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-500/20 rounded-xl p-4 text-center">
            <SafeIcon icon={FiCoins} className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-white">{user.points.toLocaleString()}</div>
            <div className="text-green-400 text-sm">Total Points</div>
          </div>
          <div className="bg-blue-500/20 rounded-xl p-4 text-center">
            <SafeIcon icon={FiGamepad2} className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-xl font-bold text-white">{totalGamesPlayed}</div>
            <div className="text-blue-400 text-sm">Games Played</div>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="mb-6">
        <h3 className="text-xl font-bold text-white mb-4">🎮 Game Statistics</h3>
        <div className="space-y-3">
          {Object.entries(gameStats).map(([gameId, stats]) => {
            const gameNames = {
              snake: 'Snake Classic',
              flappy: 'Flappy Bird',
              memory: 'Memory Match',
              tetris: 'Tetris Blocks',
              knife: 'Knife Hit',
              solitaire: 'Solitaire',
              tentrix: 'Tentrix',
              brick: 'Brick Breaker',
              tictactoe: 'Tic-Tac-Toe',
              tower: 'Tower Builder'
            };
            const gameEmojis = {
              snake: '🐍',
              flappy: '🐦',
              memory: '🧠',
              tetris: '🧩',
              knife: '🎯',
              solitaire: '🃏',
              tentrix: '🔳',
              brick: '🧱',
              tictactoe: '❌',
              tower: '🏗️'
            };
            
            if (!stats) return null;

            return (
              <div key={gameId} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{gameEmojis[gameId] || '🎮'}</span>
                    <div>
                      <h4 className="font-bold text-white">{gameNames[gameId] || gameId}</h4>
                      <p className="text-gray-400 text-sm">{stats.gamesPlayed} games played</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400 font-bold">{stats.highScore.toLocaleString()}</div>
                    <div className="text-gray-400 text-sm">High Score</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
        <h3 className="text-xl font-bold text-white mb-4">🏆 Achievements</h3>
        <div className="grid grid-cols-1 gap-3 mb-8">
          {achievements.map((achievement, index) => (
            <div 
              key={index} 
              className={`rounded-xl p-4 border transition-all ${achievement.earned ? 'bg-yellow-500/20 border-yellow-500/50' : 'bg-gray-500/20 border-gray-500/50'}`}
            >
              <div className="flex items-center space-x-4">
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1">
                  <h4 className={`font-bold ${achievement.earned ? 'text-yellow-400' : 'text-gray-400'}`}>
                    {achievement.name}
                  </h4>
                  <p className="text-gray-300 text-sm">{achievement.description}</p>
                </div>
                {achievement.earned && (
                  <SafeIcon icon={FiTrophy} className="w-5 h-5 text-yellow-400" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Secret Admin Button */}
        <div className="flex justify-center items-center space-x-2 pb-8 opacity-20 hover:opacity-100 transition-opacity duration-500">
           <span className="text-xs text-gray-500">Prize Blaster v1.1.0</span>
           <Link to="/admin" className="text-gray-500 hover:text-red-500 transition-colors p-2">
             <SafeIcon icon={FiLock} className="w-3 h-3" />
           </Link>
        </div>

        <button 
          onClick={handleLogoutClick}
          className="w-full bg-red-500/20 text-red-400 font-bold py-3 rounded-xl hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center gap-2 mb-8"
        >
          <SafeIcon icon={FiLogOut} className="w-5 h-5" />
          Log Out
        </button>
      </motion.div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full border border-white/10 text-center"
            >
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <SafeIcon icon={FiLogOut} className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Log Out?</h3>
              <p className="text-gray-400 mb-6">Are you sure you want to sign out of your account?</p>
              <div className="flex space-x-3">
                <button
                  onClick={cancelLogout}
                  className="flex-1 py-3 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Profile;