/* 
# Update Profit-First Configuration
Updates the default configuration to include new financial parameters needed for the safe reward system.
*/

UPDATE public.app_settings
SET config = config || '{
  "eCPM": 3.00,
  "revenueShare": 0.40,
  "exchangeRate": 58.00,
  "safetyMargin": 0.80,
  "pointsPerAd": 10
}'::jsonb;