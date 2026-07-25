<script setup>
import {
  computed,
  onMounted,
  ref,
} from "vue";

import {
  useRouter,
} from "vue-router";

import BookCard from
  "@/components/books/BookCard.vue";

import {
  bookApi,
} from "@/api/bookApi";

import {
  borrowRequestApi,
} from "@/api/borrowRequestApi";

import {
  useBorrowCartStore,
} from "@/stores/borrowCart";

import {
  useReaderAuthStore,
} from "@/stores/readerAuth";

const router = useRouter();

const cartStore =
  useBorrowCartStore();

const authStore =
  useReaderAuthStore();

const submitting = ref(false);
const errorMessage = ref("");

const note = ref("");
const recommendations = ref([]);

const serverUrl = String(
  import.meta.env.VITE_SERVER_URL ||
    "http://localhost:3000",
).replace(/\/+$/, "");

function formatInputDate(date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(
  dateString,
  days,
) {
  const date = new Date(
    `${dateString}T00:00:00`,
  );

  date.setDate(
    date.getDate() + days,
  );

  return formatInputDate(date);
}

const borrowDate = ref(
  formatInputDate(new Date()),
);

const dueDate = computed(() => {
  const longestDuration =
    Math.max(
      ...cartStore.items.map(
        (item) =>
          Number(
            item.borrowDays || 14,
          ),
      ),
      14,
    );

  return addDays(
    borrowDate.value,
    longestDuration,
  );
});

const totalBooks = computed(() => {
  return cartStore.items.reduce(
    (total, item) =>
      total +
      Number(item.quantity || 0),
    0,
  );
});

const readerName = computed(() => {
  const reader =
    authStore.reader;

  return (
    reader?.fullName ||
    `${reader?.lastName || ""} ${
      reader?.firstName || ""
    }`.trim() ||
    "Độc giả"
  );
});

function getImageUrl(image) {
  if (!image) {
    return "";
  }

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("data:")
  ) {
    return image;
  }

  return `${serverUrl}/${image.replace(
    /^\/+/,
    "",
  )}`;
}

function decreaseQuantity(item) {
  cartStore.updateQuantity(
    item.bookId,
    Math.max(
      1,
      item.quantity - 1,
    ),
  );
}

function increaseQuantity(item) {
  cartStore.updateQuantity(
    item.bookId,
    item.quantity + 1,
  );
}

async function submitBorrowRequest() {
  errorMessage.value = "";

  if (!cartStore.items.length) {
    errorMessage.value =
      "Giỏ mượn chưa có sách";

    return;
  }

  if (!authStore.isAuthenticated) {
    await router.push({
      name: "reader-login",

      query: {
        redirect: "/borrow-cart",
      },
    });

    return;
  }

  submitting.value = true;

  try {
    const payload = {
      readerId:
        authStore.reader?._id,

      requestDate:
        new Date().toISOString(),

      borrowDate:
        borrowDate.value,

      dueDate:
        dueDate.value,

      note:
        note.value.trim(),

      items:
        cartStore.items.map(
          (item) => ({
            bookId:
              item.bookId,

            quantity:
              Number(
                item.quantity || 1,
              ),
          }),
        ),
    };

    await borrowRequestApi.create(
      payload,
    );

    cartStore.clearCart();

    await router.push({
      name: "reader-requests",

      query: {
        created: "true",
      },
    });
  } catch (error) {
    console.error(
      "Create borrow request error:",
      error,
    );

    errorMessage.value =
      error?.response?.data?.message ||
      "Không thể gửi yêu cầu mượn sách";
  } finally {
    submitting.value = false;
  }
}

async function loadRecommendations() {
  try {
    const response =
      await bookApi.getAll({
        page: 1,
        limit: 100,
      });

    const payload =
      response?.data?.data ??
      response?.data ??
      {};

    const books = Array.isArray(payload)
      ? payload
      : payload.books ||
        payload.items ||
        [];

    const currentBookIds =
      new Set(
        cartStore.items.map(
          (item) =>
            String(item.bookId),
        ),
      );

    recommendations.value =
      books
        .filter(
          (book) =>
            book.status !== false &&
            Number(
              book.available || 0,
            ) > 0 &&
            !currentBookIds.has(
              String(book._id),
            ),
        )
        .slice(0, 5);
  } catch (error) {
    console.error(
      "Load recommendations error:",
      error,
    );
  }
}

onMounted(() => {
  loadRecommendations();
});
</script>

<template>
  <div class="borrow-cart-page">
    <section class="cart-heading-section">
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

          <span>
            Giỏ mượn
          </span>
        </div>

        <h1>
          Giỏ mượn / Yêu cầu mượn
        </h1>

        <p>
          Kiểm tra danh sách sách và gửi
          yêu cầu mượn đến thư viện.
        </p>
      </div>
    </section>

    <section class="reader-section">
      <div class="reader-container">
        <div
          v-if="errorMessage"
          class="error-alert"
        >
          <i
            class="bi bi-exclamation-circle-fill"
          />

          {{ errorMessage }}
        </div>

        <div
          v-if="cartStore.items.length"
          class="cart-layout"
        >
          <!-- Danh sách sách -->
          <main class="cart-list-card">
            <div class="cart-table-header">
              <span>Sách</span>
              <span>Số lượng</span>
              <span>Thời gian mượn</span>
              <span>Thao tác</span>
            </div>

            <article
              v-for="item in cartStore.items"
              :key="item.bookId"
              class="cart-item"
            >
              <div class="cart-book">
                <div class="cart-cover">
                  <img
                    v-if="item.image"
                    :src="
                      getImageUrl(
                        item.image,
                      )
                    "
                    :alt="item.title"
                  />

                  <i
                    v-else
                    class="bi bi-book"
                  />
                </div>

                <div>
                  <strong>
                    {{ item.title }}
                  </strong>

                  <span>
                    {{ item.author }}
                  </span>

                  <small>
                    {{ item.category }}
                  </small>

                  <em>
                    Còn
                    {{ item.available }}
                    bản
                  </em>
                </div>
              </div>

              <div class="quantity-control">
                <button
                  type="button"
                  :disabled="
                    item.quantity <= 1
                  "
                  @click="
                    decreaseQuantity(item)
                  "
                >
                  <i class="bi bi-dash" />
                </button>

                <span>
                  {{ item.quantity }}
                </span>

                <button
                  type="button"
                  :disabled="
                    item.available &&
                    item.quantity >=
                      item.available
                  "
                  @click="
                    increaseQuantity(item)
                  "
                >
                  <i class="bi bi-plus" />
                </button>
              </div>

              <select
                :value="
                  item.borrowDays || 14
                "
                @change="
                  cartStore.updateBorrowDays(
                    item.bookId,
                    $event.target.value,
                  )
                "
              >
                <option :value="7">
                  7 ngày
                </option>

                <option :value="14">
                  14 ngày
                </option>

                <option :value="21">
                  21 ngày
                </option>
              </select>

              <button
                type="button"
                class="remove-button"
                title="Xóa khỏi giỏ"
                @click="
                  cartStore.removeBook(
                    item.bookId,
                  )
                "
              >
                <i class="bi bi-trash3" />
              </button>
            </article>

            <div class="cart-list-actions">
              <RouterLink
                :to="{
                  name: 'reader-books',
                }"
                class="continue-button"
              >
                <i class="bi bi-arrow-left" />

                Tiếp tục tìm sách
              </RouterLink>

              <button
                type="button"
                class="clear-button"
                @click="cartStore.clearCart"
              >
                <i class="bi bi-trash3" />

                Xóa tất cả
              </button>
            </div>
          </main>

          <!-- Tóm tắt -->
          <aside class="request-summary-card">
            <h2>
              Thông tin yêu cầu mượn
            </h2>

            <div class="total-summary">
              <span>Tổng số sách</span>

              <strong>
                {{ totalBooks }}
                <small>quyển</small>
              </strong>
            </div>

            <div class="summary-form-group">
              <label for="borrowDate">
                Ngày mượn dự kiến
              </label>

              <input
                id="borrowDate"
                v-model="borrowDate"
                type="date"
              />
            </div>

            <div class="summary-form-group">
              <label for="dueDate">
                Ngày trả dự kiến
              </label>

              <input
                id="dueDate"
                :value="dueDate"
                type="date"
                disabled
              />
            </div>

            <div class="reader-summary">
              <h3>
                Thông tin độc giả
              </h3>

              <div>
                <span>Họ và tên</span>

                <strong>
                  {{ readerName }}
                </strong>
              </div>

              <div>
                <span>Mã độc giả</span>

                <strong>
                  {{
                    authStore.reader
                      ?.readerCode ||
                    "Chưa đăng nhập"
                  }}
                </strong>
              </div>

              <div>
                <span>Email</span>

                <strong>
                  {{
                    authStore.reader
                      ?.email ||
                    "Chưa cập nhật"
                  }}
                </strong>
              </div>

              <div>
                <span>Số điện thoại</span>

                <strong>
                  {{
                    authStore.reader
                      ?.phone ||
                    "Chưa cập nhật"
                  }}
                </strong>
              </div>
            </div>

            <div class="summary-form-group">
              <label for="requestNote">
                Ghi chú
              </label>

              <textarea
                id="requestNote"
                v-model="note"
                maxlength="200"
                rows="4"
                placeholder="Nhập ghi chú cho yêu cầu mượn..."
              />

              <small>
                {{ note.length }}/200
              </small>
            </div>

            <div class="request-notice">
              <i class="bi bi-info-circle-fill" />

              <span>
                Yêu cầu sẽ được thư viện xem
                xét và xác nhận.
              </span>
            </div>

            <button
              type="button"
              class="submit-request-button"
              :disabled="submitting"
              @click="
                submitBorrowRequest
              "
            >
              <span
                v-if="submitting"
                class="reader-spinner"
              />

              <i
                v-else
                class="bi bi-send"
              />

              {{
                submitting
                  ? "Đang gửi..."
                  : "Gửi yêu cầu mượn"
              }}
            </button>
          </aside>
        </div>

        <div
          v-else
          class="empty-cart"
        >
          <div class="empty-cart-icon">
            <i class="bi bi-bag" />
          </div>

          <h2>
            Giỏ mượn đang trống
          </h2>

          <p>
            Hãy khám phá kho sách và chọn
            những cuốn sách bạn muốn mượn.
          </p>

          <RouterLink
            :to="{
              name: 'reader-books',
            }"
            class="reader-primary-button"
          >
            <i class="bi bi-search" />

            Khám phá sách
          </RouterLink>
        </div>
      </div>
    </section>

    <section
      v-if="recommendations.length"
      class="reader-section recommendation-section"
    >
      <div class="reader-container">
        <div class="reader-section-heading">
          <div>
            <h2>
              Bạn có thể cũng sẽ thích
            </h2>

            <p>
              Các đầu sách đang còn sẵn.
            </p>
          </div>
        </div>

        <div class="recommendation-grid">
          <BookCard
            v-for="book in recommendations"
            :key="book._id"
            :book="book"
            compact
          />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.cart-heading-section {
  padding: 33px 0;
  background: #fafcfa;
  border-bottom: 1px solid var(--reader-border);
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

.cart-heading-section h1 {
  margin: 15px 0 7px;
  color: var(--reader-text);
  font-size: 31px;
}

.cart-heading-section p {
  margin: 0;
  color: var(--reader-muted);
  font-size: 11px;
}

.error-alert {
  margin-bottom: 17px;
  padding: 13px;
  display: flex;
  gap: 8px;
  border: 1px solid #fecaca;
  border-radius: 10px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 10px;
}

.cart-layout {
  display: grid;
  grid-template-columns:
    minmax(0, 1fr) 340px;
  align-items: start;
  gap: 24px;
}

.cart-list-card,
.request-summary-card {
  border: 1px solid var(--reader-border);
  border-radius: 16px;
  background: #fff;
  box-shadow: var(--reader-shadow);
}

.cart-list-card {
  overflow: hidden;
}

.cart-table-header,
.cart-item {
  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    115px
    135px
    45px;
  align-items: center;
  gap: 14px;
}

.cart-table-header {
  min-height: 49px;
  padding: 0 18px;
  border-bottom: 1px solid var(--reader-border);
  color: #71808d;
  font-size: 8px;
  font-weight: 900;
}

.cart-item {
  min-height: 145px;
  padding: 17px 18px;
  border-bottom: 1px solid var(--reader-border);
}

.cart-book {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 14px;
}

.cart-cover {
  width: 72px;
  height: 100px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 7px;
  background: #f4f7f5;
  color: var(--reader-primary);
  font-size: 25px;
}

.cart-cover img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.cart-book strong,
.cart-book span,
.cart-book small,
.cart-book em {
  display: block;
}

.cart-book strong {
  overflow: hidden;
  color: var(--reader-text);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cart-book span {
  margin-top: 6px;
  color: #64748b;
  font-size: 8px;
}

.cart-book small {
  margin-top: 5px;
  color: #94a3b8;
  font-size: 8px;
}

.cart-book em {
  margin-top: 8px;
  color: #159355;
  font-size: 8px;
  font-style: normal;
  font-weight: 800;
}

.quantity-control {
  height: 36px;
  display: grid;
  grid-template-columns:
    34px 1fr 34px;
  overflow: hidden;
  border: 1px solid var(--reader-border);
  border-radius: 9px;
}

.quantity-control button {
  border: 0;
  background: #f8faf9;
  color: var(--reader-text);
}

.quantity-control span {
  display: grid;
  place-items: center;
  font-size: 10px;
  font-weight: 900;
}

.quantity-control button:disabled {
  opacity: 0.4;
}

.cart-item > select {
  height: 36px;
  padding: 0 9px;
  border: 1px solid var(--reader-border);
  border-radius: 9px;
  background: #fff;
  font-size: 9px;
}

.remove-button {
  width: 35px;
  height: 35px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: #fff0f2;
  color: #ef476f;
}

.cart-list-actions {
  padding: 16px 18px;
  display: flex;
  justify-content: space-between;
}

.continue-button {
  min-height: 37px;
  padding: 0 13px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid var(--reader-border);
  border-radius: 9px;
  color: var(--reader-text);
  font-size: 9px;
  font-weight: 800;
}

.clear-button {
  border: 0;
  background: transparent;
  color: #ef476f;
  font-size: 9px;
  font-weight: 800;
}

.request-summary-card {
  padding: 22px;
  position: sticky;
  top: 155px;
}

.request-summary-card h2 {
  margin: 0 0 20px;
  color: var(--reader-text);
  font-size: 16px;
}

.total-summary {
  padding-bottom: 17px;
  border-bottom: 1px solid var(--reader-border);
}

.total-summary span {
  display: block;
  color: var(--reader-muted);
  font-size: 9px;
}

.total-summary strong {
  margin-top: 5px;
  display: block;
  color: var(--reader-accent);
  font-size: 27px;
}

.total-summary small {
  color: var(--reader-text);
  font-size: 10px;
}

.summary-form-group {
  margin-top: 16px;
  position: relative;
}

.summary-form-group label {
  margin-bottom: 7px;
  display: block;
  color: var(--reader-text);
  font-size: 9px;
  font-weight: 900;
}

.summary-form-group input,
.summary-form-group textarea {
  width: 100%;
  border: 1px solid var(--reader-border);
  border-radius: 9px;
  color: var(--reader-text);
  outline: none;
}

.summary-form-group input {
  height: 42px;
  padding: 0 11px;
}

.summary-form-group textarea {
  padding: 11px;
  resize: vertical;
}

.summary-form-group small {
  position: absolute;
  right: 8px;
  bottom: 6px;
  color: var(--reader-muted);
  font-size: 7px;
}

.reader-summary {
  margin-top: 20px;
  padding-top: 17px;
  border-top: 1px solid var(--reader-border);
}

.reader-summary h3 {
  margin: 0 0 12px;
  color: var(--reader-text);
  font-size: 12px;
}

.reader-summary > div {
  margin-top: 9px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.reader-summary span {
  color: var(--reader-muted);
  font-size: 8px;
}

.reader-summary strong {
  max-width: 180px;
  overflow-wrap: anywhere;
  color: var(--reader-text);
  font-size: 8px;
  text-align: right;
}

.request-notice {
  margin-top: 17px;
  padding: 11px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  border-radius: 9px;
  background: #fff8dd;
  color: #987011;
  font-size: 8px;
  line-height: 1.6;
}

.submit-request-button {
  width: 100%;
  min-height: 45px;
  margin-top: 16px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  border: 0;
  border-radius: 10px;
  background: var(--reader-accent);
  color: #fff;
  font-size: 10px;
  font-weight: 900;
}

.submit-request-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.empty-cart {
  min-height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  text-align: center;
}

.empty-cart-icon {
  width: 85px;
  height: 85px;
  display: grid;
  place-items: center;
  border-radius: 22px;
  background: var(--reader-primary-light);
  color: var(--reader-primary);
  font-size: 36px;
}

.empty-cart h2 {
  margin: 17px 0 7px;
  color: var(--reader-text);
}

.empty-cart p {
  max-width: 410px;
  margin: 0 0 18px;
  color: var(--reader-muted);
}

.recommendation-section {
  background: #fafcfa;
}

.recommendation-grid {
  display: grid;
  grid-template-columns:
    repeat(5, minmax(0, 1fr));
  gap: 15px;
}

@media (max-width: 1000px) {
  .cart-layout {
    grid-template-columns: 1fr;
  }

  .request-summary-card {
    position: static;
  }

  .recommendation-grid {
    grid-template-columns:
      repeat(3, 1fr);
  }
}

@media (max-width: 700px) {
  .cart-table-header {
    display: none;
  }

  .cart-item {
    grid-template-columns:
      1fr 40px;
    gap: 13px;
  }

  .cart-book {
    grid-column: 1 / -1;
  }

  .quantity-control {
    width: 120px;
  }

  .cart-item > select {
    width: 130px;
  }

  .remove-button {
    grid-column: 2;
    grid-row: 2;
  }
}

@media (max-width: 520px) {
  .recommendation-grid {
    grid-template-columns:
      repeat(2, 1fr);
  }

  .cart-list-actions {
    align-items: stretch;
    flex-direction: column;
    gap: 13px;
  }

  .continue-button {
    justify-content: center;
  }
}
</style>