<script setup>
import {
  computed,
  onMounted,
  reactive,
  ref,
} from "vue";

import { useRouter } from "vue-router";

import { borrowApi } from "@/api/borrowApi";
import { readerApi } from "@/api/readerApi";
import { bookApi } from "@/api/bookApi";

import { getErrorMessage } from "@/utils/error";

const router = useRouter();

const serverUrl =
  import.meta.env.VITE_SERVER_URL ||
  "http://localhost:3000";

/* =========================================
   STATE
========================================= */

const readers = ref([]);
const books = ref([]);
const selectedBooks = ref([]);

const loadingData = ref(false);
const submitting = ref(false);

const errorMessage = ref("");

const readerKeyword = ref("");
const bookKeyword = ref("");

const imageErrors = reactive({});

const form = reactive({
  reader: "",
  borrowDate: getToday(),
  dueDate: getDefaultDueDate(),
  note: "",
});

/* =========================================
   COMPUTED
========================================= */

const selectedReader = computed(() => {
  return (
    readers.value.find(
      (reader) =>
        reader._id === form.reader,
    ) || null
  );
});

const filteredReaders = computed(() => {
  const keyword = readerKeyword.value
    .trim()
    .toLowerCase();

  const result = readers.value.filter(
    (reader) =>
      reader.status !== false,
  );

  if (!keyword) {
    return result;
  }

  return result.filter((reader) => {
    const searchableText = [
      reader.readerCode,
      getReaderFullName(reader),
      reader.phone,
      reader.address,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(keyword);
  });
});

const filteredBooks = computed(() => {
  const keyword = bookKeyword.value
    .trim()
    .toLowerCase();

  let result = books.value.filter(
    (book) =>
      book.status !== false &&
      getAvailableQuantity(book) > 0,
  );

  if (keyword) {
    result = result.filter((book) => {
      const searchableText = [
        getBookCode(book),
        getBookTitle(book),
        book.author,
        book.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }

  return result;
});

const totalBookTitles = computed(() => {
  return selectedBooks.value.length;
});

const totalBookQuantity = computed(() => {
  return selectedBooks.value.reduce(
    (total, item) =>
      total + Number(item.quantity || 0),
    0,
  );
});

const canSubmit = computed(() => {
  return (
    form.reader &&
    form.borrowDate &&
    form.dueDate &&
    selectedBooks.value.length > 0 &&
    !submitting.value
  );
});

/* =========================================
   NGÀY THÁNG
========================================= */

function toDateInputValue(date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getToday() {
  return toDateInputValue(new Date());
}

function getDefaultDueDate() {
  const date = new Date();

  date.setDate(date.getDate() + 14);

  return toDateInputValue(date);
}

function handleBorrowDateChange() {
  if (
    form.dueDate &&
    form.dueDate >= form.borrowDate
  ) {
    return;
  }

  const date = new Date(
    `${form.borrowDate}T00:00:00`,
  );

  if (
    Number.isNaN(date.getTime())
  ) {
    form.dueDate = "";
    return;
  }

  date.setDate(date.getDate() + 14);

  form.dueDate =
    toDateInputValue(date);
}

/* =========================================
   HÀM HỖ TRỢ ĐỘC GIẢ
========================================= */

function getReaderFullName(reader) {
  if (!reader) {
    return "Chưa chọn độc giả";
  }

  if (reader.fullName) {
    return reader.fullName;
  }

  return `${reader.lastName || ""} ${
    reader.firstName || ""
  }`.trim() || "Chưa cập nhật tên";
}

function getReaderInitials(reader) {
  const fullName =
    getReaderFullName(reader);

  if (
    !fullName ||
    fullName ===
      "Chưa chọn độc giả"
  ) {
    return "ĐG";
  }

  const words = fullName
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${words[0].charAt(0)}${words[
    words.length - 1
  ].charAt(0)}`.toUpperCase();
}

/* =========================================
   HÀM HỖ TRỢ SÁCH
========================================= */

function getBookCode(book) {
  return (
    book?.bookCode ||
    book?.code ||
    "Chưa có mã"
  );
}

function getBookTitle(book) {
  return (
    book?.title ||
    book?.name ||
    "Chưa cập nhật tên sách"
  );
}

function getAvailableQuantity(book) {
  return Number(
    book?.available ??
      book?.availableQuantity ??
      book?.quantity ??
      0,
  );
}

function getBookImage(book) {
  const value =
    book?.image ||
    book?.coverImage ||
    book?.thumbnail ||
    book?.img ||
    book?.img1 ||
    "";

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

  const cleanPath = value.replace(
    /^\/+/,
    "",
  );

  return `${serverUrl}/${cleanPath}`;
}

function markImageError(bookId) {
  imageErrors[bookId] = true;
}

function isBookSelected(bookId) {
  return selectedBooks.value.some(
    (item) =>
      item.book._id === bookId,
  );
}

/* =========================================
   TẢI DỮ LIỆU
========================================= */

function extractReaders(response) {
  const payload =
    response?.data?.data ??
    response?.data ??
    {};

  if (Array.isArray(payload)) {
    return payload;
  }

  return (
    payload.readers ||
    payload.items ||
    payload.results ||
    []
  );
}

function extractBooks(response) {
  const payload =
    response?.data?.data ??
    response?.data ??
    {};

  if (Array.isArray(payload)) {
    return payload;
  }

  return (
    payload.books ||
    payload.items ||
    payload.results ||
    []
  );
}

async function loadInitialData() {
  loadingData.value = true;
  errorMessage.value = "";

  try {
    const [
      readerResponse,
      bookResponse,
    ] = await Promise.all([
      readerApi.getAll({
        page: 1,
        limit: 500,
        sort: "name",
      }),

      bookApi.getAll({
        page: 1,
        limit: 500,
        sort: "title",
      }),
    ]);

    readers.value =
      extractReaders(readerResponse);

    books.value =
      extractBooks(bookResponse);
  } catch (error) {
    console.error(
      "Load borrow form data error:",
      error,
    );

    errorMessage.value =
      getErrorMessage(
        error,
        "Không thể tải dữ liệu độc giả và sách",
      );
  } finally {
    loadingData.value = false;
  }
}

/* =========================================
   QUẢN LÝ SÁCH ĐƯỢC CHỌN
========================================= */

function addBook(book) {
  if (
    !book ||
    isBookSelected(book._id)
  ) {
    return;
  }

  const available =
    getAvailableQuantity(book);

  if (available <= 0) {
    errorMessage.value =
      `"${getBookTitle(book)}" hiện đã hết sách.`;

    return;
  }

  errorMessage.value = "";

  selectedBooks.value.push({
    book,
    quantity: 1,
  });
}

function removeBook(bookId) {
  selectedBooks.value =
    selectedBooks.value.filter(
      (item) =>
        item.book._id !== bookId,
    );
}

function increaseQuantity(item) {
  const available =
    getAvailableQuantity(item.book);

  if (item.quantity >= available) {
    errorMessage.value =
      `Số lượng mượn của "${getBookTitle(
        item.book,
      )}" không được vượt quá ${available}.`;

    return;
  }

  errorMessage.value = "";
  item.quantity += 1;
}

function decreaseQuantity(item) {
  if (item.quantity <= 1) {
    return;
  }

  item.quantity -= 1;
}

function handleQuantityInput(item) {
  const available =
    getAvailableQuantity(item.book);

  let quantity =
    Number(item.quantity) || 1;

  quantity = Math.max(quantity, 1);
  quantity = Math.min(
    quantity,
    available,
  );

  item.quantity = quantity;
}

/* =========================================
   VALIDATE
========================================= */

function validateForm() {
  if (!form.reader) {
    return "Vui lòng chọn độc giả";
  }

  if (!form.borrowDate) {
    return "Vui lòng chọn ngày mượn";
  }

  if (!form.dueDate) {
    return "Vui lòng chọn hạn trả";
  }

  if (
    form.dueDate < form.borrowDate
  ) {
    return "Hạn trả không được nhỏ hơn ngày mượn";
  }

  if (
    selectedBooks.value.length === 0
  ) {
    return "Vui lòng chọn ít nhất một quyển sách";
  }

  for (
    const item of selectedBooks.value
  ) {
    const available =
      getAvailableQuantity(item.book);

    if (
      !Number.isInteger(
        Number(item.quantity),
      ) ||
      Number(item.quantity) < 1
    ) {
      return `Số lượng mượn của "${getBookTitle(
        item.book,
      )}" không hợp lệ`;
    }

    if (
      Number(item.quantity) >
      available
    ) {
      return `"${getBookTitle(
        item.book,
      )}" chỉ còn ${available} quyển`;
    }
  }

  return "";
}

/* =========================================
   TẠO PHIẾU MƯỢN
========================================= */

async function submitForm() {
  const validationMessage =
    validateForm();

  if (validationMessage) {
    errorMessage.value =
      validationMessage;

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    return;
  }

  const confirmed =
    window.confirm(
      `Xác nhận lập phiếu mượn cho "${getReaderFullName(
        selectedReader.value,
      )}" với ${totalBookQuantity.value} quyển sách?`,
    );

  if (!confirmed) {
    return;
  }

  submitting.value = true;
  errorMessage.value = "";

  try {
    const payload = {
      readerId: form.reader,

      borrowDate:
        form.borrowDate,

      dueDate:
        form.dueDate,

      note:
        form.note.trim() ||
        "",

      items:
        selectedBooks.value.map(
          (item) => ({
            bookId:
              item.book._id,

            quantity:
              Number(
                item.quantity,
              ),
          }),
        ),
    };

    const response =
      await borrowApi.create(payload);

    const createdBorrow =
      response?.data?.data ??
      response?.data;

    const createdId =
      createdBorrow?._id ||
      createdBorrow?.borrow?._id;

    if (createdId) {
      await router.push(
        `/borrows/${createdId}`,
      );

      return;
    }

    await router.push("/borrows");
  } catch (error) {
    console.error(
      "Create borrow error:",
      error,
    );

    errorMessage.value =
      getErrorMessage(
        error,
        "Không thể lập phiếu mượn",
      );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  } finally {
    submitting.value = false;
  }
}

function getBookPrice(book) {
  const price = Number(
    book?.price || 0,
  );

  return Number.isFinite(price)
    ? price
    : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat(
    "vi-VN",
    {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    },
  ).format(Number(value) || 0);
}

const totalAmount = computed(() => {
  return selectedBooks.value.reduce(
    (total, item) => {
      const price =
        getBookPrice(item.book);

      const quantity =
        Number(item.quantity) || 0;

      return (
        total +
        price * quantity
      );
    },
    0,
  );
});

/* =========================================
   KHỞI TẠO
========================================= */

onMounted(() => {
  loadInitialData();
});
</script>

<template>
  <section class="borrow-form-page">
    <!-- Thanh điều hướng -->
    <div class="navigation-bar">
      <button
        type="button"
        class="back-button"
        @click="router.push('/borrows')"
      >
        <i class="bi bi-arrow-left" />

        Quay lại danh sách
      </button>
    </div>

    <!-- Thông báo lỗi -->
    <div
      v-if="errorMessage"
      class="custom-alert"
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

    <!-- Loading -->
    <div
      v-if="loadingData"
      class="loading-card"
    >
      <div
        class="spinner-border text-primary"
        role="status"
      />

      <strong>
        Đang tải dữ liệu
      </strong>

      <span>
        Vui lòng chờ trong giây lát...
      </span>
    </div>

    <form
      v-else
      class="form-layout"
      @submit.prevent="submitForm"
    >
      <!-- Cột nội dung chính -->
      <main class="main-column">
        <!-- Thông tin phiếu -->
        <section class="form-card">
          <div class="card-heading">
            <div class="heading-icon">
              <i
                class="bi bi-journal-plus"
              />
            </div>

            <div>
              <h1>
                Lập phiếu mượn sách
              </h1>

              <p>
                Chọn độc giả, thời hạn và
                sách cần mượn.
              </p>
            </div>
          </div>

          <div class="date-grid">
            <div class="form-group">
              <label for="borrowDate">
                Ngày mượn
                <span>*</span>
              </label>

              <div
                class="input-icon-wrapper"
              >
                <i
                  class="bi bi-calendar-plus"
                />

                <input
                  id="borrowDate"
                  v-model="form.borrowDate"
                  type="date"
                  :max="form.dueDate || undefined"
                  @change="
                    handleBorrowDateChange
                  "
                />
              </div>
            </div>

            <div class="form-group">
              <label for="dueDate">
                Hạn trả
                <span>*</span>
              </label>

              <div
                class="input-icon-wrapper"
              >
                <i
                  class="bi bi-calendar-event"
                />

                <input
                  id="dueDate"
                  v-model="form.dueDate"
                  type="date"
                  :min="form.borrowDate"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- Chọn độc giả -->
        <section class="form-card">
          <div class="section-heading">
            <div>
              <h2>
                Chọn độc giả
              </h2>

              <p>
                Tìm theo mã, tên hoặc số
                điện thoại.
              </p>
            </div>

            <span class="required-badge">
              Bắt buộc
            </span>
          </div>

          <div class="reader-search">
            <div
              class="input-icon-wrapper"
            >
              <i class="bi bi-search" />

              <input
                v-model="readerKeyword"
                type="search"
                placeholder="Tìm kiếm độc giả..."
              />
            </div>

            <select
              v-model="form.reader"
              class="reader-select"
            >
              <option value="">
                Chọn độc giả
              </option>

              <option
                v-for="reader in filteredReaders"
                :key="reader._id"
                :value="reader._id"
              >
                {{
                  reader.readerCode ||
                  "Chưa có mã"
                }}
                -
                {{
                  getReaderFullName(reader)
                }}
                -
                {{
                  reader.phone ||
                  "Chưa có SĐT"
                }}
              </option>
            </select>
          </div>

          <div
            v-if="selectedReader"
            class="selected-reader-card"
          >
            <div class="reader-avatar">
              {{
                getReaderInitials(
                  selectedReader,
                )
              }}
            </div>

            <div class="reader-content">
              <span>
                {{
                  selectedReader.readerCode ||
                  "Chưa có mã"
                }}
              </span>

              <strong>
                {{
                  getReaderFullName(
                    selectedReader,
                  )
                }}
              </strong>

              <div class="reader-details">
                <small>
                  <i
                    class="bi bi-telephone"
                  />

                  {{
                    selectedReader.phone ||
                    "Chưa cập nhật"
                  }}
                </small>

                <small>
                  <i
                    class="bi bi-geo-alt"
                  />

                  {{
                    selectedReader.address ||
                    "Chưa cập nhật địa chỉ"
                  }}
                </small>
              </div>
            </div>

            <button
              type="button"
              class="clear-reader-button"
              title="Bỏ chọn độc giả"
              @click="form.reader = ''"
            >
              <i class="bi bi-x-lg" />
            </button>
          </div>
        </section>

        <!-- Chọn sách -->
        <section class="form-card">
          <div class="section-heading">
            <div>
              <h2>
                Chọn sách mượn
              </h2>

              <p>
                Chỉ hiển thị các sách còn
                số lượng trong kho.
              </p>
            </div>

            <span class="book-count-badge">
              {{ filteredBooks.length }}
              sách
            </span>
          </div>

          <div
            class="input-icon-wrapper book-search"
          >
            <i class="bi bi-search" />

            <input
              v-model="bookKeyword"
              type="search"
              placeholder="Tìm theo mã sách, tên sách, tác giả hoặc thể loại..."
            />
          </div>

          <div class="book-catalog">
            <article
              v-for="book in filteredBooks"
              :key="book._id"
              class="catalog-book"
              :class="{
                selected:
                  isBookSelected(
                    book._id,
                  ),
              }"
            >
              <div class="book-cover">
                <img
                  v-if="
                    getBookImage(book) &&
                    !imageErrors[book._id]
                  "
                  :src="getBookImage(book)"
                  :alt="getBookTitle(book)"
                  @error="
                    markImageError(
                      book._id,
                    )
                  "
                />

                <div
                  v-else
                  class="cover-placeholder"
                >
                  <i class="bi bi-book" />
                </div>
              </div>

              <div class="catalog-content">
                <span class="book-code">
                  {{ getBookCode(book) }}
                </span>

                <strong
                  :title="
                    getBookTitle(book)
                  "
                >
                  {{ getBookTitle(book) }}
                </strong>

                <small>
                  <i class="bi bi-person" />

                  {{
                    book.author ||
                    "Chưa cập nhật tác giả"
                  }}
                </small>

                <div class="stock-row">
                  <span>
                    Còn
                    <b>
                      {{
                        getAvailableQuantity(
                          book,
                        )
                      }}
                    </b>
                    quyển
                  </span>

                  <span>
                    {{
                      book.category ||
                      "Chưa phân loại"
                    }}
                  </span>
                </div>
              </div>

              <button
                type="button"
                class="add-book-button"
                :class="{
                  added:
                    isBookSelected(
                      book._id,
                    ),
                }"
                :disabled="
                  isBookSelected(
                    book._id,
                  )
                "
                @click="addBook(book)"
              >
                <i
                  class="bi"
                  :class="
                    isBookSelected(
                      book._id,
                    )
                      ? 'bi-check-lg'
                      : 'bi-plus-lg'
                  "
                />

                {{
                  isBookSelected(
                    book._id,
                  )
                    ? "Đã chọn"
                    : "Chọn sách"
                }}
              </button>
            </article>

            <div
              v-if="
                filteredBooks.length === 0
              "
              class="empty-books"
            >
              <i
                class="bi bi-journal-x"
              />

              <strong>
                Không tìm thấy sách
              </strong>

              <span>
                Thử thay đổi từ khóa tìm
                kiếm.
              </span>
            </div>
          </div>
        </section>

        <!-- Sách đã chọn -->
        <section class="form-card">
          <div class="section-heading">
            <div>
              <h2>
                Sách đã chọn
              </h2>

              <p>
                Điều chỉnh số lượng cần
                mượn của từng đầu sách.
              </p>
            </div>

            <span class="selected-count">
              {{ totalBookQuantity }}
              quyển
            </span>
          </div>

          <div
            v-if="
              selectedBooks.length > 0
            "
            class="selected-book-list"
          >
            <article
              v-for="item in selectedBooks"
              :key="item.book._id"
              class="selected-book-item"
            >
              <div
                class="selected-book-cover"
              >
                <img
                  v-if="
                    getBookImage(
                      item.book,
                    ) &&
                    !imageErrors[
                      item.book._id
                    ]
                  "
                  :src="
                    getBookImage(
                      item.book,
                    )
                  "
                  :alt="
                    getBookTitle(
                      item.book,
                    )
                  "
                />

                <div
                  v-else
                  class="cover-placeholder"
                >
                  <i class="bi bi-book" />
                </div>
              </div>

              <div class="selected-book-info">
                <span>
                  {{
                    getBookCode(
                      item.book,
                    )
                  }}
                </span>

                <strong>
                  {{
                    getBookTitle(
                      item.book,
                    )
                  }}
                </strong>

                <small>
                  Còn
                  {{
                    getAvailableQuantity(
                      item.book,
                    )
                  }}
                  quyển trong kho
                </small>

                <div class="selected-book-price">
                  <span>
                    Đơn giá:
                    {{
                      formatCurrency(
                        getBookPrice(
                          item.book,
                        ),
                      )
                    }}
                  </span>

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

                <input
                  v-model.number="
                    item.quantity
                  "
                  type="number"
                  min="1"
                  :max="
                    getAvailableQuantity(
                      item.book,
                    )
                  "
                  @change="
                    handleQuantityInput(
                      item,
                    )
                  "
                />

                <button
                  type="button"
                  :disabled="
                    item.quantity >=
                    getAvailableQuantity(
                      item.book,
                    )
                  "
                  @click="
                    increaseQuantity(item)
                  "
                >
                  <i class="bi bi-plus" />
                </button>
              </div>

              <button
                type="button"
                class="remove-book-button"
                title="Bỏ sách"
                @click="
                  removeBook(
                    item.book._id,
                  )
                "
              >
                <i class="bi bi-trash3" />
              </button>
            </article>
          </div>

          <div
            v-else
            class="empty-selected-books"
          >
            <div>
              <i class="bi bi-book" />
            </div>

            <strong>
              Chưa chọn sách
            </strong>

            <span>
              Chọn sách từ danh sách phía
              trên để lập phiếu mượn.
            </span>
          </div>
        </section>

        <!-- Ghi chú -->
        <section class="form-card">
          <div class="section-heading">
            <div>
              <h2>
                Ghi chú
              </h2>

              <p>
                Nội dung bổ sung cho phiếu
                mượn.
              </p>
            </div>
          </div>

          <div class="textarea-wrapper">
            <i
              class="bi bi-chat-left-text"
            />

            <textarea
              v-model="form.note"
              rows="4"
              maxlength="500"
              placeholder="Nhập ghi chú cho phiếu mượn..."
            />
          </div>

          <small class="character-count">
            {{ form.note.length }}/500
          </small>
        </section>
      </main>

      <!-- Cột xem trước -->
      <aside class="summary-column">
        <section class="summary-card">
          <div class="summary-header">
            <div class="summary-icon">
              <i
                class="bi bi-receipt"
              />
            </div>

            <div>
              <h2>
                Tóm tắt phiếu
              </h2>

              <p>
                Kiểm tra trước khi lưu.
              </p>
            </div>
          </div>

          <div class="summary-reader">
            <div class="summary-avatar">
              {{
                selectedReader
                  ? getReaderInitials(
                      selectedReader,
                    )
                  : "ĐG"
              }}
            </div>

            <div>
              <span>Độc giả</span>

              <strong>
                {{
                  selectedReader
                    ? getReaderFullName(
                        selectedReader,
                      )
                    : "Chưa chọn"
                }}
              </strong>

              <small>
                {{
                  selectedReader
                    ?.readerCode ||
                  "Chưa có mã"
                }}
              </small>
            </div>
          </div>

          <div class="summary-information">
            <div>
              <span>
                <i
                  class="bi bi-calendar-plus"
                />

                Ngày mượn
              </span>

              <strong>
                {{
                  form.borrowDate ||
                  "Chưa chọn"
                }}
              </strong>
            </div>

            <div>
              <span>
                <i
                  class="bi bi-calendar-event"
                />

                Hạn trả
              </span>

              <strong>
                {{
                  form.dueDate ||
                  "Chưa chọn"
                }}
              </strong>
            </div>

            <div>
              <span>
                <i class="bi bi-bookshelf" />

                Số đầu sách
              </span>

              <strong>
                {{ totalBookTitles }}
              </strong>
            </div>

            <div>
              <span>
                <i class="bi bi-stack" />

                Tổng số lượng
              </span>

              <strong>
                {{ totalBookQuantity }}
              </strong>
            </div>

            <div class="summary-total-item">
              <span>
                <i class="bi bi-cash-stack" />

                Tổng tiền
              </span>

              <strong class="total-money">
                {{
                  formatCurrency(
                    totalAmount,
                  )
                }}
              </strong>
            </div>
          </div>


          <div
            v-if="
              selectedBooks.length > 0
            "
            class="summary-book-list"
          >
            <div
              v-for="item in selectedBooks"
              :key="item.book._id"
            >
              <span>
                {{
                  getBookTitle(
                    item.book,
                  )
                }}
              </span>

              <strong>
                × {{ item.quantity }}
              </strong>
            </div>
          </div>

          <div class="summary-actions">
            <button
              type="button"
              class="cancel-button"
              :disabled="submitting"
              @click="
                router.push('/borrows')
              "
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
                class="bi bi-check-lg"
              />

              {{
                submitting
                  ? "Đang lưu..."
                  : "Lập phiếu mượn"
              }}
            </button>
          </div>
        </section>
      </aside>
    </form>
  </section>
</template>

<style scoped>
.borrow-form-page {
  width: 100%;
  max-width: 1500px;
  min-width: 0;
  margin: 0 auto;
}

/* =========================================
   ĐIỀU HƯỚNG VÀ THÔNG BÁO
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
  font-size: 13px;
  font-weight: 700;
}

.custom-alert {
  min-height: 48px;
  margin-bottom: 20px;
  padding: 12px 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #fecaca;
  border-radius: 12px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 12px;
  font-weight: 600;
}

.custom-alert span {
  min-width: 0;
  flex: 1;
}

.custom-alert button {
  width: 28px;
  height: 28px;
  padding: 0;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: inherit;
}

.loading-card {
  min-height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  border: 1px solid #e7edf5;
  border-radius: 21px;
  background: #fff;
  box-shadow:
    0 10px 28px
    rgb(15 23 42 / 6%);
}

.loading-card strong {
  margin-top: 15px;
  color: #334155;
}

.loading-card span {
  margin-top: 6px;
  color: #94a3b8;
  font-size: 12px;
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

.form-card,
.summary-card {
  min-width: 0;
  border: 1px solid #e7edf5;
  border-radius: 21px;
  background: #fff;
  box-shadow:
    0 10px 28px
    rgb(15 23 42 / 6%);
}

.form-card {
  padding: 25px;
}

/* =========================================
   TIÊU ĐỀ
========================================= */

.card-heading,
.section-heading {
  margin-bottom: 22px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
}

.card-heading {
  justify-content: flex-start;
}

.heading-icon {
  width: 50px;
  height: 50px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 14px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 21px;
}

.card-heading h1,
.section-heading h2,
.summary-header h2 {
  margin: 0;
  color: #1e3a8a;
  font-weight: 800;
}

.card-heading h1 {
  font-size: 22px;
}

.section-heading h2,
.summary-header h2 {
  font-size: 18px;
}

.card-heading p,
.section-heading p,
.summary-header p {
  margin: 5px 0 0;
  color: #94a3b8;
  font-size: 11px;
}

.required-badge,
.book-count-badge,
.selected-count {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 800;
  white-space: nowrap;
}

.required-badge {
  background: #fef2f2;
  color: #dc2626;
}

.book-count-badge,
.selected-count {
  background: #eff6ff;
  color: #2563eb;
}

/* =========================================
   FORM
========================================= */

.date-grid,
.reader-search {
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 15px;
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

.input-icon-wrapper {
  position: relative;
}

.input-icon-wrapper > i {
  position: absolute;
  z-index: 1;
  top: 50%;
  left: 14px;
  color: #94a3b8;
  transform: translateY(-50%);
  pointer-events: none;
}

.input-icon-wrapper input,
.reader-select,
.textarea-wrapper textarea {
  width: 100%;
  border: 1px solid #dce5f0;
  border-radius: 10px;
  background: #fff;
  color: #334155;
  font-size: 12px;
  outline: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.input-icon-wrapper input,
.reader-select {
  height: 44px;
}

.input-icon-wrapper input {
  padding: 0 13px 0 41px;
}

.reader-select {
  padding: 0 12px;
}

.input-icon-wrapper input:focus,
.reader-select:focus,
.textarea-wrapper textarea:focus {
  border-color: #60a5fa;
  box-shadow:
    0 0 0 3px
    rgb(59 130 246 / 12%);
}

/* =========================================
   ĐỘC GIẢ ĐƯỢC CHỌN
========================================= */

.selected-reader-card {
  margin-top: 16px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 13px;
  border: 1px solid #bfdbfe;
  border-radius: 13px;
  background: #f8fbff;
}

.reader-avatar,
.summary-avatar {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: linear-gradient(
    135deg,
    #dbeafe,
    #eff6ff
  );
  color: #2563eb;
  font-weight: 900;
}

.reader-avatar {
  width: 48px;
  height: 48px;
  border-radius: 13px;
  font-size: 13px;
}

.reader-content {
  min-width: 0;
  flex: 1;
}

.reader-content > span,
.reader-content > strong {
  display: block;
}

.reader-content > span {
  color: #3b82f6;
  font-size: 9px;
  font-weight: 900;
}

.reader-content > strong {
  margin-top: 3px;
  color: #1e3a8a;
  font-size: 13px;
}

.reader-details {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.reader-details small {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #64748b;
  font-size: 10px;
}

.clear-reader-button {
  width: 34px;
  height: 34px;
  padding: 0;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 9px;
  background: #fee2e2;
  color: #dc2626;
}

/* =========================================
   DANH SÁCH SÁCH
========================================= */

.book-search {
  margin-bottom: 16px;
}

.book-catalog {
  max-height: 550px;
  padding-right: 5px;
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 12px;
  overflow-y: auto;
}

.catalog-book {
  min-width: 0;
  padding: 12px;
  display: grid;
  grid-template-columns:
    54px
    minmax(0, 1fr);
  gap: 11px;
  border: 1px solid #e7edf5;
  border-radius: 13px;
  background: #fff;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.catalog-book:hover {
  border-color: #bfdbfe;
  box-shadow:
    0 7px 17px
    rgb(37 99 235 / 8%);
}

.catalog-book.selected {
  border-color: #86efac;
  background: #f0fdf4;
}

.book-cover,
.selected-book-cover {
  overflow: hidden;
  flex-shrink: 0;
  border-radius: 8px;
  background: #eff6ff;
}

.book-cover {
  width: 54px;
  height: 73px;
}

.book-cover img,
.selected-book-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: #60a5fa;
  font-size: 20px;
}

.catalog-content {
  min-width: 0;
}

.book-code,
.catalog-content > strong,
.catalog-content > small {
  display: block;
}

.book-code {
  color: #3b82f6;
  font-size: 8px;
  font-weight: 900;
}

.catalog-content > strong {
  margin-top: 3px;
  overflow: hidden;
  color: #1e3a8a;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.catalog-content > small {
  margin-top: 5px;
  overflow: hidden;
  color: #64748b;
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stock-row {
  margin-top: 7px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: #94a3b8;
  font-size: 8px;
}

.stock-row b {
  color: #059669;
}

.add-book-button {
  height: 32px;
  margin-top: 10px;
  grid-column: 1 / -1;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  border: 0;
  border-radius: 8px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 10px;
  font-weight: 800;
}

.add-book-button.added {
  background: #d1fae5;
  color: #059669;
}

.empty-books {
  min-height: 180px;
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  border: 1px dashed #cbd5e1;
  border-radius: 13px;
  color: #94a3b8;
  text-align: center;
}

.empty-books i {
  font-size: 28px;
}

.empty-books strong {
  margin-top: 10px;
  color: #475569;
}

.empty-books span {
  margin-top: 5px;
  font-size: 11px;
}

/* =========================================
   SÁCH ĐÃ CHỌN
========================================= */

.selected-book-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.selected-book-item {
  padding: 11px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #e7edf5;
  border-radius: 12px;
  background: #fff;
}

.selected-book-cover {
  width: 45px;
  height: 62px;
}

.selected-book-info {
  min-width: 0;
  flex: 1;
}

.selected-book-info span,
.selected-book-info strong,
.selected-book-info small {
  display: block;
}

.selected-book-info span {
  color: #3b82f6;
  font-size: 8px;
  font-weight: 900;
}

.selected-book-info strong {
  margin-top: 3px;
  overflow: hidden;
  color: #1e3a8a;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-book-info small {
  margin-top: 5px;
  color: #94a3b8;
  font-size: 9px;
}

.quantity-control {
  display: flex;
  align-items: center;
  overflow: hidden;
  border: 1px solid #dce5f0;
  border-radius: 9px;
}

.quantity-control button {
  width: 32px;
  height: 34px;
  padding: 0;
  border: 0;
  background: #f8fafc;
  color: #475569;
}

.quantity-control input {
  width: 43px;
  height: 34px;
  border: 0;
  border-right: 1px solid #dce5f0;
  border-left: 1px solid #dce5f0;
  color: #334155;
  font-size: 11px;
  font-weight: 800;
  text-align: center;
  outline: none;
}

.quantity-control input::-webkit-inner-spin-button,
.quantity-control input::-webkit-outer-spin-button {
  margin: 0;
  appearance: none;
}

.remove-book-button {
  width: 34px;
  height: 34px;
  padding: 0;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border: 0;
  border-radius: 9px;
  background: #fee2e2;
  color: #dc2626;
}

.empty-selected-books {
  min-height: 180px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  border: 1px dashed #cbd5e1;
  border-radius: 13px;
  text-align: center;
}

.empty-selected-books > div {
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  border-radius: 17px;
  background: #eff6ff;
  color: #3b82f6;
  font-size: 23px;
}

.empty-selected-books strong {
  margin-top: 13px;
  color: #475569;
}

.empty-selected-books span {
  margin-top: 5px;
  color: #94a3b8;
  font-size: 11px;
}

/* =========================================
   GHI CHÚ
========================================= */

.textarea-wrapper {
  position: relative;
}

.textarea-wrapper > i {
  position: absolute;
  top: 14px;
  left: 14px;
  color: #94a3b8;
}

.textarea-wrapper textarea {
  min-height: 110px;
  padding: 13px 14px 13px 41px;
  resize: vertical;
}

.character-count {
  margin-top: 7px;
  display: block;
  color: #94a3b8;
  font-size: 9px;
  text-align: right;
}

/* =========================================
   TÓM TẮT
========================================= */

.summary-column {
  min-width: 0;
}

.summary-card {
  padding: 22px;
  position: sticky;
  top: 20px;
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.summary-icon {
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

.summary-reader {
  margin-top: 21px;
  padding: 13px;
  display: flex;
  align-items: center;
  gap: 11px;
  border-radius: 12px;
  background: #f8fafc;
}

.summary-avatar {
  width: 43px;
  height: 43px;
  border-radius: 12px;
  font-size: 12px;
}

.summary-reader span,
.summary-reader strong,
.summary-reader small {
  display: block;
}

.summary-reader span {
  color: #94a3b8;
  font-size: 8px;
  font-weight: 800;
  text-transform: uppercase;
}

.summary-reader strong {
  margin-top: 3px;
  color: #1e3a8a;
  font-size: 11px;
}

.summary-reader small {
  margin-top: 3px;
  color: #3b82f6;
  font-size: 8px;
}

.summary-information {
  margin-top: 17px;
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 9px;
}

.summary-information > div {
  padding: 11px;
  border: 1px solid #e7edf5;
  border-radius: 10px;
}

.summary-information span,
.summary-information strong {
  display: block;
}

.summary-information span {
  color: #94a3b8;
  font-size: 8px;
  font-weight: 700;
}

.summary-information span i {
  margin-right: 4px;
}

.summary-information strong {
  margin-top: 5px;
  color: #334155;
  font-size: 10px;
}

.summary-book-list {
  max-height: 210px;
  margin-top: 17px;
  padding-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 9px;
  overflow-y: auto;
  border-top: 1px solid #edf2f7;
}

.summary-book-list > div {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.summary-book-list span {
  min-width: 0;
  overflow: hidden;
  color: #64748b;
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-book-list strong {
  flex-shrink: 0;
  color: #2563eb;
  font-size: 9px;
}

.summary-actions {
  margin-top: 21px;
  display: grid;
  grid-template-columns:
    90px
    minmax(0, 1fr);
  gap: 9px;
}

.cancel-button,
.submit-button {
  min-height: 42px;
  padding: 0 13px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 7px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 800;
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

.cancel-button:disabled,
.submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

/* =========================================
   RESPONSIVE
========================================= */

@media (max-width: 1100px) {
  .form-layout {
    grid-template-columns: 1fr;
  }

  .summary-card {
    position: static;
  }
}

@media (max-width: 750px) {
  .date-grid,
  .reader-search,
  .book-catalog {
    grid-template-columns: 1fr;
  }

  .selected-book-item {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .selected-book-info {
    width: calc(100% - 70px);
  }

  .quantity-control {
    margin-left: 57px;
  }
}

@media (max-width: 500px) {
  .form-card,
  .summary-card {
    padding: 18px;
    border-radius: 17px;
  }

  .card-heading,
  .section-heading {
    align-items: flex-start;
  }

  .card-heading h1 {
    font-size: 19px;
  }

  .reader-details {
    flex-direction: column;
    gap: 5px;
  }

  .summary-information {
    grid-template-columns: 1fr;
  }

  .summary-actions {
    grid-template-columns: 1fr;
  }

  .quantity-control {
    margin-left: 0;
  }
}
.selected-book-price {
  margin-top: 7px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.selected-book-price span {
  color: #64748b;
  font-size: 9px;
}

.selected-book-price strong {
  color: #dc2626;
  font-size: 10px;
  font-weight: 800;
}

.summary-total-item {
  grid-column: 1 / -1;
  border-color: #fecaca !important;
  background: #fff7f7;
}

.total-money {
  color: #dc2626 !important;
  font-size: 16px !important;
  font-weight: 900;
}
</style>