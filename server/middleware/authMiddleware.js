// server/middleware/authMiddleware.js
// Verifies JSON Web Token (JWT) on protected routes

const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  // Fail fast at startup if JWT secret is missing or insecurely short (< 32 chars)
  throw new Error("FATAL: JWT_SECRET environment variable is missing or shorter than 32 characters.");
}

function authMiddleware(req, res, next) {
  try {
    let token = null;

    // 1. Check Bearer Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      // 2. Fallback to HttpOnly cookie
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No authentication token provided.",
      });
    }

    // Verify token validity with pinned HS256 algorithm
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });

    // Attach user payload (id, email) to request object
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please sign in again.",
    });
  }
}

module.exports = authMiddleware;
