import api from './api';

export const ordersApi = {
  // Public action: Place an order
  createOrder: async (orderData) => {
    const response = await api.post('/api/orders/', orderData);
    return response.data;
  },

  // Public action: Fetch the status of a specific order
  getOrderStatus: async (token) => {
    const response = await api.get(`/api/orders/status/?token=${token}`);
    return response.data;
  },

  // Owner action: Get all orders for the owner's restaurants
  getOwnerOrders: async () => {
    const response = await api.get('/api/orders/');
    return response.data;
  },

  // Owner action: Update status of a specific order
  updateOrderStatus: async (orderId, status) => {
    const response = await api.patch(`/api/orders/${orderId}/`, { status });
    return response.data;
  },

  // Public action: Cancel order (only allowed if pending)
  cancelOrder: async (token) => {
    const response = await api.post(`/api/orders/cancel/`, { token });
    return response.data;
  }
};

export default ordersApi;
