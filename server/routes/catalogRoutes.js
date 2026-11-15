// Authenticated product and service catalog.

const express = require("express");
const mongoose = require("mongoose");
const CatalogItem = require("../models/CatalogItem");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

function normalizeName(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function itemFrom(body) {
  const name = String(body.name || "").trim().replace(/\s+/g, " ");
  return {
    name,
    normalizedName: normalizeName(name),
    description: String(body.description || "").trim().slice(0, 500),
    unit: String(body.unit || "unit").trim().slice(0, 30) || "unit",
    defaultPrice: Math.max(0, Number(body.defaultPrice) || 0),
    defaultTaxRate: body.defaultTaxRate === undefined
      ? 18
      : Math.min(100, Math.max(0, Number(body.defaultTaxRate) || 0)),
    hsnSac: String(body.hsnSac || "").trim().toUpperCase().slice(0, 20),
  };
}

router.get("/", async (req, res) => {
  try {
    const items = await CatalogItem.find({ owner: req.user.id }).sort({ name: 1 }).select("-__v");
    return res.status(200).json({ success: true, items });
  } catch (error) {
    console.error("List Catalog Error:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve catalog items." });
  }
});

router.post("/", async (req, res) => {
  try {
    const item = itemFrom(req.body);
    if (!item.name) return res.status(400).json({ success: false, message: "Item name is required." });
    const savedItem = await CatalogItem.findOneAndUpdate(
      { owner: req.user.id, normalizedName: item.normalizedName },
      { $set: item, $setOnInsert: { owner: req.user.id } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).select("-__v");
    return res.status(200).json({ success: true, item: savedItem });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to save catalog item." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid catalog item ID format." });
    }
    const item = await CatalogItem.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!item) return res.status(404).json({ success: false, message: "Catalog item not found." });
    return res.status(200).json({ success: true, message: "Catalog item deleted." });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete catalog item." });
  }
});

module.exports = router;
