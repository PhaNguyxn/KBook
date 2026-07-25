import { createRouter, createWebHistory } from "vue-router";

import { useReaderAuthStore } from "@/stores/readerAuth";

import ReaderLayout from "@/layouts/ReaderLayout.vue";

import Login from "@/views/auth/Login.vue";
import Register from "@/views/auth/Register.vue"

import Home from "@/views/Home.vue";
import BookList from "@/views/BookList.vue";
import BookDetail from "@/views/BookDetail.vue";
import RequestList from "@/views/RequestList.vue";
import BorrowCart from "@/views/BorrowCart.vue";
import Profile from "@/views/Profile.vue";

const routes = [
  {
    path: "/login",
    name: "reader-login",
    component: Login,

    meta: {
      guestOnly: true,
    },
  },

  {
    path: "/register",
    name: "reader-register",
    component: Register,

    meta: {
      guestOnly: true,
    },
  },

  {
    path: "/",
    component: ReaderLayout,

    meta: {
      requiresAuth: true,
    },

    children: [
      {
        path: "",
        name: "reader-home",
        component: Home,
      },

      {
        path: "books",
        name: "reader-books",
        component: BookList,
      },

      {
        path: "books/:id",
        name: "reader-book-detail",
        component: BookDetail,
      },

      {
        path: "requests",
        name: "reader-requests",
        component: RequestList,
        meta: {
          requiresAuth: true,
        },
      },

      {
        path: "borrows-cart",
        name: "reader-borrows-cart",
        component: BorrowCart,
        meta: {
          requiresAuth: true,
        },
      },

      {
        path: "profile",
        name: "reader-profile",
        component: Profile,
        meta: {
          requiresAuth: true,
        },
      },
    ],
  },

  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHistory(),

  routes,

  scrollBehavior() {
    return {
      top: 0,
    };
  },
});

router.beforeEach((to) => {
  const authStore = useReaderAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return {
      name: "reader-login",

      query: {
        redirect: to.fullPath,
      },
    };
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return {
      name: "reader-home",
    };
  }

  return true;
});

export default router;
