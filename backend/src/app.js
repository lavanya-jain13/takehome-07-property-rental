const express = require("express");
const cookieParser = require("cookie-parser");

const authRoutes = require("./modules/auth/auth.routes");

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.use("/api/auth", authRoutes);

module.exports = app;