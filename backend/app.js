const express = require("express");
const cors = require("cors");
const authRoute = require("./src/routes/auth.route");
const bookRoute = require("./src/routes/book.route");
const publisherRoute = require("./src/routes/publisher.route");
const readerRoute = require("./src/routes/reader.route");
const borrowRoute = require("./src/routes/borrow.route");
const dashboardRoute = require("./src/routes/dashboard.route");
const employeeRoute = require("./src/routes/employee.route");
const borrowRequestRouter = require("./src/routes/borrowRequest.route");
const readerAuthRouter = require("./src/routes/readerAuth.route");
const path = require("path");

const app = express();

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    const isLocalFrontend =
      /^http:\/\/localhost:\d+$/.test(origin) ||
      /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);

    if (isLocalFrontend) {
      return callback(null, true);
    }

    return callback(new Error(`Nguồn truy cập không được phép: ${origin}`));
  },

  credentials: true,

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use(express.json());
app.use("/api/auth", authRoute);
app.use("/api/books", bookRoute);
app.use("/api/publishers", publisherRoute);
app.use("/api/readers", readerRoute);
app.use("/api/borrows", borrowRoute);
app.use("/api/dashboard", dashboardRoute);
app.use("/api/employees", employeeRoute);
app.use("/api/borrow-requests", borrowRequestRouter);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/reader-auth", readerAuthRouter);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Library Management API",
  });
});

module.exports = app;
