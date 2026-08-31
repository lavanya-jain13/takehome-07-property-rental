const repository = require("./dashboard.repository");

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

const getGracePeriodDays = () => {
  const value = Number(
    process.env.RENT_GRACE_PERIOD_DAYS || 5
  );

  if (!Number.isInteger(value) || value < 0) {
    return 5;
  }

  return value;
};

const getCurrentBusinessDate = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: getRentTimezone(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find(
    (part) => part.type === "year"
  ).value;

  const month = parts.find(
    (part) => part.type === "month"
  ).value;

  const day = parts.find(
    (part) => part.type === "day"
  ).value;

  return `${year}-${month}-${day}`;
};

const addCalendarDays = (date, days) => {
  const value = new Date(`${date}T00:00:00Z`);

  value.setUTCDate(value.getUTCDate() + days);

  return value.toISOString().slice(0, 10);
};

const getBusinessWeekStart = (date = new Date()) => {
  const businessDate = getCurrentBusinessDate(date);
  const value = new Date(`${businessDate}T00:00:00Z`);
  const daysSinceMonday = (value.getUTCDay() + 6) % 7;

  return addCalendarDays(
    businessDate,
    -daysSinceMonday
  );
};

const getRentMonth = () => {
  const parts = getCurrentBusinessDate().split("-");

  return `${parts[0]}-${parts[1]}-01`;
};

const getGracePeriodEnd = (rentMonth) => {
  const date = new Date(`${rentMonth}T00:00:00Z`);

  date.setUTCDate(
    date.getUTCDate() + getGracePeriodDays()
  );

  return date.toISOString().slice(0, 10);
};

const getDashboard = async () => {
  const [
    maintenanceHeadline,
    rentHeadline,
    maintenanceByStatus,
    maintenanceByContractor,
    resolvedPerWeek,
  ] = await Promise.all([
    repository.getMaintenanceHeadline(),
    repository.getRentHeadline(),
    repository.getMaintenanceByStatus(),
    repository.getMaintenanceByContractor(),
    repository.getResolvedPerWeek(),
  ]);

  const rentMonth = getRentMonth();
  const gracePeriodEnd = getGracePeriodEnd(rentMonth);
  const currentBusinessDate = getCurrentBusinessDate();

  const rentOverdueThisMonth =
    currentBusinessDate > gracePeriodEnd
      ? rentHeadline.overdueThisMonth
      : 0;

  return {
    headline: {
      openMaintenanceRequests:
        maintenanceHeadline.open,

      rentOverdueThisMonth,

      requestsResolvedThisWeek:
        maintenanceHeadline.resolvedThisWeek,

      rentCollectedThisMonth:
        rentHeadline.collectedThisMonth,
    },

    maintenanceByStatus,

    maintenanceByContractor:
      maintenanceByContractor.map((row) => ({
        contractorId: row.contractor_id,
        contractorName: row.contractor_name,
        count: Number(row.count),
      })),

    resolvedPerWeek: buildEightWeekSeries(
      resolvedPerWeek
    ),
  };
};

const buildEightWeekSeries = (rows) => {
  const counts = new Map(
    rows.map((row) => [
      formatDate(row.week),
      Number(row.count),
    ])
  );

  const result = [];
  const firstWeek = addCalendarDays(
    getBusinessWeekStart(),
    -7 * 7
  );

  for (let i = 0; i < 8; i += 1) {
    const key = addCalendarDays(firstWeek, i * 7);

    result.push({
      week: key,
      count: counts.get(key) || 0,
    });
  }

  return result;
};

const formatDate = (date) => {
  return getCurrentBusinessDate(new Date(date));
};

module.exports = {
  getDashboard,
};
