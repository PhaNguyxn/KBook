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
      trim: true,
    },

    publishYear: {
      type: Number,
      required: true,
    },

    isbn: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    publisher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Publisher",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    available: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
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
