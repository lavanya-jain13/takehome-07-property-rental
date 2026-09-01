const maintenanceService = require("./maintenance.service");

const handleError = (res, error) => {
  const errors = {
    VALIDATION_ERROR: [
      400,
      "VALIDATION_ERROR",
      "Invalid maintenance request data.",
    ],
    INVALID_PRIORITY: [
      400,
      "VALIDATION_ERROR",
      "Invalid priority.",
    ],
    INVALID_STATUS: [
      400,
      "VALIDATION_ERROR",
      "Invalid status.",
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
    INVALID_NOTE: [
      400,
      "VALIDATION_ERROR",
      "Note cannot be empty.",
    ],
    INVALID_STATUS_TRANSITION: [
      400,
      "INVALID_STATUS_TRANSITION",
      "Status must follow REPORTED -> TRIAGED -> SCHEDULED -> RESOLVED, or RESOLVED -> TRIAGED when reopening.",
    ],
    CONTRACTOR_REQUIRED_FOR_SCHEDULE: [
      400,
      "CONTRACTOR_REQUIRED_FOR_SCHEDULE",
      "At least one contractor must be assigned before scheduling.",
    ],
    REQUEST_NOT_FOUND: [
      404,
      "NOT_FOUND",
      "Maintenance request not found.",
    ],
    UNIT_NOT_FOUND: [
      404,
      "NOT_FOUND",
      "Unit not found.",
    ],
    CONTRACTOR_NOT_FOUND: [
      404,
      "NOT_FOUND",
      "Contractor not found.",
    ],
    ASSIGNMENT_NOT_FOUND: [
      404,
      "NOT_FOUND",
      "Contractor assignment not found.",
    ],
    DUPLICATE_ASSIGNMENT: [
      409,
      "CONFLICT",
      "Contractor is already assigned.",
    ],
    FORBIDDEN: [
      403,
      "FORBIDDEN",
      "You do not have permission to perform this action.",
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

const list = async (req, res) => {
  try {
    const result = await maintenanceService.listRequests({
      ...req.query,
      userId: req.user.id,
      role: req.user.role,
    });

    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

const get = async (req, res) => {
  try {
    const request = await maintenanceService.getRequest(
      req.params.requestId,
      req.user
    );

    return res.status(200).json({
      data: request,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const create = async (req, res) => {
  try {
    const request = await maintenanceService.createRequest(
      req.body,
      req.user
    );

    return res.status(201).json({
      data: request,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const update = async (req, res) => {
  try {
    const request = await maintenanceService.updateRequest(
      req.params.requestId,
      req.body,
      req.user
    );

    return res.status(200).json({
      data: request,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const changeStatus = async (req, res) => {
  try {
    const request = await maintenanceService.changeStatus(
      req.params.requestId,
      req.body.status,
      req.user
    );

    return res.status(200).json({
      data: request,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const assignContractor = async (req, res) => {
  try {
    const assignment =
      await maintenanceService.assignContractor(
        req.params.requestId,
        req.body.contractorId,
        req.user.id
      );

    return res.status(201).json({
      data: assignment,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const removeContractor = async (req, res) => {
  try {
    await maintenanceService.removeContractor(
      req.params.requestId,
      req.params.contractorId,
      req.user.id
    );

    return res.status(204).send();
  } catch (error) {
    return handleError(res, error);
  }
};

const addTimelineNote = async (req, res) => {
  try {
    const event = await maintenanceService.addTimelineNote(
      req.params.requestId,
      req.body.note,
      req.user
    );

    return res.status(201).json({
      data: event,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  list,
  get,
  create,
  update,
  changeStatus,
  assignContractor,
  removeContractor,
  addTimelineNote,
};
