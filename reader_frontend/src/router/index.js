import { createRouter, createWebHistory } from "vue-router";

import ReaderLayout from "@/layouts/ReaderLayout.vue";
import { useReaderAuthStore } from "@/stores/readerAuth";

const routes = [


  {
    path: "/login",
    name: "reader-login",

    component: () => import("@/views/auth/Login.vue"),

    meta: {
      guestOnly: true,
    },
  },

  {
    path: "/register",
    name: "reader-register",

    component: () => import("@/views/auth/Register.vue"),

    meta: {
      guestOnly: true,
    },
  },


  {
    path: "/",
    component: ReaderLayout,

    children: [

      {
        path: "",
        name: "reader-home",

        component: () => import("@/views/Home.vue"),
      },

      {
        path: "books",
        name: "reader-books",

        component: () => import("@/views/BookList.vue"),
      },

      {
        path: "books/:id",
        name: "reader-book-detail",

        component: () => import("@/views/BookDetail.vue"),

        props: true,
      },

      {
        path: "contact",
        name: "reader-contact",

        component: () => import("@/views/ReaderContactView.vue"),
      },

      {
        path: "borrow-cart",
        name: "reader-borrow-cart",

        component: () => import("@/views/BorrowCart.vue"),
      },


      {
        path: "profile",
        name: "reader-profile",

        component: () => import("@/views/Profile.vue"),

        meta: {
          requiresAuth: true,
        },
      },

      {
        path: "requests",
        name: "reader-requests",

        component: () => import("@/views/RequestList.vue"),

        meta: {
          requiresAuth: true,
        },
      },

      {
        path: "history",
        name: "reader-history",

        component: () => import("@/views/ReaderHistoryView.vue"),

        meta: {
          requiresAuth: true,
        },
      },
    ],
  },

  {
    path: "/:pathMatch(.*)*",

    redirect: {
      name: "reader-home",
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,

  scrollBehavior() {
    return {
      top: 0,
      behavior: "smooth",
    };
  },
});


router.beforeEach((to) => {
  const authStore = useReaderAuthStore();

  const requiresAuth = to.matched.some(
    (routeRecord) => routeRecord.meta.requiresAuth,
  );

  const guestOnly = to.matched.some(
    (routeRecord) => routeRecord.meta.guestOnly,
  );

  if (requiresAuth && !authStore.isAuthenticated) {
    return {
      name: "reader-login",

      query: {
        redirect: to.fullPath,
      },
    };
  }

  if (guestOnly && authStore.isAuthenticated) {
    return {
      name: "reader-home",
    };
  }

  return true;
});

export default router;
