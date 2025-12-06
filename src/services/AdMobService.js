import { ADMOB_CONFIG } from '../config/admob';

// Web Simulation Service replacing native AdMob for development/web environments
export const AdMobService = {
  initialize: async () => {
    console.log('WebAdService: Initialized (Simulation Mode)');
    return Promise.resolve();
  },

  showBanner: async () => {
    console.log('WebAdService: Banner requested (Hidden in web view for better UX)');
    return Promise.resolve();
  },

  hideBanner: async () => {
    console.log('WebAdService: Banner hidden');
    return Promise.resolve();
  },

  resumeBanner: async () => {
    return Promise.resolve();
  },

  // Simulates watching an interstitial ad with a 3-second delay
  showInterstitial: async () => {
    return new Promise((resolve) => {
      console.log('WebAdService: 🎬 Showing Interstitial Simulation...');
      
      const adDuration = 3000; // 3 seconds
      
      setTimeout(() => {
        console.log('WebAdService: ✅ Interstitial Finished');
        resolve(true);
      }, adDuration);
    });
  },

  // Simulates watching a rewarded video with a 4-second delay
  showRewarded: async () => {
    return new Promise((resolve) => {
      console.log('WebAdService: 🎁 Showing Rewarded Video Simulation...');
      
      const adDuration = 4000; // 4 seconds
      
      setTimeout(() => {
        console.log('WebAdService: 🏆 Reward Earned');
        resolve({ earned: true });
      }, adDuration);
    });
  }
};