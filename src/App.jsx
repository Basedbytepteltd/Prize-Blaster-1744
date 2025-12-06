import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import gameMonetizeService from './services/GameMonetizeService';

// Pages
import Home from './pages/Home';
import Games from './pages/Games';
import Profile from './pages/Profile';
import Rewards from './pages/Rewards';
import AdDashboard from './pages/AdDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Landing from './pages/Landing';
import Login from './pages/Login';

// Games
import SnakeGame from './games/SnakeGame';
import FlappyGame from './games/FlappyGame';
import MemoryGame from './games/MemoryGame';
import TetrisGame from './games/TetrisGame';
import KnifeHitGame from './games/KnifeHitGame';
import SolitaireGame from './games/SolitaireGame';
import TentrixGame from './games/TentrixGame';
import BrickBreakerGame from './games/BrickBreakerGame';
import TowerGame from './games/TowerGame';
import TicTacToeGame from './games/TicTacToeGame';

// Components
import Navigation from './components/Navigation';
import LoadingScreen from './components/LoadingScreen';
import AdModal from './components/AdModal';
import GlobalBanner from './components/GlobalBanner';

// Context
import { GameProvider, useGame } from './context/GameContext';
import { AdProvider } from './context/AdContext';

import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user } = useGame();
  if (!user) {
    return <Navigate to="/landing" replace />;
  }
  return children;
};

const AppContent = ({ isLoading }) => {
  const location = useLocation();
  const { user } = useGame();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="app min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 pb-[50px]">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public Routes */}
          <Route path="/landing" element={!user ? <Landing /> : <Navigate to="/" />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/signup" element={!user ? <Login isSignUp={true} /> : <Navigate to="/" />} />
          
          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/games" element={<ProtectedRoute><Games /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/rewards" element={<ProtectedRoute><Rewards /></ProtectedRoute>} />
          <Route path="/ad-dashboard" element={<ProtectedRoute><AdDashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          
          {/* Games */}
          <Route path="/game/snake" element={<ProtectedRoute><SnakeGame /></ProtectedRoute>} />
          <Route path="/game/flappy" element={<ProtectedRoute><FlappyGame /></ProtectedRoute>} />
          <Route path="/game/memory" element={<ProtectedRoute><MemoryGame /></ProtectedRoute>} />
          <Route path="/game/tetris" element={<ProtectedRoute><TetrisGame /></ProtectedRoute>} />
          <Route path="/game/knife" element={<ProtectedRoute><KnifeHitGame /></ProtectedRoute>} />
          <Route path="/game/solitaire" element={<ProtectedRoute><SolitaireGame /></ProtectedRoute>} />
          <Route path="/game/tentrix" element={<ProtectedRoute><TentrixGame /></ProtectedRoute>} />
          <Route path="/game/brick" element={<ProtectedRoute><BrickBreakerGame /></ProtectedRoute>} />
          <Route path="/game/tower" element={<ProtectedRoute><TowerGame /></ProtectedRoute>} />
          <Route path="/game/tictactoe" element={<ProtectedRoute><TicTacToeGame /></ProtectedRoute>} />
        </Routes>
      </AnimatePresence>
      <Navigation />
      <AdModal />
      <GlobalBanner />
    </div>
  );
};

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sdkStatus, setSdkStatus] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('🎮 App initializing...');
        await gameMonetizeService.initialize();
        const status = gameMonetizeService.getStatus();
        setSdkStatus(status);
        setIsLoading(false);
      } catch (err) {
        console.error("❌ App initialization warning:", err);
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white p-4 text-center">
        <div>
          <h1 className="text-4xl mb-4">⚠️</h1>
          <h2 className="text-xl font-bold mb-2">Application Error</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-green-500 rounded-lg font-bold"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <GameProvider>
      <AdProvider>
        <Router>
          <AppContent isLoading={isLoading} />
          {!isLoading && sdkStatus && sdkStatus.ready && (
            <div className="fixed bottom-20 left-2 bg-black/80 text-white text-xs p-2 rounded max-w-[200px] z-50 pointer-events-none opacity-50 hover:opacity-100 transition-opacity">
               <div className="font-bold mb-1">SDK Status:</div>
               <div>Ready: ✅</div>
            </div>
          )}
        </Router>
      </AdProvider>
    </GameProvider>
  );
}

export default App;