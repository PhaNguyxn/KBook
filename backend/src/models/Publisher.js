const mongoose = require("mongoose");

const publisherSchema = new mongoose.Schema(
  {
    publisherCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    publisherName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
      default: undefined,
    },

    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      default: undefined,
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

module.exports = mongoose.model("Publisher", publisherSchema);
