const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    bookCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

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

    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    publishYear: {
      type: Number,
      required: true,
      min: 1000,
      max: new Date().getFullYear(),
    },

    publisher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Publisher",
      required: true,
      index: true,
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
      trim: true,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("Book", bookSchema);
