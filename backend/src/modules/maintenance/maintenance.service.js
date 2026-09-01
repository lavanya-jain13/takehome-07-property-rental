const db = require("../../config/database");
const repository = require("./maintenance.repository");

const {
  VALID_PRIORITIES,
  validateCreateRequest,
  validateUpdateRequest,
  validateStatus,
  isValidStatusTransition,
} = require("./maintenance.validation");

const VALID_SORT_FIELDS = [
  "created",
  "createdAt",
  "priority",
  "status",
];

const listRequests = async ({
  userId,
  role,
  unitId,
  status,
  priority,
  contractorId,
  search,
  page = 1,
  limit = 20,
  sortBy = "createdAt",
  sortOrder = "desc",
}) => {
  page = Number(page);
  limit = Number(limit);

  if (!Number.isInteger(page) || page < 1) {
    throw new Error("INVALID_PAGE");
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("INVALID_LIMIT");
  }

  if (status) {
    validateStatus(status);
  }

  if (
    priority &&
    !VALID_PRIORITIES.includes(priority)
  ) {
    throw new Error("INVALID_PRIORITY");
  }

  const normalizedSortBy =
    VALID_SORT_FIELDS.includes(sortBy)
      ? sortBy
      : "createdAt";

  const result = await repository.findAll({
    userId,
    role,
    unitId,
    status,
    priority,
    contractorId,
    search: search?.trim(),
    page,
    limit,
    sortBy: normalizedSortBy,
    sortOrder: sortOrder === "asc" ? "asc" : "desc",
  });

  return {
    data: result.requests.map(formatRequest),
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    },
  };
};

const getRequest = async (requestId, user) => {
  const request = await repository.findByIdWithDetails(requestId);

  if (!request) {
    throw new Error("REQUEST_NOT_FOUND");
  }

  ensureCanAccessRequest(request, user);

  return formatRequestDetails(request);
};

const createRequest = async (data, user) => {
  validateCreateRequest(data);

  const unit = await db("units")
    .where({
      id: data.unitId,
      status: "ACTIVE",
    })
    .first();

  if (!unit) {
    throw new Error("UNIT_NOT_FOUND");
  }

  const trx = await db.transaction();

  try {
    const request = await repository.create(
      {
        unit_id: data.unitId,
        created_by: user.id,
        title: data.title || "Maintenance Request",
        description: data.description,
        priority: data.priority,
        status: "REPORTED",
      },
      trx
    );

    await repository.createTimelineEvent(
      {
        maintenance_request_id: request.id,
        performed_by: user.id,
        event_type: "REQUEST_CREATED",
        old_status: null,
        new_status: "REPORTED",
        note: null,
      },
      trx
    );

    if (user.role === "CONTRACTOR") {
      const contractor = await repository.findContractor(
        user.id,
        trx
      );

      await repository.createAssignment(
        request.id,
        user.id,
        trx
      );

      await repository.createTimelineEvent(
        {
          maintenance_request_id: request.id,
          performed_by: user.id,
          event_type: "CONTRACTOR_ASSIGNED",
          old_status: null,
          new_status: null,
          note: `Contractor ${
            contractor?.name || user.id
          } assigned.`,
        },
        trx
      );
    }

    await trx.commit();

    return formatRequest(request);
  } catch (error) {
    await trx.rollback();
    throw error;
  }
};

const updateRequest = async (requestId, data, user) => {
  validateUpdateRequest(data);

  const request = await repository.findById(requestId);

  if (!request) {
    throw new Error("REQUEST_NOT_FOUND");
  }

  await ensureCanModifyRequest(request, user);

  const updateData = {};

  if (data.description !== undefined) {
    updateData.description = data.description;
  }

  if (data.priority !== undefined) {
    updateData.priority = data.priority;
  }

  const updatedRequest = await repository.update(
    requestId,
    updateData
  );

  return formatRequest(updatedRequest);
};

const changeStatus = async (
  requestId,
  newStatus,
  user
) => {
  validateStatus(newStatus);

  const request = await repository.findById(requestId);

  if (!request) {
    throw new Error("REQUEST_NOT_FOUND");
  }

  await ensureCanModifyRequest(request, user);

  if (
    !isValidStatusTransition(
      request.status,
      newStatus
    )
  ) {
    throw new Error("INVALID_STATUS_TRANSITION");
  }

  const trx = await db.transaction();

  try {
    if (
      newStatus === "SCHEDULED"
    ) {
      const assignments = await repository.getAssignments(
        requestId,
        trx
      );

      if (assignments.length === 0) {
        throw new Error(
          "CONTRACTOR_REQUIRED_FOR_SCHEDULE"
        );
      }
    }

    const updatedRequest = await repository.update(
      requestId,
      {
        status: newStatus,
      },
      trx
    );

    await repository.createTimelineEvent(
      {
        maintenance_request_id: requestId,
        performed_by: user.id,
        event_type: "STATUS_CHANGED",
        old_status: request.status,
        new_status: newStatus,
        note: null,
      },
      trx
    );

    await trx.commit();

    return formatRequest(updatedRequest);
  } catch (error) {
    await trx.rollback();
    throw error;
  }
};

const assignContractor = async (
  requestId,
  contractorId,
  managerId
) => {
  const request = await repository.findById(requestId);

  if (!request) {
    throw new Error("REQUEST_NOT_FOUND");
  }

  const contractor = await repository.findContractor(
    contractorId
  );

  if (!contractor) {
    throw new Error("CONTRACTOR_NOT_FOUND");
  }

  const existingAssignment =
    await repository.findAssignment(
      requestId,
      contractorId
    );

  if (existingAssignment) {
    throw new Error("DUPLICATE_ASSIGNMENT");
  }

  const trx = await db.transaction();

  try {
    const assignment =
      await repository.createAssignment(
        requestId,
        contractorId,
        trx
      );

    await repository.createTimelineEvent(
      {
        maintenance_request_id: requestId,
        performed_by: managerId,
        event_type: "CONTRACTOR_ASSIGNED",
        old_status: null,
        new_status: null,
        note: `Contractor ${contractor.name} assigned.`,
      },
      trx
    );

    await trx.commit();

    return assignment;
  } catch (error) {
    await trx.rollback();
    throw error;
  }
};

const removeContractor = async (
  requestId,
  contractorId,
  managerId
) => {
  const request = await repository.findById(requestId);

  if (!request) {
    throw new Error("REQUEST_NOT_FOUND");
  }

  const assignment =
    await repository.findAssignment(
      requestId,
      contractorId
    );

  if (!assignment) {
    throw new Error("ASSIGNMENT_NOT_FOUND");
  }

  const contractor = await repository.findContractor(
    contractorId
  );

  const trx = await db.transaction();

  try {
    await repository.deleteAssignment(
      requestId,
      contractorId,
      trx
    );

    await repository.createTimelineEvent(
      {
        maintenance_request_id: requestId,
        performed_by: managerId,
        event_type: "CONTRACTOR_UNASSIGNED",
        old_status: null,
        new_status: null,
        note: `Contractor ${
          contractor?.name || contractorId
        } unassigned.`,
      },
      trx
    );

    await trx.commit();
  } catch (error) {
    await trx.rollback();
    throw error;
  }
};

const addTimelineNote = async (
  requestId,
  note,
  user
) => {
  if (!note || !note.trim()) {
    throw new Error("INVALID_NOTE");
  }

  const request = await repository.findById(requestId);

  if (!request) {
    throw new Error("REQUEST_NOT_FOUND");
  }

  await ensureCanModifyRequest(request, user);

  const event = await repository.createTimelineEvent({
    maintenance_request_id: requestId,
    performed_by: user.id,
    event_type: "NOTE_ADDED",
    old_status: null,
    new_status: null,
    note: note.trim(),
  });

  return event;
};

const ensureCanAccessRequest = (
  request,
  user
) => {
  if (user.role === "MANAGER") {
    return;
  }

  if (user.role === "CONTRACTOR") {
    const assigned = request.contractors.some(
      (contractor) =>
        contractor.id === user.id
    );

    if (!assigned) {
      throw new Error("FORBIDDEN");
    }

    return;
  }

  throw new Error("FORBIDDEN");
};

const ensureCanModifyRequest = async (
  request,
  user
) => {
  if (user.role === "MANAGER") {
    return;
  }

  if (user.role === "CONTRACTOR") {
    const assignment = await repository.findAssignment(
      request.id,
      user.id
    );

    if (assignment) {
      return;
    }
  }

  throw new Error("FORBIDDEN");
};

const formatRequest = (request) => ({
  id: request.id,
  unitId: request.unit_id,
  unitNumber: request.unit_number,
  createdBy: request.created_by,
  title: request.title,
  description: request.description,
  priority: request.priority,
  status: request.status,
  createdAt: request.created_at,
  updatedAt: request.updated_at,
});

const formatRequestDetails = (request) => ({
  ...formatRequest(request),
  address: request.address,
  createdByName: request.created_by_name,
  contractors: request.contractors,
  timeline: request.timeline,
});

module.exports = {
  listRequests,
  getRequest,
  createRequest,
  updateRequest,
  changeStatus,
  assignContractor,
  removeContractor,
  addTimelineNote,
};
