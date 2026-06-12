/** Shared backend API base URL (trailing slash). */
export const API_BASE_URL = `${(
  import.meta.env.VITE_API_BASE_URL || "https://api.learnifypakistan.com/api/"
).replace(/\/?$/, "/")}`;
