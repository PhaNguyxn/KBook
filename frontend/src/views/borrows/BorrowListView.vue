<script setup>
import {
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
});

async function loadBorrows() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await borrowApi.getAll({
      page: filters.page,
      limit: filters.limit,
      status: filters.status || undefined,
      fromDate: filters.fromDate || undefined,
      toDate: filters.toDate || undefined,
      sort: filters.sort || undefined,
    });

    borrows.value =
      response.data.data.borrows || [];

    Object.assign(
      pagination,
      response.data.data.pagination,
    );
  } catch (error) {
    errorMessage.value = getErrorMessage(
      error,
      "Không thể tải danh sách phiếu mượn",
    );
  } finally {
    loading.value = false;
  }
}

function handleFilter() {
  if (
    filters.fromDate &&
    filters.toDate &&
    filters.fromDate > filters.toDate
  ) {
    errorMessage.value =
      "Ngày bắt đầu không được lớn hơn ngày kết thúc";
    return;
  }

  filters.page = 1;
  loadBorrows();
}

function resetFilters() {
  filters.page = 1;
  filters.status = "";
  filters.fromDate = "";
  filters.toDate = "";
  filters.sort = "";

  loadBorrows();
}

function changePage(page) {
  if (
    page < 1 ||
    page > pagination.totalPages ||
    page === pagination.page
  ) {
    return;
  }

  filters.page = page;
  loadBorrows();
}

async function returnBorrow(borrow) {
  if (borrow.status === "returned") {
    return;
  }

  const confirmed = window.confirm(
    `Xác nhận độc giả "${getReaderFullName(
      borrow.reader,
    )}" đã trả toàn bộ sách?`,
  );

  if (!confirmed) {
    return;
  }

  returningId.value = borrow._id;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    await borrowApi.returnBooks(borrow._id);

    successMessage.value =
      "Xác nhận trả sách thành công";

    await loadBorrows();
  } catch (error) {
    errorMessage.value = getErrorMessage(
      error,
      "Không thể xác nhận trả sách",
    );
  } finally {
    returningId.value = "";
  }
}

onMounted(loadBorrows);
</script>

<template>
  <section class="borrow-list-page">
    <header class="page-header">
      <div>
        <h1>Phiếu mượn sách</h1>

        <p>
          Theo dõi các phiếu đang mượn, quá hạn và
          đã trả.
        </p>
      </div>

      <button
        type="button"
        class="primary-button"
        @click="router.push('/borrows/create')"
      >
        + Lập phiếu mượn
      </button>
    </header>

    <form
      class="filter-card"
      @submit.prevent="handleFilter"
    >
      <div class="filter-grid">
        <div class="form-group">
          <label for="status">Trạng thái</label>

          <select
            id="status"
            v-model="filters.status"
          >
            <option value="">Tất cả</option>

            <option value="borrowing">
              Đang mượn và quá hạn
            </option>

            <option value="returned">
              Đã trả
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="fromDate">
            Mượn từ ngày
          </label>

          <input
            id="fromDate"
            v-model="filters.fromDate"
            type="date"
          />
        </div>

        <div class="form-group">
          <label for="toDate">
            Đến ngày
          </label>

          <input
            id="toDate"
            v-model="filters.toDate"
            type="date"
          />
        </div>

        <div class="form-group">
          <label for="sort">Sắp xếp</label>

          <select
            id="sort"
            v-model="filters.sort"
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
      </div>

      <div class="filter-actions">
        <button
          type="button"
          class="secondary-button"
          @click="resetFilters"
        >
          Đặt lại
        </button>

        <button
          type="submit"
          class="primary-button"
        >
          Áp dụng
        </button>
      </div>
    </form>

    <p
      v-if="errorMessage"
      class="message error-message"
    >
      {{ errorMessage }}
    </p>

    <p
      v-if="successMessage"
      class="message success-message"
    >
      {{ successMessage }}
    </p>

    <div class="table-card">
      <p
        v-if="loading"
        class="state-message"
      >
        Đang tải danh sách phiếu mượn...
      </p>

      <div
        v-else
        class="table-wrapper"
      >
        <table>
          <thead>
            <tr>
              <th>STT</th>
              <th>Mã phiếu</th>
              <th>Độc giả</th>
              <th>Nhân viên lập</th>
              <th>Ngày mượn</th>
              <th>Hạn trả</th>
              <th>Ngày trả</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(borrow, index) in borrows"
              :key="borrow._id"
            >
              <td>
                {{
                  (pagination.page - 1) *
                    pagination.limit +
                  index +
                  1
                }}
              </td>

              <td>
                <button
                  type="button"
                  class="id-button"
                  @click="
                    router.push(
                      `/borrows/${borrow._id}`,
                    )
                  "
                >
                  {{ getShortBorrowId(borrow._id) }}
                </button>
              </td>

              <td>
                <strong>
                  {{
                    getReaderFullName(
                      borrow.reader,
                    )
                  }}
                </strong>

                <small>
                  {{
                    borrow.reader?.readerCode ||
                    "Không có mã"
                  }}
                </small>
              </td>

              <td>
                {{
                  borrow.employee?.fullName ||
                  "Không xác định"
                }}
              </td>

              <td>
                {{ formatDateTime(borrow.borrowDate) }}
              </td>

              <td>
                {{ formatDate(borrow.dueDate) }}
              </td>

              <td>
                {{ formatDateTime(borrow.returnDate) }}
              </td>

              <td>
                <span
                  class="status-badge"
                  :class="
                    getBorrowStatus(borrow)
                      .className
                  "
                >
                  {{
                    getBorrowStatus(borrow).text
                  }}
                </span>
              </td>

              <td>
                <div class="action-buttons">
                  <button
                    type="button"
                    class="view-button"
                    @click="
                      router.push(
                        `/borrows/${borrow._id}`,
                      )
                    "
                  >
                    Chi tiết
                  </button>

                  <button
                    v-if="
                      borrow.status === 'borrowing'
                    "
                    type="button"
                    class="return-button"
                    :disabled="
                      returningId === borrow._id
                    "
                    @click="returnBorrow(borrow)"
                  >
                    {{
                      returningId === borrow._id
                        ? "Đang xử lý..."
                        : "Trả sách"
                    }}
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="borrows.length === 0">
              <td
                colspan="9"
                class="empty-cell"
              >
                Chưa có phiếu mượn phù hợp
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <footer
      v-if="pagination.totalPages > 0"
      class="pagination"
    >
      <button
        type="button"
        :disabled="pagination.page <= 1"
        @click="
          changePage(pagination.page - 1)
        "
      >
        Trước
      </button>

      <span>
        Trang {{ pagination.page }} /
        {{ pagination.totalPages }}
        — Tổng {{ pagination.total }} phiếu
      </span>

      <button
        type="button"
        :disabled="
          pagination.page >=
          pagination.totalPages
        "
        @click="
          changePage(pagination.page + 1)
        "
      >
        Sau
      </button>
    </footer>
  </section>
</template>

<style scoped>
.borrow-list-page {
  max-width: 1450px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 22px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.page-header h1 {
  margin: 0 0 6px;
}

.page-header p {
  margin: 0;
  color: #6b7280;
}

.filter-card,
.table-card {
  margin-bottom: 20px;
  padding: 20px;
  border-radius: 10px;
  background: white;
  box-shadow: 0 4px 15px rgb(0 0 0 / 5%);
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.form-group label {
  display: block;
  margin-bottom: 7px;
  font-weight: 600;
}

input,
select {
  width: 100%;
  padding: 10px 11px;
  border: 1px solid #d1d5db;
  border-radius: 7px;
  box-sizing: border-box;
  font: inherit;
}

.filter-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

button {
  padding: 9px 13px;
  border-radius: 6px;
  cursor: pointer;
}

.primary-button {
  border: 0;
  background: #2563eb;
  color: white;
}

.secondary-button {
  border: 1px solid #d1d5db;
  background: white;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 1150px;
  border-collapse: collapse;
}

th,
td {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
}

th {
  background: #f9fafb;
  color: #374151;
}

td small {
  display: block;
  margin-top: 4px;
  color: #6b7280;
}

.id-button {
  padding: 0;
  border: 0;
  background: transparent;
  color: #2563eb;
  font-weight: 700;
}

.status-badge {
  display: inline-block;
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.status-borrowing {
  background: #fef3c7;
  color: #92400e;
}

.status-returned {
  background: #dcfce7;
  color: #15803d;
}

.status-overdue {
  background: #fee2e2;
  color: #b91c1c;
}

.action-buttons {
  display: flex;
  gap: 7px;
}

.view-button {
  border: 0;
  background: #2563eb;
  color: white;
}

.return-button {
  border: 0;
  background: #16a34a;
  color: white;
}

.return-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 14px;
}

.pagination button {
  border: 1px solid #d1d5db;
  background: white;
}

.pagination button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.message {
  padding: 12px 14px;
  border-radius: 7px;
}

.error-message {
  background: #fee2e2;
  color: #b91c1c;
}

.success-message {
  background: #dcfce7;
  color: #15803d;
}

.state-message,
.empty-cell {
  padding: 24px;
  text-align: center;
  color: #6b7280;
}

@media (max-width: 900px) {
  .filter-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .page-header {
    flex-direction: column;
  }

  .filter-grid {
    grid-template-columns: 1fr;
  }
}
</style>