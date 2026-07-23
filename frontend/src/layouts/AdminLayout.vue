<script setup>
import {
  computed,
  ref,
  watch,
} from "vue";

import {
  RouterLink,
  RouterView,
  useRoute,
  useRouter,
} from "vue-router";

import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const sidebarOpen = ref(false);

const menus = [
  {
    label: "Tổng quan",
    to: "/dashboard",
    icon: "bi-bar-chart-fill",
    roles: ["admin", "staff"],
  },
  {
    label: "Quản lý sách",
    to: "/books",
    icon: "bi-book-fill",
    roles: ["admin", "staff"],
  },
  {
    label: "Quản lý độc giả",
    to: "/readers",
    icon: "bi-people-fill",
    roles: ["admin", "staff"],
  },
  {
    label: "Quản lý yêu cầu",
    to: "/borrow-requests",
    icon: "bi-inbox-fill",
    roles: ["admin", "staff"],
  },
  {
    label: "Quản lý mượn - trả",
    to: "/borrows",
    icon: "bi-briefcase-fill",
    roles: ["admin", "staff"],
  },
  {
    label: "Quản lý nhân viên",
    to: "/employees",
    icon: "bi-person-badge-fill",
    roles: ["admin"],
  },
];

const currentRole = computed(() => {
  return authStore.employee?.role || "staff";
});

const visibleMenus = computed(() => {
  return menus.filter((menu) =>
    menu.roles.includes(currentRole.value),
  );
});

const employeeName = computed(() => {
  return (
    authStore.employee?.fullName ||
    "Người dùng"
  );
});

const roleName = computed(() => {
  return currentRole.value === "admin"
    ? "Quản trị viên"
    : "Nhân viên";
});

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

function closeSidebar() {
  sidebarOpen.value = false;
}

function handleLogout() {
  const confirmed = window.confirm(
    "Bạn có chắc muốn đăng xuất?",
  );

  if (!confirmed) {
    return;
  }

  authStore.logout();
  router.replace("/login");
}

watch(
  () => route.fullPath,
  () => {
    closeSidebar();
  },
);
</script>

<template>
  <div class="admin-layout">
    <div
      v-if="sidebarOpen"
      class="sidebar-overlay"
      @click="closeSidebar"
    />

    <header class="top-header">
      <div class="header-left">
        <button
          type="button"
          class="mobile-menu-button"
          aria-label="Mở menu"
          @click="toggleSidebar"
        >
          <i class="bi bi-list" />
        </button>

        <RouterLink
          to="/dashboard"
          class="brand"
        >
          <span class="brand-icon">
            <i class="bi bi-book-half" />
          </span>

          <strong>
            <span>K</span>Book
          </strong>
        </RouterLink>
      </div>

      <div class="account-area">
        <div class="account-avatar">
          <i class="bi bi-person-fill" />
        </div>

        <div class="account-text">
          <strong>{{ employeeName }}</strong>
          <small>{{ roleName }}</small>
        </div>

        <button
          type="button"
          class="account-dropdown"
          title="Đăng xuất"
          @click="handleLogout"
        >
          <i class="bi bi-chevron-down" />
        </button>
      </div>
    </header>

    <aside
      class="sidebar"
      :class="{
        'sidebar-open': sidebarOpen,
      }"
    >
      <div class="sidebar-heading">
        Quản lý mượn sách
      </div>

      <nav class="sidebar-menu">
        <RouterLink
          v-for="menu in visibleMenus"
          :key="menu.to"
          :to="menu.to"
          class="menu-item"
        >
          <i
            class="bi menu-icon"
            :class="menu.icon"
          />

          <span>{{ menu.label }}</span>
        </RouterLink>
      </nav>
    </aside>

    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background: #eef5ff;
}

.top-header {
  position: fixed;
  z-index: 1000;
  top: 0;
  right: 0;
  left: 0;
  height: 72px;
  padding: 0 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #dff0ff;
  border-bottom: 1px solid #cce5fb;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #1f5ba7;
}

.brand-icon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: linear-gradient(
    135deg,
    #1d72d8,
    #38a3f1
  );
  color: white;
  font-size: 20px;
}

.brand strong {
  font-size: 17px;
}

.brand strong span {
  color: #1677d2;
}

.account-area {
  display: flex;
  align-items: center;
  gap: 9px;
}

.account-avatar {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 2px solid #f4b400;
  border-radius: 50%;
  background: white;
  color: #1768b3;
}

.account-text strong,
.account-text small {
  display: block;
}

.account-text strong {
  color: #2661a4;
  font-size: 13px;
}

.account-text small {
  margin-top: 2px;
  color: #7c8da5;
  font-size: 11px;
}

.account-dropdown {
  padding: 5px;
  border: 0;
  background: transparent;
  color: #2674bd;
}

.mobile-menu-button {
  display: none;
  width: 39px;
  height: 39px;
  border: 0;
  border-radius: 7px;
  background: white;
  color: #2674bd;
  font-size: 23px;
}

.sidebar {
  position: fixed;
  z-index: 900;
  top: 72px;
  bottom: 0;
  left: 0;
  width: 250px;
  background: white;
  border-right: 1px solid #dce5ef;
  transition: transform 0.25s ease;
}

.sidebar-heading {
  padding: 12px 18px;
  background: #1679c8;
  color: white;
  font-size: 16px;
  font-weight: 700;
}

.sidebar-menu {
  padding: 5px 8px;
}

.menu-item {
  margin-bottom: 3px;
  padding: 12px 13px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 4px;
  color: #3d4652;
  font-size: 14px;
  transition: 0.2s ease;
}

.menu-item:hover {
  background: #edf6ff;
  color: #1971c2;
}

.menu-item.router-link-active {
  background: #dceeff;
  color: #1677d2;
  font-weight: 600;
}

.menu-icon {
  width: 20px;
  text-align: center;
}

.main-content {
  min-height: 100vh;
  margin-left: 250px;
  padding: 96px 24px 30px;
}

.sidebar-overlay {
  display: none;
}

@media (max-width: 900px) {
  .top-header {
    height: 64px;
    padding: 0 15px;
  }

  .mobile-menu-button {
    display: grid;
    place-items: center;
  }

  .sidebar {
    top: 64px;
    transform: translateX(-100%);
  }

  .sidebar.sidebar-open {
    transform: translateX(0);
  }

  .sidebar-overlay {
    position: fixed;
    z-index: 850;
    inset: 64px 0 0;
    display: block;
    background: rgb(15 23 42 / 45%);
  }

  .main-content {
    margin-left: 0;
    padding: 84px 15px 20px;
  }
}

@media (max-width: 600px) {
  .account-text {
    display: none;
  }

  .brand strong {
    font-size: 15px;
  }
}
</style>