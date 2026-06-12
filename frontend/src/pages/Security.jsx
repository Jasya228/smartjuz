import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import { ShieldAlert, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Security = () => {
  const [threats, setThreats] = useState([]);

  useEffect(() => {
    fetchThreats();
    const interval = setInterval(fetchThreats, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchThreats = async () => {
    try {
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));
      const res = await fetch('/api/security/threats', {
        headers: { Authorization: `Bearer ${adminInfo?.token}` }
      });
      if (res.ok) setThreats(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Erase threat record from buffer?')) return;
    try {
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));
      const res = await fetch(`/api/security/threats/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminInfo?.token}` }
      });
      if (res.ok) fetchThreats();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">
            SECURITY <span className="text-red-500 text-neon">BREACHES</span>
          </h1>
          <p className="text-gray-400 font-medium flex items-center gap-2 mt-1 uppercase text-xs tracking-widest">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
            Обнаружение несанкционированных субъектов
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {threats.length === 0 ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-[40px] bg-white/5 opacity-40">
            <ShieldAlert size={64} className="text-primary mb-4" />
            <p className="text-xl font-black uppercase tracking-[0.3em]">Sector Secure</p>
            <p className="text-xs font-mono mt-2">NO THREATS DETECTED IN CURRENT CYCLE</p>
          </div>
        ) : (
          threats.map((threat, idx) => (
            <motion.div 
              key={threat._id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <GlassCard className="p-0 overflow-hidden border-red-500/20 hover:border-red-500/50 group bg-red-950/5 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500/30"></div>
                <div className="relative aspect-square bg-black">
                  <img 
                    src={threat.image} 
                    alt="Threat Subject" 
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-700 grayscale group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                  
                  {/* Scanner overlay */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 right-1/4 h-0.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)] animate-scan"></div>
                    <div className="absolute top-2 left-2 flex gap-1">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-[8px] font-black text-red-500 uppercase tracking-tighter bg-red-500/10 px-1">Tracking</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleDelete(threat._id)}
                    className="absolute top-3 right-3 w-10 h-10 bg-black/80 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-red-500/30 flex items-center justify-center hover:bg-red-500 hover:text-white"
                  >
                    <Trash2 size={18} />
                  </button>
                  
                  <div className="absolute bottom-5 left-5 right-5">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Unknown Subject</span>
                    </div>
                    <p className="text-white font-mono text-sm font-bold">
                      {new Date(threat.createdAt).toLocaleTimeString('ru-RU')}
                    </p>
                    <p className="text-gray-500 font-mono text-[10px] uppercase">
                      {new Date(threat.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Security;

