// server/models/Quotation.js
// Quotation Model with embedded line items, client snapshot, and conversion tracking

const mongoose = require("mongoose");

// Sub-schema for quotation line items
const quotationItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, "Item description is required"],
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, "Quantity must be at least 1"],
    default: 1,
  },
  price: {
    type: Number,
    required: true,
    min: [0, "Price cannot be negative"],
    default: 0,
  },
  rowTotal: {
    type: Number,
    required: true,
    default: 0,
  },
  hsnSac: { type: String, default: "", trim: true, maxlength: 20 },
  unit: { type: String, default: "", trim: true, maxlength: 30 },
  taxRate: { type: Number, min: 0, max: 100, default: 18 },
});

// Main Quotation Schema
const quotationSchema = new mongoose.Schema(
  {
    // Owner reference (linking quotation to the User who created it)
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    quotationNumber: {
      type: String,
      required: [true, "Quotation number is required"],
      trim: true,
    },

    quotationDate: {
      type: Date,
      default: Date.now,
    },

    validUntil: {
      type: Date,
    },

    currency: {
      type: String,
      default: "₹",
    },

    status: {
      type: String,
      enum: ["Draft", "Sent", "Accepted", "Converted"],
      default: "Draft",
    },

    // Reference to converted invoice if conversion took place
    convertedInvoiceNumber: {
      type: String,
      default: null,
    },

    convertedAt: {
      type: Date,
      default: null,
    },

    themeColor: {
      type: String,
      enum: ["navy", "indigo", "burgundy"],
      default: "navy",
    },

    sellerDetails: {
      businessName: { type: String, default: "InvoZap Solutions" },
      tagline: { type: String, default: "Sourcing Quality, Delivering Reliability" },
      address: { type: String, default: "Pune, Maharashtra, India" },
      email: { type: String, default: "support@invozap.com" },
      phone: { type: String, default: "+91 91234 56789" },
    },

    clientDetails: {
      clientName: { type: String, required: [true, "Client name is required"], trim: true },
      address: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      gstin: { type: String, default: "" },
    },

    items: [quotationItemSchema],

    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },

    taxRate: {
      type: Number,
      default: 18,
    },

    taxAmount: {
      type: Number,
      required: true,
      default: 0,
    },

    grandTotal: {
      type: Number,
      required: true,
      default: 0,
    },

    terms: {
      type: String,
      default: "• This quotation is a formal price estimate valid until the date shown above.\n• Once accepted, this quotation can be converted directly into an active Invoice from the History page.\n• Payment terms and final scope to be executed according to mutually agreed milestones.",
    },
  },
  {
    timestamps: true,
  }
);

// Enforce unique quotation number per user
quotationSchema.index({ owner: 1, quotationNumber: 1 }, { unique: true });

module.exports = mongoose.model("Quotation", quotationSchema);
