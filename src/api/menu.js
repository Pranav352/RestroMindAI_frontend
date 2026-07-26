import api from './api';

export const menuApi = {
  // Categories
  getCategories: async () => {
    const response = await api.get('/api/categories/');
    return response.data;
  },

  createCategory: async (restaurantId, name, parent = null) => {
    const response = await api.post('/api/categories/', {
      restaurant: restaurantId,
      name,
      parent,
    });
    return response.data;
  },

  updateCategory: async (id, name) => {
    const response = await api.patch(`/api/categories/${id}/`, {
      name,
    });
    return response.data;
  },

  deleteCategory: async (id) => {
    const response = await api.delete(`/api/categories/${id}/`);
    return response.data;
  },

  // Menu Items
  getMenuItems: async () => {
    const response = await api.get('/api/menu/');
    return response.data;
  },

  createMenuItem: async (formData) => {
    const response = await api.post('/api/menu/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateMenuItem: async (id, formData) => {
    const response = await api.patch(`/api/menu/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteMenuItem: async (id) => {
    const response = await api.delete(`/api/menu/${id}/`);
    return response.data;
  },

  // Public Menu fetch (allow anonymous access)
  getPublicMenu: async (restaurantId) => {
    const response = await api.get(`/api/menu/public/${restaurantId}/`);
    return response.data;
  }

};

export default menuApi;
