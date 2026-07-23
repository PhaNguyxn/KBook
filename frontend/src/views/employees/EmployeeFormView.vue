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

const loading = ref(false);
const submitting = ref(false);
const errorMessage = ref("");
const employeeId = ref("");

const isEditMode = computed(() =>
  Boolean(route.params.id),
);

const isCurrentEmployee = computed(() => {
  return (
    isEditMode.value &&
    employeeId.value === authStore.employee?._id
  );
});

const pageTitle = computed(() =>
  isEditMode.value
    ? "Cập nhật nhân viên"
    : "Thêm nhân viên",
);

const form = reactive({
  employeeCode: "",
  fullName: "",
  email: "",
  phone: "",
  birthday: "",
  gender: "Nam",
  address: "",
  role: "staff",
  status: true,
  password: "",
  confirmPassword: "",
});

function validateForm() {
  if (!form.employeeCode.trim()) {
    return "Vui lòng nhập mã nhân viên";
  }

  if (!form.fullName.trim()) {
    return "Vui lòng nhập họ và tên";
  }

  if (!form.email.trim()) {
    return "Vui lòng nhập email";
  }

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(form.email.trim())) {
    return "Email không hợp lệ";
  }

  const normalizedPhone = form.phone.replace(
    /\s/g,
    "",
  );

  if (!/^[0-9]{9,11}$/.test(normalizedPhone)) {
    return "Số điện thoại phải gồm từ 9 đến 11 chữ số";
  }

  if (
    !["admin", "staff"].includes(form.role)
  ) {
    return "Vai trò không hợp lệ";
  }

  if (
    !["Nam", "Nữ", "Khác"].includes(form.gender)
  ) {
    return "Giới tính không hợp lệ";
  }

  if (!isEditMode.value && !form.password) {
    return "Vui lòng nhập mật khẩu";
  }

  if (
    form.password &&
    form.password.length < 6
  ) {
    return "Mật khẩu phải có ít nhất 6 ký tự";
  }

  if (
    form.password !== form.confirmPassword
  ) {
    return "Mật khẩu xác nhận không khớp";
  }

  if (form.birthday) {
    const birthday = new Date(form.birthday);
    const today = new Date();

    if (
      Number.isNaN(birthday.getTime()) ||
      birthday >= today
    ) {
      return "Ngày sinh không hợp lệ";
    }
  }

  if (
    isCurrentEmployee.value &&
    form.status === false
  ) {
    return "Bạn không thể tự khóa tài khoản của mình";
  }

  if (
    isCurrentEmployee.value &&
    form.role === "staff"
  ) {
    return "Bạn không thể tự hạ quyền của mình";
  }

  return "";
}

async function loadEmployee() {
  if (!isEditMode.value) {
    return;
  }

  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await employeeApi.getById(
      route.params.id,
    );

    const employee = response.data.data;

    employeeId.value = employee._id;

    form.employeeCode =
      employee.employeeCode || "";

    form.fullName = employee.fullName || "";
    form.email = employee.email || "";
    form.phone = employee.phone || "";

    form.birthday = formatDateForInput(
      employee.birthday,
    );

    form.gender = employee.gender || "Nam";
    form.address = employee.address || "";
    form.role = employee.role || "staff";
    form.status = employee.status ?? true;
  } catch (error) {
    errorMessage.value = getErrorMessage(
      error,
      "Không thể tải thông tin nhân viên",
    );
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  errorMessage.value = validateForm();

  if (errorMessage.value) {
    return;
  }

  submitting.value = true;

  const payload = {
    employeeCode: form.employeeCode
      .trim()
      .toUpperCase(),

    fullName: form.fullName.trim(),

    email: form.email
      .trim()
      .toLowerCase(),

    phone: form.phone.replace(/\s/g, ""),
    birthday: form.birthday || null,
    gender: form.gender,
    address: form.address.trim(),
    role: form.role,
  };

  if (isEditMode.value) {
    payload.status = form.status;
  }

  if (form.password) {
    payload.password = form.password;
  }

  try {
    if (isEditMode.value) {
      const response = await employeeApi.update(
        route.params.id,
        payload,
      );

      /*
       * Nếu admin sửa chính tài khoản của mình,
       * cập nhật lại dữ liệu localStorage.
       */
      if (isCurrentEmployee.value) {
        authStore.employee = response.data.data;

        localStorage.setItem(
          "employee",
          JSON.stringify(response.data.data),
        );
      }
    } else {
      await employeeApi.create(payload);
    }

    router.push({
      name: "employees",
    });
  } catch (error) {
    errorMessage.value = getErrorMessage(
      error,
      isEditMode.value
        ? "Không thể cập nhật nhân viên"
        : "Không thể thêm nhân viên",
    );
  } finally {
    submitting.value = false;
  }
}

onMounted(loadEmployee);
</script>

<template>
  <section class="employee-form-page">
    <button
      type="button"
      class="back-button"
      @click="router.push('/employees')"
    >
      ← Quay lại danh sách
    </button>

    <header class="page-header">
      <h1>{{ pageTitle }}</h1>

      <p>
        Nhập thông tin tài khoản và phân quyền cho
        nhân viên.
      </p>
    </header>

    <p v-if="loading">
      Đang tải thông tin nhân viên...
    </p>

    <form
      v-else
      class="employee-form"
      @submit.prevent="handleSubmit"
    >
      <p
        v-if="errorMessage"
        class="error-message"
      >
        {{ errorMessage }}
      </p>

      <div class="form-section">
        <h2>Thông tin tài khoản</h2>

        <div class="form-grid">
          <div class="form-group">
            <label for="employeeCode">
              Mã nhân viên <span>*</span>
            </label>

            <input
              id="employeeCode"
              v-model="form.employeeCode"
              type="text"
              placeholder="Ví dụ: NV001"
            />
          </div>

          <div class="form-group">
            <label for="fullName">
              Họ và tên <span>*</span>
            </label>

            <input
              id="fullName"
              v-model="form.fullName"
              type="text"
              placeholder="Nhập họ và tên"
            />
          </div>

          <div class="form-group">
            <label for="email">
              Email <span>*</span>
            </label>

            <input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="example@gmail.com"
            />
          </div>

          <div class="form-group">
            <label for="phone">
              Số điện thoại <span>*</span>
            </label>

            <input
              id="phone"
              v-model="form.phone"
              type="tel"
              placeholder="0901234567"
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
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          <div class="form-group full-width">
            <label for="address">
              Địa chỉ
            </label>

            <textarea
              id="address"
              v-model="form.address"
              rows="4"
              placeholder="Nhập địa chỉ nhân viên"
            />
          </div>
        </div>
      </div>

      <div class="form-section">
        <h2>Phân quyền và đăng nhập</h2>

        <div class="form-grid">
          <div class="form-group">
            <label for="role">
              Vai trò <span>*</span>
            </label>

            <select
              id="role"
              v-model="form.role"
              :disabled="isCurrentEmployee"
            >
              <option value="staff">
                Nhân viên
              </option>

              <option value="admin">
                Quản trị viên
              </option>
            </select>

            <small v-if="isCurrentEmployee">
              Bạn không thể tự hạ quyền của mình.
            </small>
          </div>

          <div
            v-if="isEditMode"
            class="form-group"
          >
            <label>Trạng thái</label>

            <label class="checkbox-label">
              <input
                v-model="form.status"
                type="checkbox"
                :disabled="isCurrentEmployee"
              />

              Tài khoản đang hoạt động
            </label>

            <small v-if="isCurrentEmployee">
              Bạn không thể tự khóa tài khoản.
            </small>
          </div>

          <div class="form-group">
            <label for="password">
              {{
                isEditMode
                  ? "Mật khẩu mới"
                  : "Mật khẩu"
              }}
              <span v-if="!isEditMode">*</span>
            </label>

            <input
              id="password"
              v-model="form.password"
              type="password"
              autocomplete="new-password"
              :placeholder="
                isEditMode
                  ? 'Để trống nếu không đổi mật khẩu'
                  : 'Nhập mật khẩu'
              "
            />
          </div>

          <div class="form-group">
            <label for="confirmPassword">
              Xác nhận mật khẩu
              <span v-if="!isEditMode">*</span>
            </label>

            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              autocomplete="new-password"
              placeholder="Nhập lại mật khẩu"
            />
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button
          type="button"
          class="cancel-button"
          @click="router.push('/employees')"
        >
          Hủy
        </button>

        <button
          type="submit"
          class="submit-button"
          :disabled="submitting"
        >
          {{
            submitting
              ? "Đang lưu..."
              : isEditMode
                ? "Cập nhật nhân viên"
                : "Thêm nhân viên"
          }}
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.employee-form-page {
  max-width: 950px;
  margin: 0 auto;
}

.back-button {
  padding: 0;
  border: 0;
  background: transparent;
  color: #2563eb;
  cursor: pointer;
}

.page-header {
  margin: 18px 0 22px;
}

.page-header h1 {
  margin-bottom: 6px;
}

.page-header p {
  margin: 0;
  color: #6b7280;
}

.employee-form {
  padding: 26px;
  border-radius: 11px;
  background: white;
  box-shadow: 0 5px 20px rgb(0 0 0 / 6%);
}

.form-section + .form-section {
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.form-section h2 {
  margin-top: 0;
  font-size: 19px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}

.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  display: block;
  margin-bottom: 7px;
  font-weight: 600;
}

.form-group label span {
  color: #dc2626;
}

.form-group small {
  display: block;
  margin-top: 6px;
  color: #6b7280;
}

input,
select,
textarea {
  width: 100%;
  padding: 11px 12px;
  border: 1px solid #d1d5db;
  border-radius: 7px;
  box-sizing: border-box;
  font: inherit;
}

textarea {
  resize: vertical;
}

input:disabled,
select:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 9px;
  min-height: 43px;
}

.checkbox-label input {
  width: auto;
}

.form-actions {
  margin-top: 28px;
  display: flex;
  justify-content: flex-end;
  gap: 11px;
}

.form-actions button {
  padding: 11px 20px;
  border-radius: 7px;
  cursor: pointer;
}

.cancel-button {
  border: 1px solid #d1d5db;
  background: white;
}

.submit-button {
  border: 0;
  background: #2563eb;
  color: white;
}

.submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.error-message {
  margin-top: 0;
  padding: 12px 14px;
  border-radius: 7px;
  background: #fee2e2;
  color: #b91c1c;
}

@media (max-width: 650px) {
  .employee-form {
    padding: 18px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .full-width {
    grid-column: auto;
  }
}
</style>