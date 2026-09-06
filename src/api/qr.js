import api from './api';

export const qrApi = {
  getTables: async (params = {}) => {
    const response = await api.get('/api/tables/', { params });
    return response.data;
  },

  generateQR: async (restaurantId, tableNumber, section = 'Main Area', label = '') => {
    const response = await api.post('/api/qr/generate/', {
      restaurant_id: restaurantId,
      table_number: parseInt(tableNumber, 10) || 1,
      section: section || 'Main Area',
      label: label || '',
    });
    return response.data;
  },

  bulkGenerateQR: async (restaurantId, startTable, count, section = 'Main Area') => {
    const response = await api.post('/api/qr/bulk-generate/', {
      restaurant_id: restaurantId,
      start_table: parseInt(startTable, 10) || 1,
      count: parseInt(count, 10) || 5,
      section: section || 'Main Area',
    });
    return response.data;
  },

  deleteTable: async (tableId) => {
    const response = await api.delete(`/api/tables/${tableId}/`);
    return response.data;
  },

  bulkDeleteTables: async (tableIds) => {
    const promises = tableIds.map((tableId) => api.delete(`/api/tables/${tableId}/`));
    return await Promise.all(promises);
  }
};

export default qrApi;

