import React from 'react';
import { motion } from 'framer-motion';
import { useAd } from '../context/AdContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiTrendingUp, FiUsers, FiEye, FiCoins, FiShield, FiActivity, FiClock, FiTarget } = FiIcons;

const AdAnalytics = () => {
  const { adState, PH_CONFIG, getConversionRate } = useAd();
  const conversion = getConversionRate();

  // Calculate analytics
  const analytics = {
    revenue: {
      totalGenerated: (adState.totalAdsWatched * PH_CONFIG.eCPM.rewarded) / 1000,
      totalPaidOut: adState.totalCoinsEarned * conversion.coinToPHP,
      profitMargin: ((adState.totalAdsWatched * PH_CONFIG.eCPM.rewarded / 1000) - (adState.totalCoinsEarned * conversion.coinToPHP)) / (adState.totalAdsWatched * PH_CONFIG.eCPM.rewarded / 1000) * 100
    },
    performance: {
      avgECPM: PH_CONFIG.eCPM.rewarded,
      fillRate: adState.totalAdsWatched > 0 ? ((adState.totalAdsWatched / (adState.totalAdsWatched + 5)) * 100).toFixed(1) : 0,
      completionRate: adState.totalAdsWatched > 0 ? 95.5 : 0 // Simulated
    },
    userActivity: {
      avgRevenuePerUser: adState.totalAdsWatched > 0 ? ((adState.totalAdsWatched * PH_CONFIG.eCPM.rewarded) / 1000) / 1 : 0,
      avgAdsPerSession: adState.todayAdCount > 0 ? adState.todayAdCount / 1 : 0,
      retentionRate: 68.5 // Simulated
    }
  };

  const formatCurrency = (amount) => {
    return `₱${amount.toFixed(2)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Revenue Overview */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10"
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
          <SafeIcon icon={FiTrendingUp} className="w-5 h-5" />
          <span>Revenue Overview</span>
        </h2>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {formatCurrency(analytics.revenue.totalGenerated)}
            </div>
            <div className="text-gray-400 text-sm">Total Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">
              {formatCurrency(analytics.revenue.totalPaidOut)}
            </div>
            <div className="text-gray-400 text-sm">Total Payout</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {analytics.revenue.profitMargin.toFixed(1)}%
            </div>
            <div className="text-gray-400 text-sm">Profit Margin</div>
          </div>
        </div>
      </motion.div>

      {/* Performance Metrics */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10"
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
          <SafeIcon icon={FiActivity} className="w-5 h-5" />
          <span>Performance Metrics</span>
        </h2>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiEye} className="w-4 h-4 text-green-400" />
              <span className="text-white">Average eCPM</span>
            </div>
            <span className="text-green-400 font-bold">₱{analytics.performance.avgECPM}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiTarget} className="w-4 h-4 text-blue-400" />
              <span className="text-white">Fill Rate</span>
            </div>
            <span className="text-blue-400 font-bold">{analytics.performance.fillRate}%</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiClock} className="w-4 h-4 text-purple-400" />
              <span className="text-white">Completion Rate</span>
            </div>
            <span className="text-purple-400 font-bold">{analytics.performance.completionRate}%</span>
          </div>
        </div>
      </motion.div>

      {/* User Activity */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10"
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
          <SafeIcon icon={FiUsers} className="w-5 h-5" />
          <span>User Activity</span>
        </h2>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiCoins} className="w-4 h-4 text-yellow-400" />
              <span className="text-white">Avg Revenue/User</span>
            </div>
            <span className="text-yellow-400 font-bold">
              {formatCurrency(analytics.userActivity.avgRevenuePerUser)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-white">Avg Ads/Session</span>
            <span className="text-blue-400 font-bold">{analytics.userActivity.avgAdsPerSession}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-white">Retention Rate</span>
            <span className="text-green-400 font-bold">{analytics.userActivity.retentionRate}%</span>
          </div>
        </div>
      </motion.div>

      {/* System Health */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10"
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
          <SafeIcon icon={FiShield} className="w-5 h-5" />
          <span>System Health</span>
        </h2>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-white">VPN Detection</span>
            <span className={`${adState.isVpnDetected ? 'text-red-400' : 'text-green-400'} font-bold`}>
              {adState.isVpnDetected ? 'Active' : 'Clear'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-white">Device Verification</span>
            <span className={`${adState.deviceVerified ? 'text-green-400' : 'text-yellow-400'} font-bold`}>
              {adState.deviceVerified ? 'Verified' : 'Pending'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-white">Anti-Abuse Status</span>
            <span className="text-green-400 font-bold">Operational</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdAnalytics;