exports.seed = async function (knex) {
  await knex.transaction(async (trx) => {
    const manager = await trx("users")
      .where({ email: "manager@example.com" })
      .first();

    const contractors = await trx("users")
  .whereIn("email", [
    "contractor@example.com",
    "priya.contractor@example.com",
    "rahul.contractor@example.com",
  ])
  .select("*");

if (!manager || contractors.length < 3) {
  throw new Error(
    "Demo users not found. Run the demo_users seed first."
  );
}

const contractor = contractors.find(
  (user) => user.email === "contractor@example.com"
);

const priya = contractors.find(
  (user) => user.email === "priya.contractor@example.com"
);

const rahul = contractors.find(
  (user) => user.email === "rahul.contractor@example.com"
);

    const units = [
      {
        unit_number: "DEMO-101",
        address: "101 Palm Residency, Delhi",
        tenant_name: "Aarav Sharma",
        monthly_rent: 25000,
        status: "ACTIVE",
      },
      {
        unit_number: "DEMO-102",
        address: "202 Palm Residency, Delhi",
        tenant_name: "Isha Mehta",
        monthly_rent: 30000,
        status: "ACTIVE",
      },
      {
        unit_number: "DEMO-103",
        address: "12 Green Heights, Noida",
        tenant_name: "Rohan Verma",
        monthly_rent: 22000,
        status: "ACTIVE",
      },
      {
        unit_number: "DEMO-104",
        address: "405 Green Heights, Noida",
        tenant_name: "Ananya Gupta",
        monthly_rent: 28000,
        status: "ACTIVE",
      },
      {
        unit_number: "DEMO-105",
        address: "7 Lake View Apartments, Gurgaon",
        tenant_name: "Kabir Singh",
        monthly_rent: 35000,
        status: "ACTIVE",
      },
    ];

    const unitIds = {};

    for (const unit of units) {
      let existing = await trx("units")
        .where({ unit_number: unit.unit_number })
        .first();

      if (!existing) {
        [existing] = await trx("units")
          .insert(unit)
          .returning("*");
      }

      unitIds[unit.unit_number] = existing.id;
    }

    const requests = [
      {
        unit: "DEMO-101",
        title: "AC not cooling",
        description:
          "The bedroom AC is running but is not cooling the room properly.",
        priority: "HIGH",
        status: "SCHEDULED",
      },
      {
        unit: "DEMO-102",
        title: "Kitchen sink leakage",
        description:
          "Water is leaking from the kitchen sink pipe and needs inspection.",
        priority: "MEDIUM",
        status: "TRIAGED",
      },
      {
        unit: "DEMO-103",
        title: "Bedroom light replacement",
        description:
          "The main bedroom light is flickering and needs replacement.",
        priority: "LOW",
        status: "RESOLVED",
      },
      {
        unit: "DEMO-104",
        title: "Water heater issue",
        description:
          "The water heater is taking unusually long to heat water.",
        priority: "HIGH",
        status: "REPORTED",
      },
      {
        unit: "DEMO-105",
        title: "Bathroom exhaust fan",
        description:
          "Bathroom exhaust fan is making a loud noise while operating.",
        priority: "MEDIUM",
        status: "RESOLVED",
      },
    ];

    for (const request of requests) {
      const existing = await trx("maintenance_requests")
        .where({
          title: request.title,
          unit_id: unitIds[request.unit],
        })
        .first();

      if (existing) {
        continue;
      }

      const [created] = await trx("maintenance_requests")
        .insert({
          unit_id: unitIds[request.unit],
          created_by: manager.id,
          title: request.title,
          description: request.description,
          priority: request.priority,
          status: request.status,
        })
        .returning("*");

      await trx("timeline_events").insert({
        maintenance_request_id: created.id,
        performed_by: manager.id,
        event_type: "REQUEST_CREATED",
        new_status: "REPORTED",
        note: "Demo maintenance request created.",
      });

      if (request.status !== "REPORTED") {
        await trx("timeline_events").insert({
          maintenance_request_id: created.id,
          performed_by: manager.id,
          event_type: "STATUS_CHANGED",
          old_status: "REPORTED",
          new_status: "TRIAGED",
          note: "Request triaged for review.",
        });
      }

      const assignmentPlan = {
  "DEMO-101": [contractor, priya],
  "DEMO-102": [rahul],
  "DEMO-103": [priya],
  "DEMO-105": [priya, rahul],
};

if (
  request.status === "SCHEDULED" ||
  request.status === "RESOLVED"
) {
  const assignedContractors =
    assignmentPlan[request.unit] || [];

  for (const assignedContractor of assignedContractors) {
    await trx("maintenance_assignments")
      .insert({
        maintenance_request_id: created.id,
        contractor_id: assignedContractor.id,
      })
      .onConflict([
        "maintenance_request_id",
        "contractor_id",
      ])
      .ignore();

    await trx("timeline_events").insert({
      maintenance_request_id: created.id,
      performed_by: manager.id,
      event_type: "CONTRACTOR_ASSIGNED",
      note: `Demo contractor ${assignedContractor.name} assigned to maintenance request.`,
    });
  }

  await trx("timeline_events").insert({
    maintenance_request_id: created.id,
    performed_by: manager.id,
    event_type: "STATUS_CHANGED",
    old_status: "TRIAGED",
    new_status: "SCHEDULED",
    note: "Request scheduled after contractor assignment.",
  });
}

      if (request.status === "RESOLVED") {
        await trx("timeline_events").insert({
          maintenance_request_id: created.id,
          performed_by: manager.id,
          event_type: "STATUS_CHANGED",
          old_status: "SCHEDULED",
          new_status: "RESOLVED",
          note: "Maintenance work completed.",
        });

        await trx("timeline_events").insert({
          maintenance_request_id: created.id,
          performed_by: manager.id,
          event_type: "NOTE_ADDED",
          note: "Demo request completed successfully.",
        });
      }
    }

    const paymentMonth = "2026-09-01";

    const payments = [
      {
        unit: "DEMO-101",
        amount: 25000,
      },
      {
        unit: "DEMO-102",
        amount: 15000,
      },
      {
        unit: "DEMO-103",
        amount: 24000,
      },
      {
        unit: "DEMO-105",
        amount: 35000,
      },
    ];

    for (const payment of payments) {
      const existing = await trx("rent_payments")
        .where({
          unit_id: unitIds[payment.unit],
          payment_month: paymentMonth,
        })
        .first();

      if (!existing) {
        await trx("rent_payments").insert({
          unit_id: unitIds[payment.unit],
          recorded_by: manager.id,
          payment_month: paymentMonth,
          amount: payment.amount,
        });
      }
    }
  });
};