import React, { createContext, useContext, useState, useEffect } from 'react';
import { showRewardAd, showInterstitial, safeAlert } from '../utils/gameMonetize';

const GameContext = createContext();

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export const GameProvider = ({ children }) => {
  // Initialize user from local storage or null (unauthenticated)
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('prize_blaster_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [showAdModal, setShowAdModal] = useState(false);
  const [adReward, setAdReward] = useState(0);
  const [isGamePaused, setIsGamePaused] = useState(false);

  const [gameStats, setGameStats] = useState(() => {
    const savedStats = localStorage.getItem('prize_blaster_stats');
    return savedStats ? JSON.parse(savedStats) : {
      snake: { highScore: 0, gamesPlayed: 0 },
      flappy: { highScore: 0, gamesPlayed: 0 },
      memory: { highScore: 0, gamesPlayed: 0 },
      tetris: { highScore: 0, gamesPlayed: 0 },
      knife: { highScore: 0, gamesPlayed: 0 },
      solitaire: { highScore: 0, gamesPlayed: 0 },
      tentrix: { highScore: 0, gamesPlayed: 0 },
      brick: { highScore: 0, gamesPlayed: 0 },
      tower: { highScore: 0, gamesPlayed: 0 },
      tictactoe: { highScore: 0, gamesPlayed: 0 }
    };
  });

  // Persist User and Stats
  useEffect(() => {
    if (user) {
      localStorage.setItem('prize_blaster_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('prize_blaster_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('prize_blaster_stats', JSON.stringify(gameStats));
  }, [gameStats]);

  // Global SDK Hook for Pause/Resume
  useEffect(() => {
    window.gameContext = {
      pause: () => setIsGamePaused(true),
      resume: () => setIsGamePaused(false)
    };
    return () => {
      window.gameContext = undefined;
    };
  }, []);

  // Sync with Global Window Vars (for SDK)
  useEffect(() => {
    if (user) {
      window.userTokens = user.points;
      window.Greta = {
        variables: { user_tokens: user.points },
        update: () => {
          const newPoints = window.Greta.variables.user_tokens;
          if (newPoints !== undefined) {
             // We don't want to blindly overwrite if we have history logic, 
             // but for SDK sync it's okay. 
             // Ideally we use addPoints to track history.
             // If SDK adds points directly, we might miss history, but we'll accept it for now.
             setUser(prev => ({ ...prev, points: newPoints }));
          }
        }
      };
    }
  }, [user]);

  const login = (userData) => {
    // Simulate login/signup
    const newUser = {
      name: userData.name,
      email: userData.email,
      points: 50, // Welcome bonus
      level: 1,
      gamesPlayed: 0,
      gcashNumber: '',
      avatar: '🎮',
      history: [], // Points History
      dailyBonus: { count: 0, lastClaimed: 0 },
      dailyCheckIn: { lastClaimed: 0 },
      ...userData
    };
    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
    setGameStats({
      snake: { highScore: 0, gamesPlayed: 0 },
      flappy: { highScore: 0, gamesPlayed: 0 },
      memory: { highScore: 0, gamesPlayed: 0 },
      tetris: { highScore: 0, gamesPlayed: 0 },
      knife: { highScore: 0, gamesPlayed: 0 },
      solitaire: { highScore: 0, gamesPlayed: 0 },
      tentrix: { highScore: 0, gamesPlayed: 0 },
      brick: { highScore: 0, gamesPlayed: 0 },
      tower: { highScore: 0, gamesPlayed: 0 },
      tictactoe: { highScore: 0, gamesPlayed: 0 }
    });
  };

  const addToHistory = (type, amount, description) => {
    if (!user) return;
    const newEntry = {
      id: Date.now(),
      type, // 'earn' or 'redeem'
      amount,
      description,
      date: new Date().toISOString()
    };
    setUser(prev => ({
      ...prev,
      history: [newEntry, ...(prev.history || [])].slice(0, 50) // Keep last 50
    }));
  };

  const addPoints = (points, source = "Game Reward") => {
    if (!user) return;
    setUser(prev => ({ ...prev, points: prev.points + points }));
    addToHistory('earn', points, source);
  };

  const showRewardAdWithReward = (rewardAmount) => {
    showRewardAd(rewardAmount)
      .then((result) => {
        if (result === 'completed') {
          safeAlert(`Reward: +${rewardAmount} Points!`);
          // Note: showRewardAd updates global window.userTokens, which triggers useEffect
          // But to ensure history is logged:
          addToHistory('earn', rewardAmount, 'Ad Reward');
        }
      })
      .catch((err) => {
        console.warn("Ad not completed:", err);
      });
  };

  const closeAdModal = () => {
    setShowAdModal(false);
    if (adReward > 0) {
      showRewardAdWithReward(adReward);
      setAdReward(0);
    }
  };

  const updateGameStats = (game, score) => {
    if (!user) return;
    setGameStats(prev => ({
      ...prev,
      [game]: {
        ...prev[game] || { highScore: 0, gamesPlayed: 0 },
        highScore: Math.max((prev[game]?.highScore || 0), score),
        gamesPlayed: (prev[game]?.gamesPlayed || 0) + 1
      }
    }));
    setUser(prev => ({ ...prev, gamesPlayed: prev.gamesPlayed + 1 }));
  };

  const redeemPoints = async (amount, details) => {
    if (user && user.points >= amount) {
      setUser(prev => ({ ...prev, points: prev.points - amount }));
      addToHistory('redeem', amount, `Redeemed to ${details.gcashNumber}`);

      const currentRedemptions = JSON.parse(localStorage.getItem('redemptions') || '[]');
      const newRedemption = {
        id: Date.now(),
        email: details.email,
        gcash_number: details.gcashNumber,
        amount_php: details.amount,
        points_redeemed: amount,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      currentRedemptions.push(newRedemption);
      localStorage.setItem('redemptions', JSON.stringify(currentRedemptions));
      return true;
    }
    return false;
  };

  const value = {
    user,
    setUser,
    login,
    logout,
    gameStats,
    showAdModal,
    adReward,
    addPoints,
    showRewardAd: showRewardAdWithReward,
    showInterstitial,
    closeAdModal,
    updateGameStats,
    redeemPoints,
    isGamePaused
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};