// ⚠️ FORCE_MOCK: Set to 'true' to bypass real SDK for local dev/WebContainer testing
// Set to 'false' when building for production to enable real ads!
const FORCE_MOCK = false; // Disabled mock to use real SDK or fallback gracefully

export function isGameMonetizeReady() {
  return true;
}

export const isGameMonetizeSDKReady = isGameMonetizeReady;

export function safeAlert(message) {
  console.log("SafeAlert:", message);
  try {
    if (window.showGameNotification) {
      window.showGameNotification(message);
    } else {
      console.info("ALERT:", message);
    }
  } catch (e) {
    console.warn("Alert error", e);
  }
}

// Helper to show a visual mock ad overlay
function showMockAdOverlay(type, duration, callback) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.95);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    font-family: sans-serif;
  `;

  const adDuration = type === 'rewarded' ? 40000 : 5000; 
  const skipTime = 35000; // 35 seconds

  overlay.innerHTML = `
    <div style="font-size: 48px; margin-bottom: 20px;">📺</div>
    <h2 style="font-size: 24px; margin-bottom: 10px;">${type === 'rewarded' ? 'Rewarded Video' : 'Commercial Break'}</h2>
    <p style="color: #aaa; margin-bottom: 20px;">(Mock Ad Simulation)</p>
    
    <div style="width: 200px; height: 4px; background: #333; border-radius: 2px; overflow: hidden; margin-bottom: 20px;">
      <div id="mock-ad-progress" style="width: 0%; height: 100%; background: #10B981; transition: width ${adDuration}ms linear;"></div>
    </div>

    <div id="mock-skip-container" style="display: none;">
        <button id="mock-skip-btn" style="padding: 10px 20px; background: white; color: black; border: none; border-radius: 5px; font-weight: bold; cursor: pointer;">
            Skip Ad
        </button>
    </div>
    <div id="mock-timer" style="font-size: 14px; color: #888;"></div>
  `;

  document.body.appendChild(overlay);

  setTimeout(() => {
    const bar = document.getElementById('mock-ad-progress');
    if (bar) bar.style.width = '100%';
  }, 50);

  let timeLeft = adDuration / 1000;
  const timerDisplay = document.getElementById('mock-timer');
  const skipContainer = document.getElementById('mock-skip-container');
  const skipBtn = document.getElementById('mock-skip-btn');

  let interval = setInterval(() => {
    timeLeft--;
    if (timerDisplay) timerDisplay.innerText = `Ad ending in ${timeLeft}s`;

    if (type === 'rewarded' && (adDuration / 1000 - timeLeft) >= (skipTime / 1000)) {
       if (skipContainer) skipContainer.style.display = 'block';
    }
  }, 1000);

  const finish = () => {
    clearInterval(interval);
    if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
    }
    if (callback) callback();
  };

  if (skipBtn) {
      skipBtn.onclick = () => {
          console.log("Mock Ad Skipped");
          finish();
      };
  }

  setTimeout(() => {
    finish();
  }, adDuration);
}

// Interstitial / Commercial Break
export function showInterstitial() {
  console.log("SDK: Requesting Interstitial...");
  if (!FORCE_MOCK && typeof window.sdk !== "undefined" && typeof window.sdk.showBanner === "function") {
    try {
      window.sdk.showBanner();
    } catch (e) {
      console.warn("SDK: Interstitial failed", e);
    }
  } else {
    if (FORCE_MOCK) {
      showMockAdOverlay('interstitial', 3000, () => {
        console.log("⚠️ Mock SDK: Interstitial displayed");
      });
    } else {
      console.log("SDK Not detected, skipping interstitial (Real mode active)");
    }
  }
}

// Rewarded Video Implementation
export function showRewardAd(rewardAmount = 10) {
  return new Promise((resolve, reject) => {
    if (!FORCE_MOCK && typeof window.sdk !== "undefined" && typeof window.sdk.showBanner === "function") {
      console.log("SDK: Requesting Real Reward Ad via showBanner...");
      let isAdCompleted = false;

      const handleAdClosed = () => {
        if (isAdCompleted) return;
        isAdCompleted = true;
        cleanup();
        console.log("SDK: Ad cycle completed (SDK_GAME_START) - Granting Reward");
        grantReward(rewardAmount);
        resolve("completed");
      };

      const handleError = () => {
        if (isAdCompleted) return;
        isAdCompleted = true;
        cleanup();
        console.warn("SDK: Ad Error Event");
        resolve(false);
      };

      window.addEventListener('gamemonetize_game_start', handleAdClosed);
      window.addEventListener('gamemonetize_sdk_error', handleError);

      const cleanup = () => {
        window.removeEventListener('gamemonetize_game_start', handleAdClosed);
        window.removeEventListener('gamemonetize_sdk_error', handleError);
        if (timeoutId) clearTimeout(timeoutId);
      };

      const timeoutId = setTimeout(() => {
        if (!isAdCompleted) {
          console.warn("SDK: Ad request timed out");
          isAdCompleted = true;
          cleanup();
          resolve(false);
        }
      }, 60000);

      try {
        window.sdk.showBanner();
      } catch (err) {
        console.warn("Exception calling SDK:", err);
        isAdCompleted = true;
        cleanup();
        resolve(false);
      }
    }
    else {
      if (FORCE_MOCK) {
        console.warn(`⚠️ Ad Simulation Active: Force Mock Enabled`);
        showMockAdOverlay('rewarded', 40000, () => {
          console.log("✅ Mock SDK: Ad Finished. Granting Reward.");
          grantReward(rewardAmount);
          resolve("completed");
        });
      } else {
          console.warn("SDK not found and FORCE_MOCK is false. Cannot show ad.");
          resolve(false);
      }
    }
  });
}

function grantReward(amount) {
  window.userTokens = (window.userTokens || 0) + amount;
  
  if (window.Greta && window.Greta.variables) {
    window.Greta.variables.user_tokens = window.userTokens;
    if (typeof window.Greta.update === 'function') {
      window.Greta.update();
    }
  }
}