<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const menuItems = computed(() => {
  const commonMenus = [
    {
      label: "Tổng quan",
      route: "/dashboard",
    },
    {
      label: "Sách",
      route: "/books",
    },
    {
      label: "Phiếu mượn",
      route: "/borrows",
    },
    {
      label: "Lập phiếu mượn",
      route: "/borrows/create",
    },
  ];

  if (!authStore.isAdmin) {
    return commonMenus;
  }

  return [
    {
      label: "Tổng quan",
      route: "/dashboard",
    },
    {
      label: "Sách",
      route: "/books",
    },
    {
      label: "Nhà xuất bản",
      route: "/publishers",
    },
    {
      label: "Độc giả",
      route: "/readers",
    },
    {
      label: "Phiếu mượn",
      route: "/borrows",
    },
    {
      label: "Lập phiếu mượn",
      route: "/borrows/create",
    },
    {
      label: "Nhân viên",
      route: "/employees",
    },
  ];
});

function logout() {
  authStore.logout();
  router.push("/login");
}
</script>

<template>
  <div class="admin-layout">
    <aside class="sidebar">
      <h2>Library Admin</h2>

      <nav>
        <RouterLink
          v-for="item in menuItems"
          :key="item.route"
          :to="item.route"
          class="menu-item"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </aside>

    <div class="main-section">
      <header class="header">
        <div>
          <strong>{{ authStore.employeeName }}</strong>
          <span>{{ authStore.employee?.role }}</span>
        </div>

        <button @click="logout">
          Đăng xuất
        </button>
      </header>

      <main class="page-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
  display: flex;
  background: #f3f4f6;
}

.sidebar {
  width: 240px;
  padding: 24px 16px;
  background: #111827;
  color: white;
}

.sidebar h2 {
  margin-bottom: 28px;
}

.sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-item {
  padding: 11px 12px;
  border-radius: 6px;
  color: #d1d5db;
  text-decoration: none;
}

.menu-item:hover,
.menu-item.router-link-active {
  background: #2563eb;
  color: white;
}

.main-section {
  flex: 1;
  min-width: 0;
}

.header {
  height: 68px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.header div {
  display: flex;
  flex-direction: column;
}

.page-content {
  padding: 24px;
}
</style>