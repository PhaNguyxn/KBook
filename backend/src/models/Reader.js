const mongoose = require("mongoose");

const readerSchema = new mongoose.Schema(
  {
    readerCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    birthday: {
      type: Date,
      required: true,
    },

    gender: {
      type: String,
      enum: ["Nam", "Nữ", "Khác"],
      default: "Nam",
    },

    address: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      required: true,
      unique: true,
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

module.exports = mongoose.model("Reader", readerSchema);
