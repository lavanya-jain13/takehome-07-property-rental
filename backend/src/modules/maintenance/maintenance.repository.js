const db = require("../../config/database");

const findById = async (id, trx = db) => {
  return trx("maintenance_requests")
    .where("maintenance_requests.id", id)
    .first();
};

const findByIdWithDetails = async (id, trx = db) => {
  const request = await trx("maintenance_requests")
    .join(
      "units",
      "maintenance_requests.unit_id",
      "units.id"
    )
    .join(
      "users as creators",
      "maintenance_requests.created_by",
      "creators.id"
    )
    .where("maintenance_requests.id", id)
    .select(
      "maintenance_requests.*",
      "units.unit_number",
      "units.address",
      "creators.name as created_by_name"
    )
    .first();

  if (!request) {
    return null;
  }

  const contractors = await trx("maintenance_assignments")
    .join(
      "users",
      "maintenance_assignments.contractor_id",
      "users.id"
    )
    .where(
      "maintenance_assignments.maintenance_request_id",
      id
    )
    .select(
      "users.id",
      "users.name",
      "users.email"
    );

  const timeline = await trx("timeline_events")
    .join(
      "users",
      "timeline_events.performed_by",
      "users.id"
    )
    .where(
      "timeline_events.maintenance_request_id",
      id
    )
    .select(
      "timeline_events.*",
      "users.name as performed_by_name"
    )
    .orderBy("timeline_events.created_at", "asc");

  return {
    ...request,
    contractors,
    timeline,
  };
};

const findAll = async ({
  userId,
  role,
  unitId,
  status,
  priority,
  contractorId,
  search,
  page,
  limit,
  sortBy,
  sortOrder,
}) => {
  const query = db("maintenance_requests")
    .join(
      "units",
      "maintenance_requests.unit_id",
      "units.id"
    )
    .leftJoin(
      "maintenance_assignments",
      "maintenance_requests.id",
      "maintenance_assignments.maintenance_request_id"
    )
    .select(
      "maintenance_requests.*",
      "units.unit_number"
    )
    .distinct();

  if (role === "CONTRACTOR") {
    query.where(
      "maintenance_assignments.contractor_id",
      userId
    );
  }

  if (unitId) {
    query.where("maintenance_requests.unit_id", unitId);
  }

  if (status) {
    query.where("maintenance_requests.status", status);
  }

  if (priority) {
    query.where("maintenance_requests.priority", priority);
  }

  if (contractorId) {
    query.where(
      "maintenance_assignments.contractor_id",
      contractorId
    );
  }

  if (search) {
    query.whereILike(
      "maintenance_requests.description",
      `%${search}%`
    );
  }

  const countQuery = query
    .clone()
    .clearSelect()
    .clearOrder()
    .countDistinct("maintenance_requests.id as count");

  const [{ count }] = await countQuery;

  const allowedSortFields = {
    created: "maintenance_requests.created_at",
    createdAt: "maintenance_requests.created_at",
    priority: "maintenance_requests.priority",
    status: "maintenance_requests.status",
  };

  const sortColumn =
    allowedSortFields[sortBy] ||
    "maintenance_requests.created_at";

  const requests = await query
    .orderBy(sortColumn, sortOrder)
    .orderBy("maintenance_requests.created_at", "desc")
    .orderBy("maintenance_requests.id", "asc")
    .limit(limit)
    .offset((page - 1) * limit);

  return {
    requests,
    total: Number(count),
  };
};

const create = async (data, trx = db) => {
  const [request] = await trx("maintenance_requests")
    .insert(data)
    .returning("*");

  return request;
};

const update = async (id, data, trx = db) => {
  const [request] = await trx("maintenance_requests")
    .where({ id })
    .update({
      ...data,
      updated_at: trx.fn.now(),
    })
    .returning("*");

  return request;
};

const findContractor = async (contractorId, trx = db) => {
  return trx("users")
    .where({
      id: contractorId,
      role: "CONTRACTOR",
    })
    .first();
};

const findAssignment = async (
  requestId,
  contractorId,
  trx = db
) => {
  return trx("maintenance_assignments")
    .where({
      maintenance_request_id: requestId,
      contractor_id: contractorId,
    })
    .first();
};

const createAssignment = async (
  requestId,
  contractorId,
  trx = db
) => {
  const [assignment] = await trx(
    "maintenance_assignments"
  )
    .insert({
      maintenance_request_id: requestId,
      contractor_id: contractorId,
    })
    .returning("*");

  return assignment;
};

const deleteAssignment = async (
  requestId,
  contractorId,
  trx = db
) => {
  return trx("maintenance_assignments")
    .where({
      maintenance_request_id: requestId,
      contractor_id: contractorId,
    })
    .del();
};

const getAssignments = async (requestId, trx = db) => {
  return trx("maintenance_assignments")
    .where({
      maintenance_request_id: requestId,
    });
};

const createTimelineEvent = async (data, trx = db) => {
  const [event] = await trx("timeline_events")
    .insert(data)
    .returning("*");

  return event;
};

const getTimeline = async (requestId, trx = db) => {
  return trx("timeline_events")
    .where({
      maintenance_request_id: requestId,
    })
    .orderBy("created_at", "asc");
};

module.exports = {
  findById,
  findByIdWithDetails,
  findAll,
  create,
  update,
  findContractor,
  findAssignment,
  createAssignment,
  deleteAssignment,
  getAssignments,
  createTimelineEvent,
  getTimeline,
};
