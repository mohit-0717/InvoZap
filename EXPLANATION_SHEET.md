# InvoZap - Technical Viva & Code Defense Reference Sheet

This document provides exact file locations, line references, and architectural justifications for the 8 core engineering decisions in InvoZap. Use this during code walkthroughs, design reviews, and technical evaluations.

---

### 1. Integer-Paise Arithmetic (Zero Floating-Point Error)
- **Primary Files:**
  - [`public/js/engine/calc.js`](file:///c:/Users/mohit/Documents/InvoZap/public/js/engine/calc.js#L110-L220)
  - [`public/js/util.js`](file:///c:/Users/mohit/Documents/InvoZap/public/js/util.js#L78-L138)
- **Code Highlights:**
  - `rupeesToPaise(amount)` converts incoming currency to an integer: `Math.round(parseFloat(amount) * 100)`.
  - Line gross: `Math.round(qty * unitPricePaise)`.
  - GST calculation uses statutory Indian round-half-up:
    - Intra-state (CGST 9% + SGST 9%): `cgstPaise = Math.round(taxablePaise * halfRateBasis); sgstPaise = cgstPaise;`
    - Inter-state (IGST 18%): `igstPaise = Math.round(taxablePaise * (effectiveTaxRate / 100));`
  - Fractional quantities (e.g., `0.5 × ₹100 = ₹50.00`) compute exactly to 5,000 paise without IEEE-754 binary floating-point drift.
  - Indian currency words converter `rupeesToWords()` and `paiseToWords()` converts integer amounts into statutory "Rupees ... Only" (handling Lakhs and Crores).

---

### 2. Dual GST Tax Regime Detection & Mod-36 Checksum
- **Primary Files:**
  - [`public/js/engine/calc.js`](file:///c:/Users/mohit/Documents/InvoZap/public/js/engine/calc.js#L14-L95)
  - [`public/js/engine/calc.js`](file:///c:/Users/mohit/Documents/InvoZap/public/js/engine/calc.js#L139-L150)
- **Code Highlights:**
  - Official CBIC master list of all 37 Indian states and Union Territories (`INDIAN_GST_STATES`).
  - `extractStateCodeFromGstin(gstin)` extracts the 2-digit state prefix (e.g., `27AAPFU0939F1ZV` &rarr; `27`).
  - `validateGstinChecksum(gstin)` performs the statutory Mod-36 check-digit verification on the 15th character.
  - Regime assignment logic:
    - `sellerStateCode === buyerStateCode` &rarr; `regime = "intra"` (CGST + SGST).
    - `sellerStateCode !== buyerStateCode` &rarr; `regime = "inter"` (IGST).

---

### 3. Gapless Monotonic Financial Year Numbering
- **Primary Files:**
  - [`public/js/engine/numbering.js`](file:///c:/Users/mohit/Documents/InvoZap/public/js/engine/numbering.js#L27-L125)
  - [`server/routes/invoiceRoutes.js`](file:///c:/Users/mohit/Documents/InvoZap/server/routes/invoiceRoutes.js#L380-L425)
  - [`server/models/SequenceCounter.js`](file:///c:/Users/mohit/Documents/InvoZap/server/models/SequenceCounter.js)
- **Code Highlights:**
  - Indian FY boundary rule: `calculateIndianFinancialYear(date)` checks if month is &ge; 4 (April); if so, `YYYY-(YY+1)`, otherwise `(YYYY-1)-YY`.
  - Atomic sequence allocation:
    ```javascript
    const counter = await SequenceCounter.findOneAndUpdate(
      { owner: req.user.id, prefix: "INV", fy },
      { $inc: { lastSeq: 1 } },
      { new: true, upsert: true }
    );
    ```
  - **Draft Integrity:** Draft invoices hold temporary numbers (`DRAFT-...`). A sequence number is only allocated upon explicit transition to `Issued`. Deleting unissued drafts produces zero sequence gaps.

---

### 4. Pre-Send Quality Audit Engine (Spec F8)
- **Primary Files:**
  - [`public/js/engine/checker.js`](file:///c:/Users/mohit/Documents/InvoZap/public/js/engine/checker.js#L28-L120)
  - [`server/routes/invoiceRoutes.js`](file:///c:/Users/mohit/Documents/InvoZap/server/routes/invoiceRoutes.js#L358-L368)
- **Code Highlights:**
  - `inspectDocument(invoice)` executes 12 financial and statutory compliance checks before issuing.
  - **Hard Blockers (`canSend: false`):**
    - `SELLER_NAME_MISSING` / `CLIENT_NAME_MISSING`
    - `TAX_STATE_MISSING` (Tax charged without determinable seller and buyer state codes)
    - `LINE_PRICE_ZERO` (Any item with &le; 0 unit price)
  - **Soft Warnings:**
    - `NO_DUE_DATE`
    - `NO_PAYMENT_DETAILS` (Missing bank account or UPI VPA)
    - `GSTIN_STATE_MISMATCH` (Selected state code does not match GSTIN prefix)

---

### 5. Multi-Payment Ledger & Overpayment Rejection
- **Primary Files:**
  - [`public/js/engine/calc.js`](file:///c:/Users/mohit/Documents/InvoZap/public/js/engine/calc.js#L250-L318)
  - [`server/routes/invoiceRoutes.js`](file:///c:/Users/mohit/Documents/InvoZap/server/routes/invoiceRoutes.js#L460-L565)
  - [`public/history.js`](file:///c:/Users/mohit/Documents/InvoZap/public/history.js#L180-L240)
- **Code Highlights:**
  - Ledger maintains discrete records for `received` (cash/bank/UPI) and `tds_credit` (Section 194J/194C tax deducted at source).
  - Strict input signature: `calculateSettlement({ totalPaise, payments })`.
  - Overpayment rejection:
    ```javascript
    if (totalSettledPaise > totalPaise) {
      return { error: "OVERPAYMENT_REJECTED", isOverpaid: true };
    }
    ```
  - Payment idempotency: `idempotencyKey` prevents duplicate ledger entries on network retries or double clicks.
  - Void protection: An issued invoice cannot be marked `Void` until all associated payments are explicitly voided first.

---

### 6. Ephemeral SHA-256 Share Links & URL Fragment Privacy
- **Primary Files:**
  - [`server/routes/shareRoutes.js`](file:///c:/Users/mohit/Documents/InvoZap/server/routes/shareRoutes.js#L15-L95)
  - [`server/routes/shareRoutes.js`](file:///c:/Users/mohit/Documents/InvoZap/server/routes/shareRoutes.js#L150-L255)
  - [`public/shared.html`](file:///c:/Users/mohit/Documents/InvoZap/public/shared.html#L165-L175)
- **Code Highlights:**
  - Generates 32-byte cryptographic random token: `crypto.randomBytes(32).toString("hex")`.
  - Storage: Only `hashToken(rawToken)` (SHA-256) is persisted in the database; raw tokens are never saved.
  - Link delivery format: `http://localhost:5000/shared.html#<rawToken>`.
  - **Privacy Guarantee:** The token is in the URL hash fragment (`#`), which the browser never transmits in HTTP headers or access logs. The client extracts it via `window.location.hash` and requests `/api/share/view/:token`.
  - **Whitelist Public DTO:** Excludes internal MongoDB IDs, owner references, and tenant metadata.
  - **1-Second Read Beacon:** `POST /api/share/viewed/:token` fires after 1000ms in the recipient browser to avoid false-positive open marks from automated crawler link previews (WhatsApp/Slack bots).

---

### 7. Zero-Dependency Handcrafted Vector QR Code Generator
- **Primary Files:**
  - [`public/js/engine/upi.js`](file:///c:/Users/mohit/Documents/InvoZap/public/js/engine/upi.js#L25-L45)
  - [`public/js/engine/upi.js`](file:///c:/Users/mohit/Documents/InvoZap/public/js/engine/upi.js#L46-L450)
- **Code Highlights:**
  - Zero external CDN dependencies or bloated bundle libraries.
  - `buildUpiUri()` builds official NPCI URI: `upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...`.
  - **Literal VPA Preservation:** Preserves `@` literally in `pa=` because UPI apps (GPay, PhonePe, Paytm, BHIM) fail to resolve percent-encoded `%40`.
  - Generates crisp standalone vector `<svg>` with full ISO/IEC 18004 standards compliance (Reed-Solomon polynomial math, Galois Field GF(256), Error Correction Level M/Q, and 4-module quiet zone).

---

### 8. Rule-Based Brief-to-Draft AI Engine
- **Primary Files:**
  - [`public/js/engine/aiDraft.js`](file:///c:/Users/mohit/Documents/InvoZap/public/js/engine/aiDraft.js#L15-L180)
- **Code Highlights:**
  - Pure deterministic natural language parser running client-side.
  - City-to-state lookup dictionary: maps cities like "Bangalore" &rarr; `29` (Karnataka), "Pune" / "Mumbai" &rarr; `27` (Maharashtra), "Delhi" &rarr; `07`.
  - Multi-line item recognition: extracts descriptions, quantities, and pricing using regex patterns (`₹4,000 each`, `410rs`, `-- 70`).
  - Generates confirmable **Assumption Chips** allowing user inspection and one-click removal before applying to the draft.
