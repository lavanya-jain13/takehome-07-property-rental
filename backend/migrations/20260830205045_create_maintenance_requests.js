exports.up = function (knex) {
  return knex.schema.createTable("maintenance_requests", (table) => {
    table
      .uuid("id")
      .primary()
      .defaultTo(knex.raw("gen_random_uuid()"));

    table
      .uuid("unit_id")
      .notNullable()
      .references("id")
      .inTable("units")
      .onDelete("RESTRICT")
      .onUpdate("CASCADE");

    table
      .uuid("created_by")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("RESTRICT")
      .onUpdate("CASCADE");

    table.string("title", 200).notNullable();

    table.text("description").notNullable();

    table.string("priority", 20).notNullable();

    table.string("status", 20).notNullable();

    table
      .timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    table
      .timestamp("updated_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    table.check(`priority IN ('LOW', 'MEDIUM', 'HIGH')`);

    table.check(
      `status IN ('REPORTED', 'TRIAGED', 'SCHEDULED', 'RESOLVED')`
    );

    table.index(["unit_id"]);

    table.index(["created_by"]);

    table.index(["status"]);

    table.index(["priority"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("maintenance_requests");
};