import http from "./http";

export const borrowRequestApi = {
  getAll(params = {}) {
    return http.get("/borrow-requests", {
      params,
    });
  },

  getById(id) {
    return http.get(`/borrow-requests/${id}`);
  },

  create(payload) {
    return http.post("/borrow-requests", payload);
  },

  approve(id) {
    return http.patch(`/borrow-requests/${id}/approve`);
  },

  reject(id, reason) {
    return http.patch(`/borrow-requests/${id}/reject`, {
      reason,
    });
  },
};
