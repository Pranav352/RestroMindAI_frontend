import api from './api';

export const adminApi = {
  getStats: async () => {
    const response = await api.get('/api/admin/stats/');
    return response.data;
  },

  getUsers: async (page = 1, search = '', status = '') => {
    const params = { page, search };
    if (status) {
      params.status = status;
    }
    const response = await api.get('/api/admin/users/', { params });
    return response.data;
  },

  updateUserStatus: async (id, isActive) => {
    const response = await api.patch(`/api/admin/users/${id}/`, { is_active: isActive });
    return response.data;
  },

  updateUserSubscription: async (userId, subscriptionData) => {
    const response = await api.patch(`/api/admin/users/${userId}/`, { subscription: subscriptionData });
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/api/admin/users/${id}/`);
    return response.data;
  },

  getRestaurants: async (page = 1, search = '') => {
    const response = await api.get('/api/admin/restaurants/', { params: { page, search } });
    return response.data;
  },

  deleteRestaurant: async (id) => {
    const response = await api.delete(`/api/admin/restaurants/${id}/`);
    return response.data;
  }
};

export default adminApi;
