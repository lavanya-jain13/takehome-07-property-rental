exports.up = function (knex) {
  return knex.schema.createTable("timeline_events", (table) => {
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
      .uuid("performed_by")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("RESTRICT")
      .onUpdate("CASCADE");

    table.string("event_type", 40).notNullable();

    table.string("old_status", 20);

    table.string("new_status", 20);

    table.text("note");

    table
      .timestamp("created_at", { useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now());

    table.check(`
      event_type IN (
        'REQUEST_CREATED',
        'STATUS_CHANGED',
        'CONTRACTOR_ASSIGNED',
        'CONTRACTOR_UNASSIGNED',
        'NOTE_ADDED'
      )
    `);

    table.check(`
      old_status IS NULL OR
      old_status IN ('REPORTED', 'TRIAGED', 'SCHEDULED', 'RESOLVED')
    `);

    table.check(`
      new_status IS NULL OR
      new_status IN ('REPORTED', 'TRIAGED', 'SCHEDULED', 'RESOLVED')
    `);

    table.index(["maintenance_request_id"]);

    table.index(["performed_by"]);

    table.index(["created_at"]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("timeline_events");
};