<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
} from "vue";

import {
  useRoute,
  useRouter,
} from "vue-router";

import { bookApi } from "@/api/bookApi";
import { getErrorMessage } from "@/utils/error";

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const submitting = ref(false);
const errorMessage = ref("");

const selectedImage = ref(null);
const previewUrl = ref("");
const currentImage = ref("");

const currentYear =
  new Date().getFullYear();

const form = reactive({
  title: "",
  author: "",
  category: "",
  publisherName: "",
  price: 0,
  publishYear: "",
  quantity: 1,
  image: "",
  description: "",
});

const isEditing = computed(() => {
  return Boolean(route.params.id);
});

const pageTitle = computed(() => {
  return isEditing.value
    ? "Cập nhật sách"
    : "Thêm sách mới";
});

function getImageUrl(value) {
  if (!value) {
    return "";
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("blob:") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  const serverUrl =
    import.meta.env.VITE_SERVER_URL ||
    "http://localhost:3000";

  return `${serverUrl}/${value.replace(
    /^\/+/,
    "",
  )}`;
}

const displayedImage = computed(() => {
  if (previewUrl.value) {
    return previewUrl.value;
  }

  if (form.image) {
    return getImageUrl(form.image);
  }

  return getImageUrl(
    currentImage.value,
  );
});

async function loadBook() {
  if (!isEditing.value) {
    return;
  }

  loading.value = true;
  errorMessage.value = "";

  try {
    const response =
      await bookApi.getById(
        route.params.id,
      );

    const book =
      response?.data?.data ||
      response?.data;

    if (!book) {
      throw new Error(
        "Không tìm thấy thông tin sách",
      );
    }

    form.title =
      book.title || "";

    form.author =
      book.author || "";

    form.category =
      book.category || "";

    /*
     * Backend trả về publisher đã populate:
     *
     * publisher: {
     *   _id: "...",
     *   publisherName: "NXB Trẻ"
     * }
     */
    form.publisherName =
      typeof book.publisher ===
      "object"
        ? book.publisher
            ?.publisherName || ""
        : "";

    form.price =
      Number(book.price) || 0;

    form.publishYear =
      book.publishYear || "";

    form.quantity =
      Number(book.quantity) || 0;

    form.description =
      book.description || "";

    currentImage.value =
      book.image || "";

    /*
     * Xóa URL nhập tay vì ảnh hiện tại
     * đã được lưu trong currentImage.
     */
    form.image = "";
  } catch (error) {
    errorMessage.value =
      getErrorMessage(
        error,
        "Không thể tải thông tin sách",
      );
  } finally {
    loading.value = false;
  }
}

function handleImageChange(event) {
  const file =
    event.target.files?.[0];

  if (!file) {
    return;
  }

  errorMessage.value = "";

  if (
    !file.type.startsWith("image/")
  ) {
    errorMessage.value =
      "Vui lòng chọn file ảnh";

    event.target.value = "";
    return;
  }

  if (
    file.size >
    5 * 1024 * 1024
  ) {
    errorMessage.value =
      "Ảnh không được lớn hơn 5 MB";

    event.target.value = "";
    return;
  }

  if (previewUrl.value) {
    URL.revokeObjectURL(
      previewUrl.value,
    );
  }

  selectedImage.value = file;

  previewUrl.value =
    URL.createObjectURL(file);
}

function validateForm() {
  if (!form.title.trim()) {
    return "Vui lòng nhập tên sách";
  }

  if (!form.author.trim()) {
    return "Vui lòng nhập tác giả";
  }

  if (!form.category.trim()) {
    return "Vui lòng nhập thể loại";
  }

  if (
    !form.publisherName.trim()
  ) {
    return "Vui lòng nhập tên nhà xuất bản";
  }

  if (
    form.price === "" ||
    form.price === null ||
    form.price === undefined
  ) {
    return "Vui lòng nhập đơn giá";
  }

  const price =
    Number(form.price);

  if (
    !Number.isFinite(price) ||
    price < 0
  ) {
    return "Đơn giá không hợp lệ";
  }

  if (
    form.publishYear === "" ||
    form.publishYear === null ||
    form.publishYear === undefined
  ) {
    return "Vui lòng nhập năm xuất bản";
  }

  const publishYear =
    Number(form.publishYear);

  if (
    !Number.isInteger(
      publishYear,
    ) ||
    publishYear < 1000 ||
    publishYear > currentYear
  ) {
    return `Năm xuất bản phải từ 1000 đến ${currentYear}`;
  }

  const quantity =
    Number(form.quantity);

  if (
    !Number.isInteger(quantity) ||
    quantity < 0
  ) {
    return "Số lượng sách phải là số nguyên không âm";
  }

  return "";
}

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

  try {
    const payload =
      new FormData();

    payload.append(
      "title",
      form.title.trim(),
    );

    payload.append(
      "author",
      form.author.trim(),
    );

    payload.append(
      "category",
      form.category.trim(),
    );

    payload.append(
      "publisherName",
      form.publisherName.trim(),
    );

    payload.append(
      "price",
      String(form.price),
    );

    payload.append(
      "publishYear",
      String(form.publishYear),
    );

    payload.append(
      "quantity",
      String(form.quantity),
    );

    payload.append(
      "description",
      form.description.trim(),
    );

    /*
     * Chỉ gửi URL ảnh khi người dùng
     * thực sự nhập một URL mới.
     */
    if (form.image.trim()) {
      payload.append(
        "image",
        form.image.trim(),
      );
    }

    /*
     * Tên field phải trùng với multer:
     * bookUpload.single("imageFile")
     */
    if (selectedImage.value) {
      payload.append(
        "imageFile",
        selectedImage.value,
      );
    }

    if (isEditing.value) {
      await bookApi.update(
        route.params.id,
        payload,
      );
    } else {
      await bookApi.create(
        payload,
      );
    }

    await router.push(
      "/books",
    );
  } catch (error) {
    errorMessage.value =
      getErrorMessage(
        error,
        isEditing.value
          ? "Không thể cập nhật sách"
          : "Không thể thêm sách",
      );
  } finally {
    submitting.value = false;
  }
}

function goBack() {
  router.push("/books");
}

onMounted(() => {
  loadBook();
});

onBeforeUnmount(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(
      previewUrl.value,
    );
  }
});
</script>

<template>
  <section class="book-form-page">
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
          Nhập đầy đủ thông tin sách vào
          biểu mẫu bên dưới.
        </p>
      </div>
    </div>

    <div
      v-if="errorMessage"
      class="alert alert-danger"
    >
      {{ errorMessage }}
    </div>

    <div
      v-if="loading"
      class="form-card loading-state"
    >
      <div
        class="spinner-border text-primary"
      />

      <span>
        Đang tải thông tin sách...
      </span>
    </div>

    <form
      v-else
      class="form-layout"
      @submit.prevent="handleSubmit"
    >
      <div class="form-card main-form">
        <h2>Thông tin sách</h2>

        <div class="form-grid">
          <div>
            <label for="bookTitle">
              Tên sách
              <span>*</span>
            </label>

            <input
              id="bookTitle"
              v-model="form.title"
              type="text"
              placeholder="Nhập tên sách"
            />
          </div>

          <div>
            <label for="bookAuthor">
              Tác giả
              <span>*</span>
            </label>

            <input
              id="bookAuthor"
              v-model="form.author"
              type="text"
              placeholder="Nhập tên tác giả"
            />
          </div>

          <div>
            <label for="bookCategory">
              Thể loại
              <span>*</span>
            </label>

            <input
              id="bookCategory"
              v-model="form.category"
              type="text"
              placeholder="Ví dụ: Công nghệ"
            />
          </div>

          <div>
            <label
              for="publisherName"
            >
              Nhà xuất bản
              <span>*</span>
            </label>

            <input
              id="publisherName"
              v-model="
                form.publisherName
              "
              type="text"
              placeholder="Nhập tên nhà xuất bản"
              autocomplete="off"
            />
          </div>

          <div>
            <label for="bookPrice">
              Đơn giá
              <span>*</span>
            </label>

            <input
              id="bookPrice"
              v-model.number="
                form.price
              "
              type="number"
              min="0"
              step="1000"
              placeholder="Ví dụ: 85000"
            />
          </div>

          <div>
            <label
              for="bookPublishYear"
            >
              Năm xuất bản
              <span>*</span>
            </label>

            <input
              id="bookPublishYear"
              v-model.number="
                form.publishYear
              "
              type="number"
              min="1000"
              :max="currentYear"
              placeholder="Ví dụ: 2024"
            />
          </div>

          <div>
            <label
              for="bookQuantity"
            >
              Số lượng
              <span>*</span>
            </label>

            <input
              id="bookQuantity"
              v-model.number="
                form.quantity
              "
              type="number"
              min="0"
              step="1"
            />
          </div>

          <div class="full-width">
            <label
              for="bookDescription"
            >
              Mô tả
            </label>

            <textarea
              id="bookDescription"
              v-model="
                form.description
              "
              rows="6"
              placeholder="Nhập mô tả sách"
            />
          </div>
        </div>
      </div>

      <aside
        class="form-card image-card"
      >
        <h2>Ảnh bìa sách</h2>

        <div class="image-preview">
          <img
            v-if="displayedImage"
            :src="displayedImage"
            alt="Ảnh bìa sách"
          />

          <div
            v-else
            class="image-placeholder"
          >
            <i
              class="bi bi-book"
            />

            <span>Chưa có ảnh</span>
          </div>
        </div>

        <label for="bookImageUrl">
          Đường dẫn ảnh
        </label>

        <input
          id="bookImageUrl"
          v-model="form.image"
          type="url"
          placeholder="https://..."
        />

        <div class="or-divider">
          hoặc
        </div>

        <label
          class="upload-button"
        >
          <i class="bi bi-upload" />

          Chọn ảnh từ máy

          <input
            type="file"
            accept="image/*"
            hidden
            @change="
              handleImageChange
            "
          />
        </label>

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
            {{
              submitting
                ? "Đang lưu..."
                : isEditing
                  ? "Cập nhật sách"
                  : "Thêm sách"
            }}
          </button>
        </div>
      </aside>
    </form>
  </section>
</template>

<style scoped>
.book-form-page {
  max-width: 1450px;
  margin: 0 auto;
}

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
}

.form-header p {
  margin: 0;
  color: #64748b;
}

.back-button {
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 0;
  background: transparent;
  color: #2563eb;
  font-weight: 700;
}

.form-layout {
  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    340px;
  gap: 22px;
}

.form-card {
  padding: 26px;
}

.form-card h2 {
  margin: 0 0 22px;
  color: #1e3a8a;
  font-size: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns:
    repeat(
      2,
      minmax(0, 1fr)
    );
  gap: 18px;
}

.full-width {
  grid-column: 1 / -1;
}

label {
  margin-bottom: 7px;
  display: block;
  color: #475569;
  font-size: 13px;
  font-weight: 700;
}

label span {
  color: #dc2626;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid #dbe4ef;
  border-radius: 10px;
  background: #fff;
  color: #334155;
  outline: none;
}

input,
select {
  height: 44px;
  padding: 0 13px;
}

textarea {
  padding: 13px;
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

.field-note {
  margin-top: 6px;
  display: block;
  color: #64748b;
  font-size: 11px;
  line-height: 1.5;
}

.image-preview {
  height: 310px;
  margin-bottom: 20px;
  overflow: hidden;
  border: 1px dashed #bfdbfe;
  border-radius: 15px;
  background: #f8fafc;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.image-placeholder {
  height: 100%;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 10px;
  color: #94a3b8;
}

.image-placeholder i {
  color: #3b82f6;
  font-size: 48px;
}

.or-divider {
  margin: 15px 0;
  color: #94a3b8;
  text-align: center;
}

.upload-button {
  height: 44px;
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  border: 1px dashed #60a5fa;
  border-radius: 10px;
  background: #eff6ff;
  color: #2563eb;
  cursor: pointer;
}

.form-actions {
  margin-top: 25px;
  display: flex;
  gap: 10px;
}

.cancel-button,
.save-button {
  min-height: 44px;
  flex: 1;
  border-radius: 10px;
  font-weight: 700;
}

.cancel-button {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #64748b;
}

.save-button {
  border: 0;
  background: #2563eb;
  color: #fff;
}

.cancel-button:disabled,
.save-button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.loading-state {
  min-height: 250px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

@media (max-width: 1000px) {
  .form-layout {
    grid-template-columns: 1fr;
  }

  .image-card {
    order: -1;
  }

  .image-preview {
    height: 260px;
  }
}

@media (max-width: 650px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .full-width {
    grid-column: auto;
  }

  .form-header,
  .form-card {
    padding: 20px;
  }
}
</style>