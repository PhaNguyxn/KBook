import api from "./axios";

export const borrowRequestApi = {
  create(data) {
    return api.post("/borrow-requests", data);
  },

  getMyRequests(params = {}) {
    return api.get("/borrow-requests/my-requests", {
      params,
    });
  },

  getById(id) {
    return api.get(`/borrow-requests/${id}`);
  },

  cancel(id) {
    return api.patch(`/borrow-requests/${id}/cancel`);
  },
};
