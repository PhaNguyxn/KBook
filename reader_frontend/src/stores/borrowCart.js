import { computed, ref } from "vue";

import { defineStore } from "pinia";

const STORAGE_KEY = "readerBorrowCart";

function readStoredCart() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);

    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

export const useBorrowCartStore = defineStore("borrowCart", () => {
  const items = ref(readStoredCart());

  const totalItems = computed(() => {
    return items.value.reduce(
      (total, item) => total + Number(item.quantity || 0),
      0,
    );
  });

  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value));
  }

  function addBook(book, quantity = 1) {
    if (!book?._id) {
      return;
    }

    const existedItem = items.value.find(
      (item) => String(item.bookId) === String(book._id),
    );

    if (existedItem) {
      const available = Number(book.available ?? book.quantity ?? 1);

      existedItem.quantity = Math.min(
        existedItem.quantity + quantity,
        Math.max(available, 1),
      );
    } else {
      items.value.push({
        bookId: book._id,

        bookCode: book.bookCode || "",

        title: book.title || "",

        author: book.author || "",

        category:
          book.category?.name || book.category?.category || book.category || "",

        image: book.image || book.img || "",

        available: Number(book.available ?? book.quantity ?? 0),

        quantity,

        borrowDays: 14,
      });
    }

    saveCart();
  }

  function updateQuantity(bookId, quantity) {
    const item = items.value.find(
      (cartItem) => String(cartItem.bookId) === String(bookId),
    );

    if (!item) {
      return;
    }

    const nextQuantity = Math.max(1, Number(quantity) || 1);

    item.quantity = item.available
      ? Math.min(nextQuantity, item.available)
      : nextQuantity;

    saveCart();
  }

  function updateBorrowDays(bookId, days) {
    const item = items.value.find(
      (cartItem) => String(cartItem.bookId) === String(bookId),
    );

    if (!item) {
      return;
    }

    item.borrowDays = Number(days) || 14;

    saveCart();
  }

  function removeBook(bookId) {
    items.value = items.value.filter(
      (item) => String(item.bookId) !== String(bookId),
    );

    saveCart();
  }

  function clearCart() {
    items.value = [];
    saveCart();
  }

  return {
    items,
    totalItems,

    addBook,
    updateQuantity,
    updateBorrowDays,
    removeBook,
    clearCart,
  };
});
