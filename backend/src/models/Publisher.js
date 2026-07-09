const mongoose = require("mongoose");

const publisherSchema = new mongoose.Schema(
  {
    publisherCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    publisherName: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Publisher", publisherSchema);
