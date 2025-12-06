import { isGameMonetizeReady } from "../utils/gameMonetize";

class GameMonetizeService {
    constructor() {
        this.isInitialized = false;
    }

    async initialize() {
        console.log("GameMonetizeService: initializing...");
        this.isInitialized = true; 
        
        // Check both SDK presence and if we are forcing mock
        // We import the logic implicitly by using the utils, but for logging:
        const isMockActive = true; // We know FORCE_MOCK is true in utils now

        if (typeof window.sdk !== "undefined") {
            console.log("✅ Real GameMonetize SDK detected (But MOCK mode is enforced for Dev)");
        } else {
            console.log("ℹ️ GameMonetize SDK not detected - Running in MOCK mode");
        }
        
        return Promise.resolve(true);
    }

    getStatus() {
        return {
            ready: true,
            isMock: true // Always true in this environment configuration
        };
    }
}

const gameMonetizeService = new GameMonetizeService();
export default gameMonetizeService;