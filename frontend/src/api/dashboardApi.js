import http from "./http";

export const dashboardApi = {
  getDashboard() {
    return http.get("/dashboard");
  },
};
