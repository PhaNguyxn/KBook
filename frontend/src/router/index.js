import { createRouter, createWebHistory } from "vue-router";

import AdminLayout from "@/layouts/AdminLayout.vue";

/* =========================
   DASHBOARD
========================= */

import DashboardView from "@/views/dashboard/DashboardView.vue";

/* =========================
   BOOKS
========================= */

import BookListView from "@/views/books/BookListView.vue";
import BookFormView from "@/views/books/BookFormView.vue";
import BookDetailView from "@/views/books/BookDetailView.vue";

/* =========================
   READERS
========================= */

import ReaderListView from "@/views/readers/ReaderListView.vue";
import ReaderFormView from "@/views/readers/ReaderFormView.vue";
import ReaderDetailView from "@/views/readers/ReaderDetailView.vue";

/* =========================
   BORROWS
========================= */

import BorrowListView from "@/views/borrows/BorrowListView.vue";
import BorrowFormView from "@/views/borrows/BorrowFormView.vue";
import BorrowDetailView from "@/views/borrows/BorrowDetailView.vue";
import BorrowRequestView from "@/views/borrowRequests/BorrowRequestView.vue";

/* =========================
   EMPLOYEES
========================= */

import EmployeeListView from "@/views/employees/EmployeeListView.vue";

/* =========================
   AUTH AND ERRORS
========================= */

import LoginView from "@/views/auth/LoginView.vue";
import ForbiddenView from "@/views/errors/ForbiddenView.vue";
import NotFoundView from "@/views/errors/NotFoundView.vue";

import { useAuthStore } from "@/stores/auth";

const routes = [
  /* =========================
     ĐĂNG NHẬP
  ========================= */

  {
    path: "/login",
    name: "login",
    component: LoginView,
  },

  /* =========================
     KHU VỰC QUẢN TRỊ
  ========================= */

  {
    path: "/",
    component: AdminLayout,

    meta: {
      requiresAuth: true,
    },

    children: [
      /* Trang mặc định */
      {
        path: "",
        redirect: {
          name: "dashboard",
        },
      },

      /* =====================
         DASHBOARD
      ===================== */

      {
        path: "dashboard",
        name: "dashboard",
        component: DashboardView,
      },

      /* =====================
         QUẢN LÝ SÁCH
      ===================== */

      {
        path: "books",
        name: "books",
        component: BookListView,
      },

      {
        path: "books/create",
        name: "book-create",
        component: BookFormView,

        meta: {
          adminOnly: true,
        },
      },

      {
        path: "books/:id/edit",
        name: "book-edit",
        component: BookFormView,

        meta: {
          adminOnly: true,
        },

        props: true,
      },

      {
        path: "books/:id",
        name: "book-detail",
        component: BookDetailView,
        props: true,
      },

      /* =====================
         QUẢN LÝ ĐỘC GIẢ
      ===================== */

      {
        path: "readers",
        name: "readers",
        component: ReaderListView,
      },

      {
        path: "readers/create",
        name: "reader-create",
        component: ReaderFormView,
      },

      {
        path: "readers/:id/edit",
        name: "reader-edit",
        component: ReaderFormView,
        props: true,
      },

      {
        path: "readers/:id",
        name: "reader-detail",
        component: ReaderDetailView,
        props: true,
      },

      /* =====================
         MƯỢN VÀ TRẢ SÁCH
      ===================== */

      {
        path: "borrows",
        name: "borrows",
        component: BorrowListView,
      },

      {
        path: "borrow-requests",
        name: "borrow-requests",
        component: BorrowRequestView,
      },

      {
        path: "borrows",
        name: "borrow-list",
        component: BorrowListView,
        meta: {
          title: "Danh sách phiếu mượn",
        },
      },
      {
        path: "borrows/create",
        name: "borrow-create",
        component: BorrowFormView,
        meta: {
          title: "Lập phiếu mượn",
        },
      },
      {
        path: "borrows/:id",
        name: "borrow-detail",
        component: BorrowDetailView,
        props: true,
        meta: {
          title: "Chi tiết phiếu mượn",
        },
      },

      /* =====================
         QUẢN LÝ NHÂN VIÊN
      ===================== */

      {
        path: "employees",
        name: "employees",
        component: EmployeeListView,

        meta: {
          adminOnly: true,
        },
      },

      /* =====================
         CHUYỂN HƯỚNG CŨ
      ===================== */

      {
        path: "publishers",
        redirect: {
          name: "borrow-requests",
        },
      },
    ],
  },

  /* =========================
     TRANG LỖI
  ========================= */

  {
    path: "/403",
    name: "forbidden",
    component: ForbiddenView,
  },

  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: NotFoundView,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes,

  scrollBehavior() {
    return {
      top: 0,
      left: 0,
    };
  },
});

/* =========================
   ROUTE GUARD
========================= */

router.beforeEach((to) => {
  const authStore = useAuthStore();

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  const adminOnly = to.matched.some((record) => record.meta.adminOnly);

  if (requiresAuth && !authStore.isAuthenticated) {
    return {
      name: "login",

      query: {
        redirect: to.fullPath,
      },
    };
  }

  if (to.name === "login" && authStore.isAuthenticated) {
    return {
      name: "dashboard",
    };
  }

  if (adminOnly && !authStore.isAdmin) {
    return {
      name: "forbidden",
    };
  }

  return true;
});

export default router;
