import api from './api';

const productOrderService = {
  create: async (payload) => {
    const response = await api.post('/product-orders', payload);
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/product-orders/${id}`);
    return response.data;
  },
  getAll: async (status) => {
    const params = status ? { status } : {};
    const response = await api.get('/admin/product-orders', { params });
    return response.data;
  },
  fulfill: async (id) => {
    const response = await api.patch(`/admin/product-orders/${id}/fulfill`);
    return response.data;
  },
};

export default productOrderService;
