const express = require("express");
const cookieParser = require("cookie-parser");

const authRoutes = require("./modules/auth/auth.routes");
const unitsRoutes = require("./modules/units/units.routes");
const maintenanceRoutes = require("./modules/maintenance/maintenance.routes");

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/units", unitsRoutes);
app.use("/api/maintenance-requests", maintenanceRoutes);

module.exports = app;