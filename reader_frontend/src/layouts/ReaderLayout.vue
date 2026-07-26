<script setup>
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
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

.reader-main {
  min-height: 500px;
  flex: 1;
}
</style>