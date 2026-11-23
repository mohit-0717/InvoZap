# InvoZap - Web Development Project Viva & Technical Defense Guide

> **Target Audience:** College professors, external examiners, and technical evaluators.  
> **Perspective:** Web Development Engineering (HTML5, CSS3, Modern JavaScript ES6+, Web APIs, Client-Server Architecture, Node.js, Express, MongoDB).

---

## Table of Contents
1. [Project Architectural Overview](#1-project-architectural-overview)
2. [Frontend Styling & Visual Effects (CSS3 Deep Dive)](#2-frontend-styling--visual-effects-css3-deep-dive)
   - [Q1: Text Gradients](#q1-how-does-the-text-have-gradient-colors)
   - [Q2: SVG Lucide Icons Implementation](#q2-how-did-you-add-the-lucide-icons)
   - [Q3: Floating / Card Hover Animations](#q3-how-do-cards-float-and-animate-on-hover)
   - [Q4: Card UI Component Construction](#q4-how-is-every-box-card-and-bar-made)
   - [Q5: Split Form & Live Preview Layout](#q5-how-is-the-page-split-into-input-form-and-live-preview)
3. [Client-Side Interactivity & DOM Manipulation (JavaScript ES6+)](#3-client-side-interactivity--dom-manipulation-javascript-es6)
   - [Q6: Instant Real-Time Preview Synchronization](#q6-when-typing-in-the-form-how-does-the-live-preview-update-instantly)
   - [Q7: Dynamic Theme Accent Switching](#q7-how-does-theme-accent-color-selection-work)
   - [Q8: Pure Client-Side UPI QR Code Generation](#q8-how-is-the-upi-qr-code-generated-mathematically)
   - [Q9: Dynamic Row Insertion & Deletion](#q9-how-does-adding-and-removing-invoice-rows-work)
   - [Q10: "Paste Items List" String Parser](#q10-how-does-the-paste-items-feature-parse-bulk-text)
4. [Document Output, Cloud Storage & External Integrations](#4-document-output-cloud-storage--external-integrations)
   - [Q11: Print to PDF Mechanism & CSS Print Rules](#q11-how-does-print--pdf-work-without-external-libraries)
   - [Q12: WhatsApp Link Generation & URL Encoding](#q12-how-does-the-whatsapp-share-feature-work)
   - [Q13: Cloud Persistence (REST API Integration)](#q13-how-does-saving-to-the-cloud-work)
   - [Q14: Client-Side CSV Export (Blob & Object URLs)](#q14-how-does-export-to-csv-work)
5. [Document Management & History Modal Systems](#5-document-management--history-modal-systems)
   - [Q15: History / Records Rendering](#q15-how-does-an-invoice-get-into-history-and-render)
   - [Q16: Modal Dialogs (Invoice Preview Popup)](#q16-what-makes-the-view-button-open-a-popup-modal)
6. [Analytics & Data Aggregation Engine (`analytics.html`)](#6-analytics--data-aggregation-engine-analyticshtml)
   - [Q17: Real-Time Metric Aggregation](#q17-how-do-the-analytics-summary-cards-update)
   - [Q18: Top Client Leaderboard Algorithm](#q18-how-is-the-top-client-leaderboard-calculated)
   - [Q19: Collection Health Status Meter](#q19-how-does-the-invoice-collection-health-bar-work)
7. [Authentication, Security & State Management](#7-authentication-security--state-management)
   - [Q20: Full Authentication Lifecycle (JWT & bcrypt)](#q20-how-does-sign-up-and-login-authentication-work)
   - [Q21: Business Profile Synchronization](#q21-how-is-the-user-profile-saved-and-synchronized)
8. [Advanced Viva Questions & Examiner Gotchas](#8-advanced-viva-questions--examiner-gotchas)
   - [Q22: Floating-Point Math vs Integer Paise System](#q22-why-use-integer-paise-instead-of-standard-decimals)
   - [Q23: Preventing Cross-Site Scripting (XSS)](#q23-how-did-you-protect-the-app-against-xss-attacks)
   - [Q24: RESTful API Design & HTTP Status Codes](#q24-what-http-status-codes-are-used-and-why)
9. [On-the-Spot Viva Modification Cheat Sheet (0-Code Quick Guide)](#9-on-the-spot-viva-modification-cheat-sheet-0-code-quick-guide)

---

## 1. Project Architectural Overview

InvoZap is built as a **3-tier Client-Server Web Application**:

```
[ FRONTEND LAYER ]  <--- JSON REST API --->  [ BACKEND LAYER ]  <--->  [ DATABASE LAYER ]
HTML5 + CSS3 + Vanilla JS                       Node.js + Express.js               MongoDB (Atlas)
(Single Source of Truth DOM)                    (JWT Auth, Route Handlers)         (Mongoose Models)
```

- **Frontend:** Pure HTML5, modern CSS3, and Vanilla JavaScript (ES6+). Zero bulky UI frameworks (no React/Angular overhead), ensuring sub-second initial load times, native browser execution, and clean DOM trees.
- **Backend:** Node.js runtime with Express.js micro-framework providing RESTful endpoints.
- **Database:** MongoDB with Mongoose Object Data Modeling (ODM) enforcing document schema validation.
- **Security:** Stateless JSON Web Token (JWT) authorization, bcrypt password hashing (10 salt rounds), Helmet HTTP security headers, and strict Whitelist Data Transfer Objects (DTOs).

---

## 2. Frontend Styling & Visual Effects (CSS3 Deep Dive)

### Q1: How does the text have gradient colors?
**Technical Answer:**  
Text gradients in CSS are created by rendering a background gradient across the element and clipping that background strictly to the text glyphs, then making the text itself transparent so the underlying gradient shines through.

**Code implementation:**
```css
/* Found in: public/style.css, Line ~120 & public/createinvoice.css */
.gradient-text, .hero h1 span, .nav-brand span {
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
  -webkit-background-clip: text;   /* Clips gradient to font shape in WebKit/Blink (Chrome/Edge/Safari) */
  background-clip: text;           /* Standard CSS3 property */
  -webkit-text-fill-color: transparent; /* Makes characters transparent to expose gradient */
  color: transparent;              /* Fallback for compliant renderers */
}
```

---

### Q2: How did you add the Lucide icons?
**Technical Answer:**  
Instead of loading a heavy icon font library (like FontAwesome) or loading dynamic JavaScript icons at runtime (which causes Flash of Unstyled Content / layout shift), icons are embedded as **inline Scalable Vector Graphics (`<svg>`)**.
- Uses vector paths with a standard `24x24` coordinate viewport (`viewBox="0 0 24 24"`).
- Uses `stroke="currentColor"`, which causes the SVG stroke to automatically inherit whatever CSS `color` is applied to its parent element.
- `vector-effect: non-scaling-stroke` and crisp anti-aliasing via `stroke-linecap="round"` and `stroke-linejoin="round"`.

**Code implementation:**
```html
<!-- Example Lucide User Icon -->
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user">
  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
  <circle cx="12" cy="7" r="4"/>
</svg>
```

---

### Q3: How do cards float and animate on hover?
**Technical Answer:**  
Cards float using CSS3 transition timing functions and hardware-accelerated 2D transforms combined with multi-layer box shadows.
- `transform: translateY(-4px)` moves the card 4 pixels upward on the Y-axis. Because transforms run on the browser's Compositor Thread (GPU), it produces smooth 60fps animations without causing browser layout reflows.
- `box-shadow` depth increases to simulate light elevation.
- `transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1)` provides natural easing.

**Code implementation:**
```css
/* Found in: public/style.css, Line ~170 & public/createinvoice.css */
.feature-card, .metric-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}

.feature-card:hover, .metric-card:hover {
  transform: translateY(-4px); /* Moves element 4px up */
  box-shadow: 0 12px 24px -6px rgba(15, 23, 42, 0.12), 0 4px 8px -4px rgba(15, 23, 42, 0.06);
  border-color: #cbd5e1;
}
```

---

### Q4: How is every box, card, and bar made?
**Technical Answer:**  
Every box follows the **Modern CSS Card Component Pattern**:
1. **Container Box Model:** `background: #ffffff;` with subtle border `1px solid #e2e8f0;` and curved edges using `border-radius: 12px;` or `16px;`.
2. **Spacing (Box Model):** Generous internal spacing using `padding: 20px;` or `24px;` with `box-sizing: border-box;` so padding doesn't affect width calculations.
3. **Shadow Elevation:** Multi-layered soft drop shadows using `box-shadow: 0 2px 6px rgba(0,0,0,0.04);`.
4. **Header Accents:** Sub-containers inside cards use Flexbox (`display: flex; justify-content: space-between; align-items: center;`) with small uppercase tracker badges (`font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;`).

---

### Q5: How is the page split into input form and live preview?
**Technical Answer:**  
The split layout is built using **CSS Grid (`display: grid`)** with fractional units (`fr`):
- Desktop view uses a 2-column grid: `grid-template-columns: 1.15fr 0.85fr;` with a `gap: 28px;`. The left column holds the `<form class="invoice-form">` and the right column holds `<aside class="preview-column">`.
- The live preview uses `position: sticky; top: 24px;`, allowing the preview sheet to remain in view as the user scrolls down a long form.
- Responsiveness: A CSS Media Query `@media (max-width: 900px)` dynamically collapses the grid to `grid-template-columns: 1fr;` so the form and sheet stack vertically on tablets and mobile screens.

**Code implementation:**
```css
/* Found in: public/createinvoice.css, Line ~25-45 */
.editor-layout {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr; /* 57% form, 43% live sheet */
  gap: 28px;
  align-items: start;
}

@media (max-width: 900px) {
  .editor-layout {
    grid-template-columns: 1fr; /* Stacks vertically */
  }
}
```

---

## 3. Client-Side Interactivity & DOM Manipulation (JavaScript ES6+)

### Q6: When typing in the form, how does the live preview update instantly?
**Technical Answer:**  
This is implemented using JavaScript **DOM Event Listeners** listening for the **`input`** and **`change`** events on form controls:
1. Every input field (`#clientName`, `#invNumber`, `.item-desc`, `.item-price`, etc.) has an event listener bound to it in [script.js](file:///c:/Users/mohit/Documents/InvoZap/public/script.js).
2. When the user types a single keystroke, the browser dispatches an `input` event immediately (without requiring a form submit or blur).
3. The event handler calls `updatePreview()`.
4. `updatePreview()` reads the input values (`element.value`), performs financial calculations, and immediately writes the formatted values into the corresponding sheet elements using `.textContent`.

**Code snippet:**
```javascript
// Found in: public/script.js, Section 4 & 5
function updatePreview() {
  // 1. Read input value
  const clientName = clientNameInput.value.trim() || "Client Name";
  // 2. Write directly to live sheet element
  prevClientName.textContent = clientName;

  // 3. Re-calculate totals and re-render line items
  renderItemsPreview();
}

// Bind live listening across inputs
clientNameInput.addEventListener("input", updatePreview);
invNumberInput.addEventListener("input", updatePreview);
```

---

### Q7: How does theme accent color selection work?
**Technical Answer:**  
1. In the HTML settings, theme choices are grouped radio inputs `<input type="radio" name="themeColor" value="navy">`, `value="indigo"`, `value="burgundy"`.
2. In CSS, three class modifiers are defined: `.sheet-paper.theme-navy`, `.sheet-paper.theme-indigo`, `.sheet-paper.theme-burgundy`. These override CSS custom properties / background colors on headers, table column borders, and totals.
3. In JS, change event listeners remove previous theme classes from the `#invoicePaper` container and append the newly selected class name:
```javascript
// Found in: public/script.js, Section 7
themeRadios.forEach(radio => {
  radio.addEventListener("change", function () {
    if (this.checked) {
      invoicePaper.classList.remove("theme-navy", "theme-indigo", "theme-burgundy");
      invoicePaper.classList.add(`theme-${this.value}`);
    }
  });
});
```

---

### Q8: How is the UPI QR code generated mathematically?
**Technical Answer:**  
The UPI QR code does **not** use any external Google Charts or third-party image API. It is generated **100% locally in the browser** in [js/engine/upi.js](file:///c:/Users/mohit/Documents/InvoZap/public/js/engine/upi.js):
1. **URI Formatting:** Builds the official National Payments Corporation of India (NPCI) deep link:
   `upi://pay?pa=<vpa>&pn=<payeeName>&am=<amount>&cu=INR&tn=<invoiceNo>`
2. **Matrix Generation:** Implements the international standard **ISO/IEC 18004** specification:
   - Encodes text into 8-bit bytes.
   - Calculates **Reed-Solomon Error Correction Codewords** (Level M: recovers from up to 15% data damage/blur).
   - Generates the 2D bit matrix with Finder Patterns (the 3 corner squares), Alignment Patterns, Timing Patterns, and optimal mask penalty evaluation.
3. **Vector SVG Output:** Converts the binary matrix directly into `<svg>` paths using SVG path syntax (`<rect>` and `<path d="...">`). It renders instantly with infinite vector sharpness and 0 bytes of network traffic.

---

### Q9: How does adding and removing invoice rows work?
**Technical Answer:**  
This uses dynamic DOM node creation and event delegation:
1. **Add Row:** When `#addItemBtn` is clicked, JS calls `document.createElement("tr")` with 4 table cells (`<td>`): Description, Quantity, Price, and Remove Button.
2. It attaches live `input` listeners to the newly created fields so typing in the new row updates totals immediately.
3. **Remove Row:** The delete button (`✕`) has a `click` listener that calls `row.remove()` on the parent `<tr>`, followed by invoking `updatePreview()` to recalculate line items and totals.

```javascript
// Found in: public/script.js, Line ~360-400
addItemBtn.addEventListener("click", function () {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="text" class="item-desc" placeholder="Item description"></td>
    <td><input type="number" class="item-qty" value="1" min="1"></td>
    <td><input type="number" class="item-price" placeholder="0.00" min="0"></td>
    <td><button type="button" class="btn-remove-row">✕</button></td>
  `;
  tr.querySelector(".btn-remove-row").addEventListener("click", () => {
    tr.remove();
    updatePreview();
  });
  itemsTableBody.appendChild(tr);
});
```

---

### Q10: How does the "Paste Items" feature parse bulk text?
**Technical Answer:**  
The paste modal allows users to paste raw unstructured lists from WhatsApp or emails (e.g., `Web Design - 15000` or `2 Landing Pages - 8000`).
1. Reads the raw string from `<textarea id="pasteItemsInput">`.
2. Splits text into individual lines using `.split('\n')`.
3. Evaluates each line using **Regular Expressions (Regex)** to extract:
   - Quantity (optional leading digits).
   - Description (text).
   - Price (digits after a hyphen, colon, or symbol).
4. Generates table rows programmatically and injects them into the DOM.

---

## 4. Document Output, Cloud Storage & External Integrations

### Q11: How does "Print / PDF" work without external libraries?
**Technical Answer:**  
It uses the browser's native **`window.print()`** combined with **CSS Print Media Queries (`@media print`)**:
- When `window.print()` is invoked, the browser switches rendering from screen styles to print styles.
- In [createinvoice.css](file:///c:/Users/mohit/Documents/InvoZap/public/createinvoice.css#L856), `@media print` hides the navigation bar, input forms, action buttons, modals, and shadows (`display: none !important;`).
- It expands `#invoicePaper` to `width: 100%; margin: 0; box-shadow: none;` formatted to exact A4 paper dimensions (`@page { size: A4; margin: 12mm; }`).
- The browser natively converts the DOM into a pixel-perfect downloadable PDF or sends it to a physical printer.

---

### Q12: How does the WhatsApp share feature work?
**Technical Answer:**  
1. Extracts the client's phone number, invoice number, and grand total.
2. Normalizes phone numbers by stripping non-numeric characters (regex `replace(/[^0-9]/g, "")`) and ensuring country code prefixing (`91` for India).
3. Pre-formats a professional message string.
4. Uses JavaScript's built-in **`encodeURIComponent()`** to convert spaces, newlines, and currency symbols into valid URI query parameters (`%20`, `%0A`, `%E2%82%B9`).
5. Opens the target WhatsApp universal deep link: `https://api.whatsapp.com/send?phone=${phone}&text=${encodedText}`.

---

### Q13: How does saving to the cloud work?
**Technical Answer:**  
It uses the native JavaScript **Fetch API (`async/await`)** to perform asynchronous HTTP requests:
1. Gathers all form fields and items into an `invoicePayload` JavaScript object.
2. Retrieves the stored JWT authentication token from `localStorage.getItem("invozap_token")`.
3. Issues a `POST /api/invoices` request with headers:
   ```javascript
   headers: {
     "Content-Type": "application/json",
     "Authorization": `Bearer ${token}`
   }
   ```
4. Express route handler verifies the JWT, validates payload fields, executes calculations on the server, and persists the document into MongoDB via Mongoose.

---

### Q14: How does Export to CSV work?
**Technical Answer:**  
Export to CSV is handled completely in-memory using the HTML5 **Blob and Object URL APIs** (zero server processing needed):
1. Iterates over the invoice records array.
2. Formats headers and values into Comma-Separated Values (`"INV-0001","Acme Corp","22000.00","Paid"\n`).
3. Wraps the string in a binary Large Object: `const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });`.
4. Generates a temporary browser memory URI: `const url = URL.createObjectURL(blob);`.
5. Programmatically creates a hidden `<a>` tag, sets `a.href = url`, sets `a.download = "Invoices.csv"`, calls `a.click()`, and cleans up memory using `URL.revokeObjectURL(url)`.

---

## 5. Document Management & History Modal Systems

### Q15: How does an invoice get into History and render?
**Technical Answer:**  
In [history.js](file:///c:/Users/mohit/Documents/InvoZap/public/history.js):
1. On `DOMContentLoaded`, it issues an authenticated GET request to `/api/invoices`.
2. The server queries MongoDB: `Invoice.find({ owner: req.user.id }).sort({ createdAt: -1 })`.
3. The frontend receives the JSON array and loops through each record.
4. It dynamically builds table rows (`<tr>`) injecting invoice number, client name, date, formatted currency amount, dynamic status badge (`<span class="status-pill status-paid">Paid</span>`), and an action cell with `View`, `Print`, `Edit`, and `Delete` buttons.

---

### Q16: What makes the "View" button open a popup modal?
**Technical Answer:**  
This uses the **CSS Modal Overlay Pattern**:
1. An overlay container `<div id="viewModal" class="modal-overlay">` is positioned with `position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7); display: none; z-index: 1000;`.
2. When the user clicks "View", JavaScript looks up the invoice by its ID, populates the modal's preview DOM with that invoice's line items and totals, and switches CSS to `modal.style.display = "flex";`.
3. Event listeners on the close button (`✕`) and overlay backdrop reset `modal.style.display = "none";`. An `Escape` keyboard listener also closes the modal.

---

## 6. Analytics & Data Aggregation Engine (`analytics.html`)

### Q17: How do the analytics summary cards update?
**Technical Answer:**  
In [analytics.html](file:///c:/Users/mohit/Documents/InvoZap/public/analytics.html), JS loops over the array of invoices using modern array methods:
- **Total Revenue:** Computed using `.reduce()` summing `inv.grandTotal` on invoices marked `"Paid"`.
- **Pending Dues:** Summing `inv.balanceDue` on invoices marked `"Unpaid"` or `"Partial"`.
- **Total Invoices & Count:** Evaluated using `invoices.length`.
- Values are converted to Indian Rupee currency format using `Intl.NumberFormat('en-IN')` and updated into DOM elements (`#totalRevenue.textContent = ...`).

---

### Q18: How is the Top Client Leaderboard calculated?
**Technical Answer:**  
1. **Hash Map Grouping:** Creates a frequency dictionary mapping `clientName` to accumulated revenue:
   ```javascript
   const clientRevenue = {};
   invoices.forEach(inv => {
     clientRevenue[inv.clientName] = (clientRevenue[inv.clientName] || 0) + inv.grandTotal;
   });
   ```
2. **Sorting:** Converts the object into an array of entries and sorts descending:
   `Object.entries(clientRevenue).sort((a, b) => b[1] - a[1])`.
3. **Slicing & Rendering:** Takes the top 5 clients (`.slice(0, 5)`), calculates their percentage of total sales, and injects clean rank badges and dynamic progress bars (`<div class="progress-bar" style="width: ${percent}%;">`).

---

### Q19: How does the Invoice Collection Health bar work?
**Technical Answer:**  
The health bar is a segmented stacked bar chart built with CSS Flexbox:
1. Calculates count percentages:  
   `pctPaid = (paidCount / total) * 100`,  
   `pctUnpaid = (unpaidCount / total) * 100`.
2. Injects colored segment spans inside a container (`#healthBarContainer`):
   `<span style="width: ${pctPaid}%; background: #22c55e;"></span>` (green),  
   `<span style="width: ${pctUnpaid}%; background: #f59e0b;"></span>` (amber).
3. The browser automatically flexes each segment proportionally to reflect settlement health.

---

## 7. Authentication, Security & State Management

### Q20: How does sign-up and login authentication work?
**Technical Answer:**  
InvoZap implements industry-standard **JWT-based stateless authentication**:
1. **Registration:** User enters name, email, password. Express router validates fields. Server hashes password with `bcrypt.hash(password, 10)` so plaintext passwords are never stored. Saves to MongoDB User collection.
2. **Login:** User submits credentials. Server searches for user, verifies password with `bcrypt.compare(password, user.password)`.
3. **Token Issuance:** If valid, server signs a JWT containing `{ id: user._id, email: user.email }` using a 256-bit secret key (`HS256` algorithm) and returns it.
4. **Client Storage:** The frontend stores the token in `localStorage.setItem("invozap_token", token)`.
5. **Route Protection:** Express middleware (`server/middleware/authMiddleware.js`) intercepts requests, extracts `Bearer <token>`, verifies signature via `jwt.verify()`, and attaches `req.user` to the request pipeline.

---

### Q21: How is the user profile saved and synchronized?
**Technical Answer:**  
The profile modal in [onboarding.js](file:///c:/Users/mohit/Documents/InvoZap/public/js/onboarding.js) captures business name, registered address, GSTIN, and UPI ID:
1. Sends `PUT /api/auth/me/business-profile`.
2. Mongoose updates the embedded `businessProfile` sub-document inside MongoDB.
3. The frontend caches this in `localStorage.setItem("invozap_user", ...)`.
4. When `createnew.html` or `quotation.html` loads, `applyBusinessProfileToPage()` reads the cached profile and auto-fills business branding, state codes, and UPI VPA onto the preview sheet and form controls.

---

## 8. Advanced Viva Questions & Examiner Gotchas

### Q22: Why use Integer Paise instead of standard decimals?
**Examiner Question:** *"Why does your database store `subtotalPaise` as 200000 instead of ₹2000.00?"*  
**Technical Answer:**  
In computer science, all binary floating-point numbers follow the **IEEE 754 standard**, which cannot precisely represent fractional base-10 decimals. For example, in JavaScript:
`0.1 + 0.2 === 0.30000000000000004` (evaluates to `false`!).  
In financial accounting and tax compliance, cumulative floating-point errors cause critical rounding discrepancies across invoices.  
**Solution:** InvoZap stores every monetary value as an integer in **Paise** (1 Rupee = 100 Paise). Financial calculations use integer arithmetic (`Math.round((qty * pricePaise))`), eliminating all IEEE-754 precision errors. Currency formatting divides by 100 only at the final presentation step.

---

### Q23: How did you protect the app against XSS attacks?
**Examiner Question:** *"What happens if a user sets their client name to `<script>alert('Hacked')</script>`?"*  
**Technical Answer:**  
1. **Use of `.textContent` instead of `.innerHTML`:** User inputs are written to the DOM using `element.textContent = value;`. The browser strictly treats the input as literal character text, never parsing or executing `<script>` tags or HTML entities.
2. **Output Sanitization Function:** For any dynamic HTML concatenation, strings pass through an HTML entity encoder:
   ```javascript
   function esc(str) {
     return String(str || "")
       .replace(/&/g, "&amp;")
       .replace(/</g, "&lt;")
       .replace(/>/g, "&gt;")
       .replace(/"/g, "&quot;")
       .replace(/'/g, "&#39;");
   }
   ```
3. **Helmet Security Headers:** The Express server sends HTTP security headers (`Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`).

---

### Q24: What HTTP status codes are used and why?
**Technical Answer:**  
- **`200 OK`:** Successful GET queries, invoice updates, and payments.
- **`201 Created`:** Successful creation of invoices, quotations, and user registrations.
- **`400 Bad Request`:** Client validation errors (e.g., missing client name or negative item prices).
- **`401 Unauthorized`:** Missing or expired JWT token.
- **`404 Not Found`:** Resource doesn't exist or doesn't belong to the authenticated user.
- **`409 Conflict`:** Duplicate invoice number or concurrent write collision.
- **`410 Gone`:** Shared invoice link has expired or has been voided.
- **`500 Internal Server Error`:** Unhandled database or server exception.

---

## 9. On-the-Spot Viva Modification Cheat Sheet (0-Code Quick Guide)

If an examiner asks you to modify something live on the screen:

### 1. Change Website Primary Theme Color
- **Where to change:** `public/style.css` (Line ~10) & `public/createinvoice.css` (Line ~10)
- **What to edit:** Look for `#2563eb` (primary blue).
- **Replace with:**
  - `#059669` (Modern Emerald Green)
  - `#7c3aed` (Royal Purple)
  - `#ea580c` (Bold Orange)

### 2. Change Card Corner Rounding
- **Where to change:** `public/createinvoice.css` (Search `.form-card`)
- **What to edit:** `border-radius: 12px;`  
  - For sharp corporate edges: change `12px` to `4px`.  
  - For extra bubbly modern edges: change `12px` to `24px`.

### 3. Change Card Padding / Size
- **Where to change:** `public/createinvoice.css` (Search `.form-card`)
- **What to edit:** `padding: 24px;`  
  - Change to `32px` to make cards larger and more spacious.  
  - Change to `16px` to make cards compact.

### 4. Change Default Heading or Page Title
- **Where to change:** `public/createnew.html` (Line ~34)
- **What to edit:** `<h1>Create Invoice</h1>` -> change text to whatever the professor requests.

### 5. Change Default Tax Rate
- **Where to change:** `public/script.js` (Search `taxRate: 18`)
- **What to edit:** Change `18` to `5` (5% GST) or `12` (12% GST).

---

*Prepared for Project Defense & Practical Examination. InvoZap Studio 2026.*
