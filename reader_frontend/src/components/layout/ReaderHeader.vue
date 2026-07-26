<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";

import {
  RouterLink,
  useRoute,
  useRouter,
} from "vue-router";

import {
  useReaderAuthStore,
} from "@/stores/readerAuth";

import {
  bookApi,
} from "@/api/bookApi";

import {
  useBorrowCartStore,
} from "@/stores/borrowCart";

const route = useRoute();
const router = useRouter();

const authStore =
  useReaderAuthStore();

const cartStore =
  useBorrowCartStore();

const mobileMenuOpen = ref(false);
const accountMenuOpen = ref(false);
const searchKeyword = ref("");
const selectedCategory = ref("");
const categories = ref([]);
const loadingCategories = ref(false);
const searchFocused = ref(false);
const accountWrapper = ref(null);

/* =========================================
   THÔNG TIN ĐỘC GIẢ
========================================= */

const readerName = computed(() => {
  const reader =
    authStore.reader;

  if (!reader) {
    return "Độc giả";
  }

  return (
    reader.fullName ||
    `${reader.lastName || ""} ${
      reader.firstName || ""
    }`.trim() ||
    "Độc giả"
  );
});

const readerCode = computed(() => {
  return (
    authStore.reader?.readerCode ||
    ""
  );
});

const readerInitials = computed(() => {
  const words =
    readerName.value
      .split(/\s+/)
      .filter(Boolean);

  if (!words.length) {
    return "DG";
  }

  return words
    .slice(-2)
    .map((word) =>
      word.charAt(0).toUpperCase(),
    )
    .join("");
});

/* =========================================
   TÌM KIẾM
========================================= */

function searchBooks() {
  const keyword =
    searchKeyword.value.trim();

  const category =
    selectedCategory.value.trim();

  router.push({
    name: "reader-books",

    query: {
      ...(keyword
        ? {
            keyword,
          }
        : {}),

      ...(category
        ? {
            category,
          }
        : {}),
    },
  });

  closeMenus();
}

function clearSearchKeyword() {
  searchKeyword.value = "";
}

function handleCategoryChange() {
  searchBooks();
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
    payload.docs ||
    []
  );
}

async function loadCategories() {
  loadingCategories.value = true;

  try {
    const response =
      await bookApi.getAll({
        page: 1,
        limit: 100,
      });

    const books =
      extractBooks(response);

    categories.value = [
      ...new Set(
        books
          .map((book) =>
            String(
              book.category || "",
            ).trim(),
          )
          .filter(Boolean),
      ),
    ].sort((first, second) =>
      first.localeCompare(
        second,
        "vi",
      ),
    );
  } catch (error) {
    console.error(
      "Load header categories error:",
      error,
    );

    categories.value = [];
  } finally {
    loadingCategories.value = false;
  }
}

function syncSearchFromRoute() {
  searchKeyword.value =
    String(
      route.query.keyword || "",
    );

  selectedCategory.value =
    String(
      route.query.category || "",
    );
}

/* =========================================
   MENU
========================================= */

function toggleMobileMenu() {
  mobileMenuOpen.value =
    !mobileMenuOpen.value;

  accountMenuOpen.value = false;
}

function toggleAccountMenu() {
  accountMenuOpen.value =
    !accountMenuOpen.value;

  mobileMenuOpen.value = false;
}

function handleOutsideAccountClick(event) {
  if (!accountMenuOpen.value) {
    return;
  }

  if (
    accountWrapper.value &&
    !accountWrapper.value.contains(
      event.target,
    )
  ) {
    accountMenuOpen.value = false;
  }
}

function closeMenus() {
  mobileMenuOpen.value = false;
  accountMenuOpen.value = false;
}

/* =========================================
   ĐĂNG XUẤT
========================================= */

async function logout() {
  closeMenus();

  authStore.logout();

  await router.push({
    name: "reader-home",
  });
}

watch(
  () => route.fullPath,
  () => {
    closeMenus();
    syncSearchFromRoute();
  },
);

onMounted(() => {
    document.addEventListener(
    "click",
    handleOutsideAccountClick,
  );
  syncSearchFromRoute();
  loadCategories();
});

</script>

<template>
  <header class="reader-header">
    <!-- Thanh thông tin trên cùng -->
    <div class="top-bar">
      <div class="reader-container top-bar-inner">
        <div class="top-contact">
          <span>
            <i class="bi bi-telephone" />
            Hotline: 1900 9876
          </span>

          <span>
            <i class="bi bi-clock" />
            8:00 - 21:00
          </span>
        </div>

        <RouterLink
          :to="{
            name: 'reader-contact',
          }"
          class="help-link"
        >
          <i class="bi bi-question-circle" />

          Trung tâm trợ giúp
        </RouterLink>
      </div>
    </div>

    <!-- Header chính -->
    <div class="main-header">
      <div class="reader-container main-header-inner">
        <!-- Logo -->
        <RouterLink
          :to="{
            name: 'reader-home',
          }"
          class="brand"
          aria-label="Trang chủ KBook"
        >
          <span class="brand-icon">
            <i class="bi bi-book-half" />
          </span>

          <span class="brand-text">
            <strong>KBook</strong>
            <small>Reader</small>
          </span>
        </RouterLink>

        <!-- Tìm kiếm -->
        <form
  class="header-search"
  :class="{
    focused: searchFocused,
  }"
  @submit.prevent="searchBooks"
>
  <span class="search-leading-icon">
    <i class="bi bi-search" />
  </span>

  <div class="search-input-wrapper">
    <input
      v-model="searchKeyword"
      type="search"
      autocomplete="off"
      placeholder="Tìm tên sách, tác giả,..."
      aria-label="Từ khóa tìm kiếm"
      @focus="searchFocused = true"
      @blur="searchFocused = false"
    />

    <button
      v-if="searchKeyword"
      type="button"
      class="clear-search-button"
      title="Xóa từ khóa"
      aria-label="Xóa từ khóa"
      @click="clearSearchKeyword"
    >
      <i class="bi bi-x-lg" />
    </button>
  </div>

  <div class="category-select-wrapper">
    <i class="bi bi-grid category-select-icon" />

    <select
      v-model="selectedCategory"
      aria-label="Chọn danh mục sách"
      :disabled="loadingCategories"
      @change="handleCategoryChange"
    >
      <option value="">
        {{
          loadingCategories
            ? "Đang tải danh mục..."
            : "Tất cả danh mục"
        }}
      </option>

      <option
        v-for="category in categories"
        :key="category"
        :value="category"
      >
        {{ category }}
      </option>
    </select>

    <i class="bi bi-chevron-down category-arrow" />
  </div>

  <button
    type="submit"
    class="submit-search-button"
    title="Tìm kiếm sách"
    aria-label="Tìm kiếm sách"
  >
    <i class="bi bi-search" />

    <span>Tìm</span>
  </button>
</form>

        <!-- Tài khoản và giỏ mượn -->
        <div class="header-actions">
  <!-- Đã đăng nhập -->
  <div
    v-if="authStore.isAuthenticated"
    ref="accountWrapper"
    class="account-wrapper"
    @click.stop
  >
    <button
      type="button"
      class="account-button"
      :class="{
        active: accountMenuOpen,
      }"
      aria-label="Mở menu tài khoản"
      :aria-expanded="accountMenuOpen"
      @click.stop="toggleAccountMenu"
    >
      <span class="account-avatar">
        {{ readerInitials }}
      </span>

      <span class="account-information">
        <small>Tài khoản</small>

        <strong>
          {{ readerName }}
        </strong>
      </span>

      <i
        class="bi bi-chevron-down account-arrow"
        :class="{
          rotated: accountMenuOpen,
        }"
      />
    </button>

    <Transition name="account-menu">
      <div
        v-if="accountMenuOpen"
        class="account-dropdown"
        @click.stop
      >
        <div class="dropdown-reader">
            <span class="dropdown-avatar">
                {{ readerInitials || "DG" }}
            </span>

            <div class="dropdown-reader-info">
                <strong>{{ readerName }}</strong>

                <small>
                {{ readerCode || "Tài khoản độc giả" }}
                </small>
            </div>
        </div>

        <div class="dropdown-divider" />

        <RouterLink
          :to="{
            name: 'reader-profile',
          }"
          @click="accountMenuOpen = false"
        >
          <i class="bi bi-person" />
          Hồ sơ cá nhân
        </RouterLink>

        <RouterLink
          :to="{
            name: 'reader-requests',
          }"
          @click="accountMenuOpen = false"
        >
          <i class="bi bi-send-check" />
          Yêu cầu mượn
        </RouterLink>

        <RouterLink
          :to="{
            name: 'reader-history',
          }"
          @click="accountMenuOpen = false"
        >
          <i class="bi bi-clock-history" />
          Lịch sử mượn
        </RouterLink>

        <div class="dropdown-divider" />

        <button
          type="button"
          class="dropdown-logout"
          @click="logout"
        >
          <i class="bi bi-box-arrow-right" />
          Đăng xuất
        </button>
      </div>
    </Transition>
  </div>

  <!-- Chưa đăng nhập -->
  <RouterLink
    v-else
    :to="{
      name: 'reader-login',
    }"
    class="login-button"
  >
    <span class="login-icon">
      <i class="bi bi-person" />
    </span>

    <span class="login-information">
      <small>Tài khoản</small>
      <strong>Đăng nhập</strong>
    </span>
  </RouterLink>

  <RouterLink
    :to="{
      name: 'reader-borrow-cart',
    }"
    class="cart-button"
    title="Giỏ mượn"
  >
    <i class="bi bi-bag" />

    <span
      v-if="cartStore.totalItems > 0"
      class="cart-count"
    >
      {{ cartStore.totalItems }}
    </span>
  </RouterLink>
</div>
      </div>
    </div>

    <!-- Thanh điều hướng -->
    <nav class="navigation-bar">
      <div class="reader-container navigation-inner">
        <RouterLink
          :to="{
            name: 'reader-books',
          }"
          class="category-navigation"
        >
          <i class="bi bi-grid" />

          <span>
            Danh mục sách
          </span>
        </RouterLink>

        <div
          class="navigation-links"
          :class="{
            open: mobileMenuOpen,
          }"
        >
          <RouterLink
            :to="{
              name: 'reader-home',
            }"
          >
            <i class="bi bi-house" />

            Trang chủ
          </RouterLink>

          <RouterLink
            :to="{
              name: 'reader-books',

              query: {
                sort: 'year-desc',
              },
            }"
          >
            <i class="bi bi-stars" />

            Sách mới
          </RouterLink>

          <RouterLink
            :to="{
              name: 'reader-books',

              query: {
                availability:
                  'available',
              },
            }"
          >
            <i class="bi bi-book" />

            Sách đang có
          </RouterLink>

          <RouterLink
            v-if="
              authStore.isAuthenticated
            "
            :to="{
              name:
                'reader-requests',
            }"
          >
            <i
              class="bi bi-send-check"
            />

            Yêu cầu mượn
          </RouterLink>

          <RouterLink
            v-if="
              authStore.isAuthenticated
            "
            :to="{
              name:
                'reader-history',
            }"
          >
            <i
              class="bi bi-clock-history"
            />

            Lịch sử mượn
          </RouterLink>

          <RouterLink
            :to="{
              name: 'reader-contact',
            }"
          >
            <i class="bi bi-telephone" />

            Liên hệ
          </RouterLink>

          <!-- Chỉ xuất hiện trong menu mobile -->
          <template
            v-if="
              authStore.isAuthenticated
            "
          >
            <RouterLink
              :to="{
                name:
                  'reader-profile',
              }"
              class="mobile-only-link"
            >
              <i class="bi bi-person" />

              Hồ sơ cá nhân
            </RouterLink>

            <button
              type="button"
              class="mobile-only-link mobile-logout"
              @click="logout"
            >
              <i
                class="bi bi-box-arrow-right"
              />

              Đăng xuất
            </button>
          </template>
        </div>
      </div>
    </nav>
  </header>
</template>

<style scoped>
.reader-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: #fff;
  box-shadow:
    0 3px 18px
    rgb(15 23 42 / 5%);
}

/* =========================================
   TOP BAR
========================================= */

.top-bar {
  position: relative;
  z-index: 5;
  border-bottom: 1px solid #edf2f0;
  background: #fbfdfc;
}

.top-bar-inner {
  min-height: 36px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  color: #718096;
  font-size: 11px;
}

.top-contact {
  display: flex;
  align-items: center;
  gap: 20px;
}

.top-contact span,
.top-promotion,
.help-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.top-promotion {
  margin: 0;
}

.top-promotion strong {
  color: var(
    --reader-accent,
    #ef476f
  );
}

.help-link {
  color: #718096;
  transition: color 0.2s ease;
}

.help-link:hover {
  color: var(
    --reader-primary,
    #0c653d
  );
}

/* =========================================
   MAIN HEADER
========================================= */

.main-header {
  position: relative;
  z-index: 5;
  border-bottom: 1px solid #edf2f0;
  background: #fff;
}

.main-header-inner {
  min-height: 94px;
  display: flex;
  align-items: center;
  gap: 36px;
}

/* Logo */

.brand {
  min-width: 188px;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(
    --reader-primary,
    #0c653d
  );
}

.brand-icon {
  font-size: 45px;
  line-height: 1;
}

.brand-text strong,
.brand-text small {
  display: block;
}

.brand-text strong {
  font-size: 28px;
  font-weight: 900;
  line-height: 1;
}

.brand-text small {
  margin-top: 4px;
  font-size: 11px;
  font-weight: 900;
}

/* Tìm kiếm */

.header-search {
  min-width: 0;
  height: 54px;
  display: grid;
  grid-template-columns:
    46px
    minmax(180px, 1fr)
    minmax(175px, 220px)
    82px;
  overflow: hidden;
  flex: 1;
  border: 1px solid #dce6e0;
  border-radius: 999px;
  background: #f8faf9;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.header-search:hover {
  border-color: #b9cec1;
  background: #fff;
}

.header-search.focused,
.header-search:focus-within {
  border-color: var(
    --reader-primary,
    #0c653d
  );
  background: #fff;
  box-shadow:
    0 0 0 4px
    rgb(12 101 61 / 9%);
}

.search-leading-icon {
  display: grid;
  place-items: center;
  color: #87968e;
  font-size: 17px;
}

.search-input-wrapper {
  min-width: 0;
  position: relative;
  display: flex;
  align-items: center;
}

.search-input-wrapper input {
  width: 100%;
  height: 100%;
  min-width: 0;
  padding: 0 38px 0 3px;
  border: 0;
  background: transparent;
  color: #20352a;
  font-size: 14px;
  outline: none;
}

.search-input-wrapper input::placeholder {
  color: #8b9891;
}

.search-input-wrapper input::-webkit-search-cancel-button {
  display: none;
}

.clear-search-button {
  width: 28px;
  height: 28px;
  position: absolute;
  right: 6px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: #e9efeb;
  color: #64756c;
  font-size: 10px;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.clear-search-button:hover {
  background: #fee2e2;
  color: #dc2626;
}

.category-select-wrapper {
  min-width: 0;
  position: relative;
  display: flex;
  align-items: center;
  border-left: 1px solid #dfe7e2;
  background: rgb(255 255 255 / 45%);
}

.category-select-icon {
  position: absolute;
  left: 14px;
  z-index: 1;
  color: var(
    --reader-primary,
    #0c653d
  );
  font-size: 13px;
  pointer-events: none;
}

.category-select-wrapper select {
  width: 100%;
  height: 100%;
  padding: 0 36px 0 36px;
  overflow: hidden;
  border: 0;
  appearance: none;
  background: transparent;
  color: #42554b;
  font-size: 11px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
  outline: none;
  cursor: pointer;
}

.category-select-wrapper select:disabled {
  cursor: wait;
  opacity: 0.65;
}

.category-arrow {
  position: absolute;
  right: 14px;
  color: #64756c;
  font-size: 10px;
  pointer-events: none;
}

.submit-search-button {
  min-width: 82px;
  padding: 0 16px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 7px;
  border: 0;
  border-radius: 0 999px 999px 0;
  background: var(
    --reader-primary,
    #0c653d
  );
  color: #fff;
  font-size: 11px;
  font-weight: 900;
  cursor: pointer;
  transition:
    background 0.2s ease,
    padding 0.2s ease;
}

.submit-search-button i {
  font-size: 16px;
}

.submit-search-button:hover {
  background: var(
    --reader-primary-dark,
    #08492f
  );
}

/* =========================================
   HEADER ACTIONS
========================================= */

.header-actions {
  position: relative;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 12px;
}

.account-wrapper {
  position: relative;
  z-index: 101;
  display: block;
}

.account-button {
  min-width: 205px;
  height: 58px;
  padding: 7px 13px;
  display: flex;
  align-items: center;
  gap: 11px;

  appearance: none;
  -webkit-appearance: none;

  border: 0;
  border-radius: 15px;
  outline: none;
  background: transparent;
  color: #20352a;
  font-family: inherit;
  text-align: left;
  cursor: pointer;

  transition:
    background 0.2s ease,
    box-shadow 0.2s ease;
}

.account-button:hover,
.account-button.active {
  background: #eaf7ef;
}

.account-button:focus-visible {
  box-shadow: 0 0 0 3px rgb(12 101 61 / 15%);
}

.account-avatar {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  flex: 0 0 44px;

  border-radius: 50%;
  background: #0c653d;
  color: #fff;

  font-size: 12px;
  font-weight: 900;
  line-height: 1;
}

.account-information {
  min-width: 0;
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
}

.account-information small {
  margin: 0 0 3px;
  display: block;
  color: #819087;
  font-size: 9px;
  font-weight: 500;
  line-height: 1.2;
}

.account-information strong {
  max-width: 125px;
  overflow: hidden;
  display: block;
  color: #20352a;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-arrow {
  margin-left: auto;
  flex-shrink: 0;
  color: #809087;
  font-size: 11px;
  transition: transform 0.2s ease;
}

.account-arrow.rotated {
  transform: rotate(180deg);
}

/* Dropdown */

.account-dropdown {
  width: 310px;
  padding: 14px;
  position: absolute;
  top: calc(100% + 14px);
  right: 0;
  z-index: 9999;

  border: 1px solid #e1e9e4;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 22px 55px rgb(15 23 42 / 16%);
}

.dropdown-reader {
  min-width: 0;
  padding: 7px 7px 14px;
  display: flex;
  align-items: center;
  gap: 13px;
}

.dropdown-avatar {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  flex: 0 0 48px;

  border-radius: 50%;
  background: #0c653d;
  color: #fff;

  font-size: 13px;
  font-weight: 900;
}

.dropdown-reader-info {
  min-width: 0;
  flex: 1;
}

.dropdown-reader-info strong,
.dropdown-reader-info small {
  display: block;
}

.dropdown-reader-info strong {
  overflow: hidden;
  color: #20352a;
  font-size: 13px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-reader-info small {
  margin-top: 5px;
  color: #819087;
  font-size: 9px;
}

.dropdown-divider {
  height: 1px;
  margin: 5px 0 9px;
  background: #e8eeea;
}

.account-dropdown > a,
.dropdown-logout {
  width: 100%;
  min-height: 46px;
  padding: 0 13px;
  display: flex;
  align-items: center;
  gap: 12px;

  appearance: none;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #56685e;

  font-family: inherit;
  font-size: 11px;
  font-weight: 800;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}

.account-dropdown > a i,
.dropdown-logout i {
  width: 19px;
  color: #71837a;
  font-size: 14px;
  text-align: center;
}

.account-dropdown > a:hover,
.account-dropdown > a.router-link-exact-active {
  background: #eaf7ef;
  color: #0c653d;
}

.account-dropdown > a:hover i,
.account-dropdown > a.router-link-exact-active i {
  color: #0c653d;
}

.dropdown-logout {
  margin-top: 5px;
  color: #dc2626;
}

.dropdown-logout i {
  color: #dc2626;
}

.dropdown-logout:hover {
  background: #fff1f2;
}

/* Giỏ mượn và menu mobile */

.cart-button,
.mobile-menu-button {
  width: 49px;
  height: 49px;
  position: relative;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border: 0;
  border-radius: 13px;
  background: #f2f7f4;
  color: var(
    --reader-primary,
    #0c653d
  );
  font-size: 20px;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.cart-button:hover,
.mobile-menu-button:hover,
.mobile-menu-button.active {
  background: #e1f2e8;
  transform: translateY(-1px);
}

.cart-count {
  min-width: 21px;
  height: 21px;
  padding: 0 5px;
  position: absolute;
  top: -6px;
  right: -5px;
  display: grid;
  place-items: center;
  border: 2px solid #fff;
  border-radius: 999px;
  background: var(
    --reader-accent,
    #ef476f
  );
  color: #fff;
  font-size: 8px;
  font-weight: 900;
}

.mobile-menu-button {
  display: none;
}

/* =========================================
   NAVIGATION
========================================= */

.navigation-bar {
  position: relative;
  z-index: 4;
  border-bottom: 1px solid #edf2f0;
  background: #fff;
}

.navigation-inner {
  min-height: 62px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.category-navigation {
  min-width: 188px;
  display: flex;
  align-items: center;
  gap: 9px;
  color: #24372c;
  font-size: 12px;
  font-weight: 900;
}

.category-navigation > i {
  color: var(
    --reader-primary,
    #0c653d
  );
  font-size: 17px;
}

.navigation-links {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  flex: 1;
}

.navigation-links > a,
.navigation-links > button {
  padding: 11px 14px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #506159;
  font-size: 11px;
  font-weight: 850;
  white-space: nowrap;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.navigation-links > a > i,
.navigation-links > button > i {
  display: none;
}

.navigation-links > a:hover,
.navigation-links > a.router-link-exact-active {
  background: var(
    --reader-primary-light,
    #eaf7ef
  );
  color: var(
    --reader-primary,
    #0c653d
  );
}

.member-promotion {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
  color: #72a616;
  font-size: 11px;
  font-weight: 900;
}

.mobile-only-link {
  display: none !important;
}

/* Hiệu ứng dropdown */

.account-menu-enter-active,
.account-menu-leave-active {
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
}

.account-menu-enter-from,
.account-menu-leave-to {
  opacity: 0;
  transform: translateY(-7px);
}

/* =========================================
   RESPONSIVE
========================================= */

@media (max-width: 1100px) {
  .main-header-inner {
    gap: 20px;
  }

  .brand {
    min-width: 150px;
  }

  .header-search {
  grid-template-columns:
    42px
    minmax(130px, 1fr)
    58px;
}

.category-select-wrapper {
  display: none;
}

.submit-search-button {
  min-width: 58px;
  padding: 0;
}

.submit-search-button span {
  display: none;
}

  .search-category {
    display: none;
  }

  .category-navigation {
    min-width: 150px;
  }

  .navigation-links > a {
    padding: 10px;
  }

  .member-promotion {
    display: none;
  }
}

@media (max-width: 900px) {
  .top-bar {
    display: none;
  }

  .main-header-inner {
    min-height: 76px;
  }

  .header-search {
    display: none;
  }

  .header-actions {
    margin-left: auto;
  }

  .mobile-menu-button {
    display: grid;
  }

  .navigation-inner {
    min-height: 51px;
    position: relative;
  }

  .navigation-links {
    width: 100%;
    padding: 12px;
    position: absolute;
    top: 51px;
    left: 0;
    display: none;
    align-items: stretch;
    flex-direction: column;
    border: 1px solid #e0e8e3;
    border-radius: 0 0 15px 15px;
    background: #fff;
    box-shadow:
      0 18px 40px
      rgb(15 23 42 / 12%);
  }

  .navigation-links.open {
    display: flex;
  }

  .navigation-links > a,
  .navigation-links > button {
    width: 100%;
    min-height: 43px;
    padding: 0 12px;
    justify-content: flex-start;
  }

  .navigation-links > a > i,
  .navigation-links > button > i {
    width: 20px;
    display: inline-block;
    color: var(
      --reader-primary,
      #0c653d
    );
  }

  .mobile-only-link {
    display: flex !important;
  }

  .mobile-logout {
    color: #dc2626 !important;
    cursor: pointer;
  }

  .account-dropdown {
    display: none;
  }
}

@media (max-width: 600px) {
  .reader-container {
    width: min(
      100% - 26px,
      1180px
    );
  }

  .main-header-inner {
    min-height: 70px;
    gap: 12px;
  }

  .brand {
    min-width: auto;
  }

  .brand-icon {
    font-size: 34px;
  }

  .brand-text strong {
    font-size: 21px;
  }

  .brand-text small {
    font-size: 8px;
  }

  .account-button,
  .login-button {
    width: 43px;
    height: 43px;
    padding: 0;
    display: grid;
    place-items: center;
  }

  .account-information,
  .login-button span,
  .account-arrow {
    display: none;
  }

  .account-avatar {
    width: 36px;
    height: 36px;
  }

  .cart-button,
  .mobile-menu-button {
    width: 43px;
    height: 43px;
    border-radius: 11px;
  }

  .navigation-inner {
    min-height: 48px;
  }

  .category-navigation {
    min-width: auto;
    font-size: 11px;
  }

  .navigation-links {
    top: 48px;
  }
}

@media (max-width: 390px) {
  .brand-text small {
    display: none;
  }

  .brand-text strong {
    font-size: 19px;
  }

  .header-actions {
    gap: 6px;
  }
}

.login-button {
  min-height: 50px;
  padding: 5px 11px;
  display: flex;
  align-items: center;
  gap: 9px;
  border-radius: 12px;
  color: #26382e;
  cursor: pointer;
  pointer-events: auto;
}

.login-button:hover {
  background: #edf7f1;
}

.login-icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: #eaf7ef;
  color: #0c653d;
  font-size: 19px;
}

.login-information small,
.login-information strong {
  display: block;
}

.login-information small {
  color: #89968f;
  font-size: 9px;
}

.login-information strong {
  margin-top: 2px;
  color: #25372d;
  font-size: 11px;
}

@media (max-width: 900px) {
  .main-header,
  .main-header-inner,
  .header-actions,
  .account-wrapper {
    overflow: visible;
  }

  .header-actions {
    position: relative;
    z-index: 1000;
  }

  .account-wrapper {
    position: relative;
    z-index: 1001;
    display: block;
    pointer-events: auto;
  }

  .account-button {
    width: 48px;
    min-width: 48px;
    height: 48px;
    min-height: 48px;
    padding: 4px;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 13px;
    background: #f0f7f3;
    cursor: pointer;
    pointer-events: auto;
    touch-action: manipulation;
  }

  .account-button.active,
  .account-button:hover {
    background: #e1f2e8;
  }

  .account-avatar {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: #0c653d;
    color: #fff;
    font-size: 12px;
    font-weight: 900;
  }

  .account-information,
  .account-arrow {
    display: none;
  }

  .account-dropdown {
    width: calc(100vw - 26px);
    max-width: 340px;
    padding: 14px;
    position: fixed;
    top: 76px;
    right: 13px;
    left: auto;
    z-index: 10000;
    display: block;
    overflow: visible;
    border: 1px solid #e1e9e4;
    border-radius: 17px;
    background: #fff;
    box-shadow: 0 22px 55px rgb(15 23 42 / 20%);
    pointer-events: auto;
  }

  .account-dropdown::before {
    width: 13px;
    height: 13px;
    position: absolute;
    top: -7px;
    right: 17px;
    border-top: 1px solid #e1e9e4;
    border-left: 1px solid #e1e9e4;
    background: #fff;
    content: "";
    transform: rotate(45deg);
  }

  .dropdown-reader {
    padding: 6px 5px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .dropdown-avatar {
    width: 46px;
    height: 46px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 50%;
    background: #0c653d;
    color: #fff;
    font-size: 13px;
    font-weight: 900;
  }

  .dropdown-reader-info {
    min-width: 0;
    flex: 1;
  }

  .dropdown-reader-info strong {
    overflow: hidden;
    display: block;
    color: #20352a;
    font-size: 15px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dropdown-reader-info small {
    margin-top: 4px;
    display: block;
    color: #819087;
    font-size: 12px;
  }

  .account-dropdown > a,
  .dropdown-logout {
    width: 100%;
    min-height: 48px;
    padding: 0 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    font-size: 14px;
    font-weight: 800;
    text-align: left;
    cursor: pointer;
  }

  .account-dropdown > a {
    color: #56685e;
  }

  .account-dropdown > a:hover,
  .account-dropdown > a.router-link-exact-active {
    background: #eaf7ef;
    color: #0c653d;
  }

  .dropdown-logout {
    color: #dc2626;
  }

  .dropdown-logout:hover {
    background: #fff1f2;
  }
}
</style>