<script setup>
import {
  computed,
  onMounted,
  reactive,
  ref,
} from "vue";

import ReaderAccountSidebar from
  "@/components/account/ReaderAccountSidebar.vue";

import {
  borrowApi,
} from "@/api/borrowApi";

const loading = ref(false);
const errorMessage = ref("");
const history = ref([]);
const expandedId = ref("");

const filters = reactive({
  keyword: "",
  status: "",
});

const pagination = reactive({
  page: 1,
  limit: 8,
  total: 0,
  totalPages: 0,
});

const serverUrl = String(
  import.meta.env.VITE_SERVER_URL ||
    "http://localhost:3000",
).replace(/\/+$/, "");

function extractHistory(response) {
  const payload =
    response?.data?.data ??
    response?.data ??
    {};

  if (Array.isArray(payload)) {
    return {
      history: payload,
      pagination: {},
      summary: {},
    };
  }

  return {
    history:
      payload.history ||
      payload.borrows ||
      payload.items ||
      payload.docs ||
      [],

    pagination:
      payload.pagination ||
      payload.pageInfo ||
      {},

    summary:
      payload.summary || {},
  };
}

const backendSummary = reactive({
  total: 0,
  borrowing: 0,
  returned: 0,
  overdue: 0,
});

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
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

function isOverdue(item) {
  if (item.isOverdue === true) {
    return true;
  }

  const status = String(
    item.status || "",
  ).toLowerCase();

  return (
    [
      "borrowing",
      "đang mượn",
    ].includes(status) &&
    item.dueDate &&
    new Date(item.dueDate) <
      new Date()
  );
}

function statusInfo(item) {
  if (isOverdue(item)) {
    return {
      label: "Quá hạn",
      className: "overdue",
      icon:
        "bi bi-exclamation-triangle-fill",
    };
  }

  const status = String(
    item.status || "",
  ).toLowerCase();

  if (
    [
      "returned",
      "đã trả",
      "completed",
    ].includes(status)
  ) {
    return {
      label: "Đã trả",
      className: "returned",
      icon:
        "bi bi-check-circle-fill",
    };
  }

  return {
    label: "Đang mượn",
    className: "borrowing",
    icon: "bi bi-book-fill",
  };
}

function getBook(item) {
  return (
    item?.book ||
    item?.bookId ||
    item?.bookSnapshot ||
    item?.bookInfo ||
    {}
  );
}

function getBorrowItems(
  borrow,
) {
  const items =
    borrow?.items ||
    borrow?.details ||
    borrow?.borrowDetails ||
    borrow?.books ||
    [];

  return Array.isArray(items)
    ? items
    : [];
}

function getImageUrl(image) {
  if (!image) {
    return "";
  }

  const normalized =
    String(image).replace(
      /\\/g,
      "/",
    );

  if (
    /^https?:\/\//i.test(
      normalized,
    ) ||
    normalized.startsWith("data:")
  ) {
    return normalized;
  }

  return `${serverUrl}/${normalized.replace(
    /^\/+/,
    "",
  )}`;
}

function totalBooks(borrow) {
  const backendTotal =
    Number(borrow?.totalBooks);

  if (
    Number.isFinite(
      backendTotal,
    ) &&
    backendTotal >= 0
  ) {
    return backendTotal;
  }

  return getBorrowItems(
    borrow,
  ).reduce(
    (total, item) =>
      total +
      Number(
        item?.quantity || 0,
      ),
    0,
  );
}

const summary = computed(() => {
  if (
    backendSummary.total ||
    backendSummary.borrowing ||
    backendSummary.returned ||
    backendSummary.overdue
  ) {
    return backendSummary;
  }

  const result = {
    total: history.value.length,
    borrowing: 0,
    returned: 0,
    overdue: 0,
  };

  history.value.forEach((item) => {
    const status =
      statusInfo(item).className;

    if (status === "overdue") {
      result.overdue += 1;
    } else if (
      status === "returned"
    ) {
      result.returned += 1;
    } else {
      result.borrowing += 1;
    }
  });

  return result;
});

async function loadHistory() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response =
      await borrowApi
        .getMyHistory({
          page: pagination.page,
          limit: pagination.limit,

          ...(filters.keyword.trim()
            ? {
                keyword:
                  filters.keyword.trim(),
              }
            : {}),

          ...(filters.status
            ? {
                status:
                  filters.status,
              }
            : {}),
        });

    const result =
      extractHistory(response);

    history.value =
      result.history;

    Object.assign(
      pagination,
      result.pagination,
    );

    Object.assign(
      backendSummary,
      result.summary,
    );

    if (
      !pagination.totalPages &&
      history.value.length
    ) {
      pagination.total =
        history.value.length;

      pagination.totalPages = 1;
    }
  } catch (error) {
    errorMessage.value =
      error?.response?.data?.message ||
      "Không thể tải lịch sử mượn sách";
  } finally {
    loading.value = false;
  }
}

function applyFilters() {
  pagination.page = 1;
  loadHistory();
}

function clearFilters() {
  filters.keyword = "";
  filters.status = "";
  pagination.page = 1;
  loadHistory();
}

function changePage(page) {
  if (
    page < 1 ||
    page > pagination.totalPages
  ) {
    return;
  }

  pagination.page = page;
  loadHistory();
}

function toggleHistory(id) {
  expandedId.value =
    expandedId.value === id
      ? ""
      : id;
}

onMounted(loadHistory);
</script>

<template>
  <div class="history-page">
    <section class="account-banner">
      <div class="reader-container">
        <div class="breadcrumb">
          <RouterLink
            :to="{
              name: 'reader-home',
            }"
          >
            Trang chủ
          </RouterLink>

          <i class="bi bi-chevron-right" />

          <span>Lịch sử mượn</span>
        </div>

        <h1>Lịch sử mượn sách</h1>

        <p>
          Theo dõi sách đang mượn, đã trả và
          các phiếu mượn quá hạn.
        </p>
      </div>
    </section>

    <section class="account-section">
      <div class="reader-container account-layout">
        <ReaderAccountSidebar />

        <main class="history-content">
          <div class="summary-grid">
            <article>
              <span class="summary-icon total">
                <i
                  class="bi bi-clock-history"
                />
              </span>

              <div>
                <small>Tổng phiếu mượn</small>
                <strong>{{ summary.total }}</strong>
              </div>
            </article>

            <article>
              <span class="summary-icon borrowing">
                <i class="bi bi-book" />
              </span>

              <div>
                <small>Đang mượn</small>
                <strong>
                  {{ summary.borrowing }}
                </strong>
              </div>
            </article>

            <article>
              <span class="summary-icon returned">
                <i
                  class="bi bi-check-circle"
                />
              </span>

              <div>
                <small>Đã trả</small>
                <strong>
                  {{ summary.returned }}
                </strong>
              </div>
            </article>

            <article>
              <span class="summary-icon overdue">
                <i
                  class="bi bi-exclamation-triangle"
                />
              </span>

              <div>
                <small>Quá hạn</small>
                <strong>
                  {{ summary.overdue }}
                </strong>
              </div>
            </article>
          </div>

          <div
            v-if="errorMessage"
            class="page-alert error"
          >
            <i
              class="bi bi-exclamation-circle-fill"
            />

            {{ errorMessage }}
          </div>

          <div class="history-toolbar">
            <form
              @submit.prevent="applyFilters"
            >
              <div class="toolbar-search">
                <i class="bi bi-search" />

                <input
                  v-model="filters.keyword"
                  type="search"
                  placeholder="Tìm theo mã phiếu mượn..."
                />
              </div>

              <select
                v-model="filters.status"
                @change="applyFilters"
              >
                <option value="">
                  Tất cả trạng thái
                </option>

                <option value="borrowing">
                  Đang mượn
                </option>

                <option value="returned">
                  Đã trả
                </option>

                <option value="overdue">
                  Quá hạn
                </option>
              </select>

              <button
                type="submit"
                class="filter-button"
              >
                Tìm kiếm
              </button>

              <button
                type="button"
                class="clear-button"
                @click="clearFilters"
              >
                Xóa lọc
              </button>
            </form>
          </div>

          <div
            v-if="loading"
            class="page-loading"
          >
            <span class="loading-spinner" />

            <p>Đang tải lịch sử mượn...</p>
          </div>

          <div
            v-else-if="history.length"
            class="history-list"
          >
            <article
              v-for="borrow in history"
              :key="borrow._id"
              class="history-card"
            >
              <header class="history-header">
                <div>
                  <small>Mã phiếu mượn</small>

                  <strong>
                    {{
                      borrow.borrowCode ||
                      borrow.code ||
                      `PM-${String(
                        borrow._id,
                      ).slice(-6)}`
                    }}
                  </strong>
                </div>

                <span
                  class="status-badge"
                  :class="
                    statusInfo(borrow)
                      .className
                  "
                >
                  <i
                    :class="
                      statusInfo(borrow).icon
                    "
                  />

                  {{
                    statusInfo(borrow).label
                  }}
                </span>
              </header>

              <div class="history-overview">
                <div>
                  <small>Ngày mượn</small>

                  <strong>
                    {{
                      formatDate(
                        borrow.borrowDate,
                      )
                    }}
                  </strong>
                </div>

                <div>
                  <small>Hạn trả</small>

                  <strong :class="{ 'overdue-text': isOverdue(borrow) }">
                    {{ formatDate(borrow.dueDate) }}
                    </strong>
                </div>

                <div>
                  <small>Ngày trả</small>

                  <strong>
                    {{
                      formatDate(
                        borrow.returnDate,
                      )
                    }}
                  </strong>
                </div>

                <div>
                  <small>Số lượng sách</small>

                  <strong>
                    {{ totalBooks(borrow) }}
                    quyển
                  </strong>
                </div>

                <button
                  type="button"
                  class="detail-button"
                  @click="
                    toggleHistory(
                      borrow._id,
                    )
                  "
                >
                  {{
                    expandedId ===
                    borrow._id
                      ? "Thu gọn"
                      : "Xem chi tiết"
                  }}

                  <i
                    :class="
                      expandedId ===
                      borrow._id
                        ? 'bi bi-chevron-up'
                        : 'bi bi-chevron-down'
                    "
                  />
                </button>
              </div>

              <Transition name="expand">
                <div
                  v-if="
                    expandedId ===
                    borrow._id
                  "
                  class="history-details"
                >
                  <div class="borrowed-books">
                    <h3>Danh sách sách</h3>

                    <div
                        v-for="item in
                            getBorrowItems(borrow)"
                        :key="
                            item._id ||
                            getBook(item)._id
                        "
                        class="borrowed-book"
                    >
                      <div class="book-cover">
                        <img
                          v-if="
                            getImageUrl(
                              getBook(item)
                                .image,
                            )
                          "
                          :src="
                            getImageUrl(
                              getBook(item)
                                .image,
                            )
                          "
                          :alt="
                            getBook(item)
                              .title
                          "
                        />

                        <i
                          v-else
                          class="bi bi-book"
                        />
                      </div>

                      <div>
                        <strong>
                          {{
                            getBook(item)
                              .title ||
                            item.title ||
                            "Sách không xác định"
                          }}
                        </strong>

                        <span>
                          {{
                            getBook(item)
                              .author ||
                            item.author ||
                            "Chưa cập nhật tác giả"
                          }}
                        </span>

                        <small>
                          Số lượng:
                          {{
                            item.quantity ||
                            1
                          }}
                        </small>
                      </div>
                    </div>
                  </div>

                  <aside class="borrow-information">
                    <h3>Thông tin phiếu mượn</h3>

                    <div>
                      <span>Nhân viên xử lý</span>

                      <strong>
                        {{
                          borrow.employee
                            ?.fullName ||
                          borrow.employeeName ||
                          "Đang cập nhật"
                        }}
                      </strong>
                    </div>

                    <div>
                      <span>Ghi chú</span>

                      <p>
                        {{
                          borrow.note ||
                          "Không có ghi chú"
                        }}
                      </p>
                    </div>

                    <div
                      v-if="isOverdue(borrow)"
                      class="overdue-notice"
                    >
                      <i
                        class="bi bi-exclamation-triangle-fill"
                      />

                      <span>
                        Phiếu mượn đã quá hạn.
                        Vui lòng liên hệ thư viện
                        để trả hoặc gia hạn sách.
                      </span>
                    </div>
                  </aside>
                </div>
              </Transition>
            </article>
          </div>

          <div
            v-else
            class="empty-state"
          >
            <span>
              <i
                class="bi bi-clock-history"
              />
            </span>

            <h2>Chưa có lịch sử mượn</h2>

            <p>
              Các phiếu mượn đã được duyệt sẽ
              xuất hiện tại đây.
            </p>

            <RouterLink
              :to="{
                name: 'reader-books',
              }"
            >
              Khám phá sách
            </RouterLink>
          </div>

          <nav
            v-if="
              pagination.totalPages > 1
            "
            class="pagination"
          >
            <button
              type="button"
              :disabled="
                pagination.page <= 1
              "
              @click="
                changePage(
                  pagination.page - 1,
                )
              "
            >
              <i
                class="bi bi-chevron-left"
              />
            </button>

            <button
              v-for="page in pagination.totalPages"
              :key="page"
              type="button"
              :class="{
                active:
                  page ===
                  pagination.page,
              }"
              @click="changePage(page)"
            >
              {{ page }}
            </button>

            <button
              type="button"
              :disabled="
                pagination.page >=
                pagination.totalPages
              "
              @click="
                changePage(
                  pagination.page + 1,
                )
              "
            >
              <i
                class="bi bi-chevron-right"
              />
            </button>
          </nav>
        </main>
      </div>
    </section>
  </div>
</template>

<style scoped>
.account-banner {
  padding: 40px 0;
  border-bottom: 1px solid
    var(--reader-border);
  background:
    linear-gradient(
      135deg,
      #eaf7ef,
      #edf3ff
    );
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--reader-muted);
  font-size: 9px;
}

.breadcrumb a {
  color: var(--reader-primary);
}

.account-banner h1 {
  margin: 14px 0 7px;
  color: var(--reader-text);
  font-size: 34px;
}

.account-banner p {
  margin: 0;
  color: var(--reader-muted);
  font-size: 11px;
}

.account-section {
  padding: 40px 0 65px;
  background: #fafcfb;
}

.account-layout {
  display: grid;
  grid-template-columns:
    245px minmax(0, 1fr);
  align-items: start;
  gap: 25px;
}

.history-content {
  min-width: 0;
}

.summary-grid {
  display: grid;
  grid-template-columns:
    repeat(4, minmax(0, 1fr));
  gap: 13px;
}

.summary-grid article {
  min-height: 95px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid
    var(--reader-border);
  border-radius: 13px;
  background: #fff;
}

.summary-icon {
  width: 43px;
  height: 43px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  font-size: 18px;
}

.summary-icon.total {
  background: #e8eefc;
  color: #315db2;
}

.summary-icon.borrowing {
  background: #dbeafe;
  color: #1d4ed8;
}

.summary-icon.returned {
  background: #dcfce7;
  color: #15803d;
}

.summary-icon.overdue {
  background: #fee2e2;
  color: #b91c1c;
}

.summary-grid small,
.summary-grid strong {
  display: block;
}

.summary-grid small {
  color: var(--reader-muted);
  font-size: 8px;
}

.summary-grid strong {
  margin-top: 4px;
  color: var(--reader-text);
  font-size: 20px;
}

.page-alert {
  margin-top: 17px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid;
  border-radius: 9px;
  font-size: 9px;
}

.page-alert.error {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

.history-toolbar {
  margin: 18px 0;
  padding: 13px;
  border: 1px solid
    var(--reader-border);
  border-radius: 13px;
  background: #fff;
}

.history-toolbar form {
  display: flex;
  align-items: center;
  gap: 9px;
}

.toolbar-search {
  min-width: 180px;
  height: 38px;
  position: relative;
  flex: 1;
}

.toolbar-search i {
  position: absolute;
  top: 50%;
  left: 11px;
  color: var(--reader-muted);
  transform: translateY(-50%);
}

.toolbar-search input,
.history-toolbar select {
  height: 38px;
  border: 1px solid
    var(--reader-border);
  border-radius: 8px;
  outline: none;
}

.toolbar-search input {
  width: 100%;
  padding: 0 10px 0 34px;
}

.history-toolbar select {
  padding: 0 10px;
  background: #fff;
  font-size: 9px;
}

.filter-button,
.clear-button {
  min-height: 38px;
  padding: 0 13px;
  border-radius: 8px;
  font-size: 9px;
  font-weight: 900;
}

.filter-button {
  border: 0;
  background: var(--reader-primary);
  color: #fff;
}

.clear-button {
  border: 1px solid
    var(--reader-border);
  background: #fff;
  color: var(--reader-text);
}

.page-loading {
  min-height: 350px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  color: var(--reader-muted);
}

.loading-spinner {
  width: 34px;
  height: 34px;
  border: 3px solid #dae7df;
  border-top-color: var(--reader-primary);
  border-radius: 50%;
  animation:
    reader-spin 0.8s linear infinite;
}

.history-card {
  margin-bottom: 15px;
  overflow: hidden;
  border: 1px solid
    var(--reader-border);
  border-radius: 15px;
  background: #fff;
  box-shadow:
    0 8px 25px
    rgb(15 23 42 / 4%);
}

.history-header {
  min-height: 63px;
  padding: 0 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid
    var(--reader-border);
}

.history-header small,
.history-header strong {
  display: block;
}

.history-header small {
  color: var(--reader-muted);
  font-size: 8px;
}

.history-header strong {
  margin-top: 4px;
  color: var(--reader-text);
  font-size: 11px;
}

.status-badge {
  padding: 7px 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  font-size: 8px;
  font-weight: 900;
}

.status-badge.borrowing {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-badge.returned {
  background: #dcfce7;
  color: #15803d;
}

.status-badge.overdue {
  background: #fee2e2;
  color: #b91c1c;
}

.history-overview {
  min-height: 82px;
  padding: 14px 18px;
  display: grid;
  grid-template-columns:
    repeat(4, 1fr) 120px;
  align-items: center;
  gap: 13px;
}

.history-overview small,
.history-overview strong {
  display: block;
}

.history-overview small {
  color: var(--reader-muted);
  font-size: 8px;
}

.history-overview strong {
  margin-top: 5px;
  color: var(--reader-text);
  font-size: 9px;
}

.overdue-text {
  color: #dc2626 !important;
}

.detail-button {
  min-height: 36px;
  padding: 0 10px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 7px;
  border: 1px solid
    var(--reader-primary);
  border-radius: 8px;
  background: #fff;
  color: var(--reader-primary);
  font-size: 8px;
  font-weight: 900;
}

.history-details {
  padding: 18px;
  display: grid;
  grid-template-columns:
    minmax(0, 1fr) 270px;
  gap: 20px;
  border-top: 1px solid
    var(--reader-border);
  background: #fafcfb;
}

.borrowed-books h3,
.borrow-information h3 {
  margin: 0 0 13px;
  color: var(--reader-text);
  font-size: 11px;
}

.borrowed-book {
  margin-top: 9px;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid
    var(--reader-border);
  border-radius: 10px;
  background: #fff;
}

.book-cover {
  width: 50px;
  height: 70px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 5px;
  background: var(--reader-primary-light);
  color: var(--reader-primary);
}

.book-cover img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.borrowed-book strong,
.borrowed-book span,
.borrowed-book small {
  display: block;
}

.borrowed-book strong {
  color: var(--reader-text);
  font-size: 9px;
}

.borrowed-book span {
  margin-top: 4px;
  color: var(--reader-muted);
  font-size: 8px;
}

.borrowed-book small {
  margin-top: 6px;
  color: var(--reader-primary);
  font-size: 7px;
  font-weight: 900;
}

.borrow-information {
  padding: 15px;
  border: 1px solid
    var(--reader-border);
  border-radius: 11px;
  background: #fff;
}

.borrow-information > div {
  margin-top: 13px;
}

.borrow-information span {
  color: var(--reader-muted);
  font-size: 8px;
}

.borrow-information strong {
  margin-top: 5px;
  display: block;
  color: var(--reader-text);
  font-size: 9px;
}

.borrow-information p {
  margin: 5px 0 0;
  color: var(--reader-text);
  font-size: 9px;
  line-height: 1.6;
}

.overdue-notice {
  padding: 11px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  border-radius: 9px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 8px;
  line-height: 1.6;
}

.empty-state {
  min-height: 390px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  border: 1px dashed
    var(--reader-border);
  border-radius: 15px;
  background: #fff;
  text-align: center;
}

.empty-state > span {
  width: 75px;
  height: 75px;
  display: grid;
  place-items: center;
  border-radius: 20px;
  background:
    var(--reader-primary-light);
  color: var(--reader-primary);
  font-size: 31px;
}

.empty-state h2 {
  margin: 17px 0 7px;
  color: var(--reader-text);
}

.empty-state p {
  margin: 0;
  color: var(--reader-muted);
}

.empty-state a {
  min-height: 39px;
  margin-top: 18px;
  padding: 0 15px;
  display: inline-flex;
  align-items: center;
  border-radius: 8px;
  background: var(--reader-primary);
  color: #fff;
  font-size: 9px;
  font-weight: 900;
}

.pagination {
  margin-top: 25px;
  display: flex;
  justify-content: center;
  gap: 7px;
}

.pagination button {
  width: 37px;
  height: 37px;
  border: 1px solid
    var(--reader-border);
  border-radius: 8px;
  background: #fff;
}

.pagination button.active {
  border-color: var(--reader-primary);
  background: var(--reader-primary);
  color: #fff;
}

.pagination button:disabled {
  opacity: 0.4;
}

.expand-enter-active,
.expand-leave-active {
  transition:
    opacity 0.2s ease;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
}

@media (max-width: 1000px) {
  .summary-grid {
    grid-template-columns:
      repeat(2, 1fr);
  }

  .history-overview {
    grid-template-columns:
      repeat(2, 1fr);
  }
}

@media (max-width: 800px) {
  .account-layout {
    grid-template-columns: 1fr;
  }

  .history-details {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 550px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .history-toolbar form {
    align-items: stretch;
    flex-direction: column;
  }

  .history-overview {
    grid-template-columns: 1fr;
  }
}
</style>