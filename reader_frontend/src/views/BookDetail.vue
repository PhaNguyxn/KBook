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

import {
  useBorrowCartStore,
} from "@/stores/borrowCart";

const route = useRoute();
const router = useRouter();

const cartStore =
  useBorrowCartStore();

const book = ref(null);
const relatedBooks = ref([]);

const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const activeTab = ref("description");
const imageError = ref(false);

const serverUrl = String(
  import.meta.env.VITE_SERVER_URL ||
    "http://localhost:3000",
).replace(/\/+$/, "");

function extractBook(response) {
  const payload =
    response?.data?.data ??
    response?.data ??
    {};

  return (
    payload.book ||
    payload.item ||
    payload
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

const available = computed(() => {
  return Number(
    book.value?.available || 0,
  );
});

const imageUrl = computed(() => {
  const image =
    book.value?.image || "";

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
});

const publisherName = computed(() => {
  const publisher =
    book.value?.publisher;

  if (!publisher) {
    return "Đang cập nhật";
  }

  if (
    typeof publisher === "object"
  ) {
    return (
      publisher.publisherName ||
      publisher.name ||
      publisher.title ||
      "Đang cập nhật"
    );
  }

  /*
   * Publisher chưa được populate
   * và đang là ObjectId.
   */
  if (
    /^[a-f\d]{24}$/i.test(
      String(publisher),
    )
  ) {
    return "Đang cập nhật";
  }

  return publisher;
});

async function loadBook() {
  const id = route.params.id;

  if (!id) {
    return;
  }

  loading.value = true;
  errorMessage.value = "";
  imageError.value = false;

  try {
    const [
      detailResponse,
      listResponse,
    ] = await Promise.all([
      bookApi.getById(id),

      bookApi.getAll({
        page: 1,
        limit: 1000,
      }),
    ]);

    book.value =
      extractBook(detailResponse);

    const allBooks =
      extractBooks(listResponse);

    relatedBooks.value =
      allBooks
        .filter(
          (item) =>
            item.status !== false &&
            String(item._id) !==
              String(id) &&
            item.category ===
              book.value?.category,
        )
        .slice(0, 5);
  } catch (error) {
    console.error(
      "Load book detail error:",
      error,
    );

    errorMessage.value =
      error?.response?.data?.message ||
      "Không thể tải chi tiết sách";

    book.value = null;
  } finally {
    loading.value = false;
  }
}

function addToBorrowCart() {
  if (
    !book.value ||
    available.value <= 0
  ) {
    return;
  }

  cartStore.addBook(
    book.value,
    1,
  );

  successMessage.value =
    "Đã thêm sách vào giỏ mượn";

  window.setTimeout(() => {
    successMessage.value = "";
  }, 2500);
}

function borrowNow() {
  addToBorrowCart();

  router.push({
    name: "reader-borrow-cart",
  });
}

watch(
  () => route.params.id,
  () => {
    loadBook();

    window.scrollTo({
      top: 0,
    });
  },
);

onMounted(() => {
  loadBook();
});
</script>

<template>
  <div class="book-detail-page">
    <section class="reader-section">
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

          <RouterLink
            :to="{
              name: 'reader-books',
            }"
          >
            Sách
          </RouterLink>

          <i class="bi bi-chevron-right" />

          <span>
            {{ book?.title || "Chi tiết" }}
          </span>
        </div>

        <div
          v-if="successMessage"
          class="success-alert"
        >
          <i
            class="bi bi-check-circle-fill"
          />

          {{ successMessage }}

          <RouterLink
            :to="{
              name: 'reader-borrow-cart',
            }"
          >
            Xem giỏ mượn
          </RouterLink>
        </div>

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
          v-if="loading"
          class="detail-loading"
        >
          <div class="loading-spinner" />

          Đang tải thông tin sách...
        </div>

        <div
          v-else-if="book"
          class="book-detail-layout"
        >
          <!-- Ảnh sách -->
          <div class="book-gallery">
            <div class="main-cover">
              <img
                v-if="
                  imageUrl &&
                  !imageError
                "
                :src="imageUrl"
                :alt="book.title"
                @error="
                  imageError = true
                "
              />

              <div
                v-else
                class="cover-placeholder"
              >
                <i class="bi bi-book" />

                <span>
                  {{ book.bookCode }}
                </span>
              </div>
            </div>

            <div class="cover-thumbnails">
              <button
                type="button"
                class="active"
              >
                <img
                  v-if="imageUrl"
                  :src="imageUrl"
                  :alt="book.title"
                />
              </button>

              <button type="button">
                <i
                  class="bi bi-file-text"
                />
              </button>

              <button type="button">
                <i
                  class="bi bi-card-text"
                />
              </button>
            </div>
          </div>

          <!-- Thông tin chính -->
          <div class="book-main-information">
            <div class="book-code">
              {{ book.bookCode }}
            </div>

            <div class="title-row">
              <h1>{{ book.title }}</h1>

              <span
                v-if="available > 0"
                class="featured-badge"
              >
                Còn sách
              </span>

              <span
                v-else
                class="unavailable-badge"
              >
                Đang được mượn
              </span>
            </div>

            <p class="author">
              Tác giả:

              <strong>
                {{ book.author }}
              </strong>
            </p>

            <div class="quick-meta">
              <span>
                <i class="bi bi-tag" />

                {{ book.category }}
              </span>

              <span>
                <i class="bi bi-calendar3" />

                {{ book.publishYear }}
              </span>

              <span>
                <i class="bi bi-translate" />

                {{ book.language }}
              </span>
            </div>

            <div class="detail-body">
              <div class="metadata-list">
                <div>
                  <span>
                    <i class="bi bi-upc-scan" />
                    ISBN
                  </span>

                  <strong>
                    {{ book.isbn || "Đang cập nhật" }}
                  </strong>
                </div>

                <div>
                  <span>
                    <i class="bi bi-building" />
                    Nhà xuất bản
                  </span>

                  <strong>
                    {{ publisherName }}
                  </strong>
                </div>

                <div>
                  <span>
                    <i class="bi bi-file-earmark-text" />
                    Số trang
                  </span>

                  <strong>
                    {{ book.pages || 0 }} trang
                  </strong>
                </div>

                <div>
                  <span>
                    <i class="bi bi-stack" />
                    Tổng số bản
                  </span>

                  <strong>
                    {{ book.quantity || 0 }} bản
                  </strong>
                </div>
              </div>

              <div class="availability-panel">
                <div
                  class="availability-status"
                  :class="{
                    unavailable:
                      available <= 0,
                  }"
                >
                  <i
                    :class="
                      available > 0
                        ? 'bi bi-check-circle-fill'
                        : 'bi bi-clock-fill'
                    "
                  />

                  <div>
                    <strong>
                      {{
                        available > 0
                          ? `Còn ${available} bản`
                          : "Hiện đã hết sách"
                      }}
                    </strong>

                    <span>
                      {{
                        available > 0
                          ? "Sẵn sàng cho mượn"
                          : "Có thể theo dõi để mượn sau"
                      }}
                    </span>
                  </div>
                </div>

                <div class="borrow-duration">
                  <i class="bi bi-calendar-week" />

                  <div>
                    <span>
                      Thời gian mượn đề xuất
                    </span>

                    <strong>14 ngày</strong>

                    <small>
                      Có thể gia hạn theo quy định
                    </small>
                  </div>
                </div>
              </div>
            </div>

            <div class="short-description">
              <h3>Giới thiệu</h3>

              <p>
                {{ book.description }}
              </p>
            </div>

            <div class="detail-actions">
              <button
                type="button"
                class="borrow-now-button"
                :disabled="
                  available <= 0
                "
                @click="borrowNow"
              >
                <i
                  class="bi bi-send"
                />

                {{
                  available > 0
                    ? "Gửi yêu cầu mượn"
                    : "Sách đang được mượn"
                }}
              </button>

              <button
                type="button"
                class="add-cart-button"
                :disabled="
                  available <= 0
                "
                @click="addToBorrowCart"
              >
                <i class="bi bi-bag-plus" />

                Thêm vào giỏ mượn
              </button>

              <button
                type="button"
                class="secondary-button"
              >
                <i class="bi bi-heart" />

                Yêu thích
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Nội dung chi tiết -->
    <section
      v-if="book"
      class="information-section"
    >
      <div class="reader-container">
        <div class="tabs">
          <button
            type="button"
            :class="{
              active:
                activeTab ===
                'description',
            }"
            @click="
              activeTab = 'description'
            "
          >
            Mô tả
          </button>

          <button
            type="button"
            :class="{
              active:
                activeTab ===
                'information',
            }"
            @click="
              activeTab = 'information'
            "
          >
            Thông tin chi tiết
          </button>

          <button
            type="button"
            :class="{
              active:
                activeTab ===
                'rules',
            }"
            @click="activeTab = 'rules'"
          >
            Quy định mượn
          </button>
        </div>

        <div
          v-if="
            activeTab === 'description'
          "
          class="tab-content description-content"
        >
          <div>
            <h2>Về nội dung</h2>

            <p>
              {{ book.description }}
            </p>

            <h3>
              Thông tin nổi bật
            </h3>

            <ul>
              <li>
                Thể loại:
                {{ book.category }}
              </li>

              <li>
                Ngôn ngữ:
                {{ book.language }}
              </li>

              <li>
                Xuất bản năm:
                {{ book.publishYear }}
              </li>

              <li>
                Số trang:
                {{ book.pages }} trang
              </li>
            </ul>
          </div>

          <aside class="reading-box">
            <i class="bi bi-book-half" />

            <h3>
              Đọc sách mỗi ngày
            </h3>

            <p>
              Một cuốn sách hay có thể mở ra
              những góc nhìn và hành trình mới.
            </p>
          </aside>
        </div>

        <div
          v-if="
            activeTab === 'information'
          "
          class="tab-content information-grid"
        >
          <div>
            <span>Mã sách</span>
            <strong>{{ book.bookCode }}</strong>
          </div>

          <div>
            <span>ISBN</span>
            <strong>{{ book.isbn }}</strong>
          </div>

          <div>
            <span>Tác giả</span>
            <strong>{{ book.author }}</strong>
          </div>

          <div>
            <span>Thể loại</span>
            <strong>{{ book.category }}</strong>
          </div>

          <div>
            <span>Năm xuất bản</span>
            <strong>{{ book.publishYear }}</strong>
          </div>

          <div>
            <span>Số trang</span>
            <strong>{{ book.pages }}</strong>
          </div>

          <div>
            <span>Ngôn ngữ</span>
            <strong>{{ book.language }}</strong>
          </div>

          <div>
            <span>Nhà xuất bản</span>
            <strong>{{ publisherName }}</strong>
          </div>
        </div>

        <div
          v-if="activeTab === 'rules'"
          class="tab-content rules-list"
        >
          <div>
            <i class="bi bi-check-circle" />

            <span>
              Mỗi độc giả được mượn số lượng
              sách theo quy định thư viện.
            </span>
          </div>

          <div>
            <i class="bi bi-check-circle" />

            <span>
              Thời gian mượn thông thường là
              14 ngày.
            </span>
          </div>

          <div>
            <i class="bi bi-check-circle" />

            <span>
              Cần trả sách đúng hạn hoặc đăng
              ký gia hạn trước ngày hết hạn.
            </span>
          </div>

          <div>
            <i class="bi bi-check-circle" />

            <span>
              Không viết, xé hoặc làm hư hỏng
              sách.
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Sách liên quan -->
    <section
      v-if="relatedBooks.length"
      class="reader-section related-section"
    >
      <div class="reader-container">
        <div class="reader-section-heading">
          <div>
            <h2>Sách liên quan</h2>

            <p>
              Những đầu sách cùng thể loại.
            </p>
          </div>

          <RouterLink
            :to="{
              name: 'reader-books',

              query: {
                category:
                  book.category,
              },
            }"
            class="reader-view-all"
          >
            Xem tất cả

            <i class="bi bi-arrow-right" />
          </RouterLink>
        </div>

        <div class="related-grid">
          <BookCard
            v-for="item in relatedBooks"
            :key="item._id"
            :book="item"
            compact
          />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.breadcrumb {
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 9px;
}

.breadcrumb a {
  color: var(--reader-primary);
}

.success-alert,
.error-alert {
  margin-bottom: 18px;
  padding: 13px 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid;
  border-radius: 11px;
  font-size: 10px;
}

.success-alert {
  border-color: #a7f3d0;
  background: #ecfdf5;
  color: #047857;
}

.success-alert a {
  margin-left: auto;
  color: #047857;
  font-weight: 900;
}

.error-alert {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.detail-loading {
  min-height: 500px;
  display: grid;
  place-items: center;
  color: var(--reader-muted);
}

.loading-spinner {
  width: 37px;
  height: 37px;
  border: 3px solid #dbe9e1;
  border-top-color: var(--reader-primary);
  border-radius: 50%;
  animation: reader-spin 0.8s linear infinite;
}

.book-detail-layout {
  display: grid;
  grid-template-columns: 390px minmax(0, 1fr);
  gap: 54px;
}

.main-cover {
  height: 535px;
  padding: 30px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background: #f4f7f5;
}

.main-cover img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter:
    drop-shadow(
      0 20px 18px
      rgb(15 23 42 / 18%)
    );
}

.cover-placeholder {
  display: flex;
  align-items: center;
  flex-direction: column;
  color: var(--reader-primary);
}

.cover-placeholder i {
  font-size: 95px;
}

.cover-placeholder span {
  margin-top: 15px;
  font-weight: 900;
}

.cover-thumbnails {
  margin-top: 14px;
  display: flex;
  justify-content: center;
  gap: 10px;
}

.cover-thumbnails button {
  width: 64px;
  height: 74px;
  padding: 5px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid var(--reader-border);
  border-radius: 8px;
  background: #fff;
  color: var(--reader-primary);
}

.cover-thumbnails button.active {
  border: 2px solid var(--reader-primary);
}

.cover-thumbnails img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.book-code {
  color: var(--reader-primary);
  font-size: 9px;
  font-weight: 900;
  text-transform: uppercase;
}

.title-row {
  margin-top: 7px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 11px;
}

.title-row h1 {
  margin: 0;
  color: var(--reader-text);
  font-size: 33px;
  line-height: 1.3;
}

.featured-badge,
.unavailable-badge {
  padding: 6px 9px;
  border-radius: 999px;
  font-size: 8px;
  font-weight: 900;
}

.featured-badge {
  background: #dcfce7;
  color: #15803d;
}

.unavailable-badge {
  background: #fef3c7;
  color: #b45309;
}

.author {
  margin: 14px 0;
  color: var(--reader-muted);
  font-size: 11px;
}

.author strong {
  color: var(--reader-primary);
}

.quick-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-meta span {
  padding: 7px 10px;
  border-radius: 8px;
  background: var(--reader-primary-light);
  color: var(--reader-primary);
  font-size: 8px;
  font-weight: 800;
}

.detail-body {
  margin-top: 24px;
  display: grid;
  grid-template-columns:
    minmax(0, 1fr) 235px;
  gap: 18px;
}

.metadata-list {
  display: grid;
  grid-template-columns:
    repeat(2, 1fr);
  gap: 12px;
}

.metadata-list > div {
  padding: 12px;
  border: 1px solid var(--reader-border);
  border-radius: 10px;
}

.metadata-list span,
.metadata-list strong {
  display: block;
}

.metadata-list span {
  color: var(--reader-muted);
  font-size: 8px;
}

.metadata-list strong {
  margin-top: 5px;
  color: var(--reader-text);
  font-size: 10px;
}

.availability-panel {
  padding: 15px;
  border: 1px solid var(--reader-border);
  border-radius: 13px;
}

.availability-status,
.borrow-duration {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.availability-status > i {
  color: #16a34a;
  font-size: 23px;
}

.availability-status.unavailable > i {
  color: #d97706;
}

.availability-status strong,
.availability-status span,
.borrow-duration strong,
.borrow-duration span,
.borrow-duration small {
  display: block;
}

.availability-status strong {
  color: #15803d;
  font-size: 11px;
}

.availability-status.unavailable strong {
  color: #b45309;
}

.availability-status span {
  margin-top: 4px;
  color: var(--reader-muted);
  font-size: 8px;
}

.borrow-duration {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid var(--reader-border);
}

.borrow-duration > i {
  color: var(--reader-primary);
  font-size: 20px;
}

.borrow-duration span,
.borrow-duration small {
  color: var(--reader-muted);
  font-size: 8px;
}

.borrow-duration strong {
  margin: 4px 0;
  color: var(--reader-primary);
  font-size: 12px;
}

.short-description {
  margin-top: 22px;
}

.short-description h3 {
  margin: 0 0 8px;
  color: var(--reader-text);
  font-size: 14px;
}

.short-description p {
  margin: 0;
  color: #64748b;
  font-size: 10px;
  line-height: 1.8;
}

.detail-actions {
  margin-top: 25px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.borrow-now-button,
.add-cart-button,
.secondary-button {
  min-height: 45px;
  padding: 0 18px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 900;
}

.borrow-now-button {
  min-width: 190px;
  border: 0;
  background: var(--reader-accent);
  color: #fff;
}

.add-cart-button {
  border: 1px solid var(--reader-primary);
  background: var(--reader-primary);
  color: #fff;
}

.secondary-button {
  border: 1px solid var(--reader-border);
  background: #fff;
  color: var(--reader-text);
}

.detail-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.information-section {
  padding: 0 0 40px;
  background: #fbfcfb;
}

.tabs {
  display: flex;
  border-bottom: 1px solid var(--reader-border);
}

.tabs button {
  padding: 20px 25px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: #64748b;
  font-size: 10px;
  font-weight: 900;
}

.tabs button.active {
  border-bottom-color: var(--reader-accent);
  color: var(--reader-accent);
}

.tab-content {
  min-height: 240px;
  padding: 32px 10px;
}

.description-content {
  display: grid;
  grid-template-columns:
    minmax(0, 1fr) 330px;
  gap: 50px;
}

.description-content h2,
.description-content h3 {
  color: var(--reader-text);
}

.description-content p,
.description-content li {
  color: #64748b;
  font-size: 10px;
  line-height: 1.9;
}

.reading-box {
  padding: 30px;
  border-radius: 16px;
  background:
    linear-gradient(
      135deg,
      #fff5c9,
      #fffbea
    );
}

.reading-box > i {
  color: #d99a00;
  font-size: 31px;
}

.reading-box h3 {
  margin: 15px 0 8px;
}

.reading-box p {
  margin: 0;
}

.information-grid {
  display: grid;
  grid-template-columns:
    repeat(4, 1fr);
  gap: 13px;
}

.information-grid > div {
  padding: 17px;
  border: 1px solid var(--reader-border);
  border-radius: 11px;
  background: #fff;
}

.information-grid span,
.information-grid strong {
  display: block;
}

.information-grid span {
  color: var(--reader-muted);
  font-size: 8px;
}

.information-grid strong {
  margin-top: 6px;
  color: var(--reader-text);
  font-size: 10px;
}

.rules-list {
  display: grid;
  grid-template-columns:
    repeat(2, 1fr);
  gap: 13px;
}

.rules-list > div {
  padding: 17px;
  display: flex;
  gap: 10px;
  border-radius: 11px;
  background: #eef7f2;
  color: #3e6451;
  font-size: 10px;
}

.rules-list i {
  color: var(--reader-primary);
}

.related-section {
  background: #fff;
}

.related-grid {
  display: grid;
  grid-template-columns:
    repeat(5, minmax(0, 1fr));
  gap: 15px;
}

@media (max-width: 1000px) {
  .book-detail-layout {
    grid-template-columns:
      320px minmax(0, 1fr);
    gap: 30px;
  }

  .detail-body {
    grid-template-columns: 1fr;
  }

  .related-grid {
    grid-template-columns:
      repeat(3, 1fr);
  }
}

@media (max-width: 750px) {
  .book-detail-layout {
    grid-template-columns: 1fr;
  }

  .main-cover {
    height: 430px;
  }

  .description-content {
    grid-template-columns: 1fr;
  }

  .information-grid {
    grid-template-columns:
      repeat(2, 1fr);
  }
}

@media (max-width: 520px) {
  .title-row h1 {
    font-size: 25px;
  }

  .metadata-list {
    grid-template-columns: 1fr;
  }

  .tabs {
    overflow-x: auto;
  }

  .tabs button {
    flex-shrink: 0;
  }

  .rules-list,
  .related-grid {
    grid-template-columns:
      repeat(2, 1fr);
  }
}
</style>