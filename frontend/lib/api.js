import axios from 'axios';
import { env } from './env';

const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  withCredentials: true
});

// Attach token from localStorage if exists
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
