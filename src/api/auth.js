import api from './api';

export const authApi = {
  login: async (email, password) => {
    const response = await api.post('/api/auth/login/', { email, password });
    return response.data;
  },

  register: async (email, password, role) => {
    const response = await api.post('/api/auth/register/', { email, password, role });
    return response.data;
  },

  logout: async (refreshToken) => {
    const response = await api.post('/api/auth/logout/', { refresh: refreshToken });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/api/auth/me/');
    return response.data;
  }
};

export default authApi;
