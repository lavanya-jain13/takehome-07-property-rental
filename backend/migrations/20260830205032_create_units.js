exports.up = function (knex) {
  return knex.schema.createTable("units", (table) => {
    table
      .uuid("id")
      .primary()
      .defaultTo(knex.raw("gen_random_uuid()"));

    table.string("unit_number", 50).notNullable().unique();

    table.text("address").notNullable();

    table.string("tenant_name", 150).notNullable();

    table.decimal("monthly_rent", 12, 2).notNullable();

    table.string("status", 20).notNullable();

    table
      .timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    table
      .timestamp("updated_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    table.check("monthly_rent > 0");

    table.check(`status IN ('ACTIVE', 'ARCHIVED')`);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("units");
};