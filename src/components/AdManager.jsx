import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAd } from '../context/AdContext';
import { safeAlert } from '../utils/gameMonetize';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiPlay, FiClock } = FiIcons;

const AdManager = ({ showAdButton = true, position = 'bottom-right' }) => {
  const { canWatchAd, calculateReward, completeAd } = useAd();
  const [loading, setLoading] = useState(false);

  const handleWatchAd = async () => {
    const rewardAmount = calculateReward('rewarded');
    const can = canWatchAd('rewarded');

    if (!can.canWatch) {
      safeAlert(
        can.reason === 'cooldown'
          ? `Please wait ${Math.ceil(can.timeLeft / 1000)}s`
          : 'Daily limit reached'
      );
      return;
    }

    setLoading(true);
    // completeAd inside AdContext calls showRewardAd(rewardAmount)
    completeAd('rewarded', 'user123')
      .then(() => {
        console.log("Ad process finished");
      })
      .catch((err) => {
        console.warn("Ad error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const formatTimeLeft = (milliseconds) => {
    const seconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCooldownTime = () => {
    const cooldown = canWatchAd('rewarded');
    return cooldown.timeLeft || 0;
  };

  const AdButton = () => (
    <motion.div
      className={`fixed ${position === 'bottom-right' ? 'bottom-24 right-4' : 'bottom-24 left-4'} z-40`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <div className="relative">
        {canWatchAd('rewarded').canWatch && !loading && (
          <motion.div
            className="absolute inset-0 bg-green-500 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 0.3, 0.7]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}

        <motion.button
          onClick={handleWatchAd}
          disabled={!canWatchAd('rewarded').canWatch || loading}
          className={`relative px-4 py-3 rounded-full font-bold transition-all ${
            canWatchAd('rewarded').canWatch && !loading
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
          whileHover={{ scale: canWatchAd('rewarded').canWatch && !loading ? 1.05 : 1 }}
          whileTap={{ scale: 0.95 }}
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm">Loading...</span>
            </div>
          ) : getCooldownTime() > 0 ? (
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiClock} className="w-4 h-4" />
              <span className="text-sm">{formatTimeLeft(getCooldownTime())}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiPlay} className="w-4 h-4" />
              <span className="text-sm">Watch Ad</span>
            </div>
          )}
        </motion.button>

        {canWatchAd('rewarded').canWatch && !loading && (
          <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">
            +{calculateReward('rewarded')}
          </div>
        )}
      </div>
    </motion.div>
  );

  return showAdButton ? <AdButton /> : null;
};

export default AdManager;