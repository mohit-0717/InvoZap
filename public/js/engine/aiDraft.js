/**
 * InvoZap - AI Brief-to-Draft Parser (Beta)
 * Implements Technical Product Specification (Spec F7)
 * "Paste the brief. Send the invoice."
 * 
 * Signature feature for Indian freelancers and micro-agencies:
 * Parses unstructured client briefs, emails, or WhatsApp messages into:
 * 1. Client / Company Name
 * 2. Scope of Work & Billable Line Items (Qty, Unit Price)
 * 3. State & Place of Supply (auto-mapped to GST state codes)
 * 4. Transparent, confirmable Amber Assumption Chips (with risk rating & reasons)
 * 
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

  // City / State Keyword Mapping to 2-Digit Indian GST State Codes
  const REGION_KEYWORD_MAP = {
    mumbai: "27",
    pune: "27",
    nagpur: "27",
    maharashtra: "27",
    bangalore: "29",
    bengaluru: "29",
    karnataka: "29",
    delhi: "07",
    "new delhi": "07",
    gurgaon: "06",
    gurugram: "06",
    haryana: "06",
    noida: "09",
    lucknow: "09",
    "uttar pradesh": "09",
    hyderabad: "36",
    telangana: "36",
    chennai: "33",
    "tamil nadu": "33",
    kolkata: "19",
    "west bengal": "19",
    ahmedabad: "24",
    surat: "24",
    gujarat: "24",
    jaipur: "08",
    rajasthan: "08",
    kochi: "32",
    kerala: "32",
    chandigarh: "04"
  };

  /**
   * Parses an unstructured text brief or WhatsApp message into an invoice or quotation draft.
   * 
   * @param {string} briefText - Raw text brief
   * @param {string} docType - 'invoice' | 'quotation'
   * @returns {object} { client, items, buyerStateCode, assumptions, summary }
   */
  function parseBriefToDraft(briefText, docType) {
    if (!briefText || typeof briefText !== "string") {
      return null;
    }

    const text = briefText.trim();
    const assumptions = [];
    const items = [];
    let clientName = "";
    let buyerStateCode = "27"; // Default Maharashtra

    // --- 1. DETECT CLIENT / BUYER NAME ---
    // Common patterns: "Bill to: XYZ", "Bill XYZ", "Invoice to: XYZ", "Client: XYZ", "For: XYZ"
    const billToMatch = text.match(/(?:bill(?:\s+to)?|invoice(?:\s+to)?|quote(?:\s+for)?|client(?:\s+name)?|company)\s*[:\-]?\s*([A-Za-z0-9\s&.'-]{3,35}?)(?:\s+(?:in|at|from)\b|\s+for\b|\n|\r|\.|$|,)/i);
    if (billToMatch && billToMatch[1]) {
      let rawClient = billToMatch[1].trim();
      rawClient = rawClient.replace(/^(?:bill(?:\s+to)?|invoice(?:\s+to)?|quote(?:\s+for)?|for)\s+/i, "").trim();
      rawClient = rawClient.replace(/\s+(?:in|at|from)\s+[A-Za-z\s]+$/i, "").trim();
      clientName = rawClient;
      assumptions.push({
        id: "asm_client_name",
        field: "clientName",
        value: clientName,
        category: "client",
        risk: "low",
        reason: `Extracted from "${billToMatch[0].trim()}"`
      });
    } else {
      // Look for capitalised corporate suffix (Pvt Ltd, LLC, Technologies, Studio, Solutions, Inc)
      const corpMatch = text.match(/([A-Z][A-Za-z0-9\s&]{2,25}(?:Pvt\s*Ltd|LLP|Inc|Enterprises|Technologies|Solutions|Media|Studio|Agency|Corporation|Corp))/i);
      if (corpMatch && corpMatch[1]) {
        clientName = corpMatch[1].trim();
        assumptions.push({
          id: "asm_client_name",
          field: "clientName",
          value: clientName,
          category: "client",
          risk: "low",
          reason: `Detected business entity name "${clientName}" in text.`
        });
      } else {
        clientName = "Valued Client";
        assumptions.push({
          id: "asm_client_name",
          field: "clientName",
          value: clientName,
          category: "client",
          risk: "high",
          reason: "Could not detect specific client name in brief. Used default placeholder."
        });
      }
    }

    // --- 2. DETECT REGION / GST PLACE OF SUPPLY ---
    const lowerText = text.toLowerCase();
    let detectedCityOrState = null;
    for (const [region, code] of Object.entries(REGION_KEYWORD_MAP)) {
      if (lowerText.includes(region)) {
        buyerStateCode = code;
        detectedCityOrState = region;
        break;
      }
    }

    if (detectedCityOrState) {
      assumptions.push({
        id: "asm_state_code",
        field: "buyerStateCode",
        value: buyerStateCode,
        category: "tax",
        risk: "low",
        reason: `Mapped detected location "${detectedCityOrState}" to GST State Code ${buyerStateCode}.`
      });
    } else {
      assumptions.push({
        id: "asm_state_code",
        field: "buyerStateCode",
        value: buyerStateCode,
        category: "tax",
        risk: "low",
        reason: "No location mentioned. Assumed intra-state supply (Maharashtra 27)."
      });
    }

    // --- 3. PARSE LINE ITEMS & PRICING ---
    // Comprehensive Money Regex:
    // 1) Prefix: ₹410, Rs. 410, Rs 410, INR 410
    // 2) Suffix: 410rs, 410 rs, 410/-, 410 rupees, 410 inr
    // 3) K suffix: 15k, 12.5k
    // 4) Separator with plain digits: -- 410, - 410, : 410, @ 410
    const moneyPattern = /(?:(?:--|-|:|@|=|\bat\b)?\s*(?:(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)|([\d,]+(?:\.\d{1,2})?)\s*(?:rs\.?|rupees|inr|\/-|\/pc|\/item)\b|(\d+(?:\.\d+)?)\s*k\b|(?:--|-|:|@)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:\n|\r|$)))/i;

    // Split text into semantic clauses (by newline, semicolon, or 'and' before price)
    const rawClauses = text
      .split(/(?:\r?\n|;|\band\b(?=\s+[\w\s]+(?:₹|rs|\d+k|--|-|:|@|\bfor\b)))/i)
      .map(c => c.trim())
      .filter(Boolean);

    rawClauses.forEach(function (rawClause) {
      // Strip greetings and introductory preambles (e.g. "bill MitAOE in Pune for ")
      let clause = rawClause.replace(/^(?:hi|hello|dear)?\s*[a-z0-9\s,.'-]*?\b(?:bill(?:\s+to)?|invoice(?:\s+to)?|quote(?:\s+for)?|create|scope(?:\s+is)?)\s+.*?\bfor\s+/i, "");
      clause = clause.replace(/^(?:bill(?:\s+to)?|invoice(?:\s+to)?|quote(?:\s+for)?)\s+.*?\bfor\s+/i, "");

      const moneyMatch = clause.match(moneyPattern);
      if (moneyMatch) {
        let amount = 0;
        if (moneyMatch[1]) {
          amount = parseFloat(moneyMatch[1].replace(/,/g, ""));
        } else if (moneyMatch[2]) {
          amount = parseFloat(moneyMatch[2].replace(/,/g, ""));
        } else if (moneyMatch[3]) {
          amount = parseFloat(moneyMatch[3]) * 1000;
        } else if (moneyMatch[4]) {
          amount = parseFloat(moneyMatch[4].replace(/,/g, ""));
        }

        if (amount > 0) {
          // Clean up description
          let desc = clause
            .replace(moneyMatch[0], "")
            .replace(/[\s.]*\b(?:net\s*\d+\s*days?|payment\s*terms?.*|thanks!?|regards?.*)[\s.]*$/i, "")
            .replace(/^(?:scope of work|scope|deliverables|task)\s*[:\-]\s*/i, "")
            .replace(/^[-*•\s]*(?:\d+[\.\)\-:]\s*|[-*•]\s*)/, "")
            .replace(/\b(?:each|costing|priced|rate|at|for|please)\b/gi, "")
            .replace(/[\s\-–—:@=.]+$|^[\s\-–—:@=.]+/, "")
            .replace(/\s{2,}/g, " ")
            .trim();

          // Default quantity is 1 if not mentioned
          let qty = 1;

          // Detect leading quantity (e.g. "3 landing pages", but NOT "2S BMS")
          const leadingQtyMatch = desc.match(/^(\d+)\s+(.+)$/);
          if (leadingQtyMatch && leadingQtyMatch[2].length >= 3) {
            qty = parseInt(leadingQtyMatch[1], 10);
            desc = leadingQtyMatch[2].trim();
          } else {
            // Explicit tag (e.g. "qty: 3", "x 3", "3 pcs")
            const explicitQtyMatch = desc.match(/(?:qty\s*[:\-]?\s*|\bx\s*)(\d+)\b|\b(\d+)\s*(?:nos|pcs|units|items)\b/i);
            if (explicitQtyMatch) {
              qty = parseInt(explicitQtyMatch[1] || explicitQtyMatch[2], 10);
              desc = desc.replace(explicitQtyMatch[0], "").replace(/[\s\-–—:@=]+$/, "").trim();
            }
          }

          if (!desc || desc.length < 2) {
            desc = "Item / Component";
          }

          items.push({
            description: desc,
            quantity: qty,
            price: amount
          });
        }
      }
    });

    // If no explicit line items were detected from lines, check overall text for currency amounts
    if (items.length === 0) {
      const allMoney = Array.from(text.matchAll(/(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)|(\d+(?:\.\d+)?)\s*k\b/gi));
      if (allMoney.length > 0) {
        allMoney.forEach(function (m, idx) {
          let amt = 0;
          if (m[1]) amt = parseFloat(m[1].replace(/,/g, ""));
          else if (m[2]) amt = parseFloat(m[2]) * 1000;

          if (amt > 0) {
            items.push({
              description: `Project Milestone / Deliverable Phase ${idx + 1}`,
              quantity: 1,
              price: amt
            });
          }
        });
        assumptions.push({
          id: "asm_items_milestones",
          field: "items",
          value: `${items.length} deliverables`,
          category: "pricing",
          risk: "low",
          reason: `Grouped detected payment amounts into ${items.length} deliverables.`
        });
      } else {
        // Fallback default sample item
        items.push({
          description: "Service Implementation / Scope Execution",
          quantity: 1,
          price: 10000
        });
        assumptions.push({
          id: "asm_items_fallback",
          field: "items",
          value: "₹10,000",
          category: "pricing",
          risk: "high",
          reason: "No currency amounts found in brief. Inserted ₹10,000 baseline milestone."
        });
      }
    } else {
      assumptions.push({
        id: "asm_items_extracted",
        field: "items",
        value: `${items.length} line item(s)`,
        category: "pricing",
        risk: "low",
        reason: `Successfully parsed ${items.length} billable line item(s) from brief.`
      });
    }

    return {
      clientName: clientName,
      buyerStateCode: buyerStateCode,
      items: items,
      assumptions: assumptions,
      briefPreview: text.length > 80 ? text.substring(0, 77) + "..." : text
    };
  }

  /**
   * Fast, reliable parser for raw line items and prices.
   * Format: "Description - Price" or "Qty Description Price" (one per line)
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
        let clean = line.replace(/^[-*•\d\.\)\s]+/, "").trim(); // strip leading bullet/numbering
        if (!clean) clean = line.trim();

        // Recognize price at the end or following a separator:
        // Handles: - ₹15,000 | : 25000 | = 5000 | 15k | 500/- | Rs. 4000
        const priceMatch = clean.match(/(?:[-:–—@=]|\bfor\b)?\s*(?:(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)|([\d,]+(?:\.\d{1,2})?)\s*(?:rs\.?|rupees|inr|\/-)?|(\d+(?:\.\d+)?)\s*k\b)\s*$/i);

        let price = 0;
        let desc = clean;

        if (priceMatch) {
          if (priceMatch[1]) price = parseFloat(priceMatch[1].replace(/,/g, "")) || 0;
          else if (priceMatch[2]) price = parseFloat(priceMatch[2].replace(/,/g, "")) || 0;
          else if (priceMatch[3]) price = (parseFloat(priceMatch[3]) || 0) * 1000;
          desc = clean.slice(0, priceMatch.index).replace(/[-:–—@=]+$/, "").trim();
        }

        // Detect leading quantity: e.g. "2x Landing Page" or "3 Consultations"
        let qty = 1;
        const qtyMatch = desc.match(/^(\d+)\s*(?:x\s+|\s+)(.+)$/i);
        if (qtyMatch && qtyMatch[2].length >= 3 && !/^\d+[A-Za-z]/.test(qtyMatch[0])) {
          qty = parseInt(qtyMatch[1], 10);
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

  return {
    parseBriefToDraft: parseBriefToDraft,
    parseItemsList: parseItemsList
  };
});
