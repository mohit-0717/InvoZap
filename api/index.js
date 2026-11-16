// api/index.js
// Vercel Serverless Function entry point for InvoZap Express API

const mongoose = require("mongoose");
const connectDB = require("../server/db");
const app = require("../server/server");

module.exports = async (req, res) => {
  // Connect to MongoDB Atlas if not already connected
  if (mongoose.connection && mongoose.connection.readyState === 0 && process.env.MONGODB_URI) {
    try {
      await connectDB();
    } catch (err) {
      console.error("Serverless MongoDB connection error:", err.message);
    }
  }

  // Forward request to Express app
  return app(req, res);
};
