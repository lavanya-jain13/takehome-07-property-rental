const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

const VALID_STATUSES = [
  "REPORTED",
  "TRIAGED",
  "SCHEDULED",
  "RESOLVED",
];

const VALID_STATUS_TRANSITIONS = {
  REPORTED: ["TRIAGED"],
  TRIAGED: ["SCHEDULED"],
  SCHEDULED: ["RESOLVED"],
  RESOLVED: ["TRIAGED"],
};

const validateCreateRequest = (data) => {
  const { unitId, description, priority } = data;

  if (!unitId || !description || !priority) {
    throw new Error("VALIDATION_ERROR");
  }

  if (!VALID_PRIORITIES.includes(priority)) {
    throw new Error("INVALID_PRIORITY");
  }
};

const validateUpdateRequest = (data) => {
  const allowedFields = ["description", "priority"];

  const fields = Object.keys(data);

  if (
    fields.length === 0 ||
    fields.some((field) => !allowedFields.includes(field))
  ) {
    throw new Error("VALIDATION_ERROR");
  }

  if (
    data.priority !== undefined &&
    !VALID_PRIORITIES.includes(data.priority)
  ) {
    throw new Error("INVALID_PRIORITY");
  }
};

const validateStatus = (status) => {
  if (!VALID_STATUSES.includes(status)) {
    throw new Error("INVALID_STATUS");
  }
};

const isValidStatusTransition = (currentStatus, newStatus) => {
  return VALID_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus);
};

module.exports = {
  VALID_PRIORITIES,
  VALID_STATUSES,
  VALID_STATUS_TRANSITIONS,
  validateCreateRequest,
  validateUpdateRequest,
  validateStatus,
  isValidStatusTransition,
};
