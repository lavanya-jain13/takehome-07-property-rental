const validatePayment = (data) => {
  const { unitId, paymentMonth, amount } = data;

  if (!unitId || !paymentMonth || amount === undefined) {
    throw new Error("VALIDATION_ERROR");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentMonth)) {
    throw new Error("INVALID_PAYMENT_MONTH");
  }

  if (Number.isNaN(Number(amount)) || Number(amount) < 0) {
    throw new Error("INVALID_AMOUNT");
  }
};

const validateBulkPayments = (data) => {
  const { paymentMonth, payments } = data;

  if (!paymentMonth || !Array.isArray(payments)) {
    throw new Error("VALIDATION_ERROR");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentMonth)) {
    throw new Error("INVALID_PAYMENT_MONTH");
  }

  if (payments.length === 0) {
    throw new Error("EMPTY_PAYMENTS");
  }

  const unitIds = new Set();

  for (const payment of payments) {
    if (!payment.unitId || payment.amount === undefined) {
      throw new Error("VALIDATION_ERROR");
    }

    if (unitIds.has(payment.unitId)) {
      throw new Error("DUPLICATE_UNIT_IN_BATCH");
    }

    unitIds.add(payment.unitId);

    if (
      Number.isNaN(Number(payment.amount)) ||
      Number(payment.amount) < 0
    ) {
      throw new Error("INVALID_AMOUNT");
    }
  }
};

const validatePagination = (page, limit) => {
  page = Number(page);
  limit = Number(limit);

  if (!Number.isInteger(page) || page < 1) {
    throw new Error("INVALID_PAGE");
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("INVALID_LIMIT");
  }

  return {
    page,
    limit,
  };
};

module.exports = {
  validatePayment,
  validateBulkPayments,
  validatePagination,
};