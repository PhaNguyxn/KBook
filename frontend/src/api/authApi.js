import http from "./http";

export const authApi = {
  login(payload) {
    return http.post("/auth/login", payload);
  },
};
