<script setup>
import {
  computed,
  ref,
} from "vue";

import {
  RouterLink,
  useRouter,
} from "vue-router";

import {
  useReaderAuthStore,
} from "@/stores/readerAuth";

import {
  useBorrowCartStore,
} from "@/stores/borrowCart";

const router = useRouter();

const authStore =
  useReaderAuthStore();

const cartStore =
  useBorrowCartStore();

const mobileMenuOpen = ref(false);
const searchKeyword = ref("");

const readerName = computed(() => {
  const reader =
    authStore.reader;

  if (!reader) {
    return "";
  }

  return (
    reader.fullName ||
    `${reader.lastName || ""} ${
      reader.firstName || ""
    }`.trim()
  );
});

function searchBooks() {
  const keyword =
    searchKeyword.value.trim();

  router.push({
    name: "reader-books",

    query: keyword
      ? {
          keyword,
        }
      : {},
  });

  mobileMenuOpen.value = false;
}

function closeMenu() {
  mobileMenuOpen.value = false;
}

function logout() {
  authStore.logout();

  router.push({
    name: "reader-login",
  });
}
</script>

<template>
  <header class="reader-header">
    <div class="top-bar">
      <div class="reader-container top-bar-inner">
        <div>
          <span>
            <i class="bi bi-telephone" />
            Hotline: 1900 9876
          </span>

          <span>
            <i class="bi bi-clock" />
            8:00 - 21:00
          </span>
        </div>

        <p>
          <i class="bi bi-gift" />

          Ưu đãi mùa hè:
          <strong>
            Giảm 20% phí mượn sách
          </strong>
        </p>

        <div>
          <span>
            Trung tâm trợ giúp
          </span>
        </div>
      </div>
    </div>

    <div class="main-header">
      <div class="reader-container main-header-inner">
        <RouterLink
          :to="{
            name: 'reader-home',
          }"
          class="brand"
          @click="closeMenu"
        >
          <span class="brand-icon">
            <i class="bi bi-book-half" />
          </span>

          <span>
            <strong>KBook</strong>
            <small>Reader</small>
          </span>
        </RouterLink>

        <form
          class="header-search"
          @submit.prevent="searchBooks"
        >
          <input
            v-model="searchKeyword"
            type="search"
            placeholder="Tìm sách, tác giả, thể loại..."
          />

          <select>
            <option>
              Tất cả danh mục
            </option>
          </select>

          <button
            type="submit"
            title="Tìm kiếm"
          >
            <i class="bi bi-search" />
          </button>
        </form>

        <div class="header-actions">
          <template
            v-if="
              authStore.isAuthenticated
            "
          >
            <RouterLink
              :to="{
                name: 'reader-profile',
              }"
              class="account-link"
            >
              <i
                class="bi bi-person-circle"
              />

              <span>
                <small>Tài khoản</small>

                <strong>
                  {{
                    readerName ||
                    "Độc giả"
                  }}
                </strong>
              </span>
            </RouterLink>

            <button
              type="button"
              class="logout-button"
              title="Đăng xuất"
              @click="logout"
            >
              <i
                class="bi bi-box-arrow-right"
              />
            </button>
          </template>

          <RouterLink
            v-else
            :to="{
              name: 'reader-login',
            }"
            class="account-link"
          >
            <i class="bi bi-person" />

            <span>
              <small>Tài khoản</small>

              <strong>
                Đăng nhập
              </strong>
            </span>
          </RouterLink>

          <RouterLink
            :to="{
              name:
                'reader-borrows-cart',
            }"
            class="header-icon-link"
            title="Giỏ mượn"
          >
            <i class="bi bi-bag" />

            <span
              v-if="
                cartStore.totalItems
              "
            >
              {{ cartStore.totalItems }}
            </span>
          </RouterLink>

          <button
            type="button"
            class="mobile-menu-button"
            @click="
              mobileMenuOpen =
                !mobileMenuOpen
            "
          >
            <i class="bi bi-list" />
          </button>
        </div>
      </div>
    </div>

    <nav class="navigation-bar">
      <div
        class="reader-container navigation-inner"
      >
        <RouterLink
          :to="{
            name: 'reader-books',
          }"
          class="category-navigation"
          @click="closeMenu"
        >
          <i class="bi bi-list" />

          Danh mục sách
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
            @click="closeMenu"
          >
            Trang chủ
          </RouterLink>

          <RouterLink
            :to="{
              name: 'reader-books',
              query: {
                sort: 'newest',
              },
            }"
            @click="closeMenu"
          >
            Sách mới
          </RouterLink>

          <RouterLink
            :to="{
              name: 'reader-books',
            }"
            @click="closeMenu"
          >
            Sách hay
          </RouterLink>

          <RouterLink
            :to="{
              name: 'reader-requests',
            }"
            @click="closeMenu"
          >
            Yêu cầu mượn
          </RouterLink>

          <RouterLink
            :to="{
              name: 'reader-borrows-cart',
            }"
            @click="closeMenu"
          >
            Sách đang mượn
          </RouterLink>

          <RouterLink
            :to="{
              name: 'reader-profile',
            }"
            @click="closeMenu"
          >
            Tài khoản
          </RouterLink>
        </div>

        <span class="member-promotion">
          <i class="bi bi-stars" />

          Ưu đãi hội viên
        </span>
      </div>
    </nav>
  </header>
</template>

<style scoped>
.reader-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
  box-shadow:
    0 2px 16px
    rgb(15 23 42 / 5%);
}

.top-bar {
  border-bottom: 1px solid #edf2f7;
  background: #fafcfb;
}

.top-bar-inner {
  min-height: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  color: #667786;
  font-size: 9px;
}

.top-bar-inner > div {
  display: flex;
  gap: 17px;
}

.top-bar-inner span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.top-bar-inner p {
  margin: 0;
}

.top-bar-inner strong {
  color: var(--reader-accent);
}

.main-header {
  border-bottom: 1px solid #edf2f7;
}

.main-header-inner {
  min-height: 75px;
  display: flex;
  align-items: center;
  gap: 35px;
}

.brand {
  min-width: 145px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--reader-primary);
}

.brand-icon {
  font-size: 36px;
}

.brand strong,
.brand small {
  display: block;
}

.brand strong {
  font-size: 24px;
  line-height: 1;
}

.brand small {
  margin-top: 2px;
  font-size: 10px;
  font-weight: 800;
}

.header-search {
  height: 44px;
  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    150px
    46px;
  flex: 1;
  border: 1px solid var(--reader-border);
  border-radius: 999px;
  background: #f8faf9;
}

.header-search input,
.header-search select {
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--reader-text);
  outline: none;
}

.header-search input {
  padding: 0 19px;
}

.header-search select {
  padding: 0 12px;
  border-left: 1px solid var(--reader-border);
  font-size: 11px;
}

.header-search button {
  border: 0;
  border-radius: 0 999px 999px 0;
  background: var(--reader-primary);
  color: #fff;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.account-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--reader-text);
}

.account-link > i {
  font-size: 22px;
}

.account-link small,
.account-link strong {
  display: block;
}

.account-link small {
  color: var(--reader-muted);
  font-size: 8px;
}

.account-link strong {
  max-width: 100px;
  overflow: hidden;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-icon-link,
.logout-button,
.mobile-menu-button {
  width: 38px;
  height: 38px;
  position: relative;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 10px;
  background: #f4f8f5;
  color: var(--reader-primary);
  font-size: 17px;
}

.header-icon-link > span {
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  position: absolute;
  top: -4px;
  right: -4px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: var(--reader-accent);
  color: #fff;
  font-size: 8px;
  font-weight: 900;
}

.logout-button {
  color: #dc2626;
}

.mobile-menu-button {
  display: none;
}

.navigation-bar {
  border-bottom: 1px solid #edf2f7;
}

.navigation-inner {
  min-height: 49px;
  display: flex;
  align-items: center;
}

.category-navigation {
  min-width: 175px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--reader-text);
  font-size: 11px;
  font-weight: 900;
}

.navigation-links {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.navigation-links a {
  padding: 9px 13px;
  border-radius: 8px;
  color: #4b5f6e;
  font-size: 10px;
  font-weight: 800;
}

.navigation-links a:hover,
.navigation-links a.router-link-exact-active {
  background:
    var(--reader-primary-light);
  color: var(--reader-primary);
}

.member-promotion {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #75a916;
  font-size: 10px;
  font-weight: 800;
}

@media (max-width: 950px) {
  .top-bar {
    display: none;
  }

  .main-header-inner {
    gap: 15px;
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
    position: relative;
  }

  .navigation-links {
    width: 100%;
    padding: 12px;
    position: absolute;
    top: 49px;
    left: 0;
    display: none;
    align-items: stretch;
    flex-direction: column;
    border: 1px solid var(--reader-border);
    border-radius: 0 0 15px 15px;
    background: #fff;
    box-shadow: var(--reader-shadow);
  }

  .navigation-links.open {
    display: flex;
  }

  .navigation-links a {
    width: 100%;
  }

  .member-promotion {
    margin-left: auto;
  }
}

@media (max-width: 520px) {
  .main-header-inner {
    min-height: 65px;
  }

  .brand {
    min-width: auto;
  }

  .brand-icon {
    font-size: 28px;
  }

  .brand strong {
    font-size: 19px;
  }

  .account-link {
    display: none;
  }

  .category-navigation {
    min-width: auto;
  }

  .member-promotion {
    display: none;
  }
}
</style>