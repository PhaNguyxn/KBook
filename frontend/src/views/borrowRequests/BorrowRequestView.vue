<script setup>
import {
  computed,
  onMounted,
  reactive,
  ref,
} from "vue";

import { borrowRequestApi } from "@/api/borrowRequestApi";
import { getErrorMessage } from "@/utils/error";
import { formatDate } from "@/utils/date";

const requests = ref([]);
const selectedRequest = ref(null);

const loading = ref(false);
const loadingDetail = ref(false);
const processingId = ref("");

const errorMessage = ref("");
const successMessage = ref("");

const filters = reactive({
  keyword: "",
  status: "",
  page: 1,
  limit: 10,
});

const pagination = reactive({
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
});

const visiblePages = computed(() => {
  const total = pagination.totalPages;
  const current = pagination.page;

  if (total <= 0) {
    return [];
  }

  if (total <= 7) {
    return Array.from(
      {
        length: total,
      },
      (_, index) => index + 1,
    );
  }

  const pages = [1];

  let start = Math.max(
    current - 2,
    2,
  );

  let end = Math.min(
    current + 2,
    total - 1,
  );

  if (current <= 4) {
    end = 5;
  }

  if (current >= total - 3) {
    start = total - 4;
  }

  if (start > 2) {
    pages.push("left-dots");
  }

  for (
    let page = start;
    page <= end;
    page += 1
  ) {
    pages.push(page);
  }

  if (end < total - 1) {
    pages.push("right-dots");
  }

  pages.push(total);

  return pages;
});

const firstRecord = computed(() => {
  if (!pagination.total) {
    return 0;
  }

  return (
    (pagination.page - 1) *
      pagination.limit +
    1
  );
});

const lastRecord = computed(() => {
  return Math.min(
    pagination.page *
      pagination.limit,
    pagination.total,
  );
});

function clearMessages() {
  errorMessage.value = "";
  successMessage.value = "";
}

function getStatusLabel(status) {
  const labels = {
    pending: "Chờ duyệt",
    approved: "Đã duyệt",
    rejected: "Đã từ chối",
    cancelled: "Đã hủy",
  };

  return labels[status] || status;
}

function getStatusClass(status) {
  return `status-${status}`;
}

function getTotalBooks(request) {
  return (request.items || []).reduce(
    (total, item) =>
      total +
      Number(item.quantity || 0),
    0,
  );
}

function getBookSummary(request) {
  const items = request.items || [];

  if (items.length === 0) {
    return "Không có sách";
  }

  const firstTitle =
    items[0]?.book?.title || "Sách";

  if (items.length === 1) {
    return `${firstTitle} (${items[0].quantity})`;
  }

  return `${firstTitle} và ${
    items.length - 1
  } sách khác`;
}

async function loadRequests() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response =
      await borrowRequestApi.getAll({
        keyword:
          filters.keyword.trim() ||
          undefined,

        status:
          filters.status || undefined,

        page: filters.page,
        limit: filters.limit,
      });

    const data =
      response.data.data || {};

    requests.value =
      data.requests || [];

    const pageData =
      data.pagination || {};

    Object.assign(pagination, {
      total:
        Number(pageData.total) || 0,

      page:
        Number(pageData.page) || 1,

      limit:
        Number(pageData.limit) ||
        filters.limit,

      totalPages:
        Number(
          pageData.totalPages,
        ) || 0,

      hasPreviousPage:
        Boolean(
          pageData.hasPreviousPage,
        ),

      hasNextPage:
        Boolean(pageData.hasNextPage),
    });

    filters.page = pagination.page;
  } catch (error) {
    errorMessage.value =
      getErrorMessage(
        error,
        "Không thể tải danh sách yêu cầu",
      );
  } finally {
    loading.value = false;
  }
}

function searchRequests() {
  filters.page = 1;
  loadRequests();
}

function resetFilters() {
  filters.keyword = "";
  filters.status = "";
  filters.page = 1;
  filters.limit = 10;

  loadRequests();
}

function handleLimitChange() {
  filters.page = 1;
  loadRequests();
}

function changePage(page) {
  const nextPage = Number(page);

  if (
    !Number.isInteger(nextPage) ||
    nextPage < 1 ||
    nextPage >
      pagination.totalPages ||
    nextPage === pagination.page
  ) {
    return;
  }

  filters.page = nextPage;
  loadRequests();
}

async function openDetail(request) {
  loadingDetail.value = true;
  selectedRequest.value = request;

  try {
    const response =
      await borrowRequestApi.getById(
        request._id,
      );

    selectedRequest.value =
      response.data.data;
  } catch (error) {
    errorMessage.value =
      getErrorMessage(
        error,
        "Không thể tải chi tiết yêu cầu",
      );

    selectedRequest.value = null;
  } finally {
    loadingDetail.value = false;
  }
}

function closeDetail() {
  selectedRequest.value = null;
}

async function approveRequest(request) {
  const confirmed = window.confirm(
    `Duyệt yêu cầu "${request.requestCode}" của ${request.reader?.fullName || "độc giả"}?`,
  );

  if (!confirmed) {
    return;
  }

  clearMessages();
  processingId.value = request._id;

  try {
    await borrowRequestApi.approve(
      request._id,
    );

    successMessage.value =
      "Duyệt yêu cầu mượn sách thành công";

    closeDetail();
    await loadRequests();
  } catch (error) {
    errorMessage.value =
      getErrorMessage(
        error,
        "Không thể duyệt yêu cầu",
      );
  } finally {
    processingId.value = "";
  }
}

async function rejectRequest(request) {
  const reason = window.prompt(
    `Nhập lý do từ chối yêu cầu "${request.requestCode}":`,
  );

  if (reason === null) {
    return;
  }

  if (!reason.trim()) {
    errorMessage.value =
      "Vui lòng nhập lý do từ chối";

    return;
  }

  clearMessages();
  processingId.value = request._id;

  try {
    await borrowRequestApi.reject(
      request._id,
      reason.trim(),
    );

    successMessage.value =
      "Đã từ chối yêu cầu mượn sách";

    closeDetail();
    await loadRequests();
  } catch (error) {
    errorMessage.value =
      getErrorMessage(
        error,
        "Không thể từ chối yêu cầu",
      );
  } finally {
    processingId.value = "";
  }
}

onMounted(loadRequests);
</script>

<template>
  <section class="request-page">
    <div class="content-card request-header">
      <div>
        <h1 class="page-title">
          Quản lý yêu cầu mượn sách
        </h1>

        <p class="page-description">
          Xem, duyệt và từ chối các yêu cầu
          mượn sách của độc giả
        </p>
      </div>

      <button
        type="button"
        class="btn btn-primary"
        :disabled="loading"
        @click="loadRequests"
      >
        <i
          class="bi bi-arrow-clockwise me-2"
        />

        Làm mới
      </button>
    </div>

    <div
      v-if="errorMessage"
      class="alert alert-danger mt-3"
    >
      {{ errorMessage }}
    </div>

    <div
      v-if="successMessage"
      class="alert alert-success mt-3"
    >
      {{ successMessage }}
    </div>

    <div class="content-card filter-card">
      <form
        class="filter-grid"
        @submit.prevent="searchRequests"
      >
        <div class="keyword-filter">
          <label class="form-label">
            Tìm kiếm
          </label>

          <input
            v-model="filters.keyword"
            type="search"
            class="form-control"
            placeholder="Mã yêu cầu, mã độc giả, tên hoặc số điện thoại"
          />
        </div>

        <div>
          <label class="form-label">
            Trạng thái
          </label>

          <select
            v-model="filters.status"
            class="form-select"
          >
            <option value="">
              Tất cả trạng thái
            </option>

            <option value="pending">
              Chờ duyệt
            </option>

            <option value="approved">
              Đã duyệt
            </option>

            <option value="rejected">
              Đã từ chối
            </option>

            <option value="cancelled">
              Đã hủy
            </option>
          </select>
        </div>

        <div>
          <label class="form-label">
            Số dòng
          </label>

          <select
            v-model.number="filters.limit"
            class="form-select"
            @change="handleLimitChange"
          >
            <option :value="5">
              5 dòng
            </option>

            <option :value="10">
              10 dòng
            </option>

            <option :value="20">
              20 dòng
            </option>

            <option :value="50">
              50 dòng
            </option>
          </select>
        </div>

        <div class="filter-actions">
          <button
            type="button"
            class="btn btn-outline-secondary"
            @click="resetFilters"
          >
            Đặt lại
          </button>

          <button
            type="submit"
            class="btn btn-primary"
          >
            <i class="bi bi-search me-1" />
            Tìm kiếm
          </button>
        </div>
      </form>
    </div>

    <div class="content-card table-card">
      <div
        v-if="loading"
        class="loading-state"
      >
        <div
          class="spinner-border text-primary"
        />

        <span>Đang tải yêu cầu...</span>
      </div>

      <div
        v-else
        class="table-responsive"
      >
        <table class="table align-middle">
          <thead>
            <tr>
              <th>STT</th>
              <th>Mã yêu cầu</th>
              <th>Độc giả</th>
              <th>Sách yêu cầu</th>
              <th>Số lượng</th>
              <th>Ngày yêu cầu</th>
              <th>Hạn trả</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(
                request,
                index
              ) in requests"
              :key="request._id"
            >
              <td class="text-center">
                {{
                  (pagination.page - 1) *
                    pagination.limit +
                  index +
                  1
                }}
              </td>

              <td>
                <strong>
                  {{ request.requestCode }}
                </strong>
              </td>

              <td>
                <strong>
                  {{
                    request.reader?.fullName ||
                    "—"
                  }}
                </strong>

                <small class="secondary-text">
                  {{
                    request.reader?.readerCode ||
                    "—"
                  }}
                  ·
                  {{
                    request.reader?.phone ||
                    "—"
                  }}
                </small>
              </td>

              <td>
                <span class="book-summary">
                  {{ getBookSummary(request) }}
                </span>
              </td>

              <td class="text-center">
                {{ getTotalBooks(request) }}
              </td>

              <td>
                {{
                  formatDate(
                    request.requestDate ||
                      request.createdAt,
                  )
                }}
              </td>

              <td>
                {{
                  formatDate(
                    request.dueDate,
                  )
                }}
              </td>

              <td class="text-center">
                <span
                  class="status-badge"
                  :class="
                    getStatusClass(
                      request.status,
                    )
                  "
                >
                  {{
                    getStatusLabel(
                      request.status,
                    )
                  }}
                </span>
              </td>

              <td>
                <div class="action-buttons">
                  <button
                    type="button"
                    class="btn btn-sm btn-info"
                    title="Xem chi tiết"
                    @click="openDetail(request)"
                  >
                    <i class="bi bi-eye-fill" />
                  </button>

                  <button
                    v-if="
                      request.status ===
                      'pending'
                    "
                    type="button"
                    class="btn btn-sm btn-success"
                    title="Duyệt yêu cầu"
                    :disabled="
                      processingId ===
                      request._id
                    "
                    @click="
                      approveRequest(request)
                    "
                  >
                    <i
                      class="bi bi-check-lg"
                    />
                  </button>

                  <button
                    v-if="
                      request.status ===
                      'pending'
                    "
                    type="button"
                    class="btn btn-sm btn-danger"
                    title="Từ chối"
                    :disabled="
                      processingId ===
                      request._id
                    "
                    @click="
                      rejectRequest(request)
                    "
                  >
                    <i class="bi bi-x-lg" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="requests.length === 0">
              <td
                colspan="9"
                class="empty-state"
              >
                <i
                  class="bi bi-inbox fs-1"
                />

                <p>
                  Không có yêu cầu mượn sách
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="
          !loading &&
          pagination.total > 0
        "
        class="pagination-container"
      >
        <div class="pagination-info">
          Hiển thị
          <strong>{{ firstRecord }}</strong>
          đến
          <strong>{{ lastRecord }}</strong>
          trong tổng số
          <strong>
            {{ pagination.total }}
          </strong>
          yêu cầu
        </div>

        <nav class="pagination-buttons">
          <button
            type="button"
            class="page-button"
            :disabled="
              !pagination.hasPreviousPage
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

          <template
            v-for="page in visiblePages"
            :key="page"
          >
            <span
              v-if="
                page === 'left-dots' ||
                page === 'right-dots'
              "
              class="page-dots"
            >
              …
            </span>

            <button
              v-else
              type="button"
              class="page-button"
              :class="{
                active:
                  page ===
                  pagination.page,
              }"
              @click="changePage(page)"
            >
              {{ page }}
            </button>
          </template>

          <button
            type="button"
            class="page-button"
            :disabled="
              !pagination.hasNextPage
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
      </div>
    </div>

    <div
      v-if="selectedRequest"
      class="modal-overlay"
      @click.self="closeDetail"
    >
      <div class="detail-modal">
        <div class="modal-heading">
          <div>
            <h2>
              Chi tiết yêu cầu
              {{ selectedRequest.requestCode }}
            </h2>

            <span
              class="status-badge"
              :class="
                getStatusClass(
                  selectedRequest.status,
                )
              "
            >
              {{
                getStatusLabel(
                  selectedRequest.status,
                )
              }}
            </span>
          </div>

          <button
            type="button"
            class="close-button"
            @click="closeDetail"
          >
            ×
          </button>
        </div>

        <div
          v-if="loadingDetail"
          class="loading-state"
        >
          Đang tải chi tiết...
        </div>

        <template v-else>
          <div class="detail-grid">
            <div>
              <span>Độc giả</span>
              <strong>
                {{
                  selectedRequest.reader
                    ?.fullName || "—"
                }}
              </strong>
            </div>

            <div>
              <span>Mã độc giả</span>
              <strong>
                {{
                  selectedRequest.reader
                    ?.readerCode || "—"
                }}
              </strong>
            </div>

            <div>
              <span>Số điện thoại</span>
              <strong>
                {{
                  selectedRequest.reader
                    ?.phone || "—"
                }}
              </strong>
            </div>

            <div>
              <span>Hạn trả</span>
              <strong>
                {{
                  formatDate(
                    selectedRequest.dueDate,
                  )
                }}
              </strong>
            </div>
          </div>

          <h3 class="book-heading">
            Danh sách sách
          </h3>

          <div class="book-list">
            <article
              v-for="item in selectedRequest.items"
              :key="item.book?._id"
              class="book-item"
            >
              <img
                v-if="item.book?.image"
                :src="item.book.image"
                :alt="item.book.title"
              />

              <div>
                <strong>
                  {{
                    item.book?.title || "—"
                  }}
                </strong>

                <small>
                  Mã:
                  {{
                    item.book?.bookCode ||
                    "—"
                  }}
                  · Số lượng:
                  {{ item.quantity }}
                </small>
              </div>
            </article>
          </div>

          <div
            v-if="selectedRequest.note"
            class="note-box"
          >
            <strong>Ghi chú:</strong>
            {{ selectedRequest.note }}
          </div>

          <div
            v-if="
              selectedRequest.rejectReason
            "
            class="reject-box"
          >
            <strong>Lý do từ chối:</strong>
            {{
              selectedRequest.rejectReason
            }}
          </div>

          <div
            v-if="
              selectedRequest.status ===
              'pending'
            "
            class="modal-actions"
          >
            <button
              type="button"
              class="btn btn-outline-danger"
              @click="
                rejectRequest(
                  selectedRequest,
                )
              "
            >
              Từ chối
            </button>

            <button
              type="button"
              class="btn btn-success"
              @click="
                approveRequest(
                  selectedRequest,
                )
              "
            >
              Duyệt yêu cầu
            </button>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped>
.request-page {
  max-width: 1550px;
  margin: 0 auto;
}

.request-header {
  min-height: 112px;
  padding: 26px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
}

.filter-card {
  margin-top: 28px;
  padding: 22px;
}

.filter-grid {
  display: grid;
  grid-template-columns:
    minmax(280px, 2fr)
    minmax(160px, 1fr)
    120px
    auto;
  align-items: end;
  gap: 16px;
}

.filter-actions {
  display: flex;
  gap: 8px;
}

.table-card {
  margin-top: 20px;
  padding: 20px;
}

.table {
  min-width: 1250px;
}

.loading-state {
  min-height: 150px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  color: #64748b;
}

.secondary-text {
  margin-top: 4px;
  display: block;
  color: #94a3b8;
}

.book-summary {
  display: inline-block;
  max-width: 260px;
}

.status-badge {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
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

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.empty-state {
  padding: 55px !important;
  text-align: center;
  color: #94a3b8;
}

.empty-state p {
  margin: 10px 0 0;
}

.pagination-container {
  padding-top: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  border-top: 1px solid #e5e7eb;
}

.pagination-info {
  color: #64748b;
  font-size: 13px;
}

.pagination-buttons {
  display: flex;
  gap: 6px;
}

.page-button {
  min-width: 36px;
  height: 36px;
  border: 1px solid #dbe3ee;
  border-radius: 7px;
  background: white;
  color: #475569;
}

.page-button.active {
  border-color: #3284f6;
  background: #3284f6;
  color: white;
}

.page-button:disabled {
  opacity: 0.45;
}

.page-dots {
  min-width: 28px;
  display: grid;
  place-items: center;
  color: #94a3b8;
}

.modal-overlay {
  position: fixed;
  z-index: 3000;
  inset: 0;
  padding: 20px;
  display: grid;
  place-items: center;
  background: rgb(15 23 42 / 50%);
}

.detail-modal {
  width: min(820px, 100%);
  max-height: calc(100vh - 40px);
  padding: 25px;
  overflow-y: auto;
  border-radius: 12px;
  background: white;
}

.modal-heading {
  margin-bottom: 22px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.modal-heading h2 {
  margin: 0 0 10px;
  color: #245bc4;
  font-size: 22px;
}

.close-button {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: #f1f5f9;
  font-size: 24px;
}

.detail-grid {
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.detail-grid > div {
  padding: 14px;
  border-radius: 8px;
  background: #f8fafc;
}

.detail-grid span,
.detail-grid strong {
  display: block;
}

.detail-grid span {
  margin-bottom: 4px;
  color: #64748b;
  font-size: 13px;
}

.book-heading {
  margin: 24px 0 12px;
  font-size: 17px;
}

.book-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.book-item {
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.book-item img {
  width: 48px;
  height: 66px;
  object-fit: cover;
  border-radius: 5px;
}

.book-item strong,
.book-item small {
  display: block;
}

.book-item small {
  margin-top: 5px;
  color: #64748b;
}

.note-box,
.reject-box {
  margin-top: 16px;
  padding: 13px;
  border-radius: 8px;
}

.note-box {
  background: #eff6ff;
  color: #1e40af;
}

.reject-box {
  background: #fef2f2;
  color: #b91c1c;
}

.modal-actions {
  margin-top: 22px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 950px) {
  .filter-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .keyword-filter {
    grid-column: 1 / -1;
  }
}

@media (max-width: 650px) {
  .request-header {
    align-items: stretch;
    flex-direction: column;
  }

  .filter-grid {
    grid-template-columns: 1fr;
  }

  .keyword-filter {
    grid-column: auto;
  }

  .filter-actions button {
    flex: 1;
  }

  .pagination-container {
    align-items: flex-start;
    flex-direction: column;
  }

  .pagination-buttons {
    width: 100%;
    overflow-x: auto;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>