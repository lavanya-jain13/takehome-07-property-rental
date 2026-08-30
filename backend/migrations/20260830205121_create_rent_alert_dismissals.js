exports.up = function (knex) {
  return knex.schema.createTable("rent_alert_dismissals", (table) => {
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
      .uuid("dismissed_by")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("RESTRICT")
      .onUpdate("CASCADE");

    table.date("rent_month").notNullable();

    table
      .timestamp("dismissed_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    table.unique(["unit_id", "rent_month"]);

    table.index(["unit_id"]);

    table.index(["dismissed_by"]);

    table.index(["rent_month"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("rent_alert_dismissals");
};