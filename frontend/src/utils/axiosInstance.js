// src/utils/axiosInstance.js

import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api/', // ‚úÖ Ensures all API requests go to Django backend
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ‚úÖ Attach access token from localStorage (already present in your code)
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ‚úÖ Optionally handle 401 responses (for future enhancements like token refresh)
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized. Redirecting to login...");
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
