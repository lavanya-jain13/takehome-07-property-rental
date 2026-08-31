const repository = require("./units.repository");

const listUnits = async ({ status, page = 1, limit = 20 }) => {
  const validStatuses = ["ACTIVE", "ARCHIVED"];

  if (status && !validStatuses.includes(status)) {
    throw new Error("INVALID_STATUS");
  }

  page = Number(page);
  limit = Number(limit);

  if (!Number.isInteger(page) || page < 1) {
    throw new Error("INVALID_PAGE");
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("INVALID_LIMIT");
  }

  const result = await repository.findAll({
    status,
    page,
    limit,
  });

  return {
    data: result.units.map(formatUnit),
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    },
  };
};

const getUnit = async (id) => {
  const unit = await repository.findByIdWithMaintenanceRequests(id);

  if (!unit) {
    throw new Error("UNIT_NOT_FOUND");
  }

  return {
    ...formatUnit(unit),
    maintenanceRequests: unit.maintenanceRequests.map(
      formatMaintenanceRequest
    ),
  };
};

const createUnit = async (data) => {
  const { unitNumber, address, tenantName, monthlyRent } = data;

  if (!unitNumber || !address || !tenantName || monthlyRent === undefined) {
    throw new Error("VALIDATION_ERROR");
  }

  if (Number(monthlyRent) <= 0) {
    throw new Error("INVALID_RENT");
  }

  try {
    const unit = await repository.create({
      unit_number: unitNumber,
      address,
      tenant_name: tenantName,
      monthly_rent: monthlyRent,
      status: "ACTIVE",
    });

    return formatUnit(unit);
  } catch (error) {
    if (error.code === "23505") {
      throw new Error("UNIT_NUMBER_EXISTS");
    }

    throw error;
  }
};

const updateUnit = async (id, data) => {
  const existing = await repository.findById(id);

  if (!existing) {
    throw new Error("UNIT_NOT_FOUND");
  }

  if (existing.status === "ARCHIVED") {
    throw new Error("UNIT_ARCHIVED");
  }

  const allowedFields = {};

  if (data.unitNumber !== undefined) {
    allowedFields.unit_number = data.unitNumber;
  }

  if (data.address !== undefined) {
    allowedFields.address = data.address;
  }

  if (data.tenantName !== undefined) {
    allowedFields.tenant_name = data.tenantName;
  }

  if (data.monthlyRent !== undefined) {
    if (Number(data.monthlyRent) <= 0) {
      throw new Error("INVALID_RENT");
    }

    allowedFields.monthly_rent = data.monthlyRent;
  }

  if (Object.keys(allowedFields).length === 0) {
    throw new Error("VALIDATION_ERROR");
  }

  try {
    const unit = await repository.update(id, allowedFields);

    return formatUnit(unit);
  } catch (error) {
    if (error.code === "23505") {
      throw new Error("UNIT_NUMBER_EXISTS");
    }

    throw error;
  }
};

const archiveUnit = async (id) => {
  const existing = await repository.findById(id);

  if (!existing) {
    throw new Error("UNIT_NOT_FOUND");
  }

  if (existing.status === "ARCHIVED") {
    throw new Error("UNIT_ALREADY_ARCHIVED");
  }

  const unit = await repository.update(id, {
    status: "ARCHIVED",
  });

  return formatUnit(unit);
};

const restoreUnit = async (id) => {
  const existing = await repository.findById(id);

  if (!existing) {
    throw new Error("UNIT_NOT_FOUND");
  }

  if (existing.status === "ACTIVE") {
    throw new Error("UNIT_ALREADY_ACTIVE");
  }

  const unit = await repository.update(id, {
    status: "ACTIVE",
  });

  return formatUnit(unit);
};

const formatUnit = (unit) => ({
  id: unit.id,
  unitNumber: unit.unit_number,
  address: unit.address,
  tenantName: unit.tenant_name,
  monthlyRent: Number(unit.monthly_rent),
  status: unit.status,
  createdAt: unit.created_at,
  updatedAt: unit.updated_at,
});

const formatMaintenanceRequest = (request) => ({
  id: request.id,
  title: request.title,
  description: request.description,
  priority: request.priority,
  status: request.status,
  createdBy: request.created_by,
  createdAt: request.created_at,
  updatedAt: request.updated_at,
});

module.exports = {
  listUnits,
  getUnit,
  createUnit,
  updateUnit,
  archiveUnit,
  restoreUnit,
};