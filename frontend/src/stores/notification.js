import { defineStore } from "pinia";

let messageId = 0;

export const useNotificationStore = defineStore("notification", {
  state: () => ({
    messages: [],
  }),

  actions: {
    addMessage({ type = "info", text, duration = 3500 }) {
      if (!text) {
        return;
      }

      const id = ++messageId;

      this.messages.push({
        id,
        type,
        text,
      });

      if (duration > 0) {
        window.setTimeout(() => {
          this.removeMessage(id);
        }, duration);
      }

      return id;
    },

    success(text, duration = 3500) {
      return this.addMessage({
        type: "success",
        text,
        duration,
      });
    },

    error(text, duration = 5000) {
      return this.addMessage({
        type: "error",
        text,
        duration,
      });
    },

    warning(text, duration = 4500) {
      return this.addMessage({
        type: "warning",
        text,
        duration,
      });
    },

    info(text, duration = 3500) {
      return this.addMessage({
        type: "info",
        text,
        duration,
      });
    },

    removeMessage(id) {
      this.messages = this.messages.filter((message) => message.id !== id);
    },

    clearMessages() {
      this.messages = [];
    },
  },
});
