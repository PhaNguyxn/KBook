<script setup>
import {
  computed,
  onMounted,
  ref,
} from "vue";

import { RouterLink } from "vue-router";

import { dashboardApi } from "@/api/dashboardApi";
import { getErrorMessage } from "@/utils/error";

const loading = ref(false);
const errorMessage = ref("");

const dashboard = ref({
  totalBooks: 0,
  totalBorrowing: 0,
  totalReturned: 0,
  totalReaders: 0,
});

const recentTransactions = ref([]);

/*
 * Danh sách các thẻ thống kê.
 */
const statistics = computed(() => [
  {
    label: "Tổng số sách",
    value: dashboard.value.totalBooks,
    note: "Sách hiện có trong thư viện",
    icon: "bi-book-half",
    className: "card-blue",
  },
  {
    label: "Đang mượn",
    value: dashboard.value.totalBorrowing,
    note: "Phiếu mượn đang được xử lý",
    icon: "bi-journal-arrow-up",
    className: "card-orange",
  },
  {
    label: "Đã trả",
    value: dashboard.value.totalReturned,
    note: "Phiếu mượn đã hoàn thành",
    icon: "bi-check2-circle",
    className: "card-green",
  },
  {
    label: "Độc giả",
    value: dashboard.value.totalReaders,
    note: "Độc giả đang hoạt động",
    icon: "bi-people-fill",
    className: "card-purple",
  },
]);

/*
 * Định dạng ngày giờ ngay trong component để tránh lỗi
 * thiếu export từ file utils/date.js.
 */
function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/*
 * Lấy mã phiếu mượn.
 * Hỗ trợ nhiều tên trường khác nhau.
 */
function getTransactionCode(transaction) {
  const code =
    transaction.borrowCode ||
    transaction.code ||
    transaction.borrowId;

  if (code) {
    return code;
  }

  const shortId = String(
    transaction._id || "",
  )
    .slice(-6)
    .toUpperCase();

  return shortId
    ? `PM-${shortId}`
    : "—";
}

/*
 * Lấy thông tin độc giả.
 */
function getReader(transaction) {
  return (
    transaction.reader ||
    transaction.readerId ||
    {}
  );
}

function getReaderName(transaction) {
  const reader = getReader(transaction);

  return (
    reader.fullName ||
    reader.name ||
    transaction.readerName ||
    "Không xác định"
  );
}

function getReaderCode(transaction) {
  const reader = getReader(transaction);

  return (
    reader.readerCode ||
    reader.code ||
    transaction.readerCode ||
    "—"
  );
}

/*
 * Lấy thông tin nhân viên.
 */
function getEmployee(transaction) {
  return (
    transaction.employee ||
    transaction.employeeId ||
    {}
  );
}

function getEmployeeName(transaction) {
  const employee = getEmployee(transaction);

  return (
    employee.fullName ||
    employee.name ||
    employee.username ||
    transaction.employeeName ||
    "Chưa xác định"
  );
}

/*
 * Chuẩn hóa trạng thái từ backend.
 */
function normalizeStatus(status) {
  const value = String(
    status || "",
  ).toLowerCase();

  const aliases = {
    pending: "pending",
    waiting: "pending",

    approved: "borrowing",
    borrowed: "borrowing",
    borrowing: "borrowing",

    returned: "returned",
    completed: "returned",

    overdue: "overdue",

    cancelled: "cancelled",
    canceled: "cancelled",

    rejected: "rejected",
  };

  return aliases[value] || value || "unknown";
}

function getTransactionLabel(status) {
  const normalized =
    normalizeStatus(status);

  const labels = {
    pending: "Chờ xử lý",
    borrowing: "Đang mượn",
    returned: "Đã trả",
    overdue: "Quá hạn",
    cancelled: "Đã hủy",
    rejected: "Đã từ chối",
    unknown: "Không xác định",
  };

  return (
    labels[normalized] ||
    "Không xác định"
  );
}

function getTransactionIcon(status) {
  const normalized =
    normalizeStatus(status);

  const icons = {
    pending: "bi-hourglass-split",
    borrowing: "bi-box-arrow-up-right",
    returned: "bi-box-arrow-in-down-left",
    overdue:
      "bi-exclamation-triangle-fill",
    cancelled: "bi-x-circle-fill",
    rejected: "bi-slash-circle-fill",
    unknown: "bi-arrow-left-right",
  };

  return (
    icons[normalized] ||
    icons.unknown
  );
}

function getTransactionClass(status) {
  return `transaction-${normalizeStatus(
    status,
  )}`;
}

/*
 * Chọn thời điểm phù hợp nhất để hiển thị.
 */
function getTransactionDate(transaction) {
  const status = normalizeStatus(
    transaction.status,
  );

  if (status === "returned") {
    return (
      transaction.returnDate ||
      transaction.updatedAt ||
      transaction.createdAt
    );
  }

  return (
    transaction.borrowDate ||
    transaction.createdAt ||
    transaction.updatedAt
  );
}

function getTransactionDetailPath(
  transaction,
) {
  if (!transaction?._id) {
    return "/borrows";
  }

  return `/borrows/${transaction._id}`;
}

/*
 * Tải dữ liệu Dashboard.
 */
async function loadDashboard() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response =
      await dashboardApi.getDashboard();

    const data =
      response?.data?.data ||
      response?.data ||
      {};

    dashboard.value = {
      totalBooks:
        Number(
          data.totalBooks ??
            data.bookCount,
        ) || 0,

      totalBorrowing:
        Number(
          data.totalBorrowing ??
            data.borrowingCount,
        ) || 0,

      totalReturned:
        Number(
          data.totalReturned ??
            data.returnedCount,
        ) || 0,

      totalReaders:
        Number(
          data.totalReaders ??
            data.readerCount,
        ) || 0,
    };

    const transactions =
      data.recentTransactions ||
      data.recentBorrows ||
      data.transactions ||
      [];

    recentTransactions.value =
      Array.isArray(transactions)
        ? transactions
        : [];
  } catch (error) {
    console.error(
      "Load dashboard error:",
      error,
    );

    errorMessage.value =
      getErrorMessage(
        error,
        "Không thể tải dữ liệu tổng quan",
      );
  } finally {
    loading.value = false;
  }
}

onMounted(loadDashboard);
</script>

<template>
  <section class="dashboard-page">
    <!-- Tiêu đề Dashboard -->
    <div class="dashboard-hero">
      <div class="hero-left">
        <div class="hero-icon">
          <i
            class="bi bi-bar-chart-line-fill"
          />
        </div>

        <div class="hero-content">
          <span class="hero-label">
            Hệ thống quản lý thư viện
          </span>

          <h1 class="hero-title">
            Tổng quan hệ thống
          </h1>

          <p class="hero-subtitle">
            Theo dõi nhanh số lượng sách, độc giả
            và tình hình mượn trả trong thư viện.
          </p>
        </div>
      </div>

      <button
        type="button"
        class="refresh-button"
        :disabled="loading"
        @click="loadDashboard"
      >
        <i
          class="bi bi-arrow-clockwise"
          :class="{
            rotating: loading,
          }"
        />

        {{
          loading
            ? "Đang tải..."
            : "Làm mới"
        }}
      </button>
    </div>

    <!-- Thông báo lỗi -->
    <div
      v-if="errorMessage"
      class="alert alert-danger"
      role="alert"
    >
      <i
        class="bi bi-exclamation-circle-fill me-2"
      />

      {{ errorMessage }}
    </div>

    <!-- Các thẻ thống kê -->
    <div class="stats-grid">
      <article
        v-for="item in statistics"
        :key="item.label"
        class="stat-card"
        :class="item.className"
      >
        <div class="stat-icon">
          <i
            class="bi"
            :class="item.icon"
          />
        </div>

        <div class="stat-content">
          <span class="stat-label">
            {{ item.label }}
          </span>

          <strong class="stat-value">
            {{
              loading
                ? "..."
                : item.value
            }}
          </strong>

          <small class="stat-note">
            {{ item.note }}
          </small>
        </div>

        <div class="stat-decoration" />
      </article>
    </div>

    <!-- Các giao dịch gần đây -->
    <div class="dashboard-block recent-transactions-block">
      <div class="transaction-header">
        <div class="block-heading">
          <div class="block-heading-icon">
            <i
              class="bi bi-clock-history"
            />
          </div>

          <div>
            <h2 class="block-title">
              Các giao dịch gần đây
            </h2>

            <p class="block-description">
              Hoạt động mượn và trả sách mới nhất
              trong hệ thống
            </p>
          </div>
        </div>

        <RouterLink
          to="/borrows"
          class="view-all-link"
        >
          Xem tất cả

          <i
            class="bi bi-arrow-right"
          />
        </RouterLink>
      </div>

      <!-- Loading -->
      <div
        v-if="loading"
        class="transaction-loading"
      >
        <div class="loading-spinner">
          <div
            class="spinner-border text-primary"
            role="status"
          />
        </div>

        <strong>
          Đang tải giao dịch
        </strong>

        <span>
          Vui lòng chờ trong giây lát...
        </span>
      </div>

      <!-- Không có dữ liệu -->
      <div
        v-else-if="
          recentTransactions.length === 0
        "
        class="transaction-empty"
      >
        <div class="empty-icon">
          <i class="bi bi-receipt" />
        </div>

        <h3>
          Chưa có giao dịch gần đây
        </h3>

        <p>
          Các hoạt động mượn và trả sách mới
          nhất sẽ được hiển thị tại đây.
        </p>

        <RouterLink
          to="/borrows"
          class="empty-action"
        >
          Xem danh sách mượn trả

          <i
            class="bi bi-arrow-right"
          />
        </RouterLink>
      </div>

      <!-- Danh sách giao dịch -->
      <div
        v-else
        class="transaction-list"
      >
        <div class="transaction-table-header">
          <span>Giao dịch</span>
          <span>Độc giả</span>
          <span>Nhân viên</span>
          <span>Thời gian</span>
          <span />
        </div>

        <article
          v-for="transaction in recentTransactions"
          :key="transaction._id"
          class="transaction-item"
        >
          <div class="transaction-type">
            <div
              class="transaction-icon"
              :class="
                getTransactionClass(
                  transaction.status,
                )
              "
            >
              <i
                class="bi"
                :class="
                  getTransactionIcon(
                    transaction.status,
                  )
                "
              />
            </div>

            <div class="transaction-main">
              <strong class="transaction-code">
                {{
                  getTransactionCode(
                    transaction,
                  )
                }}
              </strong>

              <span
                class="transaction-status"
                :class="
                  getTransactionClass(
                    transaction.status,
                  )
                "
              >
                {{
                  getTransactionLabel(
                    transaction.status,
                  )
                }}
              </span>
            </div>
          </div>

          <div class="transaction-reader">
            <div class="reader-avatar">
              {{
                getReaderName(
                  transaction,
                )
                  .charAt(0)
                  .toUpperCase()
              }}
            </div>

            <div class="reader-information">
              <strong>
                {{
                  getReaderName(
                    transaction,
                  )
                }}
              </strong>

              <span>
                {{
                  getReaderCode(
                    transaction,
                  )
                }}
              </span>
            </div>
          </div>

          <div class="transaction-employee">
            <span class="information-label">
              Nhân viên xử lý
            </span>

            <strong>
              {{
                getEmployeeName(
                  transaction,
                )
              }}
            </strong>
          </div>

          <div class="transaction-time">
            <i class="bi bi-clock" />

            <span>
              {{
                formatDateTime(
                  getTransactionDate(
                    transaction,
                  ),
                )
              }}
            </span>
          </div>

          <RouterLink
            :to="
              getTransactionDetailPath(
                transaction,
              )
            "
            class="transaction-detail"
            title="Xem chi tiết"
          >
            <i
              class="bi bi-chevron-right"
            />
          </RouterLink>
        </article>
      </div>
    </div>

  </section>
</template>

<style scoped>
.dashboard-page {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ========================================
   HERO
======================================== */

.dashboard-hero {
  position: relative;
  overflow: hidden;
  min-height: 154px;
  padding: 30px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  border: 1px solid #e3ebf6;
  border-radius: 22px;
  background:
    radial-gradient(
      circle at 85% 20%,
      rgb(59 130 246 / 14%),
      transparent 30%
    ),
    linear-gradient(
      135deg,
      #ffffff 0%,
      #f4f8ff 100%
    );
  box-shadow:
    0 12px 35px
    rgb(15 23 42 / 7%);
}

.dashboard-hero::after {
  position: absolute;
  right: -45px;
  bottom: -80px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background:
    rgb(59 130 246 / 6%);
  content: "";
}

.hero-left {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 20px;
}

.hero-icon {
  width: 76px;
  height: 76px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 22px;
  background:
    linear-gradient(
      135deg,
      #4894ff,
      #2563eb
    );
  color: #ffffff;
  font-size: 31px;
  box-shadow:
    0 14px 30px
    rgb(37 99 235 / 25%);
}

.hero-content {
  min-width: 0;
}

.hero-label {
  display: inline-block;
  margin-bottom: 5px;
  color: #3b82f6;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.8px;
  text-transform: uppercase;
}

.hero-title {
  margin: 0;
  color: #1f4fbf;
  font-size: clamp(
    28px,
    3vw,
    38px
  );
  font-weight: 800;
  line-height: 1.15;
}

.hero-subtitle {
  max-width: 720px;
  margin: 10px 0 0;
  color: #64748b;
  font-size: 15px;
  line-height: 1.7;
}

.refresh-button {
  position: relative;
  z-index: 1;
  min-width: 145px;
  height: 48px;
  padding: 0 20px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 9px;
  flex-shrink: 0;
  border: 0;
  border-radius: 13px;
  background:
    linear-gradient(
      135deg,
      #438df8,
      #2563eb
    );
  color: #ffffff;
  font-weight: 700;
  box-shadow:
    0 10px 22px
    rgb(37 99 235 / 20%);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.refresh-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow:
    0 14px 28px
    rgb(37 99 235 / 26%);
}

.refresh-button:disabled {
  cursor: not-allowed;
  opacity: 0.75;
}

.rotating {
  animation: rotate 0.8s linear infinite;
}

@keyframes rotate {
  to {
    transform: rotate(360deg);
  }
}

/* ========================================
   STATISTICS
======================================== */

.stats-grid {
  display: grid;
  grid-template-columns:
    repeat(4, minmax(0, 1fr));
  gap: 20px;
}

.stat-card {
  position: relative;
  overflow: hidden;
  min-height: 150px;
  padding: 23px;
  display: flex;
  align-items: center;
  gap: 17px;
  border: 1px solid #e7edf5;
  border-radius: 20px;
  background: #ffffff;
  box-shadow:
    0 10px 27px
    rgb(15 23 42 / 6%);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow:
    0 17px 35px
    rgb(15 23 42 / 10%);
}

.stat-card::before {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 4px;
  content: "";
}

.stat-icon {
  position: relative;
  z-index: 2;
  width: 68px;
  height: 68px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 19px;
  font-size: 27px;
}

.stat-content {
  position: relative;
  z-index: 2;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.stat-label {
  overflow: hidden;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.45px;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.stat-value {
  margin: 8px 0 7px;
  font-size: 38px;
  font-weight: 800;
  line-height: 1;
}

.stat-note {
  overflow: hidden;
  color: #94a3b8;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-decoration {
  position: absolute;
  right: -30px;
  bottom: -50px;
  width: 125px;
  height: 125px;
  border-radius: 50%;
  opacity: 0.38;
}

.card-blue::before {
  background: #3b82f6;
}

.card-blue .stat-icon {
  background: #dbeafe;
  color: #2563eb;
}

.card-blue .stat-value {
  color: #2563eb;
}

.card-blue .stat-decoration {
  background: #dbeafe;
}

.card-orange::before {
  background: #f59e0b;
}

.card-orange .stat-icon {
  background: #fef3c7;
  color: #d97706;
}

.card-orange .stat-value {
  color: #d97706;
}

.card-orange .stat-decoration {
  background: #fef3c7;
}

.card-green::before {
  background: #10b981;
}

.card-green .stat-icon {
  background: #d1fae5;
  color: #059669;
}

.card-green .stat-value {
  color: #059669;
}

.card-green .stat-decoration {
  background: #d1fae5;
}

.card-purple::before {
  background: #8b5cf6;
}

.card-purple .stat-icon {
  background: #ede9fe;
  color: #7c3aed;
}

.card-purple .stat-value {
  color: #7c3aed;
}

.card-purple .stat-decoration {
  background: #ede9fe;
}

/* ========================================
   BLOCK
======================================== */

.dashboard-block {
  border: 1px solid #e7edf5;
  border-radius: 22px;
  background: #ffffff;
  box-shadow:
    0 10px 28px
    rgb(15 23 42 / 6%);
}

.recent-transactions-block {
  overflow: hidden;
}

.transaction-header {
  padding: 24px 27px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  border-bottom: 1px solid #edf2f7;
}

.block-heading {
  display: flex;
  align-items: center;
  gap: 14px;
}

.block-heading-icon {
  width: 47px;
  height: 47px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 14px;
  background: #eaf2ff;
  color: #2563eb;
  font-size: 20px;
}

.block-title {
  margin: 0;
  color: #1e3a8a;
  font-size: 21px;
  font-weight: 800;
}

.block-description {
  margin: 6px 0 0;
  color: #94a3b8;
  font-size: 13px;
}

.view-all-link {
  padding: 9px 13px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  border-radius: 9px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
  transition:
    gap 0.2s ease,
    background 0.2s ease;
}

.view-all-link:hover {
  gap: 11px;
  background: #dbeafe;
}

/* ========================================
   TRANSACTION TABLE
======================================== */

.transaction-table-header {
  padding: 12px 25px;
  display: grid;
  grid-template-columns:
    minmax(190px, 1.3fr)
    minmax(190px, 1.2fr)
    minmax(150px, 0.9fr)
    minmax(165px, 0.9fr)
    38px;
  align-items: center;
  gap: 17px;
  border-bottom: 1px solid #edf2f7;
  background: #f8fafc;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.transaction-list {
  display: flex;
  flex-direction: column;
}

.transaction-item {
  padding: 17px 25px;
  display: grid;
  grid-template-columns:
    minmax(190px, 1.3fr)
    minmax(190px, 1.2fr)
    minmax(150px, 0.9fr)
    minmax(165px, 0.9fr)
    38px;
  align-items: center;
  gap: 17px;
  border-bottom: 1px solid #edf2f7;
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.transaction-item:last-child {
  border-bottom: 0;
}

.transaction-item:hover {
  background: #f8fbff;
}

.transaction-type {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 13px;
}

.transaction-icon {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 14px;
  font-size: 19px;
}

.transaction-main {
  min-width: 0;
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 7px;
}

.transaction-code {
  overflow: hidden;
  max-width: 100%;
  color: #1e3a8a;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.transaction-status {
  padding: 4px 8px;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  white-space: nowrap;
}

.transaction-reader {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 11px;
}

.reader-avatar {
  width: 39px;
  height: 39px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 12px;
  background:
    linear-gradient(
      135deg,
      #eff6ff,
      #dbeafe
    );
  color: #2563eb;
  font-size: 14px;
  font-weight: 800;
}

.reader-information {
  min-width: 0;
}

.reader-information strong,
.reader-information span {
  display: block;
}

.reader-information strong {
  overflow: hidden;
  color: #334155;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reader-information span {
  margin-top: 4px;
  color: #94a3b8;
  font-size: 11px;
}

.transaction-employee {
  min-width: 0;
}

.information-label,
.transaction-employee strong {
  display: block;
}

.information-label {
  margin-bottom: 5px;
  color: #94a3b8;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.transaction-employee strong {
  overflow: hidden;
  color: #475569;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.transaction-time {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #64748b;
  font-size: 12px;
}

.transaction-time i {
  color: #94a3b8;
}

.transaction-detail {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  background: #eff6ff;
  color: #2563eb;
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.transaction-detail:hover {
  transform: translateX(3px);
  background: #dbeafe;
}

/* Trạng thái */

.transaction-pending.transaction-icon {
  background: #fef3c7;
  color: #d97706;
}

.transaction-pending.transaction-status {
  background: #fef3c7;
  color: #b45309;
}

.transaction-borrowing.transaction-icon {
  background: #dbeafe;
  color: #2563eb;
}

.transaction-borrowing.transaction-status {
  background: #dbeafe;
  color: #1d4ed8;
}

.transaction-returned.transaction-icon {
  background: #d1fae5;
  color: #059669;
}

.transaction-returned.transaction-status {
  background: #d1fae5;
  color: #047857;
}

.transaction-overdue.transaction-icon {
  background: #fee2e2;
  color: #dc2626;
}

.transaction-overdue.transaction-status {
  background: #fee2e2;
  color: #b91c1c;
}

.transaction-rejected.transaction-icon {
  background: #ffe4e6;
  color: #e11d48;
}

.transaction-rejected.transaction-status {
  background: #ffe4e6;
  color: #be123c;
}

.transaction-cancelled.transaction-icon,
.transaction-unknown.transaction-icon {
  background: #e2e8f0;
  color: #64748b;
}

.transaction-cancelled.transaction-status,
.transaction-unknown.transaction-status {
  background: #e2e8f0;
  color: #475569;
}

/* ========================================
   LOADING VÀ EMPTY
======================================== */

.transaction-loading,
.transaction-empty {
  min-height: 250px;
  padding: 42px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  text-align: center;
}

.loading-spinner {
  margin-bottom: 14px;
}

.transaction-loading strong {
  color: #334155;
  font-size: 16px;
}

.transaction-loading span {
  margin-top: 6px;
  color: #94a3b8;
  font-size: 13px;
}

.empty-icon {
  width: 72px;
  height: 72px;
  display: grid;
  place-items: center;
  border-radius: 21px;
  background:
    linear-gradient(
      135deg,
      #eff6ff,
      #dbeafe
    );
  color: #3b82f6;
  font-size: 29px;
}

.transaction-empty h3 {
  margin: 17px 0 7px;
  color: #334155;
  font-size: 18px;
  font-weight: 800;
}

.transaction-empty p {
  max-width: 430px;
  margin: 0;
  color: #94a3b8;
  font-size: 13px;
  line-height: 1.7;
}

.empty-action {
  margin-top: 18px;
  padding: 10px 15px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 10px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
}

.empty-action:hover {
  background: #dbeafe;
}

/* ========================================
   WELCOME
======================================== */

.welcome-block {
  padding: 27px;
  display: flex;
  align-items: center;
  gap: 21px;
  border: 1px solid #e3ebf6;
  border-radius: 22px;
  background:
    linear-gradient(
      135deg,
      #ffffff,
      #f4f8ff
    );
  box-shadow:
    0 10px 28px
    rgb(15 23 42 / 6%);
}

.welcome-icon {
  width: 82px;
  height: 82px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 23px;
  background:
    linear-gradient(
      135deg,
      #dbeafe,
      #bfdbfe
    );
  color: #2563eb;
  font-size: 34px;
}

.welcome-content {
  min-width: 0;
}

.welcome-label {
  display: block;
  margin-bottom: 5px;
  color: #3b82f6;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.8px;
  text-transform: uppercase;
}

.welcome-content h2 {
  margin: 0;
  color: #1f4fbf;
  font-size: 21px;
  font-weight: 800;
}

.welcome-content p {
  margin: 9px 0 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.7;
}

.welcome-tags {
  margin-top: 15px;
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}

.welcome-tags span {
  padding: 7px 11px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 11px;
  font-weight: 700;
}

/* ========================================
   RESPONSIVE
======================================== */

@media (max-width: 1250px) {
  .stats-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .transaction-table-header {
    grid-template-columns:
      minmax(190px, 1.2fr)
      minmax(180px, 1fr)
      minmax(160px, 0.8fr)
      38px;
  }

  .transaction-table-header span:nth-child(3) {
    display: none;
  }

  .transaction-item {
    grid-template-columns:
      minmax(190px, 1.2fr)
      minmax(180px, 1fr)
      minmax(160px, 0.8fr)
      38px;
  }

  .transaction-employee {
    display: none;
  }
}

@media (max-width: 850px) {
  .dashboard-hero {
    padding: 24px;
    align-items: stretch;
    flex-direction: column;
  }

  .hero-left {
    align-items: flex-start;
  }

  .refresh-button {
    width: 100%;
  }

  .transaction-table-header {
    display: none;
  }

  .transaction-item {
    grid-template-columns:
      52px
      minmax(0, 1fr)
      37px;
    gap: 12px;
  }

  .transaction-type {
    display: contents;
  }

  .transaction-icon {
    grid-column: 1;
    grid-row: 1 / 3;
  }

  .transaction-main {
    grid-column: 2;
    grid-row: 1;
  }

  .transaction-reader {
    grid-column: 2;
    grid-row: 2;
  }

  .transaction-time {
    grid-column: 2;
    grid-row: 3;
  }

  .transaction-detail {
    grid-column: 3;
    grid-row: 1 / 4;
  }
}

@media (max-width: 650px) {
  .dashboard-page {
    gap: 17px;
  }

  .dashboard-hero {
    min-height: auto;
    padding: 21px;
    border-radius: 17px;
  }

  .hero-icon {
    width: 58px;
    height: 58px;
    border-radius: 17px;
    font-size: 24px;
  }

  .hero-title {
    font-size: 25px;
  }

  .hero-subtitle {
    font-size: 13px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .stat-card {
    min-height: 128px;
    padding: 19px;
    border-radius: 17px;
  }

  .stat-icon {
    width: 59px;
    height: 59px;
    border-radius: 17px;
    font-size: 23px;
  }

  .stat-value {
    font-size: 33px;
  }

  .transaction-header {
    padding: 20px;
    align-items: flex-start;
  }

  .block-heading-icon {
    display: none;
  }

  .block-description {
    display: none;
  }

  .view-all-link {
    padding: 8px;
    font-size: 0;
  }

  .view-all-link i {
    font-size: 17px;
  }

  .transaction-item {
    padding: 16px 18px;
  }

  .reader-avatar {
    display: none;
  }

  .welcome-block {
    padding: 22px;
    align-items: flex-start;
    flex-direction: column;
    border-radius: 17px;
  }

  .welcome-icon {
    width: 64px;
    height: 64px;
    border-radius: 18px;
    font-size: 27px;
  }

  .welcome-content h2 {
    font-size: 19px;
  }
}

@media (max-width: 420px) {
  .hero-left {
    flex-direction: column;
  }

  .transaction-code {
    font-size: 13px;
  }

  .transaction-status {
    font-size: 9px;
  }

  .transaction-time {
    font-size: 11px;
  }
}
</style>