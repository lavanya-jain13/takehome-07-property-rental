const express = require("express");

const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const controller = require("./maintenance.controller");

const router = express.Router();

router.use(
  authenticate,
  authorize("MANAGER", "CONTRACTOR")
);

router.get("/", controller.list);
router.post("/", controller.create);
router.get("/:requestId", controller.get);
router.patch("/:requestId", controller.update);
router.patch("/:requestId/status", controller.changeStatus);

router.post(
  "/:requestId/contractors",
  authorize("MANAGER"),
  controller.assignContractor
);

router.delete(
  "/:requestId/contractors/:contractorId",
  authorize("MANAGER"),
  controller.removeContractor
);

router.post(
  "/:requestId/timeline",
  controller.addTimelineNote
);

module.exports = router;
