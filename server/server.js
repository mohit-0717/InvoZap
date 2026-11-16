// server/server.js
// Main Entry Point for InvoZap Backend Server

const path = require("path");
const dotenv = require("dotenv");

// Load environment variables before any module reads them
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Optional custom DNS (only enabled if explicitly requested in environment)
if (process.env.CUSTOM_DNS === "true") {
  const dns = require("dns");
  try {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
  } catch (e) {}
}

// Ensure JWT secret is present with safe fallback for serverless environments
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
    console.error("FATAL: JWT_SECRET environment variable is missing or shorter than 32 characters.");
    process.exit(1);
  } else {
    JWT_SECRET = process.env.JWT_SECRET || "invozap_super_secure_enterprise_jwt_signing_secret_key_2026_x89";
    process.env.JWT_SECRET = JWT_SECRET;
  }
}

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const connectDB = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy (e.g. Vercel, Render, Railway, Nginx)
app.set("trust proxy", 1);

// Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Dedicated CSP headers managed per page
    crossOriginEmbedderPolicy: false,
  })
);

// Enable CORS for API routes across preview & production domains
app.use(cors({ origin: true, credentials: true }));

// Request body size limit to prevent Denial of Service / payload memory exhaustion
app.use(express.json({ limit: "50kb" }));

// Rate Limiting: Authentication Endpoints (prevents brute-force / account enumeration)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts from this IP. Please try again after 15 minutes.",
  },
});

// Rate Limiting: Public Share View Endpoint (prevents automated scraping)
const publicShareLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120, // 120 views per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Rate limit exceeded for public invoice views. Please try again later.",
  },
});

// Security Hardening: Serve ONLY the dedicated /public folder.
// Deny dotfiles and completely isolate server/, node_modules/, package.json, and .env.
app.use(
  express.static(path.join(__dirname, "..", "public"), {
    dotfiles: "deny",
    setHeaders: (res, filePath) => {
      // Set privacy and security headers on all static client assets
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Referrer-Policy", "no-referrer");
      if (filePath.endsWith("shared.html")) {
        res.setHeader("X-Robots-Tag", "noindex, nofollow");
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
      }
    },
  })
);

// Ensure MongoDB connection for serverless execution
app.use(async (req, res, next) => {
  if (req.path.startsWith("/api") && req.path !== "/api/auth/config" && req.path !== "/api/health") {
    const mongoose = require("mongoose");
    if (mongoose.connection && mongoose.connection.readyState === 0 && process.env.MONGODB_URI) {
      try {
        await connectDB();
      } catch (err) {
        console.error("Serverless DB connection error:", err.message);
      }
    }
  }
  next();
});

// --- API ROUTES ---
app.use("/api/auth", authLimiter, require("./routes/authRoutes"));
app.use("/api/clients", require("./routes/clientRoutes"));
app.use("/api/catalog", require("./routes/catalogRoutes"));
app.use("/api/invoices", require("./routes/invoiceRoutes"));
app.use("/api/quotations", require("./routes/quotationRoutes"));
app.use("/api/share/view", publicShareLimiter);
app.use("/api/share", require("./routes/shareRoutes"));

// Basic Health Check Endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "online",
    message: "InvoZap Studio Backend is running smoothly!",
    timestamp: new Date().toISOString(),
  });
});

// Centralized Unhandled Error Handler (Never leak stack traces or internal errors)
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err);
  res.status(500).json({
    success: false,
    message: "An internal server error occurred. Please try again later.",
  });
});

// Start Server after Database Connection is Established
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 InvoZap Server is actively listening on http://localhost:${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error("Failed to connect to database. Server aborting:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
