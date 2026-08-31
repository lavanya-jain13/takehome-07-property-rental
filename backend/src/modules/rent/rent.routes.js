const express = require("express");

const authenticate = require("../../middleware/authenticate");
const authorize = require("../../middleware/authorize");
const controller = require("./rent.controller");
const alertController = require("./rent-alert.controller");

const router = express.Router();

router.use(
  authenticate,
  authorize("MANAGER")
);

router.post("/payments", controller.createPayment);

router.get("/payments", controller.listPayments);

router.post(
  "/payments/bulk",
  controller.bulkCreatePayments
);

router.get(
  "/roll",
  controller.getRentRoll
);

router.get(
  "/roll/export",
  controller.exportRentRoll
);

router.get(
  "/alerts",
  alertController.listAlerts
);

router.post(
  "/alerts/:unitId/dismiss",
  alertController.dismissAlert
);

module.exports = router;