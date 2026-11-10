// server/models/ShareLink.js
// ShareLink Model for secure public invoice sharing

const mongoose = require("mongoose");

const shareLinkSchema = new mongoose.Schema(
  {
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Secure SHA-256 hash of the generated raw token (single unique index)
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },

    isRevoked: {
      type: Boolean,
      default: false,
    },

    // Timestamp when link was first viewed by client
    firstViewedAt: {
      type: Date,
      default: null,
    },

    // Default 30-day link expiration
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce single active (unrevoked) share link per invoice via partial unique index
shareLinkSchema.index(
  { invoice: 1 },
  { unique: true, partialFilterExpression: { isRevoked: false } }
);

module.exports = mongoose.model("ShareLink", shareLinkSchema);
