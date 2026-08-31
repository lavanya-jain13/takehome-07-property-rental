const dashboardService = require("./dashboard.service");

const getDashboard = async (req, res) => {
  try {
    const dashboard = await dashboardService.getDashboard();

    return res.status(200).json({
      data: dashboard,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong.",
      },
    });
  }
};

module.exports = {
  getDashboard,
};