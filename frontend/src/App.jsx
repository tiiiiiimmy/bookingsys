import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';
import ManageBookingPage from './pages/ManageBookingPage';
import LoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import BookingsPage from './pages/admin/BookingsPage';
import AvailabilityPage from './pages/admin/AvailabilityPage';
import CustomersPage from './pages/admin/CustomersPage';
import AdminLayout from './components/layout/AdminLayout';
import useAdminLanguage from './hooks/useAdminLanguage';
import './App.css';

function App() {
  const { t } = useAdminLanguage();

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/booking/confirmation/:bookingId" element={<BookingConfirmationPage />} />
          <Route path="/booking/manage/:token" element={<ManageBookingPage />} />

          {/* Admin routes */}
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="availability" element={<AvailabilityPage />} />
            <Route path="customers" element={<CustomersPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<div>{t.fallback.notFound}</div>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
