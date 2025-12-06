import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useAd } from '../context/AdContext';
import { showRewardAd, safeAlert } from '../utils/gameMonetize';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiCoins, FiTrendingUp, FiPlay, FiGift, FiStar, FiActivity, FiClock } = FiIcons;

const Home = () => {
  const { user, addPoints, setUser } = useGame();
  const { adState, getConversionRate } = useAd();
  const conversion = getConversionRate();
  const [bonusTimer, setBonusTimer] = useState(null);

  // Daily Bonus Logic
  const handleDailyBonus = () => {
    const now = Date.now();
    const lastClaimed = user.dailyBonus?.lastClaimed || 0;
    const count = user.dailyBonus?.count || 0;

    // Reset count if new day
    const lastDate = new Date(lastClaimed).getDate();
    const curDate = new Date(now).getDate();
    let newCount = count;
    if (lastDate !== curDate) {
      newCount = 0;
    }

    if (newCount >= 2) {
      safeAlert("Max 2 bonuses per day!");
      return;
    }

    // 12 Hour Cooldown
    const hoursSinceLast = (now - lastClaimed) / (1000 * 60 * 60);
    if (newCount > 0 && hoursSinceLast < 12) {
       // Should show timer
       return;
    }

    showRewardAd(100)
      .then((res) => {
        if (res === 'completed') {
          addPoints(100, "Daily Bonus");
          setUser(prev => ({
            ...prev,
            dailyBonus: {
              count: newCount + 1,
              lastClaimed: Date.now()
            }
          }));
          safeAlert("Daily Bonus: +100 Points!");
        }
      })
      .catch((err) => {
        console.warn("Ad not completed:", err);
      });
  };

  // Calculate Bonus Cooldown to display
  useEffect(() => {
    const checkTimer = () => {
       const now = Date.now();
       const lastClaimed = user.dailyBonus?.lastClaimed || 0;
       const count = user.dailyBonus?.count || 0;
       
       // Handle day reset logic visually
       const lastDate = new Date(lastClaimed).getDate();
       const curDate = new Date(now).getDate();
       let effectiveCount = count;
       if (lastDate !== curDate) effectiveCount = 0;

       if (effectiveCount >= 2) {
          setBonusTimer("Max claimed for today");
       } else if (effectiveCount > 0) {
          const elapsed = now - lastClaimed;
          const twelveHours = 12 * 60 * 60 * 1000;
          if (elapsed < twelveHours) {
             const remaining = twelveHours - elapsed;
             const h = Math.floor(remaining / (1000 * 60 * 60));
             const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
             setBonusTimer(`${h}h ${m}m`);
          } else {
             setBonusTimer(null);
          }
       } else {
          setBonusTimer(null);
       }
    };
    
    checkTimer();
    const interval = setInterval(checkTimer, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [user.dailyBonus]);

  const featuredGames = [
    { id: 'knife', name: 'Knife Hit', emoji: '🎯', points: '20-100', color: 'from-red-500 to-rose-600' },
    { id: 'solitaire', name: 'Solitaire', emoji: '🃏', points: '50-500', color: 'from-emerald-600 to-green-700' },
    { id: 'snake', name: 'Snake Classic', emoji: '🐍', points: '50-200', color: 'from-green-500 to-emerald-600' },
    { id: 'memory', name: 'Memory Match', emoji: '🧠', points: '40-180', color: 'from-purple-500 to-pink-600' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 pb-24"
    >
      {/* Header */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex justify-between items-center mb-8 pt-8">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Hello, {user.name}! 👋
          </h1>
          <p className="text-gray-300">Ready to earn some money?</p>
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-2 text-green-400 font-bold text-lg">
            <SafeIcon icon={FiCoins} className="w-5 h-5" />
            <span>{user.points.toLocaleString()}</span>
          </div>
          <p className="text-xs text-gray-400">Points</p>
        </div>
      </motion.div>

      {/* Ad Dashboard Quick Access */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="mb-6"
      >
        <Link to="/ad-dashboard">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg mb-1 flex items-center space-x-2">
                  <SafeIcon icon={FiActivity} className="w-5 h-5" />
                  <span>Ad Rewards Center</span>
                </h3>
                <p className="text-purple-100 text-sm">Watch ads & earn coins instantly</p>
                <div className="mt-2 text-sm">
                   <span className="text-purple-200">Today's earnings: </span>
                   <span className="font-bold">₱{(adState.todayCoinEarned * conversion.coinToPHP).toFixed(2)}</span>
                </div>
              </div>
              <div className="text-3xl">📱</div>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Daily Bonus */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-6 mb-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg mb-1">Daily Bonus! 🎁</h3>
            <p className="text-yellow-100 text-sm">Watch an ad for free points</p>
            <div className="text-xs mt-1 opacity-80">
                {user.dailyBonus?.count || 0}/2 claimed today
            </div>
          </div>
          {bonusTimer ? (
             <div className="bg-white/20 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                <SafeIcon icon={FiClock} className="w-4 h-4" />
                {bonusTimer}
             </div>
          ) : (
             <button 
                onClick={handleDailyBonus} 
                className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg font-bold hover:bg-white/30 transition-all"
             >
                Claim 100 Points
             </button>
          )}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <div className="flex items-center space-x-3">
            <div className="bg-green-500/20 p-2 rounded-lg">
              <SafeIcon icon={FiTrendingUp} className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">{user.level}</p>
              <p className="text-gray-400 text-sm">Level</p>
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <SafeIcon icon={FiStar} className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">{user.gamesPlayed}</p>
              <p className="text-gray-400 text-sm">Games Played</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Featured Games */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="mb-6">
        <h2 className="text-xl font-bold text-white mb-4">🔥 Featured Games</h2>
        <div className="space-y-3">
          {featuredGames.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 + index * 0.1 }}
            >
              <Link to={`/game/${game.id}`}>
                <div className={`bg-gradient-to-r ${game.color} rounded-xl p-4 text-white hover:scale-105 transition-transform`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl">{game.emoji}</div>
                      <div>
                        <h3 className="font-bold">{game.name}</h3>
                        <p className="text-white/80 text-sm">{game.points} points per game</p>
                      </div>
                    </div>
                    <SafeIcon icon={FiPlay} className="w-6 h-6" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }} className="grid grid-cols-2 gap-4">
        <Link to="/games" className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-center hover:bg-white/20 transition-all">
          <div className="text-3xl mb-2">🎮</div>
          <p className="text-white font-medium">All Games</p>
          <p className="text-gray-400 text-sm">Play & Earn</p>
        </Link>
        <Link to="/rewards" className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-center hover:bg-white/20 transition-all">
          <div className="text-3xl mb-2">💰</div>
          <p className="text-white font-medium">Cash Out</p>
          <p className="text-gray-400 text-sm">To GCash</p>
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default Home;