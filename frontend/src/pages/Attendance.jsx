import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import { ShieldCheck, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const Attendance = () => {
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const adminInfoStr = localStorage.getItem('adminInfo');
      if (!adminInfoStr) return;
      const adminInfo = JSON.parse(adminInfoStr);
      const res = await fetch('/api/attendance', {
        headers: { Authorization: `Bearer ${adminInfo?.token || ''}` }
      });
      if (res.ok) setLogs(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return {
      date: d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      time: d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  };

  const filteredLogs = logs.filter(log => {
    if (!log.student) return false;
    return log.student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           log.student.studentId.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-8 pb-10">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">
            ACCESS <span className="text-primary text-neon">JOURNAL</span>
          </h1>
          <p className="text-gray-400 font-medium flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]"></span>
            Логи идентификации в реальном времени
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Поиск по имени или ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-white focus:outline-none focus:border-primary/50 placeholder-gray-600 w-80 group-hover:bg-white/10 transition-all font-mono text-sm"
            />
          </div>
          <button className="bg-white/5 hover:bg-white/10 text-white p-3 rounded-2xl border border-white/10 transition-all group">
            <Calendar size={20} className="text-gray-400 group-hover:text-primary transition-colors" />
          </button>
        </div>
      </motion.div>

      <GlassCard className="p-0 border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                <th className="py-5 px-6">Время</th>
                <th className="py-5 px-6">Субъект</th>
                <th className="py-5 px-6">Верификация личности</th>
                <th className="py-5 px-6">Точность</th>
                <th className="py-5 px-6 text-right">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-20 text-gray-600 font-mono italic">
                    ЛОГИ ДОСТУПА НЕ ОБНАРУЖЕНЫ В ТЕКУЩЕМ БУФЕРЕ
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => {
                  const { date, time } = formatDate(log.timestamp);
                  return (
                    <motion.tr 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      key={log._id} 
                      className="hover:bg-primary/5 transition-colors group cursor-default"
                    >
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="text-white font-mono text-sm font-bold">{time}</span>
                          <span className="text-[10px] text-gray-500 font-mono uppercase">{date}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-white/50 border border-white/10 group-hover:border-primary/30 group-hover:text-primary transition-all">
                            {log.student ? log.student.fullName[0] : '?'}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-white font-bold text-sm tracking-tight">{log.student?.fullName || 'НЕИЗВЕСТНО'}</span>
                            <span className="text-[10px] text-primary/60 font-mono uppercase tracking-tighter">
                              {log.student?.studentId} • {log.student?.group || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                              style={{ width: `${(log.confidenceScore || 0) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-mono text-gray-500">
                            {log.confidenceScore ? (log.confidenceScore * 100).toFixed(1) : '0'}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={14} className="text-primary opacity-50" />
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Биометрия проверена</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                          Авторизован
                        </span>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default Attendance;

