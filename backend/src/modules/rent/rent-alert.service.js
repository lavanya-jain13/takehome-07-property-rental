const repository = require("./rent-alert.repository");

const getGracePeriodDays = () => {
  const value = Number(
    process.env.RENT_GRACE_PERIOD_DAYS || 5
  );

  if (!Number.isInteger(value) || value < 0) {
    return 5;
  }

  return value;
};

const getRentTimezone = () => {
  const timezone = process.env.RENT_TIMEZONE || "UTC";

  try {
    Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
    });

    return timezone;
  } catch (error) {
    return "UTC";
  }
};

const getBusinessDateParts = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: getRentTimezone(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return {
    year: Number(
      parts.find((part) => part.type === "year").value
    ),
    month: Number(
      parts.find((part) => part.type === "month").value
    ),
    day: Number(
      parts.find((part) => part.type === "day").value
    ),
  };
};

const formatDateParts = ({ year, month, day }) => {
  return `${year}-${String(month).padStart(2, "0")}-${String(
    day
  ).padStart(2, "0")}`;
};

const getBusinessDate = (date = new Date()) => {
  return formatDateParts(getBusinessDateParts(date));
};

const getRentMonth = (date = new Date()) => {
  const { year, month } = getBusinessDateParts(date);

  return formatDateParts({ year, month, day: 1 });
};

const isLeapYear = (year) => {
  return (
    (year % 4 === 0 && year % 100 !== 0) ||
    year % 400 === 0
  );
};

const getDaysInMonth = (year, month) => {
  return [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ][month - 1];
};

const parseBusinessDate = (date) => {
  const [year, month, day] = date
    .split("-")
    .map((part) => Number(part));

  return { year, month, day };
};

const addCalendarDays = (date, days) => {
  const result = parseBusinessDate(date);

  for (let remaining = days; remaining > 0; remaining -= 1) {
    result.day += 1;

    if (
      result.day <=
      getDaysInMonth(result.year, result.month)
    ) {
      continue;
    }

    result.day = 1;
    result.month += 1;

    if (result.month <= 12) {
      continue;
    }

    result.month = 1;
    result.year += 1;
  }

  return formatDateParts(result);
};

const getDueDate = (rentMonth) => {
  return rentMonth;
};

const getGracePeriodEnd = (rentMonth) => {
  return addCalendarDays(
    getDueDate(rentMonth),
    getGracePeriodDays()
  );
};

const isGracePeriodExpired = (
  businessDate,
  rentMonth
) => {
  const gracePeriodDays = getGracePeriodDays();
  const gracePeriodEnd = addCalendarDays(
    rentMonth,
    gracePeriodDays
  );

  if (gracePeriodDays === 0) {
    return businessDate >= rentMonth;
  }

  return businessDate > gracePeriodEnd;
};

const getAlerts = async () => {
  const now = new Date();
  const rentMonth = getRentMonth(now);
  const businessDate = getBusinessDate(now);
  const gracePeriodEnd = getGracePeriodEnd(rentMonth);

  if (!isGracePeriodExpired(businessDate, rentMonth)) {
    return [];
  }

  const units = await repository.findOverdueUnits(
    rentMonth
  );

  const alerts = [];

  for (const unit of units) {
    const monthlyRent = Number(unit.monthly_rent);
    const amountPaid =
      unit.amount_paid === null
        ? 0
        : Number(unit.amount_paid);

    const unresolved =
      amountPaid < monthlyRent;

    if (!unresolved) {
      continue;
    }

 if (unit.dismissal_id) {
  continue;
}

    alerts.push({
      unitId: unit.id,
      unitNumber: unit.unit_number,
      address: unit.address,
      tenantName: unit.tenant_name,
      rentMonth,
      monthlyRent,
      amountPaid,
      amountDue: Math.max(
        monthlyRent - amountPaid,
        0
      ),
      dueDate: rentMonth,
      gracePeriodEndsAt: gracePeriodEnd,
      status: "OVERDUE",
    });
  }

  return alerts;
};

const dismissAlert = async (
  unitId,
  rentMonth,
  dismissedBy
) => {
  const dismissal =
    await repository.findDismissal(
      unitId,
      rentMonth
    );

  if (dismissal) {
    return dismissal;
  }

  return repository.createDismissal(
    unitId,
    rentMonth,
    dismissedBy
  );
};

module.exports = {
  getAlerts,
  dismissAlert,
};
