# Prize Blaster - Play Games, Earn Money

## GameMonetize SDK Integration ✅

**Game ID:** `jnk3u9mh5zyedwr0pb3o59bttvv05e4d`

### Implementation Status

✅ **SDK Integrated** - GameMonetize SDK is properly integrated  
✅ **Rewarded Ads** - Users can watch ads to earn coins  
✅ **Banner Ads** - Display ads shown at appropriate times  
✅ **Interstitial Ads** - Full-screen ads between games  
✅ **Lifecycle Events** - Game ready, start, over signals implemented  

### How It Works

1. **SDK Loading**: The GameMonetize SDK loads automatically when the app starts
2. **Ad Watching**: Users click "Watch Ad" button to view rewarded videos
3. **Rewards**: Upon completion, users earn in-game coins
4. **Verification**: Ads are tracked and verified through GameMonetize

### Testing Your Game

To verify the SDK implementation:

1. **Build the game:**
   ```bash
   npm install
   npm run build
   ```

2. **Create ZIP file:**
   - Compress the `dist` folder contents (not the folder itself)
   - The root should contain `index.html` and all game files
   - Make sure `ads.txt` is included in the root

3. **Upload to GameMonetize:**
   - Go to your GameMonetize dashboard
   - Upload the ZIP file
   - Click "Verify Game" to test within iframe

4. **Verification:**
   - Watch a complete advertisement in the iframe
   - The SDK will automatically verify the implementation

### Important Notes

⚠️ **Root Folder Structure:**
```
your-game.zip/
├── index.html (MUST be in root)
├── assets/
├── ads.txt
└── [other files]
```

⚠️ **No Floating Buttons:** More Games buttons must not disrupt gameplay

⚠️ **No External Iframes:** Do not embed ads from other networks

⚠️ **No Timer Ads:** Ads should not interrupt gameplay timers

### Game Features

- 🎮 7 Mini-Games (Snake, Flappy, Memory, Tetris, Knife Hit, Solitaire, Tentrix)
- 💰 Earn real money by watching ads
- 📱 Mobile-optimized gameplay
- 🏆 Achievement system
- 💳 GCash payout integration

### Deployment

For production deployment:

1. Build the project: `npm run build`
2. The `dist` folder contains all files needed
3. Compress `dist` contents (not the folder) as ZIP
4. Upload to GameMonetize

### Contact

For SDK issues or verification problems:
- **Tester Specialist:** mentolatux@gamemonetize.com

---

**Status:** Ready for GameMonetize Distribution ✅