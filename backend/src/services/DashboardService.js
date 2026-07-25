const Book = require("../models/Book");
const Reader = require("../models/Reader");
const Borrow = require("../models/Borrow");

/* =========================================
   HÀM HỖ TRỢ
========================================= */

function getFullName(person) {
  if (!person) {
    return "";
  }

  const fullName = String(person.fullName || "").trim();

  if (fullName) {
    return fullName;
  }

  const lastName = String(person.lastName || "").trim();

  const firstName = String(person.firstName || "").trim();

  return `${lastName} ${firstName}`.trim();
}

function getReaderPath() {
  if (Borrow.schema.path("reader")) {
    return "reader";
  }

  if (Borrow.schema.path("readerId")) {
    return "readerId";
  }

  return null;
}

function getEmployeePath() {
  if (Borrow.schema.path("employee")) {
    return "employee";
  }

  if (Borrow.schema.path("employeeId")) {
    return "employeeId";
  }

  return null;
}

/* =========================================
   TRUY VẤN GIAO DỊCH GẦN ĐÂY
========================================= */

function createRecentTransactionQuery() {
  const readerPath = getReaderPath();

  const employeePath = getEmployeePath();

  let query = Borrow.find({})
    .sort({
      updatedAt: -1,
      createdAt: -1,
      borrowDate: -1,
    })
    .limit(6);

  if (readerPath) {
    query = query.populate({
      path: readerPath,

      select: ["readerCode", "firstName", "lastName", "fullName", "phone"].join(
        " ",
      ),
    });
  }

  if (employeePath) {
    query = query.populate({
      path: employeePath,

      select: ["employeeCode", "firstName", "lastName", "fullName"].join(" "),
    });
  }

  return query;
}

/* =========================================
   CHUẨN HÓA GIAO DỊCH
========================================= */

function normalizeTransaction(transaction) {
  const reader = transaction.reader || transaction.readerId || null;

  const employee = transaction.employee || transaction.employeeId || null;

  const normalizedReader = reader
    ? {
        ...reader,

        fullName:
          getFullName(reader) || transaction.readerName || "Không xác định",

        readerCode: reader.readerCode || transaction.readerCode || "Chưa có mã",
      }
    : {
        fullName:
          transaction.readerName ||
          transaction.readerFullName ||
          "Không xác định",

        readerCode: transaction.readerCode || "Chưa có mã",

        deleted: true,
      };

  const normalizedEmployee = employee
    ? {
        ...employee,

        fullName:
          getFullName(employee) || transaction.employeeName || "Chưa xác định",
      }
    : {
        fullName:
          transaction.employeeName ||
          transaction.employeeFullName ||
          "Chưa xác định",

        deleted: true,
      };

  return {
    ...transaction,

    reader: normalizedReader,

    employee: normalizedEmployee,
  };
}

/* =========================================
   DỮ LIỆU DASHBOARD
========================================= */

async function getDashboardData() {
  const [
    totalBooks,
    totalReaders,
    totalBorrowing,
    totalReturned,
    rawTransactions,
  ] = await Promise.all([
    Book.countDocuments({}),

    Reader.countDocuments({
      status: {
        $ne: false,
      },
    }),

    Borrow.countDocuments({
      status: {
        $in: ["borrowing", "borrowed", "approved"],
      },
    }),

    Borrow.countDocuments({
      status: {
        $in: ["returned", "completed"],
      },
    }),

    createRecentTransactionQuery().lean(),
  ]);

  const recentTransactions = rawTransactions.map(normalizeTransaction);

  return {
    totalBooks,
    totalReaders,
    totalBorrowing,
    totalReturned,
    recentTransactions,
  };
}

module.exports = {
  getDashboardData,
};
