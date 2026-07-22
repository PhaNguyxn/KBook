import http from "./http";

export const borrowApi = {
  getAll(params) {
    return http.get("/borrows", {
      params,
    });
  },

  getById(id) {
    return http.get(`/borrows/${id}`);
  },

  create(payload) {
    return http.post("/borrows", payload);
  },

  returnBooks(id) {
    return http.put(`/borrows/${id}/return`);
  },
};
