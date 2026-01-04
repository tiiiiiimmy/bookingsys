import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';
import LoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import AvailabilityPage from './pages/admin/AvailabilityPage';
import AdminLayout from './components/layout/AdminLayout';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/booking/confirmation/:bookingId" element={<BookingConfirmationPage />} />

          {/* Admin routes */}
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="bookings" element={<div>预约管理页面(即将推出)</div>} />
            <Route path="availability" element={<AvailabilityPage />} />
            <Route path="customers" element={<div>客户管理页面(即将推出)</div>} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<div>页面未找到</div>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
