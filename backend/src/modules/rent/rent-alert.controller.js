const alertService = require("./rent-alert.service");

const handleError = (res, error) => {
  const errors = {
    UNIT_NOT_FOUND: [
      404,
      "NOT_FOUND",
      "Unit not found.",
    ],
    INVALID_PAYMENT_MONTH: [
      400,
      "VALIDATION_ERROR",
      "Payment month must be in YYYY-MM-DD format.",
    ],
  };

  const mapped = errors[error.message];

  if (mapped) {
    return res.status(mapped[0]).json({
      error: {
        code: mapped[1],
        message: mapped[2],
      },
    });
  }

  console.error(error);

  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong.",
    },
  });
};

const listAlerts = async (req, res) => {
  try {
    const alerts = await alertService.getAlerts();

    return res.status(200).json({
      data: alerts,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const dismissAlert = async (req, res) => {
  try {
    const rentMonth =
      req.body.rentMonth ||
      `${new Date().getUTCFullYear()}-${String(
        new Date().getUTCMonth() + 1
      ).padStart(2, "0")}-01`;

    const dismissal =
      await alertService.dismissAlert(
        req.params.unitId,
        rentMonth,
        req.user.id
      );

    return res.status(200).json({
      data: dismissal,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  listAlerts,
  dismissAlert,
};