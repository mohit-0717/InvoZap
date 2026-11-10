// server/routes/invoiceRoutes.js
// Protected Invoice CRUD APIs with server-side financial calculations & ownership verification

const express = require("express");
const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Invoice = require("../models/Invoice");
const ShareLink = require("../models/ShareLink");
const SequenceCounter = require("../models/SequenceCounter");
const authMiddleware = require("../middleware/authMiddleware");

// Import single source of truth pure engines
const InvoZapCalc = require(path.join(__dirname, "../../public/js/engine/calc.js"));
const InvoZapChecker = require(path.join(__dirname, "../../public/js/engine/checker.js"));
const InvoZapNumbering = require(path.join(__dirname, "../../public/js/engine/numbering.js"));

const router = express.Router();

// Apply authentication middleware to all invoice routes
router.use(authMiddleware);

/**
 * Resolves 2-digit Indian GST State Code from either explicit stateCode
 * or derived from the 15-character GSTIN. Never silently invents default states.
 */
function resolveStateCode(details) {
  if (!details) return null;
  if (details.stateCode && typeof details.stateCode === "string" && details.stateCode.trim()) {
    const code = details.stateCode.trim();
    if (/^[0-9]{2}$/.test(code)) return code;
  }
  if (details.gstin && typeof details.gstin === "string") {
    const fromGstin = InvoZapCalc.extractStateCodeFromGstin(details.gstin);
    if (fromGstin) return fromGstin;
  }
  return null;
}

/**
 * Recalculate financial totals deterministically using integer paise engine.
 */
function calculateFinancials(items = [], taxRate = 18, sellerState = null, buyerState = null) {
  const safeTaxRate = Math.max(0, parseFloat(taxRate ?? 18) || 0);

  const result = InvoZapCalc.calculateFinancials({
    items: items || [],
    taxMode: safeTaxRate > 0 ? "gst" : "none",
    taxRatePercent: safeTaxRate,
    sellerStateCode: sellerState || "",
    buyerStateCode: buyerState || "",
  });

  return {
    items: (result.items || []).map((i) => ({
      description: i.description,
      quantity: i.quantity,
      price: i.unitPricePaise / 100,
      rowTotal: i.lineTotalPaise / 100,
    })),
    subtotal: result.totals.subtotalPaise / 100,
    taxRate: safeTaxRate,
    taxAmount: (result.totals.cgstPaise + result.totals.sgstPaise + result.totals.igstPaise) / 100,
    grandTotal: result.totals.grandTotalPaise / 100,
    subtotalPaise: result.totals.subtotalPaise,
    cgstPaise: result.totals.cgstPaise,
    sgstPaise: result.totals.sgstPaise,
    igstPaise: result.totals.igstPaise,
    taxPaise: result.totals.cgstPaise + result.totals.sgstPaise + result.totals.igstPaise,
    grandTotalPaise: result.totals.grandTotalPaise,
    regime: result.regime,
  };
}

// --- 1. POST /api/invoices (Create new invoice - Always Draft) ---
router.post("/", async (req, res) => {
  try {
    const {
      invoiceNumber,
      invoiceDate,
      dueDate,
      currency,
      themeColor,
      sellerDetails,
      clientDetails,
      items,
      taxRate,
    } = req.body;

    if (!invoiceNumber || !clientDetails || !clientDetails.clientName) {
      return res.status(400).json({
        success: false,
        message: "Invoice number and client name are required.",
      });
    }

    // Check for duplicate invoice number for this specific owner
    const existing = await Invoice.findOne({
      owner: req.user.id,
      invoiceNumber: invoiceNumber.trim(),
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Invoice number "${invoiceNumber}" already exists in your account.`,
      });
    }

    // Resolve state codes from explicit fields or GSTINs
    const sellerState = resolveStateCode(sellerDetails);
    const buyerState = resolveStateCode(clientDetails);

    // Recalculate financial totals on server
    const financials = calculateFinancials(items, taxRate ?? 18, sellerState, buyerState);

    const newInvoice = await Invoice.create({
      owner: req.user.id,
      invoiceNumber: invoiceNumber.trim(),
      invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : null,
      currency: currency || "₹",
      status: "Draft", // Always initializes as Draft.
      themeColor: themeColor || "navy",
      sellerDetails: {
        ...(sellerDetails || {}),
        stateCode: sellerState || (sellerDetails && sellerDetails.stateCode) || "",
      },
      clientDetails: {
        clientName: clientDetails.clientName.trim(),
        address: clientDetails.address || "",
        email: clientDetails.email || "",
        phone: clientDetails.phone || "",
        gstin: clientDetails.gstin || "",
        stateCode: buyerState || (clientDetails && clientDetails.stateCode) || "",
      },
      items: financials.items,
      regime: financials.regime,
      subtotalPaise: financials.subtotalPaise,
      cgstPaise: financials.cgstPaise,
      sgstPaise: financials.sgstPaise,
      igstPaise: financials.igstPaise,
      taxPaise: financials.taxPaise,
      grandTotalPaise: financials.grandTotalPaise,
      balanceDuePaise: financials.grandTotalPaise,
      subtotal: financials.subtotal,
      taxRate: financials.taxRate,
      taxAmount: financials.taxAmount,
      grandTotal: financials.grandTotal,
      balanceDue: financials.grandTotal,
      payments: [],
    });

    return res.status(201).json({
      success: true,
      message: "Invoice created successfully as Draft!",
      invoice: newInvoice,
    });
  } catch (error) {
    console.error("Create Invoice Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create invoice.",
    });
  }
});

// --- 2. GET /api/invoices (List owned invoices with search & filter) ---
router.get("/", async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = { owner: req.user.id };

    if (typeof status === "string" && status !== "All") {
      query.status = status;
    }

    if (typeof search === "string" && search.trim()) {
      const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { invoiceNumber: { $regex: safeSearch, $options: "i" } },
        { "clientDetails.clientName": { $regex: safeSearch, $options: "i" } },
      ];
    }

    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .select("-__v");

    return res.status(200).json({
      success: true,
      count: invoices.length,
      invoices,
    });
  } catch (error) {
    console.error("List Invoices Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve invoices.",
    });
  }
});

// --- 3. GET /api/invoices/:id (Get single invoice) ---
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid invoice ID format." });
    }

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      owner: req.user.id,
    }).select("-__v");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found or access denied.",
      });
    }

    return res.status(200).json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error("Get Invoice Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving invoice.",
    });
  }
});

// --- 4. PUT /api/invoices/:id (Update owned invoice - DRAFTS ONLY) ---
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid invoice ID format." });
    }

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found or you do not have permission to edit it.",
      });
    }

    // Protection: Only unissued Drafts can be edited
    if (invoice.status !== "Draft") {
      return res.status(409).json({
        success: false,
        message: `Cannot edit an invoice in "${invoice.status}" status. Only Drafts can be modified. To cancel, please void the invoice.`,
      });
    }

    const {
      invoiceNumber,
      invoiceDate,
      dueDate,
      currency,
      themeColor,
      sellerDetails,
      clientDetails,
      items,
      taxRate,
    } = req.body;

    const mergedSeller = sellerDetails !== undefined ? sellerDetails : invoice.sellerDetails;
    const mergedClient = clientDetails !== undefined ? clientDetails : invoice.clientDetails;
    const sellerState = resolveStateCode(mergedSeller);
    const buyerState = resolveStateCode(mergedClient);

    // Recalculate financials deterministically using tested paise engine
    const financials = calculateFinancials(
      items || invoice.items,
      taxRate ?? invoice.taxRate,
      sellerState,
      buyerState
    );

    if (invoiceNumber) invoice.invoiceNumber = invoiceNumber.trim();
    if (invoiceDate) invoice.invoiceDate = new Date(invoiceDate);
    if (dueDate) invoice.dueDate = new Date(dueDate);
    if (currency) invoice.currency = currency;
    if (themeColor) invoice.themeColor = themeColor;

    if (sellerDetails) {
      invoice.sellerDetails = {
        ...sellerDetails,
        stateCode: sellerState || sellerDetails.stateCode || "",
      };
    }
    if (clientDetails) {
      invoice.clientDetails = {
        ...clientDetails,
        stateCode: buyerState || clientDetails.stateCode || "",
      };
    }

    invoice.items = financials.items;
    invoice.regime = financials.regime;
    invoice.subtotalPaise = financials.subtotalPaise;
    invoice.cgstPaise = financials.cgstPaise;
    invoice.sgstPaise = financials.sgstPaise;
    invoice.igstPaise = financials.igstPaise;
    invoice.taxPaise = financials.taxPaise;
    invoice.grandTotalPaise = financials.grandTotalPaise;
    invoice.balanceDuePaise = financials.grandTotalPaise;
    invoice.subtotal = financials.subtotal;
    invoice.taxRate = financials.taxRate;
    invoice.taxAmount = financials.taxAmount;
    invoice.grandTotal = financials.grandTotal;
    invoice.balanceDue = financials.grandTotal;

    await invoice.save();

    return res.status(200).json({
      success: true,
      message: "Draft invoice updated successfully!",
      invoice,
    });
  } catch (error) {
    console.error("Update Invoice Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update invoice.",
    });
  }
});

// --- 5. POST /api/invoices/:id/issue (Issue a Draft invoice) ---
router.post("/:id/issue", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid invoice ID format." });
    }

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found." });
    }

    if (invoice.status !== "Draft") {
      return res.status(400).json({ success: false, message: "Invoice is already issued." });
    }

    // Run Spec F8 Pre-Send Quality Checker
    const audit = InvoZapChecker.inspectDocument(invoice);
    if (!audit.canSend) {
      const blockerMsgs = audit.blockers.map((b) => b.message).join("; ");
      return res.status(400).json({
        success: false,
        message: `Cannot issue invoice: ${blockerMsgs}`,
        blockers: audit.blockers,
      });
    }

    // Tax regime verification: If GST is charged, both states MUST be resolvable
    const sellerState = resolveStateCode(invoice.sellerDetails);
    const buyerState = resolveStateCode(invoice.clientDetails);

    if (invoice.taxRate > 0) {
      if (!sellerState || !buyerState) {
        return res.status(400).json({
          success: false,
          message: "Cannot issue GST invoice: Both seller and client state codes (or valid GSTINs with state prefix) are required to determine tax regime (CGST+SGST vs IGST).",
        });
      }

      invoice.sellerDetails.stateCode = sellerState;
      invoice.clientDetails.stateCode = buyerState;

      // Lock in final regime and tax splits
      const financials = calculateFinancials(invoice.items, invoice.taxRate, sellerState, buyerState);
      invoice.regime = financials.regime;
      invoice.subtotalPaise = financials.subtotalPaise;
      invoice.cgstPaise = financials.cgstPaise;
      invoice.sgstPaise = financials.sgstPaise;
      invoice.igstPaise = financials.igstPaise;
      invoice.taxPaise = financials.taxPaise;
      invoice.grandTotalPaise = financials.grandTotalPaise;
      invoice.subtotal = financials.subtotal;
      invoice.taxAmount = financials.taxAmount;
      invoice.grandTotal = financials.grandTotal;
    }

    // Monotonic Financial Year Sequence Allocation (Spec F4)
    const fy = InvoZapNumbering.calculateIndianFinancialYear(invoice.invoiceDate);
    const currentNum = (invoice.invoiceNumber || "").trim();
    const parsed = InvoZapNumbering.parseDocumentNumber(currentNum);
    const isStandardCurrentFy = parsed && parsed.isStandardFy && parsed.fy === fy;

    // Single Deterministic Rule:
    // If the invoice does not already possess a finalized standard sequence number in the current FY,
    // atomically allocate the next monotonic sequence number from SequenceCounter.
    if (!isStandardCurrentFy) {
      const counter = await SequenceCounter.findOneAndUpdate(
        { owner: req.user.id, prefix: "INV", fy },
        { $inc: { lastSeq: 1 } },
        { new: true, upsert: true }
      );
      const seqStr = String(counter.lastSeq).padStart(4, "0");
      invoice.invoiceNumber = `INV/${fy}/${seqStr}`;
    } else {
      // If already a standard FY sequence number, bump the high-water mark to at least this sequence
      await SequenceCounter.findOneAndUpdate(
        { owner: req.user.id, prefix: "INV", fy },
        { $max: { lastSeq: parsed.seq } },
        { upsert: true }
      );
    }

    invoice.status = "Unpaid";
    invoice.balanceDuePaise = invoice.grandTotalPaise;
    invoice.balanceDue = invoice.grandTotal;
    await invoice.save();

    return res.status(200).json({
      success: true,
      message: "Invoice successfully issued!",
      invoice,
    });
  } catch (error) {
    console.error("Issue Invoice Error:", error);
    return res.status(500).json({ success: false, message: "Failed to issue invoice." });
  }
});

// --- 5b. POST /api/invoices/:id/payments (Record Payment / TDS credit with Overpayment Rejection) ---
router.post("/:id/payments", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid invoice ID format." });
    }

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found." });
    }

    if (invoice.status === "Draft") {
      return res.status(400).json({ success: false, message: "Cannot record payment on a Draft invoice. Please issue it first." });
    }

    if (invoice.status === "Void") {
      return res.status(400).json({ success: false, message: "Cannot record payment on a Voided invoice." });
    }

    const { amount, kind, method, reference, receivedOn, idempotencyKey } = req.body;

    // Idempotency check: Prevent double-click duplicates
    if (idempotencyKey && typeof idempotencyKey === "string") {
      const existingPayment = (invoice.payments || []).find(
        (p) => p.idempotencyKey === idempotencyKey && !p.voidedAt
      );
      if (existingPayment) {
        return res.status(200).json({
          success: true,
          message: "Payment already recorded (idempotent duplicate request).",
          payment: existingPayment,
          invoice,
        });
      }
    }

    // Input Validation
    const paymentAmount = parseFloat(amount);
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({ success: false, message: "Payment amount must be greater than 0." });
    }
    if (paymentAmount > 10000000) {
      return res.status(400).json({ success: false, message: "Payment amount cannot exceed ₹10,000,000 (₹1 crore)." });
    }

    const validMethods = ["upi", "bank", "cash", "cheque", "other"];
    const paymentMethod = validMethods.includes(method) ? method : "upi";
    const paymentKind = kind === "tds_credit" ? "tds_credit" : "received";
    const safeReference = (reference || "").slice(0, 100).trim();
    const safeReceivedOn = (receivedOn && /^\d{4}-\d{2}-\d{2}$/.test(receivedOn))
      ? receivedOn
      : new Date().toISOString().slice(0, 10);

    const candidatePaise = Math.round(paymentAmount * 100);
    const candidatePayment = {
      paymentId: "pay_" + crypto.randomBytes(8).toString("hex"),
      idempotencyKey: idempotencyKey || null,
      amountPaise: candidatePaise,
      amount: candidatePaise / 100,
      kind: paymentKind,
      method: paymentMethod,
      reference: safeReference,
      receivedOn: safeReceivedOn,
    };

    const existingPayments = (invoice.payments || []).map((p) => ({
      amountPaise: p.amountPaise,
      kind: p.kind,
      voidedAt: p.voidedAt,
    }));

    const totalPaise = invoice.grandTotalPaise || Math.round(invoice.grandTotal * 100);

    // Call tested settlement engine with object arguments
    const settlement = InvoZapCalc.calculateSettlement({
      totalPaise,
      payments: [...existingPayments, candidatePayment],
    });

    if (settlement.isOverpaid) {
      return res.status(400).json({
        success: false,
        message: "Payment rejected: Total payments and credits cannot exceed the invoice grand total.",
      });
    }

    invoice.payments.push({
      paymentId: candidatePayment.paymentId,
      idempotencyKey: candidatePayment.idempotencyKey,
      amountPaise: candidatePayment.amountPaise,
      amount: candidatePayment.amount,
      kind: candidatePayment.kind,
      method: candidatePayment.method,
      reference: candidatePayment.reference,
      receivedOn: candidatePayment.receivedOn,
      recordedAt: new Date(),
    });

    invoice.balanceDuePaise = settlement.balanceDuePaise;
    invoice.balanceDue = settlement.balanceDuePaise / 100;
    invoice.status = settlement.balanceDuePaise === 0 ? "Paid" : "Partial";

    await invoice.save();

    return res.status(200).json({
      success: true,
      message: "Payment recorded successfully!",
      settlement,
      invoice,
    });
  } catch (error) {
    console.error("Record Payment Error:", error);
    return res.status(500).json({ success: false, message: "Failed to record payment." });
  }
});

// --- 5c. POST /api/invoices/:id/payments/:paymentId/void (Void a recorded payment) ---
router.post("/:id/payments/:paymentId/void", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid invoice ID format." });
    }

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found." });
    }

    const payment = (invoice.payments || []).find(
      (p) => p.paymentId === req.params.paymentId || String(p._id) === req.params.paymentId
    );

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment entry not found on this invoice." });
    }

    if (payment.voidedAt) {
      return res.status(400).json({ success: false, message: "Payment is already voided." });
    }

    payment.voidedAt = new Date();

    // Recalculate settlement across remaining active payments
    const totalPaise = invoice.grandTotalPaise || Math.round(invoice.grandTotal * 100);
    const settlement = InvoZapCalc.calculateSettlement({
      totalPaise,
      payments: invoice.payments,
    });

    invoice.balanceDuePaise = settlement.balanceDuePaise;
    invoice.balanceDue = settlement.balanceDuePaise / 100;

    if (settlement.balanceDuePaise === 0) {
      invoice.status = "Paid";
    } else if (settlement.totalSettledPaise > 0) {
      invoice.status = "Partial";
    } else {
      invoice.status = "Unpaid";
    }

    await invoice.save();

    return res.status(200).json({
      success: true,
      message: "Payment successfully voided.",
      settlement,
      invoice,
    });
  } catch (error) {
    console.error("Void Payment Error:", error);
    return res.status(500).json({ success: false, message: "Failed to void payment." });
  }
});

// --- 6. DELETE /api/invoices/:id (Delete Draft invoice only) ---
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid invoice ID format." });
    }

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found or you do not have permission to delete it.",
      });
    }

    // Protection: Only un-issued drafts can be permanently deleted
    if (invoice.status !== "Draft") {
      return res.status(400).json({
        success: false,
        message: "Issued invoices cannot be permanently deleted. They must be voided to preserve the statutory audit trail and numbering sequence.",
      });
    }

    await Invoice.deleteOne({ _id: invoice._id });

    return res.status(200).json({
      success: true,
      message: "Draft invoice deleted successfully!",
    });
  } catch (error) {
    console.error("Delete Invoice Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete invoice.",
    });
  }
});

// --- 7. POST /api/invoices/:id/void (Void issued invoice & revoke share links) ---
router.post("/:id/void", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid invoice ID format." });
    }

    const invoice = await Invoice.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found or you do not have permission to void it.",
      });
    }

    if (invoice.status === "Void") {
      return res.status(400).json({
        success: false,
        message: "Invoice is already voided.",
      });
    }

    // Protection: Disallow voiding if active payments are recorded on the invoice
    if (invoice.payments && invoice.payments.some((p) => !p.voidedAt)) {
      return res.status(400).json({
        success: false,
        message: "Cannot void an invoice that has active recorded payments. Void the payments first.",
      });
    }

    invoice.status = "Void";
    await invoice.save();

    // Revoke all active public share links for this invoice
    await ShareLink.updateMany(
      { invoice: invoice._id },
      { isRevoked: true }
    );

    return res.status(200).json({
      success: true,
      message: "Invoice has been voided and all public share links have been revoked.",
      invoice,
    });
  } catch (error) {
    console.error("Void Invoice Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to void invoice.",
    });
  }
});

module.exports = router;
