const express = require("express");

const controller = require("./users.controller");
const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");

const router = express.Router();

router.use(authenticate, authorize("MANAGER"));

router.get("/contractors", controller.listContractors);

module.exports = router;