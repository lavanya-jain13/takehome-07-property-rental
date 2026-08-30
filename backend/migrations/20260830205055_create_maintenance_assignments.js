exports.up = function (knex) {
  return knex.schema.createTable("maintenance_assignments", (table) => {
    table
      .uuid("id")
      .primary()
      .defaultTo(knex.raw("gen_random_uuid()"));

    table
      .uuid("maintenance_request_id")
      .notNullable()
      .references("id")
      .inTable("maintenance_requests")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");

    table
      .uuid("contractor_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("RESTRICT")
      .onUpdate("CASCADE");

    table
      .timestamp("assigned_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    table.unique(["maintenance_request_id", "contractor_id"]);

    table.index(["maintenance_request_id"]);

    table.index(["contractor_id"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("maintenance_assignments");
};