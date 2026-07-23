import { createRouter, createWebHistory } from "vue-router";

import AdminLayout from "@/layouts/AdminLayout.vue";

import DashboardView from "@/views/dashboard/DashboardView.vue";
import BookListView from "@/views/books/BookListView.vue";
import BookFormView from "@/views/books/BookFormView.vue";
import BookDetailView from "@/views/books/BookDetailView.vue";
import BorrowRequestView from "@/views/borrowRequests/BorrowRequestView.vue";
import ReaderListView from "@/views/readers/ReaderListView.vue";
import BorrowListView from "@/views/borrows/BorrowListView.vue";
import EmployeeListView from "@/views/employees/EmployeeListView.vue";

import LoginView from "@/views/auth/LoginView.vue";
import ForbiddenView from "@/views/errors/ForbiddenView.vue";
import NotFoundView from "@/views/errors/NotFoundView.vue";

import { useAuthStore } from "@/stores/auth";

const routes = [
  {
    path: "/login",
    name: "login",
    component: LoginView,
  },
  {
    path: "/",
    component: AdminLayout,
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: "",
        redirect: "/dashboard",
      },
      {
        path: "dashboard",
        name: "dashboard",
        component: DashboardView,
      },
      {
        path: "books",
        name: "books",
        component: BookListView,
      },
      {
        path: "borrow-requests",
        name: "borrow-requests",
        component: BorrowRequestView,
      },
      {
        path: "publishers",
        redirect: "/borrow-requests",
      },
      {
        path: "readers",
        name: "readers",
        component: ReaderListView,
      },
      {
        path: "borrows",
        name: "borrows",
        component: BorrowListView,
      },
      {
        path: "employees",
        name: "employees",
        component: EmployeeListView,
        meta: {
          adminOnly: true,
        },
      },
      {
        path: "/books",
        name: "books",
        component: BookListView,
      },
      {
        path: "/books/create",
        name: "book-create",
        component: BookFormView,
      },
      {
        path: "/books/:id",
        name: "book-detail",
        component: BookDetailView,
      },
      {
        path: "/books/:id/edit",
        name: "book-edit",
        component: BookFormView,
      },
    ],
  },
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
  history: createWebHistory(),
  routes,
});

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
