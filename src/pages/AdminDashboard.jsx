import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAd } from '../context/AdContext';
import supabase from '../supabase/supabase';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiShield, FiSettings, FiActivity, FiUsers, FiDollarSign, FiLock, FiUnlock, FiSave, FiRefreshCw, FiArrowLeft, FiLogOut, FiList, FiCheck, FiX, FiClock, FiTrendingUp } = FiIcons;

const AdminDashboard = () => {
  const { PH_CONFIG, updateConfig, adState, getConversionRate } = useAd();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [localConfig, setLocalConfig] = useState(PH_CONFIG);
  
  // Withdrawal State
  const [withdrawals, setWithdrawals] = useState([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  
  const navigate = useNavigate();

  // Admin Credentials
  const ADMIN_EMAIL = 'admin@admin.com';
  const ADMIN_PASS = '123123';

  // Derived Financials for Preview
  const financials = getConversionRate();

  useEffect(() => {
    setLocalConfig(PH_CONFIG);
  }, [PH_CONFIG]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
      setIsAuthenticated(true);
      fetchWithdrawals();
    } else {
      alert('Invalid Credentials');
    }
  };

  const handleSaveConfig = () => {
    updateConfig(localConfig);
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    navigate('/');
  };

  const fetchWithdrawals = async () => {
    setLoadingWithdrawals(true);
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setWithdrawals(data);
      else {
        const local = JSON.parse(localStorage.getItem('redemptions') || '[]');
        setWithdrawals(local.reverse());
      }
    } catch (err) {
      const local = JSON.parse(localStorage.getItem('redemptions') || '[]');
      setWithdrawals(local.reverse());
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  const updateWithdrawalStatus = async (id, newStatus) => {
    setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: newStatus } : w));
    try {
      await supabase.from('withdrawals').update({ status: newStatus }).eq('id', id);
    } catch (e) {}
    
    // Sync local storage too
    const local = JSON.parse(localStorage.getItem('redemptions') || '[]');
    const updatedLocal = local.map(w => w.id === id ? { ...w, status: newStatus } : w);
    localStorage.setItem('redemptions', JSON.stringify(updatedLocal));
  };

  // Helper for inputs
  const ConfigInput = ({ label, value, field, step = "0.01", suffix = "" }) => (
    <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
      <label className="block text-gray-400 text-xs uppercase font-bold mb-1">{label}</label>
      <div className="flex items-center">
        <input 
          type="number" 
          step={step}
          value={value} 
          onChange={(e) => setLocalConfig({ ...localConfig, [field]: parseFloat(e.target.value) })}
          className="w-full bg-transparent text-white font-bold focus:outline-none"
        />
        <span className="text-gray-500 text-sm ml-2">{suffix}</span>
      </div>
    </div>
  );

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-800 p-8 rounded-2xl max-w-sm w-full border border-gray-700 shadow-2xl"
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white">Admin Access</h2>
          <p className="text-gray-400 text-sm">Secure Login</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-gray-400 text-xs font-bold uppercase">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl border border-gray-600 mt-1"
              placeholder="admin@admin.com"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs font-bold uppercase">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-xl border border-gray-600 mt-1"
              placeholder="••••••"
            />
          </div>
          <button type="submit" className="w-full bg-green-500 text-white font-bold py-3 rounded-xl hover:bg-green-600 mt-4">
            Login
          </button>
        </form>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20">
      {/* Navbar */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 sticky top-0 z-50">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-gray-400 hover:text-white flex items-center space-x-2 bg-gray-700 px-3 py-1.5 rounded-lg">
              <SafeIcon icon={FiArrowLeft} className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">Admin Console</h1>
          </div>
          <div className="flex bg-gray-700 rounded-lg p-1">
            {['finance', 'payouts', 'overview'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md text-sm font-bold capitalize ${activeTab === tab ? 'bg-green-500 text-white' : 'text-gray-400'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button onClick={handleLogout} className="text-red-400 p-2"><SafeIcon icon={FiLogOut} /></button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* FINANCE TAB */}
        {activeTab === 'finance' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Real-time Calculator */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 rounded-xl border border-blue-500/30 shadow-lg">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <SafeIcon icon={FiTrendingUp} className="text-green-400" />
                Live Profit Calculation
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-gray-400 text-xs uppercase font-bold">Rev Per Ad</div>
                  <div className="text-2xl font-bold text-white">₱{financials.devRevenuePerAd.toFixed(4)}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs uppercase font-bold">Safe Payout (80%)</div>
                  <div className="text-2xl font-bold text-green-400">₱{financials.safePayoutPerAd.toFixed(4)}</div>
                </div>
                <div className="bg-white/10 rounded-lg p-2 -my-2">
                  <div className="text-gray-300 text-xs uppercase font-bold">Current Rate</div>
                  <div className="text-xl font-bold text-yellow-400">{financials.pointsPerPHP} Pts</div>
                  <div className="text-xs text-gray-400">= ₱1.00</div>
                </div>
                <div>
                  <div className="text-gray-400 text-xs uppercase font-bold">User Earns</div>
                  <div className="text-xl font-bold text-blue-400">₱{(localConfig.pointsPerAd * financials.valuePerPointPHP).toFixed(4)}</div>
                  <div className="text-xs text-gray-500">per ad</div>
                </div>
              </div>
            </div>

            {/* Config Inputs */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg">Financial Settings</h3>
                <button onClick={handleSaveConfig} className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">
                  {showSaveSuccess ? <SafeIcon icon={FiCheck} /> : <SafeIcon icon={FiSave} />}
                  {showSaveSuccess ? 'Saved' : 'Save Changes'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ConfigInput label="Rewarded Video eCPM (USD)" field="eCPM" value={localConfig.eCPM} suffix="$" />
                <ConfigInput label="Revenue Share (0.0 - 1.0)" field="revenueShare" value={localConfig.revenueShare} suffix="%" />
                <ConfigInput label="USD to PHP Rate" field="exchangeRate" value={localConfig.exchangeRate} suffix="₱" />
                <ConfigInput label="Safety Margin (Payout %)" field="safetyMargin" value={localConfig.safetyMargin} suffix="%" />
                <ConfigInput label="Points Per Ad" field="pointsPerAd" value={localConfig.pointsPerAd} step="1" suffix="pts" />
              </div>
            </div>
          </motion.div>
        )}

        {/* PAYOUTS TAB */}
        {activeTab === 'payouts' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
             <div className="p-4 border-b border-gray-700 flex justify-between items-center">
               <h3 className="font-bold">Withdrawal Requests</h3>
               <button onClick={fetchWithdrawals}><SafeIcon icon={FiRefreshCw} /></button>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                 <thead className="bg-gray-750 text-gray-400 uppercase">
                   <tr>
                     <th className="p-4">Date</th>
                     <th className="p-4">User</th>
                     <th className="p-4">Amount</th>
                     <th className="p-4">Status</th>
                     <th className="p-4 text-right">Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-700">
                   {withdrawals.map((item) => (
                     <tr key={item.id} className="hover:bg-gray-750">
                       <td className="p-4">{new Date(item.created_at || item.date).toLocaleDateString()}</td>
                       <td className="p-4">
                         <div className="font-bold">{item.gcash_number}</div>
                         <div className="text-xs text-gray-400">{item.email}</div>
                       </td>
                       <td className="p-4 font-bold text-green-400">₱{item.amount_php}</td>
                       <td className="p-4 uppercase text-xs font-bold">{item.status}</td>
                       <td className="p-4 text-right">
                         {item.status === 'pending' && (
                           <div className="flex justify-end gap-2">
                             <button onClick={() => updateWithdrawalStatus(item.id, 'paid')} className="text-green-400 border border-green-400 px-2 py-1 rounded hover:bg-green-400 hover:text-white">Pay</button>
                             <button onClick={() => updateWithdrawalStatus(item.id, 'rejected')} className="text-red-400 border border-red-400 px-2 py-1 rounded hover:bg-red-400 hover:text-white">Reject</button>
                           </div>
                         )}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;