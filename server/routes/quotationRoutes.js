// server/routes/quotationRoutes.js
// Protected Quotation CRUD and Quotation-to-Invoice Conversion Endpoint

const express = require("express");
const Quotation = require("../models/Quotation");
const Invoice = require("../models/Invoice");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Apply authentication middleware to all quotation routes
router.use(authMiddleware);

// Helper function to recalculate financial totals deterministically
function calculateFinancials(items = [], taxRate = 18) {
  let subtotal = 0;

  const sanitizedItems = items.map((item) => {
    const qty = Math.max(1, parseFloat(item.quantity) || 1);
    const price = Math.max(0, parseFloat(item.price) || 0);
    const rowTotal = Math.round(qty * price * 100) / 100;
    subtotal += rowTotal;

    return {
      description: (item.description || "Item").trim(),
      quantity: qty,
      price: price,
      rowTotal: rowTotal,
    };
  });

  subtotal = Math.round(subtotal * 100) / 100;
  const safeTaxRate = Math.max(0, parseFloat(taxRate) || 0);
  const taxAmount = Math.round(((subtotal * safeTaxRate) / 100) * 100) / 100;
  const grandTotal = Math.round((subtotal + taxAmount) * 100) / 100;

  return {
    items: sanitizedItems,
    subtotal,
    taxRate: safeTaxRate,
    taxAmount,
    grandTotal,
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
      terms,
    } = req.body;

    if (!quotationNumber || !quotationNumber.trim()) {
      return res.status(400).json({ success: false, message: "Quotation number is required." });
    }

    if (!clientDetails || !clientDetails.clientName || !clientDetails.clientName.trim()) {
      return res.status(400).json({ success: false, message: "Client name is required." });
    }

    // Check if quotation number already exists for this user
    const existing = await Quotation.findOne({ owner: req.user.id, quotationNumber: quotationNumber.trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Quotation number "${quotationNumber}" already exists in your account.`,
      });
    }

    const financials = calculateFinancials(items, taxRate);

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

// --- 3. GET /api/quotations/:id (Get single quotation) ---
router.get("/:id", async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ _id: req.params.id, owner: req.user.id });
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
    const quotation = await Quotation.findOne({ _id: req.params.id, owner: req.user.id });
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
      terms,
    } = req.body;

    const financials = calculateFinancials(items || quotation.items, taxRate ?? quotation.taxRate);

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
