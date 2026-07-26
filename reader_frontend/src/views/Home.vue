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

const router = useRouter();

const loading = ref(false);
const errorMessage = ref("");

const allBooks = ref([]);
const featuredBooks = ref([]);
const newestBooks = ref([]);
const categories = ref([]);

const serverUrl = String(
  import.meta.env.VITE_SERVER_URL ||
    "http://localhost:3000",
).replace(/\/+$/, "");

const categoryColors = [
  "blue",
  "yellow",
  "green",
  "orange",
  "mint",
  "brown",
  "cyan",
  "pink",
];


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


function getBookImage(book) {
  const image =
    book?.image ||
    book?.img ||
    book?.img1 ||
    "";

  if (!image) {
    return "";
  }

  const normalizedImage =
    String(image).replace(
      /\\/g,
      "/",
    );

  if (
    normalizedImage.startsWith(
      "http://",
    ) ||
    normalizedImage.startsWith(
      "https://",
    ) ||
    normalizedImage.startsWith(
      "data:",
    ) ||
    normalizedImage.startsWith(
      "blob:",
    )
  ) {
    return normalizedImage;
  }

  return `${serverUrl}/${normalizedImage.replace(
    /^\/+/,
    "",
  )}`;
}

function getCategoryIcon(name = "") {
  const normalizedName =
    String(name).toLowerCase();

  if (
    normalizedName.includes(
      "văn học",
    ) ||
    normalizedName.includes(
      "tiểu thuyết",
    )
  ) {
    return "bi-book";
  }

  if (
    normalizedName.includes(
      "kinh tế",
    ) ||
    normalizedName.includes(
      "kỹ năng",
    ) ||
    normalizedName.includes(
      "quản trị",
    )
  ) {
    return "bi-graph-up-arrow";
  }

  if (
    normalizedName.includes(
      "tâm lý",
    ) ||
    normalizedName.includes(
      "phát triển",
    )
  ) {
    return "bi-lightbulb";
  }

  if (
    normalizedName.includes(
      "thiếu nhi",
    ) ||
    normalizedName.includes(
      "truyện tranh",
    )
  ) {
    return "bi-balloon";
  }

  if (
    normalizedName.includes(
      "khoa học",
    ) ||
    normalizedName.includes(
      "công nghệ",
    ) ||
    normalizedName.includes(
      "lập trình",
    )
  ) {
    return "bi-cpu";
  }

  if (
    normalizedName.includes(
      "lịch sử",
    ) ||
    normalizedName.includes(
      "địa lý",
    )
  ) {
    return "bi-bank";
  }

  if (
    normalizedName.includes(
      "ngoại ngữ",
    ) ||
    normalizedName.includes(
      "tiếng anh",
    )
  ) {
    return "bi-translate";
  }

  if (
    normalizedName.includes(
      "giáo trình",
    ) ||
    normalizedName.includes(
      "học tập",
    )
  ) {
    return "bi-mortarboard";
  }

  return "bi-bookshelf";
}

function buildCategories(books) {
  const categoryMap =
    new Map();

  books.forEach((book) => {
    const categoryName =
      String(
        book.category ||
          "Chưa phân loại",
      ).trim();

    if (
      !categoryMap.has(
        categoryName,
      )
    ) {
      categoryMap.set(
        categoryName,
        {
          name: categoryName,
          count: 0,
          availableCopies: 0,
        },
      );
    }

    const category =
      categoryMap.get(
        categoryName,
      );

    category.count += 1;

    category.availableCopies +=
      Number(
        book.available || 0,
      );
  });

  return Array.from(
    categoryMap.values(),
  )
    .sort(
      (firstCategory, secondCategory) =>
        secondCategory.count -
        firstCategory.count,
    )
    .map(
      (category, index) => ({
        ...category,

        icon:
          getCategoryIcon(
            category.name,
          ),

        className:
          categoryColors[
            index %
              categoryColors.length
          ],
      }),
    );
}


const totalBooks = computed(() => {
  return allBooks.value.length;
});

const totalAvailableCopies =
  computed(() => {
    return allBooks.value.reduce(
      (total, book) =>
        total +
        Number(
          book.available || 0,
        ),
      0,
    );
  });

const availableTitles = computed(() => {
  return allBooks.value.filter(
    (book) =>
      Number(
        book.available || 0,
      ) > 0,
  ).length;
});

const heroBooks = computed(() => {
  return featuredBooks.value.slice(
    0,
    4,
  );
});


async function loadHomeData() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response =
      await bookApi.getAll({
        page: 1,
        limit: 1000,
      });

    const books =
      extractBooks(response)
        .filter(
          (book) =>
            book &&
            book.status !== false,
        )
        .map((book) => ({
          ...book,

          quantity:
            Number(
              book.quantity || 0,
            ),

          available:
            Number(
              book.available || 0,
            ),

          publishYear:
            Number(
              book.publishYear || 0,
            ),
        }));

    allBooks.value = books;

    featuredBooks.value =
      [...books]
        .filter(
          (book) =>
            book.available > 0,
        )
        .sort((firstBook, secondBook) => {
          if (
            secondBook.available !==
            firstBook.available
          ) {
            return (
              secondBook.available -
              firstBook.available
            );
          }

          return (
            secondBook.publishYear -
            firstBook.publishYear
          );
        })
        .slice(0, 8);

    newestBooks.value =
      [...books]
        .sort((firstBook, secondBook) => {
          if (
            secondBook.publishYear !==
            firstBook.publishYear
          ) {
            return (
              secondBook.publishYear -
              firstBook.publishYear
            );
          }

          const secondDate =
            new Date(
              secondBook.createdAt ||
                secondBook.updatedAt ||
                0,
            ).getTime();

          const firstDate =
            new Date(
              firstBook.createdAt ||
                firstBook.updatedAt ||
                0,
            ).getTime();

          return (
            secondDate -
            firstDate
          );
        })
        .slice(0, 8);

    categories.value =
      buildCategories(books);
  } catch (error) {
    console.error(
      "Load home data error:",
      error,
    );

    errorMessage.value =
      error?.response?.data
        ?.message ||
      "Không thể tải dữ liệu sách";
  } finally {
    loading.value = false;
  }
}

function openBooks(query = {}) {
  router.push({
    name: "reader-books",
    query,
  });
}

onMounted(() => {
  loadHomeData();
});
</script>

<template>
  <div class="home-page">
    <!-- HERO -->
    <section class="hero-section">
      <div class="reader-container">
        <div class="hero-banner">
          <div class="hero-content">
            <span class="hero-label">
              Thư viện trực tuyến KBook
            </span>

            <h1>
              Mượn sách dễ dàng
              <br />
              Đọc sách mỗi ngày
            </h1>

            <p>
              Khám phá {{ totalBooks }} đầu sách,
              {{ categories.length }} thể loại và
              {{ totalAvailableCopies }} bản sách
              đang có sẵn trong thư viện.
            </p>

            <button
              type="button"
              class="hero-button"
              @click="openBooks()"
            >
              Khám phá ngay

              <i
                class="bi bi-arrow-right"
              />
            </button>

            <div class="hero-statistics">
              <div>
                <strong>
                  {{ totalBooks }}
                </strong>

                <span>Đầu sách</span>
              </div>

              <div>
                <strong>
                  {{ availableTitles }}
                </strong>

                <span>Đầu sách còn sẵn</span>
              </div>

              <div>
                <strong>
                  {{ categories.length }}
                </strong>

                <span>Danh mục</span>
              </div>
            </div>
          </div>

          <div class="hero-visual">
            <template
              v-if="heroBooks.length"
            >
              <button
                v-for="(
                  book,
                  index
                ) in heroBooks"
                :key="book._id"
                type="button"
                class="hero-cover"
                :class="
                  `hero-cover-${index + 1}`
                "
                :title="book.title"
                @click="
                  router.push({
                    name:
                      'reader-book-detail',

                    params: {
                      id: book._id,
                    },
                  })
                "
              >
                <img
                  v-if="
                    getBookImage(book)
                  "
                  :src="
                    getBookImage(book)
                  "
                  :alt="book.title"
                />

                <span v-else>
                  <i
                    class="bi bi-book"
                  />

                  <small>
                    {{ book.title }}
                  </small>
                </span>
              </button>
            </template>

            <div
              v-else
              class="hero-empty-books"
            >
              <i class="bi bi-bookshelf" />

              <span>
                Kho sách KBook
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- THÔNG BÁO LỖI -->
    <section
      v-if="errorMessage"
      class="reader-section error-section"
    >
      <div class="reader-container">
        <div class="home-error">
          <i
            class="bi bi-exclamation-circle-fill"
          />

          <span>
            {{ errorMessage }}
          </span>

          <button
            type="button"
            @click="loadHomeData"
          >
            Tải lại
          </button>
        </div>
      </div>
    </section>

    <!-- DANH MỤC -->
    <section class="reader-section">
      <div class="reader-container">
        <div class="reader-section-heading">
          <div>
            <h2>
              Danh mục sách
            </h2>

            <p>
              Các danh mục được thống kê trực
              tiếp từ cơ sở dữ liệu.
            </p>
          </div>

          <button
            type="button"
            class="reader-view-all category-view-button"
            @click="openBooks()"
          >
            Xem tất cả sách

            <i
              class="bi bi-arrow-right"
            />
          </button>
        </div>

        <div
          v-if="loading"
          class="category-loading"
        >
          <div
            v-for="item in 8"
            :key="item"
            class="category-skeleton"
          />
        </div>

        <div
          v-else-if="
            categories.length
          "
          class="category-grid"
        >
          <button
            v-for="category in categories.slice(0, 8)"
            :key="category.name"
            type="button"
            class="category-card"
            @click="
              openBooks({
                category:
                  category.name,
              })
            "
          >
            <span
              class="category-icon"
              :class="
                category.className
              "
            >
              <i
                class="bi"
                :class="category.icon"
              />
            </span>

            <strong>
              {{ category.name }}
            </strong>

            <small>
              {{ category.count }}
              đầu sách
            </small>

            <em>
              {{
                category
                  .availableCopies
              }}
              bản còn sẵn
            </em>
          </button>
        </div>

        <div
          v-else
          class="home-empty-state"
        >
          <i class="bi bi-grid" />

          <h3>
            Chưa có danh mục sách
          </h3>
        </div>
      </div>
    </section>

    <!-- SÁCH NỔI BẬT -->
    <section class="reader-section featured-section">
      <div class="reader-container">
        <div class="reader-section-heading">
          <div>
            <h2>Sách đang có sẵn</h2>

            <p>
              Các đầu sách còn nhiều bản và
              có thể gửi yêu cầu mượn.
            </p>
          </div>

          <RouterLink
            :to="{
              name: 'reader-books',

              query: {
                availability:
                  'available',
              },
            }"
            class="reader-view-all"
          >
            Xem tất cả

            <i
              class="bi bi-arrow-right"
            />
          </RouterLink>
        </div>

        <div
          v-if="loading"
          class="home-loading"
        >
          <div class="loading-circle" />

          <span>
            Đang tải sách...
          </span>
        </div>

        <div
          v-else-if="
            featuredBooks.length
          "
          class="book-grid"
        >
          <BookCard
            v-for="book in featuredBooks"
            :key="book._id"
            :book="book"
            compact
          />
        </div>

        <div
          v-else
          class="home-empty-state"
        >
          <i class="bi bi-book" />

          <h3>
            Hiện chưa có sách sẵn sàng cho mượn
          </h3>
        </div>
      </div>
    </section>

    <!-- BANNER NHỎ -->
    <section class="reader-section promotion-section">
      <div class="reader-container promotion-grid">
        <article class="promotion-card promotion-pink">
          <div>
            <small>
              Đăng ký độc giả
            </small>

            <h3>
              Tạo tài khoản miễn phí
            </h3>

            <p>
              Bắt đầu hành trình đọc sách.
            </p>

            <button
              type="button"
              @click="
                router.push({
                  name:
                    'reader-register',
                })
              "
            >
              Đăng ký ngay
            </button>
          </div>

          <i class="bi bi-person-plus" />
        </article>

        <article class="promotion-card promotion-green">
          <div>
            <small>
              Kho sách đa dạng
            </small>

            <h3>
              {{ totalBooks }} đầu sách
            </h3>

            <p>
              Thuộc nhiều lĩnh vực khác nhau.
            </p>

            <button
              type="button"
              @click="openBooks()"
            >
              Khám phá sách
            </button>
          </div>

          <i class="bi bi-stack" />
        </article>

        <article class="promotion-card promotion-purple">
          <div>
            <small>
              Mượn sách trực tuyến
            </small>

            <h3>
              Nhanh chóng, tiện lợi
            </h3>

            <p>
              Theo dõi yêu cầu ngay trên hệ thống.
            </p>

            <button
              type="button"
              @click="
                router.push({
                  name:
                    'reader-history',
                })
              "
            >
              Xem lịch sử
            </button>
          </div>

          <i class="bi bi-clock-history" />
        </article>
      </div>
    </section>

    <!-- SÁCH MỚI -->
    <section class="reader-section">
      <div class="reader-container">
        <div class="reader-section-heading">
          <div>
            <h2>
              Sách mới xuất bản
            </h2>

            <p>
              Sắp xếp theo năm xuất bản mới nhất
              trong cơ sở dữ liệu.
            </p>
          </div>

          <RouterLink
            :to="{
              name: 'reader-books',

              query: {
                sort: 'year-desc',
              },
            }"
            class="reader-view-all"
          >
            Xem tất cả

            <i
              class="bi bi-arrow-right"
            />
          </RouterLink>
        </div>

        <div
          v-if="loading"
          class="home-loading"
        >
          <div class="loading-circle" />

          <span>
            Đang tải sách...
          </span>
        </div>

        <div
          v-else-if="
            newestBooks.length
          "
          class="book-grid"
        >
          <BookCard
            v-for="book in newestBooks"
            :key="book._id"
            :book="book"
            compact
          />
        </div>

        <div
          v-else
          class="home-empty-state"
        >
          <i class="bi bi-calendar3" />

          <h3>
            Chưa có sách mới
          </h3>
        </div>
      </div>
    </section>

    <!-- BANNER -->
    <section class="reader-section">
      <div class="reader-container">
        <div class="wide-promotion-banner">
          <div>
            <small>
              Thư viện trực tuyến
            </small>

            <h2>
              Có {{ totalAvailableCopies }}
              bản sách đang sẵn sàng
            </h2>

            <p>
              Đăng nhập, lựa chọn sách và gửi
              yêu cầu mượn ngay hôm nay.
            </p>

            <button
              type="button"
              @click="
                openBooks({
                  availability:
                    'available',
                })
              "
            >
              Mượn sách ngay

              <i
                class="bi bi-arrow-right"
              />
            </button>
          </div>

          <span class="banner-book-icon">
            <i class="bi bi-book-half" />
          </span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero-section {
  padding: 32px 0 12px;
}

.hero-banner {
  min-height: 410px;
  overflow: hidden;
  position: relative;
  display: grid;
  grid-template-columns:
    1fr 1fr;
  border-radius: 22px;
  background:
    radial-gradient(
      circle at 80% 20%,
      rgb(255 255 255 / 80%),
      transparent 30%
    ),
    linear-gradient(
      135deg,
      #eaf7df,
      #f6f0d8
    );
}

.hero-content {
  padding: 51px;
  position: relative;
  z-index: 2;
}

.hero-label {
  color: var(--reader-primary);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.8px;
  text-transform: uppercase;
}

.hero-content h1 {
  margin: 13px 0 15px;
  color: #074b2d;
  font-size: 42px;
  font-weight: 950;
  line-height: 1.15;
}

.hero-content > p {
  max-width: 500px;
  margin: 0;
  color: #627469;
  font-size: 13px;
  line-height: 1.8;
}

.hero-button {
  min-height: 43px;
  margin-top: 24px;
  padding: 0 18px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 0;
  border-radius: 10px;
  background: var(--reader-primary);
  color: #fff;
  font-size: 11px;
  font-weight: 900;
  cursor: pointer;
}

.hero-statistics {
  margin-top: 30px;
  display: flex;
  flex-wrap: wrap;
  gap: 28px;
}

.hero-statistics strong,
.hero-statistics span {
  display: block;
}

.hero-statistics strong {
  color: var(--reader-primary);
  font-size: 23px;
}

.hero-statistics span {
  margin-top: 3px;
  color: #75857b;
  font-size: 8px;
}

.hero-visual {
  min-height: 410px;
  position: relative;
  overflow: hidden;
}

.hero-visual::before {
  width: 320px;
  height: 320px;
  position: absolute;
  top: 40px;
  left: 50%;
  border-radius: 50%;
  background:
    rgb(255 255 255 / 38%);
  content: "";
  transform: translateX(-50%);
}

.hero-cover {
  width: 175px;
  height: 255px;
  padding: 0;
  position: absolute;
  overflow: hidden;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 9px;
  background: #fff;
  box-shadow:
    0 22px 35px
    rgb(15 23 42 / 22%);
  cursor: pointer;
  transition:
    transform 0.25s ease;
}

.hero-cover:hover {
  z-index: 10;
  transform:
    translateY(-8px)
    rotate(0deg)
    scale(1.04);
}

.hero-cover img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.hero-cover > span {
  padding: 15px;
  color: var(--reader-primary);
  text-align: center;
}

.hero-cover > span i {
  display: block;
  font-size: 55px;
}

.hero-cover > span small {
  margin-top: 12px;
  display: block;
  font-weight: 800;
}

.hero-cover-1 {
  top: 65px;
  left: 37%;
  z-index: 4;
  transform: rotate(-2deg);
}

.hero-cover-2 {
  top: 92px;
  left: 8%;
  z-index: 2;
  transform: rotate(-12deg);
}

.hero-cover-3 {
  top: 85px;
  right: 4%;
  z-index: 3;
  transform: rotate(11deg);
}

.hero-cover-4 {
  width: 145px;
  height: 215px;
  right: 31%;
  bottom: -65px;
  z-index: 5;
  transform: rotate(3deg);
}

.hero-empty-books {
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--reader-primary);
}

.hero-empty-books i {
  font-size: 90px;
}

.error-section {
  padding-bottom: 0;
}

.home-error {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 9px;
  border: 1px solid #fecaca;
  border-radius: 11px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 10px;
}

.home-error span {
  min-width: 0;
  flex: 1;
}

.home-error button {
  min-height: 31px;
  padding: 0 12px;
  border: 0;
  border-radius: 7px;
  background: #b91c1c;
  color: #fff;
}

.category-view-button {
  border: 0;
  background: transparent;
}

.category-grid,
.category-loading {
  display: grid;
  grid-template-columns:
    repeat(4, minmax(0, 1fr));
  gap: 13px;
}

.category-card {
  min-height: 145px;
  padding: 18px 10px;
  display: flex;
  align-items: center;
  flex-direction: column;
  border: 1px solid
    var(--reader-border);
  border-radius: 15px;
  background: #fff;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.category-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--reader-shadow);
}

.category-icon {
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 22px;
}

.category-icon.blue {
  background: #e5efff;
  color: #4775bc;
}

.category-icon.yellow {
  background: #fff3d3;
  color: #ad7c12;
}

.category-icon.green {
  background: #e7f5df;
  color: #589b3b;
}

.category-icon.orange {
  background: #ffebdf;
  color: #bc7049;
}

.category-icon.mint {
  background: #daf5e3;
  color: #39935b;
}

.category-icon.brown {
  background: #f6ead8;
  color: #967246;
}

.category-icon.cyan {
  background: #def4fa;
  color: #4b90a3;
}

.category-icon.pink {
  background: #ffe5e8;
  color: #e75065;
}

.category-card strong {
  margin-top: 11px;
  color: var(--reader-text);
  font-size: 10px;
  text-align: center;
}

.category-card small {
  margin-top: 5px;
  color: var(--reader-muted);
  font-size: 8px;
}

.category-card em {
  margin-top: 5px;
  color: var(--reader-primary);
  font-size: 7px;
  font-style: normal;
  font-weight: 800;
}

.category-skeleton {
  min-height: 145px;
  border-radius: 15px;
  background:
    linear-gradient(
      90deg,
      #f1f5f2 25%,
      #fafcfb 50%,
      #f1f5f2 75%
    );
  background-size: 200% 100%;
  animation:
    skeleton-loading
    1.3s infinite;
}

@keyframes skeleton-loading {
  to {
    background-position: -200% 0;
  }
}

.featured-section {
  background: #fbfcfb;
}

.book-grid {
  display: grid;
  grid-template-columns:
    repeat(4, minmax(0, 1fr));
  gap: 17px;
}

.home-loading {
  min-height: 260px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 10px;
  color: var(--reader-muted);
  font-size: 10px;
}

.loading-circle {
  width: 31px;
  height: 31px;
  border: 3px solid #d9e6de;
  border-top-color:
    var(--reader-primary);
  border-radius: 50%;
  animation:
    reader-spin 0.8s linear infinite;
}

.home-empty-state {
  min-height: 240px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  border: 1px dashed
    var(--reader-border);
  border-radius: 15px;
  color: var(--reader-muted);
  text-align: center;
}

.home-empty-state i {
  color: var(--reader-primary);
  font-size: 42px;
}

.home-empty-state h3 {
  margin-top: 12px;
}

.promotion-grid {
  display: grid;
  grid-template-columns:
    repeat(3, minmax(0, 1fr));
  gap: 17px;
}

.promotion-card {
  min-height: 160px;
  padding: 26px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 18px;
}

.promotion-card small {
  font-size: 9px;
}

.promotion-card h3 {
  margin: 8px 0 5px;
  font-size: 19px;
}

.promotion-card p {
  margin: 0;
  font-size: 9px;
}

.promotion-card button {
  min-height: 34px;
  margin-top: 15px;
  padding: 0 13px;
  border: 0;
  border-radius: 8px;
  color: #fff;
  font-size: 9px;
  font-weight: 800;
}

.promotion-card > i {
  font-size: 61px;
  opacity: 0.7;
}

.promotion-pink {
  background:
    linear-gradient(
      135deg,
      #ffe5e6,
      #fff1ea
    );
  color: #a64842;
}

.promotion-pink button {
  background: #e7554f;
}

.promotion-green {
  background:
    linear-gradient(
      135deg,
      #dcf7e9,
      #eafafa
    );
  color: #176b4f;
}

.promotion-green button {
  background: #13845d;
}

.promotion-purple {
  background:
    linear-gradient(
      135deg,
      #f1e9ff,
      #e9e5ff
    );
  color: #57429c;
}

.promotion-purple button {
  background: #6043b4;
}

.wide-promotion-banner {
  min-height: 185px;
  padding: 35px 44px;
  overflow: hidden;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 19px;
  background:
    radial-gradient(
      circle at 80% 20%,
      rgb(79 143 63 / 14%),
      transparent 30%
    ),
    linear-gradient(
      135deg,
      #fff3ae,
      #ecf7cf
    );
}

.wide-promotion-banner small {
  color: #7a8129;
  font-size: 9px;
  font-weight: 900;
  text-transform: uppercase;
}

.wide-promotion-banner h2 {
  margin: 8px 0 6px;
  color: #294523;
  font-size: 26px;
}

.wide-promotion-banner p {
  margin: 0;
  color: #76836e;
  font-size: 11px;
}

.wide-promotion-banner button {
  min-height: 36px;
  margin-top: 15px;
  padding: 0 14px;
  border: 0;
  border-radius: 8px;
  background:
    var(--reader-primary);
  color: #fff;
  font-size: 9px;
  font-weight: 900;
}

.banner-book-icon {
  width: 120px;
  height: 120px;
  display: grid;
  place-items: center;
  border: 7px double #fff;
  border-radius: 50%;
  background:
    var(--reader-primary);
  color: #fff;
  font-size: 48px;
}

@media (max-width: 1050px) {
  .category-grid,
  .category-loading {
    grid-template-columns:
      repeat(4, 1fr);
  }

  .book-grid {
    grid-template-columns:
      repeat(3, 1fr);
  }
}

@media (max-width: 800px) {
  .hero-banner {
    grid-template-columns: 1fr;
  }

  .hero-visual {
    min-height: 350px;
  }

  .promotion-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .hero-content {
    padding: 30px 23px;
  }

  .hero-content h1 {
    font-size: 31px;
  }

  .hero-statistics {
    gap: 18px;
  }

  .category-grid,
  .category-loading,
  .book-grid {
    grid-template-columns:
      repeat(2, 1fr);
  }

  .hero-cover {
    width: 135px;
    height: 205px;
  }

  .wide-promotion-banner {
    padding: 25px;
  }

  .banner-book-icon {
    width: 78px;
    height: 78px;
    font-size: 31px;
  }
}

@media (max-width: 390px) {
  .category-grid,
  .category-loading,
  .book-grid {
    grid-template-columns: 1fr;
  }
}
</style>