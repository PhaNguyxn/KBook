<script setup>
import {
  onMounted,
  reactive,
  ref,
} from "vue";

import {
  RouterLink,
  useRoute,
  useRouter,
} from "vue-router";

import {
  useReaderAuthStore,
} from "@/stores/readerAuth";

const route = useRoute();
const router = useRouter();

const authStore =
  useReaderAuthStore();

const showPassword = ref(false);
const errorMessage = ref("");

const form = reactive({
  email: "",
  password: "",
});

/* =========================================
   HÀM HỖ TRỢ
========================================= */

function normalizeEmail() {
  form.email = String(
    form.email || "",
  )
    .trim()
    .toLowerCase();
}

function validateForm() {
  const email =
    form.email
      .trim()
      .toLowerCase();

  if (!email) {
    return "Vui lòng nhập email";
  }

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    return "Email không hợp lệ";
  }

  if (!form.password) {
    return "Vui lòng nhập mật khẩu";
  }

  if (form.password.length < 6) {
    return "Mật khẩu phải có ít nhất 6 ký tự";
  }

  return "";
}

/* =========================================
   ĐĂNG NHẬP
========================================= */

async function handleLogin() {
  errorMessage.value = "";

  normalizeEmail();

  const validationMessage =
    validateForm();

  if (validationMessage) {
    errorMessage.value =
      validationMessage;

    return;
  }

  try {
    await authStore.login({
      email:
        form.email,

      password:
        form.password,
    });

    const redirect =
      typeof route.query.redirect ===
      "string"
        ? route.query.redirect
        : "/";

    await router.push(
      redirect,
    );
  } catch (error) {
    console.error(
      "Reader login error:",
      error,
    );

    errorMessage.value =
      error?.response?.data
        ?.message ||
      error?.message ||
      "Email hoặc mật khẩu không chính xác";
  }
}

/* =========================================
   TỰ ĐIỀN EMAIL SAU ĐĂNG KÝ
========================================= */

onMounted(() => {
  const email =
    route.query.email;

  if (
    typeof email === "string"
  ) {
    form.email =
      email
        .trim()
        .toLowerCase();
  }
});
</script>

<template>
  <main class="auth-page">
    <section class="auth-container">
      <!-- Khu vực giới thiệu -->
      <aside class="introduction-panel">
        <div class="brand">
          <div class="brand-icon">
            <i class="bi bi-book-half" />
          </div>

          <div>
            <strong>KBook</strong>

            <span>
              Thư viện trực tuyến
            </span>
          </div>
        </div>

        <div class="introduction-content">
          <span class="introduction-label">
            Dành cho độc giả
          </span>

          <h1>
            Khám phá thế giới sách
            cùng KBook
          </h1>

          <p>
            Tra cứu sách, gửi yêu cầu mượn,
            theo dõi hạn trả và quản lý lịch
            sử đọc sách thuận tiện.
          </p>

          <div class="feature-list">
            <div class="feature-item">
              <span class="feature-icon">
                <i class="bi bi-search" />
              </span>

              <div>
                <strong>
                  Tìm kiếm sách
                </strong>

                <small>
                  Tra cứu sách theo tên, tác giả
                  và thể loại.
                </small>
              </div>
            </div>

            <div class="feature-item">
              <span class="feature-icon">
                <i
                  class="bi bi-send-check"
                />
              </span>

              <div>
                <strong>
                  Mượn sách trực tuyến
                </strong>

                <small>
                  Gửi và theo dõi yêu cầu mượn
                  sách ngay trên hệ thống.
                </small>
              </div>
            </div>

            <div class="feature-item">
              <span class="feature-icon">
                <i
                  class="bi bi-clock-history"
                />
              </span>

              <div>
                <strong>
                  Theo dõi mượn trả
                </strong>

                <small>
                  Kiểm tra hạn trả và lịch sử
                  mượn sách dễ dàng.
                </small>
              </div>
            </div>
          </div>
        </div>

        <div class="introduction-footer">
          <i class="bi bi-shield-check" />

          Thông tin tài khoản được bảo vệ an toàn
        </div>
      </aside>

      <!-- Form đăng nhập -->
      <section class="form-panel">
        <div class="mobile-brand">
          <div class="mobile-brand-icon">
            <i class="bi bi-book-half" />
          </div>

          <div>
            <strong>KBook</strong>

            <span>
              Thư viện trực tuyến
            </span>
          </div>
        </div>

        <form
          class="auth-form"
          @submit.prevent="handleLogin"
        >
          <header class="form-header">
            <span class="form-label">
              Chào mừng trở lại
            </span>

            <h2>
              Đăng nhập độc giả
            </h2>

            <p>
              Sử dụng email đã đăng ký để truy
              cập tài khoản thư viện.
            </p>
          </header>

          <!-- Lỗi -->
          <div
            v-if="errorMessage"
            class="error-alert"
            role="alert"
          >
            <i
              class="bi bi-exclamation-circle-fill"
            />

            <span>
              {{ errorMessage }}
            </span>

            <button
              type="button"
              title="Đóng"
              @click="errorMessage = ''"
            >
              <i class="bi bi-x-lg" />
            </button>
          </div>

          <!-- Email -->
          <div class="form-group">
            <label for="email">
              Email
            </label>

            <div class="input-wrapper">
              <i class="bi bi-envelope" />

              <input
                id="email"
                v-model="form.email"
                type="email"
                maxlength="120"
                autocomplete="email"
                spellcheck="false"
                placeholder="example@gmail.com"
                @blur="normalizeEmail"
              />
            </div>

            <small>
              Nhập email đã sử dụng khi đăng ký
              tài khoản.
            </small>
          </div>

          <!-- Mật khẩu -->
          <div class="form-group">
            <div class="label-row">
              <label for="password">
                Mật khẩu
              </label>

              <span>
                Ít nhất 6 ký tự
              </span>
            </div>

            <div
              class="input-wrapper password-wrapper"
            >
              <i class="bi bi-lock" />

              <input
                id="password"
                v-model="form.password"
                :type="
                  showPassword
                    ? 'text'
                    : 'password'
                "
                autocomplete="current-password"
                placeholder="Nhập mật khẩu"
              />

              <button
                type="button"
                class="password-toggle"
                :title="
                  showPassword
                    ? 'Ẩn mật khẩu'
                    : 'Hiện mật khẩu'
                "
                @click="
                  showPassword =
                    !showPassword
                "
              >
                <i
                  :class="
                    showPassword
                      ? 'bi bi-eye-slash'
                      : 'bi bi-eye'
                  "
                />
              </button>
            </div>
          </div>

          <!-- Nút đăng nhập -->
          <button
            type="submit"
            class="submit-button"
            :disabled="
              authStore.loading
            "
          >
            <span
              v-if="authStore.loading"
              class="loading-spinner"
            />

            <i
              v-else
              class="bi bi-box-arrow-in-right"
            />

            {{
              authStore.loading
                ? "Đang đăng nhập..."
                : "Đăng nhập"
            }}
          </button>

          <p class="switch-page">
            Chưa có tài khoản?

            <RouterLink
              :to="{
                name:
                  'reader-register',
              }"
            >
              Đăng ký ngay
            </RouterLink>
          </p>

          <div class="security-note">
            <i class="bi bi-lock-fill" />

            <span>
              Email và mật khẩu chỉ được sử dụng
              để xác thực tài khoản độc giả.
            </span>
          </div>
        </form>

        <footer class="form-footer">
          © 2026 KBook — Thư viện trực tuyến
        </footer>
      </section>
    </section>
  </main>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  padding: 25px;
  display: grid;
  place-items: center;
  background:
    radial-gradient(
      circle at 10% 10%,
      rgb(59 130 246 / 14%),
      transparent 30%
    ),
    radial-gradient(
      circle at 90% 90%,
      rgb(99 102 241 / 10%),
      transparent 28%
    ),
    linear-gradient(
      135deg,
      #eff6ff,
      #f8fafc
    );
}

.auth-container {
  width: 100%;
  max-width: 1050px;
  min-height: 640px;
  overflow: hidden;
  display: grid;
  grid-template-columns:
    minmax(0, 1.05fr)
    minmax(390px, 0.95fr);
  border: 1px solid
    rgb(255 255 255 / 80%);
  border-radius: 28px;
  background: #fff;
  box-shadow:
    0 30px 80px
    rgb(15 23 42 / 15%);
}

/* =========================================
   PHẦN GIỚI THIỆU
========================================= */

.introduction-panel {
  position: relative;
  overflow: hidden;
  padding: 42px;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(
      circle at 90% 10%,
      rgb(255 255 255 / 14%),
      transparent 25%
    ),
    linear-gradient(
      145deg,
      #2563eb,
      #1e3a8a
    );
  color: #fff;
}

.introduction-panel::before,
.introduction-panel::after {
  position: absolute;
  border-radius: 50%;
  background:
    rgb(255 255 255 / 7%);
  content: "";
}

.introduction-panel::before {
  width: 240px;
  height: 240px;
  top: -100px;
  right: -90px;
}

.introduction-panel::after {
  width: 170px;
  height: 170px;
  bottom: -80px;
  left: -60px;
}

.brand,
.mobile-brand {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-icon,
.mobile-brand-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 15px;
  font-size: 21px;
}

.brand-icon {
  background:
    rgb(255 255 255 / 17%);
}

.mobile-brand-icon {
  background: #2563eb;
  color: #fff;
}

.brand strong,
.brand span,
.mobile-brand strong,
.mobile-brand span {
  display: block;
}

.brand strong,
.mobile-brand strong {
  font-size: 20px;
  font-weight: 900;
}

.brand span,
.mobile-brand span {
  margin-top: 2px;
  font-size: 9px;
  letter-spacing: 0.7px;
  opacity: 0.75;
  text-transform: uppercase;
}

.introduction-content {
  position: relative;
  z-index: 1;
  margin: auto 0;
}

.introduction-label {
  padding: 6px 10px;
  display: inline-flex;
  border-radius: 999px;
  background:
    rgb(255 255 255 / 12%);
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.8px;
  text-transform: uppercase;
}

.introduction-content h1 {
  max-width: 490px;
  margin: 19px 0 14px;
  font-size: 40px;
  font-weight: 900;
  line-height: 1.2;
}

.introduction-content > p {
  max-width: 460px;
  margin: 0;
  color:
    rgb(255 255 255 / 74%);
  font-size: 13px;
  line-height: 1.8;
}

.feature-list {
  margin-top: 27px;
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.feature-item {
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 11px;
  border: 1px solid
    rgb(255 255 255 / 11%);
  border-radius: 13px;
  background:
    rgb(255 255 255 / 8%);
}

.feature-icon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 10px;
  background:
    rgb(255 255 255 / 13%);
}

.feature-item strong,
.feature-item small {
  display: block;
}

.feature-item strong {
  font-size: 11px;
}

.feature-item small {
  margin-top: 3px;
  color:
    rgb(255 255 255 / 67%);
  font-size: 9px;
}

.introduction-footer {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 7px;
  color:
    rgb(255 255 255 / 60%);
  font-size: 9px;
}

/* =========================================
   FORM
========================================= */

.form-panel {
  padding: 45px 50px 28px;
  display: flex;
  justify-content: center;
  flex-direction: column;
}

.mobile-brand {
  display: none;
  color: #1e3a8a;
}

.auth-form {
  width: 100%;
  max-width: 385px;
  margin: auto;
}

.form-header {
  margin-bottom: 27px;
}

.form-label {
  color: #3b82f6;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.9px;
  text-transform: uppercase;
}

.form-header h2 {
  margin: 8px 0 7px;
  color: #1e3a8a;
  font-size: 29px;
  font-weight: 900;
}

.form-header p {
  margin: 0;
  color: #94a3b8;
  font-size: 11px;
  line-height: 1.7;
}

.error-alert {
  min-height: 47px;
  margin-bottom: 18px;
  padding: 11px 12px;
  display: flex;
  align-items: center;
  gap: 9px;
  border: 1px solid #fecaca;
  border-radius: 11px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 10px;
  font-weight: 700;
}

.error-alert span {
  min-width: 0;
  flex: 1;
}

.error-alert button {
  width: 27px;
  height: 27px;
  padding: 0;
  display: grid;
  place-items: center;
  border: 0;
  background: transparent;
  color: inherit;
}

.form-group {
  margin-bottom: 18px;
}

.form-group > label,
.label-row label {
  margin-bottom: 7px;
  display: block;
  color: #475569;
  font-size: 10px;
  font-weight: 800;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label-row > span {
  margin-bottom: 7px;
  color: #94a3b8;
  font-size: 8px;
}

.input-wrapper {
  position: relative;
}

.input-wrapper > i {
  position: absolute;
  top: 50%;
  left: 14px;
  color: #94a3b8;
  transform: translateY(-50%);
}

.input-wrapper input {
  width: 100%;
  height: 49px;
  padding: 0 43px;
  border: 1px solid #dce5f0;
  border-radius: 12px;
  background: #fff;
  color: #334155;
  font-size: 12px;
  outline: none;
}

.input-wrapper input:focus {
  border-color: #60a5fa;
  box-shadow:
    0 0 0 4px
    rgb(59 130 246 / 11%);
}

.input-wrapper:focus-within > i {
  color: #2563eb;
}

.form-group > small {
  margin-top: 6px;
  display: block;
  color: #94a3b8;
  font-size: 8px;
}

.password-wrapper input {
  padding-right: 47px;
}

.password-toggle {
  width: 36px;
  height: 36px;
  padding: 0;
  position: absolute;
  top: 50%;
  right: 7px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #64748b;
  transform: translateY(-50%);
}

.password-toggle:hover {
  background: #f1f5f9;
  color: #2563eb;
}

.submit-button {
  width: 100%;
  min-height: 49px;
  padding: 0 18px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 9px;
  border: 0;
  border-radius: 12px;
  background: linear-gradient(
    135deg,
    #438df8,
    #2563eb
  );
  color: #fff;
  font-size: 11px;
  font-weight: 900;
  box-shadow:
    0 10px 22px
    rgb(37 99 235 / 23%);
}

.submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.loading-spinner {
  width: 17px;
  height: 17px;
  border: 2px solid
    rgb(255 255 255 / 40%);
  border-top-color: #fff;
  border-radius: 50%;
  animation:
    spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.switch-page {
  margin-top: 20px;
  color: #64748b;
  font-size: 11px;
  text-align: center;
}

.switch-page a {
  color: #2563eb;
  font-weight: 900;
}

.security-note {
  margin-top: 17px;
  padding: 11px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 7px;
  border-radius: 10px;
  background: #f8fafc;
  color: #94a3b8;
  font-size: 8px;
  text-align: center;
}

.form-footer {
  margin-top: 29px;
  color: #94a3b8;
  font-size: 8px;
  text-align: center;
}

@media (max-width: 900px) {
  .auth-container {
    max-width: 500px;
    min-height: auto;
    grid-template-columns: 1fr;
  }

  .introduction-panel {
    display: none;
  }

  .form-panel {
    min-height: 620px;
    padding: 35px 45px 25px;
  }

  .mobile-brand {
    margin-bottom: 42px;
    display: flex;
  }
}

@media (max-width: 520px) {
  .auth-page {
    padding: 0;
  }

  .auth-container {
    min-height: 100vh;
    border-radius: 0;
  }

  .form-panel {
    min-height: 100vh;
    padding: 26px 23px;
  }

  .form-header h2 {
    font-size: 24px;
  }
}
</style>