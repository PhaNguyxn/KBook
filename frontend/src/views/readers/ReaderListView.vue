<script setup>
import {
  computed,
  onMounted,
  reactive,
  ref,
} from "vue";

import {
  RouterLink,
  useRouter,
} from "vue-router";

import { readerApi } from "@/api/readerApi";
import { formatDate } from "@/utils/date";
import { getErrorMessage } from "@/utils/error";

const router = useRouter();

/* =========================================
   STATE
========================================= */

const readers = ref([]);

const loading = ref(false);
const processingId = ref("");

const errorMessage = ref("");
const successMessage = ref("");

const filters = reactive({
  page: 1,
  limit: 10,
  keyword: "",
  gender: "",
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

function clearMessages() {
  errorMessage.value = "";
  successMessage.value = "";
}

function getFullName(reader) {
  return `${reader.lastName || ""} ${
    reader.firstName || ""
  }`.trim();
}

function getInitials(reader) {
  const firstName = String(
    reader.firstName || "",
  ).trim();

  const lastName = String(
    reader.lastName || "",
  ).trim();

  const firstCharacter =
    lastName.charAt(0);

  const secondCharacter =
    firstName.charAt(0);

  return (
    `${firstCharacter}${secondCharacter}`
      .toUpperCase() || "ĐG"
  );
}

function getGenderClass(gender) {
  const value = String(
    gender || "",
  ).toLowerCase();

  if (value === "nam") {
    return "gender-male";
  }

  if (value === "nữ") {
    return "gender-female";
  }

  return "gender-other";
}

/* =========================================
   TẢI DANH SÁCH ĐỘC GIẢ
========================================= */

async function loadReaders() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response =
      await readerApi.getAll({
        page: filters.page,
        limit: filters.limit,

        keyword:
          filters.keyword.trim() ||
          undefined,

        gender:
          filters.gender ||
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
      readers.value = payload;

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

    readers.value =
      payload.readers ||
      payload.items ||
      payload.results ||
      [];

    const pageData =
      payload.pagination || {};

    const total =
      Number(
        pageData.total ??
          payload.total ??
          readers.value.length,
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
      "Load readers error:",
      error,
    );

    readers.value = [];

    errorMessage.value =
      getErrorMessage(
        error,
        "Không thể tải danh sách độc giả",
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
  loadReaders();
}

function resetFilters() {
  clearMessages();

  filters.page = 1;
  filters.limit = 10;
  filters.keyword = "";
  filters.gender = "";
  filters.sort = "latest";

  loadReaders();
}

function handleFilterChange() {
  clearMessages();
  filters.page = 1;
  loadReaders();
}

function handleLimitChange() {
  clearMessages();
  filters.page = 1;
  loadReaders();
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

  loadReaders();

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

/* =========================================
   XÓA ĐỘC GIẢ
========================================= */

async function deleteReader(reader) {
  const readerName =
    getFullName(reader);

  const accepted =
    window.confirm(
      `Bạn có chắc muốn xóa độc giả "${readerName}"?\n\nDữ liệu đã xóa sẽ không thể khôi phục.`,
    );

  if (!accepted) {
    return;
  }

  clearMessages();

  processingId.value =
    reader._id;

  try {
    await readerApi.delete(
      reader._id,
    );

    successMessage.value =
      "Xóa độc giả thành công";

    /*
     * Nếu xóa bản ghi cuối cùng của trang hiện tại,
     * quay về trang trước để tránh trang trống.
     */
    if (
      readers.value.length === 1 &&
      filters.page > 1
    ) {
      filters.page -= 1;
    }

    await loadReaders();
  } catch (error) {
    errorMessage.value =
      getErrorMessage(
        error,
        "Không thể xóa độc giả",
      );
  } finally {
    processingId.value = "";
  }
}

/* =========================================
   KHỞI TẠO
========================================= */

onMounted(() => {
  loadReaders();
});
</script>

<template>
  <section class="reader-page">
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

    <!-- Thông báo thành công -->
    <div
      v-if="successMessage"
      class="alert alert-success"
      role="alert"
    >
      <i
        class="bi bi-check-circle-fill me-2"
      />

      {{ successMessage }}
    </div>

    <!-- Bộ lọc -->
    <div class="filter-card">
      <div class="filter-heading">
        <div>
          <h2>
            Tìm kiếm và bộ lọc
          </h2>

        </div>

        <RouterLink
          to="/readers/create"
          class="add-reader-button"
        >
          <i class="bi bi-plus-lg" />

          Thêm độc giả mới
        </RouterLink>
      </div>

      <form
        class="filter-grid"
        @submit.prevent="handleSearch"
      >
        <!-- Tìm kiếm -->
        <div class="search-field">
          <label for="readerKeyword">
            Tìm kiếm độc giả
          </label>

          <div
            class="input-icon-wrapper"
          >
            <i class="bi bi-search" />

            <input
              id="readerKeyword"
              v-model="filters.keyword"
              type="search"
              placeholder="Nhập mã, họ tên hoặc số điện thoại..."
            />
          </div>
        </div>

        <!-- Giới tính -->
        <div>
          <label for="readerGender">
            Giới tính
          </label>

          <select
            id="readerGender"
            v-model="filters.gender"
            class="custom-select"
            @change="
              handleFilterChange
            "
          >
            <option value="">
              Tất cả giới tính
            </option>

            <option value="Nam">
              Nam
            </option>

            <option value="Nữ">
              Nữ
            </option>

            <option value="Khác">
              Khác
            </option>
          </select>
        </div>

        <!-- Sắp xếp -->
        <div>
          <label for="readerSort">
            Sắp xếp
          </label>

          <select
            id="readerSort"
            v-model="filters.sort"
            class="custom-select"
            @change="
              handleFilterChange
            "
          >
            <option value="latest">
              Mới nhất
            </option>

            <option value="readerCode">
              Theo mã độc giả
            </option>

            <option value="name">
              Theo tên độc giả
            </option>
          </select>
        </div>

        <!-- Số dòng -->
        <div>
          <label for="readerLimit">
            Số dòng
          </label>

          <select
            id="readerLimit"
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

    <!-- Bảng độc giả -->
    <div class="reader-table-card">
      <div
        class="table-card-header"
      >
        <div>
          <h2>
            Danh sách độc giả
          </h2>

          <p>
            Tổng cộng
            <strong>
              {{ pagination.total }}
            </strong>
            độc giả.
          </p>
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
          Đang tải danh sách độc giả
        </strong>

        <span>
          Vui lòng chờ trong giây lát...
        </span>
      </div>

      <!-- Bảng -->
      <div
        v-else
        class="table-responsive"
      >
        <table class="reader-table">
          <thead>
            <tr>
              <th class="stt-column">
                STT
              </th>

              <th>Độc giả</th>

              <th>Ngày sinh</th>

              <th>Giới tính</th>

              <th>Số điện thoại</th>

              <th>Địa chỉ</th>

              <th class="action-column">
                Thao tác
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(
                reader,
                index
              ) in readers"
              :key="reader._id"
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

              <!-- Thông tin độc giả -->
              <td>
                <div
                  class="reader-information"
                >
                  <div
                    class="reader-avatar"
                  >
                    {{
                      getInitials(
                        reader,
                      )
                    }}
                  </div>

                  <div
                    class="reader-text"
                  >
                    <span
                      class="reader-code"
                    >
                      {{
                        reader.readerCode ||
                        "Chưa có mã"
                      }}
                    </span>

                    <strong
                      class="reader-name"
                    >
                      {{
                        getFullName(
                          reader,
                        ) ||
                        "Chưa cập nhật tên"
                      }}
                    </strong>

                    <span
                      class="reader-phone-small"
                    >
                      <i
                        class="bi bi-telephone"
                      />

                      {{
                        reader.phone ||
                        "Chưa có số điện thoại"
                      }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- Ngày sinh -->
              <td>
                <div class="date-value">
                  <i
                    class="bi bi-calendar3"
                  />

                  <span>
                    {{
                      reader.birthday
                        ? formatDate(
                            reader.birthday,
                          )
                        : "—"
                    }}
                  </span>
                </div>
              </td>

              <!-- Giới tính -->
              <td>
                <span
                  class="gender-badge"
                  :class="
                    getGenderClass(
                      reader.gender,
                    )
                  "
                >
                  <i
                    class="bi bi-person"
                  />

                  {{
                    reader.gender ||
                    "Khác"
                  }}
                </span>
              </td>

              <!-- Số điện thoại -->
              <td>
                <span
                  class="phone-value"
                >
                  {{
                    reader.phone ||
                    "—"
                  }}
                </span>
              </td>

              <!-- Địa chỉ -->
              <td>
                <div
                  class="address-value"
                  :title="
                    reader.address || ''
                  "
                >
                  <i
                    class="bi bi-geo-alt"
                  />

                  <span>
                    {{
                      reader.address ||
                      "Chưa cập nhật"
                    }}
                  </span>
                </div>
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
                      router.push(
                        `/readers/${reader._id}`,
                      )
                    "
                  >
                    <i class="bi bi-eye" />
                  </button>

                  <button
                    type="button"
                    class="action-button action-edit"
                    title="Cập nhật độc giả"
                    @click="
                      router.push(
                        `/readers/${reader._id}/edit`,
                      )
                    "
                  >
                    <i
                      class="bi bi-pencil-square"
                    />
                  </button>

                  <button
                    type="button"
                    class="action-button action-delete"
                    title="Xóa độc giả"
                    :disabled="
                      processingId === reader._id
                    "
                    @click="deleteReader(reader)"
                  >
                    <span
                      v-if="
                        processingId === reader._id
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

            <!-- Không có dữ liệu -->
            <tr
              v-if="
                readers.length === 0
              "
            >
              <td
                colspan="7"
                class="empty-table-cell"
              >
                <div
                  class="empty-state"
                >
                  <div
                    class="empty-icon"
                  >
                    <i
                      class="bi bi-people"
                    />
                  </div>

                  <h3>
                    Không tìm thấy độc giả
                  </h3>

                  <p>
                    Không có độc giả phù
                    hợp với điều kiện tìm
                    kiếm hiện tại.
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

          độc giả
        </div>

        <nav
          class="pagination-buttons"
          aria-label="Phân trang độc giả"
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
              !pagination
                .hasNextPage
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
  </section>
</template>

<style scoped>
.reader-page {
  width: 100%;
  max-width: 1600px;
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
.reader-table-card {
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

.alert {
  margin: 0;
  border-radius: 12px;
  font-size: 13px;
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

.add-reader-button {
  height: 43px;
  padding: 0 17px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  border-radius: 10px;
  background: linear-gradient(
    135deg,
    #438df8,
    #2563eb
  );
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
  box-shadow:
    0 8px 18px
    rgb(37 99 235 / 20%);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.add-reader-button:hover {
  color: #fff;
  transform: translateY(-2px);
  box-shadow:
    0 11px 23px
    rgb(37 99 235 / 26%);
}

.filter-grid {
  display: grid;
  grid-template-columns:
    minmax(280px, 2fr)
    minmax(145px, 1fr)
    minmax(155px, 1fr)
    minmax(110px, 0.7fr)
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
  padding: 0 16px;
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
  box-shadow:
    0 8px 18px
    rgb(37 99 235 / 24%);
}

.reset-filter-button:disabled,
.search-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* =========================================
   TIÊU ĐỀ BẢNG
========================================= */

.reader-table-card {
  overflow: hidden;
}

.table-card-header {
  padding: 22px 25px;
  border-bottom: 1px solid #edf2f7;
}

/* =========================================
   BẢNG
========================================= */

.table-responsive {
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
}

.reader-table {
  width: 100%;
  min-width: 1180px;
  border-collapse: collapse;
}

.reader-table th {
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

.reader-table td {
  padding: 15px;
  border-bottom: 1px solid #edf2f7;
  color: #475569;
  font-size: 12px;
  vertical-align: middle;
}

.reader-table tbody tr {
  transition: background 0.2s ease;
}

.reader-table tbody tr:hover {
  background: #f8fbff;
}

.reader-table tbody tr:last-child td {
  border-bottom: 0;
}

.stt-column,
.stt-cell {
  width: 58px;
  text-align: center !important;
}

.action-column {
  width: 145px;
  text-align: center !important;
}

/* =========================================
   THÔNG TIN ĐỘC GIẢ
========================================= */

.reader-information {
  min-width: 230px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.reader-avatar {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 13px;
  background: linear-gradient(
    135deg,
    #dbeafe,
    #eff6ff
  );
  color: #2563eb;
  font-size: 13px;
  font-weight: 800;
  box-shadow:
    0 5px 12px
    rgb(37 99 235 / 10%);
}

.reader-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.reader-code {
  margin-bottom: 3px;
  color: #3b82f6;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.reader-name {
  max-width: 210px;
  overflow: hidden;
  color: #1e3a8a;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reader-phone-small {
  margin-top: 5px;
  display: flex;
  align-items: center;
  gap: 5px;
  color: #94a3b8;
  font-size: 10px;
}

/* =========================================
   NGÀY, GIỚI TÍNH, SỐ ĐIỆN THOẠI
========================================= */

.date-value,
.address-value {
  display: flex;
  align-items: center;
  gap: 7px;
}

.date-value i,
.address-value i {
  color: #94a3b8;
}

.gender-badge {
  padding: 6px 9px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}

.gender-male {
  background: #e0f2fe;
  color: #0369a1;
}

.gender-female {
  background: #fce7f3;
  color: #be185d;
}

.gender-other {
  background: #f1f5f9;
  color: #64748b;
}

.phone-value {
  color: #334155;
  font-weight: 600;
  white-space: nowrap;
}

.address-value {
  max-width: 210px;
}

.address-value span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.action-edit {
  background: #fef3c7;
  color: #d97706;
}

.action-delete {
  background: #fee2e2;
  color: #dc2626;
}

.action-delete:hover:not(:disabled) {
  background: #fecaca;
  color: #b91c1c;
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

.loading-state span {
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

  .search-field {
    grid-column: span 2;
  }
}

@media (max-width: 800px) {
  .filter-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .add-reader-button {
    width: 100%;
  }

  .filter-grid {
    grid-template-columns:
      repeat(
        2,
        minmax(0, 1fr)
      );
  }

  .search-field {
    grid-column: 1 / -1;
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
  .reader-page {
    gap: 16px;
  }

  .filter-card {
    padding: 19px;
    border-radius: 17px;
  }

  .filter-grid {
    grid-template-columns: 1fr;
  }

  .search-field {
    grid-column: auto;
  }

  .table-card-header {
    padding: 19px;
  }
}
</style>