<script setup>
import {
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

const featuredBooks = ref([]);
const newestBooks = ref([]);

const categories = [
  {
    name: "Văn học",
    icon: "bi-book",
    count: "1.245+ sách",
    className: "blue",
  },
  {
    name: "Kinh tế - Kỹ năng",
    icon: "bi-graph-up-arrow",
    count: "1.032+ sách",
    className: "yellow",
  },
  {
    name: "Tâm lý",
    icon: "bi-lightbulb",
    count: "842+ sách",
    className: "green",
  },
  {
    name: "Thiếu nhi",
    icon: "bi-balloon",
    count: "1.108+ sách",
    className: "orange",
  },
  {
    name: "Khoa học",
    icon: "bi-flask",
    count: "512+ sách",
    className: "mint",
  },
  {
    name: "Lịch sử",
    icon: "bi-bank",
    count: "420+ sách",
    className: "brown",
  },
  {
    name: "Ngoại ngữ",
    icon: "bi-translate",
    count: "634+ sách",
    className: "cyan",
  },
  {
    name: "Sách mới",
    icon: "bi-stars",
    count: "265+ sách",
    className: "pink",
  },
];

function getData(response) {
  const payload =
    response?.data?.data ??
    response?.data ??
    {};

  return (
    payload.books ||
    payload.items ||
    payload.results ||
    (Array.isArray(payload)
      ? payload
      : [])
  );
}

async function loadHomeData() {
  loading.value = true;

  try {
    const [
      featuredResponse,
      newestResponse,
    ] = await Promise.all([
      bookApi.getFeatured(6),
      bookApi.getNewest(6),
    ]);

    featuredBooks.value =
      getData(
        featuredResponse,
      );

    newestBooks.value =
      getData(
        newestResponse,
      );
  } catch (error) {
    console.error(
      "Load home data error:",
      error,
    );
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
              Thư viện trực tuyến
            </span>

            <h1>
              Mượn sách dễ dàng
              <br />
              Đọc sách mỗi ngày
            </h1>

            <p>
              Hàng ngàn đầu sách hay đang chờ
              bạn khám phá. Mượn online, quản lý
              lịch mượn và theo dõi hạn trả.
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

            <div class="hero-benefits">
              <div>
                <i
                  class="bi bi-shield-check"
                />

                <span>
                  <strong>
                    Mượn dễ dàng
                  </strong>

                  <small>
                    Thủ tục nhanh gọn
                  </small>
                </span>
              </div>

              <div>
                <i class="bi bi-clock" />

                <span>
                  <strong>
                    Quản lý trực tuyến
                  </strong>

                  <small>
                    Theo dõi 24/7
                  </small>
                </span>
              </div>

              <div>
                <i class="bi bi-bell" />

                <span>
                  <strong>
                    Nhắc hạn trả
                  </strong>

                  <small>
                    Thông báo tự động
                  </small>
                </span>
              </div>
            </div>
          </div>

          <div class="hero-visual">
            <div class="hero-book book-one">
              SAPIENS
            </div>

            <div class="hero-book book-two">
              ĐẮC NHÂN TÂM
            </div>

            <div class="hero-book book-three">
              ATOMIC HABITS
            </div>

            <div class="hero-book book-four">
              NHÀ GIẢ KIM
            </div>

            <div class="hero-mug">
              <i class="bi bi-cup-hot" />
            </div>

            <div class="hero-open-book">
              <i
                class="bi bi-book-half"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- DANH MỤC -->
    <section class="reader-section">
      <div class="reader-container">
        <div class="reader-section-heading">
          <div>
            <h2>Danh mục nổi bật</h2>

            <p>
              Khám phá sách theo chủ đề bạn yêu thích.
            </p>
          </div>

          <button
            type="button"
            class="reader-view-all category-view-button"
            @click="openBooks()"
          >
            Xem tất cả

            <i
              class="bi bi-arrow-right"
            />
          </button>
        </div>

        <div class="category-grid">
          <button
            v-for="category in categories"
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
            </small>
          </button>
        </div>
      </div>
    </section>

    <!-- SÁCH NỔI BẬT -->
    <section class="reader-section featured-section">
      <div class="reader-container">
        <div class="reader-section-heading">
          <div>
            <h2>Sách nổi bật</h2>

            <p>
              Những đầu sách đang được nhiều
              độc giả quan tâm.
            </p>
          </div>

          <RouterLink
            :to="{
              name: 'reader-books',
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

          Đang tải sách...
        </div>

        <div
          v-else
          class="book-grid"
        >
          <BookCard
            v-for="book in featuredBooks"
            :key="book._id"
            :book="book"
            compact
          />
        </div>
      </div>
    </section>

    <!-- PROMOTION -->
    <section class="reader-section promotion-section">
      <div class="reader-container promotion-grid">
        <article class="promotion-card promotion-pink">
          <div>
            <small>
              Ưu đãi hội viên mới
            </small>

            <h3>
              Giảm 50% phí mượn
            </h3>

            <p>
              Cho yêu cầu đầu tiên.
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

          <i class="bi bi-gift" />
        </article>

        <article class="promotion-card promotion-green">
          <div>
            <small>
              Mượn 5 trả 4
            </small>

            <h3>
              Mượn càng nhiều
            </h3>

            <p>
              Ưu đãi càng lớn.
            </p>

            <button
              type="button"
              @click="openBooks()"
            >
              Xem chi tiết
            </button>
          </div>

          <i
            class="bi bi-stack"
          />
        </article>

        <article class="promotion-card promotion-purple">
          <div>
            <small>
              Gói gia đình
            </small>

            <h3>
              Chia sẻ yêu thương
            </h3>

            <p>
              Cùng nhau đọc sách.
            </p>

            <button
              type="button"
              @click="openBooks()"
            >
              Khám phá ngay
            </button>
          </div>

          <i
            class="bi bi-people"
          />
        </article>
      </div>
    </section>

    <!-- SÁCH MỚI -->
    <section class="reader-section">
      <div class="reader-container">
        <div class="reader-section-heading">
          <div>
            <h2>Sách mới cập nhật</h2>

            <p>
              Các đầu sách mới nhất trong kho thư viện.
            </p>
          </div>

          <RouterLink
            :to="{
              name: 'reader-books',
              query: {
                sort: 'newest',
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

        <div class="book-grid">
          <BookCard
            v-for="book in newestBooks"
            :key="book._id"
            :book="book"
            compact
          />
        </div>
      </div>
    </section>

    <!-- BANNER -->
    <section class="reader-section">
      <div class="reader-container">
        <div class="wide-promotion-banner">
          <div>
            <small>
              Ưu đãi đặc biệt hè này
            </small>

            <h2>
              Giảm 20% phí mượn tất cả sách
            </h2>

            <p>
              Áp dụng cho mọi độc giả đăng ký thành viên.
            </p>

            <button
              type="button"
              @click="openBooks()"
            >
              Mượn sách ngay

              <i
                class="bi bi-arrow-right"
              />
            </button>
          </div>

          <span class="discount-badge">
            -20%
          </span>
        </div>
      </div>
    </section>

    <!-- TIN TỨC -->
    <section class="reader-section">
      <div class="reader-container">
        <div class="reader-section-heading">
          <div>
            <h2>Tin tức & cảm hứng</h2>

            <p>
              Những bài viết giúp xây dựng thói quen đọc sách.
            </p>
          </div>
        </div>

        <div class="article-grid">
          <article>
            <div class="article-image article-one">
              <i class="bi bi-journal-text" />
            </div>

            <div class="article-content">
              <small>
                Cảm hứng đọc sách
              </small>

              <h3>
                10 cuốn sách thay đổi tư duy
                giúp bạn phát triển bản thân
              </h3>

              <span>20/07/2026</span>
            </div>
          </article>

          <article>
            <div class="article-image article-two">
              <i class="bi bi-lightbulb" />
            </div>

            <div class="article-content">
              <small>
                Kinh nghiệm đọc sách
              </small>

              <h3>
                Bí quyết đọc sách hiệu quả
                dành cho người bận rộn
              </h3>

              <span>18/07/2026</span>
            </div>
          </article>

          <article>
            <div class="article-image article-three">
              <i class="bi bi-people" />
            </div>

            <div class="article-content">
              <small>Sự kiện</small>

              <h3>
                Ngày hội đọc sách KBook
                cùng lan tỏa tri thức
              </h3>

              <span>15/07/2026</span>
            </div>
          </article>
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
  min-height: 390px;
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
  max-width: 470px;
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
}

.hero-benefits {
  margin-top: 29px;
  display: flex;
  gap: 21px;
}

.hero-benefits > div {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hero-benefits i {
  width: 31px;
  height: 31px;
  display: grid;
  place-items: center;
  border: 1px solid
    rgb(12 101 61 / 25%);
  border-radius: 50%;
  color: var(--reader-primary);
}

.hero-benefits strong,
.hero-benefits small {
  display: block;
}

.hero-benefits strong {
  color: #315642;
  font-size: 8px;
}

.hero-benefits small {
  margin-top: 2px;
  color: #819287;
  font-size: 7px;
}

.hero-visual {
  position: relative;
  background:
    linear-gradient(
      to bottom,
      transparent 55%,
      #ca9c63 55%
    );
}

.hero-book {
  width: 250px;
  height: 47px;
  padding: 0 17px;
  position: absolute;
  right: 45px;
  display: flex;
  align-items: center;
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
  font-weight: 900;
  box-shadow:
    0 8px 15px
    rgb(15 23 42 / 15%);
  transform: rotate(-4deg);
}

.book-one {
  top: 95px;
  background: #e8e1ce;
  color: #444;
}

.book-two {
  top: 140px;
  right: 55px;
  background: #bf3434;
}

.book-three {
  top: 185px;
  right: 43px;
  background: #f4e8d1;
  color: #2d2d2d;
}

.book-four {
  top: 230px;
  right: 57px;
  background: #e0a531;
  color: #32230d;
}

.hero-mug {
  width: 100px;
  height: 100px;
  position: absolute;
  left: 50px;
  bottom: 38px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #416230;
  color: #fff;
  font-size: 40px;
  box-shadow: var(--reader-shadow);
}

.hero-open-book {
  width: 210px;
  height: 125px;
  position: absolute;
  right: 20px;
  bottom: 15px;
  display: grid;
  place-items: center;
  color: #f3ead8;
  font-size: 120px;
  transform: rotate(-8deg);
}

.category-view-button {
  border: 0;
  background: transparent;
}

.category-grid {
  display: grid;
  grid-template-columns:
    repeat(8, minmax(0, 1fr));
  gap: 11px;
}

.category-card {
  min-height: 125px;
  padding: 15px 8px;
  display: flex;
  align-items: center;
  flex-direction: column;
  border: 1px solid var(--reader-border);
  border-radius: 15px;
  background: #fff;
}

.category-icon {
  width: 52px;
  height: 52px;
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
  margin-top: 10px;
  color: var(--reader-text);
  font-size: 9px;
}

.category-card small {
  margin-top: 4px;
  color: var(--reader-muted);
  font-size: 7px;
}

.featured-section {
  background: #fbfcfb;
}

.book-grid {
  display: grid;
  grid-template-columns:
    repeat(6, minmax(0, 1fr));
  gap: 14px;
}

.home-loading {
  min-height: 250px;
  display: grid;
  place-items: center;
  color: var(--reader-muted);
}

.loading-circle {
  width: 27px;
  height: 27px;
  border: 3px solid #d9e6de;
  border-top-color:
    var(--reader-primary);
  border-radius: 50%;
  animation:
    reader-spin 0.8s linear infinite;
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
  font-size: 21px;
}

.promotion-card p {
  margin: 0;
  font-size: 10px;
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
  font-size: 67px;
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
  min-height: 175px;
  padding: 35px 44px;
  position: relative;
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

.discount-badge {
  width: 120px;
  height: 120px;
  display: grid;
  place-items: center;
  border: 8px double #fff;
  border-radius: 50%;
  background:
    var(--reader-primary);
  color: #fff;
  font-size: 31px;
  font-weight: 900;
}

.article-grid {
  display: grid;
  grid-template-columns:
    repeat(3, minmax(0, 1fr));
  gap: 17px;
}

.article-grid article {
  overflow: hidden;
  border: 1px solid var(--reader-border);
  border-radius: 15px;
  background: #fff;
}

.article-image {
  height: 160px;
  display: grid;
  place-items: center;
  font-size: 48px;
}

.article-one {
  background: #e9f2e4;
  color: #4a8155;
}

.article-two {
  background: #faeadf;
  color: #af6e44;
}

.article-three {
  background: #e3eef8;
  color: #3f75a3;
}

.article-content {
  padding: 15px;
}

.article-content small {
  color: var(--reader-primary);
  font-size: 8px;
  font-weight: 800;
}

.article-content h3 {
  margin: 7px 0;
  color: var(--reader-text);
  font-size: 12px;
  line-height: 1.5;
}

.article-content span {
  color: var(--reader-muted);
  font-size: 8px;
}

@media (max-width: 1050px) {
  .category-grid {
    grid-template-columns:
      repeat(4, 1fr);
  }

  .book-grid {
    grid-template-columns:
      repeat(3, 1fr);
  }
}

@media (max-width: 780px) {
  .hero-banner {
    grid-template-columns: 1fr;
  }

  .hero-visual {
    min-height: 310px;
  }

  .promotion-grid,
  .article-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .hero-content {
    padding: 30px 23px;
  }

  .hero-content h1 {
    font-size: 31px;
  }

  .hero-benefits {
    align-items: flex-start;
    flex-direction: column;
  }

  .category-grid,
  .book-grid {
    grid-template-columns:
      repeat(2, 1fr);
  }

  .wide-promotion-banner {
    padding: 25px;
  }

  .discount-badge {
    width: 80px;
    height: 80px;
    font-size: 21px;
  }
}
</style>