/*
# Seed Initial App Settings

This migration inserts the default configuration into the `app_settings` table if it is empty. This ensures that the application has a valid remote configuration to fetch on its first run, preventing errors related to missing settings.

1.  **Changelog**
    -   Checks if the `app_settings` table has any rows.
    -   If no rows exist, it inserts a single row with the default application configuration as a JSONB object.
    -   If rows already exist, it does nothing, preserving the existing configuration.

2.  **Configuration Details**
    -   **eCPM**: Sets initial revenue estimates for different ad types.
    -   **payoutPercentage**: Defines the portion of revenue shared with users (25%).
    -   **coinValue**: The value of one in-app coin in PHP.
    -   **dailyLimits**: Caps for ads and coins for different user tiers.
    -   **cooldowns**: Time restrictions between watching ads.
    -   **antiAbuse**: Basic security settings.
*/
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.app_settings) THEN
    INSERT INTO public.app_settings (config)
    VALUES ('{
        "eCPM": { "rewarded": 120, "interstitial": 80, "banner": 25 },
        "payoutPercentage": 0.25,
        "coinValue": 0.004,
        "dailyLimits": {
          "newUsers": { "maxCoins": 500, "maxAds": 25 },
          "regularUsers": { "maxCoins": 1500, "maxAds": 50 },
          "verifiedUsers": { "maxCoins": 2500, "maxAds": 80 }
        },
        "cooldowns": {
          "rewardedVideo": 30,
          "interstitial": 60,
          "bonusReward": 21600
        },
        "antiAbuse": {
          "fastClickThreshold": 500,
          "maxAccountsPerDevice": 3,
          "vpnDetection": false,
          "dailyAdCap": 100
        }
      }'::jsonb);
  END IF;
END $$;