import api from './api';

const bookingService = {
  // Get all service types
  getServiceTypes: async () => {
    const response = await api.get('/bookings/service-types');
    return response.data;
  },

  // Create a new booking
  createBooking: async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },

  // Get booking by ID
  getBookingById: async (bookingId) => {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data;
  },
};

export default bookingService;
