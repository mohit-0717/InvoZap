// server/db.js
// MongoDB connection helper using Mongoose

const mongoose = require("mongoose");
const dns = require("dns");

// Indian ISPs (Jio, Airtel, local broadband) frequently refuse SRV queries on port 53.
// Default to Google Public DNS for SRV resolution unless explicitly disabled (CUSTOM_DNS=false).
if (process.env.CUSTOM_DNS !== "false") {
  try {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
  } catch (e) {
    // Non-fatal if setServers is not permitted in the host environment
  }
}

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri || mongoUri.includes("<username>")) {
    throw new Error("MONGODB_URI not configured or contains placeholder in environment variables.");
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("✅ Successfully connected to MongoDB Atlas!");
    return true;
  } catch (error) {
    console.error("❌ MongoDB Atlas connection error:", error.message);
    throw error; // Re-throw to fail fast at startup
  }
}

module.exports = connectDB;
