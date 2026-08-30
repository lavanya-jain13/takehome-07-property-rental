exports.up = function (knex) {
  return knex.schema.createTable("users", (table) => {
    table
      .uuid("id")
      .primary()
      .defaultTo(knex.raw("gen_random_uuid()"));

    table.string("name", 100).notNullable();

    table.string("email", 255).notNullable().unique();

    table.string("password_hash", 255).notNullable();

    table.string("role", 20).notNullable();

    table
      .timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    table
      .timestamp("updated_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    table.check(`role IN ('MANAGER', 'CONTRACTOR')`);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("users");
};