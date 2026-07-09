const Reader = require("../models/Reader");

const getAllReaders = async (query) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;

  const skip = (page - 1) * limit;

  const filter = {
    status: true,
  };

  if (query.keyword) {
    filter.$or = [
      {
        firstName: {
          $regex: query.keyword,
          $options: "i",
        },
      },

      {
        lastName: {
          $regex: query.keyword,
          $options: "i",
        },
      },

      {
        phone: {
          $regex: query.keyword,
          $options: "i",
        },
      },
    ];
  }

  const readers = await Reader.find(filter).skip(skip).limit(limit).sort({
    createdAt: -1,
  });

  const total = await Reader.countDocuments(filter);

  return {
    readers,

    total,

    page,

    limit,
  };
};

const createReader = async (data) => {
  const phoneExist = await Reader.findOne({
    phone: data.phone,
  });

  if (phoneExist) {
    throw new Error("Số điện thoại đã tồn tại");
  }

  return await Reader.create(data);
};

const getReaderById = async (id) => {
  const reader = await Reader.findById(id);

  if (!reader) {
    throw new Error("Không tìm thấy độc giả");
  }

  return reader;
};

const updateReader = async (id, data) => {
  const reader = await Reader.findById(id);

  if (!reader) {
    throw new Error("Không tìm thấy độc giả");
  }

  Object.assign(reader, data);

  await reader.save();

  return reader;
};

const deleteReader = async (id) => {
  const reader = await Reader.findById(id);

  if (!reader) {
    throw new Error("Không tìm thấy độc giả");
  }

  reader.status = false;

  await reader.save();
};

module.exports = {
  getAllReaders,

  getReaderById,

  createReader,

  updateReader,

  deleteReader,
};