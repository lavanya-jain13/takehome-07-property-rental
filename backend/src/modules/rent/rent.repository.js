const db = require("../../config/database");

const findPaymentById = async (id, trx = db) => {
  return trx("rent_payments")
    .where("rent_payments.id", id)
    .first();
};

const findPaymentByUnitAndMonth = async (
  unitId,
  paymentMonth,
  trx = db
) => {
  return trx("rent_payments")
    .where({
      unit_id: unitId,
      payment_month: paymentMonth,
    })
    .first();
};

const createPayment = async (data, trx = db) => {
  const [payment] = await trx("rent_payments")
    .insert(data)
    .returning("*");

  return payment;
};

const findAllPayments = async ({
  paymentMonth,
  unitId,
  page,
  limit,
  sortBy,
  sortOrder,
}) => {
  const query = db("rent_payments")
    .join(
      "units",
      "rent_payments.unit_id",
      "units.id"
    )
    .join(
      "users",
      "rent_payments.recorded_by",
      "users.id"
    )
    .select(
      "rent_payments.*",
      "units.unit_number",
      "units.address",
      "users.name as recorded_by_name"
    );

  if (paymentMonth) {
    query.where(
      "rent_payments.payment_month",
      paymentMonth
    );
  }

  if (unitId) {
    query.where("rent_payments.unit_id", unitId);
  }

  const countQuery = query
    .clone()
    .clearSelect()
    .clearOrder()
    .count("rent_payments.id as count");

  const [{ count }] = await countQuery;

  const allowedSortFields = {
    paymentMonth: "rent_payments.payment_month",
    amount: "rent_payments.amount",
    recordedAt: "rent_payments.recorded_at",
  };

  const sortColumn =
    allowedSortFields[sortBy] ||
    "rent_payments.payment_month";

  const payments = await query
    .orderBy(sortColumn, sortOrder === "asc" ? "asc" : "desc")
    .limit(limit)
    .offset((page - 1) * limit);

  return {
    payments,
    total: Number(count),
  };
};

const findUnitsForRentRoll = async (
  paymentMonth,
  trx = db
) => {
  return trx("units")
    .where("units.status", "ACTIVE")
    .leftJoin(
      "rent_payments",
      function () {
        this.on(
          "rent_payments.unit_id",
          "=",
          "units.id"
        ).andOn(
          "rent_payments.payment_month",
          "=",
          trx.raw("?", [paymentMonth])
        );
      }
    )
    .select(
      "units.id",
      "units.unit_number",
      "units.address",
      "units.tenant_name",
      "units.monthly_rent",
      "units.status",
      "rent_payments.id as payment_id",
      "rent_payments.amount as payment_amount",
      "rent_payments.payment_month",
      "rent_payments.recorded_at"
    )
    .orderBy("units.unit_number", "asc");
};

const findUnitsByIds = async (unitIds, trx = db) => {
  return trx("units")
    .whereIn("id", unitIds)
    .select(
      "id",
      "unit_number",
      "address",
      "tenant_name",
      "monthly_rent",
      "status"
    );
};

const findPaymentsByMonth = async (
  paymentMonth,
  trx = db
) => {
  return trx("rent_payments")
    .where({
      payment_month: paymentMonth,
    })
    .select(
      "id",
      "unit_id",
      "recorded_by",
      "payment_month",
      "amount",
      "recorded_at"
    );
};

module.exports = {
  findPaymentById,
  findPaymentByUnitAndMonth,
  createPayment,
  findAllPayments,
  findUnitsForRentRoll,
  findUnitsByIds,
  findPaymentsByMonth,
};