<script setup>
import {
  computed,
  onMounted,
  reactive,
  ref,
} from "vue";

import { useRouter } from "vue-router";

import { borrowApi } from "@/api/borrowApi";

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

const router = useRouter();

/* =========================================
   STATE
========================================= */

const borrows = ref([]);

const loading = ref(false);
const returningId = ref("");

const errorMessage = ref("");
const successMessage = ref("");

const filters = reactive({
  page: 1,
  limit: 10,
  status: "",
  fromDate: "",
  toDate: "",
  sort: "",
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
   PHÂN TRANG
========================================= */

const visiblePages = computed(() => {
  const total = pagination.totalPages;
  const current = pagination.page;

  if (total <= 0) {
    return [];
  }

  if (total <= 7) {
    return Array.from(
      { length: total },
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

const firstDisplayedRecord = computed(() => {
  if (pagination.total === 0) {
    return 0;
  }

  return (
    (pagination.page - 1) *
      pagination.limit +
    1
  );
});

const lastDisplayedRecord = computed(() => {
  return Math.min(
    pagination.page *
      pagination.limit,
    pagination.total,
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

function clearMessages() {
  errorMessage.value = "";
  successMessage.value = "";
}

function getReaderName(reader) {
  return (
    getReaderFullName(reader) ||
    "Không xác định"
  );
}

function getReaderInitials(reader) {
  const fullName = getReaderName(
    reader,
  );

  if (
    !fullName ||
    fullName === "Không xác định"
  ) {
    return "ĐG";
  }

  const words = fullName
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
}

function getEmployeeName(employee) {
  if (!employee) {
    return "Không xác định";
  }

  if (employee.fullName) {
    return employee.fullName;
  }

  return `${employee.lastName || ""} ${
    employee.firstName || ""
  }`.trim() || "Không xác định";
}

function getStatusInformation(borrow) {
  return (
    getBorrowStatus(borrow) || {
      text: "Không xác định",
      className: "status-unknown",
    }
  );
}

function getStatusIcon(borrow) {
  const className =
    getStatusInformation(
      borrow,
    ).className;

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
}

/* =========================================
   TẢI DANH SÁCH
========================================= */

async function loadBorrows() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response =
      await borrowApi.getAll({
        page: filters.page,
        limit: filters.limit,

        status:
          filters.status ||
          undefined,

        fromDate:
          filters.fromDate ||
          undefined,

        toDate:
          filters.toDate ||
          undefined,

        sort:
          filters.sort ||
          undefined,
      });

    const payload =
      response?.data?.data ??
      response?.data ??
      {};

    if (Array.isArray(payload)) {
      borrows.value = payload;

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

    borrows.value =
      payload.borrows ||
      payload.items ||
      payload.results ||
      [];

    const pageData =
      payload.pagination || {};

    const total =
      Number(
        pageData.total ??
          payload.total ??
          borrows.value.length,
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
          Math.ceil(total / limit),
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
      "Load borrows error:",
      error,
    );

    borrows.value = [];

    errorMessage.value =
      getErrorMessage(
        error,
        "Không thể tải danh sách phiếu mượn",
      );
  } finally {
    loading.value = false;
  }
}

/* =========================================
   BỘ LỌC
========================================= */

function handleFilter() {
  clearMessages();

  if (
    filters.fromDate &&
    filters.toDate &&
    filters.fromDate >
      filters.toDate
  ) {
    errorMessage.value =
      "Ngày bắt đầu không được lớn hơn ngày kết thúc";

    return;
  }

  filters.page = 1;
  loadBorrows();
}

function handleFilterChange() {
  clearMessages();
  filters.page = 1;
  loadBorrows();
}

function handleLimitChange() {
  clearMessages();
  filters.page = 1;
  loadBorrows();
}

function resetFilters() {
  clearMessages();

  filters.page = 1;
  filters.limit = 10;
  filters.status = "";
  filters.fromDate = "";
  filters.toDate = "";
  filters.sort = "";

  loadBorrows();
}

/* =========================================
   CHUYỂN TRANG
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

  loadBorrows();

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

/* =========================================
   TRẢ SÁCH
========================================= */

async function returnBorrow(borrow) {
  if (
    borrow.status === "returned"
  ) {
    return;
  }

  const readerName =
    getReaderName(borrow.reader);

  const confirmed =
    window.confirm(
      `Xác nhận độc giả "${readerName}" đã trả toàn bộ sách?`,
    );

  if (!confirmed) {
    return;
  }

  returningId.value =
    borrow._id;

  clearMessages();

  try {
    await borrowApi.returnBooks(
      borrow._id,
    );

    successMessage.value =
      "Xác nhận trả sách thành công";

    await loadBorrows();
  } catch (error) {
    errorMessage.value =
      getErrorMessage(
        error,
        "Không thể xác nhận trả sách",
      );
  } finally {
    returningId.value = "";
  }
}

/* =========================================
   KHỞI TẠO
========================================= */

onMounted(() => {
  loadBorrows();
});
</script>

<template>
  <section class="borrow-page">
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
            Quản lý mượn trả
          </h2>
        </div>

        <button
          type="button"
          class="create-button"
          @click="
            router.push(
              '/borrows/create',
            )
          "
        >
          <i class="bi bi-plus-lg" />

          Lập phiếu mượn
        </button>
      </div>

      <form
        class="filter-grid"
        @submit.prevent="handleFilter"
      >
        <!-- Trạng thái -->
        <div>
          <label for="borrowStatus">
            Trạng thái
          </label>

          <select
            id="borrowStatus"
            v-model="filters.status"
            class="custom-control"
            @change="
              handleFilterChange
            "
          >
            <option value="">
              Tất cả trạng thái
            </option>

            <option value="borrowing">
              Đang mượn và quá hạn
            </option>

            <option value="returned">
              Đã trả
            </option>
          </select>
        </div>

        <!-- Từ ngày -->
        <div>
          <label for="fromDate">
            Mượn từ ngày
          </label>

          <div
            class="input-icon-wrapper"
          >
            <i
              class="bi bi-calendar3"
            />

            <input
              id="fromDate"
              v-model="filters.fromDate"
              type="date"
              class="custom-control date-input"
            />
          </div>
        </div>

        <!-- Đến ngày -->
        <div>
          <label for="toDate">
            Đến ngày
          </label>

          <div
            class="input-icon-wrapper"
          >
            <i
              class="bi bi-calendar3"
            />

            <input
              id="toDate"
              v-model="filters.toDate"
              type="date"
              class="custom-control date-input"
            />
          </div>
        </div>

        <!-- Sắp xếp -->
        <div>
          <label for="borrowSort">
            Sắp xếp
          </label>

          <select
            id="borrowSort"
            v-model="filters.sort"
            class="custom-control"
            @change="
              handleFilterChange
            "
          >
            <option value="">
              Mới tạo gần đây
            </option>

            <option value="borrowDate">
              Ngày mượn mới nhất
            </option>

            <option value="dueDate">
              Hạn trả gần nhất
            </option>

            <option value="returnDate">
              Ngày trả gần nhất
            </option>
          </select>
        </div>

        <!-- Số dòng -->
        <div>
          <label for="borrowLimit">
            Số dòng
          </label>

          <select
            id="borrowLimit"
            v-model.number="
              filters.limit
            "
            class="custom-control"
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
          class="reset-button"
          :disabled="loading"
          @click="resetFilters"
        >
          <i
            class="bi bi-arrow-counterclockwise"
          />

          Đặt lại
        </button>

        <!-- Áp dụng -->
        <button
          type="submit"
          class="apply-button"
          :disabled="loading"
        >
          <i class="bi bi-funnel" />

          {{
            loading
              ? "Đang lọc..."
              : "Áp dụng"
          }}
        </button>
      </form>
    </div>

    <!-- Bảng phiếu mượn -->
    <div class="borrow-table-card">
      <div class="table-card-header">
        <div>
          <h2>
            Danh sách phiếu mượn
          </h2>

          <p>
            Tổng cộng
            <strong>
              {{ pagination.total }}
            </strong>
            phiếu mượn.
          </p>
        </div>

        <div class="total-box">
          <div class="total-icon">
            <i
              class="bi bi-journal-bookmark"
            />
          </div>

          <div>
            <span>
              Tổng phiếu
            </span>

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
        <div
          class="spinner-border text-primary"
          role="status"
        />

        <strong>
          Đang tải danh sách phiếu mượn
        </strong>

        <span>
          Vui lòng chờ trong giây lát...
        </span>
      </div>

      <!-- Bảng -->
      <div
  v-else
  class="table-wrapper"
>
  <table class="borrow-table">
    <colgroup>
      <col class="col-index" />
      <col class="col-code" />
      <col class="col-reader" />
      <col class="col-employee" />
      <col class="col-borrow-date" />
      <col class="col-due-date" />
      <col class="col-return-date" />
      <col class="col-total" />
      <col class="col-status" />
      <col class="col-action" />
    </colgroup>

    <thead>
      <tr>
        <th class="text-center">
          STT
        </th>

        <th>
          Mã phiếu
        </th>

        <th>
          Độc giả
        </th>

        <th>
          Nhân viên lập
        </th>

        <th>
          Ngày mượn
        </th>

        <th>
          Hạn trả
        </th>

        <th>
          Ngày trả
        </th>

        <th>
          Tổng tiền
        </th>

        <th>
          Trạng thái
        </th>

        <th class="text-center">
          Thao tác
        </th>
      </tr>
    </thead>

    <tbody>
      <tr
        v-for="(
          borrow,
          index
        ) in borrows"
        :key="borrow._id"
      >
        <!-- STT -->
        <td class="text-center index-cell">
          {{
            (pagination.page - 1) *
              pagination.limit +
            index +
            1
          }}
        </td>

        <!-- Mã phiếu -->
        <td>
          <button
            type="button"
            class="borrow-code"
            :title="
              borrow.borrowCode ||
              borrow._id
            "
            @click="
              router.push({
                name: 'borrow-detail',
                params: {
                  id: borrow._id,
                },
              })
            "
          >
            <i
              class="bi bi-file-earmark-text"
            />

            <span>
              {{
                borrow.borrowCode ||
                getShortBorrowId(
                  borrow._id,
                )
              }}
            </span>
          </button>
        </td>

        <!-- Độc giả -->
        <td>
          <div class="reader-info">
            <div class="reader-avatar">
              {{
                getReaderInitials(
                  borrow.reader,
                )
              }}
            </div>

            <div class="reader-content">
              <strong
                :title="
                  getReaderName(
                    borrow.reader,
                  )
                "
              >
                {{
                  getReaderName(
                    borrow.reader,
                  )
                }}
              </strong>

              <span>
                {{
                  borrow.reader
                    ?.readerCode ||
                  "Chưa có mã"
                }}
              </span>

              <small>
                <i
                  class="bi bi-telephone"
                />

                {{
                  borrow.reader
                    ?.phone ||
                  "Chưa có SĐT"
                }}
              </small>
            </div>
          </div>
        </td>

        <!-- Nhân viên -->
        <td>
          <div class="employee-info">
            <span class="employee-icon">
              <i
                class="bi bi-person-badge"
              />
            </span>

            <span
              class="employee-name"
              :title="
                getEmployeeName(
                  borrow.employee,
                )
              "
            >
              {{
                getEmployeeName(
                  borrow.employee,
                )
              }}
            </span>
          </div>
        </td>

        <!-- Ngày mượn -->
        <td>
          <div class="date-info">
            <i
              class="bi bi-calendar-plus"
            />

            <span>
              {{
                borrow.borrowDate
                  ? formatDateTime(
                      borrow.borrowDate,
                    )
                  : "—"
              }}
            </span>
          </div>
        </td>

        <!-- Hạn trả -->
        <td>
          <div
            class="date-info due-date"
          >
            <i
              class="bi bi-calendar-event"
            />

            <span>
              {{
                borrow.dueDate
                  ? formatDate(
                      borrow.dueDate,
                    )
                  : "—"
              }}
            </span>
          </div>
        </td>

        <!-- Ngày trả -->
        <td>
          <div
            class="date-info return-date"
          >
            <i
              class="bi bi-calendar-check"
            />

            <span>
              {{
                borrow.returnDate
                  ? formatDateTime(
                      borrow.returnDate,
                    )
                  : "Chưa trả"
              }}
            </span>
          </div>
        </td>

        <!-- Tổng tiền -->
        <td>
          <strong class="borrow-total">
            {{
              formatCurrency(
                borrow.totalAmount,
              )
            }}
          </strong>
        </td>

        <!-- Trạng thái -->
        <td>
          <span
            class="status-badge"
            :class="
              getStatusInformation(
                borrow,
              ).className
            "
          >
            <i
              class="bi"
              :class="
                getStatusIcon(
                  borrow,
                )
              "
            />

            {{
              getStatusInformation(
                borrow,
              ).text
            }}
          </span>
        </td>

        <!-- Thao tác -->
        <td>
          <div class="action-buttons">
            <button
              type="button"
              class="action-button view-action"
              title="Xem chi tiết"
              @click="
                router.push({
                  name: 'borrow-detail',
                  params: {
                    id: borrow._id,
                  },
                })
              "
            >
              <i class="bi bi-eye" />
            </button>

            <button
              v-if="
                borrow.status ===
                'borrowing'
              "
              type="button"
              class="action-button return-action"
              title="Xác nhận trả sách"
              :disabled="
                returningId ===
                borrow._id
              "
              @click="
                returnBorrow(borrow)
              "
            >
              <span
                v-if="
                  returningId ===
                  borrow._id
                "
                class="spinner-border spinner-border-sm"
              />

              <i
                v-else
                class="bi bi-box-arrow-in-left"
              />
            </button>
          </div>
        </td>
      </tr>

      <!-- Không có dữ liệu -->
      <tr v-if="borrows.length === 0">
        <td
          colspan="10"
          class="empty-table-cell"
        >
          <div class="empty-state">
            <div class="empty-icon">
              <i
                class="bi bi-journal-x"
              />
            </div>

            <h3>
              Không tìm thấy phiếu mượn
            </h3>

            <p>
              Không có phiếu mượn phù hợp
              với điều kiện tìm kiếm hiện tại.
            </p>

            <button
              type="button"
              class="empty-reset-button"
              @click="resetFilters"
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
            {{
              firstDisplayedRecord
            }}
          </strong>

          đến

          <strong>
            {{
              lastDisplayedRecord
            }}
          </strong>

          trong tổng số

          <strong>
            {{ pagination.total }}
          </strong>

          phiếu
        </div>

        <nav
          class="pagination-buttons"
          aria-label="Phân trang phiếu mượn"
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
  </section>
</template>

<style scoped>
.borrow-page {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

/* =========================================
   THẺ CHUNG
========================================= */

.filter-card,
.borrow-table-card {
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
  width: 100%;
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

.create-button {
  height: 43px;
  padding: 0 17px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  border: 0;
  border-radius: 10px;
  background: linear-gradient(
    135deg,
    #438df8,
    #2563eb
  );
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  box-shadow:
    0 8px 18px
    rgb(37 99 235 / 20%);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.create-button:hover {
  transform: translateY(-2px);
  box-shadow:
    0 11px 23px
    rgb(37 99 235 / 27%);
}

.filter-grid {
  display: grid;
  grid-template-columns:
    minmax(145px, 1fr)
    minmax(145px, 1fr)
    minmax(145px, 1fr)
    minmax(175px, 1.25fr)
    minmax(100px, 0.65fr)
    105px
    105px;
  align-items: end;
  gap: 12px;
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

.custom-control {
  width: 100%;
  height: 43px;
  padding: 0 12px;
  border: 1px solid #dce5f0;
  border-radius: 10px;
  background: #fff;
  color: #334155;
  font-size: 11px;
  outline: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.custom-control:focus {
  border-color: #60a5fa;
  box-shadow:
    0 0 0 3px
    rgb(59 130 246 / 12%);
}

.input-icon-wrapper {
  position: relative;
}

.input-icon-wrapper > i {
  position: absolute;
  z-index: 1;
  top: 50%;
  left: 13px;
  color: #94a3b8;
  transform: translateY(-50%);
  pointer-events: none;
}

.date-input {
  padding-left: 38px;
}

.reset-button,
.apply-button {
  width: 100%;
  min-width: 0;
  height: 43px;
  padding: 0 12px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 7px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.reset-button {
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #64748b;
}

.reset-button:hover:not(:disabled) {
  border-color: #93c5fd;
  background: #eff6ff;
  color: #2563eb;
}

.apply-button {
  border: 1px solid #2563eb;
  background: #2563eb;
  color: #fff;
  box-shadow:
    0 6px 14px
    rgb(37 99 235 / 18%);
}

.apply-button:hover:not(:disabled) {
  background: #1d4ed8;
}

.reset-button:disabled,
.apply-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* =========================================
   HEADER BẢNG
========================================= */

.borrow-table-card {
  overflow: hidden;
}

.table-card-header {
  padding: 21px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 17px;
  border-bottom: 1px solid #edf2f7;
}

.total-box {
  padding: 9px 13px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #dbeafe;
  border-radius: 11px;
  background: #f8fbff;
}

.total-icon {
  width: 37px;
  height: 37px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  background: #dbeafe;
  color: #2563eb;
}

.total-box span,
.total-box strong {
  display: block;
}

.total-box span {
  color: #94a3b8;
  font-size: 8px;
  font-weight: 800;
  text-transform: uppercase;
}

.total-box strong {
  margin-top: 2px;
  color: #1e3a8a;
  font-size: 16px;
}

/* =========================================
   KHUNG BẢNG
========================================= */

.borrow-table-card {
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

.table-wrapper {
  width: 100%;
  min-width: 0;
  overflow-x: hidden;
}

.borrow-table {
  width: 100%;
  min-width: 0;
  table-layout: fixed;
  border-collapse: collapse;
}

/* Tổng chiều rộng các cột bằng 100% */

.col-index {
  width: 4%;
}

.col-code {
  width: 10%;
}

.col-reader {
  width: 17%;
}

.col-employee {
  width: 13%;
}

.col-borrow-date {
  width: 12%;
}

.col-due-date {
  width: 10%;
}

.col-return-date {
  width: 10%;
}

.col-total {
  width: 9%;
}

.col-status {
  width: 9%;
}

.col-action {
  width: 6%;
}

/* =========================================
   HEADER VÀ Ô DỮ LIỆU
========================================= */

.borrow-table th {
  height: 51px;
  padding: 12px 9px;
  overflow: hidden;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #64748b;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.35px;
  text-align: left;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.borrow-table td {
  height: 82px;
  min-width: 0;
  padding: 12px 9px;
  overflow: hidden;
  border-bottom: 1px solid #edf2f7;
  color: #475569;
  font-size: 10px;
  vertical-align: middle;
}

.borrow-table tbody tr {
  transition:
    background-color 0.2s ease;
}

.borrow-table tbody tr:hover {
  background: #f8fbff;
}

.borrow-table tbody tr:last-child td {
  border-bottom: 0;
}

.text-center {
  text-align: center !important;
}

.index-cell {
  color: #64748b;
  font-weight: 600;
}

/* =========================================
   MÃ PHIẾU
========================================= */

.borrow-code {
  max-width: 100%;
  height: 34px;
  padding: 0 9px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  border: 0;
  border-radius: 8px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 10px;
  font-weight: 800;
  cursor: pointer;
}

.borrow-code:hover {
  background: #dbeafe;
}

.borrow-code i {
  flex-shrink: 0;
}

.borrow-code span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* =========================================
   ĐỘC GIẢ
========================================= */

.reader-info {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 9px;
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
  font-size: 11px;
  font-weight: 900;
}

.reader-content {
  min-width: 0;
  flex: 1;
}

.reader-content strong,
.reader-content span,
.reader-content small {
  display: block;
}

.reader-content strong {
  max-width: 100%;
  overflow: hidden;
  color: #1e3a8a;
  font-size: 11px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reader-content > span {
  margin-top: 2px;
  color: #3b82f6;
  font-size: 8px;
  font-weight: 800;
}

.reader-content small {
  margin-top: 4px;
  overflow: hidden;
  color: #94a3b8;
  font-size: 8px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reader-content small i {
  margin-right: 3px;
}

/* =========================================
   NHÂN VIÊN
========================================= */

.employee-info {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 7px;
}

.employee-icon {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 7px;
  background: #f1f5f9;
  color: #64748b;
}

.employee-name {
  min-width: 0;
  overflow: hidden;
  color: #64748b;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* =========================================
   NGÀY THÁNG
========================================= */

.date-info {
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.date-info i {
  margin-top: 2px;
  flex-shrink: 0;
  color: #94a3b8;
}

.date-info span {
  min-width: 0;
  color: #64748b;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.due-date i {
  color: #f59e0b;
}

.return-date i {
  color: #10b981;
}

/* =========================================
   TỔNG TIỀN
========================================= */

.borrow-total {
  display: inline-block;
  color: #dc2626;
  font-size: 11px;
  font-weight: 900;
  white-space: nowrap;
}

/* =========================================
   TRẠNG THÁI
========================================= */

.status-badge {
  max-width: 100%;
  padding: 6px 8px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  overflow: hidden;
  border-radius: 999px;
  font-size: 8px;
  font-weight: 800;
  text-overflow: ellipsis;
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

/* =========================================
   THAO TÁC
========================================= */

.action-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
}

.action-button {
  width: 31px;
  height: 31px;
  padding: 0;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border: 0;
  border-radius: 8px;
  font-size: 11px;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    background-color 0.2s ease;
}

.action-button:hover:not(:disabled) {
  transform: translateY(-2px);
}

.action-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.view-action {
  background: #e0f2fe;
  color: #0284c7;
}

.view-action:hover:not(:disabled) {
  background: #bae6fd;
}

.return-action {
  background: #d1fae5;
  color: #059669;
}

.return-action:hover:not(:disabled) {
  background: #a7f3d0;
}

/* =========================================
   LOADING VÀ TRỐNG
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

.loading-state strong {
  margin-top: 14px;
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
   RESPONSIVE
========================================= */

@media (max-width: 1350px) {
  .filter-grid {
    grid-template-columns:
      repeat(
        3,
        minmax(0, 1fr)
      );
  }

  .borrow-table {
    min-width: 1050px;
    table-layout: auto;
  }
}

@media (max-width: 850px) {
  .filter-heading,
  .table-card-header {
    align-items: stretch;
    flex-direction: column;
  }

  .create-button {
    width: 100%;
  }

  .filter-grid {
    grid-template-columns:
      repeat(
        2,
        minmax(0, 1fr)
      );
  }

  .total-box {
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
}

@media (max-width: 600px) {
  .borrow-page {
    gap: 16px;
  }

  .filter-card {
    padding: 19px;
    border-radius: 17px;
  }

  .filter-grid {
    grid-template-columns: 1fr;
  }

  .table-card-header {
    padding: 19px;
  }

  .borrow-table-card {
    border-radius: 17px;
  }
}
.borrow-total {
  color: #dc2626;
  font-size: 11px;
  font-weight: 900;
  white-space: nowrap;
}
@media (max-width: 1350px) {
  .filter-grid {
    grid-template-columns:
      repeat(
        3,
        minmax(0, 1fr)
      );
  }

  .filter-grid button {
    width: 100%;
  }

  .table-wrapper {
    overflow-x: auto;
  }

  .borrow-table {
    min-width: 1120px;
    table-layout: fixed;
  }
}

@media (max-width: 850px) {
  .filter-grid {
    grid-template-columns:
      repeat(
        2,
        minmax(0, 1fr)
      );
  }

  .filter-heading,
  .table-card-header {
    align-items: stretch;
    flex-direction: column;
  }

  .create-button {
    width: 100%;
  }

  .pagination-container {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 600px) {
  .filter-grid {
    grid-template-columns: 1fr;
  }

  .filter-card {
    padding: 20px;
  }

  .borrow-table-card,
  .filter-card {
    border-radius: 17px;
  }
}
</style>