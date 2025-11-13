  // src/utils/axiosInstance.js

  import axios from 'axios';

  const axiosInstance = axios.create({
    baseURL: 'https://api.learnifypakistan.com/api/', // ✅ LIVE backend URL
    timeout: 20000,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true, // ✅ Send cookies (needed for CSRF/session auth)
    xsrfCookieName: 'csrftoken', // ✅ Django's CSRF cookie
    xsrfHeaderName: 'X-CSRFToken', // ✅ Django's CSRF header
  });

  // 🔹 CSRF warm-up: fetch cookie before any POST/PUT/DELETE requests
  axiosInstance.get('/csrf/', { withCredentials: true }).catch(err => {
    console.warn("CSRF warm-up failed", err);
  });

  // Attach access token from localStorage (JWT auth)
  axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Handle 401 responses globally
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