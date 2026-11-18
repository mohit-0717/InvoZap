# InvoZap - Live Demonstration & Presentation Guide

This guide gives you an effortless, step-by-step walkthrough to present and demonstrate InvoZap in **2 to 3 minutes**.

---

## ⚡ Quick Links & Launch Options

* **Live Cloud Deployment:** [`https://invozap-eta.vercel.app`](https://invozap-eta.vercel.app)
* **Local Run:**
  ```bash
  npm start
  # Opens at http://localhost:5000
  ```
* **Run All 161 Tests:**
  ```bash
  npm test
  ```

---

## 🎬 2-Minute Step-by-Step Demonstration Script

### Step 1: Landing Page & Instant Start (15 seconds)
1. Open [`index.html`](http://localhost:5000) or the live link.
2. **What to say:**  
   > *"InvoZap is a high-integrity GST invoicing and billing studio built specifically for the Indian business ecosystem. It features zero client bundling overhead, integer-paise math, and dual offline/cloud capability."*
3. Click the top button **"+ New Invoice"** (or **"✨ Create Invoice"**).

---

### Step 2: The Navbar Profile & Catalog Manager (25 seconds)
1. In the top right navbar, click the **Profile Pill** (e.g. `[👤 Mohit ▾]`).
2. Show the two clean options:
   * **`👤 Personal & Business Details`:** Click it to show how users save their business name, GSTIN, registered state, and instant UPI ID.
   * **`📦 Product & Service Catalog`:** Click it to show saved services with prices, HSN/SAC codes, and GST rates. Show how easy it is to add or delete items in 1 click.
3. **What to say:**  
   > *"Everything is simple and native. Users can configure their business profile and manage standard service catalogs right from the navbar."*

---

### Step 3: Creating an Invoice with Auto-GST & Live Preview (40 seconds)
1. On the **Invoice Studio** (`createnew.html`), point out the split-pane:  
   * **Left Pane:** Fast Form Controls.  
   * **Right Pane:** Live, printer-ready A4 Invoice Sheet.
2. **Demonstrate 1-Click Catalog Auto-Fill:**  
   Under *Invoice Items*, pick an item from the **`⚡ Catalog`** dropdown and click **"+ Add to Invoice"**. The row instantly populates with the description, price, unit, and tax.
3. **Demonstrate Auto GST Regime Detection:**  
   * Notice the green badge: `📍 Intra-State Supply (CGST 9% + SGST 9% applied)`.
   * Change *Buyer State* to **29 - Karnataka** (or type a GSTIN starting with `29`).
   * The badge dynamically changes to blue: `🌐 Inter-State Supply (IGST 18% applied)`, and the preview sheet instantly switches from CGST+SGST to IGST.
4. **Demonstrate Scannable UPI QR Code:**  
   Scroll down the preview sheet to show the vector UPI QR code:
   > *"The QR code is rendered 100% offline as an SVG using NPCI's official UPI standard. Any Indian UPI app can scan it to pay the exact invoice amount directly."*

---

### Step 4: Streamlined Quality Checker (20 seconds)
1. Right below the items, point out the **Quality Checker bar**: `🔍 Quality Checker • [PASSED] ▾`.
2. Click it to expand: Show how it verifies 12 financial and compliance rules (e.g., GSTIN state match, payment details, due dates).
3. **What to say:**  
   > *"Before sending an invoice, InvoZap automatically audits it against Indian GST regulations to ensure it's 100% legally compliant."*

---

### Step 5: Save, Records & CSV Export (25 seconds)
1. Click **"💾 Save Invoice"**.
2. Navigate to **History** (`recents.html`):
   * Show the invoice listed with its monotonic FY number (e.g. `INV/2026-27/0001`).
   * Show the 1-click **"📥 Export Invoices CSV"** button that downloads the full tax invoice register for Excel / CA audits.
3. **What to say:**  
   > *"InvoZap maintains clean historical records for invoices and quotations, with 1-click CSV export ready for accounting and GST filing."*

---

## 🧠 Key Viva / Examiner Q&A Cheat Sheet

| Question | Strong, 1-Sentence Answer |
| :--- | :--- |
| **Why not use standard floating-point math?** | *"JavaScript floats have binary rounding errors like `0.1 + 0.2 !== 0.3`. InvoZap calculates everything in integer paise with round-half-up math so taxes match Chartered Accountant standards down to the exact paisa."* |
| **How does InvoZap determine CGST/SGST vs IGST?** | *"By comparing the 2-digit state code of the seller and buyer (auto-extracted from the first 2 digits of the GSTIN). Equal codes trigger CGST+SGST (Intra-state); differing codes trigger IGST (Inter-state)."* |
| **What happens if a draft invoice is deleted?** | *"Drafts use temporary IDs. Official sequential numbers like `INV/2026-27/0001` are allocated atomically only upon final issue, ensuring zero gaps in the Financial Year sequence."* |
| **Does the UPI QR code depend on an external API?** | *"No. It contains an in-browser Reed-Solomon Galois Field engine that generates standalone vector SVG QR codes 100% offline with zero third-party data tracking."* |
| **How is the app deployed?** | *"The backend Express API runs serverlessly on Vercel with MongoDB Atlas, and the frontend is zero-dependency vanilla JS/HTML5 with zero build overhead."* |

---

## 📁 Project Directory Map

* **`public/`** &rarr; Frontend web application (pages, CSS styles, and pure JS engines).
  * `createnew.html` & `script.js` &rarr; Invoice creation and live preview.
  * `quotation.html` & `quotation.js` &rarr; Quotation generation and 1-click conversion to invoice.
  * `recents.html` & `history.js` &rarr; Past records, payments, TDS credits, and client statements.
  * `analytics.html` &rarr; Business receivables and revenue analytics.
  * `js/onboarding.js` &rarr; Navbar profile dropdown and product catalog manager.
  * `js/engine/` &rarr; Core mathematical engines (`calc.js`, `numbering.js`, `upi.js`, `checker.js`).
* **`server/`** &rarr; Backend Express REST API and Mongoose schemas.
* **`test_engines.js`** &rarr; 63 unit tests for financial math, GST, and numbering.
* **`test_routes.js`** &rarr; 98 integration tests for REST routes, auth, and concurrency.
