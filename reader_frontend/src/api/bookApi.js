import api from "./axios";

export const bookApi = {
  getAll(params = {}) {
    return api.get("/books", {
      params,
    });
  },

  getById(id) {
    return api.get(`/books/${id}`);
  },

  getRelated(id, limit = 5) {
    return api.get(`/books/${id}/related`, {
      params: {
        limit,
      },
    });
  },
};
