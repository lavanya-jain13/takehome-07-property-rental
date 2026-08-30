const db = require("../../config/database");

const findAll = async ({ status, page, limit }) => {
  const query = db("units").select("*");

  if (status) {
    query.where("status", status);
  }

  const countQuery = query.clone().clearSelect().clearOrder().count("* as count");

  const [{ count }] = await countQuery;

  const units = await query
    .orderBy("created_at", "desc")
    .limit(limit)
    .offset((page - 1) * limit);

  return {
    units,
    total: Number(count),
  };
};

const findById = async (id) => {
  return db("units")
    .where({ id })
    .first();
};

const create = async (data) => {
  const [unit] = await db("units")
    .insert(data)
    .returning("*");

  return unit;
};

const update = async (id, data) => {
  const [unit] = await db("units")
    .where({ id })
    .update({
      ...data,
      updated_at: db.fn.now(),
    })
    .returning("*");

  return unit;
};

module.exports = {
  findAll,
  findById,
  create,
  update,
};