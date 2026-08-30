const express = require("express");

const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const controller = require("./units.controller");

const router = express.Router();

router.use(authenticate, authorize("MANAGER"));

router.get("/", controller.list);
router.post("/", controller.create);
router.get("/:unitId", controller.get);
router.patch("/:unitId", controller.update);
router.post("/:unitId/archive", controller.archive);
router.post("/:unitId/restore", controller.restore);

module.exports = router;