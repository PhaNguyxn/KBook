<script setup>
import {
  computed,
  onMounted,
  ref,
} from "vue";

import {
  useRoute,
  useRouter,
} from "vue-router";

import { borrowRequestApi } from "@/api/borrowRequestApi";
import { getErrorMessage } from "@/utils/error";

const route = useRoute();
const router = useRouter();

/* =========================================
   CẤU HÌNH
========================================= */

const serverUrl = String(
  import.meta.env.VITE_SERVER_URL || "",
).replace(/\/+$/, "");

/* =========================================
   STATE
========================================= */

const borrowRequest = ref(null);

const loading = ref(false);
const processing = ref(false);

const errorMessage = ref("");
const successMessage = ref("");

const imageErrors = ref({});

/* =========================================
   COMPUTED
========================================= */

const requestItems = computed(() => {
  const request = borrowRequest.value;

  if (!request) {
    return [];
  }

  if (Array.isArray(request.items)) {
    return request.items;
  }

  if (Array.isArray(request.details)) {
    return request.details;
  }

  if (Array.isArray(request.books)) {
    return request.books;
  }

  return [];
});

const totalBooks = computed(() => {
  return requestItems.value.reduce(
    (total, item) => {
      return (
        total +
        Number(item?.quantity || 0)
      );
    },
    0,
  );
});

const reader = computed(() => {
  return (
    borrowRequest.value?.reader ||
    borrowRequest.value?.readerId ||
    borrowRequest.value
      ?.readerSnapshot ||
    null
  );
});

const readerName = computed(() => {
  const currentReader = reader.value;

  const fullName = String(
    currentReader?.fullName ||
      currentReader?.name ||
      "",
  ).trim();

  if (fullName) {
    return fullName;
  }

  const lastName = String(
    currentReader?.lastName || "",
  ).trim();

  const firstName = String(
    currentReader?.firstName || "",
  ).trim();

  const combinedName =
    `${lastName} ${firstName}`.trim();

  return (
    combinedName ||
    borrowRequest.value?.readerName ||
    "Không xác định"
  );
});

const readerInitials = computed(() => {
  const name = readerName.value;

  if (
    !name ||
    name === "Không xác định"
  ) {
    return "ĐG";
  }

  const words = name
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${words[0].charAt(0)}${words[
    words.length - 1
  ].charAt(0)}`.toUpperCase();
});

const requestStatus = computed(() => {
  return normalizeStatus(
    borrowRequest.value?.status,
  );
});

const isPending = computed(() => {
  return requestStatus.value ===
    "pending";
});

const requestCode = computed(() => {
  return (
    borrowRequest.value?.requestCode ||
    borrowRequest.value?.code ||
    getShortId(
      borrowRequest.value?._id,
    )
  );
});

/* =========================================
   HÀM HỖ TRỢ
========================================= */

function goBack() {
  router.push({
    name: "borrow-request-list",
  });
}

function clearMessages() {
  errorMessage.value = "";
  successMessage.value = "";
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

function getShortId(id) {
  const value = String(id || "")
    .slice(-6)
    .toUpperCase();

  return value
    ? `YC-${value}`
    : "Chưa có mã";
}

function formatDate(value) {
  if (!value) {
    return "Chưa cập nhật";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Chưa cập nhật";
  }

  return new Intl.DateTimeFormat(
    "vi-VN",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  ).format(date);
}

function formatDateTime(value) {
  if (!value) {
    return "Chưa cập nhật";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Chưa cập nhật";
  }

  return new Intl.DateTimeFormat(
    "vi-VN",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function normalizeStatus(status) {
  const value = String(
    status || "",
  )
    .trim()
    .toLowerCase();

  const aliases = {
    waiting: "pending",
    pending: "pending",

    accept: "approved",
    accepted: "approved",
    approve: "approved",
    approved: "approved",

    reject: "rejected",
    rejected: "rejected",

    cancel: "cancelled",
    canceled: "cancelled",
    cancelled: "cancelled",
  };

  return (
    aliases[value] ||
    value ||
    "unknown"
  );
}

function getStatusLabel(status) {
  const labels = {
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Đã từ chối",
    cancelled: "Đã hủy",
    unknown: "Không xác định",
  };

  return (
    labels[normalizeStatus(status)] ||
    "Không xác định"
  );
}

function getStatusIcon(status) {
  const icons = {
    pending:
      "bi-hourglass-split",

    approved:
      "bi-check-circle-fill",

    rejected:
      "bi-x-circle-fill",

    cancelled:
      "bi-slash-circle-fill",

    unknown:
      "bi-question-circle-fill",
  };

  return (
    icons[normalizeStatus(status)] ||
    icons.unknown
  );
}

function getStatusClass(status) {
  return `status-${normalizeStatus(
    status,
  )}`;
}

function getReaderCode() {
  return (
    reader.value?.readerCode ||
    reader.value?.code ||
    borrowRequest.value
      ?.readerCode ||
    "Chưa có mã"
  );
}

function getReaderPhone() {
  return (
    reader.value?.phone ||
    borrowRequest.value
      ?.readerPhone ||
    "Chưa cập nhật"
  );
}

function getReaderAddress() {
  return (
    reader.value?.address ||
    borrowRequest.value
      ?.readerAddress ||
    "Chưa cập nhật"
  );
}

function getBook(item) {
  return (
    item?.book ||
    item?.bookId ||
    item?.bookSnapshot ||
    {}
  );
}

function getBookTitle(item) {
  const book = getBook(item);

  return (
    book.title ||
    book.name ||
    item?.bookTitle ||
    "Không xác định tên sách"
  );
}

function getBookCode(item) {
  const book = getBook(item);

  return (
    book.bookCode ||
    book.code ||
    item?.bookCode ||
    "Chưa có mã"
  );
}

function getBookAuthor(item) {
  const book = getBook(item);

  return (
    book.author ||
    item?.author ||
    "Chưa cập nhật tác giả"
  );
}

function getBookAvailable(item) {
  const book = getBook(item);

  const value =
    book.available ??
    book.availableQuantity ??
    book.quantity;

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function getBookQuantity(item) {
  const quantity = Number(
    item?.quantity || 0,
  );

  return Number.isFinite(quantity)
    ? quantity
    : 0;
}

function getBookImage(item) {
  const book = getBook(item);

  const rawUrl =
    book.image ||
    book.img ||
    book.img1 ||
    book.coverImage ||
    item?.image ||
    "";

  if (!rawUrl) {
    return "";
  }

  if (
    rawUrl.startsWith("http://") ||
    rawUrl.startsWith("https://") ||
    rawUrl.startsWith("data:")
  ) {
    return rawUrl;
  }

  if (!serverUrl) {
    return rawUrl;
  }

  return `${serverUrl}/${
    rawUrl.replace(/^\/+/, "")
  }`;
}

function getItemKey(item, index) {
  return (
    getBook(item)?._id ||
    item?._id ||
    `${getBookCode(item)}-${index}`
  );
}

function markImageError(item, index) {
  const key =
    getItemKey(item, index);

  imageErrors.value = {
    ...imageErrors.value,

    [key]: true,
  };
}

function hasImageError(item, index) {
  const key =
    getItemKey(item, index);

  return Boolean(
    imageErrors.value[key],
  );
}

/* =========================================
   TẢI CHI TIẾT YÊU CẦU
========================================= */

async function loadBorrowRequest() {
  const id = route.params.id;

  if (!id) {
    errorMessage.value =
      "Không tìm thấy mã yêu cầu";

    return;
  }

  loading.value = true;
  errorMessage.value = "";

  try {
    const response =
      await borrowRequestApi.getById(
        id,
      );

    const payload =
      response?.data?.data ??
      response?.data ??
      {};

    const result =
      payload.request ||
      payload.borrowRequest ||
      payload;

    if (!result?._id) {
      throw new Error(
        "Không tìm thấy yêu cầu mượn sách",
      );
    }

    borrowRequest.value = result;
  } catch (error) {
    console.error(
      "Load borrow request detail error:",
      error,
    );

    borrowRequest.value = null;

    errorMessage.value =
      getErrorMessage(
        error,
        "Không thể tải chi tiết yêu cầu mượn sách",
      );
  } finally {
    loading.value = false;
  }
}

/* =========================================
   DUYỆT YÊU CẦU
========================================= */

async function approveRequest() {
  if (
    !borrowRequest.value?._id ||
    !isPending.value
  ) {
    return;
  }

  const confirmed =
    window.confirm(
      `Bạn có chắc muốn duyệt yêu cầu "${requestCode.value}" của độc giả "${readerName.value}"?\n\nHệ thống sẽ tạo phiếu mượn từ yêu cầu này.`,
    );

  if (!confirmed) {
    return;
  }

  processing.value = true;
  clearMessages();

  try {
    await borrowRequestApi.approve(
      borrowRequest.value._id,
    );

    successMessage.value =
      "Duyệt yêu cầu mượn sách thành công";

    await loadBorrowRequest();

    scrollToTop();
  } catch (error) {
    console.error(
      "Approve borrow request error:",
      error,
    );

    errorMessage.value =
      getErrorMessage(
        error,
        "Không thể duyệt yêu cầu mượn sách",
      );

    scrollToTop();
  } finally {
    processing.value = false;
  }
}

/* =========================================
   TỪ CHỐI YÊU CẦU
========================================= */

async function rejectRequest() {
  if (
    !borrowRequest.value?._id ||
    !isPending.value
  ) {
    return;
  }

  const reason = window.prompt(
    `Nhập lý do từ chối yêu cầu "${requestCode.value}":`,
  );

  if (reason === null) {
    return;
  }

  const normalizedReason =
    reason.trim();

  if (!normalizedReason) {
    errorMessage.value =
      "Vui lòng nhập lý do từ chối";

    scrollToTop();

    return;
  }

  const confirmed =
    window.confirm(
      `Xác nhận từ chối yêu cầu "${requestCode.value}"?`,
    );

  if (!confirmed) {
    return;
  }

  processing.value = true;
  clearMessages();

  try {
    await borrowRequestApi.reject(
      borrowRequest.value._id,
      normalizedReason,
    );

    successMessage.value =
      "Đã từ chối yêu cầu mượn sách";

    await loadBorrowRequest();

    scrollToTop();
  } catch (error) {
    console.error(
      "Reject borrow request error:",
      error,
    );

    errorMessage.value =
      getErrorMessage(
        error,
        "Không thể từ chối yêu cầu mượn sách",
      );

    scrollToTop();
  } finally {
    processing.value = false;
  }
}

/* =========================================
   KHỞI TẠO
========================================= */

onMounted(() => {
  loadBorrowRequest();
});
</script>

<template>
  <section class="request-detail-page">
    <!-- Điều hướng -->
    <div class="navigation-bar">
      <button
        type="button"
        class="back-button"
        @click="goBack"
      >
        <i class="bi bi-arrow-left" />

        Quay lại danh sách yêu cầu
      </button>
    </div>

    <!-- Thông báo lỗi -->
    <div
      v-if="errorMessage"
      class="custom-alert alert-error"
      role="alert"
    >
      <i
        class="bi bi-exclamation-circle-fill"
      />

      <span>
        {{ errorMessage }}
      </span>

      <button
        type="button"
        title="Đóng"
        @click="errorMessage = ''"
      >
        <i class="bi bi-x-lg" />
      </button>
    </div>

    <!-- Thông báo thành công -->
    <div
      v-if="successMessage"
      class="custom-alert alert-success"
      role="alert"
    >
      <i
        class="bi bi-check-circle-fill"
      />

      <span>
        {{ successMessage }}
      </span>

      <button
        type="button"
        title="Đóng"
        @click="successMessage = ''"
      >
        <i class="bi bi-x-lg" />
      </button>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="loading-card"
    >
      <div
        class="spinner-border text-primary"
        role="status"
      />

      <strong>
        Đang tải chi tiết yêu cầu
      </strong>

      <span>
        Vui lòng chờ trong giây lát...
      </span>
    </div>

    <!-- Không tìm thấy -->
    <div
      v-else-if="!borrowRequest"
      class="empty-card"
    >
      <div class="empty-icon">
        <i class="bi bi-file-earmark-x" />
      </div>

      <h2>
        Không tìm thấy yêu cầu
      </h2>

      <p>
        Yêu cầu mượn sách không tồn tại hoặc
        đã bị xóa khỏi hệ thống.
      </p>

      <button
        type="button"
        class="return-button"
        @click="goBack"
      >
        <i class="bi bi-arrow-left" />

        Quay lại danh sách
      </button>
    </div>

    <!-- Nội dung -->
    <template v-else>
      <!-- Header -->
      <section class="request-header-card">
        <div class="header-main">
          <div
            class="header-status-icon"
            :class="
              getStatusClass(
                borrowRequest.status,
              )
            "
          >
            <i
              class="bi"
              :class="
                getStatusIcon(
                  borrowRequest.status,
                )
              "
            />
          </div>

          <div class="header-content">
            <span class="header-label">
              Chi tiết yêu cầu mượn sách
            </span>

            <div class="title-row">
              <h1>
                {{ requestCode }}
              </h1>

              <span
                class="status-badge"
                :class="
                  getStatusClass(
                    borrowRequest.status,
                  )
                "
              >
                <i
                  class="bi"
                  :class="
                    getStatusIcon(
                      borrowRequest.status,
                    )
                  "
                />

                {{
                  getStatusLabel(
                    borrowRequest.status,
                  )
                }}
              </span>
            </div>

            <p>
              Yêu cầu được gửi vào
              {{
                formatDateTime(
                  borrowRequest.requestDate ||
                    borrowRequest.createdAt,
                )
              }}.
            </p>
          </div>
        </div>

        <div
          v-if="isPending"
          class="header-actions"
        >
          <button
            type="button"
            class="reject-button"
            :disabled="processing"
            @click="rejectRequest"
          >
            <span
              v-if="processing"
              class="spinner-border spinner-border-sm"
            />

            <i
              v-else
              class="bi bi-x-lg"
            />

            Từ chối
          </button>

          <button
            type="button"
            class="approve-button"
            :disabled="processing"
            @click="approveRequest"
          >
            <span
              v-if="processing"
              class="spinner-border spinner-border-sm"
            />

            <i
              v-else
              class="bi bi-check-lg"
            />

            Duyệt yêu cầu
          </button>
        </div>
      </section>

      <div class="detail-layout">
        <!-- Cột nội dung -->
        <main class="main-column">
          <!-- Danh sách sách -->
          <section class="content-card">
            <div class="card-heading">
              <div class="heading-icon">
                <i class="bi bi-journals" />
              </div>

              <div>
                <h2>
                  Danh sách sách yêu cầu
                </h2>

                <p>
                  Có {{ requestItems.length }} đầu
                  sách, tổng cộng
                  {{ totalBooks }} quyển.
                </p>
              </div>
            </div>

            <div
              v-if="requestItems.length > 0"
              class="book-list"
            >
              <article
                v-for="(
                  item,
                  index
                ) in requestItems"
                :key="
                  getItemKey(
                    item,
                    index,
                  )
                "
                class="book-item"
              >
                <div class="book-cover">
                  <img
                    v-if="
                      getBookImage(item) &&
                      !hasImageError(
                        item,
                        index,
                      )
                    "
                    :src="getBookImage(item)"
                    :alt="getBookTitle(item)"
                    @error="
                      markImageError(
                        item,
                        index,
                      )
                    "
                  />

                  <div
                    v-else
                    class="book-placeholder"
                  >
                    <i class="bi bi-book" />
                  </div>
                </div>

                <div class="book-information">
                  <span class="book-code">
                    {{ getBookCode(item) }}
                  </span>

                  <strong class="book-title">
                    {{ getBookTitle(item) }}
                  </strong>

                  <span class="book-author">
                    <i class="bi bi-person" />

                    {{ getBookAuthor(item) }}
                  </span>

                  <div class="book-meta">
                    <span>
                      <i
                        class="bi bi-stack"
                      />

                      Yêu cầu:
                      <strong>
                        {{
                          getBookQuantity(
                            item,
                          )
                        }}
                        quyển
                      </strong>
                    </span>

                    <span
                      v-if="
                        getBookAvailable(
                          item,
                        ) !== null
                      "
                    >
                      <i
                        class="bi bi-box-seam"
                      />

                      Còn:
                      <strong>
                        {{
                          getBookAvailable(
                            item,
                          )
                        }}
                        quyển
                      </strong>
                    </span>
                  </div>
                </div>

                <div class="quantity-badge">
                  <span>Số lượng</span>

                  <strong>
                    {{
                      getBookQuantity(
                        item,
                      )
                    }}
                  </strong>
                </div>
              </article>
            </div>

            <div
              v-else
              class="empty-books"
            >
              <div>
                <i class="bi bi-book" />
              </div>

              <strong>
                Yêu cầu chưa có sách
              </strong>

              <span>
                Không tìm thấy chi tiết sách
                trong yêu cầu này.
              </span>
            </div>
          </section>

          <!-- Ghi chú -->
          <section class="content-card">
            <div class="card-heading">
              <div
                class="heading-icon note-icon"
              >
                <i
                  class="bi bi-chat-left-text"
                />
              </div>

              <div>
                <h2>
                  Ghi chú yêu cầu
                </h2>

                <p>
                  Nội dung bổ sung do độc giả
                  cung cấp.
                </p>
              </div>
            </div>

            <div
              v-if="borrowRequest.note"
              class="note-box"
            >
              <i
                class="bi bi-quote"
              />

              <p>
                {{ borrowRequest.note }}
              </p>
            </div>

            <div
              v-else
              class="empty-note"
            >
              <i
                class="bi bi-chat-left"
              />

              Yêu cầu này không có ghi chú.
            </div>
          </section>

          <!-- Lý do từ chối -->
          <section
            v-if="
              requestStatus ===
                'rejected' ||
              borrowRequest.rejectReason
            "
            class="content-card reject-card"
          >
            <div class="card-heading">
              <div
                class="heading-icon reject-icon"
              >
                <i
                  class="bi bi-x-octagon"
                />
              </div>

              <div>
                <h2>
                  Lý do từ chối
                </h2>

                <p>
                  Nguyên nhân yêu cầu không được
                  chấp thuận.
                </p>
              </div>
            </div>

            <div class="reject-reason">
              {{
                borrowRequest.rejectReason ||
                borrowRequest.rejectionReason ||
                "Không có lý do cụ thể"
              }}
            </div>
          </section>
        </main>

        <!-- Cột tóm tắt -->
        <aside class="summary-column">
          <!-- Độc giả -->
          <section class="summary-card">
            <div class="summary-heading">
              <div class="summary-icon">
                <i class="bi bi-person" />
              </div>

              <div>
                <h2>
                  Thông tin độc giả
                </h2>

                <p>
                  Người gửi yêu cầu.
                </p>
              </div>
            </div>

            <div class="reader-profile">
              <div class="reader-avatar">
                {{ readerInitials }}
              </div>

              <div>
                <strong>
                  {{ readerName }}
                </strong>

                <span>
                  {{ getReaderCode() }}
                </span>
              </div>
            </div>

            <div class="summary-information">
              <div>
                <span>
                  <i
                    class="bi bi-telephone"
                  />

                  Số điện thoại
                </span>

                <strong>
                  {{ getReaderPhone() }}
                </strong>
              </div>

              <div>
                <span>
                  <i
                    class="bi bi-geo-alt"
                  />

                  Địa chỉ
                </span>

                <strong>
                  {{ getReaderAddress() }}
                </strong>
              </div>
            </div>
          </section>

          <!-- Thời gian -->
          <section class="summary-card">
            <div class="summary-heading">
              <div
                class="summary-icon time-icon"
              >
                <i
                  class="bi bi-calendar3"
                />
              </div>

              <div>
                <h2>
                  Thời gian mượn
                </h2>

                <p>
                  Ngày gửi và hạn trả dự kiến.
                </p>
              </div>
            </div>

            <div class="time-line">
              <div class="time-item">
                <span class="time-dot request-dot" />

                <div>
                  <span>
                    Ngày gửi yêu cầu
                  </span>

                  <strong>
                    {{
                      formatDateTime(
                        borrowRequest
                          .requestDate ||
                          borrowRequest
                            .createdAt,
                      )
                    }}
                  </strong>
                </div>
              </div>

              <div class="time-connector" />

              <div class="time-item">
                <span class="time-dot due-dot" />

                <div>
                  <span>
                    Hạn trả dự kiến
                  </span>

                  <strong>
                    {{
                      formatDate(
                        borrowRequest
                          .dueDate,
                      )
                    }}
                  </strong>
                </div>
              </div>

              <template
                v-if="
                  borrowRequest.updatedAt
                "
              >
                <div class="time-connector" />

                <div class="time-item">
                  <span
                    class="time-dot update-dot"
                  />

                  <div>
                    <span>
                      Cập nhật gần nhất
                    </span>

                    <strong>
                      {{
                        formatDateTime(
                          borrowRequest
                            .updatedAt,
                        )
                      }}
                    </strong>
                  </div>
                </div>
              </template>
            </div>
          </section>

          <!-- Tổng hợp -->
          <section class="summary-card total-card">
            <div class="total-row">
              <span>
                Mã yêu cầu
              </span>

              <strong>
                {{ requestCode }}
              </strong>
            </div>

            <div class="total-row">
              <span>
                Số đầu sách
              </span>

              <strong>
                {{ requestItems.length }}
              </strong>
            </div>

            <div class="total-row">
              <span>
                Tổng số quyển
              </span>

              <strong>
                {{ totalBooks }}
              </strong>
            </div>

            <div class="total-row">
              <span>
                Trạng thái
              </span>

              <span
                class="status-badge"
                :class="
                  getStatusClass(
                    borrowRequest.status,
                  )
                "
              >
                {{
                  getStatusLabel(
                    borrowRequest.status,
                  )
                }}
              </span>
            </div>

            <div
              v-if="isPending"
              class="mobile-actions"
            >
              <button
                type="button"
                class="reject-button"
                :disabled="processing"
                @click="rejectRequest"
              >
                <i class="bi bi-x-lg" />

                Từ chối
              </button>

              <button
                type="button"
                class="approve-button"
                :disabled="processing"
                @click="approveRequest"
              >
                <i class="bi bi-check-lg" />

                Duyệt
              </button>
            </div>
          </section>
        </aside>
      </div>
    </template>
  </section>
</template>

<style scoped>
.request-detail-page {
  width: 100%;
  max-width: 1500px;
  min-width: 0;
  margin: 0 auto;
}

/* =========================================
   ĐIỀU HƯỚNG
========================================= */

.navigation-bar {
  margin-bottom: 18px;
}

.back-button {
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 0;
  background: transparent;
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.back-button:hover {
  color: #1d4ed8;
}

/* =========================================
   THÔNG BÁO
========================================= */

.custom-alert {
  min-height: 49px;
  margin-bottom: 18px;
  padding: 12px 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
}

.custom-alert > span {
  min-width: 0;
  flex: 1;
}

.custom-alert > button {
  width: 28px;
  height: 28px;
  padding: 0;
  display: grid;
  place-items: center;
  border: 0;
  background: transparent;
  color: inherit;
}

.alert-error {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.alert-success {
  border-color: #a7f3d0;
  background: #ecfdf5;
  color: #047857;
}

/* =========================================
   LOADING VÀ EMPTY
========================================= */

.loading-card,
.empty-card {
  min-height: 420px;
  padding: 40px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  border: 1px solid #e5edf7;
  border-radius: 21px;
  background: #fff;
  text-align: center;
  box-shadow:
    0 10px 28px
    rgb(15 23 42 / 6%);
}

.loading-card strong {
  margin-top: 15px;
  color: #334155;
}

.loading-card span {
  margin-top: 6px;
  color: #94a3b8;
  font-size: 11px;
}

.empty-icon {
  width: 72px;
  height: 72px;
  display: grid;
  place-items: center;
  border-radius: 20px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 29px;
}

.empty-card h2 {
  margin: 17px 0 7px;
  color: #334155;
}

.empty-card p {
  margin: 0;
  color: #94a3b8;
}

.return-button {
  margin-top: 18px;
  padding: 10px 15px;
  border: 0;
  border-radius: 10px;
  background: #2563eb;
  color: #fff;
}

/* =========================================
   HEADER
========================================= */

.request-header-card {
  padding: 25px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  border: 1px solid #e5edf7;
  border-radius: 21px;
  background: #fff;
  box-shadow:
    0 10px 28px
    rgb(15 23 42 / 6%);
}

.header-main {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-status-icon {
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 17px;
  font-size: 23px;
}

.header-content {
  min-width: 0;
}

.header-label {
  color: #3b82f6;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.6px;
  text-transform: uppercase;
}

.title-row {
  margin-top: 4px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.title-row h1 {
  margin: 0;
  color: #1e3a8a;
  font-size: 24px;
  font-weight: 900;
}

.header-content p {
  margin: 7px 0 0;
  color: #94a3b8;
  font-size: 11px;
}

.header-actions {
  display: flex;
  gap: 9px;
}

/* =========================================
   TRẠNG THÁI
========================================= */

.status-badge {
  padding: 6px 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 900;
  white-space: nowrap;
}

.status-pending {
  background: #fef3c7;
  color: #b45309;
}

.status-approved {
  background: #dcfce7;
  color: #15803d;
}

.status-rejected {
  background: #fee2e2;
  color: #b91c1c;
}

.status-cancelled {
  background: #e2e8f0;
  color: #475569;
}

.status-unknown {
  background: #f1f5f9;
  color: #64748b;
}

/* =========================================
   NÚT DUYỆT/TỪ CHỐI
========================================= */

.approve-button,
.reject-button {
  min-height: 42px;
  padding: 0 15px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 7px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 900;
}

.approve-button {
  border: 0;
  background: #16a34a;
  color: #fff;
}

.reject-button {
  border: 1px solid #fecaca;
  background: #fff;
  color: #dc2626;
}

.approve-button:disabled,
.reject-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

/* =========================================
   BỐ CỤC
========================================= */

.detail-layout {
  margin-top: 22px;
  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    340px;
  align-items: start;
  gap: 22px;
}

.main-column {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.content-card,
.summary-card {
  border: 1px solid #e5edf7;
  border-radius: 21px;
  background: #fff;
  box-shadow:
    0 10px 28px
    rgb(15 23 42 / 6%);
}

.content-card {
  padding: 24px;
}

.card-heading,
.summary-heading {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-heading {
  margin-bottom: 20px;
}

.heading-icon,
.summary-icon {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 13px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 18px;
}

.card-heading h2,
.summary-heading h2 {
  margin: 0;
  color: #1e3a8a;
  font-size: 17px;
  font-weight: 900;
}

.card-heading p,
.summary-heading p {
  margin: 5px 0 0;
  color: #94a3b8;
  font-size: 10px;
}

/* =========================================
   SÁCH
========================================= */

.book-list {
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.book-item {
  min-width: 0;
  padding: 13px;
  display: flex;
  align-items: center;
  gap: 13px;
  border: 1px solid #e7edf5;
  border-radius: 13px;
  background: #fff;
}

.book-cover {
  width: 58px;
  height: 78px;
  overflow: hidden;
  flex-shrink: 0;
  border-radius: 9px;
  background: #eff6ff;
}

.book-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.book-placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: #3b82f6;
  font-size: 21px;
}

.book-information {
  min-width: 0;
  flex: 1;
}

.book-code {
  color: #3b82f6;
  font-size: 8px;
  font-weight: 900;
  text-transform: uppercase;
}

.book-title {
  margin-top: 3px;
  display: block;
  color: #1e3a8a;
  font-size: 12px;
}

.book-author {
  margin-top: 5px;
  display: flex;
  align-items: center;
  gap: 5px;
  color: #94a3b8;
  font-size: 9px;
}

.book-meta {
  margin-top: 9px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.book-meta > span {
  padding: 5px 7px;
  border-radius: 7px;
  background: #f8fafc;
  color: #64748b;
  font-size: 8px;
}

.quantity-badge {
  min-width: 64px;
  padding: 9px;
  flex-shrink: 0;
  border-radius: 10px;
  background: #eff6ff;
  text-align: center;
}

.quantity-badge span,
.quantity-badge strong {
  display: block;
}

.quantity-badge span {
  color: #64748b;
  font-size: 7px;
  text-transform: uppercase;
}

.quantity-badge strong {
  margin-top: 3px;
  color: #2563eb;
  font-size: 17px;
}

.empty-books {
  min-height: 190px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  border: 1px dashed #cbd5e1;
  border-radius: 13px;
  text-align: center;
}

.empty-books > div {
  width: 57px;
  height: 57px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 22px;
}

.empty-books strong {
  margin-top: 13px;
  color: #475569;
}

.empty-books span {
  margin-top: 5px;
  color: #94a3b8;
  font-size: 10px;
}

/* =========================================
   GHI CHÚ
========================================= */

.note-icon {
  background: #f5f3ff;
  color: #7c3aed;
}

.note-box {
  padding: 15px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  border-radius: 12px;
  background: #f8fafc;
  color: #475569;
}

.note-box > i {
  color: #7c3aed;
}

.note-box p {
  margin: 0;
  line-height: 1.7;
}

.empty-note {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 9px;
  border-radius: 11px;
  background: #f8fafc;
  color: #94a3b8;
  font-size: 10px;
}

/* =========================================
   TỪ CHỐI
========================================= */

.reject-card {
  border-color: #fecaca;
}

.reject-icon {
  background: #fee2e2;
  color: #dc2626;
}

.reject-reason {
  padding: 14px;
  border-radius: 11px;
  background: #fef2f2;
  color: #b91c1c;
  line-height: 1.7;
}

/* =========================================
   SUMMARY
========================================= */

.summary-column {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.summary-card {
  padding: 21px;
}

.reader-profile {
  margin-top: 18px;
  padding: 13px;
  display: flex;
  align-items: center;
  gap: 11px;
  border-radius: 12px;
  background: #f8fafc;
}

.reader-avatar {
  width: 45px;
  height: 45px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 12px;
  background: #dbeafe;
  color: #2563eb;
  font-size: 12px;
  font-weight: 900;
}

.reader-profile strong,
.reader-profile span {
  display: block;
}

.reader-profile strong {
  color: #1e3a8a;
  font-size: 11px;
}

.reader-profile span {
  margin-top: 4px;
  color: #3b82f6;
  font-size: 8px;
  font-weight: 800;
}

.summary-information {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.summary-information > div {
  padding: 11px;
  border: 1px solid #e7edf5;
  border-radius: 10px;
}

.summary-information span,
.summary-information strong {
  display: block;
}

.summary-information span {
  color: #94a3b8;
  font-size: 8px;
  font-weight: 800;
}

.summary-information strong {
  margin-top: 5px;
  overflow-wrap: anywhere;
  color: #475569;
  font-size: 9px;
}

.time-icon {
  background: #ecfdf5;
  color: #059669;
}

.time-line {
  margin-top: 19px;
}

.time-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.time-dot {
  width: 12px;
  height: 12px;
  margin-top: 3px;
  flex-shrink: 0;
  border: 3px solid;
  border-radius: 50%;
}

.request-dot {
  border-color: #3b82f6;
  background: #dbeafe;
}

.due-dot {
  border-color: #f59e0b;
  background: #fef3c7;
}

.update-dot {
  border-color: #10b981;
  background: #d1fae5;
}

.time-item span,
.time-item strong {
  display: block;
}

.time-item div > span {
  color: #94a3b8;
  font-size: 8px;
  font-weight: 800;
}

.time-item strong {
  margin-top: 4px;
  color: #475569;
  font-size: 9px;
}

.time-connector {
  width: 2px;
  height: 29px;
  margin: 3px 0 3px 5px;
  background: #e2e8f0;
}

.total-card {
  position: sticky;
  top: 20px;
}

.total-row {
  padding: 10px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #edf2f7;
}

.total-row:first-child {
  padding-top: 0;
}

.total-row:last-child {
  border-bottom: 0;
}

.total-row > span:first-child {
  color: #64748b;
  font-size: 9px;
}

.total-row > strong {
  color: #1e3a8a;
  font-size: 10px;
}

.mobile-actions {
  margin-top: 17px;
  display: none;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 8px;
}

/* =========================================
   RESPONSIVE
========================================= */

@media (max-width: 1050px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }

  .total-card {
    position: static;
  }
}

@media (max-width: 750px) {
  .request-header-card {
    align-items: stretch;
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions button {
    flex: 1;
  }
}

@media (max-width: 560px) {
  .request-detail-page {
    padding: 0;
  }

  .request-header-card,
  .content-card,
  .summary-card {
    border-radius: 17px;
  }

  .request-header-card,
  .content-card {
    padding: 18px;
  }

  .header-main {
    align-items: flex-start;
  }

  .header-status-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    font-size: 19px;
  }

  .title-row h1 {
    font-size: 19px;
  }

  .header-actions {
    display: none;
  }

  .mobile-actions {
    display: grid;
  }

  .book-item {
    align-items: flex-start;
  }

  .quantity-badge {
    min-width: 52px;
  }
}
</style>