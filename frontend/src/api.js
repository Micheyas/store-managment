import axios from 'axios';

export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('storeToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('storeToken');
      localStorage.removeItem('storeUser');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
