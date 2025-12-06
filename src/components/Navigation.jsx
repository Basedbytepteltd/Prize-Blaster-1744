import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../context/GameContext'; // Import context to check auth
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiHome, FiGamepad2, FiUser, FiGift } = FiIcons;

const Navigation = () => {
  const location = useLocation();
  const { user } = useGame();

  // Hide navigation on game pages, landing pages, or if not logged in
  if (
    !user ||
    location.pathname.startsWith('/game/') ||
    location.pathname === '/landing' ||
    location.pathname === '/login' ||
    location.pathname === '/signup'
  ) {
    return null;
  }

  const navItems = [
    { path: '/', icon: FiHome, label: 'Home' },
    { path: '/games', icon: FiGamepad2, label: 'Games' },
    { path: '/rewards', icon: FiGift, label: 'Rewards' },
    { path: '/profile', icon: FiUser, label: 'Profile' }
  ];

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-lg border-t border-white/10 z-50"
    >
      <div className="flex justify-around items-center py-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center space-y-1 relative"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  isActive ? 'bg-green-500 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <SafeIcon icon={item.icon} className="w-6 h-6" />
              </motion.div>
              <span
                className={`text-xs transition-colors ${
                  isActive ? 'text-green-400' : 'text-gray-500'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-400 rounded-full"
                />
              )}
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default Navigation;