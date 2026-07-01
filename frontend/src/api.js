import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

api.interceptors.request.use((config) => {
  const userId = localStorage.getItem('userId');
  if (userId) config.headers['User-Id'] = userId;
  return config;
});