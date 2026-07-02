const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    phone: {
      type: String,
      default: "",
    },

    birthday: {
      type: Date,
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

    avatar: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: ["admin", "reader"],
      default: "reader",
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

module.exports = mongoose.model("User", userSchema);
