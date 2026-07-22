import http from "./http";

export const readerApi = {
  getAll(params) {
    return http.get("/readers", {
      params,
    });
  },

  getById(id) {
    return http.get(`/readers/${id}`);
  },

  create(payload) {
    return http.post("/readers", payload);
  },

  update(id, payload) {
    return http.put(`/readers/${id}`, payload);
  },

  delete(id) {
    return http.delete(`/readers/${id}`);
  },
};
