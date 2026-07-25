<script setup>
import {
  computed,
  onMounted,
  reactive,
  ref,
} from "vue";

import {
  useRoute,
  useRouter,
} from "vue-router";

import { employeeApi } from "@/api/employeeApi";
import { useAuthStore } from "@/stores/auth";

import { formatDateForInput } from "@/utils/date";
import { getErrorMessage } from "@/utils/error";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

/* =========================================
   STATE
========================================= */

const loading = ref(false);
const submitting = ref(false);

const errorMessage = ref("");
const successMessage = ref("");

const employeeId = ref("");

const showPassword = ref(false);
const showConfirmPassword = ref(false);

const form = reactive({
  employeeCode: "",
  fullName: "",
  email: "",
  phone: "",
  birthday: "",
  gender: "Nam",
  address: "",
  role: "staff",
  password: "",
  confirmPassword: "",
});

/* =========================================
   COMPUTED
========================================= */

const isEditMode = computed(() => {
  return Boolean(route.params.id);
});

const currentEmployeeId = computed(() => {
  return (
    authStore.employee?._id ||
    authStore.user?._id ||
    authStore.currentUser?._id ||
    ""
  );
});

const isCurrentEmployee = computed(() => {
  return (
    isEditMode.value &&
    employeeId.value &&
    currentEmployeeId.value &&
    String(employeeId.value) ===
      String(currentEmployeeId.value)
  );
});

const pageTitle = computed(() => {
  return isEditMode.value
    ? "Cập nhật nhân viên"
    : "Thêm nhân viên mới";
});

const pageDescription = computed(() => {
  return isEditMode.value
    ? "Cập nhật thông tin cá nhân, phân quyền hoặc đổi mật khẩu cho nhân viên."
    : "Nhập thông tin để tạo tài khoản nhân viên mới trong hệ thống.";
});

const employeeInitials = computed(() => {
  const fullName = String(
    form.fullName || "",
  ).trim();

  if (!fullName) {
    return "NV";
  }

  const words = fullName
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  const firstCharacter =
    words[0].charAt(0);

  const lastCharacter =
    words[
      words.length - 1
    ].charAt(0);

  return `${firstCharacter}${lastCharacter}`
    .toUpperCase();
});

const roleText = computed(() => {
  return form.role === "admin"
    ? "Quản trị viên"
    : "Nhân viên";
});

const today = computed(() => {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
});

const canSubmit = computed(() => {
  if (
    !form.fullName.trim() ||
    !form.email.trim() ||
    !form.phone.trim() ||
    submitting.value ||
    loading.value
  ) {
    return false;
  }

  if (
    !isEditMode.value &&
    (!form.password ||
      !form.confirmPassword)
  ) {
    return false;
  }

  return true;
});

/* =========================================
   HÀM HỖ TRỢ
========================================= */

function goBack() {
  router.push("/employees");
}

function normalizePhone(value) {
  return String(value || "")
    .replace(/\s+/g, "")
    .trim();
}

function clearMessages() {
  errorMessage.value = "";
  successMessage.value = "";
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

/* =========================================
   VALIDATE
========================================= */

function validateForm() {
  const fullName =
    form.fullName.trim();

  const email =
    form.email
      .trim()
      .toLowerCase();

  const phone =
    normalizePhone(form.phone);

  if (!fullName) {
    return "Vui lòng nhập họ và tên";
  }

  if (fullName.length < 2) {
    return "Họ và tên không hợp lệ";
  }

  if (!email) {
    return "Vui lòng nhập email";
  }

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    return "Email không hợp lệ";
  }

  if (!phone) {
    return "Vui lòng nhập số điện thoại";
  }

  if (!/^[0-9]{9,11}$/.test(phone)) {
    return "Số điện thoại phải gồm từ 9 đến 11 chữ số";
  }

  if (
    !["Nam", "Nữ", "Khác"].includes(
      form.gender,
    )
  ) {
    return "Giới tính không hợp lệ";
  }

  if (
    !["admin", "staff"].includes(
      form.role,
    )
  ) {
    return "Vai trò nhân viên không hợp lệ";
  }

  if (
    isCurrentEmployee.value &&
    form.role !== "admin"
  ) {
    return "Bạn không thể tự hạ quyền tài khoản đang đăng nhập";
  }

  if (form.birthday) {
    const birthday = new Date(
      `${form.birthday}T00:00:00`,
    );

    const currentDate =
      new Date();

    if (
      Number.isNaN(
        birthday.getTime(),
      ) ||
      birthday >= currentDate
    ) {
      return "Ngày sinh không hợp lệ";
    }
  }

  if (
    !isEditMode.value &&
    !form.password
  ) {
    return "Vui lòng nhập mật khẩu";
  }

  if (
    form.password &&
    form.password.length < 6
  ) {
    return "Mật khẩu phải có ít nhất 6 ký tự";
  }

  if (
    !isEditMode.value &&
    !form.confirmPassword
  ) {
    return "Vui lòng xác nhận mật khẩu";
  }

  if (
    form.password !==
    form.confirmPassword
  ) {
    return "Mật khẩu xác nhận không khớp";
  }

  return "";
}

/* =========================================
   TẢI THÔNG TIN NHÂN VIÊN
========================================= */

async function loadEmployee() {
  if (!isEditMode.value) {
    return;
  }

  const id = route.params.id;

  if (!id) {
    errorMessage.value =
      "Không tìm thấy mã nhân viên";

    return;
  }

  loading.value = true;
  clearMessages();

  try {
    const response =
      await employeeApi.getById(id);

    const employee =
      response?.data?.data ??
      response?.data ??
      null;

    if (!employee?._id) {
      throw new Error(
        "Không tìm thấy nhân viên",
      );
    }

    employeeId.value =
      employee._id;

    form.employeeCode =
      employee.employeeCode || "";

    form.fullName =
      employee.fullName || "";

    form.email =
      employee.email || "";

    form.phone =
      employee.phone || "";

    form.birthday =
      employee.birthday
        ? formatDateForInput(
            employee.birthday,
          )
        : "";

    form.gender =
      employee.gender || "Nam";

    form.address =
      employee.address || "";

    form.role =
      employee.role || "staff";

    form.password = "";
    form.confirmPassword = "";
  } catch (error) {
    console.error(
      "Load employee error:",
      error,
    );

    errorMessage.value =
      getErrorMessage(
        error,
        "Không thể tải thông tin nhân viên",
      );
  } finally {
    loading.value = false;
  }
}

/* =========================================
   GỬI FORM
========================================= */

async function handleSubmit() {
  const validationMessage =
    validateForm();

  if (validationMessage) {
    errorMessage.value =
      validationMessage;

    successMessage.value = "";

    scrollToTop();

    return;
  }

  submitting.value = true;
  clearMessages();

  /*
   * Không gửi employeeCode.
   * Backend sẽ tự sinh mã khi tạo mới.
   * Khi cập nhật, mã cũ được giữ nguyên.
   */
  const payload = {
    fullName:
      form.fullName.trim(),

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

    role:
      form.role,
  };

  if (form.password) {
    payload.password =
      form.password;
  }

  try {
    if (isEditMode.value) {
      const response =
        await employeeApi.update(
          route.params.id,
          payload,
        );

      const updatedEmployee =
        response?.data?.data ??
        response?.data ??
        null;

      /*
       * Nếu người dùng đang sửa chính
       * tài khoản hiện tại thì cập nhật store.
       */
      if (
        isCurrentEmployee.value &&
        updatedEmployee
      ) {
        authStore.employee =
          updatedEmployee;

        localStorage.setItem(
          "employee",
          JSON.stringify(
            updatedEmployee,
          ),
        );
      }

      successMessage.value =
        "Cập nhật nhân viên thành công";
    } else {
      const response =
        await employeeApi.create(
          payload,
        );

      const createdEmployee =
        response?.data?.data ??
        response?.data ??
        null;

      if (
        createdEmployee
          ?.employeeCode
      ) {
        form.employeeCode =
          createdEmployee.employeeCode;
      }

      successMessage.value =
        "Thêm nhân viên thành công";
    }

    form.password = "";
    form.confirmPassword = "";

    await router.push(
      "/employees",
    );
  } catch (error) {
    console.error(
      isEditMode.value
        ? "Update employee error:"
        : "Create employee error:",
      error,
    );

    errorMessage.value =
      getErrorMessage(
        error,
        isEditMode.value
          ? "Không thể cập nhật nhân viên"
          : "Không thể thêm nhân viên",
      );

    scrollToTop();
  } finally {
    submitting.value = false;
  }
}

/* =========================================
   KHỞI TẠO
========================================= */

onMounted(() => {
  loadEmployee();
});
</script>

<template>
  <section class="employee-form-page">
    <!-- Điều hướng -->
    <div class="navigation-bar">
      <button
        type="button"
        class="back-button"
        @click="goBack"
      >
        <i class="bi bi-arrow-left" />

        Quay lại danh sách
      </button>
    </div>

    <!-- Thông báo lỗi -->
    <div
      v-if="errorMessage"
      class="custom-alert alert-error"
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

    <!-- Thông báo thành công -->
    <div
      v-if="successMessage"
      class="custom-alert alert-success"
      role="alert"
    >
      <i
        class="bi bi-check-circle-fill"
      />

      <span>
        {{ successMessage }}
      </span>

      <button
        type="button"
        title="Đóng"
        @click="successMessage = ''"
      >
        <i class="bi bi-x-lg" />
      </button>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="loading-card"
    >
      <div
        class="spinner-border text-primary"
        role="status"
      />

      <strong>
        Đang tải thông tin nhân viên
      </strong>

      <span>
        Vui lòng chờ trong giây lát...
      </span>
    </div>

    <!-- Form -->
    <form
      v-else
      class="form-layout"
      @submit.prevent="handleSubmit"
    >
      <main class="main-column">
        <!-- Tiêu đề -->
        <section class="header-card">
          <div class="header-icon">
            <i
              :class="
                isEditMode
                  ? 'bi bi-person-gear'
                  : 'bi bi-person-plus'
              "
            />
          </div>

          <div class="header-content">
            <span>
              Quản lý nhân viên
            </span>

            <h1>
              {{ pageTitle }}
            </h1>

            <p>
              {{ pageDescription }}
            </p>
          </div>
        </section>

        <!-- Thông tin nhân viên -->
        <section class="form-card">
          <div class="card-heading">
            <div class="heading-icon">
              <i
                class="bi bi-person-vcard"
              />
            </div>

            <div>
              <h2>
                Thông tin nhân viên
              </h2>

              <p>
                Nhập thông tin nhận diện và
                liên hệ của nhân viên.
              </p>
            </div>
          </div>

          <div class="form-grid">
            <!-- Mã nhân viên -->
            <div class="form-group">
              <label>
                Mã nhân viên
              </label>

              <div class="auto-code-box">
                <span class="auto-code-icon">
                  <i
                    class="bi bi-upc-scan"
                  />
                </span>

                <div>
                  <small>
                    {{
                      isEditMode
                        ? "Mã nhân viên hiện tại"
                        : "Hệ thống tự động tạo"
                    }}
                  </small>

                  <strong>
                    {{
                      isEditMode
                        ? form.employeeCode ||
                          "Chưa có mã"
                        : "NVxxx"
                    }}
                  </strong>
                </div>

                <span
                  class="automatic-badge"
                  :class="{
                    locked:
                      isEditMode,
                  }"
                >
                  <i
                    :class="
                      isEditMode
                        ? 'bi bi-lock-fill'
                        : 'bi bi-magic'
                    "
                  />

                  {{
                    isEditMode
                      ? "Không thể sửa"
                      : "Tự động"
                  }}
                </span>
              </div>
            </div>

            <!-- Họ tên -->
            <div class="form-group">
              <label for="fullName">
                Họ và tên
                <span>*</span>
              </label>

              <div class="input-wrapper">
                <i class="bi bi-person" />

                <input
                  id="fullName"
                  v-model="form.fullName"
                  type="text"
                  maxlength="100"
                  autocomplete="name"
                  placeholder="Nhập họ và tên"
                />
              </div>
            </div>

            <!-- Email -->
            <div class="form-group">
              <label for="email">
                Email
                <span>*</span>
              </label>

              <div class="input-wrapper">
                <i class="bi bi-envelope" />

                <input
                  id="email"
                  v-model="form.email"
                  type="email"
                  maxlength="120"
                  autocomplete="email"
                  placeholder="example@gmail.com"
                />
              </div>
            </div>

            <!-- Số điện thoại -->
            <div class="form-group">
              <label for="phone">
                Số điện thoại
                <span>*</span>
              </label>

              <div class="input-wrapper">
                <i class="bi bi-telephone" />

                <input
                  id="phone"
                  v-model="form.phone"
                  type="tel"
                  maxlength="11"
                  inputmode="numeric"
                  autocomplete="tel"
                  placeholder="0901234567"
                />
              </div>
            </div>

            <!-- Ngày sinh -->
            <div class="form-group">
              <label for="birthday">
                Ngày sinh
              </label>

              <div class="input-wrapper">
                <i class="bi bi-calendar3" />

                <input
                  id="birthday"
                  v-model="form.birthday"
                  type="date"
                  :max="today"
                />
              </div>
            </div>

            <!-- Giới tính -->
            <div class="form-group">
              <label for="gender">
                Giới tính
              </label>

              <div class="input-wrapper">
                <i
                  class="bi bi-gender-ambiguous"
                />

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
            </div>

            <!-- Địa chỉ -->
            <div
              class="form-group full-width"
            >
              <label for="address">
                Địa chỉ
              </label>

              <div class="textarea-wrapper">
                <i class="bi bi-geo-alt" />

                <textarea
                  id="address"
                  v-model="form.address"
                  rows="4"
                  maxlength="300"
                  autocomplete="street-address"
                  placeholder="Nhập địa chỉ nhân viên"
                />
              </div>

              <small class="character-count">
                {{ form.address.length }}/300
              </small>
            </div>
          </div>
        </section>

        <!-- Phân quyền -->
        <section class="form-card">
          <div class="card-heading">
            <div
              class="heading-icon permission-icon"
            >
              <i
                class="bi bi-shield-lock"
              />
            </div>

            <div>
              <h2>
                Phân quyền tài khoản
              </h2>

              <p>
                Thiết lập quyền truy cập phù hợp
                cho nhân viên.
              </p>
            </div>
          </div>

          <div class="role-options">
            <label
              class="role-option"
              :class="{
                selected:
                  form.role === 'staff',
                disabled:
                  isCurrentEmployee,
              }"
            >
              <input
                v-model="form.role"
                type="radio"
                value="staff"
                :disabled="
                  isCurrentEmployee
                "
              />

              <span
                class="role-option-icon staff-icon"
              >
                <i
                  class="bi bi-person-badge"
                />
              </span>

              <span class="role-option-content">
                <strong>
                  Nhân viên
                </strong>

                <small>
                  Quản lý sách, độc giả và
                  lập phiếu mượn trả.
                </small>
              </span>

              <i
                v-if="
                  form.role === 'staff'
                "
                class="bi bi-check-circle-fill selected-check"
              />
            </label>

            <label
              class="role-option"
              :class="{
                selected:
                  form.role === 'admin',
                disabled:
                  isCurrentEmployee,
              }"
            >
              <input
                v-model="form.role"
                type="radio"
                value="admin"
                :disabled="
                  isCurrentEmployee
                "
              />

              <span
                class="role-option-icon admin-icon"
              >
                <i
                  class="bi bi-shield-check"
                />
              </span>

              <span class="role-option-content">
                <strong>
                  Quản trị viên
                </strong>

                <small>
                  Toàn quyền quản lý nhân viên
                  và cấu hình hệ thống.
                </small>
              </span>

              <i
                v-if="
                  form.role === 'admin'
                "
                class="bi bi-check-circle-fill selected-check"
              />
            </label>
          </div>

          <div
            v-if="isCurrentEmployee"
            class="information-note"
          >
            <i
              class="bi bi-info-circle-fill"
            />

            <span>
              Bạn đang cập nhật tài khoản của
              chính mình nên không thể thay đổi
              vai trò.
            </span>
          </div>
        </section>

        <!-- Mật khẩu -->
        <section class="form-card">
          <div class="card-heading">
            <div
              class="heading-icon password-icon"
            >
              <i class="bi bi-key" />
            </div>

            <div>
              <h2>
                {{
                  isEditMode
                    ? "Đổi mật khẩu"
                    : "Thông tin đăng nhập"
                }}
              </h2>

              <p>
                {{
                  isEditMode
                    ? "Để trống hai trường bên dưới nếu không muốn đổi mật khẩu."
                    : "Mật khẩu phải có ít nhất 6 ký tự."
                }}
              </p>
            </div>
          </div>

          <div class="form-grid">
            <!-- Mật khẩu -->
            <div class="form-group">
              <label for="password">
                {{
                  isEditMode
                    ? "Mật khẩu mới"
                    : "Mật khẩu"
                }}

                <span
                  v-if="!isEditMode"
                >
                  *
                </span>
              </label>

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
                  autocomplete="new-password"
                  :placeholder="
                    isEditMode
                      ? 'Để trống nếu không đổi mật khẩu'
                      : 'Nhập mật khẩu'
                  "
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

            <!-- Xác nhận mật khẩu -->
            <div class="form-group">
              <label for="confirmPassword">
                Xác nhận mật khẩu

                <span
                  v-if="!isEditMode"
                >
                  *
                </span>
              </label>

              <div
                class="input-wrapper password-wrapper"
              >
                <i
                  class="bi bi-shield-check"
                />

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
                  :placeholder="
                    isEditMode
                      ? 'Nhập lại mật khẩu mới'
                      : 'Nhập lại mật khẩu'
                  "
                />

                <button
                  type="button"
                  class="password-toggle"
                  :title="
                    showConfirmPassword
                      ? 'Ẩn mật khẩu'
                      : 'Hiện mật khẩu'
                  "
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

          <div class="password-hint">
            <i
              class="bi bi-shield-check"
            />

            <span>
              Nên sử dụng mật khẩu gồm chữ hoa,
              chữ thường, số và ký tự đặc biệt.
            </span>
          </div>
        </section>
      </main>

      <!-- Cột xem trước -->
      <aside class="preview-column">
        <section class="preview-card">
          <div class="preview-background">
            <div class="preview-avatar">
              {{ employeeInitials }}
            </div>
          </div>

          <div class="preview-content">
            <span class="preview-code">
              {{
                isEditMode
                  ? form.employeeCode ||
                    "CHƯA CÓ MÃ"
                  : "MÃ TỰ ĐỘNG"
              }}
            </span>

            <h2>
              {{
                form.fullName ||
                "Tên nhân viên"
              }}
            </h2>

            <span
              class="preview-role"
              :class="
                form.role === 'admin'
                  ? 'preview-admin'
                  : 'preview-staff'
              "
            >
              <i
                :class="
                  form.role === 'admin'
                    ? 'bi bi-shield-check'
                    : 'bi bi-person-badge'
                "
              />

              {{ roleText }}
            </span>

            <div class="preview-information">
              <div>
                <span
                  class="preview-information-icon"
                >
                  <i
                    class="bi bi-envelope"
                  />
                </span>

                <div>
                  <small>Email</small>

                  <strong>
                    {{
                      form.email ||
                      "Chưa cập nhật"
                    }}
                  </strong>
                </div>
              </div>

              <div>
                <span
                  class="preview-information-icon"
                >
                  <i
                    class="bi bi-telephone"
                  />
                </span>

                <div>
                  <small>
                    Số điện thoại
                  </small>

                  <strong>
                    {{
                      form.phone ||
                      "Chưa cập nhật"
                    }}
                  </strong>
                </div>
              </div>

              <div>
                <span
                  class="preview-information-icon"
                >
                  <i
                    class="bi bi-gender-ambiguous"
                  />
                </span>

                <div>
                  <small>
                    Giới tính
                  </small>

                  <strong>
                    {{ form.gender }}
                  </strong>
                </div>
              </div>
            </div>

            <div class="preview-actions">
              <button
                type="button"
                class="cancel-button"
                :disabled="submitting"
                @click="goBack"
              >
                Hủy
              </button>

              <button
                type="submit"
                class="submit-button"
                :disabled="!canSubmit"
              >
                <span
                  v-if="submitting"
                  class="spinner-border spinner-border-sm"
                />

                <i
                  v-else
                  :class="
                    isEditMode
                      ? 'bi bi-check-lg'
                      : 'bi bi-person-plus'
                  "
                />

                {{
                  submitting
                    ? "Đang lưu..."
                    : isEditMode
                      ? "Lưu thay đổi"
                      : "Thêm nhân viên"
                }}
              </button>
            </div>
          </div>
        </section>
      </aside>
    </form>
  </section>
</template>

<style scoped>
.employee-form-page {
  width: 100%;
  max-width: 1450px;
  min-width: 0;
  margin: 0 auto;
}

/* =========================================
   ĐIỀU HƯỚNG
========================================= */

.navigation-bar {
  margin-bottom: 18px;
}

.back-button {
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 0;
  background: transparent;
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.back-button:hover {
  color: #1d4ed8;
}

/* =========================================
   THÔNG BÁO
========================================= */

.custom-alert {
  min-height: 49px;
  margin-bottom: 20px;
  padding: 12px 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
}

.custom-alert > span {
  min-width: 0;
  flex: 1;
}

.custom-alert > button {
  width: 29px;
  height: 29px;
  padding: 0;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: inherit;
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

/* =========================================
   LOADING
========================================= */

.loading-card {
  min-height: 420px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  border: 1px solid #e5edf7;
  border-radius: 21px;
  background: #fff;
  box-shadow:
    0 10px 28px
    rgb(15 23 42 / 6%);
}

.loading-card strong {
  margin-top: 15px;
  color: #334155;
  font-size: 15px;
}

.loading-card span {
  margin-top: 6px;
  color: #94a3b8;
  font-size: 11px;
}

/* =========================================
   BỐ CỤC
========================================= */

.form-layout {
  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    330px;
  align-items: start;
  gap: 22px;
}

.main-column {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.header-card,
.form-card,
.preview-card {
  min-width: 0;
  border: 1px solid #e5edf7;
  border-radius: 21px;
  background: #fff;
  box-shadow:
    0 10px 28px
    rgb(15 23 42 / 6%);
}

/* =========================================
   HEADER
========================================= */

.header-card {
  padding: 25px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-icon {
  width: 55px;
  height: 55px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 16px;
  background: linear-gradient(
    135deg,
    #dbeafe,
    #eff6ff
  );
  color: #2563eb;
  font-size: 23px;
}

.header-content {
  min-width: 0;
}

.header-content > span {
  display: block;
  color: #3b82f6;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.6px;
  text-transform: uppercase;
}

.header-content h1 {
  margin: 4px 0 5px;
  color: #1e3a8a;
  font-size: 24px;
  font-weight: 900;
}

.header-content p {
  margin: 0;
  color: #94a3b8;
  font-size: 11px;
}

/* =========================================
   FORM CARD
========================================= */

.form-card {
  padding: 25px;
}

.card-heading {
  margin-bottom: 22px;
  display: flex;
  align-items: center;
  gap: 13px;
}

.heading-icon {
  width: 45px;
  height: 45px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 13px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 19px;
}

.permission-icon {
  background: #f5f3ff;
  color: #7c3aed;
}

.password-icon {
  background: #ecfdf5;
  color: #059669;
}

.card-heading h2 {
  margin: 0;
  color: #1e3a8a;
  font-size: 18px;
  font-weight: 900;
}

.card-heading p {
  margin: 5px 0 0;
  color: #94a3b8;
  font-size: 10px;
}

/* =========================================
   FORM
========================================= */

.form-grid {
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 17px;
}

.full-width {
  grid-column: 1 / -1;
}

.form-group {
  min-width: 0;
}

.form-group > label {
  margin-bottom: 7px;
  display: block;
  color: #475569;
  font-size: 10px;
  font-weight: 800;
}

.form-group > label span {
  color: #ef4444;
}

.input-wrapper,
.textarea-wrapper {
  position: relative;
}

.input-wrapper > i,
.textarea-wrapper > i {
  position: absolute;
  z-index: 1;
  left: 14px;
  color: #94a3b8;
  pointer-events: none;
}

.input-wrapper > i {
  top: 50%;
  transform: translateY(-50%);
}

.textarea-wrapper > i {
  top: 14px;
}

.input-wrapper input,
.input-wrapper select,
.textarea-wrapper textarea {
  width: 100%;
  border: 1px solid #dce5f0;
  border-radius: 10px;
  background: #fff;
  color: #334155;
  font-size: 11px;
  outline: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.input-wrapper input,
.input-wrapper select {
  height: 44px;
  padding: 0 13px 0 41px;
}

.textarea-wrapper textarea {
  min-height: 105px;
  padding: 13px 14px 13px 41px;
  resize: vertical;
}

.input-wrapper input:focus,
.input-wrapper select:focus,
.textarea-wrapper textarea:focus {
  border-color: #60a5fa;
  box-shadow:
    0 0 0 3px
    rgb(59 130 246 / 12%);
}

.character-count {
  margin-top: 6px;
  display: block;
  color: #94a3b8;
  font-size: 8px;
  text-align: right;
}

/* =========================================
   MÃ TỰ ĐỘNG
========================================= */

.auto-code-box {
  min-height: 44px;
  padding: 7px 10px;
  display: flex;
  align-items: center;
  gap: 9px;
  border: 1px dashed #93c5fd;
  border-radius: 10px;
  background: #f8fbff;
}

.auto-code-icon {
  width: 31px;
  height: 31px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 8px;
  background: #dbeafe;
  color: #2563eb;
}

.auto-code-box > div {
  min-width: 0;
  flex: 1;
}

.auto-code-box small,
.auto-code-box strong {
  display: block;
}

.auto-code-box small {
  color: #94a3b8;
  font-size: 7px;
  font-weight: 800;
  text-transform: uppercase;
}

.auto-code-box strong {
  margin-top: 2px;
  color: #1e3a8a;
  font-size: 11px;
  font-weight: 900;
}

.automatic-badge {
  padding: 5px 8px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  border-radius: 999px;
  background: #ecfdf5;
  color: #059669;
  font-size: 7px;
  font-weight: 900;
}

.automatic-badge.locked {
  background: #f1f5f9;
  color: #64748b;
}

/* =========================================
   PHÂN QUYỀN
========================================= */

.role-options {
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 13px;
}

.role-option {
  min-width: 0;
  min-height: 92px;
  padding: 15px;
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 13px;
  background: #fff;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease;
}

.role-option:hover:not(.disabled) {
  border-color: #bfdbfe;
  background: #f8fbff;
  transform: translateY(-1px);
}

.role-option.selected {
  border-color: #60a5fa;
  background: #eff6ff;
}

.role-option.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.role-option input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.role-option-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 12px;
  font-size: 18px;
}

.staff-icon {
  background: #dbeafe;
  color: #2563eb;
}

.admin-icon {
  background: #ede9fe;
  color: #7c3aed;
}

.role-option-content {
  min-width: 0;
  flex: 1;
}

.role-option-content strong,
.role-option-content small {
  display: block;
}

.role-option-content strong {
  color: #334155;
  font-size: 11px;
}

.role-option-content small {
  margin-top: 5px;
  color: #94a3b8;
  font-size: 9px;
  line-height: 1.5;
}

.selected-check {
  flex-shrink: 0;
  color: #2563eb;
  font-size: 16px;
}

.information-note {
  margin-top: 14px;
  padding: 12px 13px;
  display: flex;
  align-items: flex-start;
  gap: 9px;
  border: 1px solid #bfdbfe;
  border-radius: 11px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 9px;
  line-height: 1.6;
}

/* =========================================
   MẬT KHẨU
========================================= */

.password-wrapper input {
  padding-right: 44px;
}

.password-toggle {
  width: 34px;
  height: 34px;
  padding: 0;
  position: absolute;
  top: 50%;
  right: 5px;
  z-index: 2;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  transform: translateY(-50%);
}

.password-toggle:hover {
  background: #f1f5f9;
  color: #2563eb;
}

.password-hint {
  margin-top: 14px;
  padding: 12px 13px;
  display: flex;
  align-items: center;
  gap: 9px;
  border-radius: 11px;
  background: #ecfdf5;
  color: #047857;
  font-size: 9px;
}

/* =========================================
   XEM TRƯỚC
========================================= */

.preview-column {
  min-width: 0;
}

.preview-card {
  position: sticky;
  top: 20px;
  overflow: hidden;
}

.preview-background {
  height: 118px;
  position: relative;
  background: linear-gradient(
    135deg,
    #60a5fa,
    #2563eb
  );
}

.preview-background::before,
.preview-background::after {
  position: absolute;
  border-radius: 50%;
  background: rgb(255 255 255 / 13%);
  content: "";
}

.preview-background::before {
  width: 110px;
  height: 110px;
  top: -45px;
  right: -25px;
}

.preview-background::after {
  width: 75px;
  height: 75px;
  bottom: -36px;
  left: -14px;
}

.preview-avatar {
  width: 101px;
  height: 101px;
  position: absolute;
  left: 50%;
  bottom: -50px;
  z-index: 2;
  display: grid;
  place-items: center;
  border: 6px solid #fff;
  border-radius: 29px;
  background: linear-gradient(
    145deg,
    #dbeafe,
    #eff6ff
  );
  color: #2563eb;
  font-size: 28px;
  font-weight: 900;
  box-shadow:
    0 12px 26px
    rgb(15 23 42 / 16%);
  transform: translateX(-50%);
}

.preview-content {
  padding: 67px 22px 22px;
  text-align: center;
}

.preview-code {
  color: #3b82f6;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.7px;
  text-transform: uppercase;
}

.preview-content h2 {
  margin: 6px 0 11px;
  overflow-wrap: anywhere;
  color: #1e3a8a;
  font-size: 19px;
  font-weight: 900;
}

.preview-role {
  padding: 6px 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 900;
}

.preview-staff {
  background: #dbeafe;
  color: #1d4ed8;
}

.preview-admin {
  background: #ede9fe;
  color: #6d28d9;
}

.preview-information {
  margin-top: 21px;
  display: flex;
  flex-direction: column;
  gap: 9px;
  text-align: left;
}

.preview-information > div {
  min-width: 0;
  padding: 11px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 11px;
  background: #f8fafc;
}

.preview-information-icon {
  width: 35px;
  height: 35px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 9px;
  background: #e0edff;
  color: #2563eb;
}

.preview-information > div > div {
  min-width: 0;
}

.preview-information small,
.preview-information strong {
  display: block;
}

.preview-information small {
  margin-bottom: 3px;
  color: #94a3b8;
  font-size: 7px;
  font-weight: 800;
  text-transform: uppercase;
}

.preview-information strong {
  overflow: hidden;
  color: #334155;
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-actions {
  margin-top: 21px;
  display: grid;
  grid-template-columns:
    75px
    minmax(0, 1fr);
  gap: 9px;
}

.cancel-button,
.submit-button {
  min-height: 42px;
  padding: 0 12px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 7px;
  border-radius: 10px;
  font-size: 9px;
  font-weight: 900;
}

.cancel-button {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #64748b;
}

.submit-button {
  border: 0;
  background: #2563eb;
  color: #fff;
  box-shadow:
    0 7px 16px
    rgb(37 99 235 / 20%);
}

.cancel-button:hover:not(:disabled) {
  background: #f8fafc;
}

.submit-button:hover:not(:disabled) {
  background: #1d4ed8;
}

.cancel-button:disabled,
.submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

/* =========================================
   RESPONSIVE
========================================= */

@media (max-width: 1050px) {
  .form-layout {
    grid-template-columns: 1fr;
  }

  .preview-card {
    position: static;
  }
}

@media (max-width: 720px) {
  .form-grid,
  .role-options {
    grid-template-columns: 1fr;
  }

  .full-width {
    grid-column: auto;
  }
}

@media (max-width: 500px) {
  .header-card,
  .form-card,
  .preview-card {
    border-radius: 17px;
  }

  .header-card,
  .form-card {
    padding: 18px;
  }

  .header-card {
    align-items: flex-start;
  }

  .header-icon {
    width: 48px;
    height: 48px;
    border-radius: 13px;
    font-size: 20px;
  }

  .header-content h1 {
    font-size: 20px;
  }

  .preview-actions {
    grid-template-columns: 1fr;
  }

  .automatic-badge {
    display: none;
  }
}
</style>