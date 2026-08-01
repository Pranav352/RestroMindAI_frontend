import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const tenantId = localStorage.getItem('active_tenant_id');
    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor to handle 401s and execute token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and request has not been retried yet
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Avoid infinite loop on auth endpoints (login, signup, logout, token refresh)
      if (
        originalRequest.url.includes('/api/auth/login/') ||
        originalRequest.url.includes('/api/auth/register/') ||
        originalRequest.url.includes('/api/auth/logout/') ||
        originalRequest.url.includes('/api/auth/token/refresh/')
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        handleAuthFailure();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/auth/token/refresh/`,
          { refresh: refreshToken }
        );
        const { access } = response.data;
        localStorage.setItem('access_token', access);
        
        // Update default header and original request header
        api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        originalRequest.headers.Authorization = `Bearer ${access}`;
        
        processQueue(null, access);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        handleAuthFailure();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

function handleAuthFailure() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_info');
  if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
    window.location.href = '/login?expired=true';
  }
}

export default api;
