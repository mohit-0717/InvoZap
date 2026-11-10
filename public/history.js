/* ========================================================
   InvoZap - Records History Controller (history.js)
   Manages tab navigation, invoice loading, quotation loading,
   interactive status toggling (Paid/Unpaid), Edit links,
   and the View-Only Document Modal.
   ======================================================== */

// Global HTML Escaper to Prevent Stored XSS on Owner-side Views
function esc(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

document.addEventListener("DOMContentLoaded", function () {
  // Tab elements
  const tabBtnInvoices = document.getElementById("tabBtnInvoices");
  const tabBtnQuotations = document.getElementById("tabBtnQuotations");
  const invoiceSection = document.getElementById("invoiceSection");
  const quotationSection = document.getElementById("quotationSection");

  const invoiceCount = document.getElementById("invoiceCount");
  const quotationCount = document.getElementById("quotationCount");

  const invoicesTable = document.getElementById("invoicesTable");
  const invoicesTableBody = document.getElementById("invoicesTableBody");
  const invoicesEmptyNotice = document.getElementById("invoicesEmptyNotice");

  const quotationsTable = document.getElementById("quotationsTable");
  const quotationsTableBody = document.getElementById("quotationsTableBody");
  const quotationsEmptyNotice = document.getElementById("quotationsEmptyNotice");

  // Modal elements
  const viewModal = document.getElementById("viewModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalBadge = document.getElementById("modalBadge");
  const modalEditBtn = document.getElementById("modalEditBtn");
  const modalPrintBtn = document.getElementById("modalPrintBtn");
  const modalCloseBtn = document.getElementById("modalCloseBtn");
  const modalSheetContainer = document.getElementById("modalSheetContainer");

  // --- 1. Tab Switching Logic ---
  function showInvoicesTab() {
    if (tabBtnInvoices) tabBtnInvoices.classList.add("active");
    if (tabBtnQuotations) tabBtnQuotations.classList.remove("active");
    if (invoiceSection) invoiceSection.style.display = "block";
    if (quotationSection) quotationSection.style.display = "none";
  }

  function showQuotationsTab() {
    if (tabBtnQuotations) tabBtnQuotations.classList.add("active");
    if (tabBtnInvoices) tabBtnInvoices.classList.remove("active");
    if (invoiceSection) invoiceSection.style.display = "none";
    if (quotationSection) quotationSection.style.display = "block";
  }

  if (tabBtnInvoices) tabBtnInvoices.addEventListener("click", showInvoicesTab);
  if (tabBtnQuotations) tabBtnQuotations.addEventListener("click", showQuotationsTab);

  // Check URL query parameters for ?tab=quotations
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("tab") === "quotations") {
    showQuotationsTab();
  }

  // --- 2. Format Date Helper (DD/MM/YYYY) ---
  function formatDate(dateStr) {
    if (!dateStr) return "--";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  // --- 3. Load Invoices from LocalStorage ---
  function loadInvoices() {
    if (!invoicesTableBody) return;
    const invoices = JSON.parse(localStorage.getItem("invozap_invoices") || "[]");
    if (invoiceCount) invoiceCount.textContent = invoices.length;
    invoicesTableBody.innerHTML = "";

    if (invoices.length === 0) {
      if (invoicesEmptyNotice) invoicesEmptyNotice.style.display = "block";
      if (invoicesTable) invoicesTable.style.display = "none";
      return;
    }

    if (invoicesEmptyNotice) invoicesEmptyNotice.style.display = "none";
    if (invoicesTable) invoicesTable.style.display = "table";

    invoices.slice().reverse().forEach(function (inv) {
      const tr = document.createElement("tr");
      tr.className = "clickable-row";
      const statusLower = (inv.status || "unpaid").toLowerCase();
      const isVoid = statusLower === "void";
      const isDraft = statusLower === "draft";
      const isPaid = statusLower === "paid";
      const isPartial = statusLower === "partial";
      const client = inv.clientName || (inv.clientDetails && inv.clientDetails.clientName) || "Unnamed Client";
      
      let invNumberHtml = `<b class="view-trigger" data-type="invoice" data-id="${esc(inv.invoiceNumber)}">${esc(inv.invoiceNumber || "--")}</b>`;
      if (inv.convertedFrom) {
        invNumberHtml += `<span class="tag-converted-from" title="Converted from Quotation">From ${esc(inv.convertedFrom)}</span>`;
      }

      let statusBadgeClass = "unpaid";
      if (isPaid) statusBadgeClass = "paid";
      else if (isPartial) statusBadgeClass = "partial";
      else if (isVoid) statusBadgeClass = "void";
      else if (isDraft) statusBadgeClass = "draft";

      let deleteOrVoidHtml = "";
      if (isDraft) {
        deleteOrVoidHtml = `<button type="button" class="btn-action btn-delete" data-type="invoice" data-id="${esc(inv.invoiceNumber)}">🗑️ Delete</button>`;
      } else if (!isVoid) {
        deleteOrVoidHtml = `<button type="button" class="btn-action btn-void" data-type="invoice" data-id="${esc(inv.invoiceNumber)}" style="background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1;">🚫 Void</button>`;
      }

      tr.innerHTML = `
        <td>${invNumberHtml}</td>
        <td class="view-trigger" data-type="invoice" data-id="${esc(inv.invoiceNumber)}">${esc(client)}</td>
        <td>${esc(formatDate(inv.invoiceDate))}</td>
        <td>${esc(formatDate(inv.dueDate))}</td>
        <td><b>${esc(inv.total || "₹0.00")}</b></td>
        <td>
          <span class="history-pill ${!isVoid ? 'status-toggle' : ''} ${statusBadgeClass}" 
                data-inv="${esc(inv.invoiceNumber)}" 
                title="${!isVoid ? 'Click to record payment / toggle status' : 'Voided invoice'}">
            ${isVoid ? 'VOID' : esc(inv.status || 'Unpaid')}
          </span>
        </td>
        <td style="text-align: center;">
          <div class="action-cell">
            <button type="button" class="btn-action btn-view" data-type="invoice" data-id="${esc(inv.invoiceNumber)}">👁️ View</button>
            ${!isVoid ? `<a href="createnew.html?edit=${encodeURIComponent(inv.invoiceNumber)}" class="btn-action btn-edit">✏️ Edit</a>` : ''}
            ${deleteOrVoidHtml}
          </div>
        </td>
      `;
      invoicesTableBody.appendChild(tr);
    });

    // Attach Status Toggle listeners for Invoices (Unpaid <-> Paid)
    invoicesTableBody.querySelectorAll(".status-toggle").forEach(function (pill) {
      pill.addEventListener("click", function (e) {
        e.stopPropagation();
        const invNo = this.getAttribute("data-inv");
        toggleInvoiceStatus(invNo);
      });
    });

    // Attach Delete / Void listeners
    invoicesTableBody.querySelectorAll(".btn-delete, .btn-void").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const id = this.getAttribute("data-id");
        deleteOrVoidRecord("invoice", id);
      });
    });

    // Attach View Modal triggers
    invoicesTableBody.querySelectorAll(".btn-view, .view-trigger").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const id = this.getAttribute("data-id");
        openViewModal("invoice", id);
      });
    });
  }

  // --- 3.1 Toggle Invoice Status (Unpaid <-> Paid) ---
  function toggleInvoiceStatus(invNumber) {
    const invoices = JSON.parse(localStorage.getItem("invozap_invoices") || "[]");
    const idx = invoices.findIndex(i => i.invoiceNumber === invNumber);
    if (idx === -1) return;

    const currentStatus = (invoices[idx].status || "Unpaid").toLowerCase();
    const newStatus = currentStatus === "paid" ? "Unpaid" : "Paid";
    invoices[idx].status = newStatus;

    localStorage.setItem("invozap_invoices", JSON.stringify(invoices));
    loadInvoices();
  }

  // --- 4. Load Quotations from LocalStorage ---
  function loadQuotations() {
    if (!quotationsTableBody) return;
    const quotations = JSON.parse(localStorage.getItem("invozap_quotations") || "[]");
    if (quotationCount) quotationCount.textContent = quotations.length;
    quotationsTableBody.innerHTML = "";

    if (quotations.length === 0) {
      if (quotationsEmptyNotice) quotationsEmptyNotice.style.display = "block";
      if (quotationsTable) quotationsTable.style.display = "none";
      return;
    }

    if (quotationsEmptyNotice) quotationsEmptyNotice.style.display = "none";
    if (quotationsTable) quotationsTable.style.display = "table";

    quotations.slice().reverse().forEach(function (q) {
      const tr = document.createElement("tr");
      tr.className = "clickable-row";
      const client = q.clientName || (q.clientDetails && q.clientDetails.clientName) || "Unnamed Client";
      const statusLower = (q.status || "draft").toLowerCase();
      const isConverted = statusLower === "converted" || !!q.convertedInvoiceNumber;

      let actionConvertHtml = "";
      if (isConverted) {
        actionConvertHtml = `<span class="converted-badge">✓ Converted (${esc(q.convertedInvoiceNumber || 'Invoice')})</span>`;
      } else {
        actionConvertHtml = `<button type="button" class="btn-convert" data-quoteno="${esc(q.quotationNumber)}">🔄 Convert</button>`;
      }

      tr.innerHTML = `
        <td><b class="view-trigger" data-type="quotation" data-id="${esc(q.quotationNumber)}">${esc(q.quotationNumber || "--")}</b></td>
        <td class="view-trigger" data-type="quotation" data-id="${esc(q.quotationNumber)}">${esc(client)}</td>
        <td>${esc(formatDate(q.quotationDate))}</td>
        <td>${esc(formatDate(q.validUntil))}</td>
        <td><b>${esc(q.total || "₹0.00")}</b></td>
        <td>
          <span class="history-pill status-toggle ${statusLower}" 
                data-quote="${esc(q.quotationNumber)}" 
                title="Click to toggle Draft / Accepted">
            ${esc(q.status || "Draft")}
          </span>
        </td>
        <td style="text-align: center;">
          <div class="action-cell">
            <button type="button" class="btn-action btn-view" data-type="quotation" data-id="${esc(q.quotationNumber)}">👁️ View</button>
            <a href="quotation.html?edit=${encodeURIComponent(q.quotationNumber)}" class="btn-action btn-edit">✏️ Edit</a>
            ${actionConvertHtml}
            <button type="button" class="btn-action btn-delete" data-type="quotation" data-id="${esc(q.quotationNumber)}">🗑️ Delete</button>
          </div>
        </td>
      `;
      quotationsTableBody.appendChild(tr);
    });

    // Attach Status Toggle listeners for Quotations (Draft <-> Accepted)
    quotationsTableBody.querySelectorAll(".status-toggle").forEach(function (pill) {
      pill.addEventListener("click", function (e) {
        e.stopPropagation();
        const quoteNo = this.getAttribute("data-quote");
        toggleQuotationStatus(quoteNo);
      });
    });

    // Attach click listeners to Convert buttons
    quotationsTableBody.querySelectorAll(".btn-convert").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const quoteNo = this.getAttribute("data-quoteno");
        convertQuoteToInvoice(quoteNo);
      });
    });

    // Attach Delete listeners
    quotationsTableBody.querySelectorAll(".btn-delete").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const id = this.getAttribute("data-id");
        deleteOrVoidRecord("quotation", id);
      });
    });

    // Attach View Modal triggers
    quotationsTableBody.querySelectorAll(".btn-view, .view-trigger").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const id = this.getAttribute("data-id");
        openViewModal("quotation", id);
      });
    });
  }

  // --- 4.1 Toggle Quotation Status (Draft <-> Accepted) ---
  function toggleQuotationStatus(quoteNumber) {
    const quotations = JSON.parse(localStorage.getItem("invozap_quotations") || "[]");
    const idx = quotations.findIndex(q => q.quotationNumber === quoteNumber);
    if (idx === -1) return;

    // Do not toggle if already converted
    if ((quotations[idx].status || "").toLowerCase() === "converted") {
      alert("This quotation is already converted into an active invoice.");
      return;
    }

    const currentStatus = (quotations[idx].status || "Draft").toLowerCase();
    const newStatus = currentStatus === "accepted" ? "Draft" : "Accepted";
    quotations[idx].status = newStatus;

    localStorage.setItem("invozap_quotations", JSON.stringify(quotations));
    loadQuotations();
  }

  // --- 5. Open View-Only Sheet Modal ---
  function openViewModal(type, id) {
    if (!viewModal || !modalSheetContainer) return;

    let doc = null;
    if (type === "invoice") {
      const invoices = JSON.parse(localStorage.getItem("invozap_invoices") || "[]");
      doc = invoices.find(i => i.invoiceNumber === id);
    } else {
      const quotations = JSON.parse(localStorage.getItem("invozap_quotations") || "[]");
      doc = quotations.find(q => q.quotationNumber === id);
    }

    if (!doc) {
      alert("Document not found.");
      return;
    }

    const isInvoice = type === "invoice";
    const docNumber = isInvoice ? (doc.invoiceNumber || "--") : (doc.quotationNumber || "--");
    const docDate = isInvoice ? doc.invoiceDate : doc.quotationDate;
    const secondDateLabel = isInvoice ? "DUE DATE:" : "VALID UNTIL:";
    const secondDateVal = isInvoice ? doc.dueDate : doc.validUntil;
    const client = doc.clientDetails || { clientName: doc.clientName || "Client Name" };
    const items = doc.items || [];
    const theme = doc.themeColor || "navy";
    const status = doc.status || (isInvoice ? "Unpaid" : "Draft");
    const currency = doc.currency || "₹";

    // Setup Modal Header
    modalTitle.textContent = `${isInvoice ? "Invoice" : "Quotation"} ${docNumber}`;
    modalBadge.textContent = status.toUpperCase();
    modalBadge.className = `history-pill ${status.toLowerCase()}`;
    modalEditBtn.href = isInvoice
      ? `createnew.html?edit=${encodeURIComponent(docNumber)}`
      : `quotation.html?edit=${encodeURIComponent(docNumber)}`;

    // Build Line Items HTML
    let itemsHtml = "";
    items.forEach((item, index) => {
      const priceNum = parseFloat(item.price) || 0;
      const totalNum = parseFloat(item.rowTotal) || (priceNum * (item.quantity || 1));
      itemsHtml += `
        <tr>
          <td>${index + 1}</td>
          <td>${esc(item.description || "Item")}</td>
          <td>${esc(item.quantity || 1)}</td>
          <td>${currency}${priceNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          <td><b>${currency}${totalNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</b></td>
        </tr>
      `;
    });

    // Build Terms HTML for Quotation
    let termsHtml = "";
    if (!isInvoice && doc.terms) {
      termsHtml = `
        <div style="margin-top: 24px; padding-top: 14px; border-top: 1px dashed #cbd5e1; font-size: 11px; color: #64748b; line-height: 1.6;">
          <b style="color: #334155;">Terms & Conditions:</b>
          <div style="white-space: pre-line; margin-top: 4px;">${esc(doc.terms)}</div>
        </div>
      `;
    }

    // Build Tax Breakdown HTML (Intra: CGST+SGST vs Inter: IGST)
    let taxBreakdownHtml = `
      <div>
        <span>GST (18%):</span>
        <b>${doc.taxAmount || "₹0.00"}</b>
      </div>
    `;

    if (window.InvoZapCalc) {
      const calcResult = window.InvoZapCalc.calculateFinancials({
        items: items,
        taxMode: "gst",
        taxRatePercent: 18,
        sellerStateCode: doc.sellerStateCode || "27",
        buyerStateCode: doc.buyerStateCode || "27",
        currencySymbol: currency
      });
      if (calcResult.regime === "intra") {
        taxBreakdownHtml = `
          <div><span>CGST (9%):</span> <b>${calcResult.totals.cgstFormatted}</b></div>
          <div><span>SGST (9%):</span> <b>${calcResult.totals.sgstFormatted}</b></div>
        `;
      } else if (calcResult.regime === "inter") {
        taxBreakdownHtml = `
          <div><span>IGST (18%):</span> <b>${calcResult.totals.igstFormatted}</b></div>
        `;
      }
    }

    // Build Live UPI QR Payment Block (Only if real seller VPA is present)
    let upiHtml = "";
    const vpa = (doc.upiDetails?.vpa || "").trim();
    if (window.InvoZapUpi && vpa) {
      const payee = doc.upiDetails?.payeeName || doc.sellerDetails?.businessName || "Registered Merchant";
      const amountNum = parseFloat((doc.total || "0").replace(/[^0-9.]/g, "")) || 0;
      const upiUri = window.InvoZapUpi.buildUpiUri({
        vpa: vpa,
        payeeName: payee,
        amount: amountNum,
        invoiceNumber: docNumber
      });
      const qrSvg = window.InvoZapUpi.generateUpiQrSvg(upiUri, 100);
      upiHtml = `
        <div style="display: flex; align-items: center; gap: 14px; background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 8px; padding: 12px 14px; margin-top: 20px;">
          <div style="flex-shrink: 0; background: #ffffff; padding: 4px; border: 1px solid #e2e8f0; border-radius: 6px;">
            ${qrSvg}
          </div>
          <div style="flex: 1; font-size: 12px; color: #334155;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="background: #22c55e; color: #ffffff; font-size: 9px; font-weight: 800; padding: 2px 5px; border-radius: 3px;">UPI PAYMENT</span>
              <span style="color: #64748b; font-size: 11px;">Instant Zero-Fee Settlement</span>
            </div>
            <p style="margin: 2px 0; font-size: 13px; font-weight: 700; color: #0f172a;">Scan to Pay via Any UPI App</p>
            <p style="margin: 2px 0; font-size: 11px; color: #64748b;">GPay • PhonePe • Paytm • BHIM • CRED</p>
            <div style="margin-top: 4px; font-size: 11px; color: #475569;">
              <b>VPA:</b> <code style="background: #e2e8f0; padding: 1px 4px; border-radius: 3px; font-family: monospace;">${vpa}</code>
            </div>
          </div>
        </div>
      `;
    }

    // Contact info
    let contactInfo = "";
    if (client.email && client.phone) contactInfo = `${client.email} • ${client.phone}`;
    else contactInfo = client.email || client.phone || "";

    // Inject View Sheet Paper
    modalSheetContainer.innerHTML = `
      <div class="sheet-paper theme-${theme}">
        <!-- BRAND HEADER -->
        <div class="sheet-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h2 class="biz-title">${esc(doc.sellerDetails?.businessName || "")}</h2>
            <p class="biz-tagline" style="margin: 2px 0 6px; font-size: 12px; color: #64748b; font-style: italic;">${esc(doc.sellerDetails?.tagline || "")}</p>
            <p class="biz-address" style="margin: 0; font-size: 11px; color: #475569; line-height: 1.4;">${esc(doc.sellerDetails?.address || "")}<br>${esc(doc.sellerDetails?.email || "")} • ${esc(doc.sellerDetails?.phone || "")}</p>
          </div>
          <div class="sheet-badge">
            <h1 style="margin: 0; font-size: 26px; letter-spacing: 2px; color: #0f172a;">${isInvoice ? "INVOICE" : "QUOTATION"}</h1>
          </div>
        </div>

        <div class="sheet-divider"></div>

        <!-- META ROW -->
        <div class="sheet-meta-row" style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div class="bill-to">
            <span class="meta-label">${isInvoice ? "INVOICE TO:" : "QUOTATION FOR:"}</span>
            <h3 style="margin: 4px 0 2px; font-size: 16px; color: #0f172a;">${esc(client.clientName || doc.clientName || "Client")}</h3>
            <p class="meta-sub" style="margin: 0; font-size: 12px; color: #64748b;">${esc(client.address || "")}</p>
            <p class="meta-sub" style="margin: 2px 0 0; font-size: 12px; color: #64748b;">${esc(contactInfo)}</p>
          </div>

          <div class="inv-details" style="text-align: right; font-size: 12px; color: #334155;">
            <p><b>${isInvoice ? "Invoice No:" : "Quotation No:"}</b> <span class="badge-num">${esc(docNumber)}</span></p>
            <p><b>DATE:</b> ${esc(formatDate(docDate))}</p>
            <p><b>${esc(secondDateLabel)}</b> ${esc(formatDate(secondDateVal))}</p>
            <p><span class="history-pill ${status.toLowerCase()}">${esc(status.toUpperCase())}</span></p>
          </div>
        </div>

        <!-- ITEMS TABLE -->
        <table class="preview-table">
          <thead>
            <tr>
              <th style="width: 8%;">NO</th>
              <th>DESCRIPTION</th>
              <th style="width: 12%;">QTY</th>
              <th style="width: 20%;">PRICE</th>
              <th style="width: 22%;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- TOTALS -->
        <div class="preview-totals">
          <div>
            <span>Subtotal:</span>
            <b>${doc.subtotal || "₹0.00"}</b>
          </div>
          ${taxBreakdownHtml}
          <div class="grand-total">
            <span>Grand Total:</span>
            <b>${doc.total || "₹0.00"}</b>
          </div>
        </div>

        <!-- PAYMENT & QR -->
        ${upiHtml}

        ${termsHtml}
      </div>
    `;

    viewModal.style.display = "flex";
  }

  // --- 6. Modal Print & Close Handlers ---
  if (modalPrintBtn) {
    modalPrintBtn.addEventListener("click", function () {
      window.print();
    });
  }

  function closeModal() {
    if (viewModal) viewModal.style.display = "none";
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeModal);

  if (viewModal) {
    viewModal.addEventListener("click", function (e) {
      if (e.target === viewModal) closeModal();
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && viewModal && viewModal.style.display === "flex") {
      closeModal();
    }
  });

  // --- 7. Convert Quotation to Invoice Logic ---
  function convertQuoteToInvoice(quoteNo) {
    const quotations = JSON.parse(localStorage.getItem("invozap_quotations") || "[]");
    const quoteIndex = quotations.findIndex(q => q.quotationNumber === quoteNo);

    if (quoteIndex === -1) {
      alert("Quotation not found.");
      return;
    }

    const quote = quotations[quoteIndex];

    // 1. Calculate next sequential Indian FY Invoice Number
    const invoices = JSON.parse(localStorage.getItem("invozap_invoices") || "[]");
    let nextInvNumber = "INV/2026-27/0001";
    if (window.InvoZapNumbering) {
      nextInvNumber = window.InvoZapNumbering.getNextDocumentNumber("invoice", invoices, "INV");
      const parsed = window.InvoZapNumbering.parseDocumentNumber(nextInvNumber);
      if (parsed && parsed.seq) {
        window.InvoZapNumbering.commitAllocatedSequence("invoice", parsed.seq, "INV");
      }
    }

    // 2. Set conversion dates (Today's date for invoice, +7 days for due date)
    const today = new Date();
    const todayIso = today.toISOString().split("T")[0];

    const due = new Date();
    due.setDate(due.getDate() + 7);
    const dueIso = due.toISOString().split("T")[0];

    // 3. Assemble new Invoice Object
    const clientName = quote.clientName || (quote.clientDetails && quote.clientDetails.clientName) || "Client";
    const newInvoice = {
      invoiceNumber: nextInvNumber,
      invoiceDate: todayIso, // Record moved by today's date
      dueDate: dueIso,
      currency: quote.currency || "₹",
      status: "Unpaid",
      themeColor: quote.themeColor || "navy",
      sellerDetails: quote.sellerDetails || {
        businessName: "InvoZap Solutions",
        tagline: "Sourcing Quality, Delivering Reliability",
        address: "Shivaji Nagar, Pune, Maharashtra 411005",
        email: "support@invozap.com",
        phone: "+91 91234 56789",
      },
      clientName: clientName,
      clientDetails: quote.clientDetails || {
        clientName: clientName,
        address: quote.clientAddress || "",
        email: quote.clientEmail || "",
        phone: quote.clientPhone || "",
        gstin: quote.clientGst || "",
      },
      items: quote.items || [],
      taxRate: quote.taxRate || 18,
      subtotal: quote.subtotal,
      taxAmount: quote.taxAmount,
      total: quote.total,
      convertedFrom: quote.quotationNumber,
      convertedAt: todayIso,
      savedAt: new Date().toISOString()
    };

    // 4. Save into Invoice History
    invoices.push(newInvoice);
    localStorage.setItem("invozap_invoices", JSON.stringify(invoices));

    // 5. Update Quotation Status to Converted
    quote.status = "Converted";
    quote.convertedInvoiceNumber = nextInvNumber;
    quote.convertedAt = todayIso;
    quotations[quoteIndex] = quote;
    localStorage.setItem("invozap_quotations", JSON.stringify(quotations));

    // 6. User feedback & auto-switch to Invoices Tab
    alert(
      `🎉 Quotation Converted Successfully!\n\n` +
      `Quotation ${quote.quotationNumber} has been converted into Invoice ${nextInvNumber} with today's date (${todayIso}) and moved to Invoice History.`
    );

    loadInvoices();
    loadQuotations();
    showInvoicesTab();

    // Visual highlight on newly created invoice row
    const firstRow = invoicesTableBody.querySelector("tr");
    if (firstRow) {
      firstRow.classList.add("row-highlight");
    }
  }

  // --- 8. Delete Draft or Void Issued Record Handler (Spec F4 & C12) ---
  function deleteOrVoidRecord(type, id) {
    const isInvoice = type === "invoice";
    const key = isInvoice ? "invozap_invoices" : "invozap_quotations";
    const idKey = isInvoice ? "invoiceNumber" : "quotationNumber";
    const label = isInvoice ? "Invoice" : "Quotation";

    let records = JSON.parse(localStorage.getItem(key) || "[]");
    const rec = records.find(item => item[idKey] === id);
    if (!rec) return;

    const isDraft = (rec.status || "").toLowerCase() === "draft";

    if (isDraft) {
      if (!confirm(`Are you sure you want to delete draft ${label} "${id}"? This cannot be undone.`)) {
        return;
      }
      records = records.filter(item => item[idKey] !== id);
      localStorage.setItem(key, JSON.stringify(records));
    } else {
      // Issued invoices cannot be deleted (Spec F4 / C12) - they must be VOIDED to preserve numbering integrity
      if (!confirm(`Issued ${label} "${id}" cannot be deleted because its sequential number is locked.\n\nWould you like to VOID this ${label} instead? It will be marked as Void and remain on your audit ledger.`)) {
        return;
      }
      rec.status = "Void";
      rec.voidedAt = new Date().toISOString();
      localStorage.setItem(key, JSON.stringify(records));
    }

    if (isInvoice) {
      loadInvoices();
    } else {
      loadQuotations();
    }
  }

  // --- 9. Initial Load ---
  loadInvoices();
  loadQuotations();
});
