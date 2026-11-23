// server/routes/quotationRoutes.js
// Protected Quotation CRUD and Quotation-to-Invoice Conversion Endpoint

const express = require("express");
const path = require("path");
const Quotation = require("../models/Quotation");
const Invoice = require("../models/Invoice");
const authMiddleware = require("../middleware/authMiddleware");
const InvoZapCalc = require(path.join(__dirname, "../../public/js/engine/calc.js"));

const router = express.Router();

// Apply authentication middleware to all quotation routes
router.use(authMiddleware);

// Helper function to recalculate financial totals deterministically
function calculateFinancials(items = [], taxRate = 18, sellerStateCode = "", buyerStateCode = "") {
  const safeTaxRate = Math.min(100, Math.max(0, parseFloat(taxRate) || 0));
  const result = InvoZapCalc.calculateFinancials({
    items: (items || []).map(item => ({
      description: String(item.description || "Item").slice(0, 200),
      quantity: item.quantity,
      price: item.price,
      hsnSac: String(item.hsnSac || "").slice(0, 20),
      unit: String(item.unit || "").slice(0, 30),
      taxRate: item.taxRate === undefined ? safeTaxRate : item.taxRate,
    })),
    taxMode: "gst",
    taxRatePercent: safeTaxRate,
    sellerStateCode,
    buyerStateCode,
  });
  return {
    items: result.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      price: item.unitPricePaise / 100,
      rowTotal: item.lineTotalPaise / 100,
      hsnSac: item.hsnSac,
      unit: item.unit,
      taxRate: item.taxRate,
    })),
    subtotal: result.totals.subtotalPaise / 100,
    taxRate: safeTaxRate,
    taxAmount: result.totals.taxPaise / 100,
    grandTotal: result.totals.grandTotalPaise / 100,
  };
}

// --- 1. POST /api/quotations (Create new quotation) ---
router.post("/", async (req, res) => {
  try {
    const {
      quotationNumber,
      quotationDate,
      validUntil,
      currency,
      status,
      themeColor,
      sellerDetails,
      clientDetails,
      items,
      taxRate,
      sellerStateCode,
      buyerStateCode,
      terms,
    } = req.body;

    if (!quotationNumber || !quotationNumber.trim()) {
      return res.status(400).json({ success: false, message: "Quotation number is required." });
    }

    if (!clientDetails || !clientDetails.clientName || !clientDetails.clientName.trim()) {
      return res.status(400).json({ success: false, message: "Client name is required." });
    }

    const financials = calculateFinancials(items, taxRate, sellerStateCode, buyerStateCode);

    // Check if quotation number already exists for this user
    const existing = await Quotation.findOne({ owner: req.user.id, quotationNumber: quotationNumber.trim() });
    if (existing) {
      if (existing.status === "Draft") {
        existing.quotationDate = quotationDate ? new Date(quotationDate) : existing.quotationDate;
        existing.validUntil = validUntil ? new Date(validUntil) : existing.validUntil;
        existing.currency = currency || existing.currency;
        existing.themeColor = themeColor || existing.themeColor;
        existing.sellerDetails = sellerDetails || existing.sellerDetails;
        existing.clientDetails = clientDetails;
        existing.items = financials.items;
        existing.subtotal = financials.subtotal;
        existing.taxRate = financials.taxRate;
        existing.taxAmount = financials.taxAmount;
        existing.grandTotal = financials.grandTotal;
        existing.terms = terms || existing.terms;
        await existing.save();
        return res.status(200).json({ success: true, quotation: existing, message: "Quotation draft updated successfully." });
      }

      return res.status(400).json({
        success: false,
        message: `Quotation number "${quotationNumber}" already exists in your account.`,
      });
    }

    const quotation = new Quotation({
      owner: req.user.id,
      quotationNumber: quotationNumber.trim(),
      quotationDate: quotationDate ? new Date(quotationDate) : new Date(),
      validUntil: validUntil ? new Date(validUntil) : null,
      currency: currency || "₹",
      status: status || "Draft",
      themeColor: themeColor || "navy",
      sellerDetails,
      clientDetails,
      items: financials.items,
      subtotal: financials.subtotal,
      taxRate: financials.taxRate,
      taxAmount: financials.taxAmount,
      grandTotal: financials.grandTotal,
      terms: terms || undefined,
    });

    await quotation.save();
    return res.status(201).json({ success: true, quotation });
  } catch (error) {
    console.error("Error creating quotation:", error);
    return res.status(500).json({ success: false, message: "Server error while saving quotation." });
  }
});

// --- 2. GET /api/quotations (List user quotations) ---
router.get("/", async (req, res) => {
  try {
    const quotations = await Quotation.find({ owner: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, quotations });
  } catch (error) {
    console.error("Error fetching quotations:", error);
    return res.status(500).json({ success: false, message: "Server error while fetching quotations." });
  }
});

// --- 3. GET /api/quotations/:id (Get single quotation by _id or quotationNumber) ---
router.get("/:id", async (req, res) => {
  try {
    const query = { owner: req.user.id };
    if (mongoose.isValidObjectId(req.params.id)) {
      query._id = req.params.id;
    } else {
      query.quotationNumber = req.params.id;
    }

    const quotation = await Quotation.findOne(query);
    if (!quotation) {
      return res.status(404).json({ success: false, message: "Quotation not found." });
    }
    return res.status(200).json({ success: true, quotation });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error while fetching quotation." });
  }
});

// --- 4. PUT /api/quotations/:id (Update quotation) ---
router.put("/:id", async (req, res) => {
  try {
    const query = { owner: req.user.id };
    if (mongoose.isValidObjectId(req.params.id)) {
      query._id = req.params.id;
    } else {
      query.quotationNumber = req.params.id;
    }

    const quotation = await Quotation.findOne(query);
    if (!quotation) {
      return res.status(404).json({ success: false, message: "Quotation not found." });
    }

    const {
      quotationNumber,
      quotationDate,
      validUntil,
      currency,
      status,
      themeColor,
      sellerDetails,
      clientDetails,
      items,
      taxRate,
      sellerStateCode,
      buyerStateCode,
      terms,
    } = req.body;

    const financials = calculateFinancials(items || quotation.items, taxRate ?? quotation.taxRate, sellerStateCode, buyerStateCode);

    if (quotationNumber) quotation.quotationNumber = quotationNumber.trim();
    if (quotationDate) quotation.quotationDate = new Date(quotationDate);
    if (validUntil) quotation.validUntil = new Date(validUntil);
    if (currency) quotation.currency = currency;
    if (status) quotation.status = status;
    if (themeColor) quotation.themeColor = themeColor;
    if (sellerDetails) quotation.sellerDetails = sellerDetails;
    if (clientDetails) quotation.clientDetails = clientDetails;
    if (terms !== undefined) quotation.terms = terms;

    quotation.items = financials.items;
    quotation.subtotal = financials.subtotal;
    quotation.taxRate = financials.taxRate;
    quotation.taxAmount = financials.taxAmount;
    quotation.grandTotal = financials.grandTotal;

    await quotation.save();
    return res.status(200).json({ success: true, quotation });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error while updating quotation." });
  }
});

// --- 5. POST /api/quotations/:id/convert (Convert Quotation to Invoice with Today's Date) ---
router.post("/:id/convert", async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ _id: req.params.id, owner: req.user.id });
    if (!quotation) {
      return res.status(404).json({ success: false, message: "Quotation not found." });
    }

    // Determine next sequential Invoice Number for this user
    const userInvoices = await Invoice.find({ owner: req.user.id }).select("invoiceNumber");
    let maxNum = 0;
    userInvoices.forEach((inv) => {
      const match = (inv.invoiceNumber || "").match(/INV-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextInvNumber = "INV-" + String(maxNum + 1).padStart(4, "0");

    // Today's date of conversion
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    // Create the new invoice record
    const invoice = new Invoice({
      owner: req.user.id,
      invoiceNumber: nextInvNumber,
      invoiceDate: today, // Record moved to invoice history with today's date
      dueDate: dueDate,
      currency: quotation.currency,
      status: "Unpaid",
      themeColor: quotation.themeColor,
      sellerDetails: quotation.sellerDetails,
      clientDetails: quotation.clientDetails,
      items: quotation.items,
      subtotal: quotation.subtotal,
      taxRate: quotation.taxRate,
      taxAmount: quotation.taxAmount,
      grandTotal: quotation.grandTotal,
    });

    await invoice.save();

    // Mark quotation as converted
    quotation.status = "Converted";
    quotation.convertedInvoiceNumber = nextInvNumber;
    quotation.convertedAt = today;
    await quotation.save();

    return res.status(201).json({
      success: true,
      message: `Quotation ${quotation.quotationNumber} successfully converted to Invoice ${nextInvNumber}`,
      invoice,
      quotation,
    });
  } catch (error) {
    console.error("Error converting quotation:", error);
    return res.status(500).json({ success: false, message: "Server error while converting quotation." });
  }
});

// --- 6. DELETE /api/quotations/:id (Delete quotation) ---
router.delete("/:id", async (req, res) => {
  try {
    const quotation = await Quotation.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!quotation) {
      return res.status(404).json({ success: false, message: "Quotation not found." });
    }
    return res.status(200).json({ success: true, message: "Quotation deleted successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error while deleting quotation." });
  }
});

module.exports = router;
