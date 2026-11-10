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

// Fail fast at startup if critical security environment variables are missing
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error("FATAL: JWT_SECRET environment variable is missing or shorter than 32 characters.");
  process.exit(1);
}

const express = require("express");
const connectDB = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy (e.g. Render, Railway, Nginx)
app.set("trust proxy", 1);

// Optional CORS: Express serves the frontend from /public on the same origin.
// If an external CLIENT_URL is specified (e.g. separate dev port), only whitelist that exact origin.
if (process.env.CLIENT_URL) {
  const cors = require("cors");
  app.use(
    cors({
      origin: process.env.CLIENT_URL,
      credentials: true,
    })
  );
}

// Request body size limit to prevent Denial of Service / payload memory exhaustion
app.use(express.json({ limit: "50kb" }));

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

// --- API ROUTES ---
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/invoices", require("./routes/invoiceRoutes"));
app.use("/api/quotations", require("./routes/quotationRoutes"));
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
