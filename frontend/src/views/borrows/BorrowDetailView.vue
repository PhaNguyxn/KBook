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

import { borrowApi } from "@/api/borrowApi";
import { getImageUrl } from "@/utils/image";

import {
  formatDate,
  formatDateTime,
} from "@/utils/date";

import {
  getBorrowStatus,
  getReaderFullName,
  getShortBorrowId,
} from "@/utils/borrow";

import { getErrorMessage } from "@/utils/error";

const route = useRoute();
const router = useRouter();

/* =========================================
   STATE
========================================= */

const borrow = ref(null);
const details = ref([]);

const loading = ref(false);
const returning = ref(false);

const errorMessage = ref("");
const successMessage = ref("");

const imageErrors = ref({});

/* =========================================
   COMPUTED
========================================= */

const borrowCode = computed(() => {
  return (
    borrow.value?.borrowCode ||
    getShortBorrowId(
      borrow.value?._id,
    ) ||
    "Chưa có mã"
  );
});

const statusInformation = computed(() => {
  if (!borrow.value) {
    return {
      text: "Không xác định",
      className: "status-unknown",
    };
  }

  return (
    getBorrowStatus(
      borrow.value,
    ) || {
      text: "Không xác định",
      className: "status-unknown",
    }
  );
});

const statusIcon = computed(() => {
  const className =
    statusInformation.value.className;

  if (
    className === "status-returned"
  ) {
    return "bi-check-circle-fill";
  }

  if (
    className === "status-overdue"
  ) {
    return "bi-exclamation-circle-fill";
  }

  if (
    className === "status-borrowing"
  ) {
    return "bi-clock-fill";
  }

  return "bi-question-circle-fill";
});

const totalBookTitles = computed(() => {
  return details.value.length;
});

const totalQuantity = computed(() => {
  return details.value.reduce(
    (total, detail) => {
      return (
        total +
        Number(
          detail?.quantity || 0,
        )
      );
    },
    0,
  );
});

const calculatedTotalAmount = computed(() => {
  return details.value.reduce(
    (total, detail) => {
      return (
        total +
        getDetailSubtotal(detail)
      );
    },
    0,
  );
});

const totalAmount = computed(() => {
  const storedAmount = Number(
    borrow.value?.totalAmount,
  );

  if (
    Number.isFinite(storedAmount) &&
    storedAmount > 0
  ) {
    return storedAmount;
  }

  return calculatedTotalAmount.value;
});

const readerName = computed(() => {
  if (!borrow.value?.reader) {
    return "Không xác định";
  }

  return (
    getReaderFullName(
      borrow.value.reader,
    ) || "Không xác định"
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
    .trim()
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

const employeeName = computed(() => {
  const employee =
    borrow.value?.employee;

  if (!employee) {
    return "Không xác định";
  }

  if (employee.fullName) {
    return employee.fullName;
  }

  return (
    `${employee.lastName || ""} ${
      employee.firstName || ""
    }`.trim() ||
    "Không xác định"
  );
});

/* =========================================
   HÀM HỖ TRỢ
========================================= */

function formatCurrency(value) {
  return new Intl.NumberFormat(
    "vi-VN",
    {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    },
  ).format(Number(value) || 0);
}

function getDetailUnitPrice(detail) {
  const value =
    detail?.unitPrice ??
    detail?.price ??
    detail?.book?.price ??
    0;

  const price = Number(value);

  return Number.isFinite(price)
    ? price
    : 0;
}

function getDetailSubtotal(detail) {
  if (
    detail?.subtotal !== undefined &&
    detail?.subtotal !== null
  ) {
    const subtotal = Number(
      detail.subtotal,
    );

    if (Number.isFinite(subtotal)) {
      return subtotal;
    }
  }

  return (
    getDetailUnitPrice(detail) *
    Number(detail?.quantity || 0)
  );
}

function getBookCode(book) {
  return (
    book?.bookCode ||
    book?.code ||
    "Chưa có mã"
  );
}

function getBookTitle(book) {
  return (
    book?.title ||
    book?.name ||
    "Sách không còn tồn tại"
  );
}

function getPublisherName(book) {
  if (!book?.publisher) {
    return "Chưa cập nhật";
  }

  if (
    typeof book.publisher ===
    "string"
  ) {
    return book.publisher;
  }

  return (
    book.publisher.publisherName ||
    book.publisher.name ||
    "Chưa cập nhật"
  );
}

function getBookImage(book) {
  if (!book?.image) {
    return "";
  }

  return getImageUrl(book.image);
}

function handleImageError(bookId) {
  imageErrors.value[bookId] = true;
}

function hasBookImage(book) {
  return Boolean(
    book?.image &&
      !imageErrors.value[
        book?._id
      ],
  );
}

function goBack() {
  router.push({
    name: "borrow-list",
  });
}

/* =========================================
   TẢI PHIẾU MƯỢN
========================================= */

async function loadBorrow() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response =
      await borrowApi.getById(
        route.params.id,
      );

    const payload =
      response?.data?.data ??
      response?.data ??
      {};

    const borrowData =
      payload.borrow ?? payload;

    if (
      !borrowData ||
      !borrowData._id
    ) {
      throw new Error(
        "Không tìm thấy phiếu mượn",
      );
    }

    borrow.value = borrowData;

    if (
      Array.isArray(
        payload.details,
      )
    ) {
      details.value =
        payload.details;
    } else if (
      Array.isArray(
        borrowData.items,
      )
    ) {
      details.value =
        borrowData.items;
    } else if (
      Array.isArray(
        payload.items,
      )
    ) {
      details.value =
        payload.items;
    } else {
      details.value = [];
    }
  } catch (error) {
    console.error(
      "Load borrow detail error:",
      error,
    );

    borrow.value = null;
    details.value = [];

    errorMessage.value =
      getErrorMessage(
        error,
        "Không thể tải chi tiết phiếu mượn",
      );
  } finally {
    loading.value = false;
  }
}

/* =========================================
   TRẢ SÁCH
========================================= */

async function handleReturnBooks() {
  if (
    !borrow.value ||
    borrow.value.status === "returned"
  ) {
    return;
  }

  const confirmed =
    window.confirm(
      `Xác nhận độc giả "${readerName.value}" đã trả ${totalQuantity.value} quyển sách?`,
    );

  if (!confirmed) {
    return;
  }

  returning.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    await borrowApi.returnBooks(
      borrow.value._id,
    );

    successMessage.value =
      "Xác nhận trả sách thành công";

    await loadBorrow();
  } catch (error) {
    console.error(
      "Return borrow error:",
      error,
    );

    errorMessage.value =
      getErrorMessage(
        error,
        "Không thể xác nhận trả sách",
      );
  } finally {
    returning.value = false;
  }
}

/* =========================================
   KHỞI TẠO
========================================= */

onMounted(() => {
  loadBorrow();
});
</script>

<template>
  <section class="borrow-detail-page">
    <!-- Điều hướng -->
    <div class="navigation-bar">
      <button
        type="button"
        class="back-button"
        @click="goBack"
      >
        <i class="bi bi-arrow-left" />

        Quay lại danh sách
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
        Đang tải chi tiết phiếu mượn
      </strong>

      <span>
        Vui lòng chờ trong giây lát...
      </span>
    </div>

    <!-- Không tìm thấy -->
    <div
      v-else-if="!borrow"
      class="empty-card"
    >
      <div class="empty-icon">
        <i
          class="bi bi-file-earmark-x"
        />
      </div>

      <h2>
        Không tìm thấy phiếu mượn
      </h2>

      <p>
        Phiếu mượn có thể đã bị xóa hoặc
        đường dẫn không chính xác.
      </p>

      <button
        type="button"
        class="return-list-button"
        @click="goBack"
      >
        <i class="bi bi-arrow-left" />

        Về danh sách phiếu mượn
      </button>
    </div>

    <template v-else>
      <!-- Header -->
      <header class="detail-header-card">
        <div class="header-information">
          <div class="header-icon">
            <i
              class="bi bi-journal-bookmark"
            />
          </div>

          <div>
            <span class="header-label">
              Chi tiết phiếu mượn
            </span>

            <h1>
              {{ borrowCode }}
            </h1>

            <p>
              <i
                class="bi bi-calendar-plus"
              />

              Lập ngày
              {{
                borrow.borrowDate
                  ? formatDateTime(
                      borrow.borrowDate,
                    )
                  : "Chưa cập nhật"
              }}
            </p>
          </div>
        </div>

        <div class="header-actions">
          <span
            class="status-badge"
            :class="
              statusInformation.className
            "
          >
            <i
              class="bi"
              :class="statusIcon"
            />

            {{
              statusInformation.text
            }}
          </span>

          <button
            v-if="
              borrow.status ===
              'borrowing'
            "
            type="button"
            class="return-button"
            :disabled="returning"
            @click="handleReturnBooks"
          >
            <span
              v-if="returning"
              class="spinner-border spinner-border-sm"
            />

            <i
              v-else
              class="bi bi-box-arrow-in-left"
            />

            {{
              returning
                ? "Đang xử lý..."
                : "Xác nhận trả sách"
            }}
          </button>
        </div>
      </header>

      <div class="detail-layout">
        <!-- Cột nội dung -->
        <main class="main-column">
          <!-- Thông tin độc giả -->
          <article class="information-card">
            <div class="card-heading">
              <div class="heading-icon">
                <i
                  class="bi bi-person-vcard"
                />
              </div>

              <div>
                <h2>
                  Thông tin độc giả
                </h2>

                <p>
                  Người đang mượn sách trong
                  phiếu này.
                </p>
              </div>
            </div>

            <div class="reader-profile">
              <div class="reader-avatar">
                {{ readerInitials }}
              </div>

              <div class="reader-main">
                <span>
                  {{
                    borrow.reader
                      ?.readerCode ||
                    "Chưa có mã"
                  }}
                </span>

                <strong>
                  {{ readerName }}
                </strong>

                <small>
                  <i
                    class="bi bi-telephone"
                  />

                  {{
                    borrow.reader
                      ?.phone ||
                    "Chưa cập nhật số điện thoại"
                  }}
                </small>
              </div>
            </div>

            <div class="information-grid">
              <div class="information-item">
                <span>
                  Mã độc giả
                </span>

                <strong class="code-value">
                  {{
                    borrow.reader
                      ?.readerCode ||
                    "—"
                  }}
                </strong>
              </div>

              <div class="information-item">
                <span>
                  Họ và tên
                </span>

                <strong>
                  {{ readerName }}
                </strong>
              </div>

              <div class="information-item">
                <span>
                  Số điện thoại
                </span>

                <strong>
                  {{
                    borrow.reader
                      ?.phone ||
                    "—"
                  }}
                </strong>
              </div>

              <div class="information-item">
                <span>
                  Địa chỉ
                </span>

                <strong>
                  {{
                    borrow.reader
                      ?.address ||
                    "Chưa cập nhật"
                  }}
                </strong>
              </div>
            </div>
          </article>

          <!-- Thông tin phiếu -->
          <article class="information-card">
            <div class="card-heading">
              <div
                class="heading-icon borrow-icon"
              >
                <i
                  class="bi bi-file-earmark-text"
                />
              </div>

              <div>
                <h2>
                  Thông tin phiếu
                </h2>

                <p>
                  Nhân viên lập phiếu và thời
                  gian mượn – trả.
                </p>
              </div>
            </div>

            <div class="information-grid">
              <div class="information-item">
                <span>
                  Mã phiếu
                </span>

                <strong class="code-value">
                  {{ borrowCode }}
                </strong>
              </div>

              <div class="information-item">
                <span>
                  Nhân viên lập
                </span>

                <strong>
                  {{ employeeName }}
                </strong>
              </div>

              <div class="information-item">
                <span>
                  Mã nhân viên
                </span>

                <strong>
                  {{
                    borrow.employee
                      ?.employeeCode ||
                    "—"
                  }}
                </strong>
              </div>

              <div class="information-item">
                <span>
                  Ngày mượn
                </span>

                <strong>
                  {{
                    borrow.borrowDate
                      ? formatDateTime(
                          borrow.borrowDate,
                        )
                      : "—"
                  }}
                </strong>
              </div>

              <div class="information-item">
                <span>
                  Hạn trả
                </span>

                <strong>
                  {{
                    borrow.dueDate
                      ? formatDate(
                          borrow.dueDate,
                        )
                      : "—"
                  }}
                </strong>
              </div>

              <div class="information-item">
                <span>
                  Ngày trả thực tế
                </span>

                <strong>
                  {{
                    borrow.returnDate
                      ? formatDateTime(
                          borrow.returnDate,
                        )
                      : "Chưa trả"
                  }}
                </strong>
              </div>
            </div>
          </article>

          <!-- Ghi chú -->
          <article
            v-if="borrow.note"
            class="information-card"
          >
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
                  Ghi chú
                </h2>

                <p>
                  Nội dung bổ sung của phiếu
                  mượn.
                </p>
              </div>
            </div>

            <div class="note-content">
              {{ borrow.note }}
            </div>
          </article>
        </main>

        <!-- Cột tóm tắt -->
        <aside class="summary-column">
          <article class="summary-card">
            <div class="summary-heading">
              <div class="summary-icon">
                <i
                  class="bi bi-receipt"
                />
              </div>

              <div>
                <h2>
                  Tóm tắt phiếu
                </h2>

                <p>
                  Thông tin mượn sách.
                </p>
              </div>
            </div>

            <div class="summary-reader">
              <div class="summary-avatar">
                {{ readerInitials }}
              </div>

              <div>
                <span>
                  Độc giả
                </span>

                <strong>
                  {{ readerName }}
                </strong>

                <small>
                  {{
                    borrow.reader
                      ?.readerCode ||
                    "Chưa có mã"
                  }}
                </small>
              </div>
            </div>

            <div class="summary-grid">
              <div>
                <span>
                  <i
                    class="bi bi-bookshelf"
                  />

                  Số đầu sách
                </span>

                <strong>
                  {{ totalBookTitles }}
                </strong>
              </div>

              <div>
                <span>
                  <i class="bi bi-stack" />

                  Tổng số lượng
                </span>

                <strong>
                  {{ totalQuantity }}
                </strong>
              </div>

              <div>
                <span>
                  <i
                    class="bi bi-calendar-plus"
                  />

                  Ngày mượn
                </span>

                <strong>
                  {{
                    borrow.borrowDate
                      ? formatDate(
                          borrow.borrowDate,
                        )
                      : "—"
                  }}
                </strong>
              </div>

              <div>
                <span>
                  <i
                    class="bi bi-calendar-event"
                  />

                  Hạn trả
                </span>

                <strong>
                  {{
                    borrow.dueDate
                      ? formatDate(
                          borrow.dueDate,
                        )
                      : "—"
                  }}
                </strong>
              </div>
            </div>

            <div class="total-amount-box">
              <span>
                <i
                  class="bi bi-cash-stack"
                />

                Tổng tiền
              </span>

              <strong>
                {{
                  formatCurrency(
                    totalAmount,
                  )
                }}
              </strong>
            </div>

            <div class="summary-status">
              <span>
                Trạng thái phiếu
              </span>

              <span
                class="status-badge"
                :class="
                  statusInformation.className
                "
              >
                <i
                  class="bi"
                  :class="statusIcon"
                />

                {{
                  statusInformation.text
                }}
              </span>
            </div>

            <button
              v-if="
                borrow.status ===
                'borrowing'
              "
              type="button"
              class="summary-return-button"
              :disabled="returning"
              @click="handleReturnBooks"
            >
              <span
                v-if="returning"
                class="spinner-border spinner-border-sm"
              />

              <i
                v-else
                class="bi bi-box-arrow-in-left"
              />

              {{
                returning
                  ? "Đang xử lý..."
                  : "Xác nhận trả sách"
              }}
            </button>
          </article>
        </aside>
      </div>

      <!-- Danh sách sách -->
      <article class="book-list-card">
        <div class="book-list-heading">
          <div>
            <h2>
              Danh sách sách mượn
            </h2>

            <p>
              {{ totalBookTitles }} đầu sách,
              {{ totalQuantity }} quyển.
            </p>
          </div>

          <div class="book-total">
            <span>
              Tổng tiền
            </span>

            <strong>
              {{
                formatCurrency(
                  totalAmount,
                )
              }}
            </strong>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="book-table">
            <colgroup>
              <col class="column-index" />
              <col class="column-book" />
              <col class="column-author" />
              <col class="column-publisher" />
              <col class="column-price" />
              <col class="column-quantity" />
              <col class="column-subtotal" />
            </colgroup>

            <thead>
              <tr>
                <th class="center-column">
                  STT
                </th>

                <th>
                  Thông tin sách
                </th>

                <th>
                  Tác giả
                </th>

                <th>
                  Nhà xuất bản
                </th>

                <th class="money-column">
                  Đơn giá
                </th>

                <th class="center-column">
                  Số lượng
                </th>

                <th class="money-column">
                  Thành tiền
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(
                  detail,
                  index
                ) in details"
                :key="
                  detail._id ||
                  detail.book?._id ||
                  index
                "
              >
                <td class="center-column">
                  {{ index + 1 }}
                </td>

                <td>
                  <div class="book-information">
                    <div class="book-cover">
                      <img
                        v-if="
                          hasBookImage(
                            detail.book,
                          )
                        "
                        :src="
                          getBookImage(
                            detail.book,
                          )
                        "
                        :alt="
                          getBookTitle(
                            detail.book,
                          )
                        "
                        @error="
                          handleImageError(
                            detail.book?._id,
                          )
                        "
                      />

                      <div
                        v-else
                        class="book-placeholder"
                      >
                        <i
                          class="bi bi-book"
                        />
                      </div>
                    </div>

                    <div class="book-content">
                      <span>
                        {{
                          getBookCode(
                            detail.book,
                          )
                        }}
                      </span>

                      <strong
                        :title="
                          getBookTitle(
                            detail.book,
                          )
                        "
                      >
                        {{
                          getBookTitle(
                            detail.book,
                          )
                        }}
                      </strong>

                      <small>
                        {{
                          detail.book
                            ?.category ||
                          "Chưa phân loại"
                        }}
                      </small>
                    </div>
                  </div>
                </td>

                <td>
                  <span class="text-value">
                    {{
                      detail.book
                        ?.author ||
                      "Chưa cập nhật"
                    }}
                  </span>
                </td>

                <td>
                  <span class="text-value">
                    {{
                      getPublisherName(
                        detail.book,
                      )
                    }}
                  </span>
                </td>

                <td class="money-column">
                  <span class="unit-price">
                    {{
                      formatCurrency(
                        getDetailUnitPrice(
                          detail,
                        ),
                      )
                    }}
                  </span>
                </td>

                <td class="center-column">
                  <span class="quantity-badge">
                    {{
                      Number(
                        detail.quantity ||
                          0,
                      )
                    }}
                  </span>
                </td>

                <td class="money-column">
                  <strong class="subtotal">
                    {{
                      formatCurrency(
                        getDetailSubtotal(
                          detail,
                        ),
                      )
                    }}
                  </strong>
                </td>
              </tr>

              <tr
                v-if="details.length === 0"
              >
                <td
                  colspan="7"
                  class="empty-table-cell"
                >
                  <div class="empty-books">
                    <div>
                      <i
                        class="bi bi-journal-x"
                      />
                    </div>

                    <strong>
                      Phiếu mượn không có sách
                    </strong>

                    <span>
                      Không tìm thấy thông tin
                      sách của phiếu này.
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>

            <tfoot
              v-if="details.length > 0"
            >
              <tr>
                <td colspan="5">
                  Tổng cộng
                </td>

                <td class="center-column">
                  <strong>
                    {{ totalQuantity }}
                  </strong>
                </td>

                <td class="money-column">
                  <strong class="grand-total">
                    {{
                      formatCurrency(
                        totalAmount,
                      )
                    }}
                  </strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </article>
    </template>
  </section>
</template>

<style scoped>
.borrow-detail-page {
  width: 100%;
  max-width: 1500px;
  min-width: 0;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* =========================================
   ĐIỀU HƯỚNG
========================================= */

.navigation-bar {
  min-height: 28px;
  display: flex;
  align-items: center;
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
  width: 100%;
  min-height: 48px;
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
  border-radius: 7px;
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
  min-height: 390px;
  padding: 45px 20px;
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
  font-size: 15px;
}

.loading-card span {
  margin-top: 6px;
  color: #94a3b8;
  font-size: 11px;
}

.empty-icon {
  width: 75px;
  height: 75px;
  display: grid;
  place-items: center;
  border-radius: 21px;
  background: #eff6ff;
  color: #3b82f6;
  font-size: 30px;
}

.empty-card h2 {
  margin: 17px 0 7px;
  color: #1e3a8a;
  font-size: 21px;
}

.empty-card p {
  margin: 0;
  color: #94a3b8;
  font-size: 12px;
}

.return-list-button {
  min-height: 41px;
  margin-top: 19px;
  padding: 0 15px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 0;
  border-radius: 10px;
  background: #2563eb;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
}

/* =========================================
   HEADER
========================================= */

.detail-header-card {
  padding: 24px 27px;
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

.header-information {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-icon {
  width: 57px;
  height: 57px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 16px;
  background: linear-gradient(
    135deg,
    #dbeafe,
    #eff6ff
  );
  color: #2563eb;
  font-size: 24px;
}

.header-label {
  display: block;
  color: #94a3b8;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.header-information h1 {
  margin: 4px 0 6px;
  color: #1e3a8a;
  font-size: 25px;
  font-weight: 900;
}

.header-information p {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #64748b;
  font-size: 11px;
}

.header-information p i {
  color: #3b82f6;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 11px;
}

/* =========================================
   TRẠNG THÁI VÀ NÚT TRẢ
========================================= */

.status-badge {
  max-width: 100%;
  padding: 7px 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 900;
  white-space: nowrap;
}

.status-borrowing {
  background: #fef3c7;
  color: #92400e;
}

.status-returned {
  background: #d1fae5;
  color: #047857;
}

.status-overdue {
  background: #fee2e2;
  color: #b91c1c;
}

.status-unknown {
  background: #e2e8f0;
  color: #475569;
}

.return-button,
.summary-return-button {
  min-height: 42px;
  padding: 0 15px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 7px;
  border: 0;
  border-radius: 10px;
  background: #059669;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  cursor: pointer;
  box-shadow:
    0 7px 16px
    rgb(5 150 105 / 18%);
}

.return-button:hover:not(:disabled),
.summary-return-button:hover:not(:disabled) {
  background: #047857;
}

.return-button:disabled,
.summary-return-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* =========================================
   BỐ CỤC
========================================= */

.detail-layout {
  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    320px;
  align-items: start;
  gap: 20px;
}

.main-column {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.information-card,
.summary-card,
.book-list-card {
  min-width: 0;
  border: 1px solid #e5edf7;
  border-radius: 21px;
  background: #fff;
  box-shadow:
    0 10px 28px
    rgb(15 23 42 / 6%);
}

.information-card {
  padding: 24px;
}

/* =========================================
   TIÊU ĐỀ CARD
========================================= */

.card-heading,
.summary-heading {
  margin-bottom: 21px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.heading-icon,
.summary-icon {
  width: 45px;
  height: 45px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 13px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 19px;
}

.borrow-icon {
  background: #eef2ff;
  color: #4f46e5;
}

.note-icon {
  background: #fff7ed;
  color: #ea580c;
}

.card-heading h2,
.summary-heading h2,
.book-list-heading h2 {
  margin: 0;
  color: #1e3a8a;
  font-size: 18px;
  font-weight: 900;
}

.card-heading p,
.summary-heading p,
.book-list-heading p {
  margin: 5px 0 0;
  color: #94a3b8;
  font-size: 10px;
}

/* =========================================
   HỒ SƠ ĐỘC GIẢ
========================================= */

.reader-profile {
  margin-bottom: 17px;
  padding: 13px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #dbeafe;
  border-radius: 13px;
  background: #f8fbff;
}

.reader-avatar,
.summary-avatar {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: linear-gradient(
    135deg,
    #dbeafe,
    #eff6ff
  );
  color: #2563eb;
  font-weight: 900;
}

.reader-avatar {
  width: 48px;
  height: 48px;
  border-radius: 13px;
  font-size: 13px;
}

.reader-main {
  min-width: 0;
}

.reader-main span,
.reader-main strong,
.reader-main small {
  display: block;
}

.reader-main span {
  color: #3b82f6;
  font-size: 8px;
  font-weight: 900;
}

.reader-main strong {
  margin-top: 3px;
  color: #1e3a8a;
  font-size: 13px;
}

.reader-main small {
  margin-top: 5px;
  color: #64748b;
  font-size: 9px;
}

/* =========================================
   THÔNG TIN
========================================= */

.information-grid {
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  overflow: hidden;
  border: 1px solid #e7edf5;
  border-radius: 13px;
}

.information-item {
  min-width: 0;
  padding: 15px 17px;
  border-bottom: 1px solid #e7edf5;
}

.information-item:nth-child(odd) {
  border-right: 1px solid #e7edf5;
}

.information-item:nth-last-child(-n + 2) {
  border-bottom: 0;
}

.information-item span,
.information-item strong {
  display: block;
}

.information-item span {
  margin-bottom: 6px;
  color: #94a3b8;
  font-size: 9px;
  font-weight: 800;
}

.information-item strong {
  overflow-wrap: anywhere;
  color: #334155;
  font-size: 11px;
}

.code-value {
  color: #2563eb !important;
}

.note-content {
  padding: 15px;
  border: 1px solid #fed7aa;
  border-radius: 12px;
  background: #fffaf5;
  color: #475569;
  font-size: 11px;
  line-height: 1.7;
  white-space: pre-wrap;
}

/* =========================================
   TÓM TẮT
========================================= */

.summary-column {
  min-width: 0;
}

.summary-card {
  padding: 21px;
  position: sticky;
  top: 20px;
}

.summary-reader {
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 12px;
  background: #f8fafc;
}

.summary-avatar {
  width: 42px;
  height: 42px;
  border-radius: 11px;
  font-size: 11px;
}

.summary-reader span,
.summary-reader strong,
.summary-reader small {
  display: block;
}

.summary-reader span {
  color: #94a3b8;
  font-size: 8px;
  font-weight: 800;
  text-transform: uppercase;
}

.summary-reader strong {
  margin-top: 3px;
  color: #1e3a8a;
  font-size: 10px;
}

.summary-reader small {
  margin-top: 3px;
  color: #3b82f6;
  font-size: 8px;
}

.summary-grid {
  margin-top: 15px;
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.summary-grid > div {
  min-width: 0;
  padding: 10px;
  border: 1px solid #e7edf5;
  border-radius: 10px;
}

.summary-grid span,
.summary-grid strong {
  display: block;
}

.summary-grid span {
  color: #94a3b8;
  font-size: 7px;
  font-weight: 800;
}

.summary-grid span i {
  margin-right: 3px;
}

.summary-grid strong {
  margin-top: 5px;
  overflow-wrap: anywhere;
  color: #334155;
  font-size: 9px;
}

.total-amount-box {
  margin-top: 15px;
  padding: 14px;
  border: 1px solid #fecaca;
  border-radius: 12px;
  background: #fff7f7;
}

.total-amount-box span,
.total-amount-box strong {
  display: block;
}

.total-amount-box span {
  color: #64748b;
  font-size: 9px;
  font-weight: 800;
}

.total-amount-box span i {
  margin-right: 4px;
  color: #dc2626;
}

.total-amount-box strong {
  margin-top: 7px;
  color: #dc2626;
  font-size: 20px;
  font-weight: 900;
}

.summary-status {
  margin-top: 15px;
  padding-top: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  border-top: 1px solid #edf2f7;
}

.summary-status > span:first-child {
  color: #64748b;
  font-size: 9px;
  font-weight: 800;
}

.summary-return-button {
  width: 100%;
  margin-top: 16px;
}

/* =========================================
   DANH SÁCH SÁCH
========================================= */

.book-list-card {
  overflow: hidden;
}

.book-list-heading {
  padding: 21px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 17px;
  border-bottom: 1px solid #edf2f7;
}

.book-total {
  padding: 9px 13px;
  border: 1px solid #fecaca;
  border-radius: 11px;
  background: #fff7f7;
}

.book-total span,
.book-total strong {
  display: block;
}

.book-total span {
  color: #94a3b8;
  font-size: 8px;
  font-weight: 800;
  text-transform: uppercase;
}

.book-total strong {
  margin-top: 3px;
  color: #dc2626;
  font-size: 14px;
  font-weight: 900;
}

/* =========================================
   BẢNG SÁCH
========================================= */

.table-wrapper {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
}

.book-table {
  width: 100%;
  min-width: 900px;
  table-layout: fixed;
  border-collapse: collapse;
}

.column-index {
  width: 5%;
}

.column-book {
  width: 28%;
}

.column-author {
  width: 16%;
}

.column-publisher {
  width: 16%;
}

.column-price {
  width: 12%;
}

.column-quantity {
  width: 9%;
}

.column-subtotal {
  width: 14%;
}

.book-table th {
  padding: 12px 11px;
  border-bottom: 1px solid #e7edf5;
  background: #f8fafc;
  color: #64748b;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.35px;
  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
}

.book-table td {
  min-width: 0;
  padding: 13px 11px;
  border-bottom: 1px solid #edf2f7;
  color: #475569;
  font-size: 10px;
  vertical-align: middle;
}

.book-table tbody tr:hover {
  background: #f8fbff;
}

.center-column {
  text-align: center !important;
}

.money-column {
  text-align: right !important;
}

/* =========================================
   THÔNG TIN SÁCH
========================================= */

.book-information {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.book-cover {
  width: 46px;
  height: 63px;
  overflow: hidden;
  flex-shrink: 0;
  border-radius: 7px;
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
  color: #60a5fa;
  font-size: 19px;
}

.book-content {
  min-width: 0;
  flex: 1;
}

.book-content span,
.book-content strong,
.book-content small {
  display: block;
}

.book-content > span {
  color: #3b82f6;
  font-size: 7px;
  font-weight: 900;
  letter-spacing: 0.4px;
}

.book-content strong {
  margin-top: 3px;
  overflow: hidden;
  color: #1e3a8a;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-content small {
  margin-top: 5px;
  color: #94a3b8;
  font-size: 8px;
}

.text-value {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unit-price {
  color: #475569;
  font-weight: 700;
  white-space: nowrap;
}

.quantity-badge {
  min-width: 31px;
  height: 29px;
  padding: 0 8px;
  display: inline-grid;
  place-items: center;
  border-radius: 8px;
  background: #eef2ff;
  color: #4f46e5;
  font-weight: 900;
}

.subtotal {
  color: #dc2626;
  font-size: 10px;
  font-weight: 900;
  white-space: nowrap;
}

/* =========================================
   FOOTER BẢNG
========================================= */

.book-table tfoot td {
  padding: 14px 11px;
  border-top: 2px solid #dbeafe;
  border-bottom: 0;
  background: #f8fbff;
  color: #334155;
  font-weight: 800;
}

.book-table tfoot td:first-child {
  text-align: right;
}

.grand-total {
  color: #dc2626;
  font-size: 13px;
  font-weight: 900;
  white-space: nowrap;
}

/* =========================================
   BẢNG TRỐNG
========================================= */

.empty-table-cell {
  padding: 0 !important;
}

.empty-books {
  min-height: 230px;
  padding: 35px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  text-align: center;
}

.empty-books > div {
  width: 65px;
  height: 65px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background: #eff6ff;
  color: #3b82f6;
  font-size: 26px;
}

.empty-books strong {
  margin-top: 14px;
  color: #334155;
  font-size: 14px;
}

.empty-books span {
  margin-top: 5px;
  color: #94a3b8;
  font-size: 10px;
}

/* =========================================
   RESPONSIVE
========================================= */

@media (max-width: 1050px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }

  .summary-card {
    position: static;
  }
}

@media (max-width: 750px) {
  .detail-header-card,
  .book-list-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .header-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .return-button {
    width: 100%;
  }

  .information-grid {
    grid-template-columns: 1fr;
  }

  .information-item,
  .information-item:nth-child(odd),
  .information-item:nth-last-child(-n + 2) {
    border-right: 0;
    border-bottom: 1px solid #e7edf5;
  }

  .information-item:last-child {
    border-bottom: 0;
  }

  .book-total {
    width: fit-content;
  }
}

@media (max-width: 500px) {
  .borrow-detail-page {
    gap: 16px;
  }

  .detail-header-card,
  .information-card,
  .summary-card {
    padding: 18px;
    border-radius: 17px;
  }

  .header-information {
    align-items: flex-start;
  }

  .header-icon {
    width: 48px;
    height: 48px;
    border-radius: 13px;
    font-size: 20px;
  }

  .header-information h1 {
    font-size: 20px;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>