import api from "./axios";

export const borrowApi = {
  getMyHistory(params = {}) {
    return api.get("/borrows/my-history", {
      params,
    });
  },

  getMyHistoryById(id) {
    return api.get(`/borrows/my-history/${id}`);
  },
};
