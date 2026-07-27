<script setup>
import {
  computed,
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

/* =========================================
   STATE
========================================= */

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
  sort: "latest",
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
  const total = Number(
    pagination.totalPages || 0,
  );

  const current = Number(
    pagination.page || 1,
  );

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

/* =========================================
   HÀM HỖ TRỢ
========================================= */

function clearMessages() {
  errorMessage.value = "";
  successMessage.value = "";
}

function isCurrentEmployee(employee) {
  const currentId =
    authStore.employee?._id ||
    authStore.user?._id ||
    authStore.currentUser?._id;

  return (
    Boolean(currentId) &&
    String(employee?._id) ===
      String(currentId)
  );
}

function getEmployeeName(employee) {
  if (!employee) {
    return "Chưa cập nhật";
  }

  return (
    employee.fullName ||
    `${employee.lastName || ""} ${
      employee.firstName || ""
    }`.trim() ||
    "Chưa cập nhật"
  );
}

function getEmployeeInitials(employee) {
  const name = getEmployeeName(
    employee,
  );

  if (
    !name ||
    name === "Chưa cập nhật"
  ) {
    return "NV";
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
}

function getRoleText(role) {
  return role === "admin"
    ? "Quản trị viên"
    : "Nhân viên";
}

function getRoleIcon(role) {
  return role === "admin"
    ? "bi-shield-check"
    : "bi-person-badge";
}

/* =========================================
   TẢI DANH SÁCH
========================================= */

async function loadEmployees() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response =
      await employeeApi.getAll({
        page: filters.page,
        limit: filters.limit,

        keyword:
          filters.keyword.trim() ||
          undefined,

        role:
          filters.role ||
          undefined,

        sort:
          filters.sort === "latest"
            ? undefined
            : filters.sort,
      });

    const payload =
      response?.data?.data ??
      response?.data ??
      {};

    if (Array.isArray(payload)) {
      employees.value = payload;

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

    employees.value =
      payload.employees ||
      payload.items ||
      payload.results ||
      [];

    const pageData =
      payload.pagination || {};

    const total =
      Number(
        pageData.total ??
          payload.total ??
          employees.value.length,
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
      "Load employees error:",
      error,
    );

    employees.value = [];

    errorMessage.value =
      getErrorMessage(
        error,
        "Không thể tải danh sách nhân viên",
      );
  } finally {
    loading.value = false;
  }
}

/* =========================================
   BỘ LỌC
========================================= */

function handleSearch() {
  clearMessages();
  filters.page = 1;
  loadEmployees();
}

function handleFilterChange() {
  clearMessages();
  filters.page = 1;
  loadEmployees();
}

function handleLimitChange() {
  clearMessages();
  filters.page = 1;
  loadEmployees();
}

function resetFilters() {
  clearMessages();

  filters.page = 1;
  filters.limit = 10;
  filters.keyword = "";
  filters.role = "";
  filters.sort = "latest";

  loadEmployees();
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
  loadEmployees();

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

/* =========================================
   XÓA NHÂN VIÊN
========================================= */

async function deleteEmployee(employee) {
  if (isCurrentEmployee(employee)) {
    errorMessage.value =
      "Bạn không thể tự xóa tài khoản đang đăng nhập";

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    return;
  }

  const employeeName =
    getEmployeeName(employee);

  const confirmed =
    window.confirm(
      `Bạn có chắc muốn xóa nhân viên "${employeeName}"?\n\nDữ liệu đã xóa sẽ không thể khôi phục.`,
    );

  if (!confirmed) {
    return;
  }

  clearMessages();

  processingId.value =
    employee._id;

  try {
    await employeeApi.delete(
      employee._id,
    );

    /*
     * Xóa ngay khỏi danh sách để giao diện
     * phản hồi lập tức.
     */
    employees.value =
      employees.value.filter(
        (item) =>
          item._id !== employee._id,
      );

    pagination.total = Math.max(
      pagination.total - 1,
      0,
    );

    if (
      employees.value.length === 0 &&
      filters.page > 1
    ) {
      filters.page -= 1;
    }

    successMessage.value =
      "Xóa nhân viên thành công";

    await loadEmployees();
  } catch (error) {
    errorMessage.value =
      getErrorMessage(
        error,
        "Không thể xóa nhân viên",
      );
  } finally {
    processingId.value = "";
  }
}

/* =========================================
   KHỞI TẠO
========================================= */

onMounted(() => {
  loadEmployees();
});
</script>

<template>
  <section class="employee-list-page">
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
    <section class="filter-card">
      <div class="filter-heading">
        <div>
          <h1>
            Quản lý nhân viên
          </h1>
        </div>

        <button
          type="button"
          class="create-button"
          @click="
            router.push(
              '/employees/create',
            )
          "
        >
          <i class="bi bi-person-plus" />

          Thêm nhân viên
        </button>
      </div>

      <form
        class="filter-grid"
        @submit.prevent="handleSearch"
      >
        <div class="keyword-group">
          <label for="keyword">
            Tìm kiếm nhân viên
          </label>

          <div class="input-icon-wrapper">
            <i class="bi bi-search" />

            <input
              id="keyword"
              v-model="filters.keyword"
              type="search"
              placeholder="Nhập mã, tên, email hoặc số điện thoại..."
            />
          </div>
        </div>

        <div>
          <label for="role">
            Vai trò
          </label>

          <select
            id="role"
            v-model="filters.role"
            class="custom-select"
            @change="handleFilterChange"
          >
            <option value="">
              Tất cả vai trò
            </option>

            <option value="admin">
              Quản trị viên
            </option>

            <option value="staff">
              Nhân viên
            </option>
          </select>
        </div>

        <div>
          <label for="sort">
            Sắp xếp
          </label>

          <select
            id="sort"
            v-model="filters.sort"
            class="custom-select"
            @change="handleFilterChange"
          >
            <option value="latest">
              Mới tạo gần đây
            </option>

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

        <div>
          <label for="limit">
            Số dòng
          </label>

          <select
            id="limit"
            v-model.number="filters.limit"
            class="custom-select"
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
    </section>

    <!-- Bảng danh sách -->
    <section class="table-card">
      <div class="table-card-header">
        <div>
          <h2>
            Danh sách nhân viên
          </h2>

          <p>
            Tổng cộng
            <strong>
              {{ pagination.total }}
            </strong>
            nhân viên.
          </p>
        </div>

        <div class="total-box">
          <div class="total-icon">
            <i
              class="bi bi-people"
            />
          </div>

          <div>
            <span>
              Tổng nhân viên
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
          Đang tải danh sách nhân viên
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
        <table class="employee-table">
          <colgroup>
            <col class="column-index" />
            <col class="column-code" />
            <col class="column-employee" />
            <col class="column-email" />
            <col class="column-phone" />
            <col class="column-birthday" />
            <col class="column-role" />
            <col class="column-action" />
          </colgroup>

          <thead>
            <tr>
              <th class="center-column">
                STT
              </th>

              <th>
                Mã nhân viên
              </th>

              <th>
                Nhân viên
              </th>

              <th>
                Email
              </th>

              <th>
                Số điện thoại
              </th>

              <th>
                Ngày sinh
              </th>

              <th>
                Vai trò
              </th>

              <th class="center-column">
                Thao tác
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(
                employee,
                index
              ) in employees"
              :key="employee._id"
            >
              <td class="center-column index-cell">
                {{
                  (pagination.page - 1) *
                    pagination.limit +
                  index +
                  1
                }}
              </td>

              <td>
                <span class="employee-code">

                  {{
                    employee.employeeCode ||
                    "Chưa có mã"
                  }}
                </span>
              </td>

              <td>
                <div class="employee-information">
                  <div
                    class="employee-avatar"
                    :class="{
                      'current-avatar':
                        isCurrentEmployee(
                          employee,
                        ),
                    }"
                  >
                    {{
                      getEmployeeInitials(
                        employee,
                      )
                    }}
                  </div>

                  <div class="employee-text">
                    <strong
                      :title="
                        getEmployeeName(
                          employee,
                        )
                      "
                    >
                      {{
                        getEmployeeName(
                          employee,
                        )
                      }}
                    </strong>

                    <span
                      v-if="
                        isCurrentEmployee(
                          employee,
                        )
                      "
                      class="current-account"
                    >
                      <i
                        class="bi bi-check-circle-fill"
                      />

                      Tài khoản hiện tại
                    </span>

                    <small v-else>
                      <i
                        class="bi bi-person"
                      />

                      Tài khoản nhân viên
                    </small>
                  </div>
                </div>
              </td>

              <td>
                <div class="contact-value">
                  <i
                    class="bi bi-envelope"
                  />

                  <span
                    :title="
                      employee.email ||
                      'Chưa cập nhật'
                    "
                  >
                    {{
                      employee.email ||
                      "Chưa cập nhật"
                    }}
                  </span>
                </div>
              </td>

              <td>
                <div class="contact-value">
                  <i
                    class="bi bi-telephone"
                  />

                  <span>
                    {{
                      employee.phone ||
                      "Chưa cập nhật"
                    }}
                  </span>
                </div>
              </td>

              <td>
                <div class="date-value">
                  <i
                    class="bi bi-calendar3"
                  />

                  <span>
                    {{
                      employee.birthday
                        ? formatDate(
                            employee.birthday,
                          )
                        : "Chưa cập nhật"
                    }}
                  </span>
                </div>
              </td>

              <td>
                <span
                  class="role-badge"
                  :class="
                    employee.role ===
                    'admin'
                      ? 'role-admin'
                      : 'role-staff'
                  "
                >
                  <i
                    class="bi"
                    :class="
                      getRoleIcon(
                        employee.role,
                      )
                    "
                  />

                  {{
                    getRoleText(
                      employee.role,
                    )
                  }}
                </span>
              </td>

              <td>
                <div class="action-buttons">
                  <button
                    type="button"
                    class="action-button edit-action"
                    title="Cập nhật nhân viên"
                    @click="
                      router.push(
                        `/employees/${employee._id}/edit`,
                      )
                    "
                  >
                    <i
                      class="bi bi-pencil-square"
                    />
                  </button>

                  <button
                    type="button"
                    class="action-button delete-action"
                    :title="
                      isCurrentEmployee(
                        employee,
                      )
                        ? 'Không thể tự xóa tài khoản'
                        : 'Xóa nhân viên'
                    "
                    :disabled="
                      isCurrentEmployee(
                        employee,
                      ) ||
                      processingId ===
                        employee._id
                    "
                    @click="
                      deleteEmployee(
                        employee,
                      )
                    "
                  >
                    <span
                      v-if="
                        processingId ===
                        employee._id
                      "
                      class="spinner-border spinner-border-sm"
                    />

                    <i
                      v-else
                      class="bi bi-trash3"
                    />
                  </button>
                </div>
              </td>
            </tr>

            <tr
              v-if="
                employees.length === 0
              "
            >
              <td
                colspan="8"
                class="empty-table-cell"
              >
                <div class="empty-state">
                  <div class="empty-icon">
                    <i
                      class="bi bi-person-x"
                    />
                  </div>

                  <h3>
                    Không tìm thấy nhân viên
                  </h3>

                  <p>
                    Không có nhân viên phù hợp
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
      <footer
        v-if="
          !loading &&
          pagination.total > 0
        "
        class="pagination-container"
      >
        <div class="pagination-information">
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

          nhân viên
        </div>

        <nav
          class="pagination-buttons"
          aria-label="Phân trang nhân viên"
        >
          <button
            type="button"
            class="page-button"
            :disabled="
              !pagination.hasPreviousPage
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
      </footer>
    </section>
  </section>
</template>

<style scoped>
.employee-list-page {
  width: 100%;
  max-width: 1500px;
  min-width: 0;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

/* =========================================
   CARD CHUNG
========================================= */

.filter-card,
.table-card {
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
   BỘ LỌC
========================================= */

.filter-card {
  padding: 25px;
}

.filter-heading {
  margin-bottom: 22px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
}

.filter-heading h1,
.table-card-header h2 {
  margin: 0;
  color: #1e3a8a;
  font-size: 21px;
  font-weight: 900;
}

.filter-heading p,
.table-card-header p {
  margin: 6px 0 0;
  color: #94a3b8;
  font-size: 11px;
}

.table-card-header p strong {
  color: #2563eb;
}

.create-button {
  min-height: 43px;
  padding: 0 17px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  border: 0;
  border-radius: 10px;
  background: linear-gradient(
    135deg,
    #438df8,
    #2563eb
  );
  color: #fff;
  font-size: 11px;
  font-weight: 800;
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
    minmax(300px, 2fr)
    minmax(155px, 1fr)
    minmax(180px, 1.2fr)
    minmax(105px, 0.7fr)
    105px
    105px;
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
  font-size: 10px;
  font-weight: 800;
}

.input-icon-wrapper {
  position: relative;
}

.input-icon-wrapper > i {
  position: absolute;
  top: 50%;
  left: 14px;
  color: #94a3b8;
  transform: translateY(-50%);
  pointer-events: none;
}

.input-icon-wrapper input,
.custom-select {
  width: 100%;
  height: 43px;
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

.reset-button,
.search-button {
  width: 100%;
  min-height: 43px;
  padding: 0 13px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 7px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 800;
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
}

.reset-button:disabled,
.search-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

/* =========================================
   HEADER BẢNG
========================================= */

.table-card {
  overflow: hidden;
}

.table-card-header {
  padding: 21px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
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
   BẢNG
========================================= */

.table-wrapper {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
}

.employee-table {
  width: 100%;
  min-width: 1080px;
  table-layout: fixed;
  border-collapse: collapse;
}

.column-index {
  width: 5%;
}

.column-code {
  width: 12%;
}

.column-employee {
  width: 20%;
}

.column-email {
  width: 18%;
}

.column-phone {
  width: 13%;
}

.column-birthday {
  width: 12%;
}

.column-role {
  width: 12%;
}

.column-action {
  width: 8%;
}

.employee-table th {
  padding: 13px 11px;
  border-bottom: 1px solid #e7edf5;
  background: #f8fafc;
  color: #64748b;
  font-size: 9px;
  font-weight: 900;
  letter-spacing: 0.4px;
  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
}

.employee-table td {
  min-width: 0;
  padding: 14px 11px;
  border-bottom: 1px solid #edf2f7;
  color: #475569;
  font-size: 10px;
  vertical-align: middle;
}

.employee-table tbody tr {
  transition: background 0.2s ease;
}

.employee-table tbody tr:hover {
  background: #f8fbff;
}

.employee-table tbody tr:last-child td {
  border-bottom: 0;
}

.center-column {
  text-align: center !important;
}

.index-cell {
  color: #64748b;
  font-weight: 700;
}

/* =========================================
   MÃ VÀ THÔNG TIN NHÂN VIÊN
========================================= */

.employee-code {
  max-width: 100%;
  padding: 6px 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  border-radius: 8px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 9px;
  font-weight: 900;
  white-space: nowrap;
}

.employee-information {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.employee-avatar {
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

.current-avatar {
  background: linear-gradient(
    135deg,
    #dcfce7,
    #ecfdf5
  );
  color: #059669;
}

.employee-text {
  min-width: 0;
  flex: 1;
}

.employee-text strong {
  display: block;
  overflow: hidden;
  color: #1e3a8a;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.employee-text small,
.current-account {
  margin-top: 5px;
  display: flex;
  align-items: center;
  gap: 5px;
  overflow: hidden;
  font-size: 8px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.employee-text small {
  color: #94a3b8;
}

.current-account {
  color: #059669;
  font-weight: 800;
}

/* =========================================
   LIÊN HỆ VÀ NGÀY SINH
========================================= */

.contact-value,
.date-value {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 7px;
}

.contact-value i,
.date-value i {
  flex-shrink: 0;
  color: #94a3b8;
}

.contact-value span,
.date-value span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* =========================================
   VAI TRÒ
========================================= */

.role-badge {
  max-width: 100%;
  padding: 6px 9px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  border-radius: 999px;
  font-size: 8px;
  font-weight: 900;
  text-overflow: ellipsis;
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

/* =========================================
   THAO TÁC
========================================= */

.action-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
}

.action-button {
  width: 33px;
  height: 33px;
  padding: 0;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border: 0;
  border-radius: 9px;
  font-size: 12px;
  transition:
    transform 0.2s ease,
    background 0.2s ease;
}

.action-button:hover:not(:disabled) {
  transform: translateY(-2px);
}

.action-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.edit-action {
  background: #fef3c7;
  color: #d97706;
}

.edit-action:hover:not(:disabled) {
  background: #fde68a;
}

.delete-action {
  background: #fee2e2;
  color: #dc2626;
}

.delete-action:hover:not(:disabled) {
  background: #fecaca;
  color: #b91c1c;
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
  font-size: 14px;
}

.loading-state span {
  margin-top: 6px;
  color: #94a3b8;
  font-size: 11px;
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
  font-size: 16px;
}

.empty-state p {
  max-width: 390px;
  margin: 0;
  color: #94a3b8;
  font-size: 11px;
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
  font-size: 10px;
  font-weight: 800;
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
  font-size: 10px;
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
  font-size: 10px;
  font-weight: 800;
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

@media (max-width: 1200px) {
  .filter-grid {
    grid-template-columns:
      repeat(
        3,
        minmax(0, 1fr)
      );
  }
}

@media (max-width: 820px) {
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

@media (max-width: 560px) {
  .employee-list-page {
    gap: 16px;
  }

  .filter-card {
    padding: 19px;
    border-radius: 17px;
  }

  .filter-grid {
    grid-template-columns: 1fr;
  }

  .table-card {
    border-radius: 17px;
  }

  .table-card-header {
    padding: 19px;
  }
}
</style>
