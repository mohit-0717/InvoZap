/**
 * InvoZap - Indian Financial Year (FY) Numbering Engine
 * Implements Technical Product Specification (Spec F4)
 * Format: {PREFIX}/{FY}/{SEQ4} -> e.g. "INV/2026-27/0001" or "QT/2026-27/0001"
 * 
 * Rules:
 * - Indian Financial Year runs from 1st April to 31st March.
 * - Sequence is 4-digit zero padded (0001, 0002...).
 * - Auto-resets sequence when crossing into a new financial year.
 * - Zero dependencies, dual-export (Browser & Node.js).
 */

(function (root, factory) {
  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = factory();
  } else {
    root.InvoZapNumbering = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /**
   * Calculates the Indian Financial Year string (e.g. "2026-27") for any given date.
   * @param {Date|string} dateInput - Date object or ISO date string (YYYY-MM-DD)
   * @returns {string} Financial Year string (e.g. "2026-27")
   */
  function calculateIndianFinancialYear(dateInput) {
    let d = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(d.getTime())) d = new Date();

    const year = d.getFullYear();
    const month = d.getMonth() + 1; // 1 to 12

    // Indian FY starts on April 1st (month >= 4)
    if (month >= 4) {
      const nextYearTwoDigits = String((year + 1) % 100).padStart(2, "0");
      return `${year}-${nextYearTwoDigits}`;
    } else {
      const prevYear = year - 1;
      const currentYearTwoDigits = String(year % 100).padStart(2, "0");
      return `${prevYear}-${currentYearTwoDigits}`;
    }
  }

  /**
   * Parses an invoice or quotation document number.
   * Recognizes standard "PREFIX/YYYY-YY/0001" as well as legacy formats.
   * @param {string} docNumber 
   * @returns {object|null}
   */
  function parseDocumentNumber(docNumber) {
    if (!docNumber || typeof docNumber !== "string") return null;
    const trimmed = docNumber.trim();

    // Regex for standard FY format: (INV|QT|...)/(YYYY-YY)/(\d+)
    const match = trimmed.match(/^([A-Za-z0-9_-]+)\/(\d{4}-\d{2})\/(\d+)$/);
    if (match) {
      return {
        prefix: match[1],
        fy: match[2],
        seq: parseInt(match[3], 10),
        seqFormatted: match[3],
        formatted: trimmed,
        isStandardFy: true
      };
    }

    // Fallback for legacy format: e.g. "INV-1001" or "QT-1001"
    const legacyMatch = trimmed.match(/^([A-Za-z0-9_-]+)-(\d+)$/);
    if (legacyMatch) {
      return {
        prefix: legacyMatch[1],
        fy: null,
        seq: parseInt(legacyMatch[2], 10),
        seqFormatted: legacyMatch[2],
        formatted: trimmed,
        isStandardFy: false
      };
    }

    return {
      prefix: "DOC",
      fy: null,
      seq: 1,
      seqFormatted: "0001",
      formatted: trimmed,
      isStandardFy: false
    };
  }

  /**
   * Helper to access monotonic sequence storage key
   */
  function getCounterStorageKey(prefix, fy) {
    return `invozap_hwm_${prefix}_${fy}`;
  }

  /**
   * Reads the persistent monotonic sequence high-water mark.
   */
  function getHighWaterMark(prefix, fy, storageAdapter) {
    const key = getCounterStorageKey(prefix, fy);
    try {
      if (storageAdapter && typeof storageAdapter.getItem === "function") {
        return parseInt(storageAdapter.getItem(key) || "0", 10) || 0;
      }
      if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
        return parseInt(window.localStorage.getItem(key) || "0", 10) || 0;
      }
    } catch (e) {}
    return 0;
  }

  /**
   * Records that a sequence number has been allocated/issued,
   * guaranteeing it is NEVER reused even if the document is subsequently deleted.
   */
  function commitAllocatedSequence(docType, seq, customPrefix, dateInput, storageAdapter) {
    const typeStr = String(docType || "").toLowerCase();
    const isQuotation = typeStr.includes("quot") || typeStr.includes("qt");
    const defaultPrefix = isQuotation ? "QT" : "INV";
    const prefix = (customPrefix || defaultPrefix).toUpperCase().trim();
    const currentFy = calculateIndianFinancialYear(dateInput);
    const key = getCounterStorageKey(prefix, currentFy);

    const currentHwm = getHighWaterMark(prefix, currentFy, storageAdapter);
    const newHwm = Math.max(currentHwm, parseInt(seq, 10) || 0);

    try {
      if (storageAdapter && typeof storageAdapter.setItem === "function") {
        storageAdapter.setItem(key, String(newHwm));
      } else if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
        window.localStorage.setItem(key, String(newHwm));
      }
    } catch (e) {}
    return newHwm;
  }

  /**
   * Generates the next sequential document number for the specified type and date.
   * Monotonically increases based on BOTH existing records AND the persistent high-water mark counter.
   * 
   * @param {string} docType - 'invoice' | 'quotation'
   * @param {Array<object>} existingRecords - Array of existing invoices or quotations
   * @param {string} customPrefix - Optional custom prefix (default: 'INV' for invoice, 'QT' for quotation)
   * @param {Date|string} dateInput - Issue date of the document
   * @param {object} storageAdapter - Optional custom storage (e.g. for Node.js tests)
   * @returns {string} e.g. "INV/2026-27/0001"
   */
  function getNextDocumentNumber(docType, existingRecords, customPrefix, dateInput, storageAdapter) {
    const typeStr = String(docType || "").toLowerCase();
    const isQuotation = typeStr.includes("quot") || typeStr.includes("qt");
    const defaultPrefix = isQuotation ? "QT" : "INV";
    const prefix = (customPrefix || defaultPrefix).toUpperCase().trim();
    const currentFy = calculateIndianFinancialYear(dateInput);

    let maxSeq = 0;
    const records = Array.isArray(existingRecords) ? existingRecords : [];

    records.forEach(function (rec) {
      const docNo = rec.invoiceNumber || rec.quotationNumber || rec.number?.formatted || rec.number || "";
      const parsed = parseDocumentNumber(docNo);
      if (parsed && parsed.isStandardFy && parsed.fy === currentFy && parsed.prefix === prefix) {
        if (parsed.seq > maxSeq) {
          maxSeq = parsed.seq;
        }
      }
    });

    // Check persistent monotonic counter so deleting an invoice never rolls back the sequence
    const highWaterMark = getHighWaterMark(prefix, currentFy, storageAdapter);
    const effectiveMax = Math.max(maxSeq, highWaterMark);

    const nextSeq = effectiveMax + 1;
    const nextSeqPadded = String(nextSeq).padStart(4, "0");

    return `${prefix}/${currentFy}/${nextSeqPadded}`;
  }

  return {
    calculateIndianFinancialYear: calculateIndianFinancialYear,
    parseDocumentNumber: parseDocumentNumber,
    getNextDocumentNumber: getNextDocumentNumber,
    commitAllocatedSequence: commitAllocatedSequence,
    getHighWaterMark: getHighWaterMark
  };
});
