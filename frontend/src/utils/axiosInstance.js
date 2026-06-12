// src/utils/axiosInstance.js

import axios from "axios";
import { API_BASE_URL } from "./apiConfig";

const BASE_URL = API_BASE_URL;

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // ✅ Send cookies (needed for CSRF/session auth)
  xsrfCookieName: "csrftoken", // ✅ Django's CSRF cookie
  xsrfHeaderName: "X-CSRFToken", // ✅ Django's CSRF header
});

const PUBLIC_API_PATHS = [
  "school/signup/",
  "register/",
  "csrf/",
  "token/",
  "token/refresh/",
];

const PUBLIC_FRONTEND_PATHS = ["/school-signup", "/signup", "/school-onboarding"];

function isPublicApiPath(url) {
  const normalized = String(url || "").replace(/^\//, "");
  return PUBLIC_API_PATHS.some(
    (path) => normalized === path || normalized.startsWith(path)
  );
}

function isPublicFrontendPath() {
  try {
    return PUBLIC_FRONTEND_PATHS.includes(window.location.pathname);
  } catch {
    return false;
  }
}

// ✅ Helper: safe redirect (prevents infinite loop on /login)
const redirectToLogin = () => {
  try {
    if (isPublicFrontendPath()) return;

    const currentPath =
      window.location.pathname + window.location.search + window.location.hash;

    // If already on login, DON'T keep redirecting
    if (window.location.pathname === "/login") return;

    // Preserve where the user was, so after login you can send them back
    const next = encodeURIComponent(currentPath);
    window.location.href = `/login?next=${next}`;
  } catch (e) {
    window.location.href = "/login";
  }
};

// 🔹 CSRF warm-up: fetch cookie before any POST/PUT/DELETE requests
// ✅ IMPORTANT: do NOT start with "/" otherwise it bypasses /api/
axiosInstance.get("csrf/", { withCredentials: true }).catch((err) => {
  console.warn("CSRF warm-up failed", err);
});

/**
 * ✅ IMPORTANT FIX (without changing your other files):
 * If a request is made like axiosInstance.post('/token/', ...) then Axios treats it as
 * an absolute path and DROPS the '/api/' part of baseURL.
 *
 * So we normalize any leading slash here.
 */
axiosInstance.interceptors.request.use((config) => {
  if (typeof config.url === "string" && config.url.startsWith("/")) {
    config.url = config.url.slice(1);
  }

  // Public signup/register must not send stale JWTs (server returns 401 before AllowAny).
  if (isPublicApiPath(config.url)) {
    if (config.headers) {
      delete config.headers.Authorization;
    }
    return config;
  }

  // Attach access token from localStorage (JWT auth)
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ===== Refresh-token handling (standard practice) =====
let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, newAccessToken = null) => {
  refreshQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(newAccessToken);
  });
  refreshQueue = [];
};

// Use a plain axios client to avoid interceptor loops during refresh
const refreshClient = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config;

    // If no response (network error / timeout), just reject
    if (!error.response) {
      return Promise.reject(error);
    }

    const url = String(originalRequest?.url || "");
    const isAuthEndpoint =
      url.includes("token/") || url.includes("token/refresh/") || url.includes("csrf/");

    if (status === 401 && isPublicApiPath(url)) {
      return Promise.reject(error);
    }

    // Only handle 401 once per request
    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");

      // If no refresh token → logout behavior (same as before, but safer)
      if (!refreshToken) {
        console.warn("Unauthorized (no refresh token). Redirecting to login...");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user_role");
        localStorage.removeItem("role");              // ✅ ADD THIS LINE
        localStorage.removeItem("user_full_name");
        localStorage.removeItem("account_status");
        redirectToLogin();
        return Promise.reject(error);
      }

      // If refresh already running, wait for it
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: (newToken) => {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(axiosInstance(originalRequest));
            },
            reject,
          });
        });
      }

      isRefreshing = true;

      try {
        console.warn("401 received. Attempting token refresh...");

        // ✅ IMPORTANT: don't start with "/" here
        const refreshRes = await refreshClient.post("token/refresh/", {
          refresh: refreshToken,
        });

        const newAccess = refreshRes.data?.access;

        if (!newAccess) {
          throw new Error("Refresh succeeded but access token missing.");
        }

        localStorage.setItem("access_token", newAccess);

        processQueue(null, newAccess);

        // retry original request with new token
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;

        return axiosInstance(originalRequest);
      } catch (refreshErr) {
        console.warn("Token refresh failed. Redirecting to login...");

        processQueue(refreshErr, null);

        // Clear local auth state (keeps behavior consistent)
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user_role");
        localStorage.removeItem("role");              // ✅ ADD THIS LINE
        localStorage.removeItem("user_full_name");
        localStorage.removeItem("account_status");

        redirectToLogin();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // For other errors, behave normally
    return Promise.reject(error);
  }
);

export default axiosInstance;