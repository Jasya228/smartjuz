import React, { useState } from 'react';
import GlassCard from '../components/GlassCard';
import { Camera, Lock, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../config';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('adminInfo', JSON.stringify(data));
        window.location.href = '/';
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Ошибка подключения к серверу');
    }
  };

  const quickLogin = (demoEmail, pass = 'admin123') => {
    setEmail(demoEmail);
    setPassword(pass);
    // Using setTimeout to allow state to update before submitting
    setTimeout(() => {
      document.getElementById('login-btn').click();
    }, 100);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-black">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[150px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[150px] animate-pulse-slow"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md z-10"
      >
        <GlassCard className="p-10 border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
          
          <div className="text-center mb-10">
            <motion.div 
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-20 h-20 bg-primary/10 rounded-[24px] flex items-center justify-center mx-auto mb-6 border border-primary/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
            >
              <Camera size={40} className="text-primary drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            </motion.div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
              CORE <span className="text-primary text-neon">SYSTEM</span>
            </h1>
            <p className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.4em] mt-2">Biometric Access Protocol</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-2xl mb-8 text-[10px] font-black uppercase tracking-widest text-center"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Terminal ID (Email)</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@terminal.core" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Security Key (Password)</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-all font-mono text-sm"
                />
              </div>
            </div>

            <button 
              id="login-btn"
              type="submit" 
              className="w-full bg-primary text-black font-black py-4 rounded-2xl transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] hover:scale-[1.02] active:scale-[0.98] uppercase tracking-[0.2em] text-xs mt-4"
            >
              Authorize Entry
            </button>
          </form>

          <div className="mt-12 border-t border-white/5 pt-8">
            <p className="text-[9px] font-black text-gray-600 text-center mb-6 tracking-[0.3em] uppercase">Emergency Overrides</p>
            <div className="grid grid-cols-1 gap-2">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => quickLogin('admin@aspc.kz')} className="py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold text-gray-400 hover:text-primary transition-all border border-white/5 uppercase tracking-widest">
                  Admin Console
                </button>
                <button onClick={() => quickLogin('kiosk@aspc.kz', 'kiosk123')} className="py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold text-primary hover:bg-primary/20 transition-all border border-primary/20 uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  Start Kiosk
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
        
        <p className="text-center mt-8 text-gray-600 text-[10px] font-mono tracking-widest uppercase">
          &copy; 2026 Smart Juz • Advanced AI Division
        </p>
      </motion.div>
    </div>
  );
};

export default Login;

