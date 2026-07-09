const Publisher = require("../models/Publisher");
const Book = require("../models/Book");

const getAllPublishers = async () => {
  return await Publisher.find().sort({
    publisherName: 1,
  });
};

const createPublisher = async (data) => {
  const existed = await Publisher.findOne({
    publisherCode: data.publisherCode,
  });

  if (existed) {
    throw new Error("Mã NXB đã tồn tại");
  }

  return await Publisher.create(data);
};

const getPublisherById = async (id) => {
  const publisher = await Publisher.findById(id);

  if (!publisher) {
    throw new Error("Không tìm thấy");
  }

  return publisher;
};

const updatePublisher = async (id, data) => {
  const publisher = await Publisher.findById(id);

  if (!publisher) {
    throw new Error("Không tìm thấy");
  }

  Object.assign(publisher, data);

  await publisher.save();

  return publisher;
};


const deletePublisher = async (id) => {
  const used = await Book.findOne({
    publisher: id,
  });

  if (used) {
    throw new Error("NXB đang được sử dụng");
  }

  await Publisher.findByIdAndDelete(id);
};

module.exports = {
  getAllPublishers,

  createPublisher,

  getPublisherById,

  updatePublisher,

  deletePublisher,
};