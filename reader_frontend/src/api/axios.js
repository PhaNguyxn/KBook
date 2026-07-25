import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",

  timeout: 15000,

  headers: {
    "Content-Type": "application/json",
  },
});

/* =========================================
   GẮN TOKEN ĐỘC GIẢ
========================================= */

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("readerToken");

    if (token) {
      config.headers = config.headers || {};

      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  },
);

/* =========================================
   XỬ LÝ RESPONSE
========================================= */

api.interceptors.response.use(
  (response) => response,

  (error) => {

    return Promise.reject(error);
  },
);

export default api;
