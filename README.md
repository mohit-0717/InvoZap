# InvoZap

> **GST-Compliant Invoicing & Quotation Studio for Indian Freelancers & SMBs**

**Quick Links:**
* 🎬 **[Live 2-Minute Demonstration Script & Viva Cheat Sheet](DEMO_GUIDE.md)**
* 📑 **[Technical Viva & Code Defense Reference Sheet](EXPLANATION_SHEET.md)**
* 🌐 **[Live Cloud Site](https://invozap-eta.vercel.app)**

InvoZap is a lightweight, zero-dependency frontend, high-integrity financial invoicing application built specifically for the Indian business ecosystem. It enforces strict integer arithmetic for all tax and ledger computations, automatically resolves GST regimes (intra-state CGST+SGST vs. inter-state IGST), guarantees monotonic Financial Year sequence numbers without gaps, renders scannable UPI QR codes, and includes a multi-factor pre-send quality audit engine.

---

## Architecture & Tech Stack

- **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3. Zero frontend frameworks, zero build steps, zero client bundling overhead.
- **Backend:** Node.js & Express 4 REST API.
- **Database:** MongoDB Atlas via Mongoose 8 with optimistic concurrency control (`optimisticConcurrency: true`).
- **Security Middleware:** `helmet` for secure HTTP headers, `express-rate-limit` for DDoS/brute-force throttling.
- **Financial & Business Engines:** Isolated, pure JS engines shared between client and server (`calc.js`, `numbering.js`, `upi.js`, `checker.js`, `briefParser.js`).

---

## Core Financial & Engineering Features

### 1. Integer-Paise Math (`public/js/engine/calc.js`)
- All currency calculations convert floating-point user inputs to integer paise immediately.
- Eliminates standard IEEE 754 floating-point errors (e.g., `0.1 + 0.2 !== 0.3`).
- Indian GST round-half-up: `Math.floor((paise * rate) / 10000 + 0.5)`.
- Support for fractional quantities (e.g., 0.5 hours or kg) without precision loss.
- Indian currency amount in words (Crores, Lakhs, Thousands, Hundreds, and Paise).

### 2. Dual GST Tax Regime Detection
- Compares seller state code and buyer state code (extracted from state dropdown or the first two digits of GSTIN).
- **Intra-State (Same State):** Automatically splits tax into equal CGST (50%) and SGST (50%).
- **Inter-State (Different States):** Applies full tax rate as IGST (100%).
- State codes are validated against the official GST state directory (01–38, 97).
- Full Mod-36 check-digit validation for GSTIN integrity.

### 3. Gapless Financial Year Numbering (`public/js/engine/numbering.js`)
- Follows Indian FY convention: 1st April to 31st March (e.g., `INV/2026-27/0001`).
- Atomic sequence increments via MongoDB `SequenceCounter.findOneAndUpdate({ $inc: { lastSeq: 1 } })`.
- Draft invoices do **not** consume numbers until official issue time. Deleted drafts never create gaps in the issued sequence.

### 4. Spec F8 Pre-Send Quality Checker (`public/js/engine/checker.js`)
- Audits invoice drafts before issuance across 12 automated checks.
- **Blockers:** Missing seller/client name, missing state code when tax > 0, zero unit prices, negative quantities.
- **Warnings:** Missing due date, missing payment details, GSTIN state code mismatch.

### 5. Multi-Payment & TDS Ledger (`public/js/engine/calc.js`)
- Tracks multiple payment entries against an invoice with support for direct receipts and Section 194J/194C TDS credits.
- Rejects overpayments: payments exceeding the remaining balance return HTTP 400.
- Payment idempotency keys prevent double-charge/duplicate submission issues.
- Invoices transition cleanly: `Draft` &rarr; `Unpaid` &rarr; `Partial` &rarr; `Paid`.

### 6. Secure SHA-256 Public Share Links (`server/routes/shareRoutes.js`)
- Ephemeral, revokable public links generated with 32-byte cryptographic random tokens.
- Server stores only the SHA-256 hash of the token.
- Token is delivered via the URL fragment (`#token`), preventing it from leaking into server access logs, web proxies, or `Referer` headers.
- Public endpoint returns a sanitized DTO (internal owner ID, audit logs, and private user fields excluded).

### 7. Cross-Device Client Directory
- Signed-in users save reusable client profiles through authenticated `/api/clients` endpoints.
- Profiles include contact details, GSTIN, and state code, and are available in both invoice and quotation editors.
- The editor retains a device-local copy so guest users and temporarily offline users can still complete documents.

### 8. Bookkeeping CSV Exports
- The History page exports invoice registers and a separate payment/TDS ledger as UTF-8 CSV files.
- Signed-in users export their server ledger; guest and offline users export locally saved records.

### 9. Payment Follow-up Reminders
- Unpaid and partially paid invoices with a saved client phone number show a WhatsApp reminder action in History.
- InvoZap opens a pre-filled reminder for the user to review and send; it does not send messages automatically.

### 10. Product and Service Catalog
- Signed-in users save reusable products and services through authenticated `/api/catalog` endpoints.
- The invoice and quotation editors add saved descriptions and default prices directly as line items.
- Catalog records also retain the unit, HSN/SAC code, and default GST rate for future reporting and tax workflows.

### 11. Line-Level GST and HSN/SAC
- Each item can retain its HSN/SAC code, unit, and GST rate when added from the catalog.
- Invoice and quotation tax totals are calculated in integer paise for each line before being aggregated into CGST/SGST or IGST totals.

### 12. Credit and Debit Notes
- Issued invoices can receive immutable credit or debit notes with an amount and reason.
- The original invoice total remains preserved while the effective balance is recalculated against active payments and TDS credits.

### 13. Client Statements of Account (`server/routes/clientRoutes.js` & `public/history.js`)
- Generates a full chronological ledger for any client across custom date ranges (with presets for "All Time", "This FY", and "Last 30 Days").
- Combines issued invoices (debits), payments received (credits), Section 194J/194C TDS credits, and credit/debit adjustment notes.
- Computes opening balance (rolled forward from prior periods), period debits, period credits, and closing balance due in integer paise.
- Same-day tie-breaker ensures debits post before credits to prevent transient negative ledger states.
- Strictly excludes unissued drafts (`Draft`) and voided documents (`Void`).
- Dual-mode architecture: authenticated users query `/api/clients/statement`, while guest/offline users compute statements directly from local storage.
- Exports printable official A4 PDF statements and standard RFC 4180 CSV files with UTF-8 BOM.

### 14. Google Sign-In & Single Sign-On (SSO) (`server/routes/authRoutes.js` & `public/auth.html`)
- One-click Google authentication powered by Google Identity Services (GSI) with official 4-color Google branding.
- Server-side ID token verification via Google OAuth2 tokeninfo validation (`https://oauth2.googleapis.com/tokeninfo`).
- Automatically creates new user accounts or seamlessly links Google identity to existing email accounts.
- Issues standard InvoZap HS256 JWT tokens for unified cross-device API authorization.
- Preserves Google profile avatars in document editor navbars.
- Includes automated mock/test credential support for deterministic offline CI testing.

---

## Getting Started

### Prerequisites
- Node.js (v18.x or v20.x recommended)
- MongoDB Atlas cluster or local MongoDB instance

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/InvoZap.git
cd InvoZap

# Install backend dependencies
npm install
```

### Environment Configuration
Create a `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/invozap?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
CLIENT_URL=http://localhost:5000
NODE_ENV=production
```

### Running Tests
The project contains 161 automated unit and integration tests (63 pure engine unit tests + 98 mock route integration tests):
```bash
npm test
```

### Starting the Server
```bash
npm start
```
Open your browser and navigate to `http://localhost:5000`.

---

## Security Posture & Known Limitations

- **XSS Sanitization:** All user text is populated safely using DOM properties (`.textContent`, `.value`) or escaped with `esc()` / `escAttr()`.
- **HTTP Security Headers & Rate Limiting:** Powered by `helmet` with security headers. Rate limiting is enforced on auth (`/api/auth` at 30 req / 15 min) and public share views (`/api/share/view` at 120 req / 15 min).
- **Concurrency Control:** Mongoose `optimisticConcurrency: true` detects concurrent document mutations and returns HTTP 409 Conflict.
- **Client Token Storage:** The auth JWT is held in `localStorage`. Helmet CSP is disabled to accommodate inline page scripts, and `shared.html` employs a CSP with `'unsafe-inline'`.
- **Guest client directory:** Profiles saved without signing in remain in browser storage and do not automatically sync when the user later signs in.
- **Test Infrastructure:** Route tests execute against an in-memory document store to validate business logic without external database dependencies; production verification should run concurrent updates against live MongoDB Atlas.
- **Advisory:** GST tax calculations and invoice rules are built to Indian standard conventions but have not been audited by a Chartered Accountant; the natural language brief parser uses deterministic regex heuristics.
