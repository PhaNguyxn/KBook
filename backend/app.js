const express = require("express");
const cors = require("cors");
const userRoute = require("./src/routes/user.route");
const app = express();

app.use(cors());

app.use(express.json());
app.use("/api/users", userRoute);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Library Management API",
  });
});

const authRoute = require("./src/routes/auth.route");
app.use("/api/auth", authRoute);

const bookRoute = require("./src/routes/book.route");
app.use("/api/books", bookRoute);

const publisherRoute = require("./src/routes/publisher.route");
app.use("/api/publishers", publisherRoute);

const readerRoute = require("./src/routes/reader.route");
app.use("/api/readers", readerRoute);

module.exports = app;
