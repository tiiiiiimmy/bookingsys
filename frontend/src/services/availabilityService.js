import api from './api';

const availabilityService = {
  getAvailableSlots: async (date, duration) => {
    const response = await api.get(`/availability/slots?date=${date}&duration=${duration}`);
    return response.data;
  },
  getWeeklySlots: async (dates, duration = 30) => {
    const responses = await Promise.all(
      dates.map(async (date) => {
        try {
          const response = await api.get(`/availability/slots?date=${date}&duration=${duration}`);
          return { date, ...(response.data.data || {}) };
        } catch (error) {
          return { date, slots: [], totalSlots: 0, error: error.response?.data?.error?.message || error.message };
        }
      })
    );

    return responses;
  },

  getBusinessHours: async () => {
    const response = await api.get('/availability/business-hours');
    return response.data;
  },

  updateBusinessHours: async (dayOfWeek, hoursData) => {
    const response = await api.put(`/availability/admin/business-hours/${dayOfWeek}`, hoursData);
    return response.data;
  },

  getAvailabilityBlocks: async (startDate, endDate) => {
    let url = '/availability/admin/blocks';
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  createAvailabilityBlock: async (blockData) => {
    const response = await api.post('/availability/admin/blocks', blockData);
    return response.data;
  },

  deleteAvailabilityBlock: async (blockId) => {
    const response = await api.delete(`/availability/admin/blocks/${blockId}`);
    return response.data;
  },
};

export default availabilityService;
