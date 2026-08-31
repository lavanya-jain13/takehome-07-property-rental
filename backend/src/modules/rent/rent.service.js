const db = require("../../config/database");
const repository = require("./rent.repository");

const {
  validatePayment,
  validateBulkPayments,
  validatePagination,
} = require("./rent.validation");

const recordPayment = async (data, recordedBy) => {
  validatePayment(data);

  const unit = await db("units")
    .where({
      id: data.unitId,
      status: "ACTIVE",
    })
    .first();

  if (!unit) {
    throw new Error("UNIT_NOT_FOUND");
  }

  const existingPayment =
    await repository.findPaymentByUnitAndMonth(
      data.unitId,
      data.paymentMonth
    );

  if (existingPayment) {
    throw new Error("PAYMENT_ALREADY_EXISTS");
  }

  try {
    const payment = await repository.createPayment({
      unit_id: data.unitId,
      recorded_by: recordedBy,
      payment_month: data.paymentMonth,
      amount: data.amount,
    });

    return formatPayment(payment, unit);
  } catch (error) {
    if (error.code === "23505") {
      throw new Error("PAYMENT_ALREADY_EXISTS");
    }

    throw error;
  }
};

const listPayments = async ({
  paymentMonth,
  unitId,
  page = 1,
  limit = 20,
  sortBy = "paymentMonth",
  sortOrder = "desc",
}) => {
  const pagination = validatePagination(page, limit);

  if (paymentMonth && !/^\d{4}-\d{2}-\d{2}$/.test(paymentMonth)) {
    throw new Error("INVALID_PAYMENT_MONTH");
  }

  const result = await repository.findAllPayments({
    paymentMonth,
    unitId,
    page: pagination.page,
    limit: pagination.limit,
    sortBy,
    sortOrder,
  });

  return {
    data: result.payments.map(formatPaymentWithDetails),
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / pagination.limit),
    },
  };
};

const bulkRecordPayments = async (data, recordedBy) => {
  validateBulkPayments(data);

  const unitIds = [
    ...new Set(
      data.payments.map((payment) => payment.unitId)
    ),
  ];

  const units = await repository.findUnitsByIds(unitIds);

  const unitMap = new Map(
    units.map((unit) => [unit.id, unit])
  );

  const results = [];

  for (const payment of data.payments) {
    const unit = unitMap.get(payment.unitId);

    if (!unit || unit.status !== "ACTIVE") {
      results.push({
        unitId: payment.unitId,
        status: "UNMATCHED",
        amount: Number(payment.amount),
      });

      continue;
    }

    const existingPayment =
      await repository.findPaymentByUnitAndMonth(
        payment.unitId,
        data.paymentMonth
      );

    if (existingPayment) {
      results.push({
        unitId: payment.unitId,
        status: "ALREADY_RECORDED",
        amount: Number(payment.amount),
      });

      continue;
    }

    const expectedAmount = Number(unit.monthly_rent);
    const actualAmount = Number(payment.amount);

    let status;

    if (actualAmount === expectedAmount) {
      status = "MATCHED";
    } else if (actualAmount < expectedAmount) {
      status = "UNDERPAID";
    } else {
      status = "OVERPAID";
    }

    results.push({
      unitId: payment.unitId,
      unitNumber: unit.unit_number,
      status,
      expectedAmount,
      amount: actualAmount,
    });
  }

  const successfulPayments = results.filter(
    (result) =>
      result.status === "MATCHED" ||
      result.status === "UNDERPAID" ||
      result.status === "OVERPAID"
  );

  const trx = await db.transaction();

  try {
    for (const result of successfulPayments) {
      const unit = unitMap.get(result.unitId);

      await repository.createPayment(
        {
          unit_id: result.unitId,
          recorded_by: recordedBy,
          payment_month: data.paymentMonth,
          amount: result.amount,
        },
        trx
      );
    }

    await trx.commit();

    return {
      paymentMonth: data.paymentMonth,
      results,
    };
  } catch (error) {
    await trx.rollback();

    if (error.code === "23505") {
      throw new Error("PAYMENT_ALREADY_EXISTS");
    }

    throw error;
  }
};

const getRentRoll = async (paymentMonth) => {
  if (!paymentMonth) {
    throw new Error("PAYMENT_MONTH_REQUIRED");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentMonth)) {
    throw new Error("INVALID_PAYMENT_MONTH");
  }

  const units = await repository.findUnitsForRentRoll(
    paymentMonth
  );

  return units.map((unit) => {
    const expectedAmount = Number(unit.monthly_rent);
    const paidAmount =
      unit.payment_id === null
        ? 0
        : Number(unit.payment_amount);

    let paymentStatus = "UNMATCHED";

    if (unit.payment_id !== null) {
      if (paidAmount === expectedAmount) {
        paymentStatus = "MATCHED";
      } else if (paidAmount < expectedAmount) {
        paymentStatus = "UNDERPAID";
      } else {
        paymentStatus = "OVERPAID";
      }
    }

    return {
      unitId: unit.id,
      unitNumber: unit.unit_number,
      address: unit.address,
      tenantName: unit.tenant_name,
      monthlyRent: expectedAmount,
      amountPaid: paidAmount,
      paymentStatus,
      paymentMonth,
      recordedAt: unit.recorded_at,
    };
  });
};

const formatPayment = (payment, unit) => ({
  id: payment.id,
  unitId: payment.unit_id,
  unitNumber: unit.unit_number,
  paymentMonth: payment.payment_month,
  amount: Number(payment.amount),
  recordedBy: payment.recorded_by,
  recordedAt: payment.recorded_at,
});

const formatPaymentWithDetails = (payment) => ({
  id: payment.id,
  unitId: payment.unit_id,
  unitNumber: payment.unit_number,
  address: payment.address,
  paymentMonth: payment.payment_month,
  amount: Number(payment.amount),
  recordedBy: payment.recorded_by,
  recordedByName: payment.recorded_by_name,
  recordedAt: payment.recorded_at,
});

const getRentRollCsv = async (paymentMonth) => {
  const rentRoll = await getRentRoll(paymentMonth);

  const headers = [
    "Unit",
    "Address",
    "Tenant",
    "Monthly Rent",
    "Amount Paid",
    "Status",
    "Payment Month",
  ];

  const escapeCsv = (value) => {
    if (value === null || value === undefined) {
      return "";
    }

    const stringValue = String(value);

    if (
      stringValue.includes(",") ||
      stringValue.includes('"') ||
      stringValue.includes("\n")
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  };

  const rows = rentRoll.map((row) => [
    row.unitNumber,
    row.address,
    row.tenantName,
    row.monthlyRent,
    row.amountPaid,
    row.paymentStatus,
    row.paymentMonth,
  ]);

  return [
    headers,
    ...rows,
  ]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");
};

module.exports = {
  recordPayment,
  listPayments,
  bulkRecordPayments,
  getRentRoll,
  getRentRollCsv,
};