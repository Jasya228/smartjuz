import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Camera, Settings, LogOut } from 'lucide-react';

const Layout = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Мобильная шапка */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-black/80 backdrop-blur-md border-b border-white/10 z-[60] flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Camera className="text-black" size={16} />
          </div>
          <span className="text-lg font-black text-white uppercase italic tracking-tighter">Smart<span className="text-primary">Juz</span></span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => window.location.href='/settings'} className="text-gray-400 hover:text-white transition-colors">
             <Settings size={20} />
          </button>
          <button 
            onClick={() => { 
              if (window.confirm('Выйти из аккаунта?')) {
                localStorage.removeItem('adminInfo'); 
                window.location.href='/'; 
              }
            }} 
            className="text-red-500 hover:text-red-400 transition-colors"
          >
             <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Sidebar - fixed on desktop, bottom on mobile */}
      <Sidebar />
      
      {/* Content wrapper */}
      <div className="md:ml-64 flex flex-col min-h-screen relative z-10">
        <main className="flex-1 p-4 pt-20 md:p-8 md:pt-8 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
