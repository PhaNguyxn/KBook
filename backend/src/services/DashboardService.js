const Book = require("../models/Book");
const Reader = require("../models/Reader");
const Borrow = require("../models/Borrow");

function createRecentTransactionQuery() {
  let query = Borrow.find({})
    .sort({
      updatedAt: -1,
      createdAt: -1,
      borrowDate: -1,
    })
    .limit(6);

  
  if (Borrow.schema.path("reader")) {
    query = query.populate("reader", "readerCode fullName phone email");
  } else if (Borrow.schema.path("readerId")) {
    query = query.populate("readerId", "readerCode fullName phone email");
  }

  if (Borrow.schema.path("employee")) {
    query = query.populate("employee", "employeeCode fullName username");
  } else if (Borrow.schema.path("employeeId")) {
    query = query.populate("employeeId", "employeeCode fullName username");
  }

  return query;
}


async function getDashboardData() {
  const [
    totalBooks,
    totalReaders,
    totalBorrowing,
    totalReturned,
    recentTransactions,
  ] = await Promise.all([
   
    Book.countDocuments({}),

    Reader.countDocuments({}),

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
