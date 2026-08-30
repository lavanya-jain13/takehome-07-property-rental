exports.up = function (knex) {
  return knex.schema.createTable("rent_payments", (table) => {
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
      .uuid("recorded_by")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("RESTRICT")
      .onUpdate("CASCADE");

    table.date("payment_month").notNullable();

    table.decimal("amount", 12, 2).notNullable();

    table
      .timestamp("recorded_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    table.check("amount >= 0");

    table.unique(["unit_id", "payment_month"]);

    table.index(["unit_id"]);

    table.index(["recorded_by"]);

    table.index(["payment_month"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("rent_payments");
};