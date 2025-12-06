import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiPlay, FiDollarSign, FiSmartphone, FiShield, FiDownload, FiShare, FiPlusSquare } = FiIcons;

const Landing = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-20 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-20 w-80 h-80 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <nav className="relative z-10 flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="text-2xl font-black bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text">
          Prize Blaster
        </div>
        <Link to="/login" className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full font-bold transition-all border border-white/10">
          Log In
        </Link>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-10 pb-20 flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 text-center md:text-left mb-12 md:mb-0">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
              Play Games.<br />
              <span className="text-green-400">Earn Real Cash.</span>
            </h1>
            <p className="text-xl text-gray-400 mb-8 max-w-lg mx-auto md:mx-0">
              The ultimate gaming platform where your high scores turn into real rewards. Withdraw directly to GCash.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link to="/signup" className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-bold text-lg shadow-lg hover:shadow-green-500/50 hover:scale-105 transition-all flex items-center justify-center gap-2">
                <SafeIcon icon={FiPlay} /> Start Earning Now
              </Link>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-12 grid grid-cols-3 gap-4 text-center"
          >
            <div>
              <div className="font-bold text-2xl text-white">10+</div>
              <div className="text-sm text-gray-500">Mini Games</div>
            </div>
            <div>
              <div className="font-bold text-2xl text-white">24h</div>
              <div className="text-sm text-gray-500">Fast Payouts</div>
            </div>
            <div>
              <div className="font-bold text-2xl text-white">100%</div>
              <div className="text-sm text-gray-500">Free to Play</div>
            </div>
          </motion.div>
        </div>

        <div className="md:w-1/2 relative">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ delay: 0.2, duration: 0.6 }}
            className="relative z-10"
          >
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 rounded-3xl border border-white/10 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="bg-black rounded-2xl overflow-hidden aspect-[9/16] relative">
                {/* Simulated App Screen */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-blue-900 p-6 flex flex-col items-center">
                    <div className="w-full flex justify-between items-center mb-8">
                        <div className="w-8 h-8 rounded-full bg-white/20"></div>
                        <div className="w-20 h-6 rounded-full bg-green-500/20"></div>
                    </div>
                    <div className="w-32 h-32 bg-yellow-400 rounded-full mb-6 blur-md absolute top-20 opacity-20"></div>
                    <div className="text-4xl mb-4">🎮</div>
                    <h3 className="text-2xl font-bold mb-2">Snake Classic</h3>
                    <div className="w-full bg-white/10 h-32 rounded-xl mb-4 border border-white/10"></div>
                    <div className="w-full bg-white/10 h-32 rounded-xl border border-white/10"></div>
                    <div className="mt-auto w-full bg-green-500 h-12 rounded-xl flex items-center justify-center font-bold">Play Now</div>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Floating Icons */}
          <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute -top-10 -right-10 bg-gray-800 p-4 rounded-2xl border border-white/10 shadow-xl">
            <SafeIcon icon={FiDollarSign} className="w-8 h-8 text-green-400" />
          </motion.div>
          <motion.div animate={{ y: [0, 20, 0] }} transition={{ duration: 5, repeat: Infinity }} className="absolute bottom-10 -left-10 bg-gray-800 p-4 rounded-2xl border border-white/10 shadow-xl">
            <SafeIcon icon={FiSmartphone} className="w-8 h-8 text-blue-400" />
          </motion.div>
        </div>
      </main>
      
      {/* PWA Installation Instructions */}
      <section className="relative z-10 bg-white/5 backdrop-blur-md border-y border-white/10 py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-8 flex items-center justify-center gap-3">
                <SafeIcon icon={FiDownload} className="text-green-400" />
                <span>Install App on Mobile</span>
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8 text-left">
                <div className="bg-black/40 p-6 rounded-2xl border border-white/10">
                    <div className="text-4xl mb-4 text-green-400">1</div>
                    <h3 className="font-bold text-xl mb-2">Open Chrome</h3>
                    <p className="text-gray-400 text-sm">Launch Google Chrome on your Android device and visit this website.</p>
                </div>
                
                <div className="bg-black/40 p-6 rounded-2xl border border-white/10">
                    <div className="text-4xl mb-4 text-green-400">2</div>
                    <h3 className="font-bold text-xl mb-2 flex items-center gap-2">
                        Tap Menu <SafeIcon icon={FiShare} className="text-gray-400 w-4 h-4" />
                    </h3>
                    <p className="text-gray-400 text-sm">Tap the three dots (menu) icon in the top right corner of the browser.</p>
                </div>
                
                <div className="bg-black/40 p-6 rounded-2xl border border-white/10">
                    <div className="text-4xl mb-4 text-green-400">3</div>
                    <h3 className="font-bold text-xl mb-2 flex items-center gap-2">
                        Add to Home <SafeIcon icon={FiPlusSquare} className="text-gray-400 w-4 h-4" />
                    </h3>
                    <p className="text-gray-400 text-sm">Select "Add to Home Screen" or "Install App" to play fullscreen!</p>
                </div>
            </div>
        </div>
      </section>
      
      <footer className="relative z-10 border-t border-white/5 bg-black/20 backdrop-blur-sm py-8 text-center text-gray-500 text-sm">
        <p>&copy; 2024 Prize Blaster. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;