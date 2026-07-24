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

import { readerApi } from "@/api/readerApi";
import { formatDate } from "@/utils/date";
import { getErrorMessage } from "@/utils/error";

const route = useRoute();
const router = useRouter();

/* =========================================
   STATE
========================================= */

const reader = ref(null);

const loading = ref(false);
const deleting = ref(false);

const errorMessage = ref("");

/* =========================================
   COMPUTED
========================================= */

const readerId = computed(() => {
  return route.params.id;
});

const fullName = computed(() => {
  if (!reader.value) {
    return "Chưa cập nhật";
  }

  const lastName = String(
    reader.value.lastName || "",
  ).trim();

  const firstName = String(
    reader.value.firstName || "",
  ).trim();

  return (
    `${lastName} ${firstName}`.trim() ||
    "Chưa cập nhật"
  );
});

const readerInitials = computed(() => {
  if (!reader.value) {
    return "ĐG";
  }

  const lastName = String(
    reader.value.lastName || "",
  ).trim();

  const firstName = String(
    reader.value.firstName || "",
  ).trim();

  const initials = `${
    lastName.charAt(0)
  }${firstName.charAt(0)}`.toUpperCase();

  return initials || "ĐG";
});

const readerAge = computed(() => {
  if (!reader.value?.birthday) {
    return null;
  }

  const birthday = new Date(
    reader.value.birthday,
  );

  if (
    Number.isNaN(
      birthday.getTime(),
    )
  ) {
    return null;
  }

  const today = new Date();

  let age =
    today.getFullYear() -
    birthday.getFullYear();

  const monthDifference =
    today.getMonth() -
    birthday.getMonth();

  if (
    monthDifference < 0 ||
    (
      monthDifference === 0 &&
      today.getDate() <
        birthday.getDate()
    )
  ) {
    age -= 1;
  }

  return age >= 0
    ? age
    : null;
});

const genderClass = computed(() => {
  const gender = String(
    reader.value?.gender || "",
  ).toLowerCase();

  if (gender === "nam") {
    return "gender-male";
  }

  if (gender === "nữ") {
    return "gender-female";
  }

  return "gender-other";
});

/* =========================================
   ĐIỀU HƯỚNG
========================================= */

function goBack() {
  router.push({
    name: "readers",
  });
}

function goToEdit() {
  router.push({
    name: "reader-edit",

    params: {
      id: readerId.value,
    },
  });
}

/* =========================================
   TẢI THÔNG TIN ĐỘC GIẢ
========================================= */

async function loadReader() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response =
      await readerApi.getById(
        readerId.value,
      );

    const payload =
      response?.data?.data ??
      response?.data;

    if (!payload) {
      throw new Error(
        "Không tìm thấy thông tin độc giả",
      );
    }

    reader.value = payload;
  } catch (error) {
    console.error(
      "Load reader detail error:",
      error,
    );

    reader.value = null;

    errorMessage.value =
      getErrorMessage(
        error,
        "Không thể tải thông tin độc giả",
      );
  } finally {
    loading.value = false;
  }
}

/* =========================================
   XÓA ĐỘC GIẢ
========================================= */

async function deleteReader() {
  if (!reader.value) {
    return;
  }

  const accepted =
    window.confirm(
      `Bạn có chắc muốn xóa độc giả "${fullName.value}"?\n\nDữ liệu đã xóa sẽ không thể khôi phục.`,
    );

  if (!accepted) {
    return;
  }

  deleting.value = true;
  errorMessage.value = "";

  try {
    await readerApi.delete(
      readerId.value,
    );

    await router.push({
      name: "readers",
    });
  } catch (error) {
    console.error(
      "Delete reader error:",
      error,
    );

    errorMessage.value =
      getErrorMessage(
        error,
        "Không thể xóa độc giả",
      );
  } finally {
    deleting.value = false;
  }
}

/* =========================================
   KHỞI TẠO
========================================= */

onMounted(() => {
  loadReader();
});
</script>

<template>
  <section class="reader-detail-page">
    <!-- Thanh điều hướng -->
    <div class="navigation-bar">
      <button
        type="button"
        class="back-button"
        @click="goBack"
      >
        <i class="bi bi-arrow-left" />

        Quay lại danh sách
      </button>

      <div
        v-if="reader && !loading"
        class="header-actions"
      >
        <button
          type="button"
          class="edit-button"
          :disabled="deleting"
          @click="goToEdit"
        >
          <i
            class="bi bi-pencil-square"
          />

          Cập nhật
        </button>

        <button
          type="button"
          class="delete-button"
          :disabled="deleting"
          @click="deleteReader"
        >
          <span
            v-if="deleting"
            class="spinner-border spinner-border-sm"
          />

          <i
            v-else
            class="bi bi-trash3"
          />

          {{
            deleting
              ? "Đang xóa..."
              : "Xóa độc giả"
          }}
        </button>
      </div>
    </div>

    <!-- Thông báo lỗi -->
    <div
      v-if="errorMessage"
      class="alert alert-danger"
      role="alert"
    >
      <i
        class="bi bi-exclamation-circle-fill"
      />

      <span>
        {{ errorMessage }}
      </span>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="loading-card"
    >
      <div
        class="spinner-border text-primary"
        role="status"
      />

      <strong>
        Đang tải thông tin độc giả
      </strong>

      <span>
        Vui lòng chờ trong giây lát...
      </span>
    </div>

    <!-- Không tìm thấy dữ liệu -->
    <div
      v-else-if="!reader"
      class="empty-card"
    >
      <div class="empty-icon">
        <i
          class="bi bi-person-x"
        />
      </div>

      <h2>
        Không tìm thấy độc giả
      </h2>

      <p>
        Độc giả có thể đã bị xóa hoặc
        đường dẫn không chính xác.
      </p>

      <button
        type="button"
        class="return-button"
        @click="goBack"
      >
        <i class="bi bi-arrow-left" />

        Về danh sách độc giả
      </button>
    </div>

    <!-- Nội dung chi tiết -->
    <div
      v-else
      class="detail-layout"
    >
      <!-- Thông tin tổng quan -->
      <aside class="profile-card">
        <div class="profile-background">
          <div class="profile-avatar">
            {{ readerInitials }}
          </div>
        </div>

        <div class="profile-content">
          <span class="reader-code">
            {{
              reader.readerCode ||
              "CHƯA CÓ MÃ"
            }}
          </span>

          <h1>
            {{ fullName }}
          </h1>

          <span
            class="gender-badge"
            :class="genderClass"
          >
            <i
              class="bi bi-person"
            />

            {{
              reader.gender ||
              "Chưa cập nhật"
            }}
          </span>

          <div class="profile-contact">
            <div>
              <span class="contact-icon">
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
                    reader.phone ||
                    "Chưa cập nhật"
                  }}
                </strong>
              </div>
            </div>

            <div>
              <span class="contact-icon">
                <i
                  class="bi bi-calendar3"
                />
              </span>

              <div>
                <small>
                  Ngày sinh
                </small>

                <strong>
                  {{
                    reader.birthday
                      ? formatDate(
                          reader.birthday,
                        )
                      : "Chưa cập nhật"
                  }}
                </strong>
              </div>
            </div>

            <div>
              <span class="contact-icon">
                <i
                  class="bi bi-hourglass-split"
                />
              </span>

              <div>
                <small>
                  Độ tuổi
                </small>

                <strong>
                  {{
                    readerAge !== null
                      ? `${readerAge} tuổi`
                      : "Chưa xác định"
                  }}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Thông tin chi tiết -->
      <main class="information-column">
        <!-- Thông tin cá nhân -->
        <section class="information-card">
          <div class="card-heading">
            <div class="heading-icon">
              <i
                class="bi bi-person-vcard"
              />
            </div>

            <div>
              <h2>
                Thông tin độc giả
              </h2>

              <p>
                Thông tin cá nhân được lưu
                trong hệ thống thư viện.
              </p>
            </div>
          </div>

          <div class="information-grid">
            <div class="information-item">
              <span>
                Mã độc giả
              </span>

              <strong class="code-value">
                {{
                  reader.readerCode ||
                  "—"
                }}
              </strong>
            </div>

            <div class="information-item">
              <span>
                Họ và tên đệm
              </span>

              <strong>
                {{
                  reader.lastName ||
                  "—"
                }}
              </strong>
            </div>

            <div class="information-item">
              <span>
                Tên
              </span>

              <strong>
                {{
                  reader.firstName ||
                  "—"
                }}
              </strong>
            </div>

            <div class="information-item">
              <span>
                Giới tính
              </span>

              <strong>
                {{
                  reader.gender ||
                  "—"
                }}
              </strong>
            </div>

            <div class="information-item">
              <span>
                Ngày sinh
              </span>

              <strong>
                {{
                  reader.birthday
                    ? formatDate(
                        reader.birthday,
                      )
                    : "—"
                }}
              </strong>
            </div>

            <div class="information-item">
              <span>
                Số điện thoại
              </span>

              <strong>
                {{
                  reader.phone ||
                  "—"
                }}
              </strong>
            </div>
          </div>
        </section>

        <!-- Địa chỉ -->
        <section class="information-card">
          <div class="card-heading">
            <div
              class="heading-icon location-icon"
            >
              <i
                class="bi bi-geo-alt"
              />
            </div>

            <div>
              <h2>
                Địa chỉ liên hệ
              </h2>

              <p>
                Địa chỉ hiện tại của độc giả.
              </p>
            </div>
          </div>

          <div class="address-box">
            <i class="bi bi-geo-alt-fill" />

            <span>
              {{
                reader.address ||
                "Chưa cập nhật địa chỉ"
              }}
            </span>
          </div>
        </section>

        <!-- Thông tin hệ thống -->
        <section class="information-card">
          <div class="card-heading">
            <div
              class="heading-icon system-icon"
            >
              <i class="bi bi-clock-history" />
            </div>

            <div>
              <h2>
                Thông tin hệ thống
              </h2>

              <p>
                Thời gian tạo và cập nhật dữ liệu.
              </p>
            </div>
          </div>

          <div class="system-information">
            <div>
              <span class="system-icon-box">
                <i
                  class="bi bi-calendar-plus"
                />
              </span>

              <div>
                <small>
                  Ngày tạo
                </small>

                <strong>
                  {{
                    reader.createdAt
                      ? formatDate(
                          reader.createdAt,
                        )
                      : "Không có dữ liệu"
                  }}
                </strong>
              </div>
            </div>

            <div>
              <span class="system-icon-box">
                <i
                  class="bi bi-calendar-check"
                />
              </span>

              <div>
                <small>
                  Cập nhật gần nhất
                </small>

                <strong>
                  {{
                    reader.updatedAt
                      ? formatDate(
                          reader.updatedAt,
                        )
                      : "Không có dữ liệu"
                  }}
                </strong>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  </section>
</template>

<style scoped>
.reader-detail-page {
  width: 100%;
  max-width: 1450px;
  min-width: 0;
  margin: 0 auto;
}

/* =========================================
   THANH ĐIỀU HƯỚNG
========================================= */

.navigation-bar {
  margin-bottom: 22px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.back-button {
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 0;
  background: transparent;
  color: #2563eb;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.back-button:hover {
  color: #1d4ed8;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.edit-button,
.delete-button,
.return-button {
  min-height: 42px;
  padding: 0 16px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.edit-button {
  border: 1px solid #fbbf24;
  background: #fffbeb;
  color: #d97706;
}

.edit-button:hover:not(:disabled) {
  background: #fef3c7;
  transform: translateY(-1px);
}

.delete-button {
  border: 0;
  background: #dc2626;
  color: #fff;
  box-shadow:
    0 7px 16px
    rgb(220 38 38 / 18%);
}

.delete-button:hover:not(:disabled) {
  background: #b91c1c;
  transform: translateY(-1px);
  box-shadow:
    0 9px 20px
    rgb(220 38 38 / 24%);
}

.edit-button:disabled,
.delete-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
}

/* =========================================
   THÔNG BÁO
========================================= */

.alert {
  margin-bottom: 22px;
  display: flex;
  align-items: center;
  gap: 9px;
  border-radius: 12px;
  font-size: 13px;
}

/* =========================================
   LOADING VÀ EMPTY
========================================= */

.loading-card,
.empty-card {
  min-height: 390px;
  padding: 45px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  border: 1px solid #e5edf7;
  border-radius: 20px;
  background: #fff;
  text-align: center;
  box-shadow:
    0 10px 28px
    rgb(15 23 42 / 6%);
}

.loading-card strong {
  margin-top: 16px;
  color: #334155;
  font-size: 16px;
}

.loading-card span {
  margin-top: 6px;
  color: #94a3b8;
  font-size: 12px;
}

.empty-icon {
  width: 82px;
  height: 82px;
  display: grid;
  place-items: center;
  border-radius: 24px;
  background: #eff6ff;
  color: #3b82f6;
  font-size: 34px;
}

.empty-card h2 {
  margin: 18px 0 7px;
  color: #1e3a8a;
  font-size: 22px;
}

.empty-card p {
  margin: 0;
  color: #94a3b8;
  font-size: 13px;
}

.return-button {
  margin-top: 20px;
  border: 0;
  background: #2563eb;
  color: #fff;
}

/* =========================================
   BỐ CỤC
========================================= */

.detail-layout {
  display: grid;
  grid-template-columns:
    330px
    minmax(0, 1fr);
  align-items: start;
  gap: 22px;
}

.profile-card,
.information-card {
  min-width: 0;
  overflow: hidden;
  border: 1px solid #e5edf7;
  border-radius: 20px;
  background: #fff;
  box-shadow:
    0 10px 28px
    rgb(15 23 42 / 6%);
}

/* =========================================
   THẺ HỒ SƠ
========================================= */

.profile-card {
  position: sticky;
  top: 20px;
}

.profile-background {
  height: 118px;
  position: relative;
  background: linear-gradient(
    135deg,
    #60a5fa,
    #2563eb
  );
}

.profile-background::before,
.profile-background::after {
  position: absolute;
  border-radius: 50%;
  background: rgb(255 255 255 / 12%);
  content: "";
}

.profile-background::before {
  width: 115px;
  height: 115px;
  top: -45px;
  right: -30px;
}

.profile-background::after {
  width: 75px;
  height: 75px;
  bottom: -35px;
  left: -15px;
}

.profile-avatar {
  width: 102px;
  height: 102px;
  position: absolute;
  left: 50%;
  bottom: -51px;
  z-index: 2;
  display: grid;
  place-items: center;
  border: 6px solid #fff;
  border-radius: 29px;
  background: linear-gradient(
    145deg,
    #dbeafe,
    #eff6ff
  );
  color: #2563eb;
  font-size: 29px;
  font-weight: 900;
  box-shadow:
    0 12px 26px
    rgb(15 23 42 / 16%);
  transform: translateX(-50%);
}

.profile-content {
  padding: 68px 24px 26px;
  text-align: center;
}

.reader-code {
  color: #3b82f6;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.8px;
  text-transform: uppercase;
}

.profile-content h1 {
  margin: 7px 0 12px;
  overflow-wrap: anywhere;
  color: #1e3a8a;
  font-size: 21px;
  font-weight: 800;
}

.gender-badge {
  padding: 6px 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
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

.profile-contact {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
}

.profile-contact > div {
  padding: 11px;
  display: flex;
  align-items: center;
  gap: 11px;
  border-radius: 11px;
  background: #f8fafc;
}

.contact-icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 9px;
  background: #e0edff;
  color: #2563eb;
}

.profile-contact small,
.profile-contact strong {
  display: block;
}

.profile-contact small {
  margin-bottom: 3px;
  color: #94a3b8;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
}

.profile-contact strong {
  color: #334155;
  font-size: 11px;
}

/* =========================================
   CỘT THÔNG TIN
========================================= */

.information-column {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.information-card {
  padding: 25px;
}

.card-heading {
  margin-bottom: 23px;
  display: flex;
  align-items: center;
  gap: 13px;
}

.heading-icon {
  width: 45px;
  height: 45px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 13px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 20px;
}

.location-icon {
  background: #ecfdf5;
  color: #059669;
}

.system-icon {
  background: #fff7ed;
  color: #ea580c;
}

.card-heading h2 {
  margin: 0;
  color: #1e3a8a;
  font-size: 19px;
  font-weight: 800;
}

.card-heading p {
  margin: 5px 0 0;
  color: #94a3b8;
  font-size: 11px;
}

/* =========================================
   THÔNG TIN CÁ NHÂN
========================================= */

.information-grid {
  display: grid;
  grid-template-columns:
    repeat(
      2,
      minmax(0, 1fr)
    );
  border: 1px solid #e7edf5;
  border-radius: 14px;
  overflow: hidden;
}

.information-item {
  min-width: 0;
  padding: 17px 18px;
  border-bottom: 1px solid #e7edf5;
}

.information-item:nth-child(odd) {
  border-right: 1px solid #e7edf5;
}

.information-item:nth-last-child(-n + 2) {
  border-bottom: 0;
}

.information-item span,
.information-item strong {
  display: block;
}

.information-item span {
  margin-bottom: 6px;
  color: #94a3b8;
  font-size: 10px;
  font-weight: 700;
}

.information-item strong {
  overflow-wrap: anywhere;
  color: #334155;
  font-size: 13px;
}

.code-value {
  color: #2563eb !important;
}

/* =========================================
   ĐỊA CHỈ
========================================= */

.address-box {
  min-height: 74px;
  padding: 18px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border: 1px solid #d1fae5;
  border-radius: 13px;
  background: #f0fdf4;
}

.address-box i {
  margin-top: 2px;
  flex-shrink: 0;
  color: #059669;
  font-size: 18px;
}

.address-box span {
  overflow-wrap: anywhere;
  color: #475569;
  font-size: 13px;
  line-height: 1.7;
}

/* =========================================
   THÔNG TIN HỆ THỐNG
========================================= */

.system-information {
  display: grid;
  grid-template-columns:
    repeat(
      2,
      minmax(0, 1fr)
    );
  gap: 14px;
}

.system-information > div {
  min-width: 0;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #ffedd5;
  border-radius: 12px;
  background: #fffaf5;
}

.system-icon-box {
  width: 39px;
  height: 39px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 10px;
  background: #ffedd5;
  color: #ea580c;
}

.system-information small,
.system-information strong {
  display: block;
}

.system-information small {
  margin-bottom: 4px;
  color: #94a3b8;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
}

.system-information strong {
  color: #475569;
  font-size: 11px;
}

/* =========================================
   RESPONSIVE
========================================= */

@media (max-width: 1000px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }

  .profile-card {
    position: static;
  }

  .profile-contact {
    display: grid;
    grid-template-columns:
      repeat(
        3,
        minmax(0, 1fr)
      );
  }
}

@media (max-width: 700px) {
  .navigation-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
  }

  .edit-button,
  .delete-button {
    flex: 1;
  }

  .profile-contact {
    grid-template-columns: 1fr;
  }

  .information-grid,
  .system-information {
    grid-template-columns: 1fr;
  }

  .information-item,
  .information-item:nth-child(odd),
  .information-item:nth-last-child(-n + 2) {
    border-right: 0;
    border-bottom: 1px solid #e7edf5;
  }

  .information-item:last-child {
    border-bottom: 0;
  }
}

@media (max-width: 480px) {
  .information-card {
    padding: 19px;
    border-radius: 17px;
  }

  .header-actions {
    flex-direction: column;
  }

  .edit-button,
  .delete-button {
    width: 100%;
  }
}
</style>