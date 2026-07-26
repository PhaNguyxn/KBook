<script setup>
import {
  computed,
  onMounted,
  reactive,
  ref,
} from "vue";

import ReaderAccountSidebar from
  "@/components/account/ReaderAccountSidebar.vue";

import {
  readerAuthApi,
} from "@/api/readerAuthApi";

import {
  useReaderAuthStore,
} from "@/stores/readerAuth";

const authStore =
  useReaderAuthStore();

const activeTab = ref("profile");
const loading = ref(false);
const saving = ref(false);

const errorMessage = ref("");
const successMessage = ref("");

const profileForm = reactive({
  readerCode: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  birthday: "",
  gender: "Nam",
  address: "",
});

const passwordForm = reactive({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const fullName = computed(() => {
  return `${profileForm.lastName || ""} ${
    profileForm.firstName || ""
  }`.trim();
});

function formatDateInput(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  return date
    .toISOString()
    .slice(0, 10);
}

function assignProfile(reader = {}) {
  profileForm.readerCode =
    reader.readerCode || "";

  profileForm.firstName =
    reader.firstName || "";

  profileForm.lastName =
    reader.lastName || "";

  profileForm.email =
    reader.email || "";

  profileForm.phone =
    reader.phone || "";

  profileForm.birthday =
    formatDateInput(
      reader.birthday,
    );

  profileForm.gender =
    reader.gender || "Nam";

  profileForm.address =
    reader.address || "";
}

function extractReader(response) {
  const payload =
    response?.data?.data ??
    response?.data ??
    {};

  return (
    payload.reader ||
    payload.user ||
    payload
  );
}

async function loadProfile() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response =
      await readerAuthApi
        .getProfile();

    const reader =
      extractReader(response);

    assignProfile(reader);

    authStore.reader = reader;
  } catch (error) {
    errorMessage.value =
      error?.response?.data?.message ||
      "Không thể tải thông tin hồ sơ";
  } finally {
    loading.value = false;
  }
}

function validateProfile() {
  if (!profileForm.lastName.trim()) {
    return "Vui lòng nhập họ";
  }

  if (!profileForm.firstName.trim()) {
    return "Vui lòng nhập tên";
  }

  if (!profileForm.email.trim()) {
    return "Vui lòng nhập email";
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      profileForm.email,
    )
  ) {
    return "Email không hợp lệ";
  }

  if (!profileForm.phone.trim()) {
    return "Vui lòng nhập số điện thoại";
  }

  return "";
}

async function updateProfile() {
  errorMessage.value = "";
  successMessage.value = "";

  const validationError =
    validateProfile();

  if (validationError) {
    errorMessage.value =
      validationError;

    return;
  }

  saving.value = true;

  try {
    const response =
      await readerAuthApi
        .updateProfile({
          firstName:
            profileForm.firstName.trim(),

          lastName:
            profileForm.lastName.trim(),

          email:
            profileForm.email
              .trim()
              .toLowerCase(),

          phone:
            profileForm.phone
              .replace(/\s+/g, "")
              .trim(),

          birthday:
            profileForm.birthday ||
            null,

          gender:
            profileForm.gender,

          address:
            profileForm.address.trim(),
        });

    const reader =
      extractReader(response);

    assignProfile(reader);

    authStore.reader = reader;

    localStorage.setItem(
      "reader",
      JSON.stringify(reader),
    );

    successMessage.value =
      "Cập nhật hồ sơ thành công";
  } catch (error) {
    errorMessage.value =
      error?.response?.data?.message ||
      "Không thể cập nhật hồ sơ";
  } finally {
    saving.value = false;
  }
}

async function changePassword() {
  errorMessage.value = "";
  successMessage.value = "";

  if (
    !passwordForm.currentPassword ||
    !passwordForm.newPassword ||
    !passwordForm.confirmPassword
  ) {
    errorMessage.value =
      "Vui lòng nhập đầy đủ thông tin mật khẩu";

    return;
  }

  if (
    passwordForm.newPassword.length <
    6
  ) {
    errorMessage.value =
      "Mật khẩu mới phải có ít nhất 6 ký tự";

    return;
  }

  if (
    passwordForm.newPassword !==
    passwordForm.confirmPassword
  ) {
    errorMessage.value =
      "Mật khẩu xác nhận không khớp";

    return;
  }

  saving.value = true;

  try {
    await readerAuthApi
      .changePassword({
        currentPassword:
          passwordForm.currentPassword,

        newPassword:
          passwordForm.newPassword,

        confirmPassword:
          passwordForm.confirmPassword,
      });

    passwordForm.currentPassword = "";
    passwordForm.newPassword = "";
    passwordForm.confirmPassword = "";

    successMessage.value =
      "Đổi mật khẩu thành công";
  } catch (error) {
    errorMessage.value =
      error?.response?.data?.message ||
      "Không thể đổi mật khẩu";
  } finally {
    saving.value = false;
  }
}

function switchTab(tab) {
  activeTab.value = tab;
  errorMessage.value = "";
  successMessage.value = "";
}

onMounted(loadProfile);
</script>

<template>
  <div class="profile-page">
    <section class="account-banner">
      <div class="reader-container">
        <div class="breadcrumb">
          <RouterLink
            :to="{
              name: 'reader-home',
            }"
          >
            Trang chủ
          </RouterLink>

          <i class="bi bi-chevron-right" />

          <span>Hồ sơ cá nhân</span>
        </div>

        <h1>Hồ sơ độc giả</h1>

        <p>
          Quản lý thông tin cá nhân và bảo mật
          tài khoản KBook.
        </p>
      </div>
    </section>

    <section class="account-section">
      <div class="reader-container account-layout">
        <ReaderAccountSidebar />

        <main class="profile-card">
          <header class="profile-card-header">
            <div>
              <span>Tài khoản độc giả</span>

              <h2>
                {{
                  activeTab === "profile"
                    ? "Thông tin cá nhân"
                    : "Đổi mật khẩu"
                }}
              </h2>

              <p>
                {{
                  activeTab === "profile"
                    ? "Cập nhật thông tin liên hệ và hồ sơ của bạn."
                    : "Thay đổi mật khẩu để bảo vệ tài khoản."
                }}
              </p>
            </div>

            <div class="profile-tabs">
              <button
                type="button"
                :class="{
                  active:
                    activeTab ===
                    'profile',
                }"
                @click="
                  switchTab('profile')
                "
              >
                <i class="bi bi-person" />

                Hồ sơ
              </button>

              <button
                type="button"
                :class="{
                  active:
                    activeTab ===
                    'password',
                }"
                @click="
                  switchTab('password')
                "
              >
                <i
                  class="bi bi-shield-lock"
                />

                Mật khẩu
              </button>
            </div>
          </header>

          <div
            v-if="errorMessage"
            class="profile-alert error"
          >
            <i
              class="bi bi-exclamation-circle-fill"
            />

            {{ errorMessage }}
          </div>

          <div
            v-if="successMessage"
            class="profile-alert success"
          >
            <i
              class="bi bi-check-circle-fill"
            />

            {{ successMessage }}
          </div>

          <div
            v-if="loading"
            class="profile-loading"
          >
            <span class="profile-spinner" />

            <p>Đang tải hồ sơ...</p>
          </div>

          <form
            v-else-if="
              activeTab === 'profile'
            "
            class="profile-form"
            @submit.prevent="updateProfile"
          >
            <div class="reader-identity">
              <span>
                <i class="bi bi-person-vcard" />
              </span>

              <div>
                <small>Họ và tên độc giả</small>
                <strong>{{ fullName }}</strong>
                <p>{{ profileForm.readerCode }}</p>
              </div>
            </div>

            <div class="profile-form-grid">
              <div class="form-group">
                <label for="readerCode">
                  Mã độc giả
                </label>

                <input
                  id="readerCode"
                  v-model="
                    profileForm.readerCode
                  "
                  type="text"
                  disabled
                />

                <small>
                  Mã độc giả không thể thay đổi.
                </small>
              </div>

              <div class="form-group">
                <label for="readerEmail">
                  Email
                </label>

                <input
                  id="readerEmail"
                  v-model="
                    profileForm.email
                  "
                  type="email"
                />
              </div>

              <div class="form-group">
                <label for="readerLastName">
                  Họ
                </label>

                <input
                  id="readerLastName"
                  v-model="
                    profileForm.lastName
                  "
                  type="text"
                />
              </div>

              <div class="form-group">
                <label for="readerFirstName">
                  Tên
                </label>

                <input
                  id="readerFirstName"
                  v-model="
                    profileForm.firstName
                  "
                  type="text"
                />
              </div>

              <div class="form-group">
                <label for="readerPhone">
                  Số điện thoại
                </label>

                <input
                  id="readerPhone"
                  v-model="
                    profileForm.phone
                  "
                  type="tel"
                />
              </div>

              <div class="form-group">
                <label for="readerBirthday">
                  Ngày sinh
                </label>

                <input
                  id="readerBirthday"
                  v-model="
                    profileForm.birthday
                  "
                  type="date"
                />
              </div>

              <div class="form-group">
                <label for="readerGender">
                  Giới tính
                </label>

                <select
                  id="readerGender"
                  v-model="
                    profileForm.gender
                  "
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

              <div class="form-group full-width">
                <label for="readerAddress">
                  Địa chỉ
                </label>

                <textarea
                  id="readerAddress"
                  v-model="
                    profileForm.address
                  "
                  rows="4"
                  placeholder="Nhập địa chỉ"
                />
              </div>
            </div>

            <div class="profile-actions">
              <button
                type="button"
                class="cancel-button"
                @click="loadProfile"
              >
                Khôi phục
              </button>

              <button
                type="submit"
                class="save-button"
                :disabled="saving"
              >
                <span
                  v-if="saving"
                  class="reader-spinner"
                />

                <i
                  v-else
                  class="bi bi-check-lg"
                />

                {{
                  saving
                    ? "Đang lưu..."
                    : "Lưu thay đổi"
                }}
              </button>
            </div>
          </form>

          <form
            v-else
            class="password-form"
            @submit.prevent="changePassword"
          >
            <div class="security-notice">
              <i class="bi bi-shield-check" />

              <div>
                <strong>
                  Bảo vệ tài khoản của bạn
                </strong>

                <p>
                  Mật khẩu nên có tối thiểu 6 ký tự
                  và không sử dụng thông tin dễ đoán.
                </p>
              </div>
            </div>

            <div class="password-fields">
              <div class="form-group">
                <label for="currentPassword">
                  Mật khẩu hiện tại
                </label>

                <input
                  id="currentPassword"
                  v-model="
                    passwordForm
                      .currentPassword
                  "
                  type="password"
                  autocomplete="current-password"
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </div>

              <div class="form-group">
                <label for="newPassword">
                  Mật khẩu mới
                </label>

                <input
                  id="newPassword"
                  v-model="
                    passwordForm
                      .newPassword
                  "
                  type="password"
                  autocomplete="new-password"
                  placeholder="Nhập mật khẩu mới"
                />
              </div>

              <div class="form-group">
                <label for="confirmPassword">
                  Xác nhận mật khẩu mới
                </label>

                <input
                  id="confirmPassword"
                  v-model="
                    passwordForm
                      .confirmPassword
                  "
                  type="password"
                  autocomplete="new-password"
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>
            </div>

            <button
              type="submit"
              class="save-button"
              :disabled="saving"
            >
              <span
                v-if="saving"
                class="reader-spinner"
              />

              <i
                v-else
                class="bi bi-shield-lock"
              />

              {{
                saving
                  ? "Đang cập nhật..."
                  : "Cập nhật mật khẩu"
              }}
            </button>
          </form>
        </main>
      </div>
    </section>
  </div>
</template>

<style scoped>
.account-banner {
  padding: 40px 0;
  border-bottom: 1px solid
    var(--reader-border);
  background:
    linear-gradient(
      135deg,
      #eaf7ef,
      #eef2ff
    );
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--reader-muted);
  font-size: 9px;
}

.breadcrumb a {
  color: var(--reader-primary);
}

.account-banner h1 {
  margin: 14px 0 7px;
  color: var(--reader-text);
  font-size: 34px;
}

.account-banner p {
  margin: 0;
  color: var(--reader-muted);
  font-size: 11px;
}

.account-section {
  padding: 40px 0 65px;
  background: #fafcfb;
}

.account-layout {
  display: grid;
  grid-template-columns:
    245px minmax(0, 1fr);
  align-items: start;
  gap: 25px;
}

.profile-card {
  min-height: 600px;
  padding: 28px;
  border: 1px solid
    var(--reader-border);
  border-radius: 18px;
  background: #fff;
  box-shadow:
    0 12px 35px
    rgb(15 23 42 / 6%);
}

.profile-card-header {
  padding-bottom: 21px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  border-bottom: 1px solid
    var(--reader-border);
}

.profile-card-header span {
  color: var(--reader-primary);
  font-size: 8px;
  font-weight: 900;
  text-transform: uppercase;
}

.profile-card-header h2 {
  margin: 7px 0 5px;
  color: var(--reader-text);
  font-size: 23px;
}

.profile-card-header p {
  margin: 0;
  color: var(--reader-muted);
  font-size: 9px;
}

.profile-tabs {
  padding: 4px;
  display: flex;
  border-radius: 10px;
  background: #f2f6f3;
}

.profile-tabs button {
  min-height: 34px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #697970;
  font-size: 9px;
  font-weight: 900;
}

.profile-tabs button.active {
  background: #fff;
  color: var(--reader-primary);
  box-shadow:
    0 3px 10px
    rgb(15 23 42 / 7%);
}

.profile-alert {
  margin-top: 20px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid;
  border-radius: 9px;
  font-size: 9px;
}

.profile-alert.error {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.profile-alert.success {
  border-color: #a7f3d0;
  background: #ecfdf5;
  color: #047857;
}

.profile-loading {
  min-height: 420px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  color: var(--reader-muted);
}

.profile-spinner {
  width: 34px;
  height: 34px;
  border: 3px solid #dce8e1;
  border-top-color:
    var(--reader-primary);
  border-radius: 50%;
  animation:
    reader-spin 0.8s linear infinite;
}

.reader-identity {
  margin-top: 23px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  border-radius: 12px;
  background:
    var(--reader-primary-light);
}

.reader-identity > span {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: #fff;
  color: var(--reader-primary);
  font-size: 20px;
}

.reader-identity small,
.reader-identity strong,
.reader-identity p {
  display: block;
}

.reader-identity small {
  color: var(--reader-muted);
  font-size: 8px;
}

.reader-identity strong {
  margin-top: 4px;
  color: var(--reader-text);
  font-size: 13px;
}

.reader-identity p {
  margin: 4px 0 0;
  color: var(--reader-primary);
  font-size: 8px;
  font-weight: 900;
}

.profile-form-grid {
  margin-top: 23px;
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 17px;
}

.form-group label {
  margin-bottom: 7px;
  display: block;
  color: var(--reader-text);
  font-size: 9px;
  font-weight: 900;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  border: 1px solid
    var(--reader-border);
  border-radius: 9px;
  background: #fff;
  color: var(--reader-text);
  outline: none;
}

.form-group input,
.form-group select {
  height: 42px;
  padding: 0 11px;
}

.form-group textarea {
  padding: 11px;
  resize: vertical;
}

.form-group input:disabled {
  background: #f4f7f5;
  color: #89968f;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: var(--reader-primary);
  box-shadow:
    0 0 0 3px
    rgb(12 101 61 / 8%);
}

.form-group > small {
  margin-top: 6px;
  display: block;
  color: var(--reader-muted);
  font-size: 7px;
}

.full-width {
  grid-column: 1 / -1;
}

.profile-actions {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-button,
.save-button {
  min-height: 42px;
  padding: 0 17px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  border-radius: 9px;
  font-size: 9px;
  font-weight: 900;
}

.cancel-button {
  border: 1px solid
    var(--reader-border);
  background: #fff;
  color: var(--reader-text);
}

.save-button {
  border: 0;
  background: var(--reader-primary);
  color: #fff;
}

.save-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.password-form {
  max-width: 600px;
  margin-top: 25px;
}

.security-notice {
  padding: 17px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border-radius: 12px;
  background: #fff8dd;
  color: #826419;
}

.security-notice > i {
  font-size: 25px;
}

.security-notice strong {
  display: block;
  font-size: 10px;
}

.security-notice p {
  margin: 5px 0 0;
  font-size: 8px;
  line-height: 1.6;
}

.password-fields {
  margin: 21px 0;
  display: grid;
  gap: 17px;
}

@media (max-width: 800px) {
  .account-layout {
    grid-template-columns: 1fr;
  }

  .profile-card-header {
    align-items: stretch;
    flex-direction: column;
  }

  .profile-tabs {
    align-self: flex-start;
  }
}

@media (max-width: 550px) {
  .profile-card {
    padding: 20px;
  }

  .profile-form-grid {
    grid-template-columns: 1fr;
  }

  .full-width {
    grid-column: auto;
  }
}
</style>