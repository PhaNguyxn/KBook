<script setup>
import {
  reactive,
  ref,
} from "vue";

import {
  RouterLink,
  useRouter,
} from "vue-router";

import {
  useReaderAuthStore,
} from "@/stores/readerAuth";

const router = useRouter();

const authStore =
  useReaderAuthStore();

const errorMessage = ref("");
const successMessage = ref("");

const showPassword = ref(false);
const showConfirmPassword =
  ref(false);

const form = reactive({
  lastName: "",
  firstName: "",
  email: "",
  phone: "",
  birthday: "",
  gender: "Nam",
  address: "",
  password: "",
  confirmPassword: "",
});

function normalizePhone(value) {
  return String(value || "")
    .replace(/\s+/g, "")
    .trim();
}

function validateForm() {
  if (!form.lastName.trim()) {
    return "Vui lòng nhập họ";
  }

  if (!form.firstName.trim()) {
    return "Vui lòng nhập tên";
  }

  if (!form.email.trim()) {
    return "Vui lòng nhập email";
  }

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (
    !emailPattern.test(
      form.email.trim(),
    )
  ) {
    return "Email không hợp lệ";
  }

  const phone =
    normalizePhone(
      form.phone,
    );

  if (
    !/^[0-9]{9,11}$/.test(
      phone,
    )
  ) {
    return "Số điện thoại phải gồm từ 9 đến 11 chữ số";
  }

  if (
    !["Nam", "Nữ", "Khác"].includes(
      form.gender,
    )
  ) {
    return "Giới tính không hợp lệ";
  }

  if (!form.password) {
    return "Vui lòng nhập mật khẩu";
  }

  if (
    form.password.length < 6
  ) {
    return "Mật khẩu phải có ít nhất 6 ký tự";
  }

  if (
    form.password !==
    form.confirmPassword
  ) {
    return "Mật khẩu xác nhận không khớp";
  }

  if (form.birthday) {
    const birthday =
      new Date(
        `${form.birthday}T00:00:00`,
      );

    if (
      Number.isNaN(
        birthday.getTime(),
      ) ||
      birthday >= new Date()
    ) {
      return "Ngày sinh không hợp lệ";
    }
  }

  return "";
}

async function handleRegister() {
  errorMessage.value = "";
  successMessage.value = "";

  const validationMessage =
    validateForm();

  if (validationMessage) {
    errorMessage.value =
      validationMessage;

    return;
  }

  const payload = {
    lastName:
      form.lastName.trim(),

    firstName:
      form.firstName.trim(),

    email:
      form.email
        .trim()
        .toLowerCase(),

    phone:
      normalizePhone(
        form.phone,
      ),

    birthday:
      form.birthday || null,

    gender:
      form.gender,

    address:
      form.address.trim(),

    password:
      form.password,
  };

  try {
    const result =
      await authStore.register(
        payload,
      );

    const email =
  result?.email ||
  result?.reader?.email ||
  form.email
    .trim()
    .toLowerCase();

    successMessage.value =
  "Đăng ký tài khoản thành công. Bạn có thể đăng nhập bằng email.";

    setTimeout(() => {
      router.push({
        name: "reader-login",

        query: {
          email,
        },
      });
    }, 1600);
  } catch (error) {
    errorMessage.value =
      error?.response?.data
        ?.message ||
      error?.message ||
      "Không thể đăng ký tài khoản";
  }
}
</script>

<template>
  <main class="register-page">
    <section class="register-container">
      <header class="register-header">
        <div class="brand-icon">
          <i class="bi bi-book-half" />
        </div>

        <div>
          <span>KBook Reader</span>

          <h1>
            Đăng ký tài khoản độc giả
          </h1>

          <p>
            Điền thông tin cá nhân để tạo tài
            khoản và sử dụng dịch vụ thư viện.
          </p>
        </div>
      </header>

      <form
        class="register-form"
        @submit.prevent="handleRegister"
      >
        <div
          v-if="errorMessage"
          class="alert alert-error"
        >
          <i
            class="bi bi-exclamation-circle-fill"
          />

          {{ errorMessage }}
        </div>

        <div
          v-if="successMessage"
          class="alert alert-success"
        >
          <i
            class="bi bi-check-circle-fill"
          />

          {{ successMessage }}
        </div>

        <section class="form-section">
          <div class="section-heading">
            <i
              class="bi bi-person-vcard"
            />

            <div>
              <h2>
                Thông tin cá nhân
              </h2>

              <p>
                Thông tin dùng để tạo hồ sơ
                độc giả.
              </p>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label for="lastName">
                Họ
                <span>*</span>
              </label>

              <input
                id="lastName"
                v-model="form.lastName"
                type="text"
                maxlength="50"
                placeholder="Ví dụ: Nguyễn Văn"
              />
            </div>

            <div class="form-group">
              <label for="firstName">
                Tên
                <span>*</span>
              </label>

              <input
                id="firstName"
                v-model="form.firstName"
                type="text"
                maxlength="30"
                placeholder="Ví dụ: An"
              />
            </div>

            <div class="form-group">
              <label for="email">
                Email
                <span>*</span>
              </label>

              <input
                id="email"
                v-model="form.email"
                type="email"
                autocomplete="email"
                placeholder="example@gmail.com"
              />
            </div>

            <div class="form-group">
              <label for="phone">
                Số điện thoại
                <span>*</span>
              </label>

              <input
                id="phone"
                v-model="form.phone"
                type="tel"
                maxlength="11"
                inputmode="numeric"
                placeholder="Nhập số điện thoại"
              />
            </div>

            <div class="form-group">
              <label for="birthday">
                Ngày sinh
              </label>

              <input
                id="birthday"
                v-model="form.birthday"
                type="date"
              />
            </div>

            <div class="form-group">
              <label for="gender">
                Giới tính
              </label>

              <select
                id="gender"
                v-model="form.gender"
              >
                <option value="Nam">
                  Nam
                </option>

                <option value="Nữ">
                  Nữ
                </option>

                <option value="Khác">
                  Khác
                </option>
              </select>
            </div>

            <div
              class="form-group full-width"
            >
              <label for="address">
                Địa chỉ
              </label>

              <textarea
                id="address"
                v-model="form.address"
                rows="3"
                maxlength="300"
                placeholder="Nhập địa chỉ hiện tại"
              />
            </div>
          </div>
        </section>

        <section class="form-section">
          <div class="section-heading">
            <i class="bi bi-shield-lock" />

            <div>
              <h2>
                Thông tin đăng nhập
              </h2>

            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label for="password">
                Mật khẩu
                <span>*</span>
              </label>

              <div class="password-wrapper">
                <input
                  id="password"
                  v-model="form.password"
                  :type="
                    showPassword
                      ? 'text'
                      : 'password'
                  "
                  autocomplete="new-password"
                  placeholder="Ít nhất 6 ký tự"
                />

                <button
                  type="button"
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

            <div class="form-group">
              <label
                for="confirmPassword"
              >
                Xác nhận mật khẩu
                <span>*</span>
              </label>

              <div class="password-wrapper">
                <input
                  id="confirmPassword"
                  v-model="
                    form.confirmPassword
                  "
                  :type="
                    showConfirmPassword
                      ? 'text'
                      : 'password'
                  "
                  autocomplete="new-password"
                  placeholder="Nhập lại mật khẩu"
                />

                <button
                  type="button"
                  @click="
                    showConfirmPassword =
                      !showConfirmPassword
                  "
                >
                  <i
                    :class="
                      showConfirmPassword
                        ? 'bi bi-eye-slash'
                        : 'bi bi-eye'
                    "
                  />
                </button>
              </div>
            </div>
          </div>
        </section>

        <div class="form-actions">
          <RouterLink
            :to="{
              name: 'reader-login',
            }"
            class="login-link"
          >
            Đã có tài khoản?
            Đăng nhập
          </RouterLink>

          <button
            type="submit"
            class="register-button"
            :disabled="
              authStore.loading
            "
          >
            <span
              v-if="authStore.loading"
              class="spinner"
            />

            <i
              v-else
              class="bi bi-person-plus"
            />

            {{
              authStore.loading
                ? "Đang đăng ký..."
                : "Đăng ký tài khoản"
            }}
          </button>
        </div>
      </form>
    </section>
  </main>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  padding: 35px 20px;
  background:
    radial-gradient(
      circle at 10% 10%,
      rgb(59 130 246 / 13%),
      transparent 30%
    ),
    linear-gradient(
      135deg,
      #eff6ff,
      #f8fafc
    );
}

.register-container {
  width: 100%;
  max-width: 950px;
  margin: 0 auto;
}

.register-header {
  margin-bottom: 21px;
  padding: 25px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-radius: 20px;
  background:
    linear-gradient(
      135deg,
      #2563eb,
      #1e3a8a
    );
  color: #fff;
  box-shadow:
    0 16px 35px
    rgb(37 99 235 / 22%);
}

.brand-icon {
  width: 61px;
  height: 61px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 18px;
  background:
    rgb(255 255 255 / 16%);
  font-size: 26px;
}

.register-header span {
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
}

.register-header h1 {
  margin: 4px 0 5px;
  font-size: 26px;
}

.register-header p {
  margin: 0;
  color:
    rgb(255 255 255 / 72%);
  font-size: 12px;
}

.register-form {
  padding: 27px;
  border: 1px solid #e5edf7;
  border-radius: 20px;
  background: #fff;
  box-shadow:
    0 12px 32px
    rgb(15 23 42 / 7%);
}

.alert {
  margin-bottom: 18px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid;
  border-radius: 10px;
  font-size: 12px;
}

.alert-error {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.alert-success {
  border-color: #a7f3d0;
  background: #ecfdf5;
  color: #047857;
}

.form-section + .form-section {
  margin-top: 26px;
  padding-top: 25px;
  border-top: 1px solid #e5e7eb;
}

.section-heading {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-heading > i {
  width: 43px;
  height: 43px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 18px;
}

.section-heading h2 {
  margin: 0;
  color: #1e3a8a;
  font-size: 18px;
}

.section-heading p {
  margin: 4px 0 0;
  color: #94a3b8;
  font-size: 10px;
}

.form-grid {
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 17px;
}

.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  margin-bottom: 7px;
  display: block;
  color: #475569;
  font-size: 11px;
  font-weight: 800;
}

.form-group label span {
  color: #ef4444;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  border: 1px solid #dce5f0;
  border-radius: 10px;
  background: #fff;
  color: #334155;
  outline: none;
}

.form-group input,
.form-group select {
  height: 45px;
  padding: 0 13px;
}

.form-group textarea {
  padding: 12px 13px;
  resize: vertical;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #60a5fa;
  box-shadow:
    0 0 0 3px
    rgb(59 130 246 / 11%);
}

.password-wrapper {
  position: relative;
}

.password-wrapper input {
  padding-right: 45px;
}

.password-wrapper button {
  width: 34px;
  height: 34px;
  position: absolute;
  top: 50%;
  right: 6px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  transform: translateY(-50%);
}

.form-actions {
  margin-top: 27px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
}

.login-link {
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
}

.register-button {
  min-height: 45px;
  padding: 0 19px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  border: 0;
  border-radius: 10px;
  background: #2563eb;
  color: #fff;
  font-weight: 800;
}

.register-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.spinner {
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

@media (max-width: 650px) {
  .register-page {
    padding: 15px;
  }

  .register-header,
  .register-form {
    border-radius: 16px;
  }

  .register-header {
    padding: 20px;
    align-items: flex-start;
  }

  .brand-icon {
    width: 50px;
    height: 50px;
  }

  .register-header h1 {
    font-size: 21px;
  }

  .register-form {
    padding: 20px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .full-width {
    grid-column: auto;
  }

  .form-actions {
    align-items: stretch;
    flex-direction: column-reverse;
  }

  .register-button {
    width: 100%;
  }

  .login-link {
    text-align: center;
  }
}
</style>