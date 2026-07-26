import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",

  timeout: 15000,

  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const readerToken = localStorage.getItem("readerToken");

    if (readerToken) {
      config.headers.Authorization = `Bearer ${readerToken}`;
    } else {
      delete config.headers.Authorization;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error?.response?.status;

    const code = error?.response?.data?.code;

    const invalidReaderCodes = [
      "READER_NOT_FOUND",
      "READER_TOKEN_INVALID",
      "READER_TOKEN_EXPIRED",
      "READER_ID_INVALID",
      "INVALID_ACCOUNT_TYPE",
    ];

    if (status === 401 && invalidReaderCodes.includes(code)) {
      localStorage.removeItem("readerToken");

      localStorage.removeItem("reader");

      const currentPath = window.location.pathname + window.location.search;

      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = `/login?redirect=${encodeURIComponent(
          currentPath,
        )}`;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
