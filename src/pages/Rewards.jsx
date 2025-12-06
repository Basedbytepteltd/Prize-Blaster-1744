import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { useAd } from '../context/AdContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiCoins, FiSmartphone, FiCheck, FiAlertCircle, FiGift, FiMail, FiRefreshCw } = FiIcons;

const Rewards = () => {
  const { user, redeemPoints, setUser } = useGame();
  const { getConversionRate, PH_CONFIG } = useAd();
  
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [gcashNumber, setGcashNumber] = useState(user.gcashNumber || '');
  const [email, setEmail] = useState(user.email || '');
  const [showSuccess, setShowSuccess] = useState(false);

  // Get dynamic rates
  const conversion = getConversionRate();
  const rewardOptions = conversion.redemptionOptions;

  const handleRedeem = () => {
    if (!selectedAmount || !gcashNumber || !email) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address");
      return;
    }

    // Process redemption
    const success = redeemPoints(selectedAmount.points, {
      amount: selectedAmount.php,
      gcashNumber,
      email
    });

    if (success) {
      setUser(prev => ({ ...prev, gcashNumber, email }));
      setShowSuccess(true);
      setSelectedAmount(null);
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 pb-24"
    >
      {/* Header */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-8 pt-8">
        <h1 className="text-3xl font-bold text-white mb-2">💰 Cash Out</h1>
        <p className="text-gray-300">Redeem your points to GCash instantly</p>
        
        <div className="flex items-center justify-center space-x-2 mt-4 text-green-400 font-bold text-xl">
          <SafeIcon icon={FiCoins} className="w-6 h-6" />
          <span>{user.points.toLocaleString()} Points Available</span>
        </div>
        
        {/* Dynamic Rate Display */}
        <div className="mt-2 text-xs bg-white/10 inline-block px-3 py-1 rounded-full text-blue-300 border border-blue-500/30">
            Current Rate: {conversion.pointsPerPHP} Points = ₱1.00
        </div>
      </motion.div>

      {/* Success Message */}
      {showSuccess && (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="mb-6 bg-green-500/20 border border-green-500/50 rounded-xl p-4 text-center">
          <SafeIcon icon={FiCheck} className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <h3 className="text-green-400 font-bold">Redemption Successful!</h3>
          <p className="text-green-300 text-sm">Confirmation sent to {email}.<br />Funds will be credited within 24 hours.</p>
        </motion.div>
      )}

      {/* Reward Options */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="mb-6">
        <h3 className="text-white font-bold text-lg mb-4">Select Amount to Redeem</h3>
        <div className="grid grid-cols-2 gap-3">
          {rewardOptions.map((option, index) => (
            <motion.button
              key={index}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              onClick={() => setSelectedAmount(option)}
              disabled={user.points < option.points}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                selectedAmount?.php === option.php 
                  ? 'border-green-500 bg-green-500/20' 
                  : user.points >= option.points 
                    ? 'border-white/20 bg-white/10 hover:border-green-500/50 hover:bg-white/20' 
                    : 'border-red-500/50 bg-red-500/10 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  ₱{option.php}
                </div>
                <div className="text-gray-300 text-sm">
                  {option.points.toLocaleString()} points
                </div>
                {user.points < option.points && (
                  <div className="text-red-400 text-xs mt-1">
                    Need {(option.points - user.points).toLocaleString()} more
                  </div>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Input Fields Container */}
      <div className="space-y-4 mb-6">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          <label className="block text-white font-medium mb-3">
            <SafeIcon icon={FiMail} className="w-5 h-5 inline mr-2" /> Email Address
          </label>
          <input 
            type="email" 
            placeholder="name@example.com" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors"
          />
        </motion.div>
        
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}>
          <label className="block text-white font-medium mb-3">
            <SafeIcon icon={FiSmartphone} className="w-5 h-5 inline mr-2" /> GCash Number
          </label>
          <input 
            type="tel" 
            placeholder="09XX XXX XXXX" 
            value={gcashNumber} 
            onChange={(e) => setGcashNumber(e.target.value)} 
            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors"
          />
        </motion.div>
      </div>

      {/* Redeem Button */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }}>
        <button 
          onClick={handleRedeem}
          disabled={!selectedAmount || !gcashNumber || !email || user.points < (selectedAmount?.points || 0)}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
            selectedAmount && gcashNumber && email && user.points >= (selectedAmount?.points || 0)
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {selectedAmount && gcashNumber && email 
            ? `Redeem ₱${selectedAmount.php}` 
            : 'Enter details to redeem'}
        </button>
      </motion.div>

      {/* Info Section */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.9 }} className="mt-8 bg-blue-500/20 rounded-xl p-4 border border-blue-500/30">
        <div className="flex items-start space-x-3">
          <SafeIcon icon={FiAlertCircle} className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h4 className="text-blue-400 font-bold mb-2">Payment Information</h4>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• Confirmation sent to your email</li>
              <li>• Payments processed within 24 hours</li>
              <li>• Minimum redemption: ₱10</li>
              <li>• 1 Ad = {PH_CONFIG.pointsPerAd} Points</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Rewards;