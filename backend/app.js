const express = require("express");
const cors = require("cors");
const userRoute = require("./src/routes/user.route");
const authRoute = require("./src/routes/auth.route");
const bookRoute = require("./src/routes/book.route");
const publisherRoute = require("./src/routes/publisher.route");
const readerRoute = require("./src/routes/reader.route");
const borrowRoute = require("./src/routes/borrow.route");
const dashboardRoute = require("./src/routes/dashboard.route");
const app = express();

app.use(cors());

app.use(express.json());
app.use("/api/users", userRoute);
app.use("/api/auth", authRoute);
app.use("/api/books", bookRoute);
app.use("/api/publishers", publisherRoute);
app.use("/api/readers", readerRoute);
app.use("/api/borrows", borrowRoute);
app.use("/api/dashboard", dashboardRoute);


app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Library Management API",
  });
});

module.exports = app;
