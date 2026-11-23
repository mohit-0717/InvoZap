/**
 * InvoZap - Paste Items List Parser Engine
 * 
 * Extracts line items, quantities, and prices from unformatted multi-line text strings.
 * Strictly extracts items ONLY. Never touches client names, states, or dates.
 * Zero dependencies, dual-export (Browser & Node.js).
 */

(function (root, factory) {
  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = factory();
  } else {
    root.InvoZapAiDraft = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /**
   * Fast, reliable parser for raw line items, quantities, and prices ONLY.
   * Handles:
   *  - "2 ESP32 -- 410rs"
   *  - "LOAD CELL + HX711 -- 200rs"
   *  - "MPU6050 -- 150rs"
   *  - "3 BREAD BOARD (800 pin) -- 80rs"
   *  - "Jumper wires 2₹ per piece"
   * 
   * @param {string} text - Raw items text
   * @returns {Array<{description: string, quantity: number, price: number}>}
   */
  function parseItemsList(text) {
    if (!text || typeof text !== "string") return [];

    return text
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        // 1. Strip leading bullet / numbering (e.g. '1. ', '2) ', '- ', '* ', '• ')
        let clean = line.replace(/^\s*(?:[-*•]+|\d+[\.\)][\s\-]*)\s*/, "").trim();
        if (!clean) clean = line.trim();

        // 2. Extract price (supporting end-of-line suffixes like 'per piece', '/pc', 'each', '/-', 'rs', etc.)
        let price = 0;
        let desc = clean;

        const priceRegex = /(?:[-:–—@=]|\bfor\b|\bat\b)?\s*(?:(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)|([\d,]+(?:\.\d{1,2})?)\s*(?:₹|rs\.?|rupees|inr|\/-)?|(\d+(?:\.\d+)?)\s*k\b)(?:\s*(?:per\s+[a-zA-Z]+|\/[a-zA-Z]+|each|piece|pc|item))?\s*$/i;
        const match = desc.match(priceRegex);

        if (match) {
          if (match[1]) price = parseFloat(match[1].replace(/,/g, "")) || 0;
          else if (match[2]) price = parseFloat(match[2].replace(/,/g, "")) || 0;
          else if (match[3]) price = (parseFloat(match[3]) || 0) * 1000;
          desc = desc.slice(0, match.index).replace(/[-:–—@=]+$/, "").trim();
        }

        // 3. Extract quantity from start of description (e.g. '2 ESP32', '3x BREAD BOARD', '10 pcs Sensor')
        let qty = 1;
        // Do not treat component models like 2S BMS, 5V Relay, 32GB SD as quantities:
        const qtyMatch = desc.match(/^(\d+)\s*(?:x\s+|pcs?\s+|pieces?\s+|nos?\s+|\s+)(?!v\b|s\b|w\b|a\b|pin\b|mhz\b|ghz\b|k\b|gb\b|mb\b)(.+)$/i);
        if (qtyMatch && qtyMatch[2].trim().length > 0) {
          qty = parseInt(qtyMatch[1], 10) || 1;
          desc = qtyMatch[2].trim();
        }

        return {
          description: desc || clean,
          quantity: qty || 1,
          price: price || 0
        };
      })
      .filter(item => item.description.length > 0);
  }

  /**
   * Compatibility wrapper mapping raw text to an items draft.
   * Strictly extracts items ONLY without modifying client or state.
   */
  function parseBriefToDraft(briefText, docType) {
    const items = parseItemsList(briefText);
    return {
      clientName: "",
      buyerStateCode: "27",
      items: items,
      assumptions: [],
      summary: `Extracted ${items.length} line items.`
    };
  }

  return {
    parseBriefToDraft: parseBriefToDraft,
    parseItemsList: parseItemsList
  };
});
