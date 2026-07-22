const Reader = require("../models/Reader");

const getAllReaders = async (query) => {
  let { page = 1, limit = 10, keyword, gender, status, sort } = query;

  page = Number(page);
  limit = Number(limit);

  const filter = {};

  if (keyword) {
    filter.$or = [
      {
        readerCode: {
          $regex: keyword,
          $options: "i",
        },
      },
      {
        firstName: {
          $regex: keyword,
          $options: "i",
        },
      },
      {
        lastName: {
          $regex: keyword,
          $options: "i",
        },
      },
      {
        phone: {
          $regex: keyword,
          $options: "i",
        },
      },
      {
        address: {
          $regex: keyword,
          $options: "i",
        },
      },
    ];
  }

  if (gender) {
    filter.gender = gender;
  }

  if (status !== undefined) {
    filter.status = status === "true";
  }

  let sortOption = {
    createdAt: -1,
  };

  if (sort === "name") {
    sortOption = {
      lastName: 1,
      firstName: 1,
    };
  }

  if (sort === "readerCode") {
    sortOption = {
      readerCode: 1,
    };
  }

  const total = await Reader.countDocuments(filter);

  const readers = await Reader.find(filter)
    .sort(sortOption)
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    readers,

    pagination: {
      total,

      page,

      limit,

      totalPages: Math.ceil(total / limit),
    },
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