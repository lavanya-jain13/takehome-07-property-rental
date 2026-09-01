const db = require("../../config/database");

const findContractors = async () => {
  return db("users")
    .select("id", "name", "email")
    .where("role", "CONTRACTOR")
    .orderBy("name", "asc");
};

module.exports = {
  findContractors,
};
