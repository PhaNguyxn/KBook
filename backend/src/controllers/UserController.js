const User = require("../models/Employee");

const getAllUsers = async (req, res) => {
  const users = await User.find();

  res.json(users);
};

module.exports = {
  getAllUsers,
};
