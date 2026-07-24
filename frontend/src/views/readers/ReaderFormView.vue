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

/* =========================================
   STATE
========================================= */

const loading = ref(false);
const submitting = ref(false);
const errorMessage = ref("");

const form = reactive({
  readerCode: "",
  firstName: "",
  lastName: "",
  birthday: "",
  gender: "Nam",
  phone: "",
  address: "",
});

/* =========================================
   COMPUTED
========================================= */

const isEditMode = computed(() => {
  return Boolean(route.params.id);
});

const pageTitle = computed(() => {
  return isEditMode.value
    ? "Cập nhật độc giả"
    : "Thêm độc giả mới";
});

const pageDescription = computed(() => {
  return isEditMode.value
    ? "Chỉnh sửa và cập nhật thông tin của độc giả."
    : "Nhập đầy đủ thông tin độc giả vào biểu mẫu bên dưới.";
});

const fullName = computed(() => {
  const value = `${
    form.lastName || ""
  } ${form.firstName || ""}`.trim();

  return value || "Tên độc giả";
});

const readerInitials = computed(() => {
  const lastName = String(
    form.lastName || "",
  ).trim();

  const firstName = String(
    form.firstName || "",
  ).trim();

  const initials = `${
    lastName.charAt(0)
  }${firstName.charAt(0)}`.toUpperCase();

  return initials || "ĐG";
});

const formattedPhone = computed(() => {
  return (
    form.phone.trim() ||
    "Chưa nhập số điện thoại"
  );
});

const today = computed(() => {
  const currentDate = new Date();

  const year =
    currentDate.getFullYear();

  const month = String(
    currentDate.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    currentDate.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
});

/* =========================================
   HÀM HỖ TRỢ
========================================= */

function goBack() {
  router.push({
    name: "readers",
  });
}

function normalizePhone(value) {
  return String(value || "").replace(
    /\s/g,
    "",
  );
}

function validateForm() {
  if (!form.lastName.trim()) {
    return "Vui lòng nhập họ độc giả";
  }

  if (!form.firstName.trim()) {
    return "Vui lòng nhập tên độc giả";
  }

  if (!form.birthday) {
    return "Vui lòng chọn ngày sinh";
  }

  const birthday =
    new Date(form.birthday);

  const currentDate =
    new Date();

  birthday.setHours(0, 0, 0, 0);
  currentDate.setHours(0, 0, 0, 0);

  if (
    Number.isNaN(
      birthday.getTime(),
    )
  ) {
    return "Ngày sinh không hợp lệ";
  }

  if (birthday >= currentDate) {
    return "Ngày sinh phải nhỏ hơn ngày hiện tại";
  }

  const phone =
    normalizePhone(form.phone);

  if (!phone) {
    return "Vui lòng nhập số điện thoại";
  }

  if (
    !/^[0-9]{9,11}$/.test(phone)
  ) {
    return "Số điện thoại phải gồm từ 9 đến 11 chữ số";
  }

  if (
    ![
      "Nam",
      "Nữ",
      "Khác",
    ].includes(form.gender)
  ) {
    return "Giới tính không hợp lệ";
  }

  return "";
}

/* =========================================
   TẢI THÔNG TIN ĐỘC GIẢ
========================================= */

async function loadReader() {
  if (!isEditMode.value) {
    return;
  }

  loading.value = true;
  errorMessage.value = "";

  try {
    const response =
      await readerApi.getById(
        route.params.id,
      );

    const reader =
      response?.data?.data ||
      response?.data;

    if (!reader) {
      throw new Error(
        "Không tìm thấy thông tin độc giả",
      );
    }

    form.readerCode =
      reader.readerCode || "";

    form.firstName =
      reader.firstName || "";

    form.lastName =
      reader.lastName || "";

    form.birthday =
      formatDateForInput(
        reader.birthday,
      );

    form.gender =
      reader.gender || "Nam";

    form.phone =
      reader.phone || "";

    form.address =
      reader.address || "";

  } catch (error) {
    errorMessage.value =
      getErrorMessage(
        error,
        "Không thể tải thông tin độc giả",
      );
  } finally {
    loading.value = false;
  }
}

/* =========================================
   GỬI BIỂU MẪU
========================================= */

async function handleSubmit() {
  errorMessage.value = "";

  const validationError =
    validateForm();

  if (validationError) {
    errorMessage.value =
      validationError;

    return;
  }

  submitting.value = true;

  const payload = {
    firstName:
      form.firstName.trim(),

    lastName:
      form.lastName.trim(),

    birthday:
      form.birthday,

    gender:
      form.gender,

    phone:
      normalizePhone(
        form.phone,
      ),

    address:
      form.address.trim(),
  };

  try {
    if (isEditMode.value) {
      await readerApi.update(
        route.params.id,
        payload,
      );
    } else {
      await readerApi.create(
        payload,
      );
    }

    await router.push({
      name: "readers",
    });
  } catch (error) {
    errorMessage.value =
      getErrorMessage(
        error,
        isEditMode.value
          ? "Không thể cập nhật độc giả"
          : "Không thể thêm độc giả",
      );
  } finally {
    submitting.value = false;
  }
}

/* =========================================
   KHỞI TẠO
========================================= */

onMounted(() => {
  loadReader();
});
</script>

<template>
  <section class="reader-form-page">
    <!-- Tiêu đề -->
    <div class="form-header">
      <div>
        <button
          type="button"
          class="back-button"
          @click="goBack"
        >
          <i
            class="bi bi-arrow-left"
          />

          Quay lại
        </button>

        <h1>{{ pageTitle }}</h1>

        <p>
          {{ pageDescription }}
        </p>
      </div>
    </div>

    <!-- Thông báo lỗi -->
    <div
      v-if="errorMessage"
      class="alert alert-danger"
      role="alert"
    >
      <i
        class="bi bi-exclamation-circle-fill me-2"
      />

      {{ errorMessage }}
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="form-card loading-state"
    >
      <div
        class="spinner-border text-primary"
        role="status"
      />

      <span>
        Đang tải thông tin độc giả...
      </span>
    </div>

    <!-- Form -->
    <form
      v-else
      class="form-layout"
      @submit.prevent="handleSubmit"
    >
      <!-- Nội dung chính -->
      <div class="form-card main-form">
        <div class="section-heading">
          <div class="section-icon">
            <i
              class="bi bi-person-vcard"
            />
          </div>

          <div>
            <h2>
              Thông tin độc giả
            </h2>

            <p>
              Các trường có dấu
              <span>*</span>
              là bắt buộc.
            </p>
          </div>
        </div>

        <div class="form-grid">
          <!-- Họ -->
          <div class="form-group">
            <label for="lastName">
              Họ và tên đệm
              <span>*</span>
            </label>

            <div
              class="input-icon-wrapper"
            >
              <i
                class="bi bi-person"
              />

              <input
                id="lastName"
                v-model="
                  form.lastName
                "
                type="text"
                placeholder="Ví dụ: Nguyễn Văn"
                autocomplete="family-name"
              />
            </div>
          </div>

          <!-- Tên -->
          <div class="form-group">
            <label for="firstName">
              Tên
              <span>*</span>
            </label>

            <div
              class="input-icon-wrapper"
            >
              <i
                class="bi bi-person"
              />

              <input
                id="firstName"
                v-model="
                  form.firstName
                "
                type="text"
                placeholder="Ví dụ: An"
                autocomplete="given-name"
              />
            </div>
          </div>
          
          <!-- Số điện thoại -->
          <div class="form-group">
            <label for="phone">
              Số điện thoại
              <span>*</span>
            </label>

            <div
              class="input-icon-wrapper"
            >
              <i
                class="bi bi-telephone"
              />

              <input
                id="phone"
                v-model="form.phone"
                type="tel"
                inputmode="numeric"
                maxlength="11"
                placeholder="Ví dụ: 0901234567"
                autocomplete="tel"
              />
            </div>
          </div>

          <!-- Ngày sinh -->
          <div class="form-group">
            <label for="birthday">
              Ngày sinh
              <span>*</span>
            </label>

            <div
              class="input-icon-wrapper"
            >
              <i
                class="bi bi-calendar3"
              />

              <input
                id="birthday"
                v-model="
                  form.birthday
                "
                type="date"
                :max="today"
              />
            </div>
          </div>

          <!-- Giới tính -->
          <div class="form-group">
            <label for="gender">
              Giới tính
              <span>*</span>
            </label>

            <div
              class="input-icon-wrapper"
            >
              <i
                class="bi bi-gender-ambiguous"
              />

              <select
                id="gender"
                v-model="
                  form.gender
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
          </div>

          <!-- Địa chỉ -->
          <div
            class="form-group full-width"
          >
            <label for="address">
              Địa chỉ
            </label>

            <div
              class="textarea-wrapper"
            >
              <i
                class="bi bi-geo-alt"
              />

              <textarea
                id="address"
                v-model="
                  form.address
                "
                rows="5"
                placeholder="Nhập địa chỉ của độc giả"
                autocomplete="street-address"
              />
            </div>
          </div>

        </div>
      </div>

      <!-- Thanh bên -->
      <aside
        class="form-card preview-card"
      >
        <h2>
          Thông tin xem trước
        </h2>

        <div
          class="reader-preview"
        >
          <div
            class="reader-avatar"
          >
            {{ readerInitials }}
          </div>

          <h3>
            {{ fullName }}
          </h3>

          <span
            class="reader-code-preview"
          >
            {{
              form.readerCode ||
              "CHƯA CÓ MÃ"
            }}
          </span>

          <div
            class="reader-preview-details"
          >
            <div>
              <i
                class="bi bi-telephone"
              />

              <span>
                {{ formattedPhone }}
              </span>
            </div>

            <div>
              <i
                class="bi bi-calendar3"
              />

              <span>
                {{
                  form.birthday ||
                  "Chưa chọn ngày sinh"
                }}
              </span>
            </div>

            <div>
              <i
                class="bi bi-gender-ambiguous"
              />

              <span>
                {{ form.gender }}
              </span>
            </div>

            <div>
              <i
                class="bi bi-geo-alt"
              />

              <span>
                {{
                  form.address ||
                  "Chưa nhập địa chỉ"
                }}
              </span>
            </div>
          </div>

        </div>

        <div class="information-note">
          <i
            class="bi bi-info-circle"
          />

          <p>
            Kiểm tra kỹ thông tin trước
            khi lưu.
          </p>
        </div>

        <div class="form-actions">
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
            class="save-button"
            :disabled="
              submitting ||
              loading
            "
          >
            <span
              v-if="submitting"
              class="spinner-border spinner-border-sm"
            />

            <i
              v-else
              class="bi bi-floppy"
            />

            {{
              submitting
                ? "Đang lưu..."
                : isEditMode
                  ? "Cập nhật"
                  : "Thêm độc giả"
            }}
          </button>
        </div>
      </aside>
    </form>
  </section>
</template>

<style scoped>
.reader-form-page {
  width: 100%;
  max-width: 1450px;
  min-width: 0;
  margin: 0 auto;
}

/* =========================================
   TIÊU ĐỀ
========================================= */

.form-header,
.form-card {
  border: 1px solid #e5edf7;
  border-radius: 20px;
  background: #fff;
  box-shadow:
    0 10px 28px
    rgb(15 23 42 / 6%);
}

.form-header {
  margin-bottom: 22px;
  padding: 26px 30px;
}

.form-header h1 {
  margin: 12px 0 5px;
  color: #1f4fbf;
  font-size: 30px;
  font-weight: 800;
}

.form-header p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.back-button {
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 0;
  background: transparent;
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.back-button:hover {
  color: #1d4ed8;
}

/* =========================================
   BỐ CỤC
========================================= */

.form-layout {
  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    340px;
  align-items: start;
  gap: 22px;
}

.form-card {
  min-width: 0;
  padding: 26px;
}

.form-card h2 {
  margin: 0;
  color: #1e3a8a;
  font-size: 20px;
  font-weight: 800;
}

.section-heading {
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 13px;
}

.section-heading p {
  margin: 5px 0 0;
  color: #94a3b8;
  font-size: 12px;
}

.section-heading p span {
  color: #dc2626;
}

.section-icon {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 13px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 21px;
}

/* =========================================
   FORM
========================================= */

.form-grid {
  display: grid;
  grid-template-columns:
    repeat(
      2,
      minmax(0, 1fr)
    );
  gap: 18px;
}

.form-group {
  min-width: 0;
}

.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  margin-bottom: 7px;
  display: block;
  color: #475569;
  font-size: 13px;
  font-weight: 700;
}

.form-group label span {
  color: #dc2626;
}

.input-icon-wrapper,
.textarea-wrapper {
  position: relative;
}

.input-icon-wrapper > i,
.textarea-wrapper > i {
  position: absolute;
  left: 14px;
  z-index: 1;
  color: #94a3b8;
  pointer-events: none;
}

.input-icon-wrapper > i {
  top: 50%;
  transform: translateY(-50%);
}

.textarea-wrapper > i {
  top: 15px;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid #dbe4ef;
  border-radius: 10px;
  background: #fff;
  color: #334155;
  font: inherit;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

input,
select {
  height: 44px;
  padding: 0 13px 0 40px;
}

textarea {
  min-height: 125px;
  padding: 13px 13px 13px 40px;
  line-height: 1.6;
  resize: vertical;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #60a5fa;
  box-shadow:
    0 0 0 3px
    rgb(59 130 246 / 12%);
}

input::placeholder,
textarea::placeholder {
  color: #a0aec0;
}

.field-note {
  margin-top: 6px;
  display: block;
  color: #94a3b8;
  font-size: 11px;
  line-height: 1.5;
}

/* =========================================
   KHUNG XEM TRƯỚC
========================================= */

.preview-card {
  position: sticky;
  top: 20px;
}

.preview-card > h2 {
  margin-bottom: 22px;
}

.reader-preview {
  padding: 23px 18px;
  display: flex;
  align-items: center;
  flex-direction: column;
  border: 1px solid #e0e7ff;
  border-radius: 17px;
  background: linear-gradient(
    145deg,
    #f8fbff,
    #eef5ff
  );
  text-align: center;
}

.reader-avatar {
  width: 92px;
  height: 92px;
  display: grid;
  place-items: center;
  border: 5px solid #fff;
  border-radius: 26px;
  background: linear-gradient(
    135deg,
    #60a5fa,
    #2563eb
  );
  color: #fff;
  font-size: 27px;
  font-weight: 800;
  box-shadow:
    0 12px 25px
    rgb(37 99 235 / 24%);
}

.reader-preview h3 {
  max-width: 100%;
  margin: 16px 0 5px;
  overflow-wrap: anywhere;
  color: #1e3a8a;
  font-size: 19px;
  font-weight: 800;
}

.reader-code-preview {
  color: #3b82f6;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.7px;
}

.reader-preview-details {
  width: 100%;
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 9px;
  text-align: left;
}

.reader-preview-details div {
  min-width: 0;
  padding: 10px 11px;
  display: flex;
  align-items: flex-start;
  gap: 9px;
  border-radius: 9px;
  background: rgb(
    255 255 255 / 75%
  );
}

.reader-preview-details i {
  margin-top: 2px;
  flex-shrink: 0;
  color: #3b82f6;
}

.reader-preview-details span {
  min-width: 0;
  overflow-wrap: anywhere;
  color: #64748b;
  font-size: 11px;
  line-height: 1.5;
}

.information-note {
  margin-top: 18px;
  padding: 13px;
  display: flex;
  align-items: flex-start;
  gap: 9px;
  border-radius: 11px;
  background: #fffbeb;
  color: #92400e;
}

.information-note i {
  margin-top: 2px;
  flex-shrink: 0;
}

.information-note p {
  margin: 0;
  font-size: 11px;
  line-height: 1.6;
}

/* =========================================
   NÚT HÀNH ĐỘNG
========================================= */

.form-actions {
  margin-top: 24px;
  display: flex;
  gap: 10px;
}

.cancel-button,
.save-button {
  min-height: 44px;
  padding: 0 15px;
  flex: 1;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 7px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.cancel-button {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #64748b;
}

.cancel-button:hover:not(
    :disabled
  ) {
  border-color: #93c5fd;
  background: #eff6ff;
  color: #2563eb;
}

.save-button {
  border: 0;
  background: linear-gradient(
    135deg,
    #438df8,
    #2563eb
  );
  color: #fff;
  box-shadow:
    0 7px 16px
    rgb(37 99 235 / 20%);
}

.save-button:hover:not(
    :disabled
  ) {
  transform: translateY(-1px);
  box-shadow:
    0 10px 20px
    rgb(37 99 235 / 26%);
}

.cancel-button:disabled,
.save-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
}

/* =========================================
   LOADING
========================================= */

.loading-state {
  min-height: 280px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  color: #64748b;
}

/* =========================================
   RESPONSIVE
========================================= */

@media (max-width: 1000px) {
  .form-layout {
    grid-template-columns: 1fr;
  }

  .preview-card {
    position: static;
    order: -1;
  }

  .reader-preview {
    max-width: 440px;
    margin: 0 auto;
  }
}

@media (max-width: 650px) {
  .reader-form-page {
    width: 100%;
  }

  .form-header,
  .form-card {
    padding: 20px;
    border-radius: 17px;
  }

  .form-header h1 {
    font-size: 25px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .full-width {
    grid-column: auto;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .cancel-button,
  .save-button {
    width: 100%;
  }

}
</style>