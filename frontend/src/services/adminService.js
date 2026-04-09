import api from './api';

const adminService = {
  login: async (email, password) => {
    const response = await api.post('/admin/auth/login', { email, password });
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/admin/auth/me');
    return response.data;
  },
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },
  getBookings: async (params = {}) => {
    const response = await api.get('/admin/bookings', { params });
    return response.data;
  },
  getBookingById: async (bookingId) => {
    const response = await api.get(`/admin/bookings/${bookingId}`);
    return response.data;
  },
  updateBookingStatus: async (bookingId, payload) => {
    const response = await api.patch(`/admin/bookings/${bookingId}/status`, payload);
    return response.data;
  },
  rescheduleBooking: async (bookingId, payload) => {
    const response = await api.post(`/admin/bookings/${bookingId}/reschedule`, payload);
    return response.data;
  },
  approveRescheduleRequest: async (requestId, adminNote) => {
    const response = await api.post(`/admin/reschedule-requests/${requestId}/approve`, { adminNote });
    return response.data;
  },
  rejectRescheduleRequest: async (requestId, adminNote) => {
    const response = await api.post(`/admin/reschedule-requests/${requestId}/reject`, { adminNote });
    return response.data;
  },
  getCustomers: async (params = {}) => {
    const response = await api.get('/admin/customers', { params });
    return response.data;
  },
  getCustomerById: async (customerId) => {
    const response = await api.get(`/admin/customers/${customerId}`);
    return response.data;
  },
};

export default adminService;
