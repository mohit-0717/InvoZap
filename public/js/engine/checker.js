/**
 * InvoZap - Pre-Send Quality Checker Engine
 * Implements Technical Product Specification (Spec F8)
 * 
 * Validates invoices and quotations before sharing or final download.
 * Produces structured findings classified into:
 * - 'blocker': Critical errors that prevent sending/issuing
 * - 'warning': Recommended improvements with 1-click automatic fixes
 * 
 * Zero dependencies, dual-export (Browser & Node.js).
 */

(function (root, factory) {
  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = factory();
  } else {
    root.InvoZapChecker = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /**
   * Evaluates an invoice or quotation document and returns structured audit findings.
   * 
   * @param {object} doc - Document payload
   * @returns {object} { canSend: boolean, blockers: Array, warnings: Array, totalIssues: number }
   */
  function inspectDocument(doc) {
    if (!doc || typeof doc !== "object") {
      return {
        canSend: false,
        blockers: [{ code: "DOC_INVALID", message: "Document data is missing or corrupted." }],
        warnings: [],
        totalIssues: 1
      };
    }

    const blockers = [];
    const warnings = [];

    // --- 1. SELLER CHECKS ---
    const seller = doc.sellerDetails || doc.seller || {};
    const sellerName = (seller.businessName || seller.name || "").trim();
    if (!sellerName) {
      blockers.push({
        code: "SELLER_NAME_MISSING",
        field: "businessName",
        message: "Your Business or Freelancer Name is required.",
        fix: null
      });
    }

    // --- 2. CLIENT CHECKS ---
    const client = doc.clientDetails || doc.client || {};
    const clientName = (client.clientName || client.name || "").trim();
    if (!clientName) {
      blockers.push({
        code: "CLIENT_NAME_MISSING",
        field: "clientName",
        message: "Client or Company name is required.",
        fix: null
      });
    }

    // --- 3. LINE ITEMS CHECKS ---
    const items = Array.isArray(doc.items) ? doc.items : [];
    if (items.length === 0) {
      blockers.push({
        code: "NO_LINE_ITEMS",
        field: "items",
        message: "At least one billable item or service scope is required.",
        fix: { type: "ADD_SAMPLE_ITEM", label: "Add sample item" }
      });
    } else {
      let hasZeroPrice = false;
      let hasEmptyDesc = false;

      items.forEach(function (it, idx) {
        const desc = (it.description || "").trim();
        const price = parseFloat(it.price || it.unitPrice || 0);
        const qty = parseFloat(it.quantity || 1);

        if (!desc) hasEmptyDesc = true;
        if (isNaN(price) || price <= 0 || isNaN(qty) || qty <= 0) {
          hasZeroPrice = true;
        }
      });

      if (hasEmptyDesc) {
        warnings.push({
          code: "LINE_DESC_EMPTY",
          field: "items",
          message: "One or more line items have an empty description.",
          fix: null
        });
      }

      if (hasZeroPrice) {
        blockers.push({
          code: "LINE_PRICE_ZERO",
          field: "items",
          message: "All line items must have a quantity and unit price greater than ₹0.",
          fix: null
        });
      }
    }

    // --- 4. DATES & TIMELINES ---
    const issueDateStr = doc.invoiceDate || doc.quotationDate || doc.issueDate || "";
    const dueDateStr = doc.dueDate || doc.validUntil || "";

    if (!dueDateStr) {
      warnings.push({
        code: "NO_DUE_DATE",
        field: "dueDate",
        message: "No payment due date or validity date specified.",
        fix: { type: "SET_DUE_DAYS", days: 15, label: "Set Net 15 days" }
      });
    } else if (issueDateStr && dueDateStr) {
      const issueDate = new Date(issueDateStr);
      const dueDate = new Date(dueDateStr);
      if (!isNaN(issueDate.getTime()) && !isNaN(dueDate.getTime())) {
        if (dueDate < issueDate) {
          blockers.push({
            code: "DATES_INVALID",
            field: "dueDate",
            message: "Due date cannot be earlier than the invoice issue date.",
            fix: { type: "SET_DUE_SAME_OR_PLUS", days: 7, label: "Set to 7 days after issue" }
          });
        }
      }
    }

    // --- 5. GSTIN & STATE CODE INTEGRITY (Spec F5) ---
    const clientGstin = (client.gstin || client.gst || "").trim().toUpperCase();
    const buyerStateCode = String(doc.buyerStateCode || client.stateCode || "").trim();

    if (clientGstin && clientGstin.length >= 2) {
      const gstinState = clientGstin.substring(0, 2);
      if (/^\d{2}$/.test(gstinState)) {
        if (buyerStateCode && buyerStateCode !== gstinState) {
          warnings.push({
            code: "GSTIN_STATE_MISMATCH",
            field: "buyerStateCode",
            message: `Client GSTIN indicates State ${gstinState}, but Buyer State is selected as ${buyerStateCode}.`,
            fix: { type: "SYNC_BUYER_STATE", stateCode: gstinState, label: `Sync State Code to ${gstinState}` }
          });
        }
      }

      // Check-digit verification (Spec F5 Mod 36 Luhn check)
      if (clientGstin.length === 15) {
        let isValidGstin = true;
        if (typeof root !== "undefined" && root.InvoZapCalc && root.InvoZapCalc.validateGstinChecksum) {
          isValidGstin = root.InvoZapCalc.validateGstinChecksum(clientGstin);
        } else if (typeof require === "function") {
          try {
            const calcMod = require("./calc.js");
            isValidGstin = calcMod.validateGstinChecksum(clientGstin);
          } catch (e) {}
        }
        if (!isValidGstin) {
          warnings.push({
            code: "GSTIN_CHECKSUM_INVALID",
            field: "gstin",
            message: `GSTIN "${clientGstin}" failed Mod-36 check digit validation. Please check 15th character.`,
            fix: null
          });
        }
      }
    }

    // --- 6. UPI PAYMENT DETAILS (Spec F11 & Safety Rule: Never invent payment data) ---
    const upi = doc.upiDetails || doc.upi || {};
    const upiVpa = (upi.vpa || seller.upiId || seller.vpa || "").trim();
    if (!upiVpa) {
      const savedSellerVpa = (seller.upiId || seller.vpa || seller.upiVpa || "").trim();
      if (savedSellerVpa) {
        warnings.push({
          code: "NO_PAYMENT_DETAILS",
          field: "upiVpa",
          message: "No UPI ID specified for instant QR payment settlement.",
          fix: { type: "USE_SAVED_UPI", vpa: savedSellerVpa, label: `Use saved UPI (${savedSellerVpa})` }
        });
      } else {
        warnings.push({
          code: "NO_PAYMENT_DETAILS",
          field: "upiVpa",
          message: "No UPI ID provided for QR payment. Enter your registered VPA.",
          fix: { type: "FOCUS_UPI_INPUT", label: "Enter UPI ID" }
        });
      }
    } else if (!upiVpa.includes("@")) {
      warnings.push({
        code: "INVALID_UPI_FORMAT",
        field: "upiVpa",
        message: "UPI ID should be in the format 'username@bank' (e.g. mobile@upi).",
        fix: null
      });
    }

    return {
      canSend: blockers.length === 0,
      blockers: blockers,
      warnings: warnings,
      totalIssues: blockers.length + warnings.length,
      timestamp: new Date().toISOString()
    };
  }

  return {
    inspectDocument: inspectDocument
  };
});
