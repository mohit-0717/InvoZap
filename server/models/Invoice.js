// server/models/Invoice.js
// Invoice Model with embedded line items, client/seller snapshots, and calculated totals

const mongoose = require("mongoose");

// Sub-schema for individual line items (allows fractional units like 1.5 hours)
const invoiceItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, "Item description is required"],
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [0.001, "Quantity must be greater than 0"],
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
});

// Sub-schema for recorded payments and TDS credits (Spec F12)
const paymentEntrySchema = new mongoose.Schema({
  paymentId: { type: String, required: true },
  idempotencyKey: { type: String, default: null },
  amountPaise: { type: Number, required: true },
  amount: { type: Number, required: true },
  kind: { type: String, enum: ["received", "tds_credit"], default: "received" },
  method: { type: String, enum: ["upi", "bank", "cash", "cheque", "other"], default: "upi" },
  reference: { type: String, default: "" },
  receivedOn: { type: String, default: () => new Date().toISOString().slice(0, 10) },
  recordedAt: { type: Date, default: Date.now },
  voidedAt: { type: Date, default: null },
});

// Main Invoice Schema
const invoiceSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    invoiceNumber: {
      type: String,
      required: [true, "Invoice number is required"],
      trim: true,
    },

    invoiceDate: {
      type: Date,
      default: Date.now,
    },

    dueDate: {
      type: Date,
    },

    currency: {
      type: String,
      default: "₹",
    },

    status: {
      type: String,
      enum: ["Draft", "Unpaid", "Paid", "Overdue", "Void", "Partial"],
      default: "Draft",
    },

    themeColor: {
      type: String,
      enum: ["navy", "indigo", "burgundy"],
      default: "navy",
    },

    // Snapshot of seller details (empty defaults - never invent placeholder business info)
    sellerDetails: {
      businessName: { type: String, default: "" },
      tagline: { type: String, default: "" },
      address: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      upiId: { type: String, default: "" },
      gstin: { type: String, default: "" },
      stateCode: { type: String, default: "" },
    },

    // Snapshot of client details
    clientDetails: {
      clientName: { type: String, required: [true, "Client name is required"], trim: true },
      address: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      gstin: { type: String, default: "" },
      stateCode: { type: String, default: "" },
    },

    items: [invoiceItemSchema],

    // Tax regime: 'intra' (CGST+SGST), 'inter' (IGST), or 'none' (0% / non-GST)
    regime: {
      type: String,
      enum: ["intra", "inter", "none"],
      default: "none",
    },

    // Integer paise fields (Single Source of Truth for exact financial arithmetic)
    subtotalPaise: {
      type: Number,
      required: true,
      default: 0,
    },

    cgstPaise: {
      type: Number,
      default: 0,
    },

    sgstPaise: {
      type: Number,
      default: 0,
    },

    igstPaise: {
      type: Number,
      default: 0,
    },

    taxPaise: {
      type: Number,
      default: 0,
    },

    grandTotalPaise: {
      type: Number,
      required: true,
      default: 0,
    },

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

    // Settlement Ledger (Spec F12)
    payments: [paymentEntrySchema],

    balanceDuePaise: {
      type: Number,
      default: 0,
    },

    balanceDue: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

// Enforce unique invoice number per user
invoiceSchema.index({ owner: 1, invoiceNumber: 1 }, { unique: true });

module.exports = mongoose.model("Invoice", invoiceSchema);
