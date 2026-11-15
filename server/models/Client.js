// Reusable client profiles owned by a single InvoZap account.

const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    clientName: { type: String, required: true, trim: true, maxlength: 160 },
    normalizedName: { type: String, required: true, maxlength: 160 },
    address: { type: String, default: "", maxlength: 1000 },
    email: { type: String, default: "", trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, default: "", trim: true, maxlength: 40 },
    gstin: { type: String, default: "", trim: true, uppercase: true, maxlength: 15 },
    stateCode: { type: String, default: "", trim: true, maxlength: 2 },
  },
  { timestamps: true }
);

// A profile name identifies one client within an account, while allowing different users
// to maintain their own directories.
clientSchema.index({ owner: 1, normalizedName: 1 }, { unique: true });

module.exports = mongoose.model("Client", clientSchema);
