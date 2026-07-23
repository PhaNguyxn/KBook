<script setup>
import {
  onMounted,
  reactive,
  ref,
} from "vue";

import { useRouter } from "vue-router";

import { employeeApi } from "@/api/employeeApi";
import { useAuthStore } from "@/stores/auth";

import { formatDate } from "@/utils/date";
import { getErrorMessage } from "@/utils/error";

const router = useRouter();
const authStore = useAuthStore();

const employees = ref([]);
const loading = ref(false);
const processingId = ref("");
const errorMessage = ref("");
const successMessage = ref("");

const filters = reactive({
  page: 1,
  limit: 10,
  keyword: "",
  role: "",
  status: "",
  sort: "",
});

const pagination = reactive({
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
});

function isCurrentEmployee(employee) {
  return (
    employee._id === authStore.employee?._id
  );
}

function getRoleText(role) {
  return role === "admin"
    ? "Quản trị viên"
    : "Nhân viên";
}

async function loadEmployees() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await employeeApi.getAll({
      page: filters.page,
      limit: filters.limit,
      keyword: filters.keyword || undefined,
      role: filters.role || undefined,
      status:
        filters.status === ""
          ? undefined
          : filters.status,
      sort: filters.sort || undefined,
    });

    employees.value =
      response.data.data.employees || [];

    Object.assign(
      pagination,
      response.data.data.pagination,
    );
  } catch (error) {
    errorMessage.value = getErrorMessage(
      error,
      "Không thể tải danh sách nhân viên",
    );
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  filters.page = 1;
  loadEmployees();
}

function resetFilters() {
  filters.page = 1;
  filters.keyword = "";
  filters.role = "";
  filters.status = "";
  filters.sort = "";

  loadEmployees();
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
  loadEmployees();
}

async function lockEmployee(employee) {
  if (isCurrentEmployee(employee)) {
    errorMessage.value =
      "Bạn không thể tự khóa tài khoản của mình";
    return;
  }

  const confirmed = window.confirm(
    `Bạn có chắc muốn khóa tài khoản "${employee.fullName}"?`,
  );

  if (!confirmed) {
    return;
  }

  processingId.value = employee._id;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    await employeeApi.delete(employee._id);

    successMessage.value =
      "Khóa nhân viên thành công";

    await loadEmployees();
  } catch (error) {
    errorMessage.value = getErrorMessage(
      error,
      "Không thể khóa nhân viên",
    );
  } finally {
    processingId.value = "";
  }
}

async function activateEmployee(employee) {
  const confirmed = window.confirm(
    `Kích hoạt lại tài khoản "${employee.fullName}"?`,
  );

  if (!confirmed) {
    return;
  }

  processingId.value = employee._id;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    await employeeApi.update(employee._id, {
      status: true,
    });

    successMessage.value =
      "Kích hoạt nhân viên thành công";

    await loadEmployees();
  } catch (error) {
    errorMessage.value = getErrorMessage(
      error,
      "Không thể kích hoạt nhân viên",
    );
  } finally {
    processingId.value = "";
  }
}

onMounted(loadEmployees);
</script>

<template>
  <section class="employee-list-page">
    <header class="page-header">
      <div>
        <h1>Quản lý nhân viên</h1>

        <p>
          Quản lý tài khoản, vai trò và trạng thái
          nhân viên.
        </p>
      </div>

      <button
        type="button"
        class="primary-button"
        @click="router.push('/employees/create')"
      >
        + Thêm nhân viên
      </button>
    </header>

    <form
      class="filter-card"
      @submit.prevent="handleSearch"
    >
      <div class="filter-grid">
        <div class="form-group keyword-group">
          <label for="keyword">Tìm kiếm</label>

          <input
            id="keyword"
            v-model="filters.keyword"
            type="search"
            placeholder="Mã, tên, email hoặc số điện thoại"
          />
        </div>

        <div class="form-group">
          <label for="role">Vai trò</label>

          <select
            id="role"
            v-model="filters.role"
          >
            <option value="">Tất cả</option>

            <option value="admin">
              Quản trị viên
            </option>

            <option value="staff">
              Nhân viên
            </option>
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

            <option value="employeeCode">
              Theo mã nhân viên
            </option>

            <option value="name">
              Theo tên nhân viên
            </option>

            <option value="role">
              Theo vai trò
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
      <p
        v-if="loading"
        class="state-message"
      >
        Đang tải danh sách nhân viên...
      </p>

      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>STT</th>
              <th>Mã nhân viên</th>
              <th>Họ và tên</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Ngày sinh</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(employee, index) in employees"
              :key="employee._id"
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
                <strong>
                  {{ employee.employeeCode }}
                </strong>
              </td>

              <td>
                {{ employee.fullName }}

                <small
                  v-if="isCurrentEmployee(employee)"
                >
                  Tài khoản hiện tại
                </small>
              </td>

              <td>{{ employee.email }}</td>
              <td>{{ employee.phone }}</td>

              <td>
                {{ formatDate(employee.birthday) }}
              </td>

              <td>
                <span
                  class="role-badge"
                  :class="
                    employee.role === 'admin'
                      ? 'role-admin'
                      : 'role-staff'
                  "
                >
                  {{ getRoleText(employee.role) }}
                </span>
              </td>

              <td>
                <span
                  class="status-badge"
                  :class="
                    employee.status
                      ? 'status-active'
                      : 'status-inactive'
                  "
                >
                  {{
                    employee.status
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
                        `/employees/${employee._id}/edit`,
                      )
                    "
                  >
                    Sửa
                  </button>

                  <button
                    v-if="employee.status"
                    type="button"
                    class="lock-button"
                    :disabled="
                      isCurrentEmployee(employee) ||
                      processingId === employee._id
                    "
                    @click="lockEmployee(employee)"
                  >
                    {{
                      processingId === employee._id
                        ? "Đang xử lý..."
                        : "Khóa"
                    }}
                  </button>

                  <button
                    v-else
                    type="button"
                    class="activate-button"
                    :disabled="
                      processingId === employee._id
                    "
                    @click="
                      activateEmployee(employee)
                    "
                  >
                    {{
                      processingId === employee._id
                        ? "Đang xử lý..."
                        : "Kích hoạt"
                    }}
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="employees.length === 0">
              <td
                colspan="9"
                class="empty-cell"
              >
                Không tìm thấy nhân viên
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
        — Tổng {{ pagination.total }} nhân viên
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
.employee-list-page {
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
  min-width: 1200px;
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
  color: #2563eb;
}

.role-badge,
.status-badge {
  display: inline-block;
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.role-admin {
  background: #ede9fe;
  color: #6d28d9;
}

.role-staff {
  background: #dbeafe;
  color: #1d4ed8;
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

.lock-button {
  border: 0;
  background: #dc2626;
  color: white;
}

.activate-button {
  border: 0;
  background: #16a34a;
  color: white;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
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