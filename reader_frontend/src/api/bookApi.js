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

  getFeatured(limit = 6) {
    return api.get("/books", {
      params: {
        featured: true,
        limit,
      },
    });
  },

  getNewest(limit = 6) {
    return api.get("/books", {
      params: {
        sort: "newest",
        limit,
      },
    });
  },

  getRelated(id, limit = 5) {
    return api.get(`/books/${id}/related`, {
      params: {
        limit,
      },
    });
  },
};
