import api from './api';

const bookingService = {
  getServiceTypes: async () => {
    const response = await api.get('/bookings/service-types');
    return response.data;
  },
  createBooking: async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },
  getBookingById: async (bookingId) => {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data;
  },
  getManagedBooking: async (token) => {
    const response = await api.get(`/bookings/manage/${token}`);
    return response.data;
  },
  createRescheduleRequest: async (token, payload) => {
    const response = await api.post(`/bookings/manage/${token}/reschedule-request`, payload);
    return response.data;
  },
};

export default bookingService;
