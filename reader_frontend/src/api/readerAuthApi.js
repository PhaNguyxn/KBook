import api from "./axios";

export const readerAuthApi = {
  register(data) {
    return api.post("/reader-auth/register", data);
  },

  login(data) {
    return api.post("/reader-auth/login", data);
  },

  getProfile() {
    return api.get("/reader-auth/profile");
  },

  updateProfile(data) {
    return api.put("/reader-auth/profile", data);
  },

  changePassword(data) {
    return api.put("/reader-auth/change-password", data);
  },
};
