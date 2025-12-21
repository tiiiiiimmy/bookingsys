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
};

export default adminService;
