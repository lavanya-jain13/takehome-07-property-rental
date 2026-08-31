const express = require("express");

const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const controller = require("./dashboard.controller");

const router = express.Router();

router.use(
  authenticate,
  authorize("MANAGER")
);

router.get("/", controller.getDashboard);

module.exports = router;