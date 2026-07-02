const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    author: {
      type: String,
      required: true,
    },

    publisher: {
      type: String,
      default: "",
    },

    publishYear: {
      type: Number,
    },

    isbn: {
      type: String,
      unique: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    quantity: {
      type: Number,
      default: 0,
    },

    available: {
      type: Number,
      default: 0,
    },

    image: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Book", bookSchema);
