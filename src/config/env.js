export const getFrontendBaseUrl = () => {
  const url = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
  return url.replace(/\/+$/, '');
};

export const getApiBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  return url.replace(/\/+$/, '');
};

export const getCustomerMenuUrl = (restaurantId, tableNumber) => {
  const baseUrl = getFrontendBaseUrl();
  if (!restaurantId) return '';
  if (tableNumber) {
    return `${baseUrl}/menu/${restaurantId}?table=${tableNumber}`;
  }
  return `${baseUrl}/menu/${restaurantId}`;
};

export const getMediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const apiBase = getApiBaseUrl();
  return `${apiBase}${path.startsWith('/') ? path : `/${path}`}`;
};

export const getQrCodeImageUrl = (targetUrl) => {
  if (!targetUrl) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(targetUrl)}&margin=10`;
};
