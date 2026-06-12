import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Sidebar - fixed on desktop, bottom on mobile */}
      <Sidebar />
      
      {/* Content wrapper */}
      <div className="md:ml-64 flex flex-col min-h-screen relative z-10">
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
