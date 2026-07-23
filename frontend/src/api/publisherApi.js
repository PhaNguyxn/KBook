import http from "./http";

export const publisherApi = {
  getAll(params = {}) {
    return http.get("/publishers", {
      params,
    });
  },

  getById(id) {
    return http.get(`/publishers/${id}`);
  },

  create(payload) {
    return http.post("/publishers", payload);
  },

  update(id, payload) {
    return http.put(`/publishers/${id}`, payload);
  },

  delete(id) {
    return http.delete(`/publishers/${id}`);
  },
};
