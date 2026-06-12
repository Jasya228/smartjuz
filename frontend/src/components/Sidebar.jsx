import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Camera, ShieldCheck, Map, ShieldAlert, FileText, Settings } from 'lucide-react';
import { cn } from './GlassCard';

const Sidebar = () => {
  const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
  const role = adminInfo.role || 'admin';

  const navItems = [
    { icon: Home, label: 'Главная', path: '/' },
    ...(role === 'admin' || role === 'teacher' ? [{ icon: Users, label: 'База', path: '/students' }] : []),
    { icon: ShieldCheck, label: 'Скан', path: '/attendance' },
    { icon: Map, label: 'Карта', path: '/map' },
    { icon: FileText, label: 'Отчеты', path: '/reports' },
    ...(role === 'admin' ? [{ icon: ShieldAlert, label: 'SOS', path: '/security' }] : []),
    { icon: Settings, label: 'Настройки', path: '/settings' },
  ];

  return (
    <>
      {/* ДЕСТОПНОЕ МЕНЮ */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0a0a0a] border-r border-white/5 h-screen fixed left-0 top-0 z-50">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Camera className="text-black" size={24} />
            </div>
            <span className="text-xl font-black text-white uppercase tracking-tighter italic">Smart<span className="text-primary">Juz</span></span>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all group",
                  isActive 
                    ? "bg-primary text-black font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)]" 
                    : "text-gray-500 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon size={18} />
                <span className="text-[11px] font-bold uppercase tracking-widest">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        
        {/* Кнопка выхода внизу сайдбара */}
        <div className="mt-auto p-6">
          <button 
            onClick={() => {
              localStorage.removeItem('adminInfo');
              window.location.href = '/';
            }}
            className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all w-full text-red-500 hover:bg-red-500/10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            <span className="text-[11px] font-bold uppercase tracking-widest">Выход</span>
          </button>
        </div>
      </aside>

      {/* МОБИЛЬНОЕ МЕНЮ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-black border-t border-white/10 z-[100] flex items-center justify-around px-2">
        {navItems.slice(0, 5).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center gap-1 w-full h-full",
              isActive ? "text-primary" : "text-gray-500"
            )}
          >
            <item.icon size={20} />
            <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;
