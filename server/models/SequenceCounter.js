// server/models/SequenceCounter.js
// Persistent Monotonic Sequence Counter for Indian Financial Year Numbering (Spec F4)
// Guarantees atomic, non-reusable sequential numbers per owner, prefix, and FY

const mongoose = require("mongoose");

const sequenceCounterSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    prefix: {
      type: String,
      required: true,
      enum: ["INV", "QT"],
      default: "INV",
    },
    fy: {
      type: String,
      required: true,
    },
    lastSeq: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce unique counter per owner, prefix, and FY
sequenceCounterSchema.index({ owner: 1, prefix: 1, fy: 1 }, { unique: true });

module.exports = mongoose.model("SequenceCounter", sequenceCounterSchema);
