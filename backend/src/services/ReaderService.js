const Reader = require("../models/Reader");

const getAllReaders = async (query) => {
  let {
    page = 1,
    limit = 10,
    keyword = "",
    gender = "",
    status,
    sort = "",
  } = query;

  page = Math.max(Number(page) || 1, 1);
  limit = Math.max(Number(limit) || 10, 1);

  const filter = {};

  if (keyword.trim()) {
    const searchKeyword = keyword.trim();

    filter.$or = [
      {
        readerCode: {
          $regex: searchKeyword,
          $options: "i",
        },
      },
      {
        firstName: {
          $regex: searchKeyword,
          $options: "i",
        },
      },
      {
        lastName: {
          $regex: searchKeyword,
          $options: "i",
        },
      },
      {
        phone: {
          $regex: searchKeyword,
          $options: "i",
        },
      },
      {
        address: {
          $regex: searchKeyword,
          $options: "i",
        },
      },
    ];
  }

  if (gender) {
    filter.gender = gender;
  }

  if (status !== undefined && status !== "") {
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
  const { readerCode, firstName, lastName, birthday, gender, address, phone } =
    data;

  if (!readerCode || !firstName || !lastName || !birthday || !phone) {
    throw new Error("Vui lòng nhập đầy đủ thông tin bắt buộc");
  }

  const existedReader = await Reader.findOne({
    $or: [
      {
        readerCode: readerCode.trim(),
      },
      {
        phone: phone.trim(),
      },
    ],
  });

  if (existedReader) {
    if (existedReader.readerCode === readerCode.trim()) {
      throw new Error("Mã độc giả đã tồn tại");
    }

    throw new Error("Số điện thoại đã tồn tại");
  }

  return await Reader.create({
    readerCode: readerCode.trim(),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    birthday,
    gender: gender || "Nam",
    address: address?.trim() || "",
    phone: phone.trim(),
    status: true,
  });
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

  if (data.readerCode && data.readerCode.trim() !== reader.readerCode) {
    const readerCodeExist = await Reader.findOne({
      readerCode: data.readerCode.trim(),
      _id: {
        $ne: id,
      },
    });

    if (readerCodeExist) {
      throw new Error("Mã độc giả đã tồn tại");
    }
  }

  if (data.phone && data.phone.trim() !== reader.phone) {
    const phoneExist = await Reader.findOne({
      phone: data.phone.trim(),
      _id: {
        $ne: id,
      },
    });

    if (phoneExist) {
      throw new Error("Số điện thoại đã tồn tại");
    }
  }

  if (data.readerCode) {
    data.readerCode = data.readerCode.trim();
  }

  if (data.firstName) {
    data.firstName = data.firstName.trim();
  }

  if (data.lastName) {
    data.lastName = data.lastName.trim();
  }

  if (data.phone) {
    data.phone = data.phone.trim();
  }

  if (data.address !== undefined) {
    data.address = data.address.trim();
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

  return reader;
};

module.exports = {
  getAllReaders,
  getReaderById,
  createReader,
  updateReader,
  deleteReader,
};
