<script setup>
import {
  computed,
  ref,
} from "vue";

import {
  useRouter,
} from "vue-router";

import {
  useBorrowCartStore,
} from "@/stores/borrowCart";

const props = defineProps({
  book: {
    type: Object,
    required: true,
  },

  compact: {
    type: Boolean,
    default: false,
  },
});

const router = useRouter();

const cartStore =
  useBorrowCartStore();

const imageError = ref(false);
const added = ref(false);

const serverUrl = String(
  import.meta.env.VITE_SERVER_URL ||
    "http://localhost:3000",
).replace(/\/+$/, "");

const available = computed(() => {
  return Number(
    props.book.available || 0,
  );
});

const quantity = computed(() => {
  return Number(
    props.book.quantity || 0,
  );
});

const imageUrl = computed(() => {
  const image =
    props.book.image ||
    props.book.img ||
    props.book.img1 ||
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
});

const publisherName = computed(() => {
  const publisher =
    props.book.publisher;

  if (
    typeof publisher === "object"
  ) {
    return (
      publisher?.publisherName ||
      publisher?.name ||
      ""
    );
  }

  return "";
});

function openDetail() {
  router.push({
    name: "reader-book-detail",

    params: {
      id: props.book._id,
    },
  });
}

function addToCart() {
  if (available.value <= 0) {
    return;
  }

  cartStore.addBook(
    props.book,
    1,
  );

  added.value = true;

  window.setTimeout(() => {
    added.value = false;
  }, 1500);
}
</script>

<template>
  <article
    class="book-card"
    :class="{
      compact,
    }"
  >
    <button
  type="button"
  class="cover-button"
  :title="`Xem chi tiết ${book.title}`"
  @click="openDetail"
>
  <span class="cover-frame">
    <img
      v-if="imageUrl && !imageError"
      :src="imageUrl"
      :alt="book.title"
      loading="lazy"
      @error="imageError = true"
    />

    <span
      v-else
      class="cover-placeholder"
    >
      <i class="bi bi-book" />

      <small>
        {{ book.bookCode }}
      </small>
    </span>
  </span>

  <span
    class="stock-badge"
    :class="{
      unavailable: available <= 0,
    }"
  >
    {{
      available > 0
        ? `Còn ${available}`
        : "Hết sách"
    }}
  </span>
</button>

    <div class="book-content">
      <span class="book-category">
        {{
          book.category ||
          "Chưa phân loại"
        }}
      </span>

      <button
        type="button"
        class="book-title"
        @click="openDetail"
      >
        {{ book.title }}
      </button>

      <span class="book-author">
        {{
          book.author ||
          "Chưa cập nhật tác giả"
        }}
      </span>

      <div class="book-meta">
        <span>
          <i class="bi bi-calendar3" />

          {{
            book.publishYear ||
            "—"
          }}
        </span>

        <span>
          <i class="bi bi-translate" />

          {{
            book.language ||
            "Tiếng Việt"
          }}
        </span>
      </div>

      <span
        v-if="publisherName"
        class="publisher"
      >
        <i class="bi bi-building" />

        {{ publisherName }}
      </span>

      <div class="quantity-information">
        <span>
          Tổng:
          <strong>
            {{ quantity }}
          </strong>
        </span>

        <span>
          Còn:
          <strong>
            {{ available }}
          </strong>
        </span>
      </div>

      <button
        type="button"
        class="borrow-button"
        :class="{
          added,
        }"
        :disabled="
          available <= 0
        "
        @click="addToCart"
      >
        <i
          :class="
            added
              ? 'bi bi-check-lg'
              : 'bi bi-bag-plus'
          "
        />

        {{
          added
            ? "Đã thêm"
            : available > 0
              ? "Thêm vào giỏ mượn"
              : "Chưa thể mượn"
        }}
      </button>
    </div>
  </article>
</template>

<style scoped>
.book-card {
  min-width: 0;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid #e3ebe6;
  border-radius: 15px;
  background: #fff;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 14px 35px
    rgb(15 23 42 / 9%);
}

.cover-button {
  width: 100%;
  height: 320px;
  padding: 18px;
  position: relative;
  display: block;
  overflow: hidden;
  border: 0;
  background: #f5f8f6;
  cursor: pointer;
}

.book-card.compact .cover-button {
  height: 285px;
}

.cover-frame {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  border-radius: 8px;
}

.cover-frame img {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  display: block;
  object-fit: contain;
  object-position: center;
  filter:
    drop-shadow(
      0 10px 12px
      rgb(15 23 42 / 15%)
    );
}

.cover-placeholder {
  display: flex;
  align-items: center;
  flex-direction: column;
  color: #0c653d;
}

.cover-placeholder i {
  font-size: 50px;
}

.cover-placeholder small {
  margin-top: 10px;
  font-weight: 900;
}

.stock-badge {
  padding: 5px 8px;
  position: absolute;
  top: 11px;
  right: 11px;
  border-radius: 999px;
  background: #16a05d;
  color: #fff;
  font-size: 8px;
  font-weight: 900;
}

.stock-badge.unavailable {
  background: #d97706;
}

.book-content {
  min-width: 0;
  padding: 15px;
  display: flex;
  flex: 1;
  flex-direction: column;
}

.book-category {
  color: #0c653d;
  font-size: 8px;
  font-weight: 900;
}

.book-title {
  width: 100%;
  min-height: 41px;
  margin-top: 7px;
  padding: 0;
  overflow: hidden;
  display: -webkit-box;
  border: 0;
  background: transparent;
  color: #1c3025;
  font-size: 11px;
  font-weight: 900;
  line-height: 1.55;
  text-align: left;
  cursor: pointer;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.book-author {
  margin-top: 6px;
  overflow: hidden;
  display: block;
  color: #728078;
  font-size: 8px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-meta {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: #89958e;
  font-size: 7px;
}

.publisher {
  margin-top: 8px;
  display: block;
  overflow: hidden;
  color: #89958e;
  font-size: 7px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quantity-information {
  margin-top: 11px;
  margin-bottom: 13px;
  padding: 8px 9px;
  display: flex;
  justify-content: space-between;
  border-radius: 8px;
  background: #f5f8f6;
  color: #738078;
  font-size: 8px;
}

.quantity-information strong {
  color: #0c653d;
}

.borrow-button {
  width: 100%;
  min-height: 42px;
  margin-top: auto;
  padding: 0 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 7px;
  border: 1px solid #0c653d;
  border-radius: 9px;
  background: #fff;
  color: #0c653d;
  font-size: 9px;
  font-weight: 900;
  cursor: pointer;
}

.borrow-button:hover:not(:disabled),
.borrow-button.added {
  background: #0c653d;
  color: #fff;
}

.borrow-button:disabled {
  cursor: not-allowed;
  border-color: #d6ded9;
  color: #a0aaa4;
  opacity: 0.7;
}
</style>