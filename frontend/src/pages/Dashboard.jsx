import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import { Users, Camera, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const StatCard = ({ title, value, icon: Icon, color, delay }) => (
  <GlassCard delay={delay} className="flex items-center gap-5 relative overflow-hidden group border-white/5 hover:border-white/20 transition-all duration-500">
    <div className={`absolute right-[-10%] top-[-10%] w-24 h-24 rounded-full blur-[40px] opacity-20 ${color}`}></div>
    <div className={`p-4 rounded-2xl glass border-none ${color.replace('bg-', 'text-').replace('/10', '')} bg-white/5 shadow-inner`}>
      <Icon size={32} className="drop-shadow-[0_0_8px_currentColor]" />
    </div>
    <div className="relative z-10">
      <p className="text-gray-400 text-xs font-mono uppercase tracking-widest">{title}</p>
      <h3 className="text-4xl font-bold text-white mt-1 tracking-tight">{value}</h3>
    </div>
  </GlassCard>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
  const role = adminInfo.role || 'admin';
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    unknownFaces: 0
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [allLogs, setAllLogs] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000); // Faster updates
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const adminInfoStr = localStorage.getItem('adminInfo');
      if (!adminInfoStr) return;
      const adminInfo = JSON.parse(adminInfoStr);
      const headers = { Authorization: `Bearer ${adminInfo?.token || ''}` };

      const [statsRes, logsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/dashboard/stats`, { headers }),
        fetch(`${API_BASE_URL}/attendance`, { headers })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setAllLogs(logsData);
        
        // Показываем последние 5 уникальных сканирований
        const uniqueLogs = [];
        const seenStudents = new Set();
        for (const log of logsData) {
          const studentId = log.student?._id || log.studentId;
          if (!seenStudents.has(studentId)) {
            seenStudents.add(studentId);
            uniqueLogs.push(log);
          }
        }
        setRecentLogs(uniqueLogs.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const getRelativeTime = (dateString) => {
    const diff = Math.floor((new Date() - new Date(dateString)) / 60000);
    if (diff < 1) return 'Только что';
    if (diff < 60) return `${diff} мин. назад`;
    return new Date(dateString).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  // Обработка данных для графика
  const groupedData = allLogs.reduce((acc, log) => {
    const dateStr = new Date(log.createdAt || log.timestamp).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });
    if (!acc[dateStr]) acc[dateStr] = { present: 0 };
    acc[dateStr].present += 1;
    return acc;
  }, {});

  const labels = Object.keys(groupedData).reverse().slice(0, 7);
  const presentData = labels.map(label => groupedData[label]?.present || 0);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Посещаемость',
        data: presentData,
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: '#10b981',
        borderWidth: 2,
        borderRadius: 8,
        hoverBackgroundColor: '#10b981',
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleFont: { size: 14, family: 'Outfit' },
        bodyFont: { size: 13, family: 'Outfit' },
        padding: 12,
        displayColors: false,
      }
    },
    scales: {
      y: { 
        beginAtZero: true,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#666', font: { family: 'JetBrains Mono', size: 10 } }
      },
      x: { 
        grid: { display: false },
        ticks: { color: '#888', font: { family: 'Outfit', size: 11 } }
      }
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            DASHBOARD <span className="text-primary text-neon">CORE</span>
          </h1>
          <p className="text-gray-400 font-medium flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            Мониторинг посещаемости в реальном времени
          </p>
        </div>
        <div className="flex gap-3">
          {role === 'admin' && (
            <button 
              onClick={() => window.open('/kiosk', '_blank')}
              className="bg-primary/10 text-primary border border-primary/20 px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-primary/20 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all font-bold uppercase tracking-widest text-xs"
            >
              <Camera size={20} />
              Terminal Mode
            </button>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Всего в базе" value={stats.totalStudents} icon={Users} color="bg-blue-500" delay={0.1} />
        <StatCard title="Сегодня в сети" value={stats.presentToday} icon={CheckCircle} color="bg-primary" delay={0.2} />
        <StatCard title="Угрозы безопасности" value={stats.unknownFaces} icon={AlertTriangle} color="bg-red-500" delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <GlassCard delay={0.4} className="lg:col-span-2 h-[450px] flex flex-col border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Аналитика активности</h3>
            <div className="flex gap-2">
              <div className="w-3 h-3 bg-primary/20 rounded-full"></div>
              <div className="w-3 h-3 bg-primary/40 rounded-full"></div>
              <div className="w-3 h-3 bg-primary rounded-full"></div>
            </div>
          </div>
          <div className="flex-1 w-full relative">
            {labels.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center border border-dashed border-white/10 rounded-3xl bg-white/5">
                <p className="text-gray-500 font-mono text-sm tracking-widest">ОЖИДАНИЕ ДАННЫХ СИСТЕМЫ...</p>
              </div>
            ) : (
              <Bar options={chartOptions} data={chartData} />
            )}
          </div>
        </GlassCard>

        <GlassCard delay={0.5} className="h-[450px] flex flex-col border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Прямой эфир</h3>
            <span className="bg-primary/10 text-primary text-[10px] px-2 py-1 rounded font-mono font-bold animate-pulse">STREAMING</span>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            {recentLogs.length === 0 ? (
              <div className="h-full flex items-center justify-center opacity-30 italic text-sm">Активности не зафиксировано</div>
            ) : (
              recentLogs.map((log) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={log._id} 
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group"
                >
                  <div className="w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center font-black text-xl bg-gradient-to-br from-primary/30 to-primary/10 text-primary border border-primary/20 shadow-lg">
                    {log.student ? log.student.fullName[0] : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-white truncate group-hover:text-primary transition-colors">
                      {log.student ? log.student.fullName : 'Неизвестный'}
                    </p>
                    <p className="text-xs font-mono text-gray-500 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                      {getRelativeTime(log.timestamp || log.createdAt)}
                    </p>
                  </div>
                  <div className="text-[10px] font-mono text-primary/60 font-bold bg-primary/5 px-2 py-1 rounded border border-primary/10">
                    {log.confidenceScore ? `${(log.confidenceScore * 100).toFixed(0)}%` : 'REF'}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default Dashboard;
