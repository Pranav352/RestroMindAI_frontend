import api from './api';

export const restaurantApi = {
  getProfile: async () => {
    const response = await api.get('/api/restaurants/');
    return response.data;
  },

  createProfile: async (data) => {
    const response = await api.post('/api/restaurants/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateProfile: async (id, data) => {
    const response = await api.patch(`/api/restaurants/${id}/`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

export default restaurantApi;
