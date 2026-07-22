<script setup>
import {
  onMounted,
  reactive,
  ref,
} from "vue";

import { useRouter } from "vue-router";
import { bookApi } from "@/api/bookApi";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const books = ref([]);
const loading = ref(false);
const errorMessage = ref("");

const filters = reactive({
  page: 1,
  limit: 10,
  keyword: "",
  publisher: "",
  status: "",
});

const pagination = reactive({
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
});

async function loadBooks() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await bookApi.getAll({
      page: filters.page,
      limit: filters.limit,
      keyword: filters.keyword || undefined,
      publisher: filters.publisher || undefined,
      status: filters.status || undefined,
    });

    books.value = response.data.data.books;

    Object.assign(
      pagination,
      response.data.data.pagination,
    );
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ||
      "Không thể tải danh sách sách";
  } finally {
    loading.value = false;
  }
}

function searchBooks() {
  filters.page = 1;
  loadBooks();
}

function changePage(page) {
  if (page < 1 || page > pagination.totalPages) {
    return;
  }

  filters.page = page;
  loadBooks();
}

async function deleteBook(id) {
  const accepted = window.confirm(
    "Bạn có chắc muốn xóa sách này?",
  );

  if (!accepted) {
    return;
  }

  try {
    await bookApi.delete(id);
    await loadBooks();
  } catch (error) {
    alert(
      error.response?.data?.message ||
      "Không thể xóa sách",
    );
  }
}

function imageUrl(image) {
  if (!image) {
    return "/book-placeholder.png";
  }

  if (image.startsWith("http")) {
    return image;
  }

  return `${import.meta.env.VITE_SERVER_URL}${image}`;
}

onMounted(loadBooks);
</script>

<template>
  <section>
    <div class="page-header">
      <div>
        <h1>Quản lý sách</h1>
        <p>Danh sách các sách trong thư viện</p>
      </div>

      <button
        v-if="authStore.isAdmin"
        @click="router.push('/books/create')"
      >
        Thêm sách
      </button>
    </div>

    <form class="search-form" @submit.prevent="searchBooks">
      <input
        v-model="filters.keyword"
        type="search"
        placeholder="Tìm theo tên, tác giả hoặc ISBN"
      />

      <select v-model="filters.status">
        <option value="">Tất cả trạng thái</option>
        <option value="true">Đang hoạt động</option>
        <option value="false">Đã khóa</option>
      </select>

      <button type="submit">
        Tìm kiếm
      </button>
    </form>

    <p v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </p>

    <p v-if="loading">
      Đang tải dữ liệu...
    </p>

    <div v-else class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Ảnh</th>
            <th>ISBN</th>
            <th>Tên sách</th>
            <th>Tác giả</th>
            <th>Nhà xuất bản</th>
            <th>Tổng số</th>
            <th>Còn lại</th>
            <th>Thao tác</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="book in books" :key="book._id">
            <td>
              <img
                :src="imageUrl(book.image)"
                :alt="book.title"
                width="50"
                height="70"
              />
            </td>

            <td>{{ book.isbn }}</td>
            <td>{{ book.title }}</td>
            <td>{{ book.author }}</td>

            <td>
              {{ book.publisher?.publisherName || "Chưa có" }}
            </td>

            <td>{{ book.quantity }}</td>
            <td>{{ book.available }}</td>

            <td>
              <button
                @click="router.push(`/books/${book._id}`)"
              >
                Xem
              </button>

              <button
                v-if="authStore.isAdmin"
                @click="
                  router.push(`/books/${book._id}/edit`)
                "
              >
                Sửa
              </button>

              <button
                v-if="authStore.isAdmin"
                @click="deleteBook(book._id)"
              >
                Xóa
              </button>
            </td>
          </tr>

          <tr v-if="books.length === 0">
            <td colspan="8">
              Không tìm thấy sách
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <button
        :disabled="pagination.page <= 1"
        @click="changePage(pagination.page - 1)"
      >
        Trước
      </button>

      <span>
        Trang {{ pagination.page }} /
        {{ pagination.totalPages || 1 }}
      </span>

      <button
        :disabled="
          pagination.page >= pagination.totalPages
        "
        @click="changePage(pagination.page + 1)"
      >
        Sau
      </button>
    </div>
  </section>
</template>

<style scoped>
.page-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.search-form {
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
}

.search-form input {
  min-width: 280px;
}

.table-wrapper {
  overflow-x: auto;
  background: white;
  border-radius: 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

.error-message {
  color: #dc2626;
}
</style>