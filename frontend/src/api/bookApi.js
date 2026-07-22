import http from "./http";

export const bookApi = {
  getAll(params) {
    return http.get("/books", {
      params,
    });
  },

  getById(id) {
    return http.get(`/books/${id}`);
  },

  create(formData) {
    return http.post("/books", formData);
  },

  update(id, formData) {
    return http.put(`/books/${id}`, formData);
  },

  delete(id) {
    return http.delete(`/books/${id}`);
  },
};
