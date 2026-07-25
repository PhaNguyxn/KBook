import { computed, ref } from "vue";

import { defineStore } from "pinia";

import { readerAuthApi } from "@/api/readerAuthApi";

export const useReaderAuthStore = defineStore("readerAuth", () => {
  const reader = ref(getStoredReader());

  const token = ref(localStorage.getItem("readerToken") || "");

  const loading = ref(false);

  const isAuthenticated = computed(() => {
    return Boolean(token.value && reader.value);
  });

  function getStoredReader() {
    try {
      const stored = localStorage.getItem("reader");

      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  function saveSession(nextReader, nextToken) {
    reader.value = nextReader;

    token.value = nextToken;

    localStorage.setItem("reader", JSON.stringify(nextReader));

    localStorage.setItem("readerToken", nextToken);
  }

  function clearSession() {
    reader.value = null;
    token.value = "";

    localStorage.removeItem("reader");

    localStorage.removeItem("readerToken");
  }

  async function register(payload) {
    loading.value = true;

    try {
      const response = await readerAuthApi.register(payload);

      return response?.data?.data ?? response?.data;
    } finally {
      loading.value = false;
    }
  }

  async function login(payload) {
    loading.value = true;

    try {
      const response = await readerAuthApi.login(payload);

      const data = response?.data?.data ?? response?.data ?? {};

      const nextToken = data.token || data.accessToken;

      const nextReader = data.reader || data.user;

      if (!nextToken || !nextReader) {
        throw new Error("Dữ liệu đăng nhập không hợp lệ");
      }

      saveSession(nextReader, nextToken);

      return data;
    } finally {
      loading.value = false;
    }
  }

  async function loadProfile() {
    const response = await readerAuthApi.getProfile();

    const data = response?.data?.data ?? response?.data;

    reader.value = data;

    localStorage.setItem("reader", JSON.stringify(data));

    return data;
  }

  function logout() {
    clearSession();
  }

  return {
    reader,
    token,
    loading,
    isAuthenticated,
    register,
    login,
    logout,
    loadProfile,
  };
});
