import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import { Radio, Activity, Zap, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { API_BASE_URL } from '../config';

const Map = () => {
  const [activeEvents, setActiveEvents] = useState([]);
  const [stats, setStats] = useState({ active: 0 });
  const [scale, setScale] = useState(1);
  const containerRef = useRef(null);

  // --- НАСТРОЙКИ ТОЧЕК (МЕНЯЙ ЭТИ ЦИФРЫ ПОД СВОЁ ФОТО) ---
  const sensorLocations = {
    'MAIN BLOCK': { top: '70%', left: '45%' }, 
    'IT CENTER': { top: '39%', left: '35%' },  
    'DORMITORY': { top: '44%', left: '83%' }   
  };

  const mapImagePath = '/campus_map.png'; 

  useEffect(() => {
    let lastProcessedLogId = null;
    const fetchRealEvents = async () => {
      try {
        const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
        const res = await fetch(`${API_BASE_URL}/attendance`, {
          headers: { Authorization: `Bearer ${adminInfo.token || ''}` }
        });
        if (res.ok) {
          const logs = await res.json();
          if (logs.length > 0) {
            const latestLog = logs[0];
            if (latestLog._id !== lastProcessedLogId) {
              lastProcessedLogId = latestLog._id;
              triggerMapEvent(latestLog.location || 'MAIN BLOCK', latestLog.student?.fullName || 'Unknown');
            }
          }
        }
      } catch (e) { console.error("Map error:", e); }
    };
    const fetchStats = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/dashboard/stats`);
          if (res.ok) {
            const data = await res.json();
            setStats({ active: data.presentToday });
          }
        } catch (e) { /* ignore */ }
    };
    fetchRealEvents(); fetchStats();
    const interval = setInterval(() => { fetchRealEvents(); fetchStats(); }, 3000);
    return () => clearInterval(interval);
  }, []);

  const triggerMapEvent = (building, studentName = 'Unknown') => {
    const id = Math.random().toString(36).substr(2, 9);
    const newEvent = { id, building: building.toUpperCase(), studentName, timestamp: new Date().toLocaleTimeString() };
    setActiveEvents(prev => [newEvent, ...prev].slice(0, 5));
    setTimeout(() => setActiveEvents(prev => prev.filter(e => e.id !== id)), 5000);
  };

  const handleZoom = (type) => {
    if (type === 'in') setScale(prev => Math.min(prev + 0.2, 3));
    if (type === 'out') setScale(prev => Math.max(prev - 0.2, 0.5));
    if (type === 'reset') setScale(1);
  };

  const toggleFullscreen = () => {
    const elem = document.getElementById('map-viewport');
    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">
            CAMPUS <span className="text-primary text-neon">MAP</span>
          </h1>
          <p className="text-gray-400 font-medium flex items-center gap-2 mt-1 uppercase text-[10px] tracking-widest">
            <Radio size={14} className="text-primary animate-pulse" />
            Live Monitoring System
          </p>
        </div>
        <div className="flex gap-4">
          <div className="glass px-6 py-3 rounded-2xl border-white/5 flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Online</p>
              <p className="text-xl font-black text-primary">{stats.active}</p>
            </div>
            <Zap className="text-primary" />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Live Feed</h3>
          <AnimatePresence mode="popLayout">
            {activeEvents.map((event) => (
              <motion.div key={event.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(16,185,129,1)]"></div>
                <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-tighter">{event.studentName}</p>
                  <p className="text-[9px] font-mono text-primary uppercase">{event.building}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <GlassCard id="map-viewport" className="lg:col-span-3 p-0 border-white/5 relative bg-[#0a0a0a] overflow-hidden min-h-[600px]">
          {/* Zoom Controls */}
          <div className="absolute top-6 right-6 flex flex-col gap-2 z-40">
            <button onClick={() => handleZoom('in')} className="p-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl text-white hover:text-primary transition-colors shadow-2xl">
              <ZoomIn size={20} />
            </button>
            <button onClick={() => handleZoom('out')} className="p-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl text-white hover:text-primary transition-colors shadow-2xl">
              <ZoomOut size={20} />
            </button>
            <button onClick={() => handleZoom('reset')} className="p-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl text-white hover:text-primary transition-colors shadow-2xl">
              <Maximize size={20} />
            </button>
            <button onClick={toggleFullscreen} className="p-3 bg-primary/20 backdrop-blur-xl border border-primary/30 rounded-xl text-primary hover:bg-primary hover:text-black transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] mt-2">
              <Radio size={20} />
            </button>
          </div>

          {/* Map Viewport */}
          <div className="w-full h-full overflow-auto custom-scrollbar flex items-center justify-center p-4">
            <div 
              ref={containerRef}
              className="relative transition-transform duration-300 ease-out origin-center"
              style={{ transform: `scale(${scale})`, minWidth: '100%', height: 'auto' }}
            >
              <img 
                src={mapImagePath} 
                alt="Campus Map" 
                className="w-full h-auto rounded-xl block"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=1200&q=80';
                  e.target.className = "w-full h-auto rounded-xl opacity-10";
                }}
              />

              {/* SENSOR DOTS */}
              {Object.entries(sensorLocations).map(([name, pos]) => {
                const isActive = activeEvents.some(e => e.building === name);
                return (
                  <div 
                    key={name}
                    className="absolute z-20 flex flex-col items-center group"
                    style={{ top: pos.top, left: pos.left, transform: 'translate(-50%, -50%) scale(' + (1/scale) + ')' }}
                  >
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0.8 }}
                          animate={{ scale: 3, opacity: 0 }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="absolute w-4 h-4 rounded-full bg-primary z-0"
                        />
                      )}
                    </AnimatePresence>

                    <div className={`relative w-4 h-4 rounded-full border-2 transition-all duration-500 z-10 ${
                      isActive 
                      ? 'bg-primary border-white shadow-[0_0_15px_rgba(16,185,129,1)]' 
                      : 'bg-red-600 border-red-900 shadow-lg'
                    }`}>
                      <div className={`absolute inset-0 rounded-full bg-white/20 ${isActive ? 'animate-ping' : ''}`}></div>
                    </div>

                    <div className="mt-2 bg-black/80 backdrop-blur-md px-2 py-1 rounded border border-white/10 pointer-events-none">
                      <p className="text-[8px] font-black text-white uppercase tracking-widest whitespace-nowrap">{name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="absolute bottom-6 left-6 flex gap-4 bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/5 z-30 pointer-events-none">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-600 rounded-full"></div>
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Waiting</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,1)]"></div>
              <span className="text-[9px] font-black text-primary uppercase tracking-widest">Signal Detected</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default Map;
