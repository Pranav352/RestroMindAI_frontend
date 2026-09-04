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
  },

  updateProfile: async (data) => {
    const response = await api.patch('/api/auth/me/', data);
    return response.data;
  },

  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    const response = await api.post('/api/auth/change-password/', {
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword
    });
    return response.data;
  },

  getSystemSettings: async () => {
    const response = await api.get('/api/auth/system-settings/');
    return response.data;
  },

  updateSystemSettings: async (data) => {
    const response = await api.patch('/api/auth/system-settings/', data);
    return response.data;
  },

  getSystemDiagnostics: async () => {
    const response = await api.get('/api/auth/system-diagnostics/');
    return response.data;
  }
};

export default authApi;
