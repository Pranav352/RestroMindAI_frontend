import api from './api';

export const qrApi = {
  generateQR: async (restaurantId, tableNumber) => {
    const response = await api.post('/api/qr/generate/', {
      restaurant_id: restaurantId,
      table_number: parseInt(tableNumber, 10) || 1,
    });
    return response.data;
  }
};

export default qrApi;
