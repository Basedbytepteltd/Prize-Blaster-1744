import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAd } from '../context/AdContext';
import { useGame } from '../context/GameContext';
import { showRewardAd, safeAlert } from '../utils/gameMonetize';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiCoins, FiTrendingUp, FiCalendar, FiGift, FiAward, FiClock, FiCheck, FiSmartphone } = FiIcons;

const RewardsCenter = () => {
  const { adState, rewards, getConversionRate, canWatchAd, completeAd, calculateReward } = useAd();
  const { user, setUser, addPoints } = useGame();
  const [selectedReward, setSelectedReward] = useState(null);
  
  const conversion = getConversionRate();
  const [checkInTimer, setCheckInTimer] = useState(null);

  // Daily Check In Logic
  const handleDailyCheckIn = () => {
     const now = Date.now();
     const lastClaimed = user.dailyCheckIn?.lastClaimed || 0;
     const twentyFourHours = 24 * 60 * 60 * 1000;
     
     if (now - lastClaimed < twentyFourHours) {
        return; // Timer should be active
     }

     // Show Ad first (Skip appears after 35s in mock)
     showRewardAd(50).then(res => {
         if (res === 'completed') {
             setUser(prev => ({
                 ...prev,
                 dailyCheckIn: { lastClaimed: Date.now() }
             }));
             addPoints(50, "Daily Check-in");
             safeAlert("Daily Check-in: +50 Points");
         }
     });
  };

  useEffect(() => {
     const updateTimer = () => {
         const now = Date.now();
         const lastClaimed = user.dailyCheckIn?.lastClaimed || 0;
         const twentyFourHours = 24 * 60 * 60 * 1000;
         const elapsed = now - lastClaimed;
         
         if (elapsed < twentyFourHours) {
             const remaining = twentyFourHours - elapsed;
             const h = Math.floor(remaining / (1000 * 60 * 60));
             const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
             setCheckInTimer(`${h}h ${m}m`);
         } else {
             setCheckInTimer(null);
         }
     };
     updateTimer();
     const interval = setInterval(updateTimer, 60000);
     return () => clearInterval(interval);
  }, [user.dailyCheckIn]);

  const rewardCategories = [
    {
      title: 'Quick Rewards',
      icon: FiCoins,
      color: 'from-green-500 to-emerald-600',
      items: [
        {
          type: 'ad',
          title: 'Watch Rewarded Video',
          description: '30-45 seconds',
          reward: calculateReward('rewarded'),
          available: canWatchAd('rewarded').canWatch,
          cooldown: canWatchAd('rewarded').timeLeft || 0
        },
        {
          type: 'daily',
          title: 'Daily Check-in',
          description: 'Once per 24 hours',
          reward: 50,
          available: checkInTimer === null,
          timer: checkInTimer
        }
      ]
    },
    // ... (other categories can remain static for brevity or populated from context)
  ];

  const handleRewardAction = async (reward) => {
    if (reward.type === 'ad') {
      const result = await completeAd('rewarded', 'user123');
      if (result.success) {
         // managed by context
      }
    } else if (reward.type === 'daily') {
      handleDailyCheckIn();
    }
  };

  const formatTime = (milliseconds) => {
    const seconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Conversion Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-blue-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SafeIcon icon={FiTrendingUp} className="w-6 h-6 text-blue-400" />
            <div>
              <h3 className="text-white font-bold">Current Rate</h3>
              <p className="text-gray-300 text-sm">1 Coin = ₱{conversion.coinToPHP.toFixed(3)}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-green-400 font-bold">₱{(adState.totalCoinsEarned * conversion.coinToPHP).toFixed(2)}</div>
            <div className="text-gray-400 text-sm">Total Value</div>
          </div>
        </div>
      </motion.div>

      {/* Reward Categories */}
      {rewardCategories.map((category, categoryIndex) => (
        <motion.div key={category.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: categoryIndex * 0.1 }}>
          <div className="flex items-center space-x-2 mb-4">
            <SafeIcon icon={category.icon} className="w-5 h-5 text-white" />
            <h2 className="text-xl font-bold text-white">{category.title}</h2>
          </div>
          <div className="space-y-3">
            {category.items.map((reward, rewardIndex) => (
              <motion.div
                key={reward.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: categoryIndex * 0.1 + rewardIndex * 0.05 }}
                className={`bg-white/10 backdrop-blur-sm rounded-xl p-4 border transition-all ${
                  reward.completed ? 'border-green-500/50 bg-green-500/10' :
                  reward.available ? 'border-white/20 hover:border-green-500/50' : 'border-gray-500/50 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${category.color} flex items-center justify-center`}>
                      {reward.type === 'ad' && <SafeIcon icon={FiCoins} className="w-6 h-6 text-white" />}
                      {reward.type === 'daily' && <SafeIcon icon={FiCalendar} className="w-6 h-6 text-white" />}
                    </div>
                    <div>
                      <h3 className="text-white font-bold">{reward.title}</h3>
                      <p className="text-gray-400 text-sm">{reward.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {reward.timer ? (
                        <div className="flex items-center space-x-1 text-gray-400">
                           <SafeIcon icon={FiClock} className="w-4 h-4" />
                           <span className="text-sm">{reward.timer}</span>
                        </div>
                    ) : reward.type === 'ad' && reward.cooldown > 0 ? (
                      <div className="text-center">
                        <div className="flex items-center space-x-1 text-gray-400">
                          <SafeIcon icon={FiClock} className="w-4 h-4" />
                          <span className="text-sm">{formatTime(reward.cooldown)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="text-yellow-400 font-bold">+{reward.reward}</div>
                        <div className="text-gray-400 text-xs">coins</div>
                        {reward.available && (
                          <button
                            onClick={() => handleRewardAction(reward)}
                            className="mt-2 px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-colors"
                          >
                            Claim
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default RewardsCenter;