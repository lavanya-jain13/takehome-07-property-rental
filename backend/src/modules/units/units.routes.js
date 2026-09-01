const express = require("express");

const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const controller = require("./units.controller");

const router = express.Router();

router.use(authenticate);

router.get(
  "/",
  authorize("MANAGER", "CONTRACTOR"),
  controller.list
);
router.post("/", authorize("MANAGER"), controller.create);
router.get("/:unitId", authorize("MANAGER"), controller.get);
router.patch("/:unitId", authorize("MANAGER"), controller.update);
router.post("/:unitId/archive", authorize("MANAGER"), controller.archive);
router.post("/:unitId/restore", authorize("MANAGER"), controller.restore);

module.exports = router;
