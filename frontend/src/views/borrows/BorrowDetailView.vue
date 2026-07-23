<script setup>
import {
  computed,
  onMounted,
  ref,
} from "vue";

import {
  useRoute,
  useRouter,
} from "vue-router";

import { borrowApi } from "@/api/borrowApi";
import { getImageUrl } from "@/utils/image";

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

const route = useRoute();
const router = useRouter();

const borrow = ref(null);
const details = ref([]);
const loading = ref(false);
const returning = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const totalQuantity = computed(() => {
  return details.value.reduce(
    (total, detail) =>
      total + Number(detail.quantity || 0),
    0,
  );
});

async function loadBorrow() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await borrowApi.getById(
      route.params.id,
    );

    borrow.value = response.data.data.borrow;
    details.value =
      response.data.data.details || [];
  } catch (error) {
    errorMessage.value = getErrorMessage(
      error,
      "Không thể tải chi tiết phiếu mượn",
    );
  } finally {
    loading.value = false;
  }
}

async function handleReturnBooks() {
  if (
    !borrow.value ||
    borrow.value.status === "returned"
  ) {
    return;
  }

  const confirmed = window.confirm(
    `Xác nhận độc giả "${getReaderFullName(
      borrow.value.reader,
    )}" đã trả ${totalQuantity.value} quyển sách?`,
  );

  if (!confirmed) {
    return;
  }

  returning.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    await borrowApi.returnBooks(
      borrow.value._id,
    );

    successMessage.value =
      "Xác nhận trả sách thành công";

    await loadBorrow();
  } catch (error) {
    errorMessage.value = getErrorMessage(
      error,
      "Không thể xác nhận trả sách",
    );
  } finally {
    returning.value = false;
  }
}

onMounted(loadBorrow);
</script>

<template>
  <section class="borrow-detail-page">
    <button
      type="button"
      class="back-button"
      @click="router.push('/borrows')"
    >
      ← Quay lại danh sách
    </button>

    <p
      v-if="loading"
      class="state-message"
    >
      Đang tải chi tiết phiếu mượn...
    </p>

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

    <template v-if="!loading && borrow">
      <header class="page-header">
        <div>
          <h1>
            Phiếu mượn
            {{ getShortBorrowId(borrow._id) }}
          </h1>

          <p>
            Ngày lập:
            {{ formatDateTime(borrow.borrowDate) }}
          </p>
        </div>

        <div class="header-actions">
          <span
            class="status-badge"
            :class="
              getBorrowStatus(borrow).className
            "
          >
            {{ getBorrowStatus(borrow).text }}
          </span>

          <button
            v-if="borrow.status === 'borrowing'"
            type="button"
            class="return-button"
            :disabled="returning"
            @click="handleReturnBooks"
          >
            {{
              returning
                ? "Đang xử lý..."
                : "Xác nhận trả sách"
            }}
          </button>
        </div>
      </header>

      <div class="information-grid">
        <article class="information-card">
          <h2>Thông tin độc giả</h2>

          <dl>
            <div>
              <dt>Mã độc giả</dt>
              <dd>
                {{
                  borrow.reader?.readerCode ||
                  "—"
                }}
              </dd>
            </div>

            <div>
              <dt>Họ và tên</dt>
              <dd>
                {{
                  getReaderFullName(
                    borrow.reader,
                  )
                }}
              </dd>
            </div>

            <div>
              <dt>Số điện thoại</dt>
              <dd>
                {{ borrow.reader?.phone || "—" }}
              </dd>
            </div>

            <div>
              <dt>Địa chỉ</dt>
              <dd>
                {{
                  borrow.reader?.address ||
                  "—"
                }}
              </dd>
            </div>
          </dl>
        </article>

        <article class="information-card">
          <h2>Thông tin phiếu</h2>

          <dl>
            <div>
              <dt>Nhân viên lập</dt>
              <dd>
                {{
                  borrow.employee?.fullName ||
                  "Không xác định"
                }}
              </dd>
            </div>

            <div>
              <dt>Mã nhân viên</dt>
              <dd>
                {{
                  borrow.employee
                    ?.employeeCode || "—"
                }}
              </dd>
            </div>

            <div>
              <dt>Ngày mượn</dt>
              <dd>
                {{
                  formatDateTime(
                    borrow.borrowDate,
                  )
                }}
              </dd>
            </div>

            <div>
              <dt>Hạn trả</dt>
              <dd>
                {{ formatDate(borrow.dueDate) }}
              </dd>
            </div>

            <div>
              <dt>Ngày trả thực tế</dt>
              <dd>
                {{
                  formatDateTime(
                    borrow.returnDate,
                  )
                }}
              </dd>
            </div>
          </dl>
        </article>
      </div>

      <article class="book-list-card">
        <div class="section-heading">
          <div>
            <h2>Danh sách sách mượn</h2>

            <p>
              Tổng cộng {{ totalQuantity }} quyển
            </p>
          </div>
        </div>

        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>STT</th>
                <th>Ảnh</th>
                <th>ISBN</th>
                <th>Tên sách</th>
                <th>Tác giả</th>
                <th>Nhà xuất bản</th>
                <th>Số lượng</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(detail, index) in details"
                :key="detail._id"
              >
                <td>{{ index + 1 }}</td>

                <td>
                  <img
                    :src="
                      getImageUrl(
                        detail.book?.image,
                      )
                    "
                    :alt="
                      detail.book?.title ||
                      'Sách'
                    "
                    class="book-image"
                  />
                </td>

                <td>
                  {{ detail.book?.isbn || "—" }}
                </td>

                <td>
                  <strong>
                    {{
                      detail.book?.title ||
                      "Sách không còn tồn tại"
                    }}
                  </strong>
                </td>

                <td>
                  {{
                    detail.book?.author || "—"
                  }}
                </td>

                <td>
                  {{
                    detail.book?.publisher
                      ?.publisherName || "—"
                  }}
                </td>

                <td>
                  <strong>
                    {{ detail.quantity }}
                  </strong>
                </td>
              </tr>

              <tr v-if="details.length === 0">
                <td
                  colspan="7"
                  class="empty-cell"
                >
                  Phiếu mượn không có sách
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </template>
  </section>
</template>

<style scoped>
.borrow-detail-page {
  max-width: 1200px;
  margin: 0 auto;
}

.back-button {
  padding: 0;
  border: 0;
  background: transparent;
  color: #2563eb;
  cursor: pointer;
}

.page-header {
  margin: 20px 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
}

.page-header h1 {
  margin: 0 0 7px;
}

.page-header p {
  margin: 0;
  color: #6b7280;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-badge {
  display: inline-block;
  padding: 7px 12px;
  border-radius: 999px;
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

.return-button {
  padding: 10px 16px;
  border: 0;
  border-radius: 7px;
  background: #16a34a;
  color: white;
  cursor: pointer;
}

.return-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.information-grid {
  margin-bottom: 22px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.information-card,
.book-list-card {
  padding: 22px;
  border-radius: 11px;
  background: white;
  box-shadow: 0 4px 16px rgb(0 0 0 / 5%);
}

.information-card h2,
.book-list-card h2 {
  margin-top: 0;
}

dl {
  margin: 0;
}

dl > div {
  padding: 11px 0;
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 12px;
  border-bottom: 1px solid #e5e7eb;
}

dl > div:last-child {
  border-bottom: 0;
}

dt {
  color: #6b7280;
}

dd {
  margin: 0;
  font-weight: 600;
}

.section-heading p {
  margin-bottom: 0;
  color: #6b7280;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 850px;
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
}

.book-image {
  width: 48px;
  height: 65px;
  object-fit: cover;
  border-radius: 5px;
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

@media (max-width: 800px) {
  .page-header {
    flex-direction: column;
  }

  .information-grid {
    grid-template-columns: 1fr;
  }

  .header-actions {
    flex-wrap: wrap;
  }
}
</style>