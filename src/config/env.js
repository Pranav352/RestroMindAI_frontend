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
  let fullUrl = path;
  if (!path.startsWith('http://') && !path.startsWith('https://')) {
    const apiBase = getApiBaseUrl();
    fullUrl = `${apiBase}${path.startsWith('/') ? path : `/${path}`}`;
  }
  // Convert http to https if current page is running over https to prevent mixed-content blocking
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && fullUrl.startsWith('http://')) {
    fullUrl = fullUrl.replace(/^http:/, 'https:');
  }
  return fullUrl;
};

export const getQrCodeImageUrl = (qrCodePath, targetUrl) => {
  const engineMode = typeof localStorage !== 'undefined' ? localStorage.getItem('admin_qr_engine_mode') : null;
  if (engineMode === 'external_api' && targetUrl) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(targetUrl)}&margin=10`;
  }
  if (qrCodePath) {
    return getMediaUrl(qrCodePath);
  }
  if (!targetUrl) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(targetUrl)}&margin=10`;
};

export const getFallbackQrCodeUrl = (targetUrl) => {
  if (!targetUrl) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(targetUrl)}&margin=10`;
};

