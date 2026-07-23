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

import { readerApi } from "@/api/readerApi";
import { formatDateForInput } from "@/utils/date";
import { getErrorMessage } from "@/utils/error";

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const submitting = ref(false);
const errorMessage = ref("");

const isEditMode = computed(() =>
  Boolean(route.params.id),
);

const pageTitle = computed(() =>
  isEditMode.value
    ? "Cập nhật độc giả"
    : "Thêm độc giả",
);

const form = reactive({
  readerCode: "",
  firstName: "",
  lastName: "",
  birthday: "",
  gender: "Nam",
  phone: "",
  address: "",
  status: true,
});

function validateForm() {
  if (!form.readerCode.trim()) {
    return "Vui lòng nhập mã độc giả";
  }

  if (!form.lastName.trim()) {
    return "Vui lòng nhập họ độc giả";
  }

  if (!form.firstName.trim()) {
    return "Vui lòng nhập tên độc giả";
  }

  if (!form.birthday) {
    return "Vui lòng chọn ngày sinh";
  }

  const birthday = new Date(form.birthday);
  const today = new Date();

  birthday.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  if (birthday >= today) {
    return "Ngày sinh phải nhỏ hơn ngày hiện tại";
  }

  const normalizedPhone = form.phone.replace(
    /\s/g,
    "",
  );

  if (!/^[0-9]{9,11}$/.test(normalizedPhone)) {
    return "Số điện thoại phải gồm từ 9 đến 11 chữ số";
  }

  if (
    !["Nam", "Nữ", "Khác"].includes(form.gender)
  ) {
    return "Giới tính không hợp lệ";
  }

  return "";
}

async function loadReader() {
  if (!isEditMode.value) {
    return;
  }

  loading.value = true;

  try {
    const response = await readerApi.getById(
      route.params.id,
    );

    const reader = response.data.data;

    form.readerCode = reader.readerCode || "";
    form.firstName = reader.firstName || "";
    form.lastName = reader.lastName || "";
    form.birthday = formatDateForInput(
      reader.birthday,
    );
    form.gender = reader.gender || "Nam";
    form.phone = reader.phone || "";
    form.address = reader.address || "";
    form.status = reader.status ?? true;
  } catch (error) {
    errorMessage.value = getErrorMessage(
      error,
      "Không thể tải thông tin độc giả",
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
    readerCode: form.readerCode.trim(),
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    birthday: form.birthday,
    gender: form.gender,
    phone: form.phone.replace(/\s/g, ""),
    address: form.address.trim(),
  };

  if (isEditMode.value) {
    payload.status = form.status;
  }

  try {
    if (isEditMode.value) {
      await readerApi.update(
        route.params.id,
        payload,
      );
    } else {
      await readerApi.create(payload);
    }

    router.push({
      name: "readers",
    });
  } catch (error) {
    errorMessage.value = getErrorMessage(
      error,
      isEditMode.value
        ? "Không thể cập nhật độc giả"
        : "Không thể thêm độc giả",
    );
  } finally {
    submitting.value = false;
  }
}

onMounted(loadReader);
</script>

<template>
  <section class="reader-form-page">
    <button
      type="button"
      class="back-button"
      @click="router.push('/readers')"
    >
      ← Quay lại danh sách
    </button>

    <header class="page-header">
      <h1>{{ pageTitle }}</h1>

      <p>
        Nhập đầy đủ thông tin của độc giả.
      </p>
    </header>

    <p v-if="loading">
      Đang tải thông tin độc giả...
    </p>

    <form
      v-else
      class="reader-form"
      @submit.prevent="handleSubmit"
    >
      <p
        v-if="errorMessage"
        class="error-message"
      >
        {{ errorMessage }}
      </p>

      <div class="form-grid">
        <div class="form-group">
          <label for="readerCode">
            Mã độc giả <span>*</span>
          </label>

          <input
            id="readerCode"
            v-model="form.readerCode"
            type="text"
            placeholder="Ví dụ: DG001"
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
            placeholder="Ví dụ: 0901234567"
          />
        </div>

        <div class="form-group">
          <label for="lastName">
            Họ <span>*</span>
          </label>

          <input
            id="lastName"
            v-model="form.lastName"
            type="text"
            placeholder="Ví dụ: Nguyễn Văn"
          />
        </div>

        <div class="form-group">
          <label for="firstName">
            Tên <span>*</span>
          </label>

          <input
            id="firstName"
            v-model="form.firstName"
            type="text"
            placeholder="Ví dụ: An"
          />
        </div>

        <div class="form-group">
          <label for="birthday">
            Ngày sinh <span>*</span>
          </label>

          <input
            id="birthday"
            v-model="form.birthday"
            type="date"
          />
        </div>

        <div class="form-group">
          <label for="gender">
            Giới tính <span>*</span>
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
          <label for="address">Địa chỉ</label>

          <textarea
            id="address"
            v-model="form.address"
            rows="4"
            placeholder="Nhập địa chỉ độc giả"
          />
        </div>

        <div
          v-if="isEditMode"
          class="form-group full-width"
        >
          <label class="checkbox-label">
            <input
              v-model="form.status"
              type="checkbox"
            />

            Tài khoản độc giả đang hoạt động
          </label>
        </div>
      </div>

      <div class="form-actions">
        <button
          type="button"
          class="cancel-button"
          @click="router.push('/readers')"
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
                ? "Cập nhật độc giả"
                : "Thêm độc giả"
          }}
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.reader-form-page {
  max-width: 900px;
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

.reader-form {
  padding: 26px;
  border-radius: 11px;
  background: white;
  box-shadow: 0 5px 20px rgb(0 0 0 / 6%);
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

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 9px;
}

.checkbox-label input {
  width: auto;
}

.form-actions {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  gap: 11px;
}

.form-actions button {
  padding: 11px 19px;
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
  .reader-form {
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