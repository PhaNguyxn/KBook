<script setup>
import {
  RouterView,
} from "vue-router";

import ReaderHeader from
  "@/components/layout/ReaderHeader.vue";

import ReaderFooter from
  "@/components/layout/ReaderFooter.vue";
</script>

<template>
  <div class="reader-layout">
    <ReaderHeader />

    <main class="reader-main">
      <RouterView />
    </main>

    <ReaderFooter />
  </div>
</template>

<style scoped>
.reader-layout {
  min-height: 100vh;
  background: #fff;
}

.reader-main {
  min-height: 65vh;
}
</style>