import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import AdManager from '../components/AdManager';
import RewardsCenter from '../components/RewardsCenter'; // Using the external component now
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiArrowLeft, FiGift, FiSettings } = FiIcons;

const AdDashboard = () => {
  const [activeTab, setActiveTab] = useState('rewards');
  const tabs = [
    { id: 'rewards', label: 'Rewards', icon: FiGift },
    { id: 'settings', label: 'Settings', icon: FiSettings }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 pb-24"
    >
      <div className="flex justify-between items-center mb-6 pt-4">
        <Link to="/profile" className="text-white hover:text-purple-400 transition-colors">
          <SafeIcon icon={FiArrowLeft} className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold text-white">Ad Rewards</h1>
        <div className="w-6" />
      </div>

      <div className="flex space-x-2 mb-6 bg-white/10 rounded-xl p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-4 rounded-lg font-bold transition-all ${
              activeTab === tab.id ? 'bg-white text-purple-900' : 'text-white hover:bg-white/10'
            }`}
          >
            <SafeIcon icon={tab.icon} className="w-4 h-4 inline mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[60vh]">
        <AnimatePresence mode="wait">
          {activeTab === 'rewards' && (
            <motion.div
              key="rewards"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <RewardsCenter />
            </motion.div>
          )}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              className="text-center p-8 text-gray-400"
            >
              Settings available in Profile
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AdManager showAdButton={true} position="bottom-right" />
    </motion.div>
  );
};

export default AdDashboard;