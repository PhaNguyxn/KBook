const Book = require("../models/Book");
const Reader = require("../models/Reader");
const Employee = require("../models/Employee");
const Publisher = require("../models/Publisher");
const Borrow = require("../models/Borrow");

const getDashboard = async () => {
  const totalBooks = await Book.countDocuments();

  const totalReaders = await Reader.countDocuments();

  const totalEmployees = await Employee.countDocuments();

  const totalPublishers = await Publisher.countDocuments();

  const totalBorrowSlips = await Borrow.countDocuments();

  const borrowing = await Borrow.countDocuments({
    status: "borrowing",
  });

  const returned = await Borrow.countDocuments({
    status: "returned",
  });

  const overdue = await Borrow.countDocuments({
    status: "borrowing",
    dueDate: {
      $lt: new Date(),
    },
  });

  const books = await Book.find();

  let availableBooks = 0;

  let borrowedBooks = 0;

  books.forEach((book) => {
    availableBooks += book.available;
    borrowedBooks += book.quantity - book.available;
  });

  return {
    totalBooks,
    totalReaders,
    totalEmployees,
    totalPublishers,
    totalBorrowSlips,
    borrowing,
    returned,
    overdue,
    availableBooks,
    borrowedBooks,
  };
};

module.exports = {
  getDashboard,
};
