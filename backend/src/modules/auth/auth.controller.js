const authService = require("./auth.service");
const db = require("../../config/database");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Email and password are required.",
        },
      });
    }

    const result = await authService.login(email, password);

    res.cookie("token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      user: result.user,
    });
  } catch (error) {
    if (error.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password.",
        },
      });
    }

    console.error(error);

    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong.",
      },
    });
  }
};

const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  return res.status(204).send();
};

const me = async (req, res) => {
  const user = await db("users")
    .select("id", "name", "email", "role")
    .where({ id: req.user.id })
    .first();

  if (!user) {
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "User no longer exists.",
      },
    });
  }

  return res.status(200).json({
    user,
  });
};

module.exports = {
  login,
  logout,
  me,
};