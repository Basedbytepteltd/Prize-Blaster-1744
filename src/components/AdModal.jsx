import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import { showRewardAd } from '../utils/gameMonetize';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiX, FiPlay, FiCoins } = FiIcons;

const AdModal = () => {
  const { showAdModal, adReward, closeAdModal } = useGame();

  const handleWatchAd = () => {
    // showRewardAd now handles the point addition internally via Greta/GameContext link
    showRewardAd(adReward)
      .then((result) => {
        if(result === 'completed') {
            console.log("Reward completed!");
            closeAdModal(); 
        }
      })
      .catch((err) => {
        console.warn("Ad not completed:", err);
      });
  };

  return (
    <AnimatePresence>
      {showAdModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 max-w-sm w-full border border-white/10"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Watch Ad</h3>
              <button
                onClick={() => closeAdModal()}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <SafeIcon icon={FiX} className="w-6 h-6" />
              </button>
            </div>

            <div className="text-center mb-6">
              <div className="text-6xl mb-4">📺</div>
              <p className="text-gray-300 mb-4">
                Watch a short video to earn points!
              </p>
              <div className="flex items-center justify-center space-x-2 text-green-400 font-bold text-lg">
                <SafeIcon icon={FiCoins} className="w-5 h-5" />
                <span>+{adReward} Points</span>
              </div>
            </div>

            <button
              onClick={handleWatchAd}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 rounded-xl flex items-center justify-center space-x-2 hover:from-green-600 hover:to-emerald-700 transition-all"
            >
              <SafeIcon icon={FiPlay} className="w-5 h-5" />
              <span>Watch Now</span>
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AdModal;