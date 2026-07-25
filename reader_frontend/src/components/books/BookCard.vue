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

const serverUrl = String(
  import.meta.env.VITE_SERVER_URL ||
  "http://localhost:3000",
).replace(/\/+$/, "");

const available = computed(() => {
  return Number(
    props.book.available ??
      props.book.quantity ??
      0,
  );
});

const categoryName = computed(() => {
  const category =
    props.book.category;

  if (
    typeof category === "string"
  ) {
    return category;
  }

  return (
    category?.name ||
    category?.category ||
    "Chưa phân loại"
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

  if (
    image.startsWith("http") ||
    image.startsWith("data:")
  ) {
    return image;
  }

  return `${serverUrl}/${image.replace(
    /^\/+/,
    "",
  )}`;
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
      class="book-image"
      @click="openDetail"
    >
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

      <span
        v-else
        class="image-placeholder"
      >
        <i class="bi bi-book" />
      </span>

      <span
        class="availability-badge"
        :class="{
          unavailable:
            available <= 0,
        }"
      >
        {{
          available > 0
            ? "Còn sẵn"
            : "Hết sách"
        }}
      </span>
    </button>

    <div class="book-content">
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

      <span class="book-category">
        {{ categoryName }}
      </span>

      <span
        class="book-stock"
        :class="{
          out:
            available <= 0,
        }"
      >
        <i
          class="bi bi-circle-fill"
        />

        {{
          available > 0
            ? `Còn ${available} bản`
            : "Đang được mượn"
        }}
      </span>

      <button
        type="button"
        class="borrow-button"
        :disabled="
          available <= 0
        "
        @click="addToCart"
      >
        <i
          :class="
            available > 0
              ? 'bi bi-plus-lg'
              : 'bi bi-clock'
          "
        />

        {{
          available > 0
            ? "Thêm vào giỏ mượn"
            : "Đặt trước"
        }}
      </button>
    </div>
  </article>
</template>

<style scoped>
.book-card {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--reader-border);
  border-radius: 14px;
  background: #fff;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--reader-shadow);
}

.book-image {
  width: 100%;
  height: 255px;
  padding: 18px;
  position: relative;
  display: grid;
  place-items: center;
  border: 0;
  background: #f8faf9;
}

.book-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.image-placeholder {
  color: var(--reader-primary);
  font-size: 45px;
}

.availability-badge {
  padding: 5px 8px;
  position: absolute;
  top: 11px;
  right: 11px;
  border-radius: 999px;
  background: #20a862;
  color: #fff;
  font-size: 8px;
  font-weight: 900;
}

.availability-badge.unavailable {
  background: #f59e0b;
}

.book-content {
  padding: 14px;
}

.book-title {
  width: 100%;
  padding: 0;
  overflow: hidden;
  display: block;
  border: 0;
  background: transparent;
  color: var(--reader-text);
  font-size: 12px;
  font-weight: 900;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-author,
.book-category,
.book-stock {
  display: block;
}

.book-author {
  margin-top: 6px;
  color: #71808d;
  font-size: 9px;
}

.book-category {
  margin-top: 7px;
  color: #a0abb5;
  font-size: 8px;
}

.book-stock {
  margin-top: 10px;
  color: #179d59;
  font-size: 8px;
  font-weight: 800;
}

.book-stock i {
  margin-right: 5px;
  font-size: 6px;
}

.book-stock.out {
  color: #e58a00;
}

.borrow-button {
  width: 100%;
  min-height: 36px;
  margin-top: 13px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--reader-accent);
  border-radius: 9px;
  background: #fff;
  color: var(--reader-accent);
  font-size: 9px;
  font-weight: 900;
}

.borrow-button:hover:not(:disabled) {
  background:
    var(--reader-accent);
  color: #fff;
}

.borrow-button:disabled {
  cursor: not-allowed;
  border-color: #f0b85a;
  color: #d98908;
}

.book-card.compact .book-image {
  height: 210px;
}
</style>