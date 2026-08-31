const rentService = require("./rent.service");

const handleError = (res, error) => {
  const errors = {
    VALIDATION_ERROR: [
      400,
      "VALIDATION_ERROR",
      "Invalid rent payment data.",
    ],
    INVALID_PAYMENT_MONTH: [
      400,
      "VALIDATION_ERROR",
      "Payment month must be in YYYY-MM-DD format.",
    ],
    INVALID_AMOUNT: [
      400,
      "VALIDATION_ERROR",
      "Amount must be a non-negative number.",
    ],
    EMPTY_PAYMENTS: [
      400,
      "VALIDATION_ERROR",
      "Payment batch cannot be empty.",
    ],
    DUPLICATE_UNIT_IN_BATCH: [
      400,
      "VALIDATION_ERROR",
      "The same unit cannot appear more than once in a payment batch.",
    ],
    INVALID_PAGE: [
      400,
      "VALIDATION_ERROR",
      "Page must be a positive integer.",
    ],
    INVALID_LIMIT: [
      400,
      "VALIDATION_ERROR",
      "Limit must be between 1 and 100.",
    ],
    PAYMENT_MONTH_REQUIRED: [
      400,
      "VALIDATION_ERROR",
      "Payment month is required.",
    ],
    UNIT_NOT_FOUND: [
      404,
      "NOT_FOUND",
      "Active unit not found.",
    ],
    PAYMENT_ALREADY_EXISTS: [
      409,
      "CONFLICT",
      "A payment for this unit and month already exists.",
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

const createPayment = async (req, res) => {
  try {
    const payment = await rentService.recordPayment(
      req.body,
      req.user.id
    );

    return res.status(201).json({
      data: payment,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const listPayments = async (req, res) => {
  try {
    const result = await rentService.listPayments(
      req.query
    );

    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

const bulkCreatePayments = async (req, res) => {
  try {
    const result =
      await rentService.bulkRecordPayments(
        req.body,
        req.user.id
      );

    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

const getRentRoll = async (req, res) => {
  try {
    const result = await rentService.getRentRoll(
      req.query.paymentMonth
    );

    return res.status(200).json({
      data: result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const exportRentRoll = async (req, res) => {
  try {
    const csv = await rentService.getRentRollCsv(
      req.query.paymentMonth
    );

    const paymentMonth = req.query.paymentMonth;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="rent-roll-${paymentMonth}.csv"`
    );

    return res.status(200).send(csv);
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  createPayment,
  listPayments,
  bulkCreatePayments,
  getRentRoll,
  exportRentRoll,
};