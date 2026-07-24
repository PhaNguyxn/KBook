<script setup>
import {
  computed,
  onMounted,
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

const book = ref(null);
const loading = ref(false);
const deleting = ref(false);
const errorMessage = ref("");

const currentEmployee = computed(() => {
  try {
    return JSON.parse(
      localStorage.getItem(
        "employee",
      ) || "{}",
    );
  } catch {
    return {};
  }
});

const isAdmin = computed(() => {
  return (
    String(
      currentEmployee.value.role || "",
    ).toLowerCase() === "admin"
  );
});

function getImageUrl(value) {
  if (!value) {
    return "";
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
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

function getPublisherName() {
  if (!book.value) {
    return "Chưa cập nhật";
  }

  if (
    typeof book.value.publisher ===
    "object"
  ) {
    return (
      book.value.publisher
        ?.publisherName ||
      "Chưa cập nhật"
    );
  }

  return (
    book.value.publisherName ||
    "Chưa cập nhật"
  );
}

function formatPrice(value) {
  const price = Number(value);

  if (
    !Number.isFinite(price)
  ) {
    return "—";
  }

  return new Intl.NumberFormat(
    "vi-VN",
    {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    },
  ).format(price);
}

async function loadBook() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response =
      await bookApi.getById(
        route.params.id,
      );

    const data =
      response?.data?.data ||
      response?.data;

    if (!data) {
      throw new Error(
        "Không tìm thấy thông tin sách",
      );
    }

    book.value = data;
  } catch (error) {
    errorMessage.value =
      getErrorMessage(
        error,
        "Không thể tải chi tiết sách",
      );
  } finally {
    loading.value = false;
  }
}

async function deleteBook() {
  if (!book.value) {
    return;
  }

  const confirmed =
    window.confirm(
      `Bạn có chắc muốn xóa vĩnh viễn sách "${book.value.title}"?`,
    );

  if (!confirmed) {
    return;
  }

  deleting.value = true;
  errorMessage.value = "";

  try {
    await bookApi.delete(
      book.value._id,
    );

    await router.push(
      "/books",
    );
  } catch (error) {
    errorMessage.value =
      getErrorMessage(
        error,
        "Không thể xóa sách",
      );
  } finally {
    deleting.value = false;
  }
}

function goBack() {
  router.push("/books");
}

function goToEdit() {
  if (!book.value?._id) {
    return;
  }

  router.push(
    `/books/${book.value._id}/edit`,
  );
}

onMounted(() => {
  loadBook();
});
</script>

<template>
  <section class="detail-page">
    <div
      v-if="errorMessage"
      class="alert alert-danger"
    >
      {{ errorMessage }}
    </div>

    <div
      v-if="loading"
      class="detail-card loading-state"
    >
      <div
        class="spinner-border text-primary"
      />

      <span>
        Đang tải thông tin sách...
      </span>
    </div>

    <template v-else-if="book">
      <div class="detail-header">
        <button
          type="button"
          class="back-button"
          @click="goBack"
        >
          <i
            class="bi bi-arrow-left"
          />

          Quay lại danh sách
        </button>

        <div
          v-if="isAdmin"
          class="header-actions"
        >
          <button
            type="button"
            class="edit-button"
            @click="goToEdit"
          >
            <i
              class="bi bi-pencil-square"
            />

            Chỉnh sửa
          </button>

          <button
            type="button"
            class="delete-button"
            :disabled="deleting"
            @click="deleteBook"
          >
            <i
              class="bi bi-trash3"
            />

            {{
              deleting
                ? "Đang xóa..."
                : "Xóa sách"
            }}
          </button>
        </div>
      </div>

      <div
        class="detail-card book-detail"
      >
        <div class="cover-section">
          <img
            v-if="book.image"
            :src="
              getImageUrl(book.image)
            "
            :alt="book.title"
          />

          <div
            v-else
            class="cover-placeholder"
          >
            <i class="bi bi-book" />
          </div>
        </div>

        <div
          class="information-section"
        >
          <span class="book-code">
            {{
              book.bookCode ||
              "Chưa có mã sách"
            }}
          </span>

          <h1>{{ book.title }}</h1>

          <p class="author">
            <i class="bi bi-person" />

            {{
              book.author ||
              "Chưa cập nhật tác giả"
            }}
          </p>

          <div
            class="information-grid"
          >
            <div>
              <span>Thể loại</span>

              <strong>
                {{
                  book.category ||
                  "—"
                }}
              </strong>
            </div>

            <div>
              <span>
                Nhà xuất bản
              </span>

              <strong>
                {{
                  getPublisherName()
                }}
              </strong>
            </div>

            <div>
              <span>Đơn giá</span>

              <strong class="price">
                {{
                  formatPrice(
                    book.price,
                  )
                }}
              </strong>
            </div>

            <div>
              <span>
                Năm xuất bản
              </span>

              <strong>
                {{
                  book.publishYear ||
                  "—"
                }}
              </strong>
            </div>

            <div>
              <span>
                Tổng số lượng
              </span>

              <strong>
                {{
                  book.quantity ?? 0
                }}
              </strong>
            </div>

            <div>
              <span>Còn lại</span>

              <strong class="available">
                {{
                  book.available ?? 0
                }}
              </strong>
            </div>

            <div>
              <span>Đang được mượn</span>

              <strong class="borrowed">
                {{
                  Math.max(
                    Number(
                      book.quantity ||
                        0,
                    ) -
                      Number(
                        book.available ||
                          0,
                      ),
                    0,
                  )
                }}
              </strong>
            </div>
          </div>

          <div class="description">
            <h2>Mô tả sách</h2>

            <p>
              {{
                book.description ||
                "Chưa có mô tả cho sách này."
              }}
            </p>
          </div>
        </div>
      </div>
    </template>

    <div
      v-else
      class="detail-card empty-state"
    >
      <i
        class="bi bi-exclamation-circle"
      />

      <p>
        Không tìm thấy thông tin sách.
      </p>

      <button
        type="button"
        class="back-button"
        @click="goBack"
      >
        Quay lại danh sách
      </button>
    </div>
  </section>
</template>

<style scoped>
.detail-page {
  max-width: 1350px;
  margin: 0 auto;
}

.detail-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  gap: 15px;
}

.back-button,
.edit-button,
.delete-button {
  min-height: 43px;
  padding: 0 15px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 10px;
  font-weight: 700;
}

.back-button {
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #2563eb;
}

.header-actions {
  display: flex;
  gap: 9px;
}

.edit-button {
  border: 0;
  background: #fef3c7;
  color: #b45309;
}

.delete-button {
  border: 0;
  background: #fee2e2;
  color: #b91c1c;
}

.delete-button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.detail-card {
  border: 1px solid #e5edf7;
  border-radius: 22px;
  background: #fff;
  box-shadow:
    0 12px 32px
    rgb(15 23 42 / 7%);
}

.book-detail {
  padding: 32px;
  display: grid;
  grid-template-columns:
    300px minmax(0, 1fr);
  gap: 38px;
}

.cover-section {
  height: 430px;
  overflow: hidden;
  border-radius: 17px;
  background: #f1f5f9;
  box-shadow:
    0 12px 26px
    rgb(15 23 42 / 13%);
}

.cover-section img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.cover-placeholder {
  height: 100%;
  display: grid;
  place-items: center;
  color: #3b82f6;
  font-size: 70px;
}

.book-code {
  color: #3b82f6;
  font-weight: 800;
}

.information-section h1 {
  margin: 8px 0;
  overflow-wrap: anywhere;
  color: #1e3a8a;
  font-size: 34px;
}

.author {
  color: #64748b;
  font-size: 17px;
}

.information-grid {
  margin-top: 25px;
  display: grid;
  grid-template-columns:
    repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.information-grid div {
  min-width: 0;
  padding: 15px;
  border-radius: 11px;
  background: #f8fafc;
}

.information-grid span,
.information-grid strong {
  display: block;
}

.information-grid span {
  margin-bottom: 6px;
  color: #94a3b8;
  font-size: 12px;
}

.information-grid strong {
  overflow-wrap: anywhere;
  color: #334155;
}

.information-grid .price {
  color: #2563eb;
  font-size: 18px;
}

.information-grid .available {
  color: #059669;
  font-size: 20px;
}

.information-grid .borrowed {
  color: #d97706;
  font-size: 20px;
}

.description {
  margin-top: 28px;
}

.description h2 {
  color: #1e3a8a;
  font-size: 19px;
}

.description p {
  color: #64748b;
  line-height: 1.8;
  overflow-wrap: anywhere;
  white-space: pre-line;
}

.loading-state,
.empty-state {
  min-height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

.empty-state {
  padding: 30px;
  flex-direction: column;
  color: #64748b;
  text-align: center;
}

.empty-state i {
  color: #f59e0b;
  font-size: 42px;
}

.empty-state p {
  margin: 0;
}

@media (max-width: 900px) {
  .book-detail {
    grid-template-columns: 1fr;
  }

  .cover-section {
    width: 100%;
    max-width: 320px;
    margin: auto;
  }

  .information-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 650px) {
  .detail-header {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
  }

  .edit-button,
  .delete-button {
    flex: 1;
  }

  .book-detail {
    padding: 20px;
  }

  .information-section h1 {
    font-size: 27px;
  }

  .information-grid {
    grid-template-columns: 1fr;
  }
}
</style>