<script setup>
import {
  computed,
  onMounted,
  ref,
  watch,
} from "vue";

import {
  useRoute,
  useRouter,
} from "vue-router";

import BookCard from
  "@/components/books/BookCard.vue";

import {
  bookApi,
} from "@/api/bookApi";

const route = useRoute();
const router = useRouter();

/* =========================================
   STATE
========================================= */

const books = ref([]);
const loading = ref(false);
const errorMessage = ref("");

const mobileFilterOpen = ref(false);

const keyword = ref(
  String(route.query.keyword || ""),
);

const selectedCategory = ref(
  String(route.query.category || ""),
);

const selectedAuthor = ref("");
const selectedLanguage = ref("");
const selectedAvailability = ref("");

const sortOption = ref(
  String(route.query.sort || "newest"),
);

const currentPage = ref(1);
const pageSize = 12;

/* =========================================
   CHUẨN HÓA RESPONSE
========================================= */

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
    payload.docs ||
    []
  );
}

/* =========================================
   DANH SÁCH BỘ LỌC
========================================= */

const categories = computed(() => {
  return [
    ...new Set(
      books.value
        .map((book) =>
          String(
            book.category || "",
          ).trim(),
        )
        .filter(Boolean),
    ),
  ].sort((a, b) =>
    a.localeCompare(
      b,
      "vi",
    ),
  );
});

const authors = computed(() => {
  return [
    ...new Set(
      books.value
        .map((book) =>
          String(
            book.author || "",
          ).trim(),
        )
        .filter(Boolean),
    ),
  ].sort((a, b) =>
    a.localeCompare(
      b,
      "vi",
    ),
  );
});

const languages = computed(() => {
  return [
    ...new Set(
      books.value
        .map((book) =>
          String(
            book.language || "",
          ).trim(),
        )
        .filter(Boolean),
    ),
  ].sort((a, b) =>
    a.localeCompare(
      b,
      "vi",
    ),
  );
});

/* =========================================
   LỌC VÀ SẮP XẾP
========================================= */

const filteredBooks = computed(() => {
  let result = books.value.filter(
    (book) =>
      book.status !== false,
  );

  const searchValue =
    keyword.value
      .trim()
      .toLowerCase();

  if (searchValue) {
    result = result.filter(
      (book) => {
        const searchableText = [
          book.bookCode,
          book.title,
          book.author,
          book.isbn,
          book.category,
          book.language,
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(
          searchValue,
        );
      },
    );
  }

  if (selectedCategory.value) {
    result = result.filter(
      (book) =>
        book.category ===
        selectedCategory.value,
    );
  }

  if (selectedAuthor.value) {
    result = result.filter(
      (book) =>
        book.author ===
        selectedAuthor.value,
    );
  }

  if (selectedLanguage.value) {
    result = result.filter(
      (book) =>
        book.language ===
        selectedLanguage.value,
    );
  }

  if (
    selectedAvailability.value ===
    "available"
  ) {
    result = result.filter(
      (book) =>
        Number(book.available || 0) > 0,
    );
  }

  if (
    selectedAvailability.value ===
    "unavailable"
  ) {
    result = result.filter(
      (book) =>
        Number(book.available || 0) <= 0,
    );
  }

  result = [...result];

  switch (sortOption.value) {
    case "title-asc":
      result.sort((a, b) =>
        String(a.title).localeCompare(
          String(b.title),
          "vi",
        ),
      );
      break;

    case "title-desc":
      result.sort((a, b) =>
        String(b.title).localeCompare(
          String(a.title),
          "vi",
        ),
      );
      break;

    case "year-desc":
      result.sort(
        (a, b) =>
          Number(
            b.publishYear || 0,
          ) -
          Number(
            a.publishYear || 0,
          ),
      );
      break;

    case "year-asc":
      result.sort(
        (a, b) =>
          Number(
            a.publishYear || 0,
          ) -
          Number(
            b.publishYear || 0,
          ),
      );
      break;

    case "available-desc":
      result.sort(
        (a, b) =>
          Number(b.available || 0) -
          Number(a.available || 0),
      );
      break;

    default:
      result.sort((a, b) => {
        const bDate = new Date(
          b.updatedAt ||
            b.createdAt ||
            0,
        ).getTime();

        const aDate = new Date(
          a.updatedAt ||
            a.createdAt ||
            0,
        ).getTime();

        return bDate - aDate;
      });
  }

  return result;
});

/* =========================================
   PHÂN TRANG
========================================= */

const totalPages = computed(() => {
  return Math.max(
    Math.ceil(
      filteredBooks.value.length /
        pageSize,
    ),
    1,
  );
});

const displayedBooks = computed(() => {
  const start =
    (currentPage.value - 1) *
    pageSize;

  return filteredBooks.value.slice(
    start,
    start + pageSize,
  );
});

const resultFrom = computed(() => {
  if (!filteredBooks.value.length) {
    return 0;
  }

  return (
    (currentPage.value - 1) *
      pageSize +
    1
  );
});

const resultTo = computed(() => {
  return Math.min(
    currentPage.value * pageSize,
    filteredBooks.value.length,
  );
});

const visiblePages = computed(() => {
  const pages = [];

  const start = Math.max(
    1,
    currentPage.value - 2,
  );

  const end = Math.min(
    totalPages.value,
    start + 4,
  );

  for (
    let page = start;
    page <= end;
    page += 1
  ) {
    pages.push(page);
  }

  return pages;
});

/* =========================================
   HÀM XỬ LÝ
========================================= */

async function loadBooks() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response =
      await bookApi.getAll({
        page: 1,
        limit: 1000,
      });

    books.value =
      extractBooks(response);
  } catch (error) {
    console.error(
      "Load reader books error:",
      error,
    );

    errorMessage.value =
      error?.response?.data?.message ||
      "Không thể tải danh sách sách";
  } finally {
    loading.value = false;
  }
}

function clearFilters() {
  keyword.value = "";
  selectedCategory.value = "";
  selectedAuthor.value = "";
  selectedLanguage.value = "";
  selectedAvailability.value = "";
  sortOption.value = "newest";
  currentPage.value = 1;

  router.replace({
    name: "reader-books",
  });
}

function goToPage(page) {
  if (
    page < 1 ||
    page > totalPages.value
  ) {
    return;
  }

  currentPage.value = page;

  window.scrollTo({
    top: 250,
    behavior: "smooth",
  });
}

watch(
  [
    keyword,
    selectedCategory,
    selectedAuthor,
    selectedLanguage,
    selectedAvailability,
    sortOption,
  ],
  () => {
    currentPage.value = 1;

    router.replace({
      name: "reader-books",

      query: {
        ...(keyword.value
          ? {
              keyword:
                keyword.value,
            }
          : {}),

        ...(selectedCategory.value
          ? {
              category:
                selectedCategory.value,
            }
          : {}),

        ...(sortOption.value !==
        "newest"
          ? {
              sort:
                sortOption.value,
            }
          : {}),
      },
    });
  },
);

onMounted(() => {
  loadBooks();
});
</script>

<template>
  <div class="book-list-page">
    <!-- Hero -->
    <section class="catalog-hero">
      <div class="reader-container catalog-hero-inner">
        <div>
          <div class="breadcrumb">
            <RouterLink
              :to="{
                name: 'reader-home',
              }"
            >
              Trang chủ
            </RouterLink>

            <i
              class="bi bi-chevron-right"
            />

            <span>
              Danh mục sách
            </span>
          </div>

          <h1>Danh mục sách</h1>

          <p>
            Khám phá kho sách đa dạng,
            tìm kiếm dễ dàng và gửi yêu
            cầu mượn trực tuyến.
          </p>
        </div>

        <div class="catalog-decoration">
          <i class="bi bi-bookshelf" />

          <span>
            {{ books.length }}
            đầu sách
          </span>
        </div>
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

        <div class="mobile-filter-bar">
          <button
            type="button"
            @click="
              mobileFilterOpen =
                !mobileFilterOpen
            "
          >
            <i class="bi bi-funnel" />

            Bộ lọc

            <i
              :class="
                mobileFilterOpen
                  ? 'bi bi-chevron-up'
                  : 'bi bi-chevron-down'
              "
            />
          </button>
        </div>

        <div class="catalog-layout">
          <!-- Bộ lọc -->
          <aside
            class="filter-sidebar"
            :class="{
              open: mobileFilterOpen,
            }"
          >
            <div class="filter-heading">
              <div>
                <i class="bi bi-funnel" />

                <strong>
                  Bộ lọc tìm kiếm
                </strong>
              </div>

              <button
                type="button"
                @click="clearFilters"
              >
                Xóa tất cả
              </button>
            </div>

            <div class="filter-section">
              <label for="catalogSearch">
                Tìm kiếm
              </label>

              <div class="filter-search">
                <i class="bi bi-search" />

                <input
                  id="catalogSearch"
                  v-model="keyword"
                  type="search"
                  placeholder="Tên sách, tác giả..."
                />
              </div>
            </div>

            <div class="filter-section">
              <label for="categoryFilter">
                Thể loại
              </label>

              <select
                id="categoryFilter"
                v-model="selectedCategory"
              >
                <option value="">
                  Tất cả thể loại
                </option>

                <option
                  v-for="category in categories"
                  :key="category"
                  :value="category"
                >
                  {{ category }}
                </option>
              </select>
            </div>

            <div class="filter-section">
              <label for="authorFilter">
                Tác giả
              </label>

              <select
                id="authorFilter"
                v-model="selectedAuthor"
              >
                <option value="">
                  Tất cả tác giả
                </option>

                <option
                  v-for="author in authors"
                  :key="author"
                  :value="author"
                >
                  {{ author }}
                </option>
              </select>
            </div>

            <div class="filter-section">
              <label for="languageFilter">
                Ngôn ngữ
              </label>

              <select
                id="languageFilter"
                v-model="selectedLanguage"
              >
                <option value="">
                  Tất cả ngôn ngữ
                </option>

                <option
                  v-for="language in languages"
                  :key="language"
                  :value="language"
                >
                  {{ language }}
                </option>
              </select>
            </div>

            <div class="filter-section">
              <label>Tình trạng</label>

              <label class="radio-filter">
                <input
                  v-model="selectedAvailability"
                  type="radio"
                  value=""
                />

                <span>Tất cả</span>
              </label>

              <label class="radio-filter">
                <input
                  v-model="selectedAvailability"
                  type="radio"
                  value="available"
                />

                <span>Còn sách</span>
              </label>

              <label class="radio-filter">
                <input
                  v-model="selectedAvailability"
                  type="radio"
                  value="unavailable"
                />

                <span>Đang được mượn</span>
              </label>
            </div>

            <div class="support-card">
              <i class="bi bi-headset" />

              <div>
                <strong>
                  Cần hỗ trợ?
                </strong>

                <p>
                  Liên hệ thủ thư để được
                  tư vấn.
                </p>
              </div>

              <button type="button">
                Trò chuyện ngay
              </button>
            </div>
          </aside>

          <!-- Danh sách -->
          <main class="catalog-content">
            <div class="catalog-toolbar">
              <p>
                Hiển thị
                <strong>
                  {{ resultFrom }}–{{ resultTo }}
                </strong>
                trong tổng số
                <strong>
                  {{ filteredBooks.length }}
                </strong>
                kết quả
              </p>

              <div>
                <label for="sortBooks">
                  Sắp xếp:
                </label>

                <select
                  id="sortBooks"
                  v-model="sortOption"
                >
                  <option value="newest">
                    Mới cập nhật
                  </option>

                  <option value="title-asc">
                    Tên A–Z
                  </option>

                  <option value="title-desc">
                    Tên Z–A
                  </option>

                  <option value="year-desc">
                    Năm xuất bản mới nhất
                  </option>

                  <option value="year-asc">
                    Năm xuất bản cũ nhất
                  </option>

                  <option value="available-desc">
                    Còn nhiều sách nhất
                  </option>
                </select>
              </div>
            </div>

            <div
              v-if="loading"
              class="catalog-loading"
            >
              <div class="loading-spinner" />

              <span>
                Đang tải danh sách sách...
              </span>
            </div>

            <div
              v-else-if="
                displayedBooks.length
              "
              class="catalog-book-grid"
            >
              <BookCard
                v-for="book in displayedBooks"
                :key="book._id"
                :book="book"
              />
            </div>

            <div
              v-else
              class="reader-empty-state"
            >
              <div>
                <i class="bi bi-search" />

                <h3>
                  Không tìm thấy sách
                </h3>

                <p>
                  Hãy thử thay đổi từ khóa
                  hoặc bộ lọc tìm kiếm.
                </p>

                <button
                  type="button"
                  class="reader-primary-button"
                  @click="clearFilters"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </div>

            <nav
              v-if="
                filteredBooks.length >
                pageSize
              "
              class="pagination"
            >
              <button
                type="button"
                :disabled="
                  currentPage === 1
                "
                @click="
                  goToPage(
                    currentPage - 1,
                  )
                "
              >
                <i
                  class="bi bi-chevron-left"
                />
              </button>

              <button
                v-for="page in visiblePages"
                :key="page"
                type="button"
                :class="{
                  active:
                    page ===
                    currentPage,
                }"
                @click="goToPage(page)"
              >
                {{ page }}
              </button>

              <button
                type="button"
                :disabled="
                  currentPage ===
                  totalPages
                "
                @click="
                  goToPage(
                    currentPage + 1,
                  )
                "
              >
                <i
                  class="bi bi-chevron-right"
                />
              </button>
            </nav>
          </main>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.catalog-hero {
  padding: 36px 0;
  background:
    radial-gradient(
      circle at 85% 25%,
      rgb(255 255 255 / 90%),
      transparent 28%
    ),
    linear-gradient(
      135deg,
      #fff0ef,
      #f6f8ff
    );
}

.catalog-hero-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8a98a5;
  font-size: 10px;
}

.breadcrumb a {
  color: var(--reader-primary);
}

.catalog-hero h1 {
  margin: 14px 0 8px;
  color: var(--reader-text);
  font-size: 35px;
  font-weight: 900;
}

.catalog-hero p {
  margin: 0;
  color: var(--reader-muted);
  font-size: 12px;
}

.catalog-decoration {
  width: 190px;
  height: 120px;
  display: grid;
  place-items: center;
  border-radius: 20px;
  background: rgb(255 255 255 / 65%);
  color: var(--reader-primary);
}

.catalog-decoration i {
  font-size: 43px;
}

.catalog-decoration span {
  font-size: 11px;
  font-weight: 900;
}

.error-alert {
  margin-bottom: 18px;
  padding: 13px 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #fecaca;
  border-radius: 11px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 11px;
}

.catalog-layout {
  display: grid;
  grid-template-columns: 245px minmax(0, 1fr);
  align-items: start;
  gap: 25px;
}

.filter-sidebar {
  overflow: hidden;
  border: 1px solid var(--reader-border);
  border-radius: 16px;
  background: #fff;
}

.filter-heading {
  padding: 17px;
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid var(--reader-border);
}

.filter-heading > div {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--reader-text);
  font-size: 11px;
}

.filter-heading button {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--reader-accent);
  font-size: 8px;
}

.filter-section {
  padding: 16px;
  border-bottom: 1px solid var(--reader-border);
}

.filter-section > label:first-child {
  margin-bottom: 10px;
  display: block;
  color: var(--reader-text);
  font-size: 10px;
  font-weight: 900;
}

.filter-section select {
  width: 100%;
  height: 40px;
  padding: 0 9px;
  border: 1px solid var(--reader-border);
  border-radius: 9px;
  background: #fff;
  color: #526474;
  font-size: 9px;
  outline: none;
}

.filter-search {
  height: 40px;
  position: relative;
}

.filter-search i {
  position: absolute;
  top: 50%;
  left: 11px;
  color: #9ba7b2;
  transform: translateY(-50%);
}

.filter-search input {
  width: 100%;
  height: 100%;
  padding: 0 10px 0 34px;
  border: 1px solid var(--reader-border);
  border-radius: 9px;
  outline: none;
}

.radio-filter {
  margin-top: 9px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #697986;
  font-size: 9px;
}

.radio-filter input {
  accent-color: var(--reader-primary);
}

.support-card {
  margin: 15px;
  padding: 15px;
  border: 1px solid #b8e5cc;
  border-radius: 12px;
  background: #f2fbf6;
  text-align: center;
}

.support-card > i {
  color: var(--reader-primary);
  font-size: 28px;
}

.support-card strong {
  margin-top: 8px;
  display: block;
  color: var(--reader-text);
  font-size: 11px;
}

.support-card p {
  margin: 5px 0 10px;
  color: var(--reader-muted);
  font-size: 8px;
}

.support-card button {
  width: 100%;
  height: 34px;
  border: 0;
  border-radius: 8px;
  background: var(--reader-primary);
  color: #fff;
  font-size: 9px;
  font-weight: 800;
}

.catalog-toolbar {
  min-height: 52px;
  margin-bottom: 18px;
  padding: 0 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid var(--reader-border);
  border-radius: 12px;
  background: #fff;
}

.catalog-toolbar p {
  margin: 0;
  color: var(--reader-muted);
  font-size: 9px;
}

.catalog-toolbar strong {
  color: var(--reader-text);
}

.catalog-toolbar > div {
  display: flex;
  align-items: center;
  gap: 8px;
}

.catalog-toolbar label {
  color: var(--reader-muted);
  font-size: 9px;
}

.catalog-toolbar select {
  height: 34px;
  padding: 0 10px;
  border: 1px solid var(--reader-border);
  border-radius: 8px;
  background: #fff;
  font-size: 9px;
}

.catalog-book-grid {
  display: grid;
  grid-template-columns:
    repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.catalog-loading {
  min-height: 430px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  color: var(--reader-muted);
  font-size: 11px;
}

.loading-spinner {
  width: 35px;
  height: 35px;
  margin-bottom: 10px;
  border: 3px solid #dcebe3;
  border-top-color: var(--reader-primary);
  border-radius: 50%;
  animation: reader-spin 0.8s linear infinite;
}

.pagination {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  gap: 7px;
}

.pagination button {
  width: 37px;
  height: 37px;
  display: grid;
  place-items: center;
  border: 1px solid var(--reader-border);
  border-radius: 9px;
  background: #fff;
  color: #64748b;
  font-size: 10px;
}

.pagination button.active {
  border-color: var(--reader-primary);
  background: var(--reader-primary);
  color: #fff;
}

.pagination button:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.mobile-filter-bar {
  display: none;
  margin-bottom: 13px;
}

.mobile-filter-bar button {
  width: 100%;
  min-height: 42px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--reader-border);
  border-radius: 10px;
  background: #fff;
  color: var(--reader-primary);
  font-weight: 800;
}

@media (max-width: 1050px) {
  .catalog-book-grid {
    grid-template-columns:
      repeat(3, 1fr);
  }
}

@media (max-width: 800px) {
  .mobile-filter-bar {
    display: block;
  }

  .catalog-layout {
    grid-template-columns: 1fr;
  }

  .filter-sidebar {
    display: none;
  }

  .filter-sidebar.open {
    display: block;
  }
}

@media (max-width: 650px) {
  .catalog-decoration {
    display: none;
  }

  .catalog-toolbar {
    padding: 12px;
    align-items: stretch;
    flex-direction: column;
    gap: 10px;
  }

  .catalog-toolbar > div {
    justify-content: space-between;
  }

  .catalog-book-grid {
    grid-template-columns:
      repeat(2, 1fr);
  }
}

@media (max-width: 390px) {
  .catalog-book-grid {
    grid-template-columns: 1fr;
  }
}
</style>