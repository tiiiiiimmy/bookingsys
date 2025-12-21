import api from './api';

const availabilityService = {
  // Get available slots for a date and duration
  getAvailableSlots: async (date, duration) => {
    const response = await api.get(`/availability/slots?date=${date}&duration=${duration}`);
    return response.data;
  },

  // Get all business hours
  getBusinessHours: async () => {
    const response = await api.get('/availability/business-hours');
    return response.data;
  },

  // Update business hours (Admin)
  updateBusinessHours: async (dayOfWeek, hoursData) => {
    const response = await api.put(`/availability/admin/business-hours/${dayOfWeek}`, hoursData);
    return response.data;
  },

  // Get availability blocks (Admin)
  getAvailabilityBlocks: async (startDate, endDate) => {
    let url = '/availability/admin/blocks';
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  // Create availability block (Admin)
  createAvailabilityBlock: async (blockData) => {
    const response = await api.post('/availability/admin/blocks', blockData);
    return response.data;
  },

  // Delete availability block (Admin)
  deleteAvailabilityBlock: async (blockId) => {
    const response = await api.delete(`/availability/admin/blocks/${blockId}`);
    return response.data;
  },
};

export default availabilityService;
