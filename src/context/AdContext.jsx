import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import supabase from '../supabase/supabase';
import { showRewardAd, safeAlert } from '../utils/gameMonetize';

const AdContext = createContext();

export const useAd = () => {
  const context = useContext(AdContext);
  if (!context) {
    throw new Error('useAd must be used within an AdProvider');
  }
  return context;
};

// PROFIT-FIRST DEFAULT CONFIGURATION
const DEFAULT_CONFIG = {
  // Financial Constants
  eCPM: 3.00,           // USD per 1000 impressions
  revenueShare: 0.40,   // 40% (Developer share after Publisher cut)
  exchangeRate: 58.00,  // 1 USD = 58 PHP
  safetyMargin: 0.80,   // Pay out 80% of revenue, keep 20% profit
  pointsPerAd: 10,      // Fixed points per ad watched
  
  // Limits
  dailyLimits: {
    newUsers: { maxCoins: 500, maxAds: 25 },
    regularUsers: { maxCoins: 1500, maxAds: 50 },
    verifiedUsers: { maxCoins: 2500, maxAds: 80 }
  },
  
  cooldowns: {
    rewardedVideo: 30,
    interstitial: 60,
    bonusReward: 21600
  },
  
  antiAbuse: {
    fastClickThreshold: 500,
    maxAccountsPerDevice: 3,
    vpnDetection: false,
    dailyAdCap: 100
  }
};

export const AdProvider = ({ children }) => {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const [adState, setAdState] = useState({
    isAdLoading: false,
    adAvailable: false,
    lastAdWatched: null,
    todayAdCount: 0,
    todayCoinEarned: 0,
    currentStreak: 0,
    lastCheckIn: null,
    totalAdsWatched: 0,
    totalCoinsEarned: 0,
    isVpnDetected: false,
    deviceVerified: true,
    cooldowns: {
      rewardedVideo: 0,
      interstitial: 0,
      bonusReward: 0
    }
  });

  const [rewards, setRewards] = useState({
    dailyCheckIn: 0,
    streakBonus: 0,
    milestoneBonus: 0
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('config')
          .limit(1)
          .single();
        
        if (error) throw error;
        
        if (data && data.config) {
          console.log("✅ Config loaded from Supabase");
          // Merge defaults to ensure new fields (revenueShare, etc) exist
          setConfig(prev => ({ ...prev, ...data.config }));
        } else {
          console.log("ℹ️ No remote config found, using defaults");
        }
      } catch (err) {
        console.warn('⚠️ Could not load remote config (using defaults):', err.message);
      } finally {
        setIsConfigLoaded(true);
      }
    };
    fetchConfig();
  }, []);

  const updateConfig = async (newConfig) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    try {
      const { data } = await supabase.from('app_settings').select('id').limit(1).single();
      if (data) {
        await supabase.from('app_settings').update({ config: updatedConfig, updated_at: new Date() }).eq('id', data.id);
      } else {
        await supabase.from('app_settings').insert({ config: updatedConfig });
      }
    } catch (err) {
      console.error('Failed to save config:', err);
    }
  };

  // Fixed reward per ad
  const calculateReward = useCallback((adType = 'rewarded') => {
    return config.pointsPerAd || 10;
  }, [config.pointsPerAd]);

  const checkCooldown = useCallback((adType) => {
    const cooldownEnd = adState.cooldowns[adType];
    return cooldownEnd > Date.now() ? cooldownEnd - Date.now() : 0;
  }, [adState.cooldowns]);

  const setCooldown = useCallback((adType) => {
    const cooldownPeriod = config.cooldowns[adType] * 1000;
    const endTime = Date.now() + cooldownPeriod;
    setAdState(prev => ({
      ...prev,
      cooldowns: { ...prev.cooldowns, [adType]: endTime }
    }));
  }, [config.cooldowns]);

  const canWatchAd = useCallback((adType) => {
    const cooldown = checkCooldown(adType);
    if (cooldown > 0) return { canWatch: false, reason: 'cooldown', timeLeft: cooldown };
    
    // Check daily caps logic if needed
    return { canWatch: true };
  }, [checkCooldown]);

  const completeAd = useCallback(async (adType, userId) => {
    try {
      setAdState(prev => ({ ...prev, isAdLoading: true }));
      
      const reward = calculateReward(adType);
      
      // Pass reward to showRewardAd to handle global state update
      const result = await showRewardAd(reward);
      
      setAdState(prev => ({ ...prev, isAdLoading: false }));
      
      if (result === 'completed') {
        setAdState(prev => ({
           ...prev,
           lastAdWatched: Date.now(),
           todayAdCount: prev.todayAdCount + 1,
           todayCoinEarned: prev.todayCoinEarned + reward,
           totalAdsWatched: prev.totalAdsWatched + 1,
           totalCoinsEarned: prev.totalCoinsEarned + reward
        }));
        setCooldown(adType);
        safeAlert(`Earned ${reward} points!`);
        return { success: true, reward, message: `Earned ${reward} points!` };
      }
      return { success: false, error: 'Ad failed' };
    } catch (error) {
      setAdState(prev => ({ ...prev, isAdLoading: false }));
      console.error('Ad completion error:', error);
      return { success: false, error: 'Ad system error' };
    }
  }, [calculateReward, setCooldown]);

  const dailyCheckIn = useCallback(() => {
     // Simple check-in logic
     const reward = 50;
     setAdState(prev => ({
         ...prev,
         todayCoinEarned: prev.todayCoinEarned + reward,
         totalCoinsEarned: prev.totalCoinsEarned + reward
     }));
     safeAlert(`Daily Check-in: +${reward} points!`);
     return { success: true, reward };
  }, []);

  // ------------------------------------------------------------------
  // CORE PROFIT FORMULA
  // ------------------------------------------------------------------
  const getConversionRate = useCallback(() => {
    const { eCPM, revenueShare, exchangeRate, safetyMargin, pointsPerAd } = config;

    // 1. Calculate Developer Revenue per Ad in PHP
    // Formula: (eCPM / 1000) * Share * Exchange
    const revenuePerAdUSD = (eCPM / 1000) * revenueShare;
    const revenuePerAdPHP = revenuePerAdUSD * exchangeRate;

    // 2. Calculate Safe Payout limit (80% of revenue)
    const safePayoutPHP = revenuePerAdPHP * safetyMargin;

    // 3. Determine value of 1 Point
    // If 1 ad gives 10 points, and 1 ad generates safePayoutPHP...
    // Then 10 points = safePayoutPHP
    const valuePerPointPHP = safePayoutPHP / pointsPerAd;

    // 4. Calculate Points needed for 1 PHP
    // 1 / valuePerPointPHP
    // Always ceil to ensure we don't undercharge points
    const pointsPerPHP = Math.max(1, Math.ceil(1 / valuePerPointPHP));

    return {
      pointsPerPHP: pointsPerPHP,
      valuePerPointPHP: valuePerPointPHP,
      coinToPHP: valuePerPointPHP, // Legacy naming support
      safePayoutPerAd: safePayoutPHP,
      devRevenuePerAd: revenuePerAdPHP,
      redemptionOptions: [
        { php: 10, method: 'GCash' },
        { php: 25, method: 'GCash' },
        { php: 50, method: 'GCash' },
        { php: 100, method: 'GCash' },
        { php: 250, method: 'Bank Transfer' },
        { php: 500, method: 'Bank Transfer' }
      ].map(opt => ({
        ...opt,
        points: Math.ceil(opt.php * pointsPerPHP),
        coins: Math.ceil(opt.php * pointsPerPHP) // Legacy support
      }))
    };
  }, [config]);

  const value = {
    adState,
    rewards,
    calculateReward,
    canWatchAd,
    completeAd,
    dailyCheckIn,
    getConversionRate,
    PH_CONFIG: config,
    updateConfig,
    isConfigLoaded
  };

  return (
    <AdContext.Provider value={value}>
      {children}
    </AdContext.Provider>
  );
};

export default AdContext;