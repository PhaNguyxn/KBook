import { createRouter, createWebHistory } from "vue-router";

import { pinia } from "@/stores/pinia";
import { useAuthStore } from "@/stores/auth";

import AdminLayout from "@/layouts/AdminLayout.vue";

import LoginView from "@/views/auth/LoginView.vue";
import DashboardView from "@/views/dashboard/DashboardView.vue";

import BookListView from "@/views/books/BookListView.vue";
import BookDetailView from "@/views/books/BookDetailView.vue";
import BookFormView from "@/views/books/BookFormView.vue";

import PublisherView from "@/views/publishers/PublisherView.vue";

import ReaderListView from "@/views/readers/ReaderListView.vue";
import ReaderFormView from "@/views/readers/ReaderFormView.vue";

import BorrowListView from "@/views/borrows/BorrowListView.vue";
import BorrowCreateView from "@/views/borrows/BorrowCreateView.vue";
import BorrowDetailView from "@/views/borrows/BorrowDetailView.vue";

import EmployeeListView from "@/views/employees/EmployeeListView.vue";
import EmployeeFormView from "@/views/employees/EmployeeFormView.vue";

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
        path: "books/:id",
        name: "book-detail",
        component: BookDetailView,
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
      },

      {
        path: "publishers",
        name: "publishers",
        component: PublisherView,
        meta: {
          adminOnly: true,
        },
      },

      {
        path: "readers",
        name: "readers",
        component: ReaderListView,
        meta: {
          adminOnly: true,
        },
      },
      {
        path: "readers/create",
        name: "reader-create",
        component: ReaderFormView,
        meta: {
          adminOnly: true,
        },
      },
      {
        path: "readers/:id/edit",
        name: "reader-edit",
        component: ReaderFormView,
        meta: {
          adminOnly: true,
        },
      },

      {
        path: "borrows",
        name: "borrows",
        component: BorrowListView,
      },
      {
        path: "borrows/create",
        name: "borrow-create",
        component: BorrowCreateView,
      },
      {
        path: "borrows/:id",
        name: "borrow-detail",
        component: BorrowDetailView,
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
        path: "employees/create",
        name: "employee-create",
        component: EmployeeFormView,
        meta: {
          adminOnly: true,
        },
      },
      {
        path: "employees/:id/edit",
        name: "employee-edit",
        component: EmployeeFormView,
        meta: {
          adminOnly: true,
        },
      },
    ],
  },

  {
    path: "/:pathMatch(.*)*",
    redirect: "/dashboard",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const authStore = useAuthStore(pinia);

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return {
      name: "login",
    };
  }

  if (to.meta.adminOnly && !authStore.isAdmin) {
    return {
      name: "dashboard",
    };
  }

  if (to.name === "login" && authStore.isAuthenticated) {
    return {
      name: "dashboard",
    };
  }

  return true;
});

export default router;
