import http from "./http";

export const employeeApi = {
  getAll(params) {
    return http.get("/employees", {
      params,
    });
  },

  getById(id) {
    return http.get(`/employees/${id}`);
  },

  create(payload) {
    return http.post("/employees", payload);
  },

  update(id, payload) {
    return http.put(`/employees/${id}`, payload);
  },

  delete(id) {
    return http.delete(`/employees/${id}`);
  },
};
