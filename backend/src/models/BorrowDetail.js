const mongoose = require("mongoose");

const borrowDetailSchema = new mongoose.Schema(
  {
    borrow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Borrow",
      required: true,
      index: true,
    },

    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

borrowDetailSchema.index(
  {
    borrow: 1,
    book: 1,
  },
  {
    unique: true,
  },
);

module.exports = mongoose.model("BorrowDetail", borrowDetailSchema);
