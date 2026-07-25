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

const serverUrl =
  import.meta.env.VITE_SERVER_URL ||
  "http://localhost:3000";

/* =========================================
   STATE
========================================= */

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

/* =========================================
   COMPUTED
========================================= */

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
    start = 2;
    end = 5;
  }

  if (current >= total - 3) {
    start = total - 4;
    end = total - 1;
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
  if (pagination.total === 0) {
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

const selectedTotalBooks = computed(() => {
  return selectedRequest.value
    ? getTotalBooks(
        selectedRequest.value,
      )
    : 0;
});

/* =========================================
   HÀM HỖ TRỢ
========================================= */

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

  return (
    labels[status] ||
    "Không xác định"
  );
}

function getStatusClass(status) {
  return `status-${status}`;
}

function getStatusIcon(status) {
  const icons = {
    pending: "bi-clock-fill",
    approved:
      "bi-check-circle-fill",
    rejected: "bi-x-circle-fill",
    cancelled: "bi-slash-circle-fill",
  };

  return (
    icons[status] ||
    "bi-question-circle-fill"
  );
}

function getReaderName(request) {
  const reader = request?.reader;

  if (!reader) {
    return "Không có thông tin";
  }

  if (reader.fullName) {
    return reader.fullName;
  }

  return `${reader.lastName || ""} ${
    reader.firstName || ""
  }`.trim() || "Không có thông tin";
}

function getReaderInitials(request) {
  const name = getReaderName(request);

  if (
    !name ||
    name === "Không có thông tin"
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

  return `${
    words[0].charAt(0)
  }${
    words[
      words.length - 1
    ].charAt(0)
  }`.toUpperCase();
}

function getTotalBooks(request) {
  return (
    request?.items || []
  ).reduce(
    (total, item) =>
      total +
      Number(item.quantity || 0),
    0,
  );
}

function getBookSummary(request) {
  const items =
    request?.items || [];

  if (items.length === 0) {
    return "Không có sách";
  }

  const firstTitle =
    items[0]?.book?.title ||
    "Sách không xác định";

  if (items.length === 1) {
    return `${firstTitle} × ${Number(
      items[0]?.quantity || 0,
    )}`;
  }

  return `${firstTitle} và ${
    items.length - 1
  } sách khác`;
}

function getBookImage(image) {
  if (!image) {
    return "";
  }

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("data:")
  ) {
    return image;
  }

  return `${serverUrl}${
    image.startsWith("/")
      ? image
      : `/${image}`
  }`;
}

/* =========================================
   TẢI DANH SÁCH YÊU CẦU
========================================= */

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
          filters.status ||
          undefined,

        page: filters.page,
        limit: filters.limit,
      });

    const payload =
      response?.data?.data ??
      response?.data ??
      {};

    if (Array.isArray(payload)) {
      requests.value = payload;

      Object.assign(pagination, {
        total: payload.length,
        page: 1,
        limit:
          payload.length ||
          filters.limit,
        totalPages:
          payload.length > 0
            ? 1
            : 0,
        hasPreviousPage: false,
        hasNextPage: false,
      });

      return;
    }

    requests.value =
      payload.requests ||
      payload.items ||
      payload.results ||
      [];

    const pageData =
      payload.pagination || {};

    const total =
      Number(
        pageData.total ??
          payload.total ??
          requests.value.length,
      ) || 0;

    const page =
      Number(
        pageData.page ??
          filters.page,
      ) || 1;

    const limit =
      Number(
        pageData.limit ??
          filters.limit,
      ) || 10;

    const totalPages =
      Number(
        pageData.totalPages ??
          Math.ceil(
            total / limit,
          ),
      ) || 0;

    Object.assign(pagination, {
      total,
      page,
      limit,
      totalPages,

      hasPreviousPage:
        pageData.hasPreviousPage ??
        page > 1,

      hasNextPage:
        pageData.hasNextPage ??
        page < totalPages,
    });

    filters.page =
      pagination.page;
  } catch (error) {
    console.error(
      "Load borrow requests error:",
      error,
    );

    requests.value = [];

    errorMessage.value =
      getErrorMessage(
        error,
        "Không thể tải danh sách yêu cầu mượn sách",
      );
  } finally {
    loading.value = false;
  }
}

/* =========================================
   BỘ LỌC
========================================= */

function searchRequests() {
  clearMessages();
  filters.page = 1;
  loadRequests();
}

function handleStatusChange() {
  clearMessages();
  filters.page = 1;
  loadRequests();
}

function resetFilters() {
  clearMessages();

  filters.keyword = "";
  filters.status = "";
  filters.page = 1;
  filters.limit = 10;

  loadRequests();
}

function handleLimitChange() {
  clearMessages();
  filters.page = 1;
  loadRequests();
}

/* =========================================
   PHÂN TRANG
========================================= */

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

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

/* =========================================
   CHI TIẾT YÊU CẦU
========================================= */

async function openDetail(request) {
  loadingDetail.value = true;
  errorMessage.value = "";
  selectedRequest.value = request;

  try {
    const response =
      await borrowRequestApi.getById(
        request._id,
      );

    selectedRequest.value =
      response?.data?.data ??
      response?.data ??
      request;
  } catch (error) {
    console.error(
      "Load request detail error:",
      error,
    );

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
  if (processingId.value) {
    return;
  }

  selectedRequest.value = null;
}

/* =========================================
   DUYỆT YÊU CẦU
========================================= */

async function approveRequest(request) {
  const readerName =
    getReaderName(request);

  const confirmed =
    window.confirm(
      `Bạn có chắc muốn duyệt yêu cầu "${request.requestCode}" của "${readerName}"?`,
    );

  if (!confirmed) {
    return;
  }

  clearMessages();
  processingId.value =
    request._id;

  try {
    await borrowRequestApi.approve(
      request._id,
    );

    successMessage.value =
      "Duyệt yêu cầu mượn sách thành công";

    selectedRequest.value = null;

    await loadRequests();
  } catch (error) {
    errorMessage.value =
      getErrorMessage(
        error,
        "Không thể duyệt yêu cầu mượn sách",
      );
  } finally {
    processingId.value = "";
  }
}

/* =========================================
   TỪ CHỐI YÊU CẦU
========================================= */

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
  processingId.value =
    request._id;

  try {
    await borrowRequestApi.reject(
      request._id,
      reason.trim(),
    );

    successMessage.value =
      "Đã từ chối yêu cầu mượn sách";

    selectedRequest.value = null;

    await loadRequests();
  } catch (error) {
    errorMessage.value =
      getErrorMessage(
        error,
        "Không thể từ chối yêu cầu mượn sách",
      );
  } finally {
    processingId.value = "";
  }
}

/* =========================================
   KHỞI TẠO
========================================= */

onMounted(() => {
  loadRequests();
});
</script>

<template>
  <section class="request-page">
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

    <!-- Bộ lọc -->
    <div class="filter-card">
      <div class="filter-heading">
        <div>
          <h2>
            Quản lý yêu cầu
          </h2>
        </div>

        <button
          type="button"
          class="refresh-button"
          :disabled="loading"
          @click="loadRequests"
        >
          <i
            class="bi bi-arrow-clockwise"
            :class="{
              rotating: loading,
            }"
          />

          Làm mới
        </button>
      </div>

      <form
        class="filter-grid"
        @submit.prevent="searchRequests"
      >
        <!-- Tìm kiếm -->
        <div class="keyword-filter">
          <label for="requestKeyword">
            Tìm kiếm yêu cầu
          </label>

          <div
            class="input-icon-wrapper"
          >
            <i class="bi bi-search" />

            <input
              id="requestKeyword"
              v-model="filters.keyword"
              type="search"
              placeholder="Nhập mã yêu cầu, mã độc giả, tên hoặc số điện thoại..."
            />
          </div>
        </div>

        <!-- Trạng thái -->
        <div>
          <label for="requestStatus">
            Trạng thái
          </label>

          <select
            id="requestStatus"
            v-model="filters.status"
            class="custom-select"
            @change="
              handleStatusChange
            "
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

        <!-- Số dòng -->
        <div>
          <label for="requestLimit">
            Số dòng
          </label>

          <select
            id="requestLimit"
            v-model.number="
              filters.limit
            "
            class="custom-select"
            @change="
              handleLimitChange
            "
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

        <!-- Đặt lại -->
        <button
          type="button"
          class="reset-filter-button"
          :disabled="loading"
          @click="resetFilters"
        >
          <i
            class="bi bi-arrow-counterclockwise"
          />

          Đặt lại
        </button>

        <!-- Tìm kiếm -->
        <button
          type="submit"
          class="search-button"
          :disabled="loading"
        >
          <i class="bi bi-search" />

          {{
            loading
              ? "Đang tìm..."
              : "Tìm kiếm"
          }}
        </button>
      </form>
    </div>

    <!-- Danh sách yêu cầu -->
    <div class="request-table-card">
      <div class="table-card-header">
        <div>
          <h2>
            Danh sách yêu cầu mượn sách
          </h2>

          <p>
            Tổng cộng
            <strong>
              {{ pagination.total }}
            </strong>
            yêu cầu.
          </p>
        </div>

        <div class="request-statistic">
          <div class="statistic-icon">
            <i class="bi bi-journal-text" />
          </div>

          <div>
            <span>Tổng yêu cầu</span>

            <strong>
              {{ pagination.total }}
            </strong>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div
        v-if="loading"
        class="loading-state"
      >
        <div class="loading-icon">
          <div
            class="spinner-border text-primary"
            role="status"
          />
        </div>

        <strong>
          Đang tải danh sách yêu cầu
        </strong>

        <span>
          Vui lòng chờ trong giây lát...
        </span>
      </div>

      <!-- Bảng dữ liệu -->
      <div
        v-else
        class="table-responsive"
      >
        <table class="request-table">
          <thead>
            <tr>
              <th class="stt-column">
                STT
              </th>

              <th>Yêu cầu</th>

              <th>Độc giả</th>

              <th>Sách yêu cầu</th>

              <th class="quantity-column">
                Số lượng
              </th>

              <th>Ngày yêu cầu</th>

              <th>Hạn trả</th>

              <th>Trạng thái</th>

              <th class="action-column">
                Thao tác
              </th>
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
              <!-- STT -->
              <td class="stt-cell">
                {{
                  (pagination.page - 1) *
                    pagination.limit +
                  index +
                  1
                }}
              </td>

              <!-- Mã yêu cầu -->
              <td>
                <div
                  class="request-information"
                >
                  <div class="request-icon">
                    <i
                      class="bi bi-file-earmark-text"
                    />
                  </div>

                  <div
                    class="request-text"
                  >
                    <strong>
                      {{
                        request.requestCode ||
                        "Chưa có mã"
                      }}
                    </strong>

                    <span>
                      {{
                        request.items?.length ||
                        0
                      }}
                      đầu sách
                    </span>
                  </div>
                </div>
              </td>

              <!-- Độc giả -->
              <td>
                <div
                  class="reader-information"
                >
                  <div
                    class="reader-avatar"
                  >
                    {{
                      getReaderInitials(
                        request,
                      )
                    }}
                  </div>

                  <div class="reader-text">
                    <strong>
                      {{
                        getReaderName(
                          request,
                        )
                      }}
                    </strong>

                    <span>
                      {{
                        request.reader
                          ?.readerCode ||
                        "Chưa có mã"
                      }}
                    </span>

                    <small>
                      <i
                        class="bi bi-telephone"
                      />

                      {{
                        request.reader
                          ?.phone ||
                        "Chưa có SĐT"
                      }}
                    </small>
                  </div>
                </div>
              </td>

              <!-- Sách -->
              <td>
                <div
                  class="book-summary"
                  :title="
                    getBookSummary(
                      request,
                    )
                  "
                >
                  <i class="bi bi-book" />

                  <span>
                    {{
                      getBookSummary(
                        request,
                      )
                    }}
                  </span>
                </div>
              </td>

              <!-- Số lượng -->
              <td class="quantity-cell">
                <span
                  class="quantity-badge"
                >
                  {{
                    getTotalBooks(
                      request,
                    )
                  }}
                </span>
              </td>

              <!-- Ngày yêu cầu -->
              <td>
                <div class="date-value">
                  <i
                    class="bi bi-calendar3"
                  />

                  <span>
                    {{
                      formatDate(
                        request.requestDate ||
                          request.createdAt,
                      )
                    }}
                  </span>
                </div>
              </td>

              <!-- Hạn trả -->
              <td>
                <div
                  class="date-value due-date"
                >
                  <i
                    class="bi bi-calendar-event"
                  />

                  <span>
                    {{
                      request.dueDate
                        ? formatDate(
                            request.dueDate,
                          )
                        : "—"
                    }}
                  </span>
                </div>
              </td>

              <!-- Trạng thái -->
              <td>
                <span
                  class="status-badge"
                  :class="
                    getStatusClass(
                      request.status,
                    )
                  "
                >
                  <i
                    class="bi"
                    :class="
                      getStatusIcon(
                        request.status,
                      )
                    "
                  />

                  {{
                    getStatusLabel(
                      request.status,
                    )
                  }}
                </span>
              </td>

              <!-- Thao tác -->
              <td>
                <div
                  class="action-buttons"
                >
                  <button
                    type="button"
                    class="action-button action-view"
                    title="Xem chi tiết"
                    @click="
                      openDetail(request)
                    "
                  >
                    <i class="bi bi-eye" />
                  </button>

                  <button
                    v-if="
                      request.status ===
                      'pending'
                    "
                    type="button"
                    class="action-button action-approve"
                    title="Duyệt yêu cầu"
                    :disabled="
                      processingId ===
                      request._id
                    "
                    @click="
                      approveRequest(
                        request,
                      )
                    "
                  >
                    <span
                      v-if="
                        processingId ===
                        request._id
                      "
                      class="spinner-border spinner-border-sm"
                    />

                    <i
                      v-else
                      class="bi bi-check-lg"
                    />
                  </button>

                  <button
                    v-if="
                      request.status ===
                      'pending'
                    "
                    type="button"
                    class="action-button action-reject"
                    title="Từ chối yêu cầu"
                    :disabled="
                      processingId ===
                      request._id
                    "
                    @click="
                      rejectRequest(
                        request,
                      )
                    "
                  >
                    <i class="bi bi-x-lg" />
                  </button>
                </div>
              </td>
            </tr>

            <!-- Không có dữ liệu -->
            <tr
              v-if="
                requests.length === 0
              "
            >
              <td
                colspan="9"
                class="empty-table-cell"
              >
                <div class="empty-state">
                  <div class="empty-icon">
                    <i
                      class="bi bi-inbox"
                    />
                  </div>

                  <h3>
                    Không tìm thấy yêu cầu
                  </h3>

                  <p>
                    Không có yêu cầu mượn
                    sách phù hợp với điều
                    kiện tìm kiếm hiện tại.
                  </p>

                  <button
                    type="button"
                    class="empty-reset-button"
                    @click="
                      resetFilters
                    "
                  >
                    <i
                      class="bi bi-arrow-counterclockwise"
                    />

                    Xóa bộ lọc
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Phân trang -->
      <div
        v-if="
          !loading &&
          pagination.total > 0
        "
        class="pagination-container"
      >
        <div
          class="pagination-information"
        >
          Hiển thị

          <strong>
            {{ firstRecord }}
          </strong>

          đến

          <strong>
            {{ lastRecord }}
          </strong>

          trong tổng số

          <strong>
            {{ pagination.total }}
          </strong>

          yêu cầu
        </div>

        <nav
          class="pagination-buttons"
          aria-label="Phân trang yêu cầu"
        >
          <button
            type="button"
            class="page-button"
            :disabled="
              !pagination
                .hasPreviousPage
            "
            title="Trang trước"
            @click="
              changePage(
                pagination.page -
                  1,
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
                page ===
                  'left-dots' ||
                page ===
                  'right-dots'
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
              @click="
                changePage(page)
              "
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
            title="Trang sau"
            @click="
              changePage(
                pagination.page +
                  1,
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

    <!-- Modal chi tiết -->
    <div
      v-if="selectedRequest"
      class="modal-overlay"
      @click.self="closeDetail"
    >
      <div
        class="detail-modal"
        role="dialog"
        aria-modal="true"
      >
        <!-- Header modal -->
        <div class="modal-heading">
          <div
            class="modal-heading-content"
          >
            <div class="modal-icon">
              <i
                class="bi bi-file-earmark-text"
              />
            </div>

            <div>
              <span class="modal-label">
                Chi tiết yêu cầu
              </span>

              <h2>
                {{
                  selectedRequest.requestCode ||
                  "Chưa có mã"
                }}
              </h2>
            </div>
          </div>

          <div
            class="modal-heading-actions"
          >
            <span
              class="status-badge"
              :class="
                getStatusClass(
                  selectedRequest.status,
                )
              "
            >
              <i
                class="bi"
                :class="
                  getStatusIcon(
                    selectedRequest.status,
                  )
                "
              />

              {{
                getStatusLabel(
                  selectedRequest.status,
                )
              }}
            </span>

            <button
              type="button"
              class="close-button"
              title="Đóng"
              :disabled="
                Boolean(processingId)
              "
              @click="closeDetail"
            >
              <i class="bi bi-x-lg" />
            </button>
          </div>
        </div>

        <!-- Loading chi tiết -->
        <div
          v-if="loadingDetail"
          class="modal-loading"
        >
          <div
            class="spinner-border text-primary"
          />

          <strong>
            Đang tải chi tiết yêu cầu
          </strong>
        </div>

        <template v-else>
          <!-- Thông tin tổng quan -->
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-icon">
                <i class="bi bi-person" />
              </span>

              <div>
                <small>Độc giả</small>

                <strong>
                  {{
                    getReaderName(
                      selectedRequest,
                    )
                  }}
                </strong>
              </div>
            </div>

            <div class="detail-item">
              <span class="detail-icon">
                <i class="bi bi-upc-scan" />
              </span>

              <div>
                <small>Mã độc giả</small>

                <strong>
                  {{
                    selectedRequest.reader
                      ?.readerCode ||
                    "—"
                  }}
                </strong>
              </div>
            </div>

            <div class="detail-item">
              <span class="detail-icon">
                <i
                  class="bi bi-telephone"
                />
              </span>

              <div>
                <small>
                  Số điện thoại
                </small>

                <strong>
                  {{
                    selectedRequest.reader
                      ?.phone ||
                    "—"
                  }}
                </strong>
              </div>
            </div>

            <div class="detail-item">
              <span class="detail-icon">
                <i
                  class="bi bi-calendar-plus"
                />
              </span>

              <div>
                <small>
                  Ngày yêu cầu
                </small>

                <strong>
                  {{
                    formatDate(
                      selectedRequest
                        .requestDate ||
                        selectedRequest
                          .createdAt,
                    )
                  }}
                </strong>
              </div>
            </div>

            <div class="detail-item">
              <span class="detail-icon">
                <i
                  class="bi bi-calendar-event"
                />
              </span>

              <div>
                <small>Hạn trả</small>

                <strong>
                  {{
                    selectedRequest.dueDate
                      ? formatDate(
                          selectedRequest
                            .dueDate,
                        )
                      : "—"
                  }}
                </strong>
              </div>
            </div>

            <div class="detail-item">
              <span class="detail-icon">
                <i
                  class="bi bi-stack"
                />
              </span>

              <div>
                <small>
                  Tổng số lượng
                </small>

                <strong>
                  {{
                    selectedTotalBooks
                  }}
                  quyển
                </strong>
              </div>
            </div>
          </div>

          <!-- Danh sách sách -->
          <div class="book-section">
            <div class="section-heading">
              <div>
                <h3>
                  Danh sách sách yêu cầu
                </h3>

                <p>
                  {{
                    selectedRequest.items
                      ?.length || 0
                  }}
                  đầu sách,
                  {{ selectedTotalBooks }}
                  quyển.
                </p>
              </div>
            </div>

            <div class="book-list">
              <article
                v-for="(
                  item,
                  index
                ) in selectedRequest.items ||
                  []"
                :key="
                  item.book?._id ||
                  index
                "
                class="book-item"
              >
                <div class="book-cover">
                  <img
                    v-if="item.book?.image"
                    :src="
                      getBookImage(
                        item.book.image,
                      )
                    "
                    :alt="
                      item.book?.title ||
                      'Ảnh sách'
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
                  <span class="book-code">
                    {{
                      item.book?.bookCode ||
                      "CHƯA CÓ MÃ"
                    }}
                  </span>

                  <strong>
                    {{
                      item.book?.title ||
                      "Sách không xác định"
                    }}
                  </strong>

                  <small>
                    {{
                      item.book?.author ||
                      "Chưa cập nhật tác giả"
                    }}
                  </small>
                </div>

                <div
                  class="book-quantity"
                >
                  <span>Số lượng</span>

                  <strong>
                    {{
                      Number(
                        item.quantity ||
                          0,
                      )
                    }}
                  </strong>
                </div>
              </article>

              <div
                v-if="
                  !selectedRequest.items
                    ?.length
                "
                class="empty-book-list"
              >
                <i class="bi bi-book" />

                Không có thông tin sách.
              </div>
            </div>
          </div>

          <!-- Ghi chú -->
          <div
            v-if="
              selectedRequest.note
            "
            class="information-box note-box"
          >
            <i
              class="bi bi-chat-left-text"
            />

            <div>
              <strong>
                Ghi chú của độc giả
              </strong>

              <p>
                {{
                  selectedRequest.note
                }}
              </p>
            </div>
          </div>

          <!-- Lý do từ chối -->
          <div
            v-if="
              selectedRequest
                .rejectReason
            "
            class="information-box reject-box"
          >
            <i
              class="bi bi-exclamation-triangle"
            />

            <div>
              <strong>
                Lý do từ chối
              </strong>

              <p>
                {{
                  selectedRequest
                    .rejectReason
                }}
              </p>
            </div>
          </div>

          <!-- Nút modal -->
          <div class="modal-actions">
            <button
              type="button"
              class="modal-close-button"
              :disabled="
                Boolean(processingId)
              "
              @click="closeDetail"
            >
              Đóng
            </button>

            <template
              v-if="
                selectedRequest.status ===
                'pending'
              "
            >
              <button
                type="button"
                class="modal-reject-button"
                :disabled="
                  processingId ===
                  selectedRequest._id
                "
                @click="
                  rejectRequest(
                    selectedRequest,
                  )
                "
              >
                <i class="bi bi-x-lg" />

                Từ chối
              </button>

              <button
                type="button"
                class="modal-approve-button"
                :disabled="
                  processingId ===
                  selectedRequest._id
                "
                @click="
                  approveRequest(
                    selectedRequest,
                  )
                "
              >
                <span
                  v-if="
                    processingId ===
                    selectedRequest._id
                  "
                  class="spinner-border spinner-border-sm"
                />

                <i
                  v-else
                  class="bi bi-check-lg"
                />

                Duyệt yêu cầu
              </button>
            </template>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped>
.request-page {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 22px;
  overflow-x: hidden;
}

/* =========================================
   CARD CHUNG
========================================= */

.filter-card,
.request-table-card {
  width: 100%;
  min-width: 0;
  border: 1px solid #e7edf5;
  border-radius: 21px;
  background: #fff;
  box-shadow:
    0 10px 28px
    rgb(15 23 42 / 6%);
}

/* =========================================
   THÔNG BÁO
========================================= */

.custom-alert {
  min-height: 48px;
  padding: 12px 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.custom-alert > span {
  flex: 1;
}

.custom-alert > button {
  width: 28px;
  height: 28px;
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
   BỘ LỌC
========================================= */

.filter-card {
  padding: 24px;
}

.filter-heading {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 17px;
}

.filter-heading h2,
.table-card-header h2 {
  margin: 0;
  color: #1e3a8a;
  font-size: 20px;
  font-weight: 800;
}

.filter-heading p,
.table-card-header p {
  margin: 6px 0 0;
  color: #94a3b8;
  font-size: 12px;
}

.table-card-header p strong {
  color: #2563eb;
}

.refresh-button {
  height: 43px;
  padding: 0 17px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  transition:
    transform 0.2s ease,
    background 0.2s ease;
}

.refresh-button:hover:not(:disabled) {
  background: #dbeafe;
  transform: translateY(-1px);
}

.refresh-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.rotating {
  animation: rotate 0.8s linear
    infinite;
}

@keyframes rotate {
  to {
    transform: rotate(360deg);
  }
}

.filter-grid {
  display: grid;
  grid-template-columns:
    minmax(310px, 2fr)
    minmax(170px, 1fr)
    minmax(110px, 0.65fr)
    110px
    110px;
  align-items: end;
  gap: 13px;
}

.filter-grid > div,
.filter-grid > button {
  min-width: 0;
}

.filter-grid label {
  margin-bottom: 7px;
  display: block;
  color: #475569;
  font-size: 11px;
  font-weight: 800;
}

.input-icon-wrapper {
  position: relative;
}

.input-icon-wrapper i {
  position: absolute;
  top: 50%;
  left: 14px;
  color: #94a3b8;
  transform: translateY(-50%);
}

.input-icon-wrapper input,
.custom-select {
  width: 100%;
  height: 43px;
  border: 1px solid #dce5f0;
  border-radius: 10px;
  background: #fff;
  color: #334155;
  font-size: 12px;
  outline: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.input-icon-wrapper input {
  padding: 0 13px 0 40px;
}

.custom-select {
  padding: 0 12px;
}

.input-icon-wrapper input:focus,
.custom-select:focus {
  border-color: #60a5fa;
  box-shadow:
    0 0 0 3px
    rgb(59 130 246 / 12%);
}

.reset-filter-button,
.search-button {
  width: 100%;
  min-width: 110px;
  height: 43px;
  padding: 0 15px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 7px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.reset-filter-button {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #64748b;
}

.reset-filter-button:hover:not(:disabled) {
  border-color: #93c5fd;
  background: #eff6ff;
  color: #2563eb;
  transform: translateY(-1px);
}

.search-button {
  border: 1px solid #2563eb;
  background: #2563eb;
  color: #fff;
  box-shadow:
    0 6px 14px
    rgb(37 99 235 / 18%);
}

.search-button:hover:not(:disabled) {
  background: #1d4ed8;
  transform: translateY(-1px);
}

.reset-filter-button:disabled,
.search-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* =========================================
   HEADER BẢNG
========================================= */

.request-table-card {
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

.table-card-header {
  padding: 21px 25px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  border-bottom: 1px solid #edf2f7;
}

.request-statistic {
  padding: 9px 13px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #dbeafe;
  border-radius: 11px;
  background: #f8fbff;
}

.statistic-icon {
  width: 37px;
  height: 37px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  background: #dbeafe;
  color: #2563eb;
}

.request-statistic span,
.request-statistic strong {
  display: block;
}

.request-statistic span {
  color: #94a3b8;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
}

.request-statistic strong {
  margin-top: 2px;
  color: #1e3a8a;
  font-size: 16px;
}

/* =========================================
   BẢNG
========================================= */

.table-responsive {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}

.request-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
}

.request-table th {
  padding: 13px 15px;
  border-bottom: 1px solid #e7edf5;
  background: #f8fafc;
  color: #64748b;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.45px;
  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
}

.request-table td {
  padding: 15px;
  border-bottom: 1px solid #edf2f7;
  color: #475569;
  font-size: 12px;
  vertical-align: middle;
}

.request-table tbody tr {
  transition: background 0.2s ease;
}

.request-table tbody tr:hover {
  background: #f8fbff;
}

.request-table tbody tr:last-child td {
  border-bottom: 0;
}

.stt-column,
.stt-cell {
  width: 58px;
  text-align: center !important;
}

.quantity-column,
.quantity-cell {
  width: 85px;
  text-align: center !important;
}

.action-column {
  width: 135px;
  text-align: center !important;
}

/* =========================================
   THÔNG TIN YÊU CẦU
========================================= */

.request-information,
.reader-information {
  display: flex;
  align-items: center;
  gap: 11px;
}

.request-information {
  min-width: 150px;
}

.request-icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 11px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 16px;
}

.request-text,
.reader-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.request-text strong {
  color: #1e3a8a;
  font-size: 12px;
}

.request-text span {
  margin-top: 4px;
  color: #94a3b8;
  font-size: 10px;
}

/* =========================================
   ĐỘC GIẢ
========================================= */

.reader-information {
  min-width: 215px;
}

.reader-avatar {
  width: 43px;
  height: 43px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 12px;
  background: linear-gradient(
    135deg,
    #dbeafe,
    #eff6ff
  );
  color: #2563eb;
  font-size: 12px;
  font-weight: 900;
}

.reader-text strong {
  max-width: 180px;
  overflow: hidden;
  color: #1e3a8a;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reader-text > span {
  margin-top: 2px;
  color: #3b82f6;
  font-size: 9px;
  font-weight: 800;
}

.reader-text small {
  margin-top: 5px;
  display: flex;
  align-items: center;
  gap: 5px;
  color: #94a3b8;
  font-size: 9px;
}

/* =========================================
   SÁCH, NGÀY, SỐ LƯỢNG
========================================= */

.book-summary {
  max-width: 255px;
  display: flex;
  align-items: center;
  gap: 7px;
}

.book-summary i {
  flex-shrink: 0;
  color: #3b82f6;
}

.book-summary span {
  overflow: hidden;
  color: #475569;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quantity-badge {
  min-width: 34px;
  height: 30px;
  padding: 0 9px;
  display: inline-grid;
  place-items: center;
  border-radius: 9px;
  background: #eef2ff;
  color: #4f46e5;
  font-size: 11px;
  font-weight: 800;
}

.date-value {
  display: flex;
  align-items: center;
  gap: 7px;
  white-space: nowrap;
}

.date-value i {
  color: #94a3b8;
}

.due-date i {
  color: #f59e0b;
}

/* =========================================
   TRẠNG THÁI
========================================= */

.status-badge {
  padding: 6px 9px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  white-space: nowrap;
}

.status-pending {
  background: #fef3c7;
  color: #b45309;
}

.status-approved {
  background: #d1fae5;
  color: #047857;
}

.status-rejected {
  background: #fee2e2;
  color: #b91c1c;
}

.status-cancelled {
  background: #e2e8f0;
  color: #475569;
}

/* =========================================
   NÚT THAO TÁC
========================================= */

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.action-button {
  width: 34px;
  height: 34px;
  padding: 0;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 9px;
  font-size: 13px;
  transition:
    transform 0.2s ease,
    background 0.2s ease;
}

.action-button:hover:not(:disabled) {
  transform: translateY(-2px);
}

.action-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.action-view {
  background: #e0f2fe;
  color: #0284c7;
}

.action-view:hover {
  background: #bae6fd;
}

.action-approve {
  background: #d1fae5;
  color: #059669;
}

.action-approve:hover:not(:disabled) {
  background: #a7f3d0;
}

.action-reject {
  background: #fee2e2;
  color: #dc2626;
}

.action-reject:hover:not(:disabled) {
  background: #fecaca;
}

/* =========================================
   LOADING VÀ EMPTY
========================================= */

.loading-state,
.empty-state {
  min-height: 280px;
  padding: 45px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  text-align: center;
}

.loading-icon {
  margin-bottom: 14px;
}

.loading-state strong {
  color: #334155;
  font-size: 15px;
}

.loading-state > span {
  margin-top: 6px;
  color: #94a3b8;
  font-size: 12px;
}

.empty-table-cell {
  padding: 0 !important;
}

.empty-icon {
  width: 70px;
  height: 70px;
  display: grid;
  place-items: center;
  border-radius: 20px;
  background: linear-gradient(
    135deg,
    #eff6ff,
    #dbeafe
  );
  color: #3b82f6;
  font-size: 28px;
}

.empty-state h3 {
  margin: 16px 0 7px;
  color: #334155;
  font-size: 17px;
}

.empty-state p {
  max-width: 370px;
  margin: 0;
  color: #94a3b8;
  font-size: 12px;
}

.empty-reset-button {
  margin-top: 17px;
  padding: 9px 14px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 0;
  border-radius: 9px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 11px;
  font-weight: 700;
}

/* =========================================
   PHÂN TRANG
========================================= */

.pagination-container {
  padding: 17px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 17px;
  border-top: 1px solid #edf2f7;
  background: #fff;
}

.pagination-information {
  color: #64748b;
  font-size: 11px;
}

.pagination-information strong {
  color: #334155;
}

.pagination-buttons {
  display: flex;
  align-items: center;
  gap: 5px;
}

.page-button {
  min-width: 34px;
  height: 34px;
  padding: 0 9px;
  display: grid;
  place-items: center;
  border: 1px solid #dbe3ee;
  border-radius: 8px;
  background: #fff;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
}

.page-button:hover:not(:disabled) {
  border-color: #93c5fd;
  background: #eff6ff;
  color: #2563eb;
}

.page-button.active {
  border-color: #2563eb;
  background: #2563eb;
  color: #fff;
}

.page-button:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.page-dots {
  min-width: 25px;
  text-align: center;
  color: #94a3b8;
}

/* =========================================
   MODAL
========================================= */

.modal-overlay {
  position: fixed;
  z-index: 3000;
  inset: 0;
  padding: 22px;
  display: grid;
  place-items: center;
  background:
    rgb(15 23 42 / 58%);
  backdrop-filter: blur(3px);
}

.detail-modal {
  width: min(900px, 100%);
  max-height:
    calc(100vh - 44px);
  overflow-y: auto;
  border: 1px solid #e5edf7;
  border-radius: 21px;
  background: #fff;
  box-shadow:
    0 25px 70px
    rgb(15 23 42 / 28%);
}

.modal-heading {
  padding: 21px 24px;
  position: sticky;
  z-index: 2;
  top: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 17px;
  border-bottom: 1px solid #edf2f7;
  background:
    rgb(255 255 255 / 96%);
  backdrop-filter: blur(12px);
}

.modal-heading-content,
.modal-heading-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-icon {
  width: 47px;
  height: 47px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 13px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 20px;
}

.modal-label {
  display: block;
  color: #94a3b8;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
}

.modal-heading h2 {
  margin: 4px 0 0;
  color: #1e3a8a;
  font-size: 20px;
  font-weight: 800;
}

.close-button {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 10px;
  background: #f1f5f9;
  color: #64748b;
}

.close-button:hover:not(:disabled) {
  background: #fee2e2;
  color: #dc2626;
}

.modal-loading {
  min-height: 320px;
  padding: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 15px;
  color: #475569;
}

.detail-grid {
  padding: 24px;
  display: grid;
  grid-template-columns:
    repeat(
      3,
      minmax(0, 1fr)
    );
  gap: 13px;
}

.detail-item {
  min-width: 0;
  padding: 13px;
  display: flex;
  align-items: center;
  gap: 11px;
  border: 1px solid #e7edf5;
  border-radius: 12px;
  background: #f8fafc;
}

.detail-icon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 10px;
  background: #e0edff;
  color: #2563eb;
}

.detail-item small,
.detail-item strong {
  display: block;
}

.detail-item small {
  margin-bottom: 4px;
  color: #94a3b8;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
}

.detail-item strong {
  overflow-wrap: anywhere;
  color: #334155;
  font-size: 11px;
}

/* =========================================
   DANH SÁCH SÁCH TRONG MODAL
========================================= */

.book-section {
  padding: 0 24px 24px;
}

.section-heading {
  margin-bottom: 13px;
}

.section-heading h3 {
  margin: 0;
  color: #1e3a8a;
  font-size: 16px;
  font-weight: 800;
}

.section-heading p {
  margin: 5px 0 0;
  color: #94a3b8;
  font-size: 10px;
}

.book-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.book-item {
  padding: 11px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #e7edf5;
  border-radius: 12px;
  background: #fff;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
}

.book-item:hover {
  border-color: #bfdbfe;
  background: #f8fbff;
}

.book-cover {
  width: 49px;
  height: 67px;
  flex-shrink: 0;
  overflow: hidden;
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
  font-size: 20px;
}

.book-content {
  min-width: 0;
  flex: 1;
}

.book-code,
.book-content strong,
.book-content small {
  display: block;
}

.book-code {
  margin-bottom: 4px;
  color: #3b82f6;
  font-size: 8px;
  font-weight: 900;
  letter-spacing: 0.5px;
}

.book-content strong {
  overflow: hidden;
  color: #1e3a8a;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-content small {
  margin-top: 5px;
  color: #94a3b8;
  font-size: 10px;
}

.book-quantity {
  min-width: 64px;
  text-align: center;
}

.book-quantity span,
.book-quantity strong {
  display: block;
}

.book-quantity span {
  color: #94a3b8;
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
}

.book-quantity strong {
  margin-top: 4px;
  color: #2563eb;
  font-size: 16px;
}

.empty-book-list {
  min-height: 90px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 9px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  color: #94a3b8;
  font-size: 11px;
}

/* =========================================
   GHI CHÚ VÀ LÝ DO TỪ CHỐI
========================================= */

.information-box {
  margin: 0 24px 15px;
  padding: 14px;
  display: flex;
  align-items: flex-start;
  gap: 11px;
  border: 1px solid;
  border-radius: 12px;
}

.information-box > i {
  margin-top: 2px;
  font-size: 16px;
}

.information-box strong,
.information-box p {
  display: block;
}

.information-box strong {
  font-size: 11px;
}

.information-box p {
  margin: 5px 0 0;
  overflow-wrap: anywhere;
  font-size: 11px;
  line-height: 1.6;
}

.note-box {
  border-color: #bfdbfe;
  background: #eff6ff;
  color: #1e40af;
}

.reject-box {
  border-color: #fecaca;
  background: #fef2f2;
  color: #b91c1c;
}

/* =========================================
   NÚT MODAL
========================================= */

.modal-actions {
  padding: 17px 24px;
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  border-top: 1px solid #edf2f7;
  background: #f8fafc;
}

.modal-close-button,
.modal-reject-button,
.modal-approve-button {
  min-height: 40px;
  padding: 0 16px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 7px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 800;
}

.modal-close-button {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #64748b;
}

.modal-reject-button {
  border: 1px solid #fecaca;
  background: #fff;
  color: #dc2626;
}

.modal-approve-button {
  border: 1px solid #059669;
  background: #059669;
  color: #fff;
  box-shadow:
    0 6px 14px
    rgb(5 150 105 / 18%);
}

.modal-close-button:disabled,
.modal-reject-button:disabled,
.modal-approve-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

/* =========================================
   RESPONSIVE
========================================= */

@media (max-width: 1200px) {
  .filter-grid {
    grid-template-columns:
      repeat(
        3,
        minmax(0, 1fr)
      );
  }

  .keyword-filter {
    grid-column: span 2;
  }
}

@media (max-width: 850px) {
  .filter-heading,
  .table-card-header {
    align-items: stretch;
    flex-direction: column;
  }

  .refresh-button {
    width: 100%;
  }

  .filter-grid {
    grid-template-columns:
      repeat(
        2,
        minmax(0, 1fr)
      );
  }

  .keyword-filter {
    grid-column: 1 / -1;
  }

  .request-statistic {
    width: fit-content;
  }

  .pagination-container {
    align-items: flex-start;
    flex-direction: column;
  }

  .pagination-buttons {
    max-width: 100%;
    overflow-x: auto;
  }

  .detail-grid {
    grid-template-columns:
      repeat(
        2,
        minmax(0, 1fr)
      );
  }
}

@media (max-width: 600px) {
  .request-page {
    gap: 16px;
  }

  .filter-card {
    padding: 19px;
    border-radius: 17px;
  }

  .filter-grid {
    grid-template-columns: 1fr;
  }

  .keyword-filter {
    grid-column: auto;
  }

  .table-card-header {
    padding: 19px;
  }

  .modal-overlay {
    padding: 0;
  }

  .detail-modal {
    width: 100%;
    max-height: 100vh;
    min-height: 100vh;
    border: 0;
    border-radius: 0;
  }

  .modal-heading {
    align-items: flex-start;
  }

  .modal-heading-actions {
    align-items: flex-end;
    flex-direction: column-reverse;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .modal-actions {
    flex-direction: column;
  }

  .modal-close-button,
  .modal-reject-button,
  .modal-approve-button {
    width: 100%;
  }
}
</style>