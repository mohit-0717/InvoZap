/* ========================================================
   InvoZap Financial Engine (js/engine/calc.js)
   [Spec F5 Compliance: Deterministic Financial Engine]
   - All calculations computed in integer paise (1 Rupee = 100 paise)
   - Eliminates floating-point rounding errors
   - Indian GST Regime Auto-detection:
     * Intra-State (Seller State == Buyer State): Splits tax 50% CGST + 50% SGST
     * Inter-State (Seller State != Buyer State): Applies 100% IGST
     * Non-GST mode: 0% tax
   - Works both on Client Browser (live preview) and Node.js Server
   ======================================================== */

// Official 2-digit GST State & Territory Codes of India (CBIC Master List)
const INDIAN_GST_STATES = [
  { code: "01", name: "Jammu and Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu" }, // Merged UT (Notification 10/2020-CT)
  { code: "27", name: "Maharashtra" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman and Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "38", name: "Ladakh" },
  { code: "97", name: "Other Territory" },
  { code: "96", name: "Foreign Country (Export / LUT)" },
  { code: "28", name: "Andhra Pradesh" } // Legacy code 28
];

/**
 * Extract 2-digit GST State Code from a 15-character GSTIN.
 * Example: '27AAPFU0939F1ZV' -> '27' (Maharashtra)
 */
function extractStateCodeFromGstin(gstin) {
  if (!gstin || typeof gstin !== "string") return null;
  const clean = gstin.trim().toUpperCase();
  if (/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(clean)) {
    return clean.substring(0, 2);
  }
  return null;
}

/**
 * Validates the 15th check digit of a 15-character GSTIN using Mod 36 checksum.
 * @param {string} gstin - 15 character Indian GSTIN
 * @returns {boolean} true if structurally valid and checksum passes
 */
function validateGstinChecksum(gstin) {
  if (!gstin || typeof gstin !== "string") return false;
  const clean = gstin.trim().toUpperCase();
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(clean)) {
    return false;
  }

  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const val = chars.indexOf(clean[i]);
    if (val === -1) return false;
    const factor = (i % 2 === 0) ? 1 : 2;
    const prod = val * factor;
    sum += Math.floor(prod / 36) + (prod % 36);
  }
  const rem = sum % 36;
  const checkIdx = (36 - rem) % 36;
  const expectedChar = chars[checkIdx];

  return clean[14] === expectedChar;
}

/**
 * Format integer paise into Indian currency string format (Lakhs & Crores).
 * Example: 1180000 paise -> '₹11,800.00'
 */
function formatPaiseToRupees(paise, currencySymbol = "₹") {
  const rupees = paise / 100;
  return `${currencySymbol}${rupees.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Convert human input rupee amount to integer paise.
 * Example: '20,000.50' or 20000.5 -> 2000050 paise
 */
function rupeesToPaise(amount) {
  if (typeof amount === "string") {
    amount = parseFloat(amount.replace(/[^0-9.-]/g, "")) || 0;
  }
  return Math.round((parseFloat(amount) || 0) * 100);
}

/**
 * Main Pure Calculation Function
 * @param {Object} params
 * @param {Array} params.items - Array of line items [{ description, quantity, price }]
 * @param {string} params.taxMode - 'gst' or 'none' (default 'gst')
 * @param {number} params.taxRatePercent - e.g. 18 for 18% GST (default 18)
 * @param {string} params.sellerStateCode - e.g. '27' (Maharashtra)
 * @param {string} params.buyerStateCode - e.g. '27' (Maharashtra) or '29' (Karnataka)
 * @param {boolean} params.pricesIncludeTax - Inclusive vs Exclusive pricing
 */
function calculateFinancials({
  items = [],
  taxMode = "gst",
  taxRatePercent = 18,
  sellerStateCode = "27",
  buyerStateCode = "27",
  pricesIncludeTax = false,
  currencySymbol = "₹"
}) {
  // Determine Tax Regime (Intra-State vs Inter-State)
  let regime = "none";
  let effectiveTaxRate = taxMode === "none" ? 0 : Math.max(0, parseFloat(taxRatePercent) || 0);

  const hasTaxableRate = items.some(item => {
    const rate = item && item.taxRate !== undefined ? item.taxRate : effectiveTaxRate;
    return (parseFloat(rate) || 0) > 0;
  });

  if (taxMode === "gst" && hasTaxableRate) {
    if (sellerStateCode && buyerStateCode && sellerStateCode === buyerStateCode) {
      regime = "intra"; // Same state: CGST + SGST
    } else {
      regime = "inter"; // Different state or POS: IGST
    }
  }

  let totalTaxablePaise = 0;
  let totalCgstPaise = 0;
  let totalSgstPaise = 0;
  let totalIgstPaise = 0;
  let totalGrossPaise = 0;

  // Process Each Line Item with Integer Arithmetic & Boundary Validation
  const calculatedItems = items.map((item, index) => {
    let qty = parseFloat(item.quantity);
    if (!Number.isFinite(qty) || qty <= 0) qty = 1;
    if (qty > 100000) qty = 100000; // Guard against Infinity / overflow

    let rawPrice = typeof item.price === "number" ? item.price : parseFloat(item.price);
    if (!Number.isFinite(rawPrice) || rawPrice < 0) rawPrice = 0;
    if (rawPrice > 10000000) rawPrice = 10000000; // Spec C1 limit: ₹1 crore max unit price

    const unitPricePaise = rupeesToPaise(rawPrice);
    const lineGrossPaise = Math.round(qty * unitPricePaise);

    let taxablePaise = lineGrossPaise;
    let cgstPaise = 0;
    let sgstPaise = 0;
    let igstPaise = 0;

    const itemTaxRate = taxMode === "none"
      ? 0
      : Math.min(100, Math.max(0, parseFloat(item.taxRate ?? effectiveTaxRate) || 0));

    if (itemTaxRate > 0) {
      if (pricesIncludeTax) {
        // Reverse calculation: Taxable = Gross * 100 / (100 + Rate)
        taxablePaise = Math.round((lineGrossPaise * 10000) / (10000 + Math.round(itemTaxRate * 100)));
        const lineTaxPaise = lineGrossPaise - taxablePaise;

        if (regime === "intra") {
          cgstPaise = Math.round(lineTaxPaise / 2);
          sgstPaise = lineTaxPaise - cgstPaise;
        } else if (regime === "inter") {
          igstPaise = lineTaxPaise;
        }
      } else {
        // Forward calculation: Tax = Taxable * Rate / 100
        if (regime === "intra") {
          const halfRateBasis = (itemTaxRate / 2) / 100;
          cgstPaise = Math.round(taxablePaise * halfRateBasis);
          sgstPaise = cgstPaise;
        } else if (regime === "inter") {
          igstPaise = Math.round(taxablePaise * (effectiveTaxRate / 100));
        }
      }
    }

    const lineTotalPaise = taxablePaise + cgstPaise + sgstPaise + igstPaise;

    totalGrossPaise += lineGrossPaise;
    totalTaxablePaise += taxablePaise;
    totalCgstPaise += cgstPaise;
    totalSgstPaise += sgstPaise;
    totalIgstPaise += igstPaise;

    return {
      no: index + 1,
      description: (item.description || "Item").trim(),
      quantity: qty,
      hsnSac: String(item.hsnSac || "").trim(),
      unit: String(item.unit || "").trim(),
      taxRate: itemTaxRate,
      unitPricePaise: unitPricePaise,
      unitPriceFormatted: formatPaiseToRupees(unitPricePaise, currencySymbol),
      taxablePaise: taxablePaise,
      taxableFormatted: formatPaiseToRupees(taxablePaise, currencySymbol),
      cgstPaise: cgstPaise,
      sgstPaise: sgstPaise,
      igstPaise: igstPaise,
      lineTotalPaise: lineTotalPaise,
      lineTotalFormatted: formatPaiseToRupees(lineTotalPaise, currencySymbol)
    };
  });

  const totalTaxPaise = totalCgstPaise + totalSgstPaise + totalIgstPaise;
  const grandTotalPaise = totalTaxablePaise + totalTaxPaise;

  return {
    items: calculatedItems,
    regime: regime, // 'intra' | 'inter' | 'none'
    sellerStateCode: sellerStateCode,
    buyerStateCode: buyerStateCode,
    taxRatePercent: effectiveTaxRate,
    totals: {
      subtotalPaise: totalTaxablePaise,
      subtotalFormatted: formatPaiseToRupees(totalTaxablePaise, currencySymbol),
      cgstPaise: totalCgstPaise,
      cgstFormatted: formatPaiseToRupees(totalCgstPaise, currencySymbol),
      sgstPaise: totalSgstPaise,
      sgstFormatted: formatPaiseToRupees(totalSgstPaise, currencySymbol),
      igstPaise: totalIgstPaise,
      igstFormatted: formatPaiseToRupees(totalIgstPaise, currencySymbol),
      taxPaise: totalTaxPaise,
      taxFormatted: formatPaiseToRupees(totalTaxPaise, currencySymbol),
      grandTotalPaise: grandTotalPaise,
      grandTotalFormatted: formatPaiseToRupees(grandTotalPaise, currencySymbol)
    }
  };
}

/**
 * Calculates payment settlement & balance due from payments ledger (Spec F12).
 * Supports partial payments and TDS credits.
 * 
 * Strict Signature: calculateSettlement({ totalPaise, payments })
 * Requires options object parameter to eliminate positional argument bugs.
 * 
 * @param {object} params
 * @param {number} params.totalPaise - Total invoice amount in integer paise
 * @param {Array<object>} params.payments - Array of payment records
 * @returns {object}
 */
function calculateSettlement(params) {
  if (!params || typeof params !== "object" || Array.isArray(params)) {
    throw new TypeError("calculateSettlement requires an options object: { totalPaise, payments }");
  }
  const totalPaise = parseInt(params.totalPaise, 10) || 0;
  const payments = Array.isArray(params.payments) ? params.payments : [];
  let receivedPaise = 0;
  let tdsCreditedPaise = 0;

  const validPayments = Array.isArray(payments) ? payments : [];
  validPayments.forEach(p => {
    if (p && !p.voidedAt) {
      const amt = parseInt(p.amountPaise, 10) || 0;
      if (p.kind === "tds_credit") {
        tdsCreditedPaise += amt;
      } else {
        receivedPaise += amt;
      }
    }
  });

  const totalSettledPaise = receivedPaise + tdsCreditedPaise;
  
  // Spec F12 Rule: Overpayment must be rejected rather than silently clamped
  if (totalSettledPaise > totalPaise) {
    return {
      error: "OVERPAYMENT_REJECTED",
      message: `Total payments & TDS credits (${formatPaiseToRupees(totalSettledPaise)}) cannot exceed invoice total (${formatPaiseToRupees(totalPaise)}).`,
      receivedPaise,
      tdsCreditedPaise,
      totalSettledPaise,
      balanceDuePaise: 0,
      paymentState: "overpaid",
      isOverpaid: true
    };
  }

  const balanceDuePaise = totalPaise - totalSettledPaise;

  let paymentState = "unpaid";
  if (totalSettledPaise === totalPaise && totalPaise > 0) {
    paymentState = "paid";
  } else if (totalSettledPaise > 0) {
    paymentState = "partial";
  }

  return {
    receivedPaise,
    tdsCreditedPaise,
    totalSettledPaise,
    balanceDuePaise,
    paymentState,
    isOverpaid: false,
    receivedFormatted: formatPaiseToRupees(receivedPaise),
    balanceDueFormatted: formatPaiseToRupees(balanceDuePaise)
  };
}

// Export for CommonJS (Node.js) and Browser Window
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    INDIAN_GST_STATES,
    extractStateCodeFromGstin,
    validateGstinChecksum,
    formatPaiseToRupees,
    rupeesToPaise,
    calculateFinancials,
    calculateSettlement
  };
} else if (typeof window !== "undefined") {
  window.InvoZapCalc = {
    INDIAN_GST_STATES,
    extractStateCodeFromGstin,
    validateGstinChecksum,
    formatPaiseToRupees,
    rupeesToPaise,
    calculateFinancials,
    calculateSettlement
  };
}
