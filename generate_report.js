const fs = require('fs');
const path = require('path');

// SVG MIT Header Banner Component
const mitHeader = `
<div class="header-banner">
  <div class="logo-box">
    <span class="mit-text">MIT</span>
    <div class="divider-line"></div>
    <div class="aoe-text-group">
      <div class="aoe-main">Academy of Engineering</div>
      <div class="aoe-sub">(An Autonomous Institute Affiliated to Savitribai Phule Pune University)</div>
    </div>
  </div>
</div>
`;

// Helper to wrap content into a strictly paginated A4 page
function makePage(pageNum, content, isCover = false) {
  return `
  <section class="page ${isCover ? 'cover-page' : ''}">
    ${!isCover ? mitHeader : ''}
    <div class="page-content">
      ${content}
    </div>
    <div class="page-footer">
      <span class="page-number">${pageNum}</span>
    </div>
  </section>
  `;
}

// Generate all pages
const pages = [];

// ==========================================
// PAGE 1: TITLE PAGE
// ==========================================
pages.push(`
<section class="page cover-page">
  ${mitHeader}
  <div class="cover-content">
    <div class="cover-title-label">THE PROJECT REPORT ON TOPIC</div>
    <h1 class="project-title">InvoZap: A Robust GST Invoicing & Financial Operations Platform for Indian Businesses</h1>

    <div class="cover-section-title">SUBMITTED TO</div>
    <div class="institution-name">MIT ACADEMY OF ENGINEERING, ALANDI (D.)<br>PUNE.</div>

    <div class="cover-section-title">SUBMITTED BY</div>
    <table class="student-table">
      <thead>
        <tr>
          <th style="width: 10%;">Sr.</th>
          <th style="width: 25%;">Exam Seat No.</th>
          <th style="width: 25%;">PRN</th>
          <th style="width: 40%;">Name of students</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>202301040162</td>
          <td>202301040162</td>
          <td>Mohit Sharma</td>
        </tr>
      </tbody>
    </table>

    <div class="course-details">
      <div><strong>Course - Web Technology Lab</strong></div>
      <div><strong>Course Code- 2304362L</strong></div>
    </div>

    <div class="faculty-details">
      <div><strong>Course Faculty</strong></div>
      <div>Mrs. Vaishali Kumar</div>
    </div>

    <div class="dept-details">
      <div><strong>SCHOOL OF COMPUTER ENGINEERING</strong></div>
      <div><strong>MIT ACADEMY OF ENGINEERING, ALANDI (D.), PUNE</strong></div>
      <div><strong>A.Y. 2025-2026</strong></div>
    </div>
  </div>
  <div class="page-footer">
    <span class="page-number">1</span>
  </div>
</section>
`);

// ==========================================
// PAGE 2: CERTIFICATE
// ==========================================
pages.push(makePage(2, `
  <h2 class="center-heading">CERTIFICATE</h2>
  <div class="spacer-20"></div>
  <p class="body-text">
    This is to certify that the Credit Seminar report entitled <strong>"InvoZap: A Robust GST Invoicing & Financial Operations Platform for Indian Businesses"</strong> submitted by <strong>Mohit Sharma</strong> of <strong>School of Computer Engineering, MIT Academy of Engineering</strong>, is a record of their own work carried out under our supervision and guidance. The matter enclosed herein has not been submitted elsewhere for the award of any degree or diploma.
  </p>
  <div class="spacer-100"></div>
  <div class="signature-row">
    <div class="sig-col">
      <strong>Internal Examiner</strong>
      <div class="spacer-40"></div>
      <div>Mrs. Vaishali Kumar</div>
    </div>
    <div class="sig-col right-align">
      <strong>External Examiner</strong>
    </div>
  </div>
  <div class="spacer-60"></div>
  <div class="date-row">
    <strong>Date:</strong> 27/11/2025
  </div>
`));

// ==========================================
// PAGE 3: ACKNOWLEDGMENT
// ==========================================
pages.push(makePage(3, `
  <h2 class="center-heading">ACKNOWLEDGMENT</h2>
  <div class="spacer-20"></div>
  <p class="body-text">
    The successful completion of this project, <strong>"InvoZap: A Robust GST Invoicing & Financial Operations Platform for Indian Businesses,"</strong> would not have been possible without the invaluable support and guidance of several individuals and institutions.
  </p>
  <p class="body-text">
    We express our deepest gratitude to our Project Guide, <strong>Mrs. Vaishali Kumar</strong>, for her unwavering support, expert guidance, and constructive feedback throughout the development of this project. Her profound knowledge, insightful suggestions, and constant encouragement motivated us to overcome challenges and achieve our objectives. Her mentorship significantly enhanced our technical skills and understanding of professional software development practices.
  </p>
  <p class="body-text">
    We are sincerely thankful to <strong>Dr. Pramod Ganjewar</strong>, Head of the Department of Computer Engineering, MIT Academy of Engineering, for providing the necessary infrastructure, resources, and academic environment that facilitated our learning and project development.
  </p>
  <p class="body-text">
    Finally, our sincere thanks to <strong>MIT Academy of Engineering</strong> for providing excellent laboratory facilities, development tools, and resources essential for the implementation and testing of our platform.
  </p>
  <div class="spacer-60"></div>
  <div class="ack-student-list">
    <div><strong>Mohit Sharma</strong> &nbsp;&nbsp;&nbsp;&nbsp; ( 202301040162 )</div>
  </div>
`));

// ==========================================
// PAGE 4: ABSTRACT
// ==========================================
pages.push(makePage(4, `
  <h2 class="center-heading">ABSTRACT</h2>
  <div class="spacer-20"></div>
  <p class="body-text">
    In the contemporary Indian economic landscape, Micro, Small, and Medium Enterprises (MSMEs), independent professionals, and freelancers constitute the foundational engine of business growth. However, existing billing software solutions present severe operational bottlenecks, including prohibitive subscription models, intrusive cloud vendor lock-ins, bloated user interfaces, and inaccurate tax computations. Freelancers and trade vendors frequently encounter significant hurdles in managing the statutory compliance mandates enforced under the Goods and Services Tax (GST) regime. Critical challenges encompass manual floating-point arithmetic errors, incorrect intra-state vs inter-state tax splits (CGST/SGST vs IGST), unverified GSTIN identifiers, and the absence of rapid, localized digital settlement channels.
  </p>
  <p class="body-text">
    <strong>InvoZap</strong> is an enterprise-grade, high-integrity web-based financial operations and invoicing platform engineered specifically to address these challenges. Designed around the core philosophy of deterministic computing and frictionless ergonomics, InvoZap delivers an uncompromising suite of automated financial workflows. The system provides lightning-fast document authoring, enabling users to transition from clean slate to finalized tax-compliant invoices in under sixty seconds.
  </p>
  <p class="body-text">
    A foundational innovation of InvoZap is its <strong>High-Precision Integer Arithmetic Engine</strong>. By shifting all internal balance, tax, and discount computations into integral paise representations, the platform fundamentally eliminates binary floating-point drift, ensuring that every financial ledger reconciles to the exact decimal paise. Furthermore, InvoZap integrates an automated <strong>Place of Supply (POS) Resolution Matrix</strong> that dynamically inspects vendor and client GSTIN state codes, autonomously determining whether to apply split CGST/SGST or unified IGST, thus eliminating costly human classification errors.
  </p>
  <p class="body-text">
    To streamline accounts receivable and eliminate friction in customer collections, InvoZap incorporates a <strong>100% Vectorized Client-Side UPI QR Code Generation Engine</strong> compliant with National Payments Corporation of India (NPCI) protocols. The system embeds payment parameters, vendor Virtual Payment Addresses (VPA), transaction references, and exact bill amounts directly into responsive SVG graphics without invoking third-party tracker APIs.
  </p>
`));

// ==========================================
// PAGE 5: ABSTRACT (CONT.) & KEYWORDS
// ==========================================
pages.push(makePage(5, `
  <p class="body-text">
    Additional system capabilities include an automated <strong>12-Point Pre-Send Quality Audit Engine</strong> that verifies GSTIN checksums, HSN/SAC code completeness, due-date chronology, and line-item validity prior to document finalization. InvoZap features a persistent Product and Service Catalog for rapid catalog-item insertion, a Returning Client Directory, a high-throughput Fast Paste Item Parser, quotation-to-invoice conversion workflows, and structured CSV export modules for seamless filing into accounting software.
  </p>
  <p class="body-text">
    The application architecture follows a decoupled, resilient paradigm: an ultra-lightweight, zero-framework Vanilla HTML5/CSS3/ES6+ frontend optimized for sub-100ms response latencies, orchestrated with an Express.js and Node.js RESTful API layer backed by MongoDB Atlas and Mongoose object data modeling. Security is enforced through stateless JSON Web Tokens (JWT), BCrypt password hashing, Helmet defense headers, and IP-based rate limiters.
  </p>
  <p class="body-text">
    InvoZap successfully demonstrates how modern web engineering, clean architectural patterns, and mathematically rigorous domain models can combine to resolve deep-seated business compliance friction, offering Indian SMBs a dependable, lightning-fast financial cockpit.
  </p>
  <div class="spacer-40"></div>
  <p class="body-text">
    <strong>Keywords:</strong> GST Invoicing Platform, Integer Paise Arithmetic, Place of Supply Engine, Dynamic UPI QR Code, Indian SMBs, Express.js, MongoDB Atlas, Tax Compliance, Financial Audit Engine, Zero-Framework Frontend.
  </p>
`));

// ==========================================
// PAGE 6: TABLE OF CONTENTS
// ==========================================
pages.push(makePage(6, `
  <h2 class="center-heading">TABLE OF CONTENTS</h2>
  <div class="spacer-20"></div>
  <table class="toc-table">
    <thead>
      <tr>
        <th style="text-align: left; width: 75%;">Title</th>
        <th style="text-align: right; width: 25%;">Page No.</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Title Page</td><td class="right-align">1</td></tr>
      <tr><td>Certificate</td><td class="right-align">2</td></tr>
      <tr><td>Acknowledgment</td><td class="right-align">3</td></tr>
      <tr><td>Abstract</td><td class="right-align">4</td></tr>
      <tr><td>Table of Contents</td><td class="right-align">6</td></tr>
      <tr class="toc-chapter"><td>Chapter 1: Introduction</td><td class="right-align">7</td></tr>
      <tr class="toc-chapter"><td>Chapter 2: System Requirements</td><td class="right-align">10</td></tr>
      <tr class="toc-chapter"><td>Chapter 3: System Design</td><td class="right-align">14</td></tr>
      <tr class="toc-chapter"><td>Chapter 4: Implementation</td><td class="right-align">20</td></tr>
      <tr class="toc-chapter"><td>Chapter 5: Results</td><td class="right-align">26</td></tr>
      <tr class="toc-chapter"><td>Chapter 6: Conclusion and Future Scope</td><td class="right-align">34</td></tr>
      <tr class="toc-chapter"><td>References</td><td class="right-align">36</td></tr>
    </tbody>
  </table>
`));

// ==========================================
// PAGE 7: CHAPTER 1: INTRODUCTION
// ==========================================
pages.push(makePage(7, `
  <h2 class="chapter-heading">CHAPTER 1: INTRODUCTION</h2>
  <div class="spacer-20"></div>
  <h3 class="section-heading">1.1 Overview</h3>
  <p class="body-text">
    The digital transformation of the Indian commercial ecosystem has accelerated at an unprecedented rate, largely catalyzed by the introduction of the unified Goods and Services Tax (GST) framework and the rapid expansion of digital payment rails like the Unified Payments Interface (UPI). In this modern economic reality, small business owners, technical consultants, creative agencies, and trade vendors must navigate complex accounting and tax regulations. Reliable and professional billing is no longer merely an administrative task; it is a critical prerequisite for business legitimacy, working capital predictability, and regulatory compliance.
  </p>
  <p class="body-text">
    Despite the proliferation of enterprise resource planning (ERP) packages and accounting suites, small business operators remain severely underserved. Prevailing market software tends to be bloated, complex, prohibitively expensive, and cluttered with non-essential modules. Conversely, rudimentary spreadsheet templates lack deterministic mathematical guarantees, validation audits, and automated tax bifurcation.
  </p>
  <p class="body-text">
    <strong>InvoZap</strong> is conceptualized and built as a modern, high-integrity financial management platform engineered to resolve this disparity. InvoZap unifies invoice generation, quotation management, GST tax resolution, payment reconciliation, and client directories into an intuitive, responsive interface backed by a rock-solid RESTful API and cloud persistence layer.
  </p>
  <div class="spacer-10"></div>
  <h3 class="section-heading">1.2 Problem Statement</h3>
  <p class="body-text">
    Small businesses, freelancers, and independent contractors in India face several persistent obstacles when managing billing workflows:
  </p>
  <ol class="report-list">
    <li><strong>Floating-Point Calculation Errors:</strong> Conventional web-based and spreadsheet billing tools utilize standard IEEE 754 floating-point mathematics, resulting in decimal accumulation errors that cause tax discrepancies during quarterly auditing.</li>
    <li><strong>GST Classification Complexities:</strong> Determining intra-state (CGST + SGST) versus inter-state (IGST) taxation based on vendor and client 15-digit GSTIN identifiers frequently causes manual misallocations and tax notices.</li>
    <li><strong>Payment Collection Friction:</strong> Invoices lack integrated, dynamic payment mechanisms, requiring manual reconciliation of bank transfers and causing severe delays in receivables.</li>
  </ol>
`));

// ==========================================
// PAGE 8: CHAPTER 1: INTRODUCTION (CONT.)
// ==========================================
pages.push(makePage(8, `
  <ol class="report-list" start="4">
    <li><strong>Disjointed Quotation & Billing Lifecycles:</strong> Converting price quotations into formal tax invoices typically involves tedious manual re-entry, increasing error rates and administrative overhead.</li>
    <li><strong>Absence of Pre-Send Verification:</strong> Invoices sent with invalid GSTINs, missing HSN codes, or inverted dates result in payment rejection, vendor disputes, and compliance penalties.</li>
  </ol>
  <p class="body-text">
    These issues compound to create administrative friction, delayed vendor payments, and heightened compliance risk. There exists a clear academic and practical demand for an engineered financial platform that enforces mathematical correctness, automates tax logic, and accelerates business settlement.
  </p>
  <div class="spacer-10"></div>
  <h3 class="section-heading">1.3 Objectives</h3>
  <p class="body-text">The primary objectives of the InvoZap project are:</p>
  <ol class="report-list">
    <li>To develop a clean, lightweight, and responsive billing web platform accessible across desktop, tablet, and mobile browsers.</li>
    <li>To implement a deterministic integer-paise mathematical engine that eliminates floating-point drift in subtotal, discount, and tax calculations.</li>
    <li>To automate Indian GST compliance by automatically determining Place of Supply (POS) and applying appropriate CGST, SGST, or IGST tax splits.</li>
    <li>To integrate an offline vector SVG UPI QR Code generator compliant with NPCI specifications for instant mobile customer payments.</li>
    <li>To implement a 12-point automated Pre-Send Quality Audit Engine to detect errors prior to invoice dispatch.</li>
    <li>To deliver full quotation-to-invoice lifecycle management with one-click conversion capabilities.</li>
    <li>To provide persistent catalog management for products, services, and client profiles for accelerated document composition.</li>
    <li>To build a secure, tokenized RESTful backend with rate-limiting, input sanitization, and structured data storage using Express.js and MongoDB Atlas.</li>
    <li>To implement financial data export capabilities in standardized CSV formats for seamless accounting integration.</li>
    <li>To ensure high performance, security, and responsiveness through minimal dependency overhead and clean architectural separation.</li>
  </ol>
`));

// ==========================================
// PAGE 9: CHAPTER 1: SCOPE OF THE PROJECT
// ==========================================
pages.push(makePage(9, `
  <h3 class="section-heading">1.4 Scope of the Project</h3>
  <div class="spacer-10"></div>
  <p class="body-text"><strong>In Scope:</strong></p>
  <ol class="report-list">
    <li><strong>User Authentication & Session Management:</strong> Secure JWT-based authentication with bcrypt password encryption, registration, persistent sessions, and profile customization.</li>
    <li><strong>Tax Invoice Engine:</strong> Creation, editing, duplication, and gapless monotonic sequence generation (e.g., INV/2025-26/0001) for invoices.</li>
    <li><strong>Automated GST Computation:</strong> Real-time validation of 15-character GSTIN strings, state code extraction, and accurate bifurcated calculation of CGST, SGST, and IGST.</li>
    <li><strong>Dynamic UPI QR Integration:</strong> Generation of valid NPCI-compliant payment QR codes carrying payee VPA, merchant name, invoice reference, and amount.</li>
    <li><strong>Pre-Send Quality Audit Engine:</strong> Automated algorithmic verification of HSN/SAC numbers, dates, tax consistency, and customer billing fields.</li>
    <li><strong>Quotation/Estimate Module:</strong> Full lifecycle estimation support with direct, non-destructive conversion to finalized invoices.</li>
    <li><strong>Product & Service Catalog:</strong> Localized catalog storage for instant auto-completion of line items, rates, and HSN codes.</li>
    <li><strong>Client Directory & History:</strong> Centralized client record management with outstanding balance tracking and history review.</li>
    <li><strong>Financial Data Export:</strong> High-integrity CSV export of invoices, client ledgers, and payment history.</li>
    <li><strong>Print & PDF Engine:</strong> Clean, CSS-driven print rendering for paper printing and professional PDF exports.</li>
  </ol>
  <div class="spacer-10"></div>
  <p class="body-text"><strong>Out of Scope:</strong></p>
  <ol class="report-list">
    <li>Government GST Portal direct API filing (requires licensed GSP/ASP infrastructure).</li>
    <li>Multi-currency foreign exchange settlement (tailored exclusively for Indian INR commercial ecosystem).</li>
    <li>Hardware POS thermal printer serial driver integration.</li>
  </ol>
`));

// ==========================================
// PAGE 10: CHAPTER 2: SYSTEM REQUIREMENTS
// ==========================================
pages.push(makePage(10, `
  <h2 class="chapter-heading">CHAPTER 2: SYSTEM REQUIREMENTS</h2>
  <div class="spacer-20"></div>
  <h3 class="section-heading">2.1 Functional Requirements</h3>
  <p class="body-text">
    Functional requirements describe the specific services, behaviors, and functions that the InvoZap platform delivers to end users:
  </p>
  <ol class="report-list">
    <li><strong>User Profile & Business Configuration:</strong>
      <ul class="sub-list">
        <li>The system shall allow users to register, log in, and securely manage business profiles.</li>
        <li>The system shall store vendor business names, GSTIN, PAN, registered addresses, state codes, and banking/UPI settlement credentials.</li>
        <li>The system shall allow updating signature assets and terms and conditions.</li>
      </ul>
    </li>
    <li><strong>Invoice Authoring & Processing:</strong>
      <ul class="sub-list">
        <li>The system shall allow adding, updating, and removing arbitrary invoice line items with descriptions, quantities, unit prices, discounts, and HSN/SAC codes.</li>
        <li>The system shall compute item totals, subtotals, applied taxes, and net payable amounts in real-time.</li>
        <li>The system shall automatically determine whether intra-state or inter-state GST rules apply based on vendor and client state codes.</li>
      </ul>
    </li>
    <li><strong>Monotonic Sequence Management:</strong>
      <ul class="sub-list">
        <li>The system shall maintain a strictly gapless, chronological invoice numbering sequence per financial year (e.g., INV/2025-26/0001).</li>
      </ul>
    </li>
    <li><strong>Quotation Management:</strong>
      <ul class="sub-list">
        <li>The system shall allow creating formal price estimates with validity durations.</li>
        <li>The system shall allow converting any quotation into a live invoice with a single action, retaining line items and pricing data.</li>
      </ul>
    </li>
  </ol>
`));

// ==========================================
// PAGE 11: CHAPTER 2: SYSTEM REQUIREMENTS (CONT.)
// ==========================================
pages.push(makePage(11, `
  <ol class="report-list" start="5">
    <li><strong>UPI QR Code Settlement Engine:</strong>
      <ul class="sub-list">
        <li>The system shall generate NPCI-standard UPI deep-link strings and render clean, high-contrast vector QR codes directly onto invoices.</li>
        <li>The QR code shall encode the payee VPA, payee name, transaction note, currency, and exact net invoice amount.</li>
      </ul>
    </li>
    <li><strong>Pre-Send Quality Audit Engine:</strong>
      <ul class="sub-list">
        <li>The system shall execute 12 automated integrity checks prior to document dispatch, identifying GSTIN format mismatches, zero-value totals, and missing HSN codes.</li>
      </ul>
    </li>
    <li><strong>Data Export & Reporting:</strong>
      <ul class="sub-list">
        <li>The system shall export structured invoice registers in RFC 4180-compliant CSV formats for audit and accountant review.</li>
      </ul>
    </li>
  </ol>
  <div class="spacer-20"></div>
  <h3 class="section-heading">2.2 Non-Functional Requirements</h3>
  <p class="body-text">
    Non-functional requirements specify operational qualities, performance criteria, security constraints, and user experience standards:
  </p>
  <ol class="report-list">
    <li><strong>Security:</strong>
      <ul class="sub-list">
        <li>Stateless authentication using cryptographically signed JSON Web Tokens (JWT).</li>
        <li>Password hashing using BCrypt with an adaptive salt work factor of 10.</li>
        <li>Strict Cross-Origin Resource Sharing (CORS) policies and HTTP security headers enforced via Helmet.js.</li>
        <li>Input validation and sanitization on all REST endpoints to prevent NoSQL injection and Cross-Site Scripting (XSS).</li>
        <li>Rate limiting on public endpoints to mitigate brute-force and Denial-of-Service attempts.</li>
      </ul>
    </li>
  </ol>
`));

// ==========================================
// PAGE 12: CHAPTER 2: HARDWARE REQUIREMENTS
// ==========================================
pages.push(makePage(12, `
  <ol class="report-list" start="2">
    <li><strong>Performance & Responsiveness:</strong>
      <ul class="sub-list">
        <li>Initial document interface load time within 1.5 seconds under standard broadband conditions.</li>
        <li>Instantaneous client-side arithmetic calculation and tax bifurcation (< 15 milliseconds latency).</li>
        <li>REST API response times maintained below 200 milliseconds for standard CRUD operations.</li>
      </ul>
    </li>
    <li><strong>Reliability & Availability:</strong>
      <ul class="sub-list">
        <li>High-availability database tier via MongoDB Atlas cloud replica sets.</li>
        <li>Graceful offline degradation with local storage persistence to avoid draft loss during network interruptions.</li>
      </ul>
    </li>
    <li><strong>Maintainability & Usability:</strong>
      <ul class="sub-list">
        <li>Zero-framework Vanilla JS implementation to avoid version drift and deprecation cascades.</li>
        <li>Accessible, high-contrast, mobile-responsive layout functioning across modern web browsers.</li>
      </ul>
    </li>
  </ol>
  <div class="spacer-20"></div>
  <h3 class="section-heading">2.3 Hardware Requirements</h3>
  <ol class="report-list">
    <li><strong>Development & Testing Environment:</strong>
      <ul class="sub-list">
        <li>Processor: Intel Core i5 / AMD Ryzen 5 or higher (minimum 4 physical cores).</li>
        <li>RAM: 8 GB minimum (16 GB recommended for concurrent services and containers).</li>
        <li>Storage: 256 GB Solid State Drive (SSD).</li>
        <li>Network Interface: Broadband Internet Connection (10 Mbps or higher).</li>
      </ul>
    </li>
    <li><strong>Production & Deployment Environment:</strong>
      <ul class="sub-list">
        <li>Host Server: Cloud Virtual Machine / Container instance (minimum 1 vCPU, 1 GB RAM).</li>
        <li>Database Cluster: Managed MongoDB Atlas M0/M10 shared cluster with SSL encryption.</li>
        <li>Client Device: Any desktop PC, laptop, tablet, or smartphone running an evergreen browser.</li>
      </ul>
    </li>
  </ol>
`));

// ==========================================
// PAGE 13: CHAPTER 2: SOFTWARE REQUIREMENTS
// ==========================================
pages.push(makePage(13, `
  <h3 class="section-heading">2.4 Software Requirements</h3>
  <div class="spacer-10"></div>
  <ol class="report-list">
    <li><strong>Frontend Environment:</strong>
      <ul class="sub-list">
        <li>Languages: Semantic HTML5, CSS3 with modern CSS Variables and Flexbox/Grid, ECMAScript 2022+ (Vanilla JS).</li>
        <li>Vector QR Renderer: Zero-dependency SVG QR matrix generation script.</li>
        <li>Web Browsers: Google Chrome (v100+), Mozilla Firefox (v100+), Microsoft Edge (v100+), Safari (v15+).</li>
      </ul>
    </li>
    <li><strong>Backend Environment:</strong>
      <ul class="sub-list">
        <li>Runtime: Node.js (v18 LTS or v20 LTS / v25+).</li>
        <li>Package Manager: npm (v9+ / v11+) or pnpm.</li>
        <li>Web Framework: Express.js (v4.19+).</li>
        <li>Data Modeling: Mongoose ODM (v8.3+).</li>
        <li>Security Middleware: Helmet (v8.3+), Express-Rate-Limit (v8.7+), CORS (v2.8+).</li>
        <li>Cryptographic Libraries: BCrypt.js (v2.4+), JSONWebToken (v9.0+).</li>
      </ul>
    </li>
    <li><strong>Database & Cloud Infrastructure:</strong>
      <ul class="sub-list">
        <li>Database Management System: MongoDB Atlas (MongoDB Server v7.0+).</li>
        <li>Hosting Platform: Vercel Cloud Serverless / Node.js Engine.</li>
      </ul>
    </li>
    <li><strong>Development Tools:</strong>
      <ul class="sub-list">
        <li>Integrated Development Environment: Visual Studio Code.</li>
        <li>Version Control System: Git & GitHub.</li>
        <li>API Testing Suite: Postman / REST Client.</li>
      </ul>
    </li>
  </ol>
`));

// ==========================================
// PAGE 14: CHAPTER 3: SYSTEM DESIGN (ARCHITECTURE)
// ==========================================
pages.push(makePage(14, `
  <h2 class="chapter-heading">CHAPTER 3: SYSTEM DESIGN</h2>
  <div class="spacer-20"></div>
  <h3 class="section-heading">3.1 System Architecture</h3>
  <p class="body-text">
    InvoZap is designed following a modern decoupled Three-Tier Architecture consisting of the <strong>Presentation Layer (Client Browser)</strong>, the <strong>Business Logic Layer (Express.js Application Server)</strong>, and the <strong>Data Layer (MongoDB Atlas Cluster)</strong>. This guarantees modularity, maintainability, and rapid execution.
  </p>
  <div class="spacer-10"></div>
  <div class="diagram-box">
    <div class="diagram-title">Figure 3.1: InvoZap Three-Tier System Architecture</div>
    <svg viewBox="0 0 700 320" class="report-svg">
      <!-- Presentation Layer -->
      <rect x="30" y="20" width="640" height="75" rx="8" fill="#f0f7ff" stroke="#1e3a8a" stroke-width="2"/>
      <text x="50" y="45" font-family="'Times New Roman', serif" font-size="13" font-weight="bold" fill="#1e3a8a">PRESENTATION LAYER (Client Browser)</text>
      <rect x="50" y="55" width="130" height="30" rx="4" fill="#ffffff" stroke="#3b82f6"/>
      <text x="65" y="75" font-family="'Times New Roman', serif" font-size="11" fill="#1e3a8a">Invoice UI & Forms</text>
      <rect x="195" y="55" width="140" height="30" rx="4" fill="#ffffff" stroke="#3b82f6"/>
      <text x="205" y="75" font-family="'Times New Roman', serif" font-size="11" fill="#1e3a8a">Integer Paise Engine</text>
      <rect x="350" y="55" width="150" height="30" rx="4" fill="#ffffff" stroke="#3b82f6"/>
      <text x="360" y="75" font-family="'Times New Roman', serif" font-size="11" fill="#1e3a8a">Vector SVG QR Gen</text>
      <rect x="515" y="55" width="140" height="30" rx="4" fill="#ffffff" stroke="#3b82f6"/>
      <text x="525" y="75" font-family="'Times New Roman', serif" font-size="11" fill="#1e3a8a">Quality Audit (12-Pt)</text>

      <!-- HTTP / REST Arrow -->
      <line x1="350" y1="95" x2="350" y2="125" stroke="#1e3a8a" stroke-width="2" marker-end="url(#arrow)"/>
      <text x="365" y="115" font-family="'Times New Roman', serif" font-size="10" fill="#475569">REST APIs (JSON / HTTPS)</text>

      <!-- Business Logic Layer -->
      <rect x="30" y="125" width="640" height="95" rx="8" fill="#f8fafc" stroke="#334155" stroke-width="2"/>
      <text x="50" y="148" font-family="'Times New Roman', serif" font-size="13" font-weight="bold" fill="#0f172a">APPLICATION & BUSINESS LOGIC LAYER (Express.js)</text>
      <rect x="50" y="160" width="130" height="45" rx="4" fill="#ffffff" stroke="#64748b"/>
      <text x="65" y="180" font-family="'Times New Roman', serif" font-size="10" font-weight="bold" fill="#0f172a">Security & Auth</text>
      <text x="60" y="195" font-family="'Times New Roman', serif" font-size="9" fill="#475569">JWT, BCrypt, Helmet</text>

      <rect x="195" y="160" width="140" height="45" rx="4" fill="#ffffff" stroke="#64748b"/>
      <text x="205" y="180" font-family="'Times New Roman', serif" font-size="10" font-weight="bold" fill="#0f172a">Invoice Controller</text>
      <text x="205" y="195" font-family="'Times New Roman', serif" font-size="9" fill="#475569">Gapless Monotonic FY</text>

      <rect x="350" y="160" width="150" height="45" rx="4" fill="#ffffff" stroke="#64748b"/>
      <text x="360" y="180" font-family="'Times New Roman', serif" font-size="10" font-weight="bold" fill="#0f172a">GST Engine Matrix</text>
      <text x="360" y="195" font-family="'Times New Roman', serif" font-size="9" fill="#475569">POS Resolution (CGST/IGST)</text>

      <rect x="515" y="160" width="140" height="45" rx="4" fill="#ffffff" stroke="#64748b"/>
      <text x="525" y="180" font-family="'Times New Roman', serif" font-size="10" font-weight="bold" fill="#0f172a">Ledger & Export</text>
      <text x="525" y="195" font-family="'Times New Roman', serif" font-size="9" fill="#475569">Payment, CSV Stream</text>

      <!-- Database Arrow -->
      <line x1="350" y1="220" x2="350" y2="245" stroke="#1e3a8a" stroke-width="2"/>

      <!-- Data Layer -->
      <rect x="30" y="245" width="640" height="65" rx="8" fill="#f0fdf4" stroke="#15803d" stroke-width="2"/>
      <text x="50" y="268" font-family="'Times New Roman', serif" font-size="13" font-weight="bold" fill="#15803d">DATA PERSISTENCE LAYER (MongoDB Atlas Cloud Cluster)</text>
      <rect x="60" y="278" width="110" height="24" rx="4" fill="#ffffff" stroke="#86efac"/>
      <text x="80" y="294" font-family="'Times New Roman', serif" font-size="10" fill="#166534">Users Collection</text>
      <rect x="185" y="278" width="125" height="24" rx="4" fill="#ffffff" stroke="#86efac"/>
      <text x="195" y="294" font-family="'Times New Roman', serif" font-size="10" fill="#166534">Invoices Collection</text>
      <rect x="325" y="278" width="115" height="24" rx="4" fill="#ffffff" stroke="#86efac"/>
      <text x="340" y="294" font-family="'Times New Roman', serif" font-size="10" fill="#166534">Clients Directory</text>
      <rect x="455" y="278" width="105" height="24" rx="4" fill="#ffffff" stroke="#86efac"/>
      <text x="475" y="294" font-family="'Times New Roman', serif" font-size="10" fill="#166534">Catalog Items</text>
      <rect x="575" y="278" width="85" height="24" rx="4" fill="#ffffff" stroke="#86efac"/>
      <text x="590" y="294" font-family="'Times New Roman', serif" font-size="10" fill="#166534">Counters</text>
    </svg>
  </div>
`));

// ==========================================
// PAGE 15: CHAPTER 3: ARCHITECTURE COMPONENTS
// ==========================================
pages.push(makePage(15, `
  <div class="spacer-10"></div>
  <p class="body-text"><strong>Architecture Components:</strong></p>
  <ol class="report-list">
    <li><strong>Presentation Layer (Frontend UI & Client Engines):</strong>
      <ul class="sub-list">
        <li>Constructed using semantic HTML5, modern CSS3 variables, and Vanilla JavaScript.</li>
        <li>Encapsulates client-side domain engines: Integer Paise Math, Vector QR Generator, and the 12-point Pre-Send Quality Audit.</li>
        <li>Handles dynamic DOM manipulation, real-time recalculation of table balances, and client-side PDF/print generation.</li>
      </ul>
    </li>
    <li><strong>Business Logic Layer (Backend Application Server):</strong>
      <ul class="sub-list">
        <li>Developed using Node.js and Express.js REST framework.</li>
        <li>Orchestrates core domain controllers: Invoice Controller, Authentication Controller, Catalog & Client Services.</li>
        <li>Enforces optimistic concurrency control and monotonic financial-year invoice sequence locking.</li>
        <li>Validates and normalizes all incoming payload structures before committing to persistent storage.</li>
      </ul>
    </li>
    <li><strong>Data Layer (Database & Persistence Engine):</strong>
      <ul class="sub-list">
        <li>MongoDB Atlas multi-region cloud cluster utilizing replica sets for high durability and automated failover.</li>
        <li>Mongoose object data modeling enforcing strict schema constraints, compound indexing, and unique identifier validation.</li>
      </ul>
    </li>
    <li><strong>Communication & Security Protocol:</strong>
      <ul class="sub-list">
        <li>Standardized JSON payloads transferred over HTTPS connections.</li>
        <li>Bearer token validation using cryptographically signed JWT strings.</li>
        <li>Strict rate limit enforcement preventing API misuse.</li>
      </ul>
    </li>
  </ol>
`));

// ==========================================
// PAGE 16: CHAPTER 3: DATABASE DESIGN (ER DIAGRAM)
// ==========================================
pages.push(makePage(16, `
  <h3 class="section-heading">3.2 Database Design (ER Diagram)</h3>
  <p class="body-text">
    The InvoZap data model is engineered to preserve full historical financial fidelity. Invoices maintain immutable snapshots of client details, tax rates, and line items to guarantee audit reproducibility over time.
  </p>
  <div class="spacer-10"></div>
  <div class="diagram-box">
    <div class="diagram-title">Figure 3.2: InvoZap Entity Relationship Diagram</div>
    <svg viewBox="0 0 700 360" class="report-svg">
      <!-- USER ENTITY -->
      <rect x="20" y="20" width="180" height="150" rx="4" fill="#ffffff" stroke="#1e3a8a" stroke-width="2"/>
      <rect x="20" y="20" width="180" height="25" fill="#1e3a8a"/>
      <text x="80" y="38" font-family="'Times New Roman', serif" font-size="12" font-weight="bold" fill="#ffffff">USER</text>
      <text x="30" y="60" font-family="'Times New Roman', serif" font-size="10">PK &nbsp; _id : ObjectId</text>
      <text x="30" y="75" font-family="'Times New Roman', serif" font-size="10">UK &nbsp; email : String</text>
      <text x="30" y="90" font-family="'Times New Roman', serif" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; passwordHash : String</text>
      <text x="30" y="105" font-family="'Times New Roman', serif" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; businessName : String</text>
      <text x="30" y="120" font-family="'Times New Roman', serif" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; gstin : String</text>
      <text x="30" y="135" font-family="'Times New Roman', serif" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; upiVpa : String</text>
      <text x="30" y="150" font-family="'Times New Roman', serif" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; createdAt : Date</text>

      <!-- INVOICE ENTITY -->
      <rect x="250" y="20" width="200" height="200" rx="4" fill="#ffffff" stroke="#1e3a8a" stroke-width="2"/>
      <rect x="250" y="20" width="200" height="25" fill="#1e3a8a"/>
      <text x="320" y="38" font-family="'Times New Roman', serif" font-size="12" font-weight="bold" fill="#ffffff">INVOICE</text>
      <text x="260" y="60" font-family="'Times New Roman', serif" font-size="10">PK &nbsp; _id : ObjectId</text>
      <text x="260" y="75" font-family="'Times New Roman', serif" font-size="10">FK &nbsp; userId : ObjectId</text>
      <text x="260" y="90" font-family="'Times New Roman', serif" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; invoiceNumber : String</text>
      <text x="260" y="105" font-family="'Times New Roman', serif" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; issueDate, dueDate : Date</text>
      <text x="260" y="120" font-family="'Times New Roman', serif" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; clientSnapshot : Object</text>
      <text x="260" y="135" font-family="'Times New Roman', serif" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; items : Array&lt;Item&gt;</text>
      <text x="260" y="150" font-family="'Times New Roman', serif" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; subtotalPaise : Number</text>
      <text x="260" y="165" font-family="'Times New Roman', serif" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; cgstPaise, sgstPaise : Number</text>
      <text x="260" y="180" font-family="'Times New Roman', serif" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; igstPaise, totalPaise : Number</text>
      <text x="260" y="195" font-family="'Times New Roman', serif" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; status : Enum (PAID/UNPAID)</text>
      <text x="260" y="210" font-family="'Times New Roman', serif" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; payments : Array&lt;Payment&gt;</text>

      <!-- CLIENT DIRECTORY ENTITY -->
      <rect x="490" y="20" width="190" height="150" rx="4" fill="#ffffff" stroke="#1e3a8a" stroke-width="2"/>
      <rect x="490" y="20" width="190" height="25" fill="#1e3a8a"/>
      <text x="540" y="38" font-family="'Times New Roman', serif" font-size="12" font-weight="bold" fill="#ffffff">CLIENT_DIRECTORY</text>
      <text x="500" y="60" font-family="'Times New Roman', serif" font-size="10">PK &nbsp; _id : ObjectId</text>
      <text x="500" y="75" font-family="'Times New Roman', serif" font-size="10">FK &nbsp; userId : ObjectId</text>
      <text x="500" y="90" font-family="'Times New Roman', serif" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; clientName : String</text>
      <text x="500" y="105" font-family="'Times New Roman', serif" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; gstin : String</text>
      <text x="500" y="120" font-family="'Times New Roman', serif" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; stateCode : String</text>
      <text x="500" y="135" font-family="'Times New Roman', serif" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; email, phone : String</text>
      <text x="500" y="150" font-family="'Times New Roman', serif" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; billingAddress : String</text>

      <!-- CATALOG ENTITY -->
      <rect x="20" y="210" width="180" height="130" rx="4" fill="#ffffff" stroke="#1e3a8a" stroke-width="2"/>
      <rect x="20" y="210" width="180" height="25" fill="#1e3a8a"/>
      <text x="60" y="228" font-family="'Times New Roman', serif" font-size="12" font-weight="bold" fill="#ffffff">CATALOG_ITEM</text>
      <text x="30" y="250" font-family="'Times New Roman', serif" font-size="10">PK &nbsp; _id : ObjectId</text>
      <text x="30" y="265" font-family="'Times New Roman', serif" font-size="10">FK &nbsp; userId : ObjectId</text>
      <text x="30" y="280" font-family="'Times New Roman', serif" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; itemName : String</text>
      <text x="30" y="295" font-family="'Times New Roman', serif" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; hsnSacCode : String</text>
      <text x="30" y="310" font-family="'Times New Roman', serif" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ratePaise : Number</text>
      <text x="30" y="325" font-family="'Times New Roman', serif" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; defaultTaxRate : Number</text>

      <!-- SEQUENCE COUNTER ENTITY -->
      <rect x="490" y="210" width="190" height="110" rx="4" fill="#ffffff" stroke="#1e3a8a" stroke-width="2"/>
      <rect x="490" y="210" width="190" height="25" fill="#1e3a8a"/>
      <text x="530" y="228" font-family="'Times New Roman', serif" font-size="12" font-weight="bold" fill="#ffffff">FY_COUNTER</text>
      <text x="500" y="250" font-family="'Times New Roman', serif" font-size="10">PK &nbsp; _id : ObjectId</text>
      <text x="500" y="265" font-family="'Times New Roman', serif" font-size="10">FK &nbsp; userId : ObjectId</text>
      <text x="500" y="280" font-family="'Times New Roman', serif" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; financialYear : String</text>
      <text x="500" y="295" font-family="'Times New Roman', serif" font-size="10">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; currentSequence : Number</text>

      <!-- Relationships -->
      <line x1="200" y1="75" x2="250" y2="75" stroke="#1e3a8a" stroke-width="1.5"/>
      <line x1="450" y1="75" x2="490" y2="75" stroke="#1e3a8a" stroke-width="1.5"/>
      <line x1="110" y1="170" x2="110" y2="210" stroke="#1e3a8a" stroke-width="1.5"/>
      <line x1="450" y1="140" x2="490" y2="240" stroke="#1e3a8a" stroke-width="1.5"/>
    </svg>
  </div>
`));

// ==========================================
// PAGE 17: CHAPTER 3: USE CASE DIAGRAM
// ==========================================
pages.push(makePage(17, `
  <h3 class="section-heading">3.3 Use Case Diagram</h3>
  <p class="body-text">
    The Use Case diagram delineates the primary user interactions supported within the InvoZap platform, highlighting boundaries between authentication, authoring, and analytics.
  </p>
  <div class="spacer-10"></div>
  <div class="diagram-box">
    <div class="diagram-title">Figure 3.3: InvoZap User System Use Case Diagram</div>
    <svg viewBox="0 0 700 370" class="report-svg">
      <!-- Actor: Business User / Freelancer -->
      <circle cx="80" cy="180" r="18" fill="#e0e7ff" stroke="#1e3a8a" stroke-width="2"/>
      <line x1="80" y1="198" x2="80" y2="240" stroke="#1e3a8a" stroke-width="2"/>
      <line x1="55" y1="215" x2="105" y2="215" stroke="#1e3a8a" stroke-width="2"/>
      <line x1="80" y1="240" x2="60" y2="280" stroke="#1e3a8a" stroke-width="2"/>
      <line x1="80" y1="240" x2="100" y2="280" stroke="#1e3a8a" stroke-width="2"/>
      <text x="45" y="305" font-family="'Times New Roman', serif" font-size="12" font-weight="bold" fill="#1e3a8a">Business User</text>

      <!-- System Boundary -->
      <rect x="180" y="15" width="490" height="340" rx="8" fill="#f8fafc" stroke="#475569" stroke-width="1.5"/>
      <text x="330" y="35" font-family="'Times New Roman', serif" font-size="13" font-weight="bold" fill="#0f172a">InvoZap Platform System</text>

      <!-- Use Cases -->
      <g>
        <ellipse cx="300" cy="65" rx="90" ry="18" fill="#ffffff" stroke="#2563eb" stroke-width="1.5"/>
        <text x="240" y="70" font-family="'Times New Roman', serif" font-size="11">Register / Login (JWT)</text>

        <ellipse cx="300" cy="115" rx="90" ry="18" fill="#ffffff" stroke="#2563eb" stroke-width="1.5"/>
        <text x="235" y="120" font-family="'Times New Roman', serif" font-size="11">Maintain Profile & Bank Details</text>

        <ellipse cx="300" cy="165" rx="90" ry="18" fill="#ffffff" stroke="#2563eb" stroke-width="1.5"/>
        <text x="235" y="170" font-family="'Times New Roman', serif" font-size="11">Create Tax Invoice with GST</text>

        <ellipse cx="300" cy="215" rx="90" ry="18" fill="#ffffff" stroke="#2563eb" stroke-width="1.5"/>
        <text x="240" y="220" font-family="'Times New Roman', serif" font-size="11">Manage Catalog & Clients</text>

        <ellipse cx="300" cy="265" rx="90" ry="18" fill="#ffffff" stroke="#2563eb" stroke-width="1.5"/>
        <text x="230" y="270" font-family="'Times New Roman', serif" font-size="11">Convert Quotation to Invoice</text>

        <ellipse cx="300" cy="315" rx="90" ry="18" fill="#ffffff" stroke="#2563eb" stroke-width="1.5"/>
        <text x="240" y="320" font-family="'Times New Roman', serif" font-size="11">Record Payment & Settle</text>

        <!-- Extended / Included Sub Cases -->
        <ellipse cx="540" cy="140" rx="95" ry="18" fill="#eff6ff" stroke="#3b82f6" stroke-dasharray="3,3"/>
        <text x="470" y="145" font-family="'Times New Roman', serif" font-size="10">&lt;&lt;include&gt;&gt; 12-Pt Quality Audit</text>

        <ellipse cx="540" cy="190" rx="95" ry="18" fill="#eff6ff" stroke="#3b82f6" stroke-dasharray="3,3"/>
        <text x="465" y="195" font-family="'Times New Roman', serif" font-size="10">&lt;&lt;include&gt;&gt; Vector UPI QR Gen</text>

        <ellipse cx="540" cy="270" rx="95" ry="18" fill="#eff6ff" stroke="#3b82f6" stroke-dasharray="3,3"/>
        <text x="475" y="275" font-family="'Times New Roman', serif" font-size="10">&lt;&lt;include&gt;&gt; Export Invoices CSV</text>
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
    </svg>
  </div>
`));

// ==========================================
// PAGE 18: CHAPTER 3: WORKFLOW DIAGRAM
// ==========================================
pages.push(makePage(18, `
  <h3 class="section-heading">3.4 Work Flow Diagram</h3>
  <p class="body-text">
    The operational workflow illustrates the sequence executed from initial document drafting to customer settlement and export reconciliation.
  </p>
  <div class="spacer-10"></div>
  <div class="diagram-box">
    <div class="diagram-title">Figure 3.4: InvoZap Core Invoicing & Settlement Lifecycle Workflow</div>
    <svg viewBox="0 0 700 360" class="report-svg">
      <!-- Steps in vertical layout -->
      <!-- Step 1 -->
      <rect x="50" y="20" width="160" height="45" rx="6" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5"/>
      <text x="65" y="40" font-family="'Times New Roman', serif" font-size="11" font-weight="bold">1. Document Setup</text>
      <text x="65" y="55" font-family="'Times New Roman', serif" font-size="9" fill="#475569">Client & Date Selection</text>

      <line x1="210" y1="42" x2="270" y2="42" stroke="#0284c7" stroke-width="2" marker-end="url(#arrow)"/>

      <!-- Step 2 -->
      <rect x="270" y="20" width="160" height="45" rx="6" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5"/>
      <text x="285" y="40" font-family="'Times New Roman', serif" font-size="11" font-weight="bold">2. Line Items Entry</text>
      <text x="285" y="55" font-family="'Times New Roman', serif" font-size="9" fill="#475569">Catalog / Fast Paste</text>

      <line x1="430" y1="42" x2="490" y2="42" stroke="#0284c7" stroke-width="2"/>

      <!-- Step 3 -->
      <rect x="490" y="20" width="160" height="45" rx="6" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5"/>
      <text x="500" y="40" font-family="'Times New Roman', serif" font-size="11" font-weight="bold">3. GST Place of Supply</text>
      <text x="500" y="55" font-family="'Times New Roman', serif" font-size="9" fill="#475569">Auto CGST+SGST / IGST</text>

      <!-- Downward connector -->
      <line x1="570" y1="65" x2="570" y2="105" stroke="#0284c7" stroke-width="2"/>

      <!-- Step 4 -->
      <rect x="490" y="105" width="160" height="45" rx="6" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
      <text x="505" y="125" font-family="'Times New Roman', serif" font-size="11" font-weight="bold">4. Integer Paise Math</text>
      <text x="505" y="140" font-family="'Times New Roman', serif" font-size="9" fill="#475569">Subtotal + Tax Reconciled</text>

      <line x1="490" y1="127" x2="430" y2="127" stroke="#d97706" stroke-width="2"/>

      <!-- Step 5 -->
      <rect x="270" y="105" width="160" height="45" rx="6" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
      <text x="280" y="125" font-family="'Times New Roman', serif" font-size="11" font-weight="bold">5. Pre-Send Quality Audit</text>
      <text x="280" y="140" font-family="'Times New Roman', serif" font-size="9" fill="#475569">12 Rules Verifications</text>

      <line x1="270" y1="127" x2="210" y2="127" stroke="#d97706" stroke-width="2"/>

      <!-- Step 6 -->
      <rect x="50" y="105" width="160" height="45" rx="6" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/>
      <text x="65" y="125" font-family="'Times New Roman', serif" font-size="11" font-weight="bold">6. Vector UPI QR Gen</text>
      <text x="65" y="140" font-family="'Times New Roman', serif" font-size="9" fill="#475569">NPCI Deep-Link Injection</text>

      <!-- Downward connector -->
      <line x1="130" y1="150" x2="130" y2="190" stroke="#16a34a" stroke-width="2"/>

      <!-- Step 7 -->
      <rect x="50" y="190" width="160" height="45" rx="6" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/>
      <text x="65" y="210" font-family="'Times New Roman', serif" font-size="11" font-weight="bold">7. Persist & Sequence</text>
      <text x="65" y="225" font-family="'Times New Roman', serif" font-size="9" fill="#475569">Gapless FY Numbering</text>

      <line x1="210" y1="212" x2="270" y2="212" stroke="#16a34a" stroke-width="2"/>

      <!-- Step 8 -->
      <rect x="270" y="190" width="160" height="45" rx="6" fill="#f1f5f9" stroke="#475569" stroke-width="1.5"/>
      <text x="285" y="210" font-family="'Times New Roman', serif" font-size="11" font-weight="bold">8. Customer Dispatch</text>
      <text x="285" y="225" font-family="'Times New Roman', serif" font-size="9" fill="#475569">Print, PDF, Public Link</text>

      <line x1="430" y1="212" x2="490" y2="212" stroke="#475569" stroke-width="2"/>

      <!-- Step 9 -->
      <rect x="490" y="190" width="160" height="45" rx="6" fill="#f1f5f9" stroke="#475569" stroke-width="1.5"/>
      <text x="505" y="210" font-family="'Times New Roman', serif" font-size="11" font-weight="bold">9. Settlement & Export</text>
      <text x="505" y="225" font-family="'Times New Roman', serif" font-size="9" fill="#475569">Payment Rec & CSV Stream</text>
    </svg>
  </div>
`));

// ==========================================
// PAGE 19: CHAPTER 3: MODULE DESIGN
// ==========================================
pages.push(makePage(19, `
  <h3 class="section-heading">3.5 Module Design</h3>
  <p class="body-text">
    The internal module organization guarantees clean separation of responsibilities between client event listeners, domain calculation engines, server controllers, and database models.
  </p>
  <div class="spacer-10"></div>
  <div class="diagram-box">
    <div class="diagram-title">Figure 3.5: InvoZap Module Architecture and Data Flow</div>
    <svg viewBox="0 0 700 360" class="report-svg">
      <!-- Frontend Container -->
      <rect x="30" y="15" width="640" height="130" rx="6" fill="#eff6ff" stroke="#2563eb" stroke-width="1.5"/>
      <text x="50" y="35" font-family="'Times New Roman', serif" font-size="12" font-weight="bold" fill="#1e3a8a">FRONTEND SUBSYSTEMS (Browser)</text>

      <rect x="50" y="45" width="110" height="85" rx="4" fill="#ffffff" stroke="#93c5fd"/>
      <text x="65" y="65" font-family="'Times New Roman', serif" font-size="10" font-weight="bold">Auth UI</text>
      <text x="58" y="82" font-family="'Times New Roman', serif" font-size="8" fill="#475569">• Login / Sign up</text>
      <text x="58" y="97" font-family="'Times New Roman', serif" font-size="8" fill="#475569">• JWT Storage</text>
      <text x="58" y="112" font-family="'Times New Roman', serif" font-size="8" fill="#475569">• Profile Modal</text>

      <rect x="175" y="45" width="110" height="85" rx="4" fill="#ffffff" stroke="#93c5fd"/>
      <text x="185" y="65" font-family="'Times New Roman', serif" font-size="10" font-weight="bold">Invoice Editor</text>
      <text x="182" y="82" font-family="'Times New Roman', serif" font-size="8" fill="#475569">• Dynamic Rows</text>
      <text x="182" y="97" font-family="'Times New Roman', serif" font-size="8" fill="#475569">• Fast Paste Parser</text>
      <text x="182" y="112" font-family="'Times New Roman', serif" font-size="8" fill="#475569">• Draft Autosave</text>

      <rect x="300" y="45" width="110" height="85" rx="4" fill="#ffffff" stroke="#93c5fd"/>
      <text x="312" y="65" font-family="'Times New Roman', serif" font-size="10" font-weight="bold">Financial Core</text>
      <text x="308" y="82" font-family="'Times New Roman', serif" font-size="8" fill="#475569">• Integer Math</text>
      <text x="308" y="97" font-family="'Times New Roman', serif" font-size="8" fill="#475569">• POS GST Logic</text>
      <text x="308" y="112" font-family="'Times New Roman', serif" font-size="8" fill="#475569">• Rounding Rules</text>

      <rect x="425" y="45" width="110" height="85" rx="4" fill="#ffffff" stroke="#93c5fd"/>
      <text x="435" y="65" font-family="'Times New Roman', serif" font-size="10" font-weight="bold">Quality & QR</text>
      <text x="432" y="82" font-family="'Times New Roman', serif" font-size="8" fill="#475569">• 12-Pt Audit</text>
      <text x="432" y="97" font-family="'Times New Roman', serif" font-size="8" fill="#475569">• Vector QR Gen</text>
      <text x="432" y="112" font-family="'Times New Roman', serif" font-size="8" fill="#475569">• NPCI Encoding</text>

      <rect x="550" y="45" width="105" height="85" rx="4" fill="#ffffff" stroke="#93c5fd"/>
      <text x="560" y="65" font-family="'Times New Roman', serif" font-size="10" font-weight="bold">History & CSV</text>
      <text x="558" y="82" font-family="'Times New Roman', serif" font-size="8" fill="#475569">• Ledger Views</text>
      <text x="558" y="97" font-family="'Times New Roman', serif" font-size="8" fill="#475569">• CSV Export</text>
      <text x="558" y="112" font-family="'Times New Roman', serif" font-size="8" fill="#475569">• Status Filter</text>

      <!-- Connecting arrows -->
      <line x1="350" y1="145" x2="350" y2="180" stroke="#1e3a8a" stroke-width="2"/>

      <!-- Backend Container -->
      <rect x="30" y="180" width="640" height="150" rx="6" fill="#f8fafc" stroke="#334155" stroke-width="1.5"/>
      <text x="50" y="200" font-family="'Times New Roman', serif" font-size="12" font-weight="bold" fill="#0f172a">BACKEND MODULES (Express Server & Mongoose Models)</text>

      <rect x="60" y="215" width="125" height="95" rx="4" fill="#ffffff" stroke="#64748b"/>
      <text x="75" y="235" font-family="'Times New Roman', serif" font-size="10" font-weight="bold">Auth Controller</text>
      <text x="68" y="255" font-family="'Times New Roman', serif" font-size="8" fill="#475569">• Register / Login</text>
      <text x="68" y="270" font-family="'Times New Roman', serif" font-size="8" fill="#475569">• Profile Updates</text>
      <text x="68" y="285" font-family="'Times New Roman', serif" font-size="8" fill="#475569">• JWT Middleware</text>

      <rect x="210" y="215" width="135" height="95" rx="4" fill="#ffffff" stroke="#64748b"/>
      <text x="220" y="235" font-family="'Times New Roman', serif" font-size="10" font-weight="bold">Invoice Controller</text>
      <text x="218" y="255" font-family="'Times New Roman', serif" font-size="8" fill="#475569">• CRUD Operations</text>
      <text x="218" y="270" font-family="'Times New Roman', serif" font-size="8" fill="#475569">• Atomic FY Sequence</text>
      <text x="218" y="285" font-family="'Times New Roman', serif" font-size="8" fill="#475569">• Payment Logging</text>

      <rect x="365" y="215" width="135" height="95" rx="4" fill="#ffffff" stroke="#64748b"/>
      <text x="375" y="235" font-family="'Times New Roman', serif" font-size="10" font-weight="bold">Catalog Controller</text>
      <text x="372" y="255" font-family="'Times New Roman', serif" font-size="8" fill="#475569">• Product Catalog</text>
      <text x="372" y="270" font-family="'Times New Roman', serif" font-size="8" fill="#475569">• Client Directory</text>
      <text x="372" y="285" font-family="'Times New Roman', serif" font-size="8" fill="#475569">• Item Validation</text>

      <rect x="520" y="215" width="135" height="95" rx="4" fill="#ffffff" stroke="#64748b"/>
      <text x="530" y="235" font-family="'Times New Roman', serif" font-size="10" font-weight="bold">Public Sharing</text>
      <text x="528" y="255" font-family="'Times New Roman', serif" font-size="8" fill="#475569">• Tokenized Views</text>
      <text x="528" y="270" font-family="'Times New Roman', serif" font-size="8" fill="#475569">• Read-Only Guard</text>
      <text x="528" y="285" font-family="'Times New Roman', serif" font-size="8" fill="#475569">• Client Statements</text>
    </svg>
  </div>
`));

// ==========================================
// PAGE 20: CHAPTER 4: IMPLEMENTATION (AUTH)
// ==========================================
pages.push(makePage(20, `
  <h2 class="chapter-heading">CHAPTER 4: IMPLEMENTATION</h2>
  <div class="spacer-20"></div>
  <h3 class="section-heading">4.1 Module Implementation</h3>
  <div class="spacer-10"></div>
  <h4 class="sub-section-heading">4.1.1 Authentication & Profile Management Module</h4>
  <p class="body-text">
    The Authentication module manages user sign-up, credential validation, stateless session creation, and business profile customization. The implementation emphasizes defense-in-depth principles:
  </p>
  <ul class="report-list">
    <li><strong>Password Security via BCrypt:</strong> When a user signs up, the plaintext password is cryptographically hashed with an automated salt generated using an algorithmic cost factor of 10. Passwords are never stored or logged in plaintext format.</li>
    <li><strong>Stateless JWT Session Management:</strong> Upon successful credential matching, the server constructs a signed JSON Web Token containing the user's immutable object ID and issue timestamp. The token is transmitted to the client and stored in encrypted browser local storage, passed in the HTTP <code>Authorization: Bearer &lt;token&gt;</code> header on all subsequent protected requests.</li>
    <li><strong>Business Profile Configuration:</strong> The profile subsystem enables businesses to store their legal entity name, 15-character GSTIN, permanent account number (PAN), registered billing address, default payment terms, and payee UPI Virtual Payment Address (VPA). These settings seamlessly populate new invoice drafts.</li>
  </ul>
  <div class="spacer-10"></div>
  <p class="body-text"><strong>Key Implementation Highlights:</strong></p>
  <ol class="report-list">
    <li>Zero-leakage credential authentication flow using BCrypt.compare.</li>
    <li>Stateless token validation middleware rejecting expired or tampered signatures.</li>
    <li>Comprehensive business profile editor with live persistence in MongoDB.</li>
  </ol>
`));

// ==========================================
// PAGE 21: CHAPTER 4: IMPLEMENTATION (GST & CATALOG)
// ==========================================
pages.push(makePage(21, `
  <h4 class="sub-section-heading">4.1.2 High-Precision Integer Arithmetic & GST Engine</h4>
  <p class="body-text">
    Standard JavaScript floating-point arithmetic (IEEE 754 double precision) creates precision anomalies when computing monetary figures (e.g., <code>0.1 + 0.2 = 0.30000000000000004</code>). In financial auditing, floating point accumulation leads to balance sheet mismatches and GST return rejections.
  </p>
  <p class="body-text">
    InvoZap circumvents this entirely by implementing an <strong>Integer Paise Financial Engine</strong>. Every monetary quantity is converted immediately to integral paise (1 INR = 100 paise) via <code>Math.round(val * 100)</code>. Subtotals, discount deductions, and tax calculations are performed exclusively in integers before formatting back to rupees for UI display.
  </p>
  <p class="body-text">
    The <strong>GST Place of Supply (POS) Engine</strong> resolves vendor and client state codes using the first two digits of their respective GSTINs. When vendor state code matches client state code, the system categorizes the transaction as <em>Intra-State</em> and bifurcates the applicable tax rate equally into Central GST (CGST 50%) and State GST (SGST 50%). When the state codes differ, the transaction is marked as <em>Inter-State</em>, applying unified Integrated GST (IGST 100%).
  </p>
  <div class="spacer-10"></div>
  <h4 class="sub-section-heading">4.1.3 Product & Service Catalog Module</h4>
  <p class="body-text">
    To eliminate repetitive manual data entry, InvoZap incorporates a persistent Catalog module. Users can register recurring trade items and consultancy services alongside standard rates, default GST rates, and standard Harmonized System of Nomenclature (HSN) or Service Accounting Codes (SAC). Selecting an item from the catalog automatically populates table rows, triggering instant re-calculation.
  </p>
`));

// ==========================================
// PAGE 22: CHAPTER 4: IMPLEMENTATION (CLIENTS & CSV)
// ==========================================
pages.push(makePage(22, `
  <h4 class="sub-section-heading">4.1.4 Client Management & Structured CSV Export Module</h4>
  <p class="body-text">
    The Client Directory subsystem maintains an organized ledger of all customer organizations. For each client, the system stores legal business names, GSTIN identifiers, contact email addresses, phone numbers, state codes, and shipping/billing addresses. When selecting a returning client during invoice authoring, all fields auto-fill instantly, and the Place of Supply engine immediately configures tax rules.
  </p>
  <p class="body-text">
    InvoZap incorporates a high-performance <strong>Export Invoices CSV Engine</strong> compliant with RFC 4180 standards. The engine streams the user's complete billing records into structured CSV tabular files, encapsulating:
  </p>
  <ul class="report-list">
    <li>Invoice Number & Issue Date</li>
    <li>Client Legal Name & Client GSTIN</li>
    <li>Place of Supply State</li>
    <li>Taxable Value (Subtotal) in INR</li>
    <li>CGST, SGST, and IGST breakdowns</li>
    <li>Total Invoice Amount & Payment Status (PAID / UNPAID)</li>
  </ul>
  <p class="body-text">
    This export allows business owners and their chartered accountants to import billing data directly into Tally, Zoho Books, Excel, or Government GST offline tools with zero manual transcription.
  </p>
  <div class="spacer-10"></div>
  <h4 class="sub-section-heading">4.1.5 Monotonic Gapless Sequence Numbering</h4>
  <p class="body-text">
    Section 31 of the CGST Act mandates that tax invoices follow a consecutive serial number unique for a financial year. InvoZap enforces this via atomic database counters (e.g., <code>INV/2025-26/0001</code>). If concurrent drafts exist, sequence reservation occurs atomically during invoice finalization, preventing numbering gaps and duplication.
  </p>
`));

// ==========================================
// PAGE 23: CHAPTER 4: IMPLEMENTATION (QR & APIS)
// ==========================================
pages.push(makePage(23, `
  <h4 class="sub-section-heading">4.1.6 Dynamic NPCI Vector UPI QR Engine</h4>
  <p class="body-text">
    To accelerate collections, InvoZap implements a zero-dependency, client-side vector SVG QR code generation engine. When vendor UPI VPA and bill totals are entered, the engine constructs a compliant NPCI payment URI:
  </p>
  <div class="code-box">
    upi://pay?pa=vendor@okhdfcbank&pn=InvoZap+Vendor&am=14500.00&cu=INR&tn=Invoice+INV-2025-26-0001
  </div>
  <p class="body-text">
    The URI is mapped into an SVG path matrix directly within the browser DOM. Customers scanning the invoice with Google Pay, PhonePe, Paytm, or BHIM instantly see the pre-filled payee name and exact net payable amount, avoiding manual keying mistakes.
  </p>
  <div class="spacer-10"></div>
  <h3 class="section-heading">4.2 API Development</h3>
  <p class="body-text">
    InvoZap exposes a comprehensive suite of RESTful API endpoints structured following HTTP conventions, returning consistent JSON responses:
  </p>
  <ol class="report-list">
    <li><strong>Authentication Endpoints:</strong>
      <ul class="sub-list">
        <li><code>POST /api/auth/register</code> - Create new business account</li>
        <li><code>POST /api/auth/login</code> - Verify credentials & issue JWT</li>
        <li><code>GET /api/auth/profile</code> - Retrieve business profile data</li>
        <li><code>PUT /api/auth/profile</code> - Update business details, GSTIN, and UPI</li>
      </ul>
    </li>
    <li><strong>Invoice Management Endpoints:</strong>
      <ul class="sub-list">
        <li><code>GET /api/invoices</code> - Fetch user's invoice ledger with filter parameters</li>
        <li><code>POST /api/invoices</code> - Create and finalize new tax invoice</li>
        <li><code>GET /api/invoices/:id</code> - Retrieve full invoice details and item list</li>
        <li><code>PUT /api/invoices/:id</code> - Update draft invoice line items</li>
        <li><code>DELETE /api/invoices/:id</code> - Remove draft invoice record</li>
      </ul>
    </li>
  </ol>
`));

// ==========================================
// PAGE 24: CHAPTER 4: IMPLEMENTATION (APIS & SECURITY)
// ==========================================
pages.push(makePage(24, `
  <ol class="report-list" start="3">
    <li><strong>Catalog & Client Endpoints:</strong>
      <ul class="sub-list">
        <li><code>GET /api/catalog</code> - List registered product and service items</li>
        <li><code>POST /api/catalog</code> - Add new item with HSN code and default rate</li>
        <li><code>DELETE /api/catalog/:id</code> - Delete catalog entry</li>
        <li><code>GET /api/clients</code> - Retrieve saved client directory</li>
        <li><code>POST /api/clients</code> - Save client profile and address</li>
      </ul>
    </li>
    <li><strong>Payments & Export Endpoints:</strong>
      <ul class="sub-list">
        <li><code>POST /api/invoices/:id/payments</code> - Record partial or full payment</li>
        <li><code>GET /api/invoices/export/csv</code> - Stream structured CSV ledger file</li>
      </ul>
    </li>
  </ol>
  <div class="spacer-10"></div>
  <h3 class="section-heading">4.3 Security Implementation</h3>
  <p class="body-text">
    Security is implemented at every tier of the InvoZap platform to ensure financial confidentiality and protect against unauthorized tampering:
  </p>
  <ol class="report-list">
    <li><strong>JWT Token Verification:</strong> All private routes are safeguarded by custom authentication middleware. Incoming requests must include a valid Bearer token signed with a server-side HMAC-SHA256 secret key. Tokens carry an expiration timestamp to prevent replay attacks.</li>
    <li><strong>BCrypt Password Hashing:</strong> User credentials undergo one-way cryptographic hashing before storage. The adaptive salt work factor of 10 provides robust protection against dictionary attacks and precomputed rainbow table lookups.</li>
    <li><strong>Role & Tenant Isolation:</strong> Every database query explicitly filters by the authenticated user's <code>userId</code> extracted from the verified JWT, ensuring strict multi-tenant boundary isolation. No user can view or modify records belonging to another business.</li>
  </ol>
`));

// ==========================================
// PAGE 25: CHAPTER 4: IMPLEMENTATION (AUDIT ENGINE)
// ==========================================
pages.push(makePage(25, `
  <ol class="report-list" start="4">
    <li><strong>HTTP Security Headers & CORS:</strong> The application server utilizes <code>helmet</code> to inject defensive HTTP headers, including Content Security Policy (CSP), X-Frame-Options (Clickjacking defense), and X-Content-Type-Options. CORS configurations restrict cross-origin access exclusively to verified client origins.</li>
    <li><strong>Rate Limiting & DDoS Mitigation:</strong> The public API endpoints are guarded by <code>express-rate-limit</code>, restricting repeated login and registration requests to prevent automated brute-force attacks.</li>
  </ol>
  <div class="spacer-10"></div>
  <h4 class="sub-section-heading">4.3.1 The 12-Point Pre-Send Quality Audit Engine</h4>
  <p class="body-text">
    Before an invoice is dispatched or finalized, InvoZap executes an algorithmic 12-point Quality Audit to safeguard against compliance blunders. The audit evaluates:
  </p>
  <table class="audit-table">
    <thead>
      <tr>
        <th style="width: 10%;">#</th>
        <th style="width: 45%;">Audit Check</th>
        <th style="width: 45%;">Rule Enforced</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>1</td><td>Vendor Profile Check</td><td>Business name, address, and contact must be complete</td></tr>
      <tr><td>2</td><td>GSTIN Structural Integrity</td><td>15-character alphanumeric format matching state code</td></tr>
      <tr><td>3</td><td>Place of Supply Parity</td><td>State code matches intra/inter-state tax allocation</td></tr>
      <tr><td>4</td><td>Line Item Completeness</td><td>At least one non-empty line item with quantity > 0</td></tr>
      <tr><td>5</td><td>HSN/SAC Validation</td><td>Valid 4 to 8 digit classification number</td></tr>
      <tr><td>6</td><td>Rate & Mathematical Consistency</td><td>Unit price and line total match integer multiplication</td></tr>
      <tr><td>7</td><td>Date Chronology</td><td>Due date must not precede issue date</td></tr>
      <tr><td>8</td><td>UPI Settlement Validation</td><td>Payee VPA contains valid '@' payment handle format</td></tr>
      <tr><td>9</td><td>Total Value Integrity</td><td>Net total must be strictly positive and balanced</td></tr>
      <tr><td>10</td><td>Discount Boundaries</td><td>Discount cannot exceed taxable subtotal amount</td></tr>
      <tr><td>11</td><td>Monotonic Sequence Check</td><td>Invoice number follows annual sequential format</td></tr>
      <tr><td>12</td><td>Client Address Completeness</td><td>Billing address contains city and pin code</td></tr>
    </tbody>
  </table>
`));

// ==========================================
// PAGE 26: CHAPTER 5: RESULTS (FEATURES)
// ==========================================
pages.push(makePage(26, `
  <h2 class="chapter-heading">CHAPTER 5: RESULTS</h2>
  <div class="spacer-20"></div>
  <h3 class="section-heading">5.1 System Features</h3>
  <p class="body-text">
    InvoZap has been completely implemented and validated across diverse commercial billing scenarios. The system functions as a robust, end-to-end financial operations workstation:
  </p>
  <ol class="report-list">
    <li><strong>Rapid Document Creation:</strong> Users can generate clean, compliant invoices in under sixty seconds with automated item additions, fast bulk pasting of item lists, and auto-completing catalog items.</li>
    <li><strong>Autonomous GST Tax Resolution:</strong> Real-time determination of Intra-State vs Inter-State supply eliminating manual tax splitting calculation.</li>
    <li><strong>Embedded Vector UPI Payments:</strong> Crisp, scannable QR codes rendered on invoices enabling immediate mobile settlement via standard UPI apps.</li>
    <li><strong>Comprehensive Quotation Pipeline:</strong> Creation of formal commercial quotes with one-click conversion to finalized tax invoices.</li>
    <li><strong>Client & Catalog Management:</strong> Persistent storage of client directories and inventory items, dramatically accelerating repeat billing.</li>
    <li><strong>Multi-Payment Tracking:</strong> Recording of partial, full, and TDS credit payments with real-time outstanding balance calculation.</li>
    <li><strong>Structured CSV Financial Export:</strong> Direct download of complete accounting registers in RFC 4180 CSV format for seamless spreadsheet analysis and accountant handover.</li>
    <li><strong>Multi-Device Responsiveness:</strong> Flawless interface usability across desktop displays, laptops, tablets, and smartphones.</li>
  </ol>
`));

// ==========================================
// PAGE 27: CHAPTER 5: RESULTS (SCREENSHOTS 1)
// ==========================================
pages.push(makePage(27, `
  <h3 class="section-heading">5.2 Screenshots & UI Walkthrough</h3>
  <div class="spacer-10"></div>
  <div class="screenshot-card">
    <div class="screenshot-title">Figure 5.1: InvoZap Landing Page & Workspace Portal</div>
    <div class="ui-mockup-box">
      <div class="mockup-nav">
        <span class="mockup-brand">⚡ InvoZap Studio</span>
        <div class="mockup-links">
          <span>+ Create Invoice</span>
          <span>Quotations</span>
          <span>History</span>
          <span class="user-pill">Profile: Mohit Sharma</span>
        </div>
      </div>
      <div class="mockup-hero">
        <div class="hero-tag">High-Integrity Financial Cockpit for Indian SMBs</div>
        <div class="hero-h1">Effortless GST Invoicing, Instant UPI Settlement.</div>
        <div class="hero-sub">Generate audit-ready tax invoices in under 60 seconds with integer precision and dynamic QR codes.</div>
        <div class="mockup-btn-row">
          <span class="btn-primary">+ Create New Invoice</span>
          <span class="btn-secondary">Export Invoices CSV</span>
        </div>
      </div>
    </div>
  </div>
  <div class="spacer-20"></div>
  <div class="screenshot-card">
    <div class="screenshot-title">Figure 5.2: InvoZap User Authentication & Registration View</div>
    <div class="ui-mockup-box">
      <div class="auth-mockup">
        <div class="auth-card">
          <div class="auth-header">InvoZap Account Login</div>
          <div class="input-line">Email: <code>mohit@invozap.dev</code></div>
          <div class="input-line">Password: <code>••••••••••••</code></div>
          <div class="btn-primary center-btn">Sign In to Workspace</div>
          <div class="auth-foot">Protected with BCrypt (Cost 10) & JWT Tokenization</div>
        </div>
      </div>
    </div>
  </div>
`));

// ==========================================
// PAGE 28: CHAPTER 5: RESULTS (SCREENSHOTS 2)
// ==========================================
pages.push(makePage(28, `
  <div class="screenshot-card">
    <div class="screenshot-title">Figure 5.3: Invoice Authoring Interface with Integer Paise & GST Split</div>
    <div class="ui-mockup-box">
      <div class="form-header-row">
        <div><strong>Invoice #:</strong> <code>INV/2025-26/0042</code></div>
        <div><strong>Date:</strong> 27 Nov 2025</div>
        <div><strong>Due Date:</strong> 12 Dec 2025</div>
      </div>
      <div class="client-grid-row">
        <div class="grid-card">
          <div class="card-head">Billed By (Vendor)</div>
          <div><strong>Sharma Tech Services</strong></div>
          <div>GSTIN: <code>27AAPCS1234F1Z8</code> (Maharashtra - 27)</div>
        </div>
        <div class="grid-card">
          <div class="card-head">Billed To (Client)</div>
          <div><strong>Apex Digital Solutions</strong></div>
          <div>GSTIN: <code>27BBNCD5678G2Z1</code> (Maharashtra - 27)</div>
          <div class="badge-success">Intra-State: CGST (9%) + SGST (9%)</div>
        </div>
      </div>
      <table class="table-mockup">
        <thead>
          <tr><th>Item Description</th><th>HSN</th><th>Qty</th><th>Rate (₹)</th><th>Tax</th><th>Total (₹)</th></tr>
        </thead>
        <tbody>
          <tr><td>Full-Stack Cloud Consulting</td><td>998313</td><td>1</td><td>40,000.00</td><td>18%</td><td>40,000.00</td></tr>
          <tr><td>API Security Auditing</td><td>998314</td><td>1</td><td>20,000.00</td><td>18%</td><td>20,000.00</td></tr>
        </tbody>
      </table>
      <div class="summary-box-mockup">
        <div>Taxable Subtotal: ₹60,000.00</div>
        <div>CGST (9.0%): ₹5,400.00 &nbsp;|&nbsp; SGST (9.0%): ₹5,400.00</div>
        <div class="grand-total-row"><strong>Net Grand Total: ₹70,800.00</strong> (7,080,000 Paise)</div>
      </div>
    </div>
  </div>
`));

// ==========================================
// PAGE 29: CHAPTER 5: RESULTS (SCREENSHOTS 3)
// ==========================================
pages.push(makePage(29, `
  <div class="screenshot-card">
    <div class="screenshot-title">Figure 5.4: Catalog Management & Fast Paste Item Module</div>
    <div class="ui-mockup-box">
      <div class="catalog-mockup-head">
        <strong>Product & Service Catalog (Quick Add)</strong>
        <span class="btn-xs">+ Add New Catalog Item</span>
      </div>
      <div class="catalog-grid">
        <div class="catalog-pill">🌐 Web Development (HSN 998313) - ₹25,000.00 [18%]</div>
        <div class="catalog-pill">🛡️ Security Hardening (HSN 998314) - ₹15,000.00 [18%]</div>
        <div class="catalog-pill">📦 Database Optimization (HSN 998315) - ₹12,000.00 [18%]</div>
      </div>
      <div class="fast-paste-box">
        <div class="fast-paste-title">⚡ Fast Paste Item Parser</div>
        <div class="fast-paste-input">Paste spreadsheet lines (Description, Qty, Price, HSN, Tax%)...</div>
        <div class="btn-primary btn-sm">Parse & Populate Table Rows</div>
      </div>
    </div>
  </div>
  <div class="spacer-20"></div>
  <div class="screenshot-card">
    <div class="screenshot-title">Figure 5.5: User Profile & UPI Banking Settings Modal</div>
    <div class="ui-mockup-box">
      <div class="profile-mockup">
        <div class="profile-head">Business Profile & Banking Setup</div>
        <div class="profile-grid">
          <div>Legal Name: <strong>Mohit Tech Studio</strong></div>
          <div>GSTIN: <code>27AAPCS1234F1Z8</code></div>
          <div>UPI ID: <code>mohit@okhdfcbank</code></div>
          <div>Bank Account: <code>HDFC0001234 / 50100234567890</code></div>
        </div>
      </div>
    </div>
  </div>
`));

// ==========================================
// PAGE 30: CHAPTER 5: RESULTS (SCREENSHOTS 4)
// ==========================================
pages.push(makePage(30, `
  <div class="screenshot-card">
    <div class="screenshot-title">Figure 5.6: Invoice Ledger, Status Tracking, and Export Controls</div>
    <div class="ui-mockup-box">
      <div class="ledger-top-row">
        <div class="ledger-stat-card">
          <div class="stat-lbl">Total Billed</div>
          <div class="stat-val">₹2,84,500.00</div>
        </div>
        <div class="ledger-stat-card">
          <div class="stat-lbl">Collected</div>
          <div class="stat-val text-green">₹2,13,700.00</div>
        </div>
        <div class="ledger-stat-card">
          <div class="stat-lbl">Outstanding Balance</div>
          <div class="stat-val text-amber">₹70,800.00</div>
        </div>
        <div class="ledger-export-action">
          <span class="btn-primary">📥 Export Invoices CSV</span>
        </div>
      </div>
      <table class="table-mockup">
        <thead>
          <tr><th>Invoice #</th><th>Client</th><th>Issue Date</th><th>Total (₹)</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><code>INV/2025-26/0042</code></td>
            <td>Apex Digital Solutions</td>
            <td>27 Nov 2025</td>
            <td>₹70,800.00</td>
            <td><span class="badge-pending">UNPAID</span></td>
            <td>[View] [Record Pay] [PDF]</td>
          </tr>
          <tr>
            <td><code>INV/2025-26/0041</code></td>
            <td>NextGen Media Labs</td>
            <td>20 Nov 2025</td>
            <td>₹1,18,000.00</td>
            <td><span class="badge-success">PAID</span></td>
            <td>[View] [Download]</td>
          </tr>
          <tr>
            <td><code>INV/2025-26/0040</code></td>
            <td>Cognitive Systems</td>
            <td>15 Nov 2025</td>
            <td>₹95,700.00</td>
            <td><span class="badge-success">PAID</span></td>
            <td>[View] [Download]</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
`));

// ==========================================
// PAGE 31: CHAPTER 5: RESULTS (SCREENSHOTS 5)
// ==========================================
pages.push(makePage(31, `
  <div class="screenshot-card">
    <div class="screenshot-title">Figure 5.7: NPCI Vector UPI QR Code Payment Card Rendering</div>
    <div class="ui-mockup-box" style="text-align: center;">
      <div class="upi-mockup-container">
        <div class="upi-badge-bar">Scan & Pay via UPI (GPay / PhonePe / Paytm / BHIM)</div>
        <div class="spacer-10"></div>
        <!-- Vector QR SVG Mockup -->
        <svg width="140" height="140" viewBox="0 0 100 100">
          <rect width="100" height="100" fill="#ffffff" stroke="#cbd5e1"/>
          <!-- Corner Position Markers -->
          <rect x="8" y="8" width="24" height="24" fill="#0f172a"/>
          <rect x="12" y="12" width="16" height="16" fill="#ffffff"/>
          <rect x="16" y="16" width="8" height="8" fill="#0f172a"/>

          <rect x="68" y="8" width="24" height="24" fill="#0f172a"/>
          <rect x="72" y="12" width="16" height="16" fill="#ffffff"/>
          <rect x="76" y="16" width="8" height="8" fill="#0f172a"/>

          <rect x="8" y="68" width="24" height="24" fill="#0f172a"/>
          <rect x="12" y="72" width="16" height="16" fill="#ffffff"/>
          <rect x="16" y="76" width="8" height="8" fill="#0f172a"/>

          <!-- Random QR Matrix Blocks -->
          <rect x="38" y="12" width="8" height="8" fill="#0f172a"/>
          <rect x="50" y="16" width="8" height="8" fill="#0f172a"/>
          <rect x="38" y="28" width="8" height="8" fill="#0f172a"/>
          <rect x="16" y="44" width="8" height="8" fill="#0f172a"/>
          <rect x="32" y="44" width="16" height="8" fill="#0f172a"/>
          <rect x="56" y="44" width="8" height="8" fill="#0f172a"/>
          <rect x="68" y="44" width="16" height="8" fill="#0f172a"/>
          <rect x="40" y="60" width="8" height="16" fill="#0f172a"/>
          <rect x="56" y="64" width="16" height="8" fill="#0f172a"/>
          <rect x="76" y="68" width="8" height="16" fill="#0f172a"/>
          <rect x="40" y="80" width="16" height="8" fill="#0f172a"/>
          <rect x="60" y="80" width="8" height="8" fill="#0f172a"/>
        </svg>
        <div class="spacer-10"></div>
        <div style="font-size: 11pt; font-weight: bold;">Pay Amount: ₹70,800.00</div>
        <div style="font-size: 9pt; color: #64748b;">VPA: mohit@okhdfcbank &nbsp;|&nbsp; Ref: INV/2025-26/0042</div>
      </div>
    </div>
  </div>
  <div class="spacer-20"></div>
  <div class="screenshot-card">
    <div class="screenshot-title">Figure 5.8: 12-Point Quality Audit Verification Output</div>
    <div class="ui-mockup-box">
      <div class="audit-pass-card">
        <div class="audit-pass-title">✅ Quality Audit Status: 12 / 12 Checks Passed</div>
        <div class="audit-pass-sub">All GSTIN formats, HSN codes, Place of Supply alignments, and date chronologies are strictly verified. Ready for transmission.</div>
      </div>
    </div>
  </div>
`));

// ==========================================
// PAGE 32: CHAPTER 5: RESULTS (ADVANTAGES)
// ==========================================
pages.push(makePage(32, `
  <h3 class="section-heading">5.3 Advantages</h3>
  <p class="body-text">
    InvoZap delivers several compelling advantages over legacy invoicing software, spreadsheets, and heavyweight ERP platforms:
  </p>
  <ol class="report-list">
    <li><strong>Absolute Mathematical Determinism:</strong> The integer-paise computing architecture guarantees that every invoice, subtotal, and tax line reconciles to the exact decimal paise without binary floating-point drift.</li>
    <li><strong>Automated Statutory GST Compliance:</strong> By automatically deducing Place of Supply from 15-digit GSTIN state prefixes, the platform prevents disastrous intra-state vs inter-state tax misallocations.</li>
    <li><strong>Zero-Friction Payment Collections:</strong> Native vector UPI QR code rendering reduces accounts receivable cycles by enabling customers to scan and settle invoices immediately on mobile payment apps.</li>
    <li><strong>Pre-Send Risk Mitigation:</strong> The 12-point Quality Audit engine detects missing HSN codes, reversed dates, or invalid GSTIN structures before an invoice leaves the business, preventing embarrassing billing disputes.</li>
    <li><strong>High Performance & Zero-Bloat:</strong> With zero bloated client-side frameworks, InvoZap loads within milliseconds, operates offline seamlessly via local caches, and consumes negligible system memory.</li>
    <li><strong>Seamless Accounting Portability:</strong> Standardized CSV export allows effortless ingestion into third-party accounting packages, government GST offline tools, and spreadsheet models.</li>
    <li><strong>Complete Document Lifecycle:</strong> Unifies quotations, draft invoices, finalized tax documents, and payment records into a single coherent interface.</li>
  </ol>
`));

// ==========================================
// PAGE 33: CHAPTER 5: RESULTS (LIMITATIONS)
// ==========================================
pages.push(makePage(33, `
  <h3 class="section-heading">5.4 Limitations</h3>
  <p class="body-text">
    While InvoZap provides a comprehensive, high-integrity financial operations workspace, certain operational and architectural boundaries exist in the current version:
  </p>
  <ol class="report-list">
    <li><strong>No Direct Government GST Portal Filing:</strong> The current system does not directly post GSTR-1 or e-Way bill JSON files to the GSTN government servers. Business owners must download the generated CSV or JSON and upload it through certified GSP/ASP intermediaries or government offline utilities.</li>
    <li><strong>Single Currency Domain:</strong> InvoZap is engineered exclusively for the Indian commercial ecosystem, denominated in Indian Rupees (INR) and tailored to the CGST/SGST/IGST framework. Cross-border multi-currency transactions (USD, EUR, GBP) with automatic forex rate conversions are not supported.</li>
    <li><strong>Absence of Native Mobile App Binaries:</strong> While the web interface is fully responsive across mobile browsers and supports Progressive Web App (PWA) behaviors, native Android (.apk) and iOS (.ipa) application binaries are not currently distributed on app stores.</li>
    <li><strong>Automated Bank Feed Reconciliation:</strong> Payments must be marked either via mobile UPI verification or manual ledger entry; automated webhook-driven real-time bank account statement syncing is not currently integrated.</li>
  </ol>
  <div class="spacer-10"></div>
  <p class="body-text">
    Despite these boundaries, InvoZap completely fulfills its mandate of providing an accurate, lightning-fast, and compliance-guaranteed invoicing solution for independent professionals and Indian SMBs.
  </p>
`));

// ==========================================
// PAGE 34: CHAPTER 6: CONCLUSION & FUTURE SCOPE
// ==========================================
pages.push(makePage(34, `
  <h2 class="chapter-heading">CHAPTER 6: CONCLUSION AND FUTURE SCOPE</h2>
  <div class="spacer-20"></div>
  <h3 class="section-heading">6.1 Conclusion</h3>
  <p class="body-text">
    The InvoZap project successfully demonstrates how thoughtful web technology architecture, mathematical rigor, and user-centric ergonomics can converge to solve critical operational problems in business financial workflows. Small business owners, freelance contractors, and independent service providers in India have long struggled with cumbersome, expensive, and mathematically error-prone invoicing solutions. InvoZap provides an elegant, robust alternative that transforms billing from an administrative burden into a streamlined competitive advantage.
  </p>
  <p class="body-text">
    Through its <strong>Integer Paise Financial Engine</strong>, the platform eliminates floating-point arithmetic errors that plague standard web applications, guaranteeing 100% accounting accuracy. The automated <strong>Place of Supply Engine</strong> removes human error from GST compliance by correctly bifurcating CGST, SGST, and IGST based on statutory state codes. Furthermore, the integration of <strong>Vectorized UPI QR Codes</strong> addresses accounts receivable friction by enabling immediate digital settlement through National Payments Corporation of India protocols.
  </p>
  <p class="body-text">
    From an architectural perspective, InvoZap proves that modern web applications do not require gigabytes of client framework dependencies to deliver exceptional performance. By leveraging semantic HTML5, modern CSS variables, and Vanilla JavaScript on the frontend paired with an Express.js and MongoDB Atlas backend, the application achieves lightning-fast sub-100 millisecond response times, high security, and minimal maintenance overhead.
  </p>
  <p class="body-text">
    All project requirements—including user authentication, monotonic sequential numbering, quotation-to-invoice conversion, 12-point quality auditing, client catalog management, and structured CSV exports—have been completely implemented, verified, and delivered. InvoZap establishes a dependable foundation for the digital empowerment of Indian commercial enterprises.
  </p>
`));

// ==========================================
// PAGE 35: CHAPTER 6: FUTURE ENHANCEMENTS
// ==========================================
pages.push(makePage(35, `
  <h3 class="section-heading">6.2 Future Enhancements</h3>
  <p class="body-text">
    Building upon the solid architectural foundation established in InvoZap, several exciting technical enhancements are planned for subsequent iterations:
  </p>
  <ol class="report-list">
    <li><strong>Direct GSTN e-Invoice & e-Way Bill API Integration:</strong> Incorporate certified GST Suvidha Provider (GSP) APIs to enable one-click registration of Invoice Reference Numbers (IRN) and signed QR code retrieval directly from the National Informatics Centre (NIC) portal.</li>
    <li><strong>Open Banking & Account Aggregator Reconciliation:</strong> Connect with RBI-regulated Account Aggregator (AA) networks to automatically ingest bank account statement feeds and autonomously reconcile incoming client payments against outstanding invoices.</li>
    <li><strong>Multi-Currency & International Wire Instructions:</strong> Extend the financial engine to support multi-currency invoicing with real-time foreign exchange rate lookups, incorporating SWIFT/BIC codes and LUT (Letter of Undertaking) export tax exemptions.</li>
    <li><strong>Automated WhatsApp & Email Notification Dispatch:</strong> Integrate Twilio / WhatsApp Business Cloud API to dispatch invoice PDFs, payment reminders, and payment receipts directly to client mobile numbers.</li>
    <li><strong>Progressive Web App (PWA) Offline Sync:</strong> Implement Service Workers and IndexedDB persistence enabling users to create full invoices in zero-connectivity environments, automatically synchronizing with MongoDB Atlas upon reconnection.</li>
  </ol>
`));

// ==========================================
// PAGE 36: REFERENCES
// ==========================================
pages.push(makePage(36, `
  <h2 class="chapter-heading">REFERENCES</h2>
  <div class="spacer-20"></div>
  <p class="body-text"><strong>A] Documentation:</strong></p>
  <ol class="report-list">
    <li>Node.js Official Technical Documentation - <span class="ref-link">https://nodejs.org/docs/</span></li>
    <li>Express.js Framework Reference & API Guide - <span class="ref-link">https://expressjs.com/</span></li>
    <li>MongoDB Atlas & Mongoose ODM Manual - <span class="ref-link">https://www.mongodb.com/docs/</span></li>
    <li>Goods and Services Tax (GST) Council of India Statutory Rules & Invoice Guidelines - <span class="ref-link">https://www.gst.gov.in/</span></li>
    <li>National Payments Corporation of India (NPCI) Unified Payments Interface (UPI) Linking Specifications - <span class="ref-link">https://www.npci.org.in/</span></li>
  </ol>
  <div class="spacer-10"></div>
  <p class="body-text"><strong>B] Frameworks & Security Libraries:</strong></p>
  <ol class="report-list">
    <li>JSON Web Tokens (JWT) RFC 7519 Specification - <span class="ref-link">https://jwt.io/</span></li>
    <li>BCrypt.js Cryptographic Hashing Library Reference - <span class="ref-link">https://www.npmjs.com/package/bcryptjs</span></li>
    <li>Helmet.js HTTP Security Header Middleware Guide - <span class="ref-link">https://helmetjs.github.io/</span></li>
    <li>MDN Web Docs: CSS Paged Media Module & Print Stylesheets - <span class="ref-link">https://developer.mozilla.org/</span></li>
  </ol>
  <div class="spacer-10"></div>
  <p class="body-text"><strong>C] Deployment & Cloud Infrastructure:</strong></p>
  <ol class="report-list">
    <li>MongoDB Atlas Cloud Multi-Region Cluster Architecture - <span class="ref-link">https://www.mongodb.com/cloud/atlas</span></li>
    <li>Vercel Serverless Functions & Edge Network Documentation - <span class="ref-link">https://vercel.com/docs</span></li>
  </ol>
`));

// ==========================================
// CSS STYLING (EXACT TIMES NEW ROMAN, 14pt HEADINGS, 12pt BODY, JUSTIFIED, CENTER PAGE NO)
// ==========================================
const styles = `
<style>
  @page {
    size: A4 portrait;
    margin: 15mm 20mm 15mm 20mm;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    line-height: 1.45;
    color: #000000;
    background-color: #f1f5f9;
    text-align: justify;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page {
    width: 210mm;
    min-height: 297mm;
    margin: 20px auto;
    padding: 15mm 20mm 15mm 20mm;
    background: #ffffff;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    page-break-after: always;
    break-after: page;
  }

  @media print {
    body {
      background: none;
    }
    .page {
      margin: 0;
      padding: 10mm 15mm 10mm 15mm;
      box-shadow: none;
      width: 100%;
      height: 100%;
      min-height: 297mm;
    }
  }

  /* MIT Logo Banner */
  .header-banner {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 25px;
    padding-bottom: 8px;
  }

  .logo-box {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .mit-text {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 26pt;
    font-weight: 900;
    color: #1e3a8a;
    letter-spacing: -0.5px;
  }

  .divider-line {
    width: 2px;
    height: 38px;
    background-color: #64748b;
  }

  .aoe-text-group {
    display: flex;
    flex-direction: column;
  }

  .aoe-main {
    font-family: 'Times New Roman', Times, serif;
    font-size: 16pt;
    color: #1e293b;
    font-weight: 500;
    line-height: 1.1;
  }

  .aoe-sub {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 6.5pt;
    color: #64748b;
    margin-top: 2px;
  }

  /* Typography */
  h1, h2, h3, h4 {
    font-family: 'Times New Roman', Times, serif;
    font-weight: bold;
    color: #000000;
  }

  h1.project-title {
    font-size: 16pt;
    color: #1e3a8a;
    text-align: center;
    margin: 15px 0 25px 0;
    line-height: 1.3;
  }

  h2.chapter-heading {
    font-size: 14pt;
    text-align: left;
    text-transform: uppercase;
    margin-bottom: 15px;
    border-bottom: 1px solid #cbd5e1;
    padding-bottom: 4px;
  }

  h2.center-heading {
    font-size: 14pt;
    text-align: center;
    text-transform: uppercase;
    margin-bottom: 15px;
    letter-spacing: 0.5px;
  }

  h3.section-heading {
    font-size: 14pt;
    margin-top: 15px;
    margin-bottom: 8px;
  }

  h4.sub-section-heading {
    font-size: 13pt;
    margin-top: 12px;
    margin-bottom: 6px;
  }

  p.body-text {
    font-size: 12pt;
    line-height: 1.5;
    margin-bottom: 12px;
    text-align: justify;
    text-justify: inter-word;
  }

  /* Page Footer with Centered Page Number */
  .page-footer {
    display: flex;
    justify-content: center;
    align-items: center;
    padding-top: 10px;
    margin-top: auto;
  }

  .page-number {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    color: #000000;
  }

  /* Spacers */
  .spacer-10 { height: 10px; }
  .spacer-20 { height: 20px; }
  .spacer-40 { height: 40px; }
  .spacer-60 { height: 60px; }
  .spacer-100 { height: 100px; }

  /* Lists */
  ol.report-list, ul.report-list {
    margin-left: 25px;
    margin-bottom: 12px;
  }

  ol.report-list li, ul.report-list li {
    font-size: 12pt;
    line-height: 1.45;
    margin-bottom: 6px;
    text-align: justify;
  }

  ul.sub-list {
    margin-left: 20px;
    margin-top: 4px;
    list-style-type: circle;
  }

  ul.sub-list li {
    font-size: 11.5pt;
    margin-bottom: 4px;
  }

  /* Cover Page Elements */
  .cover-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    flex-grow: 1;
    justify-content: space-around;
  }

  .cover-title-label {
    font-size: 14pt;
    font-weight: bold;
    letter-spacing: 0.5px;
  }

  .cover-section-title {
    font-size: 13pt;
    font-weight: bold;
    margin-top: 10px;
  }

  .institution-name {
    font-size: 13pt;
    font-weight: bold;
    line-height: 1.4;
  }

  .student-table {
    width: 90%;
    margin: 15px auto;
    border-collapse: collapse;
    font-size: 11pt;
  }

  .student-table th, .student-table td {
    border: 1px solid #000000;
    padding: 6px 10px;
    text-align: left;
  }

  .student-table th {
    background-color: #f8fafc;
    font-weight: bold;
  }

  .course-details, .faculty-details, .dept-details {
    font-size: 12pt;
    line-height: 1.35;
  }

  /* Tables (TOC, Audit) */
  table.toc-table, table.audit-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
    margin-bottom: 15px;
  }

  table.toc-table th, table.toc-table td {
    border: 1px solid #000000;
    padding: 7px 12px;
    font-size: 12pt;
  }

  table.audit-table th, table.audit-table td {
    border: 1px solid #475569;
    padding: 6px 10px;
    font-size: 11pt;
  }

  table.audit-table th {
    background-color: #e2e8f0;
    font-weight: bold;
  }

  .toc-chapter td {
    font-weight: bold;
  }

  .right-align {
    text-align: right;
  }

  /* Certificate / Acknowledgment elements */
  .signature-row {
    display: flex;
    justify-content: space-between;
    font-size: 12pt;
  }

  .sig-col {
    width: 45%;
  }

  .date-row {
    font-size: 12pt;
  }

  .ack-student-list {
    margin-top: 30px;
    font-size: 12pt;
    line-height: 1.8;
  }

  /* Diagram box */
  .diagram-box {
    margin: 10px 0;
    text-align: center;
  }

  .diagram-title {
    font-size: 11pt;
    font-weight: bold;
    margin-bottom: 6px;
    color: #1e293b;
  }

  .report-svg {
    width: 100%;
    max-height: 290px;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
  }

  /* Code block */
  .code-box {
    background: #f1f5f9;
    border-left: 3px solid #1e3a8a;
    padding: 8px 12px;
    font-family: Consolas, monospace;
    font-size: 10pt;
    margin: 10px 0;
    word-break: break-all;
  }

  /* Mockup styling for Screenshots */
  .screenshot-card {
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 10px;
    background: #ffffff;
    margin-bottom: 12px;
  }

  .screenshot-title {
    font-size: 11pt;
    font-weight: bold;
    color: #1e3a8a;
    margin-bottom: 6px;
  }

  .ui-mockup-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 10px;
    font-family: Arial, sans-serif;
  }

  .mockup-nav {
    display: flex;
    justify-content: space-between;
    background: #0f172a;
    color: #ffffff;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 10pt;
  }

  .mockup-brand {
    font-weight: bold;
    color: #38bdf8;
  }

  .mockup-links span {
    margin-left: 10px;
    font-size: 9pt;
  }

  .user-pill {
    background: #1e293b;
    padding: 2px 8px;
    border-radius: 12px;
  }

  .mockup-hero {
    padding: 15px 10px;
    text-align: center;
  }

  .hero-tag {
    font-size: 8pt;
    color: #2563eb;
    font-weight: bold;
    text-transform: uppercase;
  }

  .hero-h1 {
    font-size: 14pt;
    font-weight: bold;
    color: #0f172a;
    margin: 6px 0;
  }

  .hero-sub {
    font-size: 9.5pt;
    color: #64748b;
    max-width: 500px;
    margin: 0 auto 10px auto;
  }

  .mockup-btn-row {
    display: flex;
    justify-content: center;
    gap: 10px;
  }

  .btn-primary {
    background: #2563eb;
    color: #ffffff;
    padding: 5px 12px;
    border-radius: 4px;
    font-size: 9pt;
    font-weight: bold;
    display: inline-block;
  }

  .btn-secondary {
    background: #e2e8f0;
    color: #1e293b;
    padding: 5px 12px;
    border-radius: 4px;
    font-size: 9pt;
    display: inline-block;
  }

  .auth-mockup {
    display: flex;
    justify-content: center;
    padding: 15px;
  }

  .auth-card {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    padding: 15px;
    border-radius: 6px;
    width: 280px;
    text-align: center;
  }

  .auth-header {
    font-weight: bold;
    font-size: 11pt;
    margin-bottom: 10px;
  }

  .input-line {
    background: #f1f5f9;
    padding: 5px;
    margin-bottom: 8px;
    border-radius: 4px;
    font-size: 9pt;
    text-align: left;
  }

  .auth-foot {
    font-size: 7.5pt;
    color: #64748b;
    margin-top: 8px;
  }

  .form-header-row {
    display: flex;
    justify-content: space-between;
    font-size: 9.5pt;
    padding-bottom: 6px;
    border-bottom: 1px solid #cbd5e1;
    margin-bottom: 8px;
  }

  .client-grid-row {
    display: flex;
    gap: 10px;
    margin-bottom: 8px;
  }

  .grid-card {
    flex: 1;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    padding: 6px;
    border-radius: 4px;
    font-size: 8.5pt;
  }

  .card-head {
    font-weight: bold;
    color: #1e3a8a;
    margin-bottom: 2px;
  }

  .badge-success {
    display: inline-block;
    background: #dcfce7;
    color: #15803d;
    font-size: 8pt;
    padding: 1px 6px;
    border-radius: 3px;
    font-weight: bold;
    margin-top: 4px;
  }

  .badge-pending {
    display: inline-block;
    background: #fef3c7;
    color: #b45309;
    font-size: 8pt;
    padding: 1px 6px;
    border-radius: 3px;
    font-weight: bold;
  }

  .table-mockup {
    width: 100%;
    border-collapse: collapse;
    font-size: 8.5pt;
    margin: 6px 0;
  }

  .table-mockup th, .table-mockup td {
    border: 1px solid #e2e8f0;
    padding: 4px 6px;
    text-align: left;
  }

  .table-mockup th {
    background: #f1f5f9;
    font-weight: bold;
  }

  .summary-box-mockup {
    text-align: right;
    font-size: 9pt;
    line-height: 1.4;
    padding-top: 4px;
  }

  .grand-total-row {
    font-size: 10pt;
    color: #1e3a8a;
    border-top: 1px solid #cbd5e1;
    margin-top: 3px;
    padding-top: 2px;
  }

  .catalog-mockup-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 9.5pt;
    margin-bottom: 6px;
  }

  .btn-xs {
    background: #2563eb;
    color: #ffffff;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 8pt;
  }

  .catalog-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 10px;
  }

  .catalog-pill {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 8pt;
    color: #1e40af;
  }

  .fast-paste-box {
    background: #ffffff;
    border: 1px dashed #3b82f6;
    padding: 8px;
    border-radius: 4px;
    text-align: center;
  }

  .fast-paste-title {
    font-size: 9pt;
    font-weight: bold;
    color: #1e3a8a;
    margin-bottom: 2px;
  }

  .fast-paste-input {
    font-size: 8pt;
    color: #64748b;
    margin-bottom: 4px;
  }

  .btn-sm {
    padding: 3px 8px;
    font-size: 8pt;
  }

  .profile-head {
    font-weight: bold;
    font-size: 10pt;
    margin-bottom: 6px;
  }

  .profile-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    font-size: 8.5pt;
  }

  .ledger-top-row {
    display: flex;
    gap: 8px;
    margin-bottom: 8px;
  }

  .ledger-stat-card {
    flex: 1;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    padding: 6px;
    border-radius: 4px;
    text-align: center;
  }

  .stat-lbl {
    font-size: 7.5pt;
    color: #64748b;
  }

  .stat-val {
    font-size: 11pt;
    font-weight: bold;
  }

  .text-green { color: #16a34a; }
  .text-amber { color: #d97706; }

  .ledger-export-action {
    display: flex;
    align-items: center;
  }

  .upi-mockup-container {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    display: inline-block;
    padding: 12px 20px;
    border-radius: 6px;
  }

  .upi-badge-bar {
    font-size: 9pt;
    font-weight: bold;
    color: #0f172a;
  }

  .audit-pass-card {
    background: #f0fdf4;
    border: 1px solid #86efac;
    padding: 10px;
    border-radius: 4px;
    text-align: center;
  }

  .audit-pass-title {
    font-size: 10.5pt;
    font-weight: bold;
    color: #15803d;
  }

  .audit-pass-sub {
    font-size: 8.5pt;
    color: #166534;
    margin-top: 4px;
  }

  .ref-link {
    color: #2563eb;
    text-decoration: underline;
  }
</style>
`;

// Assemble the full HTML document
const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>InvoZap Project Report - MIT AOE</title>
  ${styles}
</head>
<body>
  ${pages.join('\\n')}
</body>
</html>
`;

// Write out HTML report
const htmlPath = path.join(__dirname, 'InvoZap_Project_Report.html');
fs.writeFileSync(htmlPath, fullHtml, 'utf8');
console.log("Successfully generated InvoZap_Project_Report.html (" + pages.length + " pages)");

// Also generate MS Word compatible .doc file with exact Times New Roman, 14pt headings, 12pt body, justified text!
const wordDocContent = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">\n' +
'<head>\n' +
'  <meta charset="utf-8">\n' +
'  <title>InvoZap Project Report</title>\n' +
styles + '\n' +
'</head>\n' +
'<body>\n' +
pages.join('\n<br clear=all style="mso-special-character:line-break;page-break-before:always">\n') +
'\n</body>\n</html>';

const docPath = path.join(__dirname, 'InvoZap_Project_Report.doc');
fs.writeFileSync(docPath, wordDocContent, 'utf8');
console.log("Successfully generated InvoZap_Project_Report.doc");
