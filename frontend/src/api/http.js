import axios from "axios";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",

  timeout: 15000,
});

http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => Promise.reject(error),
);

http.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("employee");

      if (window.location.pathname !== "/login") {
        const redirect = window.location.pathname + window.location.search;

        window.location.href = `/login?redirect=${encodeURIComponent(
          redirect,
        )}`;
      }
    }

    return Promise.reject(error);
  },
);

export default http;
