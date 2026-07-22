<script setup>
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
  employeeCode: "",
  password: "",
});

const errorMessage = ref("");

async function handleLogin() {
  errorMessage.value = "";

  if (!form.employeeCode || !form.password) {
    errorMessage.value = "Vui lòng nhập đầy đủ thông tin";
    return;
  }

  try {
    await authStore.login({
      employeeCode: form.employeeCode.trim(),
      password: form.password,
    });

    router.push({
      name: "dashboard",
    });
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ||
      "Đăng nhập không thành công";
  }
}
</script>

<template>
  <main class="login-page">
    <form class="login-form" @submit.prevent="handleLogin">
      <h1>Quản lý mượn sách</h1>
      <p>Đăng nhập bằng tài khoản nhân viên</p>

      <div class="form-group">
        <label for="employeeCode">Mã nhân viên</label>

        <input
          id="employeeCode"
          v-model="form.employeeCode"
          type="text"
          placeholder="Ví dụ: NV001"
        />
      </div>

      <div class="form-group">
        <label for="password">Mật khẩu</label>

        <input
          id="password"
          v-model="form.password"
          type="password"
          placeholder="Nhập mật khẩu"
        />
      </div>

      <p v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </p>

      <button type="submit" :disabled="authStore.loading">
        {{
          authStore.loading
            ? "Đang đăng nhập..."
            : "Đăng nhập"
        }}
      </button>
    </form>
  </main>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 20px;
  background: #f3f4f6;
}

.login-form {
  width: 100%;
  max-width: 420px;
  padding: 32px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 10px 30px rgb(0 0 0 / 8%);
}

.form-group {
  margin-bottom: 16px;
}

label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
}

input {
  width: 100%;
  padding: 11px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-sizing: border-box;
}

button {
  width: 100%;
  padding: 12px;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
  background: #2563eb;
  color: white;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.error-message {
  color: #dc2626;
}
</style>