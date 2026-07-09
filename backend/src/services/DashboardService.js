const Book = require("../models/Book");
const Reader = require("../models/Reader");
const Employee = require("../models/Employee");
const Borrow = require("../models/Borrow");

const getDashboard = async () => {
  const totalBooks = await Book.countDocuments();

  const totalReaders = await Reader.countDocuments();

  const totalEmployees = await Employee.countDocuments();

  const totalBorrowing = await Borrow.countDocuments({
    status: "borrowing",
  });

  const totalReturned = await Borrow.countDocuments({
    status: "returned",
  });

  const totalOverdue = await Borrow.countDocuments({
    status: "late",
  });

  const booksUnavailable = await Book.countDocuments({
    available: 0,
  });

  const recentBorrows = await Borrow.find()
    .populate("book")
    .populate("reader")
    .populate("employee")
    .sort({
      createdAt: -1,
    })
    .limit(5);

  const topBooks = await Borrow.aggregate([
    {
      $group: {
        _id: "$book",
        totalBorrow: {
          $sum: 1,
        },
      },
    },
    {
      $sort: {
        totalBorrow: -1,
      },
    },
    {
      $limit: 5,
    },
    {
      $lookup: {
        from: "books",
        localField: "_id",
        foreignField: "_id",
        as: "book",
      },
    },
    {
      $unwind: "$book",
    },
  ]);

  return {
    totalBooks,

    totalReaders,

    totalEmployees,

    totalBorrowing,

    totalReturned,

    totalOverdue,

    booksUnavailable,

    recentBorrows,

    topBooks,
  };
};

module.exports = {
  getDashboard,
};
