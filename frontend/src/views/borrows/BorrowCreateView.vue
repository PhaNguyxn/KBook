<script setup>
import {
  computed,
  onMounted,
  reactive,
  ref,
} from "vue";

import { useRouter } from "vue-router";

import { readerApi } from "@/api/readerApi";
import { bookApi } from "@/api/bookApi";
import { borrowApi } from "@/api/borrowApi";

import { getImageUrl } from "@/utils/image";
import { getErrorMessage } from "@/utils/error";
import { toLocalDateInput } from "@/utils/date";

const router = useRouter();

const readers = ref([]);
const books = ref([]);
const selectedBooks = ref([]);

const loading = ref(false);
const submitting = ref(false);
const errorMessage = ref("");

const readerKeyword = ref("");
const bookKeyword = ref("");

const form = reactive({
  reader: "",
  dueDate: "",
});

const tomorrow = computed(() => {
  const date = new Date();
  date.setDate(date.getDate() + 1);

  return toLocalDateInput(date);
});

const filteredReaders = computed(() => {
  const keyword = readerKeyword.value
    .trim()
    .toLowerCase();

  if (!keyword) {
    return readers.value;
  }

  return readers.value.filter((reader) => {
    const fullName =
      `${reader.lastName || ""} ${
        reader.firstName || ""
      }`.toLowerCase();

    return (
      reader.readerCode
        ?.toLowerCase()
        .includes(keyword) ||
      fullName.includes(keyword) ||
      reader.phone?.includes(keyword)
    );
  });
});

const filteredBooks = computed(() => {
  const keyword = bookKeyword.value
    .trim()
    .toLowerCase();

  return books.value.filter((book) => {
    const isSelected = selectedBooks.value.some(
      (item) => item.book._id === book._id,
    );

    if (isSelected) {
      return false;
    }

    if (!keyword) {
      return true;
    }

    return (
      book.title?.toLowerCase().includes(keyword) ||
      book.author?.toLowerCase().includes(keyword) ||
      book.isbn?.toLowerCase().includes(keyword)
    );
  });
});

const totalQuantity = computed(() => {
  return selectedBooks.value.reduce(
    (total, item) =>
      total + Number(item.quantity || 0),
    0,
  );
});

function getReaderName(reader) {
  return `${reader.lastName || ""} ${
    reader.firstName || ""
  }`.trim();
}

async function loadData() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const [readerResponse, bookResponse] =
      await Promise.all([
        readerApi.getAll({
          page: 1,
          limit: 100,
          status: true,
          sort: "name",
        }),

        bookApi.getAll({
          page: 1,
          limit: 100,
          status: true,
        }),
      ]);

    readers.value =
      readerResponse.data.data.readers || [];

    books.value = (
      bookResponse.data.data.books || []
    ).filter((book) => book.available > 0);
  } catch (error) {
    errorMessage.value = getErrorMessage(
      error,
      "Không thể tải dữ liệu lập phiếu mượn",
    );
  } finally {
    loading.value = false;
  }
}

function addBook(book) {
  const existed = selectedBooks.value.some(
    (item) => item.book._id === book._id,
  );

  if (existed) {
    return;
  }

  selectedBooks.value.push({
    book,
    quantity: 1,
  });
}

function removeBook(bookId) {
  selectedBooks.value =
    selectedBooks.value.filter(
      (item) => item.book._id !== bookId,
    );
}

function decreaseQuantity(item) {
  if (item.quantity > 1) {
    item.quantity -= 1;
  }
}

function increaseQuantity(item) {
  if (item.quantity < item.book.available) {
    item.quantity += 1;
  }
}

function normalizeQuantity(item) {
  let quantity = Number(item.quantity);

  if (!Number.isInteger(quantity) || quantity < 1) {
    quantity = 1;
  }

  if (quantity > item.book.available) {
    quantity = item.book.available;
  }

  item.quantity = quantity;
}

function validateForm() {
  if (!form.reader) {
    return "Vui lòng chọn độc giả";
  }

  if (!form.dueDate) {
    return "Vui lòng chọn hạn trả";
  }

  const dueDate = new Date(form.dueDate);
  const today = new Date();

  dueDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  if (dueDate <= today) {
    return "Hạn trả phải lớn hơn ngày hiện tại";
  }

  if (selectedBooks.value.length === 0) {
    return "Vui lòng chọn ít nhất một quyển sách";
  }

  for (const item of selectedBooks.value) {
    const quantity = Number(item.quantity);

    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      return `Số lượng sách "${item.book.title}" không hợp lệ`;
    }

    if (quantity > item.book.available) {
      return `Sách "${item.book.title}" chỉ còn ${item.book.available} quyển`;
    }
  }

  return "";
}

async function handleSubmit() {
  errorMessage.value = validateForm();

  if (errorMessage.value) {
    return;
  }

  const confirmed = window.confirm(
    `Xác nhận lập phiếu mượn gồm ${totalQuantity.value} quyển sách?`,
  );

  if (!confirmed) {
    return;
  }

  submitting.value = true;

  try {
    const payload = {
      reader: form.reader,
      dueDate: form.dueDate,
      books: selectedBooks.value.map((item) => ({
        book: item.book._id,
        quantity: Number(item.quantity),
      })),
    };

    const response = await borrowApi.create(payload);
    const borrowId = response.data.data._id;

    router.push({
      name: "borrow-detail",
      params: {
        id: borrowId,
      },
    });
  } catch (error) {
    errorMessage.value = getErrorMessage(
      error,
      "Không thể lập phiếu mượn",
    );
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  form.dueDate = tomorrow.value;
  loadData();
});
</script>

<template>
  <section class="borrow-create-page">
    <button
      type="button"
      class="back-button"
      @click="router.push('/borrows')"
    >
      ← Quay lại danh sách
    </button>

    <header class="page-header">
      <h1>Lập phiếu mượn</h1>

      <p>
        Chọn độc giả, hạn trả và những sách cần mượn.
      </p>
    </header>

    <p v-if="loading" class="state-message">
      Đang tải dữ liệu...
    </p>

    <p
      v-if="errorMessage"
      class="error-message"
    >
      {{ errorMessage }}
    </p>

    <form
      v-if="!loading"
      @submit.prevent="handleSubmit"
    >
      <div class="borrow-information card">
        <h2>1. Thông tin phiếu mượn</h2>

        <div class="form-grid">
          <div class="form-group">
            <label for="readerKeyword">
              Tìm độc giả
            </label>

            <input
              id="readerKeyword"
              v-model="readerKeyword"
              type="search"
              placeholder="Nhập mã, tên hoặc số điện thoại"
            />
          </div>

          <div class="form-group">
            <label for="reader">
              Độc giả <span>*</span>
            </label>

            <select
              id="reader"
              v-model="form.reader"
            >
              <option value="">
                Chọn độc giả
              </option>

              <option
                v-for="reader in filteredReaders"
                :key="reader._id"
                :value="reader._id"
              >
                {{ reader.readerCode }} -
                {{ getReaderName(reader) }} -
                {{ reader.phone }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="dueDate">
              Hạn trả <span>*</span>
            </label>

            <input
              id="dueDate"
              v-model="form.dueDate"
              type="date"
              :min="tomorrow"
            />
          </div>
        </div>
      </div>

      <div class="book-selection card">
        <h2>2. Chọn sách</h2>

        <input
          v-model="bookKeyword"
          class="book-search"
          type="search"
          placeholder="Tìm theo tên sách, tác giả hoặc ISBN"
        />

        <div class="book-grid">
          <article
            v-for="book in filteredBooks"
            :key="book._id"
            class="book-card"
          >
            <img
              :src="getImageUrl(book.image)"
              :alt="book.title"
            />

            <div class="book-content">
              <h3>{{ book.title }}</h3>

              <p>
                Tác giả:
                <strong>{{ book.author }}</strong>
              </p>

              <p>
                ISBN:
                <strong>{{ book.isbn }}</strong>
              </p>

              <p>
                Có sẵn:
                <strong>{{ book.available }}</strong>
              </p>

              <button
                type="button"
                class="add-button"
                @click="addBook(book)"
              >
                + Thêm vào phiếu
              </button>
            </div>
          </article>

          <p
            v-if="filteredBooks.length === 0"
            class="empty-message"
          >
            Không tìm thấy sách có thể mượn.
          </p>
        </div>
      </div>

      <div class="selected-books card">
        <div class="section-heading">
          <h2>3. Sách đã chọn</h2>

          <strong>
            Tổng số lượng: {{ totalQuantity }}
          </strong>
        </div>

        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Sách</th>
                <th>Còn lại</th>
                <th>Số lượng mượn</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="item in selectedBooks"
                :key="item.book._id"
              >
                <td>
                  <img
                    :src="getImageUrl(item.book.image)"
                    :alt="item.book.title"
                    class="selected-image"
                  />
                </td>

                <td>
                  <strong>
                    {{ item.book.title }}
                  </strong>

                  <small>
                    {{ item.book.author }}
                  </small>
                </td>

                <td>{{ item.book.available }}</td>

                <td>
                  <div class="quantity-control">
                    <button
                      type="button"
                      @click="decreaseQuantity(item)"
                    >
                      −
                    </button>

                    <input
                      v-model.number="item.quantity"
                      type="number"
                      min="1"
                      :max="item.book.available"
                      @blur="normalizeQuantity(item)"
                    />

                    <button
                      type="button"
                      @click="increaseQuantity(item)"
                    >
                      +
                    </button>
                  </div>
                </td>

                <td>
                  <button
                    type="button"
                    class="remove-button"
                    @click="
                      removeBook(item.book._id)
                    "
                  >
                    Xóa
                  </button>
                </td>
              </tr>

              <tr v-if="selectedBooks.length === 0">
                <td colspan="5" class="empty-cell">
                  Chưa chọn sách nào
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="form-actions">
        <button
          type="button"
          class="cancel-button"
          @click="router.push('/borrows')"
        >
          Hủy
        </button>

        <button
          type="submit"
          class="submit-button"
          :disabled="
            submitting ||
            selectedBooks.length === 0
          "
        >
          {{
            submitting
              ? "Đang lập phiếu..."
              : "Xác nhận lập phiếu"
          }}
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.borrow-create-page {
  max-width: 1250px;
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

.card {
  margin-bottom: 22px;
  padding: 22px;
  border-radius: 11px;
  background: white;
  box-shadow: 0 4px 16px rgb(0 0 0 / 5%);
}

.card h2 {
  margin-top: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 16px;
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
select {
  width: 100%;
  padding: 10px 11px;
  border: 1px solid #d1d5db;
  border-radius: 7px;
  box-sizing: border-box;
  font: inherit;
}

.book-search {
  margin-bottom: 18px;
}

.book-grid {
  display: grid;
  grid-template-columns:
    repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.book-card {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 13px;
  padding: 13px;
  border: 1px solid #e5e7eb;
  border-radius: 9px;
}

.book-card > img {
  width: 80px;
  height: 110px;
  object-fit: cover;
  border-radius: 6px;
}

.book-content h3 {
  margin: 0 0 8px;
  font-size: 16px;
}

.book-content p {
  margin: 5px 0;
  font-size: 13px;
}

.add-button {
  margin-top: 8px;
  padding: 8px 10px;
  border: 0;
  border-radius: 6px;
  background: #2563eb;
  color: white;
  cursor: pointer;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 700px;
  border-collapse: collapse;
}

th,
td {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
}

.selected-image {
  width: 45px;
  height: 60px;
  object-fit: cover;
  border-radius: 5px;
}

td small {
  display: block;
  margin-top: 5px;
  color: #6b7280;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 7px;
}

.quantity-control input {
  width: 65px;
  text-align: center;
}

.quantity-control button {
  width: 32px;
  height: 32px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
}

.remove-button {
  padding: 8px 11px;
  border: 0;
  border-radius: 6px;
  background: #dc2626;
  color: white;
  cursor: pointer;
}

.form-actions {
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
  background: #16a34a;
  color: white;
}

.submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.error-message {
  padding: 12px 14px;
  border-radius: 7px;
  background: #fee2e2;
  color: #b91c1c;
}

.empty-message,
.empty-cell {
  padding: 22px;
  text-align: center;
  color: #6b7280;
}

@media (max-width: 850px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>