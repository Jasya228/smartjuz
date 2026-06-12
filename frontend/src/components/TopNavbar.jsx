import React from 'react';
import { Bell, Search, Menu } from 'lucide-react';

const TopNavbar = () => {
  return (
    <header className="h-20 bg-transparent backdrop-blur-md border-b border-white/5 sticky top-0 z-40 w-full flex items-center justify-between px-8">
      <div className="flex items-center gap-6">
        <button className="md:hidden text-gray-400 hover:text-white transition-all p-2 rounded-xl bg-white/5 border border-white/10">
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden md:flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl px-5 py-2.5 focus-within:border-primary/30 focus-within:bg-white/10 transition-all group">
          <Search className="w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Global Search (Students, IDs, Logs)..." 
            className="bg-transparent border-none outline-none text-[13px] text-white placeholder-gray-600 w-72 font-mono"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative">
          <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 hover:border-primary/20 relative group">
            <Bell className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(16,185,129,1)]"></span>
          </button>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-sm font-black text-white uppercase tracking-tighter italic">
            {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
          <div className="text-[10px] text-primary flex items-center gap-1.5 justify-end font-mono font-bold uppercase tracking-widest mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_5px_rgba(16,185,129,1)]"></span>
            Node: Active
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
