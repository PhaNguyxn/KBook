<script setup>
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<template>
  <main class="error-page">
    <section class="error-card">
      <div class="error-code">404</div>

      <h1>Không tìm thấy trang</h1>

      <p>
        Địa chỉ bạn đang truy cập không tồn tại hoặc
        đã được thay đổi.
      </p>

      <button
        type="button"
        @click="router.push('/dashboard')"
      >
        Về trang tổng quan
      </button>
    </section>
  </main>
</template>

<style scoped>
.error-page {
  min-height: 100vh;
  padding: 24px;
  display: grid;
  place-items: center;
  background: #f3f4f6;
}

.error-card {
  width: min(500px, 100%);
  padding: 42px 28px;
  border-radius: 14px;
  background: white;
  text-align: center;
  box-shadow: 0 10px 35px rgb(0 0 0 / 8%);
}

.error-code {
  color: #2563eb;
  font-size: 72px;
  font-weight: 800;
}

.error-card h1 {
  margin: 8px 0 12px;
}

.error-card p {
  margin-bottom: 25px;
  color: #6b7280;
}

.error-card button {
  padding: 11px 18px;
  border: 0;
  border-radius: 7px;
  background: #2563eb;
  color: white;
  cursor: pointer;
}
</style>