const db = require("../../config/database");

const findOverdueUnits = async (rentMonth) => {
  return db("units")
    .leftJoin("rent_payments", function () {
      this.on(
        "rent_payments.unit_id",
        "=",
        "units.id"
      ).andOn(
        "rent_payments.payment_month",
        "=",
        db.raw("?", [rentMonth])
      );
    })
    .leftJoin("rent_alert_dismissals", function () {
      this.on(
        "rent_alert_dismissals.unit_id",
        "=",
        "units.id"
      ).andOn(
        "rent_alert_dismissals.rent_month",
        "=",
        db.raw("?", [rentMonth])
      );
    })
    .where("units.status", "ACTIVE")
    .select(
      "units.id",
      "units.unit_number",
      "units.address",
      "units.tenant_name",
      "units.monthly_rent",
      "rent_payments.amount as amount_paid",
      "rent_payments.payment_month",
      "rent_alert_dismissals.id as dismissal_id",
      "rent_alert_dismissals.dismissed_by",
      "rent_alert_dismissals.dismissed_at"
    );
};

const findDismissal = async (
  unitId,
  rentMonth
) => {
  return db("rent_alert_dismissals")
    .where({
      unit_id: unitId,
      rent_month: rentMonth,
    })
    .first();
};

const createDismissal = async (
  unitId,
  rentMonth,
  dismissedBy
) => {
  const [dismissal] = await db(
    "rent_alert_dismissals"
  )
    .insert({
      unit_id: unitId,
      rent_month: rentMonth,
      dismissed_by: dismissedBy,
    })
    .returning("*");

  return dismissal;
};

module.exports = {
  findOverdueUnits,
  findDismissal,
  createDismissal,
};