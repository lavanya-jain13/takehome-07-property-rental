const bcrypt = require("bcryptjs");

exports.seed = async function (knex) {
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const users = [
    {
      name: "Demo Manager",
      email: "manager@example.com",
      password_hash: passwordHash,
      role: "MANAGER",
    },
    {
      name: "Demo Contractor",
      email: "contractor@example.com",
      password_hash: passwordHash,
      role: "CONTRACTOR",
    },
    {
      name: "Priya Contractor",
      email: "priya.contractor@example.com",
      password_hash: passwordHash,
      role: "CONTRACTOR",
    },
    {
      name: "Rahul Contractor",
      email: "rahul.contractor@example.com",
      password_hash: passwordHash,
      role: "CONTRACTOR",
    },
  ];

  for (const user of users) {
    await knex("users")
      .insert(user)
      .onConflict("email")
      .ignore();
  }
};