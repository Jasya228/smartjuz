import React, { useState, useEffect } from 'react';
import GlassCard from '../components/GlassCard';
import { FileText, Download, BarChart2 } from 'lucide-react';
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

const Reports = () => {
  const [logs, setLogs] = useState([]);
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));
      const res = await fetch('/api/attendance', {
        headers: { Authorization: `Bearer ${adminInfo.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (dateFilter === 'all') return true;
    const logDate = new Date(log.createdAt || log.timestamp);
    const now = new Date();
    if (dateFilter === 'today') {
      return logDate.toDateString() === now.toDateString();
    }
    if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return logDate >= weekAgo;
    }
    if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      return logDate >= monthAgo;
    }
    return true;
  });

  // Group logs by Date
  const groupedData = filteredLogs.reduce((acc, log) => {
    const dateStr = new Date(log.createdAt || log.timestamp).toLocaleDateString('ru-RU');
    if (!acc[dateStr]) {
      acc[dateStr] = { present: 0, late: 0, total: 0 };
    }
    acc[dateStr].total += 1;
    if (log.status === 'Present') acc[dateStr].present += 1;
    if (log.status === 'Late') acc[dateStr].late += 1;
    return acc;
  }, {});

  // For Chart
  const labels = Object.keys(groupedData).reverse().slice(0, 7); // Last 7 days
  const presentData = labels.map(label => groupedData[label]?.present || 0);
  const lateData = labels.map(label => groupedData[label]?.late || 0);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Вовремя',
        data: presentData,
        backgroundColor: 'rgba(16, 185, 129, 0.7)', // Primary green
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
      },
      {
        label: 'Опоздавшие',
        data: lateData,
        backgroundColor: 'rgba(234, 179, 8, 0.7)', // Yellow
        borderColor: 'rgba(234, 179, 8, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#fff' }
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        ticks: { color: '#aaa', stepSize: 1 },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      x: {
        ticks: { color: '#aaa' },
        grid: { display: false }
      }
    }
  };

  const handleExportCSV = () => {
    let csv = 'ФИО,ID,Группа,Статус,Уверенность ИИ,Дата\n';
    filteredLogs.forEach(log => {
      const name = log.student?.fullName || 'Неизвестно';
      const id = log.student?.studentId || '-';
      const group = log.student?.group || '-';
      const status = log.status === 'Present' ? 'Вовремя' : 'Опоздал';
      const conf = log.confidenceScore ? `${(log.confidenceScore * 100).toFixed(1)}%` : '-';
      const date = new Date(log.createdAt || log.timestamp).toLocaleString('ru-RU');
      csv += `${name},${id},${group},${status},${conf},${date}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'attendance_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FileText className="text-primary" />
            Аналитика и Отчёты
          </h1>
          <p className="text-gray-400 mt-1">Графики посещаемости и экспорт данных.</p>
        </div>
        <div className="flex gap-4">
          <select 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary cursor-pointer hover:bg-white/10 transition-all"
          >
            <option value="all" className="bg-gray-900">За всё время</option>
            <option value="today" className="bg-gray-900">Сегодня</option>
            <option value="week" className="bg-gray-900">За неделю</option>
            <option value="month" className="bg-gray-900">За месяц</option>
          </select>
          <button 
            onClick={handleExportCSV}
            className="bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30 px-4 py-2 rounded-xl flex items-center gap-2 transition-all font-medium"
          >
            <Download size={18} />
            Экспорт CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="flex flex-col h-[400px]">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart2 className="text-primary" size={20} />
            Посещаемость за 7 дней
          </h3>
          <div className="flex-1 flex items-center justify-center relative w-full h-full">
            {labels.length === 0 ? (
              <p className="text-gray-500">Нет данных для графика</p>
            ) : (
              <Bar options={options} data={chartData} />
            )}
          </div>
        </GlassCard>

        <div className="space-y-6">
          <GlassCard>
            <h3 className="text-lg font-semibold text-white mb-4">Сводка за всё время</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <span className="text-gray-400">Всего фиксаций (логов)</span>
                <span className="text-xl font-bold text-white">{filteredLogs.length}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <span className="text-gray-400">Своевременных приходов</span>
                <span className="text-xl font-bold text-primary">
                  {filteredLogs.filter(l => l.status === 'Present').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Опозданий</span>
                <span className="text-xl font-bold text-yellow-500">
                  {filteredLogs.filter(l => l.status === 'Late').length}
                </span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="bg-gradient-to-r from-primary/10 to-transparent">
            <h3 className="text-lg font-semibold text-white mb-2">Генерация справок</h3>
            <p className="text-sm text-gray-400 mb-4">
              Система автоматически подготавливает ведомости для деканата. Нажмите "Экспорт CSV" чтобы получить Excel-таблицу.
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Reports;
