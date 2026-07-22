import { defineStore } from "pinia";
import { authApi } from "@/api/authApi";

function readStoredEmployee() {
  const storedEmployee = localStorage.getItem("employee");

  if (!storedEmployee) {
    return null;
  }

  try {
    return JSON.parse(storedEmployee);
  } catch {
    localStorage.removeItem("employee");
    return null;
  }
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("accessToken") || "",
    employee: readStoredEmployee(),
    loading: false,
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token),

    isAdmin: (state) => state.employee?.role === "admin",

    employeeName: (state) => {
      return state.employee?.fullName || "Nhân viên";
    },
  },

  actions: {
    async login(credentials) {
      this.loading = true;

      try {
        const response = await authApi.login(credentials);

        const { token, employee } = response.data;

        this.token = token;
        this.employee = employee;

        localStorage.setItem("accessToken", token);
        localStorage.setItem("employee", JSON.stringify(employee));

        return response.data;
      } finally {
        this.loading = false;
      }
    },

    logout() {
      this.token = "";
      this.employee = null;

      localStorage.removeItem("accessToken");
      localStorage.removeItem("employee");
    },
  },
});
