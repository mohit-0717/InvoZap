const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'report_diagrams');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Diagram 1: Figure 3.1 - System Architecture
const d1 = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 320" width="100%" height="100%">
  <defs>
    <style>
      text { font-family: 'Times New Roman', serif; }
    </style>
    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#1e3a8a" />
    </marker>
  </defs>

  <!-- Background -->
  <rect width="100%" height="100%" fill="#ffffff"/>

  <!-- Presentation Layer -->
  <rect x="30" y="20" width="640" height="75" rx="8" fill="#f0f7ff" stroke="#1e3a8a" stroke-width="2"/>
  <text x="50" y="45" font-size="13" font-weight="bold" fill="#1e3a8a">PRESENTATION LAYER (Client Browser)</text>
  <rect x="50" y="55" width="130" height="30" rx="4" fill="#ffffff" stroke="#3b82f6"/>
  <text x="65" y="75" font-size="11" fill="#1e3a8a">Invoice UI &amp; Forms</text>
  <rect x="195" y="55" width="140" height="30" rx="4" fill="#ffffff" stroke="#3b82f6"/>
  <text x="205" y="75" font-size="11" fill="#1e3a8a">Integer Paise Engine</text>
  <rect x="350" y="55" width="150" height="30" rx="4" fill="#ffffff" stroke="#3b82f6"/>
  <text x="360" y="75" font-size="11" fill="#1e3a8a">Vector SVG QR Gen</text>
  <rect x="515" y="55" width="140" height="30" rx="4" fill="#ffffff" stroke="#3b82f6"/>
  <text x="525" y="75" font-size="11" fill="#1e3a8a">Quality Audit (12-Pt)</text>

  <!-- HTTP / REST Arrow -->
  <line x1="350" y1="95" x2="350" y2="125" stroke="#1e3a8a" stroke-width="2" marker-end="url(#arrow)"/>
  <text x="365" y="115" font-size="10" fill="#475569">REST APIs (JSON / HTTPS)</text>

  <!-- Business Logic Layer -->
  <rect x="30" y="125" width="640" height="95" rx="8" fill="#f8fafc" stroke="#334155" stroke-width="2"/>
  <text x="50" y="148" font-size="13" font-weight="bold" fill="#0f172a">APPLICATION &amp; BUSINESS LOGIC LAYER (Express.js)</text>
  <rect x="50" y="160" width="130" height="45" rx="4" fill="#ffffff" stroke="#64748b"/>
  <text x="65" y="180" font-size="10" font-weight="bold" fill="#0f172a">Security &amp; Auth</text>
  <text x="60" y="195" font-size="9" fill="#475569">JWT, BCrypt, Helmet</text>

  <rect x="195" y="160" width="140" height="45" rx="4" fill="#ffffff" stroke="#64748b"/>
  <text x="205" y="180" font-size="10" font-weight="bold" fill="#0f172a">Invoice Controller</text>
  <text x="205" y="195" font-size="9" fill="#475569">Gapless Monotonic FY</text>

  <rect x="350" y="160" width="150" height="45" rx="4" fill="#ffffff" stroke="#64748b"/>
  <text x="360" y="180" font-size="10" font-weight="bold" fill="#0f172a">GST Engine Matrix</text>
  <text x="360" y="195" font-size="9" fill="#475569">POS Resolution (CGST/IGST)</text>

  <rect x="515" y="160" width="140" height="45" rx="4" fill="#ffffff" stroke="#64748b"/>
  <text x="525" y="180" font-size="10" font-weight="bold" fill="#0f172a">Ledger &amp; Export</text>
  <text x="525" y="195" font-size="9" fill="#475569">Payment, CSV Stream</text>

  <!-- Database Arrow -->
  <line x1="350" y1="220" x2="350" y2="245" stroke="#1e3a8a" stroke-width="2" marker-end="url(#arrow)"/>
  <text x="365" y="235" font-size="10" fill="#475569">Mongoose ODM / TCP 27017</text>

  <!-- Data Layer -->
  <rect x="30" y="245" width="640" height="65" rx="8" fill="#f0fdf4" stroke="#15803d" stroke-width="2"/>
  <text x="50" y="268" font-size="13" font-weight="bold" fill="#15803d">DATA PERSISTENCE LAYER (MongoDB Atlas Cloud Cluster)</text>
  <rect x="60" y="278" width="110" height="24" rx="4" fill="#ffffff" stroke="#86efac"/>
  <text x="80" y="294" font-size="10" fill="#166534">Users Collection</text>
  <rect x="185" y="278" width="125" height="24" rx="4" fill="#ffffff" stroke="#86efac"/>
  <text x="195" y="294" font-size="10" fill="#166534">Invoices Collection</text>
  <rect x="325" y="278" width="115" height="24" rx="4" fill="#ffffff" stroke="#86efac"/>
  <text x="340" y="294" font-size="10" fill="#166534">Clients Directory</text>
  <rect x="455" y="278" width="105" height="24" rx="4" fill="#ffffff" stroke="#86efac"/>
  <text x="475" y="294" font-size="10" fill="#166534">Catalog Items</text>
  <rect x="575" y="278" width="85" height="24" rx="4" fill="#ffffff" stroke="#86efac"/>
  <text x="590" y="294" font-size="10" fill="#166534">Counters</text>
</svg>`;

// Diagram 2: Figure 3.2 - Database Design (ER Diagram)
const d2 = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 360" width="100%" height="100%">
  <defs>
    <style>
      text { font-family: 'Times New Roman', serif; }
    </style>
  </defs>

  <rect width="100%" height="100%" fill="#ffffff"/>

  <!-- USER ENTITY -->
  <rect x="20" y="20" width="180" height="150" rx="4" fill="#ffffff" stroke="#1e3a8a" stroke-width="2"/>
  <rect x="20" y="20" width="180" height="25" fill="#1e3a8a"/>
  <text x="80" y="38" font-size="12" font-weight="bold" fill="#ffffff">USER</text>
  <text x="30" y="60" font-size="10">PK &nbsp; _id : ObjectId</text>
  <text x="30" y="75" font-size="10">UK &nbsp; email : String</text>
  <text x="30" y="90" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; passwordHash : String</text>
  <text x="30" y="105" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; businessName : String</text>
  <text x="30" y="120" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; gstin : String</text>
  <text x="30" y="135" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; upiVpa : String</text>
  <text x="30" y="150" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; createdAt : Date</text>

  <!-- INVOICE ENTITY -->
  <rect x="250" y="20" width="200" height="200" rx="4" fill="#ffffff" stroke="#1e3a8a" stroke-width="2"/>
  <rect x="250" y="20" width="200" height="25" fill="#1e3a8a"/>
  <text x="320" y="38" font-size="12" font-weight="bold" fill="#ffffff">INVOICE</text>
  <text x="260" y="60" font-size="10">PK &nbsp; _id : ObjectId</text>
  <text x="260" y="75" font-size="10">FK &nbsp; userId : ObjectId</text>
  <text x="260" y="90" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; invoiceNumber : String</text>
  <text x="260" y="105" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; issueDate, dueDate : Date</text>
  <text x="260" y="120" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; clientSnapshot : Object</text>
  <text x="260" y="135" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; items : Array&lt;Item&gt;</text>
  <text x="260" y="150" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; subtotalPaise : Number</text>
  <text x="260" y="165" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; cgstPaise, sgstPaise : Number</text>
  <text x="260" y="180" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; igstPaise, totalPaise : Number</text>
  <text x="260" y="195" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; status : Enum (PAID/UNPAID)</text>
  <text x="260" y="210" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; payments : Array&lt;Payment&gt;</text>

  <!-- CLIENT DIRECTORY ENTITY -->
  <rect x="490" y="20" width="190" height="150" rx="4" fill="#ffffff" stroke="#1e3a8a" stroke-width="2"/>
  <rect x="490" y="20" width="190" height="25" fill="#1e3a8a"/>
  <text x="540" y="38" font-size="12" font-weight="bold" fill="#ffffff">CLIENT_DIRECTORY</text>
  <text x="500" y="60" font-size="10">PK &nbsp; _id : ObjectId</text>
  <text x="500" y="75" font-size="10">FK &nbsp; userId : ObjectId</text>
  <text x="500" y="90" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; clientName : String</text>
  <text x="500" y="105" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; gstin : String</text>
  <text x="500" y="120" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; stateCode : String</text>
  <text x="500" y="135" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; email, phone : String</text>
  <text x="500" y="150" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; billingAddress : String</text>

  <!-- CATALOG ENTITY -->
  <rect x="20" y="210" width="180" height="130" rx="4" fill="#ffffff" stroke="#1e3a8a" stroke-width="2"/>
  <rect x="20" y="210" width="180" height="25" fill="#1e3a8a"/>
  <text x="60" y="228" font-size="12" font-weight="bold" fill="#ffffff">CATALOG_ITEM</text>
  <text x="30" y="250" font-size="10">PK &nbsp; _id : ObjectId</text>
  <text x="30" y="265" font-size="10">FK &nbsp; userId : ObjectId</text>
  <text x="30" y="280" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; itemName : String</text>
  <text x="30" y="295" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; hsnSacCode : String</text>
  <text x="30" y="310" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ratePaise : Number</text>
  <text x="30" y="325" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; defaultTaxRate : Number</text>

  <!-- SEQUENCE COUNTER ENTITY -->
  <rect x="490" y="210" width="190" height="110" rx="4" fill="#ffffff" stroke="#1e3a8a" stroke-width="2"/>
  <rect x="490" y="210" width="190" height="25" fill="#1e3a8a"/>
  <text x="530" y="228" font-size="12" font-weight="bold" fill="#ffffff">FY_COUNTER</text>
  <text x="500" y="250" font-size="10">PK &nbsp; _id : ObjectId</text>
  <text x="500" y="265" font-size="10">FK &nbsp; userId : ObjectId</text>
  <text x="500" y="280" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; financialYear : String</text>
  <text x="500" y="295" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; currentSequence : Number</text>

  <!-- Relationships -->
  <line x1="200" y1="75" x2="250" y2="75" stroke="#1e3a8a" stroke-width="1.5"/>
  <circle cx="205" cy="75" r="3" fill="#1e3a8a"/>
  <line x1="450" y1="75" x2="490" y2="75" stroke="#1e3a8a" stroke-width="1.5"/>
  <circle cx="485" cy="75" r="3" fill="#1e3a8a"/>
  <line x1="110" y1="170" x2="110" y2="210" stroke="#1e3a8a" stroke-width="1.5"/>
  <circle cx="110" cy="205" r="3" fill="#1e3a8a"/>
  <line x1="450" y1="140" x2="490" y2="240" stroke="#1e3a8a" stroke-width="1.5"/>
  <circle cx="485" cy="240" r="3" fill="#1e3a8a"/>
</svg>`;

// Diagram 3: Figure 3.3 - Use Case Diagram
const d3 = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 370" width="100%" height="100%">
  <defs>
    <style>
      text { font-family: 'Times New Roman', serif; }
    </style>
  </defs>

  <rect width="100%" height="100%" fill="#ffffff"/>

  <!-- Actor: Business User / Freelancer -->
  <circle cx="80" cy="180" r="18" fill="#e0e7ff" stroke="#1e3a8a" stroke-width="2"/>
  <line x1="80" y1="198" x2="80" y2="240" stroke="#1e3a8a" stroke-width="2"/>
  <line x1="55" y1="215" x2="105" y2="215" stroke="#1e3a8a" stroke-width="2"/>
  <line x1="80" y1="240" x2="60" y2="280" stroke="#1e3a8a" stroke-width="2"/>
  <line x1="80" y1="240" x2="100" y2="280" stroke="#1e3a8a" stroke-width="2"/>
  <text x="45" y="305" font-size="12" font-weight="bold" fill="#1e3a8a">Business User</text>

  <!-- System Boundary -->
  <rect x="180" y="15" width="490" height="340" rx="8" fill="#f8fafc" stroke="#475569" stroke-width="1.5"/>
  <text x="330" y="35" font-size="13" font-weight="bold" fill="#0f172a">InvoZap Platform System</text>

  <!-- Use Cases -->
  <g>
    <ellipse cx="300" cy="65" rx="90" ry="18" fill="#ffffff" stroke="#2563eb" stroke-width="1.5"/>
    <text x="240" y="70" font-size="11">Register / Login (JWT)</text>

    <ellipse cx="300" cy="115" rx="90" ry="18" fill="#ffffff" stroke="#2563eb" stroke-width="1.5"/>
    <text x="235" y="120" font-size="11">Maintain Profile &amp; Bank Details</text>

    <ellipse cx="300" cy="165" rx="90" ry="18" fill="#ffffff" stroke="#2563eb" stroke-width="1.5"/>
    <text x="235" y="170" font-size="11">Create Tax Invoice with GST</text>

    <ellipse cx="300" cy="215" rx="90" ry="18" fill="#ffffff" stroke="#2563eb" stroke-width="1.5"/>
    <text x="240" y="220" font-size="11">Manage Catalog &amp; Clients</text>

    <ellipse cx="300" cy="265" rx="90" ry="18" fill="#ffffff" stroke="#2563eb" stroke-width="1.5"/>
    <text x="230" y="270" font-size="11">Convert Quotation to Invoice</text>

    <ellipse cx="300" cy="315" rx="90" ry="18" fill="#ffffff" stroke="#2563eb" stroke-width="1.5"/>
    <text x="240" y="320" font-size="11">Record Payment &amp; Settle</text>

    <!-- Extended / Included Sub Cases -->
    <ellipse cx="540" cy="140" rx="95" ry="18" fill="#eff6ff" stroke="#3b82f6" stroke-dasharray="3,3"/>
    <text x="470" y="145" font-size="10">&lt;&lt;include&gt;&gt; 12-Pt Quality Audit</text>

    <ellipse cx="540" cy="190" rx="95" ry="18" fill="#eff6ff" stroke="#3b82f6" stroke-dasharray="3,3"/>
    <text x="465" y="195" font-size="10">&lt;&lt;include&gt;&gt; Vector UPI QR Gen</text>

    <ellipse cx="540" cy="270" rx="95" ry="18" fill="#eff6ff" stroke="#3b82f6" stroke-dasharray="3,3"/>
    <text x="475" y="275" font-size="10">&lt;&lt;include&gt;&gt; Export Invoices CSV</text>
  </g>

  <!-- Connection Lines from User -->
  <line x1="120" y1="200" x2="210" y2="65" stroke="#64748b"/>
  <line x1="120" y1="205" x2="210" y2="115" stroke="#64748b"/>
  <line x1="120" y1="210" x2="210" y2="165" stroke="#64748b"/>
  <line x1="120" y1="215" x2="210" y2="215" stroke="#64748b"/>
  <line x1="120" y1="220" x2="210" y2="265" stroke="#64748b"/>
  <line x1="120" y1="225" x2="210" y2="315" stroke="#64748b"/>

  <!-- Includes Lines -->
  <line x1="390" y1="165" x2="445" y2="145" stroke="#3b82f6" stroke-dasharray="2,2"/>
  <line x1="390" y1="175" x2="445" y2="190" stroke="#3b82f6" stroke-dasharray="2,2"/>
  <line x1="390" y1="315" x2="455" y2="280" stroke="#3b82f6" stroke-dasharray="2,2"/>
</svg>`;

// Diagram 4: Figure 3.4 - Work Flow Diagram
const d4 = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 360" width="100%" height="100%">
  <defs>
    <style>
      text { font-family: 'Times New Roman', serif; }
    </style>
    <marker id="arrow2" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#0284c7" />
    </marker>
  </defs>

  <rect width="100%" height="100%" fill="#ffffff"/>

  <!-- Step 1 -->
  <rect x="50" y="20" width="160" height="45" rx="6" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5"/>
  <text x="65" y="40" font-size="11" font-weight="bold">1. Document Setup</text>
  <text x="65" y="55" font-size="9" fill="#475569">Client &amp; Date Selection</text>

  <line x1="210" y1="42" x2="270" y2="42" stroke="#0284c7" stroke-width="2" marker-end="url(#arrow2)"/>

  <!-- Step 2 -->
  <rect x="270" y="20" width="160" height="45" rx="6" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5"/>
  <text x="285" y="40" font-size="11" font-weight="bold">2. Line Items Entry</text>
  <text x="285" y="55" font-size="9" fill="#475569">Catalog / Fast Paste</text>

  <line x1="430" y1="42" x2="490" y2="42" stroke="#0284c7" stroke-width="2" marker-end="url(#arrow2)"/>

  <!-- Step 3 -->
  <rect x="490" y="20" width="160" height="45" rx="6" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5"/>
  <text x="500" y="40" font-size="11" font-weight="bold">3. GST Place of Supply</text>
  <text x="500" y="55" font-size="9" fill="#475569">Auto CGST+SGST / IGST</text>

  <!-- Downward connector -->
  <line x1="570" y1="65" x2="570" y2="105" stroke="#0284c7" stroke-width="2"/>

  <!-- Step 4 -->
  <rect x="490" y="105" width="160" height="45" rx="6" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
  <text x="505" y="125" font-size="11" font-weight="bold">4. Integer Paise Math</text>
  <text x="505" y="140" font-size="9" fill="#475569">Subtotal + Tax Reconciled</text>

  <line x1="490" y1="127" x2="430" y2="127" stroke="#d97706" stroke-width="2"/>

  <!-- Step 5 -->
  <rect x="270" y="105" width="160" height="45" rx="6" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
  <text x="280" y="125" font-size="11" font-weight="bold">5. Pre-Send Quality Audit</text>
  <text x="280" y="140" font-size="9" fill="#475569">12 Rules Verifications</text>

  <line x1="270" y1="127" x2="210" y2="127" stroke="#d97706" stroke-width="2"/>

  <!-- Step 6 -->
  <rect x="50" y="105" width="160" height="45" rx="6" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/>
  <text x="65" y="125" font-size="11" font-weight="bold">6. Vector UPI QR Gen</text>
  <text x="65" y="140" font-size="9" fill="#475569">NPCI Deep-Link Injection</text>

  <!-- Downward connector -->
  <line x1="130" y1="150" x2="130" y2="190" stroke="#16a34a" stroke-width="2"/>

  <!-- Step 7 -->
  <rect x="50" y="190" width="160" height="45" rx="6" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/>
  <text x="65" y="210" font-size="11" font-weight="bold">7. Persist &amp; Sequence</text>
  <text x="65" y="225" font-size="9" fill="#475569">Gapless FY Numbering</text>

  <line x1="210" y1="212" x2="270" y2="212" stroke="#16a34a" stroke-width="2"/>

  <!-- Step 8 -->
  <rect x="270" y="190" width="160" height="45" rx="6" fill="#f1f5f9" stroke="#475569" stroke-width="1.5"/>
  <text x="285" y="210" font-size="11" font-weight="bold">8. Customer Dispatch</text>
  <text x="285" y="225" font-size="9" fill="#475569">Print, PDF, Public Link</text>

  <line x1="430" y1="212" x2="490" y2="212" stroke="#475569" stroke-width="2"/>

  <!-- Step 9 -->
  <rect x="490" y="190" width="160" height="45" rx="6" fill="#f1f5f9" stroke="#475569" stroke-width="1.5"/>
  <text x="505" y="210" font-size="11" font-weight="bold">9. Settlement &amp; Export</text>
  <text x="505" y="225" font-size="9" fill="#475569">Payment Rec &amp; CSV Stream</text>
</svg>`;

// Diagram 5: Figure 3.5 - Module Design
const d5 = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 360" width="100%" height="100%">
  <defs>
    <style>
      text { font-family: 'Times New Roman', serif; }
    </style>
  </defs>

  <rect width="100%" height="100%" fill="#ffffff"/>

  <!-- Frontend Container -->
  <rect x="30" y="15" width="640" height="130" rx="6" fill="#eff6ff" stroke="#2563eb" stroke-width="1.5"/>
  <text x="50" y="35" font-size="12" font-weight="bold" fill="#1e3a8a">FRONTEND SUBSYSTEMS (Browser)</text>

  <rect x="50" y="45" width="110" height="85" rx="4" fill="#ffffff" stroke="#93c5fd"/>
  <text x="65" y="65" font-size="10" font-weight="bold">Auth UI</text>
  <text x="58" y="82" font-size="8" fill="#475569">• Login / Sign up</text>
  <text x="58" y="97" font-size="8" fill="#475569">• JWT Storage</text>
  <text x="58" y="112" font-size="8" fill="#475569">• Profile Modal</text>

  <rect x="175" y="45" width="110" height="85" rx="4" fill="#ffffff" stroke="#93c5fd"/>
  <text x="185" y="65" font-size="10" font-weight="bold">Invoice Editor</text>
  <text x="182" y="82" font-size="8" fill="#475569">• Dynamic Rows</text>
  <text x="182" y="97" font-size="8" fill="#475569">• Fast Paste Parser</text>
  <text x="182" y="112" font-size="8" fill="#475569">• Draft Autosave</text>

  <rect x="300" y="45" width="110" height="85" rx="4" fill="#ffffff" stroke="#93c5fd"/>
  <text x="312" y="65" font-size="10" font-weight="bold">Financial Core</text>
  <text x="308" y="82" font-size="8" fill="#475569">• Integer Math</text>
  <text x="308" y="97" font-size="8" fill="#475569">• POS GST Logic</text>
  <text x="308" y="112" font-size="8" fill="#475569">• Rounding Rules</text>

  <rect x="425" y="45" width="110" height="85" rx="4" fill="#ffffff" stroke="#93c5fd"/>
  <text x="435" y="65" font-size="10" font-weight="bold">Quality &amp; QR</text>
  <text x="432" y="82" font-size="8" fill="#475569">• 12-Pt Audit</text>
  <text x="432" y="97" font-size="8" fill="#475569">• Vector QR Gen</text>
  <text x="432" y="112" font-size="8" fill="#475569">• NPCI Encoding</text>

  <rect x="550" y="45" width="105" height="85" rx="4" fill="#ffffff" stroke="#93c5fd"/>
  <text x="560" y="65" font-size="10" font-weight="bold">History &amp; CSV</text>
  <text x="558" y="82" font-size="8" fill="#475569">• Ledger Views</text>
  <text x="558" y="97" font-size="8" fill="#475569">• CSV Export</text>
  <text x="558" y="112" font-size="8" fill="#475569">• Status Filter</text>

  <!-- Connecting arrows -->
  <line x1="350" y1="145" x2="350" y2="180" stroke="#1e3a8a" stroke-width="2"/>

  <!-- Backend Container -->
  <rect x="30" y="180" width="640" height="150" rx="6" fill="#f8fafc" stroke="#334155" stroke-width="1.5"/>
  <text x="50" y="200" font-size="12" font-weight="bold" fill="#0f172a">BACKEND MODULES (Express Server &amp; Mongoose Models)</text>

  <rect x="60" y="215" width="125" height="95" rx="4" fill="#ffffff" stroke="#64748b"/>
  <text x="75" y="235" font-size="10" font-weight="bold">Auth Controller</text>
  <text x="68" y="255" font-size="8" fill="#475569">• Register / Login</text>
  <text x="68" y="270" font-size="8" fill="#475569">• Profile Updates</text>
  <text x="68" y="285" font-size="8" fill="#475569">• JWT Middleware</text>

  <rect x="210" y="215" width="135" height="95" rx="4" fill="#ffffff" stroke="#64748b"/>
  <text x="220" y="235" font-size="10" font-weight="bold">Invoice Controller</text>
  <text x="218" y="255" font-size="8" fill="#475569">• CRUD Operations</text>
  <text x="218" y="270" font-size="8" fill="#475569">• Atomic FY Sequence</text>
  <text x="218" y="285" font-size="8" fill="#475569">• Payment Logging</text>

  <rect x="365" y="215" width="135" height="95" rx="4" fill="#ffffff" stroke="#64748b"/>
  <text x="375" y="235" font-size="10" font-weight="bold">Catalog Controller</text>
  <text x="372" y="255" font-size="8" fill="#475569">• Product Catalog</text>
  <text x="372" y="270" font-size="8" fill="#475569">• Client Directory</text>
  <text x="372" y="285" font-size="8" fill="#475569">• Item Validation</text>

  <rect x="520" y="215" width="135" height="95" rx="4" fill="#ffffff" stroke="#64748b"/>
  <text x="530" y="235" font-size="10" font-weight="bold">Public Sharing</text>
  <text x="528" y="255" font-size="8" fill="#475569">• Tokenized Views</text>
  <text x="528" y="270" font-size="8" fill="#475569">• Read-Only Guard</text>
  <text x="528" y="285" font-size="8" fill="#475569">• Client Statements</text>
</svg>`;

// Diagram 6: Figure 5.7 - Vector UPI QR Code
const d6 = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 340" width="100%" height="100%">
  <defs>
    <style>
      text { font-family: 'Times New Roman', serif; text-anchor: middle; }
    </style>
  </defs>

  <rect width="100%" height="100%" fill="#ffffff" rx="10" stroke="#cbd5e1" stroke-width="2"/>

  <!-- Badge header -->
  <rect x="15" y="15" width="250" height="32" rx="6" fill="#1e3a8a"/>
  <text x="140" y="36" font-size="10" font-weight="bold" fill="#ffffff">Scan &amp; Pay via UPI (NPCI Standard)</text>

  <!-- QR Box -->
  <g transform="translate(45, 60)">
    <rect width="190" height="190" fill="#ffffff" stroke="#cbd5e1" rx="4"/>
    
    <!-- Top-Left Corner Box -->
    <rect x="15" y="15" width="45" height="45" fill="#0f172a"/>
    <rect x="22" y="22" width="31" height="31" fill="#ffffff"/>
    <rect x="29" y="29" width="17" height="17" fill="#0f172a"/>

    <!-- Top-Right Corner Box -->
    <rect x="130" y="15" width="45" height="45" fill="#0f172a"/>
    <rect x="137" y="22" width="31" height="31" fill="#ffffff"/>
    <rect x="144" y="29" width="17" height="17" fill="#0f172a"/>

    <!-- Bottom-Left Corner Box -->
    <rect x="15" y="130" width="45" height="45" fill="#0f172a"/>
    <rect x="22" y="137" width="31" height="31" fill="#ffffff"/>
    <rect x="29" y="144" width="17" height="17" fill="#0f172a"/>

    <!-- Data matrix pixels -->
    <rect x="72" y="22" width="15" height="15" fill="#0f172a"/>
    <rect x="95" y="30" width="15" height="15" fill="#0f172a"/>
    <rect x="72" y="52" width="15" height="15" fill="#0f172a"/>
    <rect x="30" y="82" width="15" height="15" fill="#0f172a"/>
    <rect x="60" y="82" width="30" height="15" fill="#0f172a"/>
    <rect x="105" y="82" width="15" height="15" fill="#0f172a"/>
    <rect x="130" y="82" width="30" height="15" fill="#0f172a"/>
    <rect x="75" y="112" width="15" height="30" fill="#0f172a"/>
    <rect x="105" y="120" width="30" height="15" fill="#0f172a"/>
    <rect x="145" y="128" width="15" height="30" fill="#0f172a"/>
    <rect x="75" y="150" width="30" height="15" fill="#0f172a"/>
    <rect x="115" y="150" width="15" height="15" fill="#0f172a"/>
  </g>

  <!-- Details below QR -->
  <text x="140" y="275" font-size="13" font-weight="bold" fill="#0f172a">Net Payable: ₹70,800.00</text>
  <text x="140" y="295" font-size="10" fill="#475569">VPA: mohit@okhdfcbank</text>
  <text x="140" y="312" font-size="9" fill="#64748b">Ref: INV/2025-26/0042 (NPCI Deep-Link)</text>
</svg>`;

// Write all SVGs to the folder
const diagrams = [
  { file: 'Figure_3.1_System_Architecture.svg', content: d1, title: 'Figure 3.1: InvoZap Three-Tier System Architecture' },
  { file: 'Figure_3.2_Database_Design_ER_Diagram.svg', content: d2, title: 'Figure 3.2: InvoZap Database Design (ER Diagram)' },
  { file: 'Figure_3.3_System_Use_Case_Diagram.svg', content: d3, title: 'Figure 3.3: InvoZap User System Use Case Diagram' },
  { file: 'Figure_3.4_Invoicing_Lifecycle_Workflow_Diagram.svg', content: d4, title: 'Figure 3.4: InvoZap Invoicing & Settlement Lifecycle Workflow Diagram' },
  { file: 'Figure_3.5_Module_Design_Dataflow_Diagram.svg', content: d5, title: 'Figure 3.5: InvoZap Module Architecture & Data Flow Diagram' },
  { file: 'Figure_5.7_NPCI_Vector_UPI_QR_Code.svg', content: d6, title: 'Figure 5.7: NPCI Vector UPI QR Code Payment Module' }
];

diagrams.forEach(d => {
  const filePath = path.join(outputDir, d.file);
  fs.writeFileSync(filePath, d.content, 'utf8');
  console.log(`Saved: ${d.file}`);
});

// Also export Chapter 5 UI Figures as self-contained standalone HTML and SVG cards
const uiFigures = [
  {
    file: 'Figure_5.1_Landing_Workspace_Portal.html',
    title: 'Figure 5.1: InvoZap Landing Page & Workspace Portal',
    body: `
      <div style="font-family: Arial, sans-serif; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px;">
        <div style="display: flex; justify-content: space-between; background: #0f172a; color: #fff; padding: 10px 15px; border-radius: 4px; font-size: 11pt;">
          <span style="font-weight: bold; color: #38bdf8;">⚡ InvoZap Studio</span>
          <div>
            <span style="margin-left: 12px;">+ Create Invoice</span>
            <span style="margin-left: 12px;">Quotations</span>
            <span style="margin-left: 12px;">History</span>
            <span style="margin-left: 12px; background: #1e293b; padding: 2px 8px; border-radius: 12px;">Profile: Mohit Sharma</span>
          </div>
        </div>
        <div style="padding: 25px 15px; text-align: center;">
          <div style="font-size: 9pt; color: #2563eb; font-weight: bold; text-transform: uppercase;">High-Integrity Financial Cockpit for Indian SMBs</div>
          <div style="font-size: 16pt; font-weight: bold; color: #0f172a; margin: 8px 0;">Effortless GST Invoicing, Instant UPI Settlement.</div>
          <div style="font-size: 10.5pt; color: #64748b; max-width: 550px; margin: 0 auto 15px auto;">Generate audit-ready tax invoices in under 60 seconds with integer precision and dynamic QR codes.</div>
          <div style="display: flex; justify-content: center; gap: 12px;">
            <span style="background: #2563eb; color: #fff; padding: 7px 15px; border-radius: 4px; font-size: 10pt; font-weight: bold;">+ Create New Invoice</span>
            <span style="background: #e2e8f0; color: #1e293b; padding: 7px 15px; border-radius: 4px; font-size: 10pt;">Export Invoices CSV</span>
          </div>
        </div>
      </div>
    `
  },
  {
    file: 'Figure_5.2_Authentication_Login.html',
    title: 'Figure 5.2: InvoZap User Authentication & Registration View',
    body: `
      <div style="font-family: Arial, sans-serif; display: flex; justify-content: center; padding: 25px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
        <div style="background: #ffffff; border: 1px solid #cbd5e1; padding: 20px; border-radius: 6px; width: 320px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <div style="font-weight: bold; font-size: 13pt; margin-bottom: 12px; color: #0f172a;">InvoZap Account Login</div>
          <div style="background: #f1f5f9; padding: 8px; margin-bottom: 10px; border-radius: 4px; font-size: 10pt; text-align: left;">Email: <code>mohit@invozap.dev</code></div>
          <div style="background: #f1f5f9; padding: 8px; margin-bottom: 12px; border-radius: 4px; font-size: 10pt; text-align: left;">Password: <code>••••••••••••</code></div>
          <div style="background: #2563eb; color: #fff; padding: 8px 15px; border-radius: 4px; font-size: 10.5pt; font-weight: bold; cursor: pointer;">Sign In to Workspace</div>
          <div style="font-size: 8.5pt; color: #64748b; margin-top: 10px;">Protected with BCrypt (Cost 10) & JWT Tokenization</div>
        </div>
      </div>
    `
  },
  {
    file: 'Figure_5.3_Invoice_Authoring_GST.html',
    title: 'Figure 5.3: Invoice Authoring Interface with Integer Paise & GST Split',
    body: `
      <div style="font-family: Arial, sans-serif; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px;">
        <div style="display: flex; justify-content: space-between; font-size: 10.5pt; padding-bottom: 8px; border-bottom: 1px solid #cbd5e1; margin-bottom: 10px;">
          <div><strong>Invoice #:</strong> <code>INV/2025-26/0042</code></div>
          <div><strong>Date:</strong> 27 Nov 2025</div>
          <div><strong>Due Date:</strong> 12 Dec 2025</div>
        </div>
        <div style="display: flex; gap: 12px; margin-bottom: 12px;">
          <div style="flex: 1; background: #ffffff; border: 1px solid #cbd5e1; padding: 10px; border-radius: 4px; font-size: 9.5pt;">
            <div style="font-weight: bold; color: #1e3a8a; margin-bottom: 4px;">Billed By (Vendor)</div>
            <div><strong>Sharma Tech Services</strong></div>
            <div>GSTIN: <code>27AAPCS1234F1Z8</code> (Maharashtra - 27)</div>
          </div>
          <div style="flex: 1; background: #ffffff; border: 1px solid #cbd5e1; padding: 10px; border-radius: 4px; font-size: 9.5pt;">
            <div style="font-weight: bold; color: #1e3a8a; margin-bottom: 4px;">Billed To (Client)</div>
            <div><strong>Apex Digital Solutions</strong></div>
            <div>GSTIN: <code>27BBNCD5678G2Z1</code> (Maharashtra - 27)</div>
            <div style="display: inline-block; background: #dcfce7; color: #15803d; font-size: 8.5pt; padding: 2px 8px; border-radius: 3px; font-weight: bold; margin-top: 5px;">Intra-State: CGST (9%) + SGST (9%)</div>
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-bottom: 10px;">
          <thead>
            <tr style="background: #f1f5f9;"><th style="border: 1px solid #cbd5e1; padding: 6px;">Item Description</th><th style="border: 1px solid #cbd5e1; padding: 6px;">HSN</th><th style="border: 1px solid #cbd5e1; padding: 6px;">Qty</th><th style="border: 1px solid #cbd5e1; padding: 6px;">Rate (₹)</th><th style="border: 1px solid #cbd5e1; padding: 6px;">Tax</th><th style="border: 1px solid #cbd5e1; padding: 6px;">Total (₹)</th></tr>
          </thead>
          <tbody>
            <tr><td style="border: 1px solid #cbd5e1; padding: 6px;">Full-Stack Cloud Consulting</td><td style="border: 1px solid #cbd5e1; padding: 6px;">998313</td><td style="border: 1px solid #cbd5e1; padding: 6px;">1</td><td style="border: 1px solid #cbd5e1; padding: 6px;">40,000.00</td><td style="border: 1px solid #cbd5e1; padding: 6px;">18%</td><td style="border: 1px solid #cbd5e1; padding: 6px;">40,000.00</td></tr>
            <tr><td style="border: 1px solid #cbd5e1; padding: 6px;">API Security Auditing</td><td style="border: 1px solid #cbd5e1; padding: 6px;">998314</td><td style="border: 1px solid #cbd5e1; padding: 6px;">1</td><td style="border: 1px solid #cbd5e1; padding: 6px;">20,000.00</td><td style="border: 1px solid #cbd5e1; padding: 6px;">18%</td><td style="border: 1px solid #cbd5e1; padding: 6px;">20,000.00</td></tr>
          </tbody>
        </table>
        <div style="text-align: right; font-size: 10pt; line-height: 1.5;">
          <div>Taxable Subtotal: ₹60,000.00</div>
          <div>CGST (9.0%): ₹5,400.00 &nbsp;|&nbsp; SGST (9.0%): ₹5,400.00</div>
          <div style="font-size: 11pt; color: #1e3a8a; border-top: 1px solid #cbd5e1; margin-top: 5px; padding-top: 4px;"><strong>Net Grand Total: ₹70,800.00</strong> (7,080,000 Paise)</div>
        </div>
      </div>
    `
  },
  {
    file: 'Figure_5.6_Invoice_Ledger_Export.html',
    title: 'Figure 5.6: Invoice Ledger, Status Tracking, and Export Controls',
    body: `
      <div style="font-family: Arial, sans-serif; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px;">
        <div style="display: flex; gap: 10px; margin-bottom: 12px;">
          <div style="flex: 1; background: #ffffff; border: 1px solid #cbd5e1; padding: 8px; border-radius: 4px; text-align: center;">
            <div style="font-size: 8pt; color: #64748b;">Total Billed</div>
            <div style="font-size: 12pt; font-weight: bold;">₹2,84,500.00</div>
          </div>
          <div style="flex: 1; background: #ffffff; border: 1px solid #cbd5e1; padding: 8px; border-radius: 4px; text-align: center;">
            <div style="font-size: 8pt; color: #64748b;">Collected</div>
            <div style="font-size: 12pt; font-weight: bold; color: #16a34a;">₹2,13,700.00</div>
          </div>
          <div style="flex: 1; background: #ffffff; border: 1px solid #cbd5e1; padding: 8px; border-radius: 4px; text-align: center;">
            <div style="font-size: 8pt; color: #64748b;">Outstanding Balance</div>
            <div style="font-size: 12pt; font-weight: bold; color: #d97706;">₹70,800.00</div>
          </div>
          <div style="display: flex; align-items: center;">
            <span style="background: #2563eb; color: #fff; padding: 8px 12px; border-radius: 4px; font-size: 9.5pt; font-weight: bold;">📥 Export Invoices CSV</span>
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt;">
          <thead>
            <tr style="background: #f1f5f9;"><th style="border: 1px solid #cbd5e1; padding: 6px;">Invoice #</th><th style="border: 1px solid #cbd5e1; padding: 6px;">Client</th><th style="border: 1px solid #cbd5e1; padding: 6px;">Issue Date</th><th style="border: 1px solid #cbd5e1; padding: 6px;">Total (₹)</th><th style="border: 1px solid #cbd5e1; padding: 6px;">Status</th><th style="border: 1px solid #cbd5e1; padding: 6px;">Actions</th></tr>
          </thead>
          <tbody>
            <tr><td style="border: 1px solid #cbd5e1; padding: 6px;"><code>INV/2025-26/0042</code></td><td style="border: 1px solid #cbd5e1; padding: 6px;">Apex Digital Solutions</td><td style="border: 1px solid #cbd5e1; padding: 6px;">27 Nov 2025</td><td style="border: 1px solid #cbd5e1; padding: 6px;">₹70,800.00</td><td style="border: 1px solid #cbd5e1; padding: 6px;"><span style="background: #fef3c7; color: #b45309; padding: 2px 6px; border-radius: 3px; font-weight: bold;">UNPAID</span></td><td style="border: 1px solid #cbd5e1; padding: 6px;">[View] [Record Pay] [PDF]</td></tr>
            <tr><td style="border: 1px solid #cbd5e1; padding: 6px;"><code>INV/2025-26/0041</code></td><td style="border: 1px solid #cbd5e1; padding: 6px;">NextGen Media Labs</td><td style="border: 1px solid #cbd5e1; padding: 6px;">20 Nov 2025</td><td style="border: 1px solid #cbd5e1; padding: 6px;">₹1,18,000.00</td><td style="border: 1px solid #cbd5e1; padding: 6px;"><span style="background: #dcfce7; color: #15803d; padding: 2px 6px; border-radius: 3px; font-weight: bold;">PAID</span></td><td style="border: 1px solid #cbd5e1; padding: 6px;">[View] [Download]</td></tr>
          </tbody>
        </table>
      </div>
    `
  },
  {
    file: 'Figure_5.8_Quality_Audit_Verification.html',
    title: 'Figure 5.8: 12-Point Quality Audit Verification Output',
    body: `
      <div style="font-family: Arial, sans-serif; background: #f0fdf4; border: 1px solid #86efac; padding: 20px; border-radius: 6px; text-align: center;">
        <div style="font-size: 13pt; font-weight: bold; color: #15803d;">✅ Quality Audit Status: 12 / 12 Checks Passed</div>
        <div style="font-size: 10pt; color: #166534; margin-top: 6px; max-width: 600px; margin-left: auto; margin-right: auto;">
          All GSTIN formats, HSN codes, Place of Supply alignments, mathematical balances, and date chronologies are strictly verified. Ready for transmission.
        </div>
      </div>
    `
  }
];

uiFigures.forEach(f => {
  const standalone = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${f.title}</title>
  <style>
    body { font-family: 'Times New Roman', serif; background: #e2e8f0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .container { background: #ffffff; padding: 25px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); max-width: 800px; width: 100%; }
    h2 { font-size: 14pt; color: #1e3a8a; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>${f.title}</h2>
    ${f.body}
  </div>
</body>
</html>`;
  fs.writeFileSync(path.join(outputDir, f.file), standalone, 'utf8');
  console.log('Saved: ' + f.file);
});

// Also create an index HTML gallery so user can open all diagrams together in browser
const galleryHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>InvoZap Report Diagrams & Figures Gallery</title>
  <style>
    body { font-family: 'Times New Roman', serif; background: #f8fafc; padding: 25px; color: #0f172a; }
    h1 { text-align: center; color: #1e3a8a; margin-bottom: 5px; font-size: 20pt; }
    p.sub { text-align: center; color: #64748b; margin-bottom: 30px; font-size: 13pt; }
    .grid { display: flex; flex-direction: column; gap: 30px; max-width: 900px; margin: 0 auto; }
    .card { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .card-title { font-size: 14pt; font-weight: bold; color: #1e3a8a; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    .card-actions { margin-top: 15px; font-size: 11pt; }
    .card-actions a { color: #2563eb; text-decoration: none; font-weight: bold; margin-right: 15px; }
    .card-actions a:hover { text-decoration: underline; }
    .img-box { text-align: center; background: #fafafa; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 15px; }
    img, svg { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  <h1>InvoZap Project Report - Diagrams & Figures Gallery</h1>
  <p class="sub">All system architecture, entity-relationship, use case, workflow, module design, and UI figures from the project report</p>

  <div class="grid">
    <h2 style="color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 5px; margin-top: 10px;">Part 1: Chapter 3 System Design Diagrams</h2>
    ${diagrams.map(d => `
      <div class="card">
        <div class="card-title">${d.title}</div>
        <div class="img-box">
          <img src="${d.file}" alt="${d.title}" />
        </div>
        <div class="card-actions">
          <a href="${d.file}" download>📥 Download File (${d.file})</a>
          <a href="${d.file}" target="_blank">🔍 Open in New Tab</a>
        </div>
      </div>
    `).join('\n')}

    <h2 style="color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 5px; margin-top: 25px;">Part 2: Chapter 5 Results & UI Walkthrough Figures</h2>
    ${uiFigures.map(f => `
      <div class="card">
        <div class="card-title">${f.title}</div>
        <div class="img-box">
          <iframe src="${f.file}" style="width: 100%; height: 260px; border: none; background: #ffffff;"></iframe>
        </div>
        <div class="card-actions">
          <a href="${f.file}" download>📥 Download File (${f.file})</a>
          <a href="${f.file}" target="_blank">🔍 Open in New Tab</a>
        </div>
      </div>
    `).join('\n')}
  </div>
</body>
</html>
`;

fs.writeFileSync(path.join(outputDir, 'index.html'), galleryHtml, 'utf8');
console.log('Saved: index.html (Diagrams Gallery)');
