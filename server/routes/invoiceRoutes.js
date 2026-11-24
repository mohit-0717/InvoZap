// server/routes/invoiceRoutes.js
// Protected Invoice CRUD APIs with server-side financial calculations & ownership verification

const express = require("express");
const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Invoice = require("../models/Invoice");
const ShareLink = require("../models/ShareLink");
const AdjustmentNote = require("../models/AdjustmentNote");
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
  // Bound taxRate safely between 0% and 100%
  const safeTaxRate = Math.min(100, Math.max(0, parseFloat(taxRate ?? 18) || 0));

  // Sanitize item lengths
  const safeItems = (items || []).map((it) => ({
    description: String(it.description || "Item").slice(0, 200),
    quantity: it.quantity,
    price: it.price,
    hsnSac: String(it.hsnSac || "").slice(0, 20),
    unit: String(it.unit || "").slice(0, 30),
    taxRate: it.taxRate === undefined ? safeTaxRate : it.taxRate,
  }));

  const result = InvoZapCalc.calculateFinancials({
    items: safeItems,
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
      hsnSac: i.hsnSac,
      unit: i.unit,
      taxRate: i.taxRate,
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
      upiDetails,
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

    // Resolve state codes from explicit fields or GSTINs
    const sellerState = resolveStateCode(sellerDetails);
    const buyerState = resolveStateCode(clientDetails);
    const resolvedUpiId = (sellerDetails && sellerDetails.upiId) || (upiDetails && (upiDetails.vpa || upiDetails.upiId)) || "";
    const resolvedPayee = (upiDetails && upiDetails.payeeName) || (sellerDetails && sellerDetails.businessName) || "";

    // Recalculate financial totals on server
    const financials = calculateFinancials(items, taxRate ?? 18, sellerState, buyerState);

    const isPaidRequested = (req.body.status || "").toLowerCase() === "paid";
    const initialStatus = isPaidRequested ? "Paid" : (req.body.status === "Unpaid" ? "Unpaid" : "Draft");
    const initialBalanceDuePaise = isPaidRequested ? 0 : financials.grandTotalPaise;
    const initialBalanceDue = isPaidRequested ? 0 : financials.grandTotal;
    const initialPayments = isPaidRequested ? [{
      paymentId: "PAY-" + Date.now(),
      amount: financials.grandTotal,
      amountPaise: financials.grandTotalPaise,
      kind: "received",
      method: "upi",
      reference: "Direct Settlement",
      receivedOn: new Date().toISOString().slice(0, 10),
      recordedAt: new Date()
    }] : [];

    if (existing) {
      if (existing.status === "Draft" || isPaidRequested) {
        existing.invoiceDate = invoiceDate ? new Date(invoiceDate) : existing.invoiceDate;
        existing.dueDate = dueDate ? new Date(dueDate) : existing.dueDate;
        existing.currency = currency || existing.currency;
        existing.themeColor = themeColor || existing.themeColor;
        existing.sellerDetails = {
          ...(sellerDetails || {}),
          upiId: resolvedUpiId || (existing.sellerDetails && existing.sellerDetails.upiId) || "",
          stateCode: sellerState || (sellerDetails && sellerDetails.stateCode) || "",
        };
        existing.upiDetails = {
          vpa: resolvedUpiId || (existing.upiDetails && existing.upiDetails.vpa) || "",
          payeeName: resolvedPayee || (existing.upiDetails && existing.upiDetails.payeeName) || "",
        };
        existing.clientDetails = {
          clientName: clientDetails.clientName.trim(),
          address: clientDetails.address || "",
          email: clientDetails.email || "",
          phone: clientDetails.phone || "",
          gstin: clientDetails.gstin || "",
          stateCode: buyerState || (clientDetails && clientDetails.stateCode) || "",
        };
        existing.items = financials.items;
        existing.regime = financials.regime;
        existing.subtotalPaise = financials.subtotalPaise;
        existing.cgstPaise = financials.cgstPaise;
        existing.sgstPaise = financials.sgstPaise;
        existing.igstPaise = financials.igstPaise;
        existing.taxPaise = financials.taxPaise;
        existing.grandTotalPaise = financials.grandTotalPaise;
        existing.subtotal = financials.subtotal;
        existing.taxRate = financials.taxRate;
        existing.taxAmount = financials.taxAmount;
        existing.grandTotal = financials.grandTotal;

        if (req.body.status) {
          existing.status = initialStatus;
          existing.balanceDuePaise = initialBalanceDuePaise;
          existing.balanceDue = initialBalanceDue;
          if (isPaidRequested && (!existing.payments || existing.payments.length === 0)) {
            existing.payments = initialPayments;
          }
        } else {
          existing.balanceDuePaise = financials.grandTotalPaise;
          existing.balanceDue = financials.grandTotal;
        }

        await existing.save();
        return res.status(200).json({
          success: true,
          message: "Invoice updated successfully.",
          invoice: existing,
        });
      }

      return res.status(409).json({
        success: false,
        message: `Invoice number "${invoiceNumber}" is already issued and exists in your account.`,
      });
    }

    const newInvoice = await Invoice.create({
      owner: req.user.id,
      invoiceNumber: invoiceNumber.trim(),
      invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : null,
      currency: currency || "₹",
      status: initialStatus,
      themeColor: themeColor || "navy",
      sellerDetails: {
        ...(sellerDetails || {}),
        upiId: resolvedUpiId,
        stateCode: sellerState || (sellerDetails && sellerDetails.stateCode) || "",
      },
      upiDetails: {
        vpa: resolvedUpiId,
        payeeName: resolvedPayee,
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
      balanceDuePaise: initialBalanceDuePaise,
      subtotal: financials.subtotal,
      taxRate: financials.taxRate,
      taxAmount: financials.taxAmount,
      grandTotal: financials.grandTotal,
      balanceDue: initialBalanceDue,
      payments: initialPayments,
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

    let queryBuilder = Invoice.find(query).sort({ createdAt: -1 });

    const page = parseInt(req.query.page, 10);
    const limit = parseInt(req.query.limit, 10);
    if (Number.isInteger(limit) && limit > 0) {
      const skip = Number.isInteger(page) && page > 0 ? (page - 1) * limit : 0;
      queryBuilder = queryBuilder.skip(skip).limit(limit);
    }

    const invoices = await queryBuilder.select("-__v");

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

// --- 3. GET /api/invoices/:id (Get single invoice by _id or invoiceNumber) ---
router.get("/:id", async (req, res) => {
  try {
    const query = { owner: req.user.id };
    if (mongoose.isValidObjectId(req.params.id)) {
      query._id = req.params.id;
    } else {
      query.invoiceNumber = req.params.id;
    }

    const invoice = await Invoice.findOne(query).select("-__v");

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
    const query = { owner: req.user.id };
    if (mongoose.isValidObjectId(req.params.id)) {
      query._id = req.params.id;
    } else {
      query.invoiceNumber = req.params.id;
    }

    const invoice = await Invoice.findOne(query);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found or you do not have permission to edit it.",
      });
    }

    const isPaidUpdate = (req.body.status || "").toLowerCase() === "paid";
    // Protection: Only unissued Drafts can have items/pricing modified. Marking as Paid is always permitted.
    if (invoice.status !== "Draft" && !isPaidUpdate && req.body.status !== invoice.status) {
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
      upiDetails,
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

    if (sellerDetails || upiDetails) {
      const resolvedUpi = (sellerDetails && sellerDetails.upiId) || (upiDetails && (upiDetails.vpa || upiDetails.upiId)) || invoice.sellerDetails?.upiId || (invoice.upiDetails?.vpa) || "";
      const resolvedPay = (upiDetails && upiDetails.payeeName) || (sellerDetails && sellerDetails.businessName) || invoice.sellerDetails?.businessName || (invoice.upiDetails?.payeeName) || "";
      invoice.sellerDetails = {
        ...(invoice.sellerDetails ? (invoice.sellerDetails.toObject ? invoice.sellerDetails.toObject() : invoice.sellerDetails) : {}),
        ...(sellerDetails || {}),
        upiId: resolvedUpi,
        stateCode: sellerState || (sellerDetails && sellerDetails.stateCode) || invoice.sellerDetails?.stateCode || "",
      };
      invoice.upiDetails = {
        vpa: resolvedUpi,
        payeeName: resolvedPay,
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
    if (req.body.status) {
      if (isPaidUpdate) {
        invoice.status = "Paid";
        invoice.balanceDuePaise = 0;
        invoice.balanceDue = 0;
        if (!invoice.payments || invoice.payments.length === 0) {
          invoice.payments = [{
            paymentId: "PAY-" + Date.now(),
            amount: financials.grandTotal,
            amountPaise: financials.grandTotalPaise,
            kind: "received",
            method: "upi",
            reference: "Direct Settlement",
            receivedOn: new Date().toISOString().slice(0, 10),
            recordedAt: new Date(),
          }];
        }
      } else if (req.body.status === "Unpaid") {
        invoice.status = "Unpaid";
        invoice.balanceDuePaise = financials.grandTotalPaise;
        invoice.balanceDue = financials.grandTotal;
      }
    } else {
      invoice.balanceDuePaise = financials.grandTotalPaise;
      invoice.balanceDue = financials.grandTotal;
    }
    invoice.subtotal = financials.subtotal;
    invoice.taxRate = financials.taxRate;
    invoice.taxAmount = financials.taxAmount;
    invoice.grandTotal = financials.grandTotal;

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

    const hasGst = (invoice.items || []).some(item => Number(item.taxRate ?? invoice.taxRate) > 0);
    if (hasGst) {
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
    invoice.adjustedGrandTotalPaise = invoice.grandTotalPaise;
    invoice.adjustedGrandTotal = invoice.grandTotal;
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

// --- 5a2. POST /api/invoices/:id/toggle-paid (1-Click toggle between Paid and Unpaid) ---
router.post("/:id/toggle-paid", async (req, res) => {
  try {
    const query = { owner: req.user.id };
    if (mongoose.isValidObjectId(req.params.id)) {
      query._id = req.params.id;
    } else {
      query.invoiceNumber = req.params.id;
    }

    const invoice = await Invoice.findOne(query);
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found." });
    }

    if (invoice.status === "Void") {
      return res.status(400).json({ success: false, message: "Cannot toggle payment status of a Voided invoice." });
    }

    const currentLower = (invoice.status || "").toLowerCase();
    const effectiveTotalPaise = invoice.adjustedGrandTotalPaise ?? invoice.grandTotalPaise ?? Math.round((invoice.grandTotal || 0) * 100);
    const effectiveTotal = invoice.adjustedGrandTotal ?? invoice.grandTotal ?? (effectiveTotalPaise / 100);

    if (currentLower === "paid" || invoice.balanceDuePaise === 0) {
      // Toggle to Unpaid
      invoice.status = "Unpaid";
      invoice.balanceDuePaise = effectiveTotalPaise;
      invoice.balanceDue = effectiveTotal;

      // Mark any direct settlement payments as voided
      if (Array.isArray(invoice.payments)) {
        invoice.payments.forEach((p) => {
          if (p.reference === "Direct Settlement" && !p.voidedAt) {
            p.voidedAt = new Date();
          }
        });
      }
    } else {
      // Toggle to Paid
      invoice.status = "Paid";
      invoice.balanceDuePaise = 0;
      invoice.balanceDue = 0;

      if (!invoice.payments) invoice.payments = [];
      const hasActivePayment = invoice.payments.some((p) => !p.voidedAt && (p.amount > 0 || p.amountPaise > 0));
      if (!hasActivePayment) {
        invoice.payments.push({
          paymentId: "PAY-" + Date.now(),
          amount: effectiveTotal,
          amountPaise: effectiveTotalPaise,
          kind: "received",
          method: "upi",
          reference: "Direct Settlement",
          receivedOn: new Date().toISOString().slice(0, 10),
          recordedAt: new Date(),
        });
      }
    }

    await invoice.save();
    return res.status(200).json({
      success: true,
      message: `Invoice marked as ${invoice.status}.`,
      invoice,
    });
  } catch (error) {
    console.error("Toggle Paid Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update payment status." });
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

    const totalPaise = invoice.adjustedGrandTotalPaise ?? invoice.grandTotalPaise ?? Math.round(invoice.grandTotal * 100);

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
    if (error.name === "VersionError") {
      return res.status(409).json({
        success: false,
        message: "Concurrent modification conflict. The invoice was updated by another request. Please refresh and try again.",
      });
    }
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
    const totalPaise = invoice.adjustedGrandTotalPaise ?? invoice.grandTotalPaise ?? Math.round(invoice.grandTotal * 100);
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

// --- 5d. Credit and Debit Notes (immutable adjustments to an issued invoice) ---
router.get("/:id/notes", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid invoice ID format." });
    }
    const invoice = await Invoice.findOne({ _id: req.params.id, owner: req.user.id });
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found." });
    const notes = await AdjustmentNote.find({ invoice: invoice._id, owner: req.user.id }).sort({ issuedAt: -1 }).select("-__v");
    return res.status(200).json({ success: true, notes });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to retrieve adjustment notes." });
  }
});

router.post("/:id/notes", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid invoice ID format." });
    }
    const type = req.body.type === "debit" ? "debit" : req.body.type === "credit" ? "credit" : null;
    const amountPaise = InvoZapCalc.rupeesToPaise(req.body.amount);
    const reason = String(req.body.reason || "").trim();
    if (!type || amountPaise <= 0 || !reason) {
      return res.status(400).json({ success: false, message: "Note type, a positive amount, and reason are required." });
    }

    const invoice = await Invoice.findOne({ _id: req.params.id, owner: req.user.id });
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found." });
    if (["Draft", "Void"].includes(invoice.status)) {
      return res.status(409).json({ success: false, message: "Notes can only be issued for active invoices." });
    }

    const currentTotalPaise = invoice.adjustedGrandTotalPaise ?? invoice.grandTotalPaise;
    const nextTotalPaise = type === "credit" ? currentTotalPaise - amountPaise : currentTotalPaise + amountPaise;
    if (nextTotalPaise < 0) {
      return res.status(400).json({ success: false, message: "Credit note cannot reduce the invoice below zero." });
    }
    const settlement = InvoZapCalc.calculateSettlement({ totalPaise: nextTotalPaise, payments: invoice.payments || [] });
    if (settlement.isOverpaid) {
      return res.status(400).json({ success: false, message: "Credit note exceeds the unpaid amount after recorded payments." });
    }

    const prefix = type === "credit" ? "CN" : "DN";
    const note = await AdjustmentNote.create({
      owner: req.user.id,
      invoice: invoice._id,
      noteNumber: `${prefix}-${invoice.invoiceNumber}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
      type,
      amountPaise,
      amount: amountPaise / 100,
      reason,
    });

    invoice.adjustedGrandTotalPaise = nextTotalPaise;
    invoice.adjustedGrandTotal = nextTotalPaise / 100;
    invoice.balanceDuePaise = settlement.balanceDuePaise;
    invoice.balanceDue = settlement.balanceDuePaise / 100;
    invoice.status = settlement.balanceDuePaise === 0 ? "Paid" : settlement.totalSettledPaise > 0 ? "Partial" : "Unpaid";
    await invoice.save();

    return res.status(201).json({ success: true, note, invoice, settlement });
  } catch (error) {
    console.error("Create Adjustment Note Error:", error);
    return res.status(500).json({ success: false, message: "Failed to create adjustment note." });
  }
});

// --- 6. DELETE /api/invoices/:id (Delete invoice permanently) ---
router.delete("/:id", async (req, res) => {
  try {
    let query = { owner: req.user.id };
    if (mongoose.isValidObjectId(req.params.id)) {
      query._id = req.params.id;
    } else {
      query.invoiceNumber = req.params.id;
    }

    const invoice = await Invoice.findOne(query);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found or you do not have permission to delete it.",
      });
    }

    await Invoice.deleteOne({ _id: invoice._id });

    return res.status(200).json({
      success: true,
      message: "Invoice deleted successfully!",
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
