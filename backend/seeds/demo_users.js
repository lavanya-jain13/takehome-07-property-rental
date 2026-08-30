const bcrypt = require("bcryptjs");

exports.seed = async function (knex) {
  const passwordHash = await bcrypt.hash("Password123!", 10);

  await knex("users").del();

  await knex("users").insert([
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
  ]);
};