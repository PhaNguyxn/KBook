<script setup>
import { useNotificationStore } from "@/stores/notification";

const notificationStore =
  useNotificationStore();

function getIcon(type) {
  const icons = {
    success: "✓",
    error: "✕",
    warning: "!",
    info: "i",
  };

  return icons[type] || "i";
}
</script>

<template>
  <div
    class="toast-container"
    aria-live="polite"
  >
    <TransitionGroup name="toast">
      <article
        v-for="message in notificationStore.messages"
        :key="message.id"
        class="toast-item"
        :class="`toast-${message.type}`"
      >
        <span class="toast-icon">
          {{ getIcon(message.type) }}
        </span>

        <p>{{ message.text }}</p>

        <button
          type="button"
          aria-label="Đóng thông báo"
          @click="
            notificationStore.removeMessage(
              message.id,
            )
          "
        >
          ×
        </button>
      </article>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  z-index: 9999;
  top: 20px;
  right: 20px;
  width: min(380px, calc(100vw - 32px));
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.toast-item {
  min-height: 58px;
  padding: 13px 14px;
  display: grid;
  grid-template-columns: 30px 1fr 24px;
  align-items: center;
  gap: 10px;
  border: 1px solid;
  border-radius: 9px;
  background: white;
  box-shadow: 0 10px 30px rgb(0 0 0 / 15%);
  pointer-events: auto;
}

.toast-item p {
  margin: 0;
  line-height: 1.45;
}

.toast-item button {
  padding: 0;
  border: 0;
  background: transparent;
  font-size: 22px;
  cursor: pointer;
}

.toast-icon {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: white;
  font-weight: 700;
}

.toast-success {
  border-color: #86efac;
  color: #166534;
}

.toast-success .toast-icon {
  background: #16a34a;
}

.toast-error {
  border-color: #fca5a5;
  color: #991b1b;
}

.toast-error .toast-icon {
  background: #dc2626;
}

.toast-warning {
  border-color: #fcd34d;
  color: #92400e;
}

.toast-warning .toast-icon {
  background: #d97706;
}

.toast-info {
  border-color: #93c5fd;
  color: #1e40af;
}

.toast-info .toast-icon {
  background: #2563eb;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

@media (max-width: 600px) {
  .toast-container {
    top: 12px;
    right: 16px;
    left: 16px;
    width: auto;
  }
}
</style>