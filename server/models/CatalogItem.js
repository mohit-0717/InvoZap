// Reusable product and service definitions owned by a single account.

const mongoose = require("mongoose");

const catalogItemSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    normalizedName: { type: String, required: true, maxlength: 200 },
    description: { type: String, default: "", trim: true, maxlength: 500 },
    unit: { type: String, default: "unit", trim: true, maxlength: 30 },
    defaultPrice: { type: Number, required: true, min: 0, default: 0 },
    defaultTaxRate: { type: Number, min: 0, max: 100, default: 18 },
    hsnSac: { type: String, default: "", trim: true, maxlength: 20 },
  },
  { timestamps: true }
);

catalogItemSchema.index({ owner: 1, normalizedName: 1 }, { unique: true });

module.exports = mongoose.model("CatalogItem", catalogItemSchema);
