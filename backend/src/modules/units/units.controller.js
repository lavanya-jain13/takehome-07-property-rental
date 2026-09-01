const unitsService = require("./units.service");

const handleError = (res, error) => {
  const errors = {
    INVALID_STATUS: [400, "VALIDATION_ERROR", "Invalid unit status."],
    INVALID_PAGE: [400, "VALIDATION_ERROR", "Page must be a positive integer."],
    INVALID_LIMIT: [400, "VALIDATION_ERROR", "Limit must be between 1 and 100."],
    VALIDATION_ERROR: [400, "VALIDATION_ERROR", "Invalid unit data."],
    INVALID_RENT: [400, "VALIDATION_ERROR", "Monthly rent must be greater than zero."],
    UNIT_NUMBER_EXISTS: [409, "CONFLICT", "Unit number already exists."],
    UNIT_NOT_FOUND: [404, "NOT_FOUND", "Unit not found."],
    UNIT_ARCHIVED: [409, "CONFLICT", "Archived units cannot be edited."],
    UNIT_ALREADY_ARCHIVED: [409, "CONFLICT", "Unit is already archived."],
    UNIT_ALREADY_ACTIVE: [409, "CONFLICT", "Unit is already active."],
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
    const result = await unitsService.listUnits(
      req.query,
      req.user
    );

    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

const get = async (req, res) => {
  try {
    const unit = await unitsService.getUnit(req.params.unitId);

    return res.status(200).json({
      data: unit,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const create = async (req, res) => {
  try {
    const unit = await unitsService.createUnit(req.body);

    return res.status(201).json({
      data: unit,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const update = async (req, res) => {
  try {
    const unit = await unitsService.updateUnit(
      req.params.unitId,
      req.body
    );

    return res.status(200).json({
      data: unit,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const archive = async (req, res) => {
  try {
    const unit = await unitsService.archiveUnit(req.params.unitId);

    return res.status(200).json({
      data: unit,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

const restore = async (req, res) => {
  try {
    const unit = await unitsService.restoreUnit(req.params.unitId);

    return res.status(200).json({
      data: unit,
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
  archive,
  restore,
};
