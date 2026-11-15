// Immutable credit and debit notes linked to issued invoices.

const mongoose = require("mongoose");

const adjustmentNoteSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", required: true, index: true },
    noteNumber: { type: String, required: true, trim: true },
    type: { type: String, enum: ["credit", "debit"], required: true },
    amountPaise: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true, min: 0.01 },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

adjustmentNoteSchema.index({ owner: 1, noteNumber: 1 }, { unique: true });

module.exports = mongoose.model("AdjustmentNote", adjustmentNoteSchema);
