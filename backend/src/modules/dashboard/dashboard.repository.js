const db = require("../../config/database");

const getMaintenanceHeadline = async () => {
  const [openResult] = await db("maintenance_requests")
    .whereNot("status", "RESOLVED")
    .count("id as count");

  const [resolvedWeekResult] = await db("maintenance_requests")
    .where("status", "RESOLVED")
    .where(
      "updated_at",
      ">=",
      db.raw("date_trunc('week', CURRENT_TIMESTAMP)")
    )
    .count("id as count");

  return {
    open: Number(openResult.count),
    resolvedThisWeek: Number(resolvedWeekResult.count),
  };
};

const getRentHeadline = async () => {
  const [collectedResult] = await db("rent_payments")
    .where(
      "payment_month",
      db.raw("date_trunc('month', CURRENT_DATE)")
    )
    .sum("amount as total");

  const [overdueResult] = await db("units")
    .leftJoin("rent_payments", function () {
      this.on(
        "rent_payments.unit_id",
        "=",
        "units.id"
      ).andOn(
        "rent_payments.payment_month",
        "=",
        db.raw("date_trunc('month', CURRENT_DATE)")
      );
    })
    .where("units.status", "ACTIVE")
    .where(function () {
      this.whereNull("rent_payments.id").orWhere(
        "rent_payments.amount",
        "<",
        db.ref("units.monthly_rent")
      );
    })
    .count("units.id as count");

  return {
    collectedThisMonth: Number(
      collectedResult.total || 0
    ),
    overdueThisMonth: Number(overdueResult.count),
  };
};

const getMaintenanceByStatus = async () => {
  const rows = await db("maintenance_requests")
    .select("status")
    .count("id as count")
    .groupBy("status");

  return rows.reduce((result, row) => {
    result[row.status] = Number(row.count);
    return result;
  }, {});
};

const getMaintenanceByContractor = async () => {
  return db("maintenance_assignments")
    .join(
      "users",
      "maintenance_assignments.contractor_id",
      "users.id"
    )
    .select(
      "users.id as contractor_id",
      "users.name as contractor_name"
    )
    .count(
      "maintenance_assignments.maintenance_request_id as count"
    )
    .groupBy(
      "users.id",
      "users.name"
    )
    .orderBy("count", "desc");
};

const getResolvedPerWeek = async () => {
  const rows = await db("timeline_events")
    .select(
      db.raw(
        "date_trunc('week', created_at) as week"
      )
    )
    .count("id as count")
    .where("event_type", "STATUS_CHANGED")
    .where("new_status", "RESOLVED")
    .where(
      "created_at",
      ">=",
      db.raw(
        "date_trunc('week', CURRENT_DATE) - interval '7 weeks'"
      )
    )
    .groupBy(
      db.raw("date_trunc('week', created_at)")
    )
    .orderBy("week", "asc");

  return rows;
};

module.exports = {
  getMaintenanceHeadline,
  getRentHeadline,
  getMaintenanceByStatus,
  getMaintenanceByContractor,
  getResolvedPerWeek,
};
