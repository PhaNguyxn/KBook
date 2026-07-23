const mongoose = require("mongoose");

const publisherSchema = new mongoose.Schema(
  {
    publisherCode: {
      type: String,
      required: [true, "Mã nhà xuất bản không được để trống"],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 30,
    },

    publisherName: {
      type: String,
      required: [true, "Tên nhà xuất bản không được để trống"],
      trim: true,
      maxlength: 200,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
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

publisherSchema.index({
  publisherName: 1,
});

publisherSchema.index({
  status: 1,
});

module.exports = mongoose.model("Publisher", publisherSchema);
