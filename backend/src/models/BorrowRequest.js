const mongoose = require("mongoose");

const borrowRequestItemSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
  },
  {
    _id: false,
  },
);

const borrowRequestSchema = new mongoose.Schema(
  {
    requestCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    reader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reader",
      required: true,
    },

    items: {
      type: [borrowRequestItemSchema],
      required: true,

      validate: {
        validator(items) {
          return Array.isArray(items) && items.length > 0;
        },

        message: "Yêu cầu phải có ít nhất một sách",
      },
    },

    requestDate: {
      type: Date,
      default: Date.now,
    },

    expectedBorrowDate: {
      type: Date,
      default: Date.now,
    },

    dueDate: {
      type: Date,
      required: true,
    },

    note: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },

    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    processedAt: {
      type: Date,
      default: null,
    },

    rejectReason: {
      type: String,
      trim: true,
      default: "",
    },

    borrow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Borrow",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

borrowRequestSchema.index({
  status: 1,
  requestDate: -1,
});

borrowRequestSchema.index({
  reader: 1,
});

module.exports = mongoose.model("BorrowRequest", borrowRequestSchema);
