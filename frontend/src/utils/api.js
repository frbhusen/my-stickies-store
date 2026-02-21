import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Log errors and handle 401 centrally to help diagnose admin edit failures
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Helpful debug info for failed admin edits
    // eslint-disable-next-line no-console
    console.error('API Error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data
    });

    // If auth failed, clear admin token so UI can react
    if (error.response?.status === 401) {
      try {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin');
      } catch (_) {}
    }

    return Promise.reject(error);
  }
);

export default api;
