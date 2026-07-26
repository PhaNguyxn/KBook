<script setup>
import {
  computed,
} from "vue";

import {
  useReaderAuthStore,
} from "@/stores/readerAuth";

const authStore =
  useReaderAuthStore();

const readerName = computed(() => {
  const reader =
    authStore.reader;

  return (
    reader?.fullName ||
    `${reader?.lastName || ""} ${
      reader?.firstName || ""
    }`.trim() ||
    "Độc giả"
  );
});

const readerInitials = computed(() => {
  const words =
    readerName.value
      .split(/\s+/)
      .filter(Boolean);

  return words
    .slice(-2)
    .map((word) =>
      word.charAt(0).toUpperCase(),
    )
    .join("");
});

const readerCode = computed(() => {
  return (
    authStore.reader?.readerCode ||
    "Tài khoản độc giả"
  );
});
</script>

<template>
  <aside class="account-sidebar">
    <div class="reader-summary">
      <span class="reader-avatar">
        {{ readerInitials || "DG" }}
      </span>

      <h2>{{ readerName }}</h2>

      <p>{{ readerCode }}</p>
    </div>

    <nav class="account-navigation">
      <RouterLink
        :to="{
          name: 'reader-profile',
        }"
      >
        <i class="bi bi-person" />

        <span>Hồ sơ cá nhân</span>

        <i class="bi bi-chevron-right" />
      </RouterLink>

      <RouterLink
        :to="{
          name: 'reader-requests',
        }"
      >
        <i class="bi bi-send-check" />

        <span>Yêu cầu mượn</span>

        <i class="bi bi-chevron-right" />
      </RouterLink>

      <RouterLink
        :to="{
          name: 'reader-history',
        }"
      >
        <i class="bi bi-clock-history" />

        <span>Lịch sử mượn</span>

        <i class="bi bi-chevron-right" />
      </RouterLink>

      <RouterLink
        :to="{
          name: 'reader-borrow-cart',
        }"
      >
        <i class="bi bi-bag" />

        <span>Giỏ mượn</span>

        <i class="bi bi-chevron-right" />
      </RouterLink>
    </nav>

    <div class="account-support">
      <i class="bi bi-headset" />

      <div>
        <strong>Cần hỗ trợ?</strong>

        <span>
          Liên hệ thủ thư KBook
        </span>
      </div>

      <RouterLink
        :to="{
          name: 'reader-contact',
        }"
      >
        Liên hệ
      </RouterLink>
    </div>
  </aside>
</template>

<style scoped>
.account-sidebar {
  overflow: hidden;
  border: 1px solid
    var(--reader-border, #e1e9e4);
  border-radius: 18px;
  background: #fff;
  box-shadow:
    0 12px 35px
    rgb(15 23 42 / 6%);
}

.reader-summary {
  padding: 27px 18px 23px;
  border-bottom: 1px solid
    var(--reader-border, #e1e9e4);
  background:
    linear-gradient(
      145deg,
      #edf8f1,
      #f8fbf9
    );
  text-align: center;
}

.reader-avatar {
  width: 75px;
  height: 75px;
  margin: auto;
  display: grid;
  place-items: center;
  border: 5px solid #fff;
  border-radius: 50%;
  background:
    var(--reader-primary, #0c653d);
  color: #fff;
  font-size: 22px;
  font-weight: 900;
  box-shadow:
    0 10px 25px
    rgb(12 101 61 / 20%);
}

.reader-summary h2 {
  margin: 13px 0 4px;
  color:
    var(--reader-text, #20352a);
  font-size: 16px;
}

.reader-summary p {
  margin: 0;
  color:
    var(--reader-muted, #7c8b83);
  font-size: 10px;
}

.account-navigation {
  padding: 12px;
}

.account-navigation a {
  min-height: 47px;
  padding: 0 12px;
  display: grid;
  grid-template-columns:
    24px 1fr 14px;
  align-items: center;
  gap: 9px;
  border-radius: 10px;
  color: #5f7066;
  font-size: 10px;
  font-weight: 800;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.account-navigation a:hover,
.account-navigation a.router-link-exact-active {
  background:
    var(
      --reader-primary-light,
      #eaf7ef
    );
  color:
    var(--reader-primary, #0c653d);
}

.account-navigation a > i:last-child {
  font-size: 9px;
}

.account-support {
  margin: 0 12px 12px;
  padding: 14px;
  border-radius: 12px;
  background: #fff8dd;
  color: #876615;
}

.account-support > i {
  font-size: 23px;
}

.account-support strong,
.account-support span {
  display: block;
}

.account-support strong {
  margin-top: 7px;
  font-size: 10px;
}

.account-support span {
  margin-top: 3px;
  font-size: 8px;
}

.account-support a {
  min-height: 31px;
  margin-top: 10px;
  display: grid;
  place-items: center;
  border-radius: 7px;
  background: #fff;
  color: #876615;
  font-size: 8px;
  font-weight: 900;
}
</style>