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

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      sparse: true,

      trim: true,
      lowercase: true,
      index: true,
    },
  },
  {
    timestamps: true,

    toJSON: {
      virtuals: true,
      transform(document, result) {
        delete result.password;
        delete result.__v;

        return result;
      },
    },

    toObject: {
      virtuals: true,
    },
  },
);

readerSchema.virtual("fullName").get(function getFullName() {
  return `${this.lastName || ""} ${this.firstName || ""}`.trim();
});

module.exports = mongoose.model("Reader", readerSchema);
