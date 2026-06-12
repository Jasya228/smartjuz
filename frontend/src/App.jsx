import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import KioskScanner from './pages/KioskScanner';
import Login from './pages/Login';
import Students from './pages/Students';
import Attendance from './pages/Attendance';
import Map from './pages/Map';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Security from './pages/Security';

function App() {
  const adminInfo = localStorage.getItem('adminInfo');

  if (!adminInfo) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      </Router>
    );
  }

  let userRole = 'admin';
  try {
    const parsed = JSON.parse(adminInfo);
    userRole = parsed.role || 'admin';
  } catch (e) {}

  if (userRole === 'kiosk') {
    return (
      <Router>
        <Routes>
          <Route path="/kiosk" element={<KioskScanner />} />
          <Route path="*" element={<Navigate to="/kiosk" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/kiosk" element={<KioskScanner />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="map" element={<Map />} />
          <Route path="reports" element={<Reports />} />
          <Route path="security" element={<Security />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
