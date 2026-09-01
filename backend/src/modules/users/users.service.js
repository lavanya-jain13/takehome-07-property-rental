const repository = require("./users.repository");

const listContractors = async () => {
  const contractors = await repository.findContractors();

  return contractors.map((contractor) => ({
    id: contractor.id,
    name: contractor.name,
    email: contractor.email,
  }));
};

module.exports = {
  listContractors,
};
