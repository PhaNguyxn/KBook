<script setup>
import {
  onMounted,
  reactive,
  ref,
} from "vue";

import { useRouter } from "vue-router";
import { readerApi } from "@/api/readerApi";
import { formatDate } from "@/utils/date";
import { getErrorMessage } from "@/utils/error";

const router = useRouter();

const readers = ref([]);
const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const filters = reactive({
  page: 1,
  limit: 10,
  keyword: "",
  gender: "",
  status: "",
  sort: "",
});

const pagination = reactive({
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
});

function getFullName(reader) {
  return `${reader.lastName || ""} ${
    reader.firstName || ""
  }`.trim();
}

async function loadReaders() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await readerApi.getAll({
      page: filters.page,
      limit: filters.limit,
      keyword: filters.keyword || undefined,
      gender: filters.gender || undefined,
      status:
        filters.status === ""
          ? undefined
          : filters.status,
      sort: filters.sort || undefined,
    });

    readers.value =
      response.data.data.readers || [];

    Object.assign(
      pagination,
      response.data.data.pagination,
    );
  } catch (error) {
    errorMessage.value = getErrorMessage(
      error,
      "Không thể tải danh sách độc giả",
    );
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  filters.page = 1;
  loadReaders();
}

function resetFilters() {
  filters.page = 1;
  filters.keyword = "";
  filters.gender = "";
  filters.status = "";
  filters.sort = "";

  loadReaders();
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
  loadReaders();
}

async function lockReader(reader) {
  const accepted = window.confirm(
    `Bạn có chắc muốn khóa độc giả "${getFullName(
      reader,
    )}"?`,
  );

  if (!accepted) {
    return;
  }

  errorMessage.value = "";
  successMessage.value = "";

  try {
    await readerApi.delete(reader._id);

    successMessage.value =
      "Khóa độc giả thành công";

    await loadReaders();
  } catch (error) {
    errorMessage.value = getErrorMessage(
      error,
      "Không thể khóa độc giả",
    );
  }
}

async function activateReader(reader) {
  const accepted = window.confirm(
    `Kích hoạt lại độc giả "${getFullName(
      reader,
    )}"?`,
  );

  if (!accepted) {
    return;
  }

  errorMessage.value = "";
  successMessage.value = "";

  try {
    await readerApi.update(reader._id, {
      status: true,
    });

    successMessage.value =
      "Kích hoạt độc giả thành công";

    await loadReaders();
  } catch (error) {
    errorMessage.value = getErrorMessage(
      error,
      "Không thể kích hoạt độc giả",
    );
  }
}

onMounted(loadReaders);
</script>

<template>
  <section class="reader-page">
    <header class="page-header">
      <div>
        <h1>Quản lý độc giả</h1>
        <p>
          Danh sách độc giả sử dụng dịch vụ mượn sách.
        </p>
      </div>

      <button
        type="button"
        class="primary-button"
        @click="router.push('/readers/create')"
      >
        + Thêm độc giả
      </button>
    </header>

    <form
      class="filter-card"
      @submit.prevent="handleSearch"
    >
      <div class="filter-grid">
        <div class="form-group search-input">
          <label for="keyword">Tìm kiếm</label>

          <input
            id="keyword"
            v-model="filters.keyword"
            type="search"
            placeholder="Mã, tên, số điện thoại..."
          />
        </div>

        <div class="form-group">
          <label for="gender">Giới tính</label>

          <select
            id="gender"
            v-model="filters.gender"
          >
            <option value="">Tất cả</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
            <option value="Khác">Khác</option>
          </select>
        </div>

        <div class="form-group">
          <label for="status">Trạng thái</label>

          <select
            id="status"
            v-model="filters.status"
          >
            <option value="">Tất cả</option>
            <option value="true">Hoạt động</option>
            <option value="false">Đã khóa</option>
          </select>
        </div>

        <div class="form-group">
          <label for="sort">Sắp xếp</label>

          <select
            id="sort"
            v-model="filters.sort"
          >
            <option value="">Mới nhất</option>
            <option value="readerCode">
              Theo mã độc giả
            </option>
            <option value="name">
              Theo tên độc giả
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
          Tìm kiếm
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
      <p v-if="loading" class="loading-message">
        Đang tải danh sách độc giả...
      </p>

      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>STT</th>
              <th>Mã độc giả</th>
              <th>Họ và tên</th>
              <th>Ngày sinh</th>
              <th>Giới tính</th>
              <th>Số điện thoại</th>
              <th>Địa chỉ</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(reader, index) in readers"
              :key="reader._id"
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
                <strong>{{ reader.readerCode }}</strong>
              </td>

              <td>{{ getFullName(reader) }}</td>

              <td>{{ formatDate(reader.birthday) }}</td>

              <td>{{ reader.gender }}</td>

              <td>{{ reader.phone }}</td>

              <td>{{ reader.address || "—" }}</td>

              <td>
                <span
                  class="status-badge"
                  :class="
                    reader.status
                      ? 'status-active'
                      : 'status-inactive'
                  "
                >
                  {{
                    reader.status
                      ? "Hoạt động"
                      : "Đã khóa"
                  }}
                </span>
              </td>

              <td>
                <div class="action-buttons">
                  <button
                    type="button"
                    class="edit-button"
                    @click="
                      router.push(
                        `/readers/${reader._id}/edit`,
                      )
                    "
                  >
                    Sửa
                  </button>

                  <button
                    v-if="reader.status"
                    type="button"
                    class="delete-button"
                    @click="lockReader(reader)"
                  >
                    Khóa
                  </button>

                  <button
                    v-else
                    type="button"
                    class="activate-button"
                    @click="activateReader(reader)"
                  >
                    Kích hoạt
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="readers.length === 0">
              <td colspan="9" class="empty-cell">
                Không tìm thấy độc giả
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
        @click="changePage(pagination.page - 1)"
      >
        Trước
      </button>

      <span>
        Trang {{ pagination.page }} /
        {{ pagination.totalPages }}
        — Tổng {{ pagination.total }} độc giả
      </span>

      <button
        type="button"
        :disabled="
          pagination.page >= pagination.totalPages
        "
        @click="changePage(pagination.page + 1)"
      >
        Sau
      </button>
    </footer>
  </section>
</template>

<style scoped>
.reader-page {
  max-width: 1400px;
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
  grid-template-columns: 2fr repeat(3, 1fr);
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
  padding: 9px 14px;
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
  min-width: 1050px;
  border-collapse: collapse;
}

th,
td {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
}

th {
  color: #374151;
  background: #f9fafb;
}

.status-badge {
  display: inline-block;
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}

.status-active {
  background: #dcfce7;
  color: #15803d;
}

.status-inactive {
  background: #fee2e2;
  color: #b91c1c;
}

.action-buttons {
  display: flex;
  gap: 7px;
}

.edit-button {
  border: 0;
  background: #f59e0b;
  color: white;
}

.delete-button {
  border: 0;
  background: #dc2626;
  color: white;
}

.activate-button {
  border: 0;
  background: #16a34a;
  color: white;
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

.loading-message,
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