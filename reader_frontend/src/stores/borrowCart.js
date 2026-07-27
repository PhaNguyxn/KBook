import { computed, ref, watch } from "vue";

import { defineStore } from "pinia";

import { useReaderAuthStore } from "@/stores/readerAuth";

const CART_STORAGE_PREFIX = "kbook_borrow_cart";

const GUEST_OWNER = "guest";

const LEGACY_CART_KEYS = [
  "borrowCart",
  "borrow_cart",
  "borrow-cart",
  "kbookBorrowCart",
];

/* =========================================
   HÀM HỖ TRỢ
========================================= */

function getBookId(book = {}) {
  return String(book.bookId || book._id || book.book?._id || book.book || "");
}

function getReaderIdentity(reader) {
  if (!reader) {
    return GUEST_OWNER;
  }

  return String(
    reader._id ||
      reader.id ||
      reader.readerId ||
      reader.readerCode ||
      GUEST_OWNER,
  );
}

function getStorageKey(owner) {
  return `${CART_STORAGE_PREFIX}_${owner}`;
}

function normalizeQuantity(value) {
  const quantity = Number(value);

  if (!Number.isFinite(quantity) || quantity < 1) {
    return 1;
  }

  return Math.trunc(quantity);
}

function normalizeCartItem(item = {}) {
  const bookId = getBookId(item);

  if (!bookId) {
    return null;
  }

  return {
    ...item,

    _id: item._id || item.book?._id || bookId,

    bookId,

    title: item.title || item.book?.title || "Sách không xác định",

    author: item.author || item.book?.author || "",

    price: Number(item.price ?? item.book?.price ?? 0),

    category: item.category || item.book?.category || "",

    image: item.image || item.book?.image || "",

    available: Number(item.available ?? item.book?.available ?? 0),

    quantity: normalizeQuantity(item.quantity),
  };
}

function normalizeCartItems(data) {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(normalizeCartItem).filter(Boolean);
}

function readStorage(key) {
  try {
    const value = localStorage.getItem(key);

    if (!value) {
      return [];
    }

    return normalizeCartItems(JSON.parse(value));
  } catch (error) {
    console.error("Read borrow cart error:", error);

    localStorage.removeItem(key);

    return [];
  }
}

function writeStorage(key, items) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.error("Save borrow cart error:", error);
  }
}

/* =========================================
   STORE GIỎ MƯỢN
========================================= */

export const useBorrowCartStore = defineStore("borrowCart", () => {
  const authStore = useReaderAuthStore();

  const items = ref([]);

  const currentOwner = ref(GUEST_OWNER);

  const ownerIdentity = computed(() => getReaderIdentity(authStore.reader));

  const totalItems = computed(() => {
    return items.value.reduce(
      (total, item) => total + normalizeQuantity(item.quantity),
      0,
    );
  });

  const totalTitles = computed(() => {
    return items.value.length;
  });

  const isEmpty = computed(() => {
    return items.value.length === 0;
  });

  function saveCartForOwner(owner, cartItems = items.value) {
    if (!owner) {
      return;
    }

    writeStorage(getStorageKey(owner), normalizeCartItems(cartItems));
  }

  function removeCartForOwner(owner) {
    localStorage.removeItem(getStorageKey(owner));
  }


  function migrateLegacyCart(owner) {
    const currentKey = getStorageKey(owner);

    const currentCart = readStorage(currentKey);

    if (currentCart.length) {
      return currentCart;
    }

    for (const legacyKey of LEGACY_CART_KEYS) {
      const legacyCart = readStorage(legacyKey);

      if (legacyCart.length) {
        writeStorage(currentKey, legacyCart);

        LEGACY_CART_KEYS.forEach((key) => {
          localStorage.removeItem(key);
        });

        return legacyCart;
      }
    }

    return [];
  }

  function loadCartForOwner(owner) {
    const migratedCart = migrateLegacyCart(owner);

    if (migratedCart.length) {
      return migratedCart;
    }

    return readStorage(getStorageKey(owner));
  }

  function findItem(bookId) {
    return items.value.find((item) => String(item.bookId) === String(bookId));
  }

  function addBook(book, quantity = 1) {
    const bookId = getBookId(book);

    if (!bookId) {
      console.error("Không xác định được mã sách", book);

      return false;
    }

    const requestedQuantity = normalizeQuantity(quantity);

    const available = Number(book.available ?? book.book?.available);

    if (Number.isFinite(available) && available <= 0) {
      return false;
    }

    const existingItem = findItem(bookId);

    if (existingItem) {
      const newQuantity = existingItem.quantity + requestedQuantity;

      existingItem.quantity =
        Number.isFinite(available) && available > 0
          ? Math.min(newQuantity, available)
          : newQuantity;

      return true;
    }

    const normalizedItem = normalizeCartItem({
      ...book,
      bookId,
      quantity:
        Number.isFinite(available) && available > 0
          ? Math.min(requestedQuantity, available)
          : requestedQuantity,
    });

    if (!normalizedItem) {
      return false;
    }

    items.value.push(normalizedItem);

    return true;
  }

  function updateQuantity(bookId, quantity) {
    const item = findItem(bookId);

    if (!item) {
      return;
    }

    const newQuantity = normalizeQuantity(quantity);

    const available = Number(item.available);

    item.quantity =
      Number.isFinite(available) && available > 0
        ? Math.min(newQuantity, available)
        : newQuantity;
  }

  function increaseQuantity(bookId) {
    const item = findItem(bookId);

    if (!item) {
      return;
    }

    updateQuantity(bookId, item.quantity + 1);
  }

  function decreaseQuantity(bookId) {
    const item = findItem(bookId);

    if (!item) {
      return;
    }

    if (item.quantity <= 1) {
      removeBook(bookId);
      return;
    }

    item.quantity -= 1;
  }

  function removeBook(bookId) {
    items.value = items.value.filter(
      (item) => String(item.bookId) !== String(bookId),
    );
  }

  function clearCart() {
    items.value = [];

    removeCartForOwner(currentOwner.value);
  }

  function reloadCurrentCart() {
    items.value = loadCartForOwner(currentOwner.value);
  }


  watch(
    ownerIdentity,
    (newOwner, previousOwner) => {
      const previousItems = normalizeCartItems(items.value);

      if (previousOwner) {
        saveCartForOwner(previousOwner, previousItems);
      }

      currentOwner.value = newOwner;

      const newOwnerCart = loadCartForOwner(newOwner);

      if (
        previousOwner === GUEST_OWNER &&
        newOwner !== GUEST_OWNER &&
        newOwnerCart.length === 0 &&
        previousItems.length > 0
      ) {
        items.value = previousItems;

        saveCartForOwner(newOwner, previousItems);

        removeCartForOwner(GUEST_OWNER);

        return;
      }

      items.value = newOwnerCart;
    },
    {
      immediate: true,
    },
  );


  watch(
    items,
    (newItems) => {
      saveCartForOwner(currentOwner.value, newItems);
    },
    {
      deep: true,
    },
  );

  return {
    items,
    totalItems,
    totalTitles,
    isEmpty,
    currentOwner,

    addBook,
    updateQuantity,
    increaseQuantity,
    decreaseQuantity,
    removeBook,
    clearCart,
    reloadCurrentCart,
  };
});
