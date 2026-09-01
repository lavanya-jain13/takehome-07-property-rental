const service = require("./users.service");

const listContractors = async (req, res, next) => {
  try {
    const contractors = await service.listContractors();

    res.json({
      data: contractors,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listContractors,
};
