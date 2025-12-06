import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiUser, FiMail, FiLock, FiArrowRight, FiArrowLeft } = FiIcons;

const Login = ({ isSignUp = false }) => {
  const { login } = useGame();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || (isSignUp && !formData.name)) return;
    
    // Simulate Auth
    login({
        name: formData.name || 'Player',
        email: formData.email
    });
    
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>

        <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-gray-800/80 backdrop-blur-md p-8 rounded-3xl border border-white/10 shadow-2xl relative z-10"
        >
            <Link to="/" className="absolute top-6 left-6 text-gray-400 hover:text-white transition-colors">
                <SafeIcon icon={FiArrowLeft} className="w-6 h-6" />
            </Link>
            
            <div className="text-center mb-8 mt-4">
                <h1 className="text-3xl font-bold text-white mb-2">{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
                <p className="text-gray-400">
                    {isSignUp ? 'Start your earning journey today' : 'Enter your details to continue'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1 ml-1">Username</label>
                        <div className="relative">
                            <SafeIcon icon={FiUser} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input 
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="w-full bg-gray-900/50 border border-gray-600 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-green-500 transition-colors"
                                placeholder="Enter your username"
                            />
                        </div>
                    </div>
                )}
                
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1 ml-1">Email</label>
                    <div className="relative">
                        <SafeIcon icon={FiMail} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input 
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            className="w-full bg-gray-900/50 border border-gray-600 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-green-500 transition-colors"
                            placeholder="hello@example.com"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1 ml-1">Password</label>
                    <div className="relative">
                        <SafeIcon icon={FiLock} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input 
                            type="password"
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                            className="w-full bg-gray-900/50 border border-gray-600 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-green-500 transition-colors"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-green-500/25 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 mt-6"
                >
                    {isSignUp ? 'Sign Up' : 'Log In'} <SafeIcon icon={FiArrowRight} />
                </button>
            </form>

            <div className="mt-8 text-center text-sm text-gray-400">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <Link to={isSignUp ? '/login' : '/signup'} className="text-green-400 font-bold hover:underline">
                    {isSignUp ? 'Log In' : 'Sign Up'}
                </Link>
            </div>
        </motion.div>
    </div>
  );
};

export default Login;