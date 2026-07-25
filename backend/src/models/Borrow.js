const mongoose = require("mongoose");

const borrowSchema = new mongoose.Schema(
  {
    borrowCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    reader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reader",
      required: true,
    },

    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    borrowDate: {
      type: Date,
      required: true,
    },

    dueDate: {
      type: Date,
      required: true,
    },

    returnDate: {
      type: Date,
      default: null,
    },

    totalAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    note: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["borrowing", "returned"],
      default: "borrowing",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Borrow", borrowSchema);
