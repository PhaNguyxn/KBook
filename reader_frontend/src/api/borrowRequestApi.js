import api from "./axios";

export const borrowRequestApi = {
  create(payload) {
    return api.post("/borrow-requests/reader", payload);
  },

  getMyRequests(params = {}) {
    return api.get("/borrow-requests/reader/my-requests", {
      params,
    });
  },

  getMyRequestById(id) {
    return api.get(`/borrow-requests/reader/my-requests/${id}`);
  },

  cancelMyRequest(id) {
    return api.patch(`/borrow-requests/reader/my-requests/${id}/cancel`);
  },
};
