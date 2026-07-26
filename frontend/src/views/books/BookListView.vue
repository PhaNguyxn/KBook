<script setup>
import {
  computed,
  onMounted,
  reactive,
  ref,
} from "vue";

import { RouterLink } from "vue-router";

import { bookApi } from "@/api/bookApi";
import { publisherApi } from "@/api/publisherApi";
import { getErrorMessage } from "@/utils/error";

/* =========================================
   STATE
========================================= */

const books = ref([]);
const publishers = ref([]);

const loading = ref(false);
const loadingPublishers = ref(false);
const processingId = ref("");

const errorMessage = ref("");
const successMessage = ref("");

const imageErrors = reactive({});

const filters = reactive({
  keyword: "",
  category: "",
  publisher: "",
  sort: "latest",
  page: 1,
  limit: 10,
});

const pagination = reactive({
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
});

/* =========================================
   QUYỀN NGƯỜI DÙNG
========================================= */

const currentEmployee = computed(() => {
  try {
    const rawEmployee =
      localStorage.getItem("employee") ||
      localStorage.getItem("user");

    return rawEmployee
      ? JSON.parse(rawEmployee)
      : {};
  } catch {
    return {};
  }
});

const isAdmin = computed(() => {
  return (
    String(
      currentEmployee.value?.role || "",
    ).toLowerCase() === "admin"
  );
});

/* =========================================
   PHÂN TRANG
========================================= */

const visiblePages = computed(() => {
  const total = pagination.totalPages;
  const current = pagination.page;

  if (total <= 0) {
    return [];
  }

  if (total <= 7) {
    return Array.from(
      { length: total },
      (_, index) => index + 1,
    );
  }

  const pages = [1];

  let start = Math.max(
    current - 2,
    2,
  );

  let end = Math.min(
    current + 2,
    total - 1,
  );

  if (current <= 4) {
    start = 2;
    end = 5;
  }

  if (current >= total - 3) {
    start = total - 4;
    end = total - 1;
  }

  if (start > 2) {
    pages.push("left-dots");
  }

  for (
    let page = start;
    page <= end;
    page += 1
  ) {
    pages.push(page);
  }

  if (end < total - 1) {
    pages.push("right-dots");
  }

  pages.push(total);

  return pages;
});

const firstDisplayedRecord = computed(() => {
  if (pagination.total === 0) {
    return 0;
  }

  return (
    (pagination.page - 1) *
      pagination.limit +
    1
  );
});

const lastDisplayedRecord = computed(() => {
  return Math.min(
    pagination.page *
      pagination.limit,
    pagination.total,
  );
});

/* =========================================
   HÀM HỖ TRỢ
========================================= */

function clearMessages() {
  errorMessage.value = "";
  successMessage.value = "";
}

function getPublisherName(book) {
  if (
    book.publisher &&
    typeof book.publisher === "object"
  ) {
    return (
      book.publisher.publisherName ||
      book.publisher.name ||
      "Chưa cập nhật"
    );
  }

  return (
    book.publisherName ||
    "Chưa cập nhật"
  );
}

function getBookImage(book) {
  const value =
    book.image ||
    book.coverImage ||
    book.thumbnail ||
    book.img ||
    book.img1 ||
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

  const serverUrl =
    import.meta.env.VITE_SERVER_URL ||
    "http://localhost:3000";

  const cleanPath = value.replace(
    /^\/+/,
    "",
  );

  return `${serverUrl}/${cleanPath}`;
}

function markImageError(bookId) {
  imageErrors[bookId] = true;
}

function getTotalQuantity(book) {
  return Number(
    book.quantity ??
      book.totalQuantity ??
      0,
  );
}

function getAvailableQuantity(book) {
  return Number(
    book.available ??
      book.availableQuantity ??
      0,
  );
}

function getBorrowedQuantity(book) {
  return Math.max(
    getTotalQuantity(book) -
      getAvailableQuantity(book),
    0,
  );
}

function getAvailablePercent(book) {
  const total =
    getTotalQuantity(book);

  const available =
    getAvailableQuantity(book);

  if (total <= 0) {
    return 0;
  }

  return Math.min(
    Math.max(
      (available / total) * 100,
      0,
    ),
    100,
  );
}

function getStockStatus(book) {
  const available =
    getAvailableQuantity(book);

  if (available <= 0) {
    return {
      label: "Hết sách",
      className: "stock-out",
      icon: "bi-x-circle-fill",
    };
  }

  if (available <= 3) {
    return {
      label: "Sắp hết",
      className: "stock-low",
      icon:
        "bi-exclamation-circle-fill",
    };
  }

  return {
    label: "Còn sách",
    className: "stock-available",
    icon: "bi-check-circle-fill",
  };
}

function getProgressClass(book) {
  const available =
    getAvailableQuantity(book);

  if (available <= 0) {
    return "progress-out";
  }

  if (available <= 3) {
    return "progress-low";
  }

  return "progress-available";
}

function getBookCode(book) {
  return (
    book.bookCode ||
    book.code ||
    "—"
  );
}

function getBookTitle(book) {
  return (
    book.title ||
    book.name ||
    "Chưa cập nhật tên sách"
  );
}

function getBookCategory(book) {
  return (
    book.category ||
    book.genre ||
    "Chưa phân loại"
  );
}

function formatPrice(value) {
  const price = Number(value);

  if (!Number.isFinite(price)) {
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

/* =========================================
   TẢI NHÀ XUẤT BẢN
========================================= */

async function loadPublishers() {
  loadingPublishers.value = true;

  try {
    const response =
      await publisherApi.getAll({
        page: 1,
        limit: 100,
        sort: "name-asc",
      });

    const payload =
      response?.data?.data ??
      response?.data ??
      {};

    if (Array.isArray(payload)) {
      publishers.value = payload;
      return;
    }

    publishers.value =
      payload.publishers ||
      payload.items ||
      [];
  } catch (error) {
    console.error(
      "Load publishers error:",
      error,
    );

    publishers.value = [];
  } finally {
    loadingPublishers.value = false;
  }
}

/* =========================================
   TẢI DANH SÁCH SÁCH
========================================= */

async function loadBooks() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response =
      await bookApi.getAll({
        page: filters.page,
        limit: filters.limit,

        keyword:
          filters.keyword.trim() ||
          undefined,

        category:
          filters.category.trim() ||
          undefined,

        publisher:
          filters.publisher ||
          undefined,

        sort:
          filters.sort ||
          undefined,
      });

    const payload =
      response?.data?.data ??
      response?.data ??
      {};

    if (Array.isArray(payload)) {
      books.value = payload;

      Object.assign(
        pagination,
        {
          total:
            payload.length,

          page: 1,

          limit:
            payload.length ||
            10,

          totalPages:
            payload.length > 0
              ? 1
              : 0,

          hasPreviousPage: false,
          hasNextPage: false,
        },
      );

      return;
    }

    books.value =
      payload.books ||
      payload.items ||
      payload.results ||
      [];

    const pageData =
      payload.pagination ||
      {};

    const total =
      Number(
        pageData.total ??
          payload.total ??
          books.value.length,
      ) || 0;

    const page =
      Number(
        pageData.page ??
          filters.page,
      ) || 1;

    const limit =
      Number(
        pageData.limit ??
          filters.limit,
      ) || 10;

    const totalPages =
      Number(
        pageData.totalPages ??
          Math.ceil(
            total / limit,
          ),
      ) || 0;

    Object.assign(
      pagination,
      {
        total,
        page,
        limit,
        totalPages,

        hasPreviousPage:
          pageData
            .hasPreviousPage ??
          page > 1,

        hasNextPage:
          pageData
            .hasNextPage ??
          page < totalPages,
      },
    );

    filters.page =
      pagination.page;
  } catch (error) {
    console.error(
      "Load books error:",
      error,
    );

    books.value = [];

    errorMessage.value =
      getErrorMessage(
        error,
        "Không thể tải danh sách sách",
      );
  } finally {
    loading.value = false;
  }
}

/* =========================================
   BỘ LỌC
========================================= */

function searchBooks() {
  clearMessages();
  filters.page = 1;
  loadBooks();
}

function resetFilters() {
  clearMessages();

  filters.keyword = "";
  filters.category = "";
  filters.publisher = "";
  filters.sort = "latest";
  filters.page = 1;
  filters.limit = 10;

  loadBooks();
}

function handleLimitChange() {
  clearMessages();
  filters.page = 1;
  loadBooks();
}

function handleFilterChange() {
  clearMessages();
  filters.page = 1;
  loadBooks();
}

/* =========================================
   CHUYỂN TRANG
========================================= */

function changePage(page) {
  const nextPage =
    Number(page);

  if (
    !Number.isInteger(
      nextPage,
    ) ||
    nextPage < 1 ||
    nextPage >
      pagination.totalPages ||
    nextPage ===
      pagination.page
  ) {
    return;
  }

  filters.page =
    nextPage;

  loadBooks();

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

/* =========================================
   XÓA SÁCH
========================================= */

async function deleteBook(book) {
  const confirmed =
    window.confirm(
      `Bạn có chắc muốn xóa sách "${getBookTitle(
        book,
      )}"?`,
    );

  if (!confirmed) {
    return;
  }

  clearMessages();

  processingId.value =
    book._id;

  try {
    await bookApi.delete(
      book._id,
    );

    successMessage.value =
      "Xóa sách thành công";

    /*
     * Nếu trang hiện tại chỉ còn
     * một sách thì quay lại trang trước.
     */
    if (
      books.value.length === 1 &&
      filters.page > 1
    ) {
      filters.page -= 1;
    }

    await loadBooks();
  } catch (error) {
    errorMessage.value =
      getErrorMessage(
        error,
        "Không thể xóa sách",
      );
  } finally {
    processingId.value = "";
  }
}

/* =========================================
   KHỞI TẠO TRANG
========================================= */

onMounted(async () => {
  await Promise.all([
    loadPublishers(),
    loadBooks(),
  ]);
});
</script>

<template>
  <section class="book-page">
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

    <!-- Thông báo thành công -->
    <div
      v-if="successMessage"
      class="alert alert-success"
      role="alert"
    >
      <i
        class="bi bi-check-circle-fill me-2"
      />

      {{ successMessage }}
    </div>

    <!-- Bộ lọc -->
    <div class="filter-card">
      <div class="filter-heading">
        <div>
          <h2>
            Quản lý sách
          </h2>
        </div>

        <RouterLink
          to="/books/create"
          class="add-book-button"
        >
          <i class="bi bi-plus-lg" />
          Thêm sách mới
        </RouterLink>
      </div>

      <form
        class="filter-grid"
        @submit.prevent="searchBooks"
      >
        <!-- Từ khóa -->
        <div class="search-field">
          <label for="bookKeyword">
            Tìm kiếm sách
          </label>

          <div
            class="input-icon-wrapper"
          >
            <i class="bi bi-search" />

            <input
              id="bookKeyword"
              v-model="
                filters.keyword
              "
              type="search"
              placeholder="Nhập mã sách, tên sách, tác giả hoặc thể loại..."
            />
          </div>
        </div>

        <!-- Thể loại -->
        <div>
          <label for="bookCategory">
            Thể loại
          </label>

          <input
            id="bookCategory"
            v-model="
              filters.category
            "
            type="text"
            class="custom-input"
            placeholder="Ví dụ: Công nghệ"
          />
        </div>

        <!-- Nhà xuất bản -->
        <div>
          <label for="bookPublisher">
            Nhà xuất bản
          </label>

          <select
            id="bookPublisher"
            v-model="
              filters.publisher
            "
            class="custom-select"
            :disabled="
              loadingPublishers
            "
            @change="
              handleFilterChange
            "
          >
            <option value="">
              Tất cả nhà xuất bản
            </option>

            <option
              v-for="publisher in publishers"
              :key="publisher._id"
              :value="publisher._id"
            >
              {{
                publisher.publisherName ||
                publisher.name
              }}
            </option>
          </select>
        </div>

        <!-- Sắp xếp -->
        <div>
          <label for="bookSort">
            Sắp xếp
          </label>

          <select
            id="bookSort"
            v-model="filters.sort"
            class="custom-select"
            @change="
              handleFilterChange
            "
          >
            <option value="latest">
              Mới nhất
            </option>

            <option value="oldest">
              Cũ nhất
            </option>

            <option value="title-asc">
              Tên A–Z
            </option>

            <option value="title-desc">
              Tên Z–A
            </option>

            <option value="price-desc">
              Giá giảm dần
            </option>

            <option value="price-asc">
              Giá tăng dần
            </option>

            <option
              value="available-desc"
            >
              Số lượng giảm dần
            </option>

            <option
              value="available-asc"
            >
              Số lượng tăng dần
            </option>
          </select>
        </div>

        <!-- Số dòng -->
        <div>
          <label for="bookLimit">
            Số dòng
          </label>

          <select
            id="bookLimit"
            v-model.number="
              filters.limit
            "
            class="custom-select"
            @change="
              handleLimitChange
            "
          >
            <option :value="5">
              5 dòng
            </option>

            <option :value="10">
              10 dòng
            </option>

            <option :value="20">
              20 dòng
            </option>

            <option :value="50">
              50 dòng
            </option>
          </select>
        </div>

        <!-- Đặt lại -->
        <button
          type="button"
          class="reset-filter-button"
          :disabled="loading"
          @click="resetFilters"
        >
          <i
            class="bi bi-arrow-counterclockwise"
          />

          Đặt lại
        </button>

        <!-- Tìm kiếm -->
        <button
          type="submit"
          class="search-button"
          :disabled="loading"
        >
          <i class="bi bi-search" />

          {{
            loading
              ? "Đang tìm..."
              : "Tìm kiếm"
          }}
        </button>
      </form>
    </div>

    <!-- Bảng sách -->
    <div class="book-table-card">
      <div
        class="table-card-header"
      >
        <div>
          <h2>Danh sách sách</h2>
        </div>
      </div>

      <!-- Đang tải -->
      <div
        v-if="loading"
        class="loading-state"
      >
        <div class="loading-icon">
          <div
            class="spinner-border text-primary"
            role="status"
          />
        </div>

        <strong>
          Đang tải danh sách sách
        </strong>

        <span>
          Vui lòng chờ trong giây lát...
        </span>
      </div>

      <!-- Bảng dữ liệu -->
      <div
        v-else
        class="table-responsive"
      >
        <table class="book-table">
          <thead>
            <tr>
              <th class="stt-column">
                STT
              </th>

              <th>Sách</th>

              <th>
                Nhà xuất bản
              </th>

              <th>Thể loại</th>

              <th>Đơn giá</th>

              <th>Tồn kho</th>

              <th>Trạng thái</th>

              <th class="action-column">
                Thao tác
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(
                book,
                index
              ) in books"
              :key="book._id"
            >
              <!-- STT -->
              <td class="stt-cell">
                {{
                  (pagination.page -
                    1) *
                    pagination.limit +
                  index +
                  1
                }}
              </td>

              <!-- Thông tin sách -->
              <td>
                <div
                  class="book-information"
                >
                  <div class="book-cover">
                    <img
                      v-if="
                        getBookImage(
                          book,
                        ) &&
                        !imageErrors[
                          book._id
                        ]
                      "
                      :src="
                        getBookImage(
                          book,
                        )
                      "
                      :alt="
                        getBookTitle(
                          book,
                        )
                      "
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
                      <i
                        class="bi bi-book"
                      />
                    </div>
                  </div>

                  <div class="book-text">
                    <span
                      class="book-code"
                    >
                      {{
                        getBookCode(
                          book,
                        )
                      }}
                    </span>

                    <RouterLink
                      :to="`/books/${book._id}`"
                      class="book-title"
                    >
                      {{
                        getBookTitle(
                          book,
                        )
                      }}
                    </RouterLink>

                    <span
                      class="book-author"
                    >
                      <i
                        class="bi bi-person"
                      />

                      {{
                        book.author ||
                        "Chưa cập nhật tác giả"
                      }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- Nhà xuất bản -->
              <td>
                <div
                  class="publisher-information"
                >
                  <div
                    class="publisher-icon"
                  >
                    <i
                      class="bi bi-building"
                    />
                  </div>

                  <span>
                    {{
                      getPublisherName(
                        book,
                      )
                    }}
                  </span>
                </div>
              </td>

              <!-- Thể loại -->
              <td>
                <span
                  class="category-badge"
                >
                  <i
                    class="bi bi-tag-fill"
                  />

                  {{
                    getBookCategory(
                      book,
                    )
                  }}
                </span>
              </td>

              <!-- Đơn giá -->
              <td>
                <span
                  class="book-price"
                >
                  {{
                    formatPrice(
                      book.price,
                    )
                  }}
                </span>
              </td>

              <!-- Tồn kho -->
              <td>
                <div
                  class="stock-information"
                >
                  <div
                    class="stock-number"
                  >
                    <strong>
                      {{
                        getAvailableQuantity(
                          book,
                        )
                      }}
                    </strong>

                    <span>
                      /
                      {{
                        getTotalQuantity(
                          book,
                        )
                      }}
                    </span>
                  </div>

                  <div
                    class="stock-progress"
                  >
                    <div
                      class="stock-progress-value"
                      :class="
                        getProgressClass(
                          book,
                        )
                      "
                      :style="{
                        width:
                          getAvailablePercent(
                            book,
                          ) + '%',
                      }"
                    />
                  </div>

                  <small>
                    Đã mượn:
                    {{
                      getBorrowedQuantity(
                        book,
                      )
                    }}
                  </small>
                </div>
              </td>

              <!-- Trạng thái -->
              <td>
                <span
                  class="stock-status"
                  :class="
                    getStockStatus(
                      book,
                    ).className
                  "
                >
                  <i
                    class="bi"
                    :class="
                      getStockStatus(
                        book,
                      ).icon
                    "
                  />

                  {{
                    getStockStatus(
                      book,
                    ).label
                  }}
                </span>
              </td>

              <!-- Thao tác -->
              <td>
                <div
                  class="action-buttons"
                >
                  <RouterLink
                    :to="`/books/${book._id}`"
                    class="action-button action-view"
                    title="Xem chi tiết"
                  >
                    <i
                      class="bi bi-eye"
                    />
                  </RouterLink>

                  <RouterLink
                    :to="`/books/${book._id}/edit`"
                    class="action-button action-edit"
                    title="Cập nhật sách"
                  >
                    <i
                      class="bi bi-pencil-square"
                    />
                  </RouterLink>

                  <button
                    type="button"
                    class="action-button action-delete"
                    title="Xóa sách"
                    :disabled="
                      processingId ===
                      book._id
                    "
                    @click="
                      deleteBook(book)
                    "
                  >
                    <span
                      v-if="
                        processingId ===
                        book._id
                      "
                      class="spinner-border spinner-border-sm"
                    />

                    <i
                      v-else
                      class="bi bi-trash3"
                    />
                  </button>
                </div>
              </td>
            </tr>

            <!-- Không có dữ liệu -->
            <tr
              v-if="
                books.length === 0
              "
            >
              <td
                colspan="8"
                class="empty-table-cell"
              >
                <div
                  class="empty-state"
                >
                  <div
                    class="empty-icon"
                  >
                    <i
                      class="bi bi-journal-x"
                    />
                  </div>

                  <h3>
                    Không tìm thấy sách
                  </h3>

                  <p>
                    Không có đầu sách phù
                    hợp với điều kiện tìm
                    kiếm hiện tại.
                  </p>

                  <button
                    type="button"
                    class="empty-reset-button"
                    @click="
                      resetFilters
                    "
                  >
                    <i
                      class="bi bi-arrow-counterclockwise"
                    />

                    Xóa bộ lọc
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Phân trang -->
      <div
        v-if="
          !loading &&
          pagination.total > 0
        "
        class="pagination-container"
      >
        <div
          class="pagination-information"
        >
          Hiển thị

          <strong>
            {{
              firstDisplayedRecord
            }}
          </strong>

          đến

          <strong>
            {{
              lastDisplayedRecord
            }}
          </strong>

          trong tổng số

          <strong>
            {{ pagination.total }}
          </strong>

          đầu sách
        </div>

        <nav
          class="pagination-buttons"
          aria-label="Phân trang sách"
        >
          <button
            type="button"
            class="page-button"
            :disabled="
              !pagination
                .hasPreviousPage
            "
            title="Trang trước"
            @click="
              changePage(
                pagination.page -
                  1,
              )
            "
          >
            <i
              class="bi bi-chevron-left"
            />
          </button>

          <template
            v-for="page in visiblePages"
            :key="page"
          >
            <span
              v-if="
                page ===
                  'left-dots' ||
                page ===
                  'right-dots'
              "
              class="page-dots"
            >
              …
            </span>

            <button
              v-else
              type="button"
              class="page-button"
              :class="{
                active:
                  page ===
                  pagination.page,
              }"
              @click="
                changePage(page)
              "
            >
              {{ page }}
            </button>
          </template>

          <button
            type="button"
            class="page-button"
            :disabled="
              !pagination
                .hasNextPage
            "
            title="Trang sau"
            @click="
              changePage(
                pagination.page +
                  1,
              )
            "
          >
            <i
              class="bi bi-chevron-right"
            />
          </button>
        </nav>
      </div>
    </div>
  </section>
</template>

<style scoped>
.book-page {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

/* =========================================
   NÚT THÊM SÁCH
========================================= */

.add-book-button {
  height: 43px;
  padding: 0 17px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  border: 0;
  border-radius: 10px;
  background: linear-gradient(
    135deg,
    #438df8,
    #2563eb
  );
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
  box-shadow:
    0 8px 18px
    rgb(37 99 235 / 20%);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.add-book-button:hover {
  color: #fff;
  transform: translateY(-2px);
  box-shadow:
    0 11px 23px
    rgb(37 99 235 / 26%);
}

/* =========================================
   FILTER
========================================= */

.filter-card,
.book-table-card {
  border: 1px solid #e7edf5;
  border-radius: 21px;
  background: #fff;
  box-shadow:
    0 10px 28px
    rgb(15 23 42 / 6%);
}

.filter-card {
  padding: 24px;
}

.filter-heading {
  margin-bottom: 20px;
  display: flex;
  justify-content:
    space-between;
  align-items: center;
  gap: 17px;
}

.filter-heading h2,
.table-card-header h2 {
  margin: 0;
  color: #1e3a8a;
  font-size: 20px;
  font-weight: 800;
}

.filter-grid {
  display: grid;
  grid-template-columns:
    minmax(260px, 2fr)
    minmax(145px, 1fr)
    minmax(165px, 1fr)
    minmax(145px, 1fr)
    minmax(105px, 0.7fr)
    110px
    110px;
  align-items: end;
  gap: 13px;
}

.filter-grid label {
  margin-bottom: 7px;
  display: block;
  color: #475569;
  font-size: 11px;
  font-weight: 800;
}

.input-icon-wrapper {
  position: relative;
}

.input-icon-wrapper i {
  position: absolute;
  top: 50%;
  left: 14px;
  color: #94a3b8;
  transform: translateY(-50%);
}

.input-icon-wrapper input,
.custom-input,
.custom-select {
  width: 100%;
  height: 43px;
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

.input-icon-wrapper input {
  padding: 0 13px 0 40px;
}

.custom-input,
.custom-select {
  padding: 0 12px;
}

.input-icon-wrapper input:focus,
.custom-input:focus,
.custom-select:focus {
  border-color: #60a5fa;
  box-shadow:
    0 0 0 3px
    rgb(59 130 246 / 12%);
}

.reset-filter-button,
.search-button {
  width: 100%;
  min-width: 110px;
  height: 43px;
  padding: 0 16px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 7px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  box-sizing: border-box;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.reset-filter-button {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #64748b;
}

.reset-filter-button:hover:not(
    :disabled
  ) {
  border-color: #93c5fd;
  background: #eff6ff;
  color: #2563eb;
  transform: translateY(-1px);
}

.search-button {
  border: 1px solid #2563eb;
  background: #2563eb;
  color: #fff;
  box-shadow:
    0 6px 14px
    rgb(37 99 235 / 18%);
}

.search-button:hover:not(
    :disabled
  ) {
  border-color: #1d4ed8;
  background: #1d4ed8;
  transform: translateY(-1px);
  box-shadow:
    0 8px 18px
    rgb(37 99 235 / 24%);
}

.reset-filter-button:disabled,
.search-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
  box-shadow: none;
}

/* =========================================
   TABLE HEADER
========================================= */

.book-table-card {
  overflow: hidden;
}

.table-card-header {
  padding: 22px 25px;
  display: flex;
  justify-content:
    space-between;
  align-items: center;
  gap: 17px;
  border-bottom:
    1px solid #edf2f7;
}

/* =========================================
   TABLE
========================================= */

.book-table {
  width: 100%;
  min-width: 1320px;
  border-collapse: collapse;
}

.book-table th {
  padding: 13px 17px;
  border-bottom:
    1px solid #e7edf5;
  background: #f8fafc;
  color: #64748b;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.45px;
  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
}

.book-table td {
  padding: 16px 17px;
  border-bottom:
    1px solid #edf2f7;
  color: #475569;
  font-size: 12px;
  vertical-align: middle;
}

.book-table tbody tr {
  transition:
    background 0.2s ease;
}

.book-table tbody tr:hover {
  background: #f8fbff;
}

.book-table tbody
  tr:last-child
  td {
  border-bottom: 0;
}

.stt-column,
.stt-cell {
  width: 60px;
  text-align: center !important;
}

.action-column {
  width: 140px;
  text-align: center !important;
}

/* =========================================
   BOOK INFORMATION
========================================= */

.book-information {
  min-width: 310px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.book-cover {
  width: 58px;
  height: 78px;
  overflow: hidden;
  flex-shrink: 0;
  border:
    1px solid #e2e8f0;
  border-radius: 9px;
  background: #f1f5f9;
  box-shadow:
    0 5px 12px
    rgb(15 23 42 / 10%);
}

.book-cover img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  background: linear-gradient(
    135deg,
    #eff6ff,
    #dbeafe
  );
  color: #3b82f6;
  font-size: 23px;
}

.book-text {
  min-width: 0;
  display: flex;
  align-items: flex-start;
  flex-direction: column;
}

.book-code {
  margin-bottom: 4px;
  color: #3b82f6;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.book-title {
  max-width: 300px;
  overflow: hidden;
  color: #1e3a8a;
  font-size: 13px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-title:hover {
  color: #2563eb;
}

.book-author {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 5px;
  color: #64748b;
  font-size: 11px;
}

/* =========================================
   PUBLISHER, CATEGORY, PRICE
========================================= */

.publisher-information {
  max-width: 190px;
  display: flex;
  align-items: center;
  gap: 9px;
}

.publisher-icon {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 9px;
  background: #f1f5f9;
  color: #64748b;
}

.publisher-information span {
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-badge {
  max-width: 160px;
  padding: 6px 9px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: #f5f3ff;
  color: #7c3aed;
  font-size: 10px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-price {
  display: inline-block;
  color: #0f766e;
  font-size: 13px;
  font-weight: 800;
  white-space: nowrap;
}

/* =========================================
   STOCK
========================================= */

.stock-information {
  width: 130px;
}

.stock-number {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.stock-number strong {
  color: #334155;
  font-size: 17px;
}

.stock-number span {
  color: #94a3b8;
  font-size: 10px;
}

.stock-progress {
  height: 6px;
  margin-top: 7px;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}

.stock-progress-value {
  height: 100%;
  border-radius: inherit;
  transition:
    width 0.3s ease;
}

.progress-available {
  background: #10b981;
}

.progress-low {
  background: #f59e0b;
}

.progress-out {
  background: #ef4444;
}

.stock-information small {
  margin-top: 6px;
  display: block;
  color: #94a3b8;
  font-size: 9px;
}

.stock-status {
  padding: 6px 9px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  white-space: nowrap;
}

.stock-available {
  background: #d1fae5;
  color: #047857;
}

.stock-low {
  background: #fef3c7;
  color: #b45309;
}

.stock-out {
  background: #fee2e2;
  color: #b91c1c;
}

/* =========================================
   ACTIONS
========================================= */

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.action-button {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 9px;
  font-size: 13px;
  text-decoration: none;
  transition:
    transform 0.2s ease,
    background 0.2s ease;
}

.action-button:hover:not(
    :disabled
  ) {
  transform: translateY(-2px);
}

.action-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.action-view {
  background: #e0f2fe;
  color: #0284c7;
}

.action-edit {
  background: #fef3c7;
  color: #d97706;
}

.action-delete {
  background: #fee2e2;
  color: #dc2626;
}

.action-delete:hover:not(
    :disabled
  ) {
  background: #fecaca;
}

/* =========================================
   LOADING AND EMPTY
========================================= */

.loading-state,
.empty-state {
  min-height: 280px;
  padding: 45px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  text-align: center;
}

.loading-icon {
  margin-bottom: 14px;
}

.loading-state strong {
  color: #334155;
  font-size: 15px;
}

.loading-state span {
  margin-top: 6px;
  color: #94a3b8;
  font-size: 12px;
}

.empty-table-cell {
  padding: 0 !important;
}

.empty-icon {
  width: 70px;
  height: 70px;
  display: grid;
  place-items: center;
  border-radius: 20px;
  background: linear-gradient(
    135deg,
    #eff6ff,
    #dbeafe
  );
  color: #3b82f6;
  font-size: 28px;
}

.empty-state h3 {
  margin: 16px 0 7px;
  color: #334155;
  font-size: 17px;
}

.empty-state p {
  margin: 0;
  color: #94a3b8;
  font-size: 12px;
}

.empty-reset-button {
  margin-top: 17px;
  padding: 9px 14px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 0;
  border-radius: 9px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 11px;
  font-weight: 700;
}

/* =========================================
   PAGINATION
========================================= */

.pagination-container {
  padding: 17px 24px;
  display: flex;
  justify-content:
    space-between;
  align-items: center;
  gap: 17px;
  border-top:
    1px solid #edf2f7;
  background: #fff;
}

.pagination-information {
  color: #64748b;
  font-size: 11px;
}

.pagination-information strong {
  color: #334155;
}

.pagination-buttons {
  display: flex;
  align-items: center;
  gap: 5px;
}

.page-button {
  min-width: 34px;
  height: 34px;
  padding: 0 9px;
  display: grid;
  place-items: center;
  border:
    1px solid #dbe3ee;
  border-radius: 8px;
  background: #fff;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
}

.page-button:hover:not(
    :disabled
  ) {
  border-color: #93c5fd;
  background: #eff6ff;
  color: #2563eb;
}

.page-button.active {
  border-color: #2563eb;
  background: #2563eb;
  color: #fff;
}

.page-button:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.page-dots {
  min-width: 25px;
  text-align: center;
  color: #94a3b8;
}

/* =========================================
   RESPONSIVE
========================================= */

@media (max-width: 1350px) {
  .filter-grid {
    grid-template-columns:
      repeat(
        3,
        minmax(0, 1fr)
      );
  }

  .search-field {
    grid-column: span 2;
  }

  .reset-filter-button,
  .search-button {
    width: 100%;
  }
}

@media (max-width: 800px) {
  .filter-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .add-book-button {
    width: 100%;
  }

  .filter-grid {
    grid-template-columns:
      repeat(
        2,
        minmax(0, 1fr)
      );
  }

  .search-field {
    grid-column: 1 / -1;
  }

  .pagination-container {
    align-items: flex-start;
    flex-direction: column;
  }

  .pagination-buttons {
    max-width: 100%;
    overflow-x: auto;
  }
}

@media (max-width: 600px) {
  .book-page {
    gap: 16px;
  }

  .filter-card {
    padding: 19px;
    border-radius: 17px;
  }

  .filter-grid {
    grid-template-columns: 1fr;
  }

  .search-field {
    grid-column: auto;
  }

  .reset-filter-button,
  .search-button {
    width: 100%;
  }

  .table-card-header {
    padding: 19px;
  }
}
/* =========================================
   FIX GIAO DIỆN VỪA MÀN HÌNH
========================================= */

.book-page {
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.filter-card,
.book-table-card {
  width: 100%;
  min-width: 0;
}

/* Bộ lọc tự co giãn */
.filter-grid {
  grid-template-columns:
    minmax(220px, 2fr)
    minmax(120px, 1fr)
    minmax(150px, 1.1fr)
    minmax(130px, 1fr)
    105px
    105px
    110px;
  gap: 10px;
}

/* Không để nội dung làm rộng cột */
.filter-grid > div,
.filter-grid > button {
  min-width: 0;
}

/* Vùng chứa bảng */
.table-responsive {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
}

/* Bảng vừa chiều rộng màn hình */
.book-table {
  width: 100%;
  min-width: 0;
  table-layout: fixed;
}

/* Giảm khoảng cách hai bên */
.book-table th {
  padding: 12px 9px;
}

.book-table td {
  padding: 14px 9px;
}

/* Kích thước từng cột */
.book-table th:nth-child(1),
.book-table td:nth-child(1) {
  width: 50px;
}

.book-table th:nth-child(2),
.book-table td:nth-child(2) {
  width: auto;
}

.book-table th:nth-child(3),
.book-table td:nth-child(3) {
  width: 160px;
}

.book-table th:nth-child(4),
.book-table td:nth-child(4) {
  width: 135px;
}

.book-table th:nth-child(5),
.book-table td:nth-child(5) {
  width: 100px;
}

.book-table th:nth-child(6),
.book-table td:nth-child(6) {
  width: 130px;
}

.book-table th:nth-child(7),
.book-table td:nth-child(7) {
  width: 115px;
}

.book-table th:nth-child(8),
.book-table td:nth-child(8) {
  width: 120px;
}

/* Thông tin sách được phép co lại */
.book-information {
  width: 100%;
  min-width: 0;
  gap: 10px;
}

.book-cover {
  width: 52px;
  height: 70px;
}

.book-text {
  min-width: 0;
  width: calc(100% - 62px);
}

.book-title {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-author {
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Nhà xuất bản không làm rộng bảng */
.publisher-information {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  gap: 7px;
}

.publisher-information span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.publisher-icon {
  width: 30px;
  height: 30px;
}

/* Thể loại */
.category-badge {
  max-width: 100%;
}

/* Giá */
.book-price {
  font-size: 12px;
}

/* Tồn kho */
.stock-information {
  width: 100%;
  max-width: 115px;
}

/* Trạng thái */
.stock-status {
  max-width: 100%;
  padding: 6px 8px;
}

/* Nút thao tác */
.action-buttons {
  width: 100%;
  justify-content: center;
  flex-wrap: nowrap;
  gap: 5px;
}

.action-button {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

/* =========================================
   MÀN HÌNH LAPTOP
========================================= */

@media (max-width: 1350px) {
  .filter-grid {
    grid-template-columns:
      repeat(3, minmax(0, 1fr));
  }

  .search-field {
    grid-column: span 2;
  }

  .book-table {
    min-width: 1050px;
  }

  .book-table th:nth-child(3),
  .book-table td:nth-child(3) {
    width: 145px;
  }

  .book-table th:nth-child(4),
  .book-table td:nth-child(4) {
    width: 125px;
  }

  .book-table th:nth-child(7),
  .book-table td:nth-child(7) {
    width: 105px;
  }

  .book-table th:nth-child(8),
  .book-table td:nth-child(8) {
    width: 110px;
  }
}

/* =========================================
   MÁY TÍNH BẢNG
========================================= */

@media (max-width: 900px) {
  .filter-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .add-book-button {
    width: 100%;
  }

  .filter-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .search-field {
    grid-column: 1 / -1;
  }

  /*
   * Trên màn hình nhỏ giữ thanh cuộn ngang,
   * tránh ép các cột đến mức khó đọc.
   */
  .book-table {
    min-width: 1000px;
  }

  .pagination-container {
    align-items: flex-start;
    flex-direction: column;
  }
}

/* =========================================
   ĐIỆN THOẠI
========================================= */

@media (max-width: 600px) {
  .filter-grid {
    grid-template-columns: 1fr;
  }

  .search-field {
    grid-column: auto;
  }

  .filter-card {
    padding: 16px;
  }

  .book-table {
    min-width: 950px;
  }
}
</style>