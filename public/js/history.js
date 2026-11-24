/* ========================================================
   InvoZap - Records History Controller (history.js)
   Manages tab navigation, invoice loading, quotation loading,
   CSV exports, Edit links, and Document View Modal.
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
  const exportInvoicesCsvBtn = document.getElementById("exportInvoicesCsvBtn");

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
  function formatDate(dateInput) {
    if (!dateInput) return "--";
    const str = String(dateInput).slice(0, 10);
    const parts = str.split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateInput);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return String(dateInput);
  }

  // --- 2.05 Money & Total Resolvers (handles MongoDB documents & local storage) ---
  function formatMoney(amount, currency = "₹") {
    if (typeof amount === "number") {
      return `${currency}${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (typeof amount === "string" && amount.trim()) {
      if (amount.startsWith(currency)) return amount;
      const parsed = parseFloat(amount.replace(/[^0-9.-]/g, ""));
      if (!isNaN(parsed)) {
        return `${currency}${parsed.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      return amount;
    }
    return `${currency}0.00`;
  }

  function getDocGrandTotal(doc) {
    if (!doc) return 0;
    if (typeof doc.grandTotal === "number") return doc.grandTotal;
    if (typeof doc.grandTotalPaise === "number") return doc.grandTotalPaise / 100;
    if (doc.total) {
      const parsed = parseFloat(String(doc.total).replace(/[^0-9.-]/g, ""));
      if (!isNaN(parsed)) return parsed;
    }
    return 0;
  }

  function getDocGrandTotalFormatted(doc) {
    if (!doc) return "₹0.00";
    const currency = doc.currency || "₹";
    const total = getDocGrandTotal(doc);
    return formatMoney(total, currency);
  }

  function getDocSubtotalFormatted(doc) {
    if (!doc) return "₹0.00";
    const currency = doc.currency || "₹";
    if (typeof doc.subtotal === "number") return formatMoney(doc.subtotal, currency);
    if (typeof doc.subtotalPaise === "number") return formatMoney(doc.subtotalPaise / 100, currency);
    if (doc.subtotal) {
      const parsed = parseFloat(String(doc.subtotal).replace(/[^0-9.-]/g, ""));
      if (!isNaN(parsed)) return formatMoney(parsed, currency);
    }
    return `${currency}0.00`;
  }

  // --- 2.1 Bookkeeping CSV Exports ---
  // Signed-in users export the current server ledger. Guest users can export their
  // browser-local records, which keeps the feature useful before account creation.
  async function getInvoicesForExport() {
    const localInvoices = JSON.parse(localStorage.getItem("invozap_invoices") || "[]");
    const authToken = localStorage.getItem("invozap_token");
    if (!authToken) return localInvoices;

    try {
      const response = await fetch("/api/invoices", {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (response.ok && data.success) return data.invoices || [];
    } catch (error) {
      // Export the local ledger if the connection is temporarily unavailable.
    }
    return localInvoices;
  }

  function csvCell(value) {
    const text = value === null || value === undefined ? "" : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  }

  function dateForExport(value) {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value).slice(0, 10) : date.toISOString().slice(0, 10);
  }

  function downloadCsv(filename, rows) {
    const content = "\uFEFF" + rows.map(row => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function invoiceTotal(invoice) {
    if (typeof invoice.grandTotal === "number") return invoice.grandTotal;
    if (typeof invoice.grandTotalPaise === "number") return invoice.grandTotalPaise / 100;
    if (typeof invoice.total === "number") return invoice.total;
    return String(invoice.total || "").replace(/[^0-9.-]/g, "");
  }

  function invoiceBalance(invoice) {
    if (typeof invoice.balanceDue === "number") return invoice.balanceDue;
    const payments = (invoice.payments || []).filter(payment => !payment.voidedAt);
    const settled = payments.reduce((sum, payment) => sum + (Number(payment.amount) || Number(payment.amountPaise || 0) / 100), 0);
    const total = Number(invoiceTotal(invoice));
    return Number.isFinite(total) ? Math.max(0, total - settled) : "";
  }

  function exportDateStamp() {
    return new Date().toISOString().slice(0, 10);
  }



  if (exportInvoicesCsvBtn) {
    exportInvoicesCsvBtn.addEventListener("click", async function () {
      const invoices = await getInvoicesForExport();
      const rows = [[
        "Invoice Number", "Invoice Date", "Due Date", "Status", "Client", "GSTIN",
        "GST Regime", "Subtotal", "CGST", "SGST", "IGST", "Tax", "Grand Total", "Balance Due", "Currency"
      ]];
      invoices.forEach(invoice => {
        const client = invoice.clientDetails || {};
        rows.push([
          invoice.invoiceNumber, dateForExport(invoice.invoiceDate), dateForExport(invoice.dueDate), invoice.status,
          client.clientName || invoice.clientName, client.gstin || invoice.clientGst, invoice.regime,
          invoice.subtotal, Number(invoice.cgstPaise || 0) / 100, Number(invoice.sgstPaise || 0) / 100,
          Number(invoice.igstPaise || 0) / 100, invoice.taxAmount, invoiceTotal(invoice), invoiceBalance(invoice), invoice.currency || "₹"
        ]);
      });
      downloadCsv(`invozap-invoices-${exportDateStamp()}.csv`, rows);
    });
  }

  let currentInvoices = [];
  let currentQuotations = [];

  // --- 3. Load Invoices from MongoDB Atlas Cloud (or fallback) ---
  async function loadInvoices() {
    if (!invoicesTableBody) return;
    const authToken = localStorage.getItem("invozap_token");
    let invoices = [];

    if (authToken) {
      try {
        const res = await fetch("/api/invoices", {
          headers: { "Authorization": `Bearer ${authToken}` }
        });
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.invoices)) {
          invoices = data.invoices;
        }
      } catch (err) {
        console.warn("Could not fetch invoices from cloud:", err);
      }
    }

    if (invoices.length === 0) {
      invoices = JSON.parse(localStorage.getItem("invozap_invoices") || "[]");
    }

    currentInvoices = invoices;
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
      
      const invNumberHtml = `<b class="view-trigger" data-type="invoice" data-id="${esc(inv.invoiceNumber)}">${esc(inv.invoiceNumber || "--")}</b>`;

      let statusBadgeClass = "unpaid";
      if (isPaid) statusBadgeClass = "paid";
      else if (isPartial) statusBadgeClass = "partial";
      else if (isVoid) statusBadgeClass = "void";
      else if (isDraft) statusBadgeClass = "draft";

      const deleteHtml = `<button type="button" class="btn-action btn-delete" data-type="invoice" data-id="${esc(inv.invoiceNumber)}">Delete</button>`;

      tr.innerHTML = `
        <td>${invNumberHtml}</td>
        <td class="view-trigger" data-type="invoice" data-id="${esc(inv.invoiceNumber)}">${esc(client)}</td>
        <td>${esc(formatDate(inv.invoiceDate))}</td>
        <td>${esc(formatDate(inv.dueDate))}</td>
        <td><b>${esc(getDocGrandTotalFormatted(inv))}</b></td>
        <td>
          <span class="history-pill ${statusBadgeClass}">
            ${esc(inv.status || 'Unpaid')}
          </span>
        </td>
        <td style="text-align: center;">
          <div class="action-cell">
            <button type="button" class="btn-action btn-view" data-type="invoice" data-id="${esc(inv.invoiceNumber)}">View</button>
            <button type="button" class="btn-action btn-print" data-type="invoice" data-id="${esc(inv.invoiceNumber)}">Print</button>
            <a href="createnew.html?edit=${encodeURIComponent(inv.invoiceNumber)}" class="btn-action btn-edit">Edit</a>
            ${deleteHtml}
          </div>
        </td>
      `;
      invoicesTableBody.appendChild(tr);
    });

    // Attach Print triggers
    invoicesTableBody.querySelectorAll(".btn-print").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const id = this.getAttribute("data-id");
        openViewModal("invoice", id);
        setTimeout(function () {
          window.print();
        }, 150);
      });
    });

    // Attach Delete listeners
    invoicesTableBody.querySelectorAll(".btn-delete").forEach(function (btn) {
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

  // --- 4. Load Quotations from MongoDB Atlas Cloud (or fallback) ---
  async function loadQuotations() {
    if (!quotationsTableBody) return;
    const authToken = localStorage.getItem("invozap_token");
    let quotations = [];

    if (authToken) {
      try {
        const res = await fetch("/api/quotations", {
          headers: { "Authorization": `Bearer ${authToken}` }
        });
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.quotations)) {
          quotations = data.quotations;
        }
      } catch (err) {
        console.warn("Could not fetch quotations from cloud:", err);
      }
    }

    if (quotations.length === 0) {
      quotations = JSON.parse(localStorage.getItem("invozap_quotations") || "[]");
    }

    currentQuotations = quotations;
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

      tr.innerHTML = `
        <td><b class="view-trigger" data-type="quotation" data-id="${esc(q.quotationNumber)}">${esc(q.quotationNumber || "--")}</b></td>
        <td class="view-trigger" data-type="quotation" data-id="${esc(q.quotationNumber)}">${esc(client)}</td>
        <td>${esc(formatDate(q.quotationDate))}</td>
        <td>${esc(formatDate(q.validUntil))}</td>
        <td><b>${esc(getDocGrandTotalFormatted(q))}</b></td>
        <td>
          <span class="history-pill ${statusLower}">
            ${esc(q.status || "Draft")}
          </span>
        </td>
        <td style="text-align: center;">
          <div class="action-cell">
            <button type="button" class="btn-action btn-view" data-type="quotation" data-id="${esc(q.quotationNumber)}">View</button>
            <button type="button" class="btn-action btn-print" data-type="quotation" data-id="${esc(q.quotationNumber)}">Print</button>
            <a href="quotation.html?edit=${encodeURIComponent(q.quotationNumber)}" class="btn-action btn-edit">Edit</a>
            <button type="button" class="btn-action btn-delete" data-type="quotation" data-id="${esc(q.quotationNumber)}">Delete</button>
          </div>
        </td>
      `;
      quotationsTableBody.appendChild(tr);
    });

    // Attach Print triggers
    quotationsTableBody.querySelectorAll(".btn-print").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const id = this.getAttribute("data-id");
        openViewModal("quotation", id);
        setTimeout(function () {
          window.print();
        }, 150);
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

  // --- 5. Open View-Only Sheet Modal ---
  function openViewModal(type, id) {
    if (!viewModal || !modalSheetContainer) return;

    let doc = null;
    if (type === "invoice") {
      doc = currentInvoices.find(i => i.invoiceNumber === id || i._id === id);
      if (!doc) {
        const invoices = JSON.parse(localStorage.getItem("invozap_invoices") || "[]");
        doc = invoices.find(i => i.invoiceNumber === id || i._id === id);
      }
    } else {
      doc = currentQuotations.find(q => q.quotationNumber === id || q._id === id);
      if (!doc) {
        const quotations = JSON.parse(localStorage.getItem("invozap_quotations") || "[]");
        doc = quotations.find(q => q.quotationNumber === id || q._id === id);
      }
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
      const resolvedSellerState = doc.sellerStateCode || (doc.sellerDetails && doc.sellerDetails.stateCode) || "27";
      const resolvedBuyerState = doc.buyerStateCode || (doc.clientDetails && doc.clientDetails.stateCode) || "27";
      const calcResult = window.InvoZapCalc.calculateFinancials({
        items: items,
        taxMode: "gst",
        taxRatePercent: 18,
        sellerStateCode: resolvedSellerState,
        buyerStateCode: resolvedBuyerState,
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
      const amountNum = getDocGrandTotal(doc);
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
            <b>${esc(getDocSubtotalFormatted(doc))}</b>
          </div>
          ${taxBreakdownHtml}
          <div class="grand-total">
            <span>Grand Total:</span>
            <b>${esc(getDocGrandTotalFormatted(doc))}</b>
          </div>
          <div style="font-size: 11px; color: #64748b; font-style: italic; margin-top: 4px; text-align: right; width: 100%;">
            <span>${esc(window.paiseToWords && doc.grandTotalPaise ? window.paiseToWords(doc.grandTotalPaise) : (window.rupeesToWords ? window.rupeesToWords(String(getDocGrandTotal(doc))) : ""))}</span>
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

  // --- 7. Delete Record Handler ---
  async function deleteOrVoidRecord(type, id) {
    const isInvoice = type === "invoice";
    const key = isInvoice ? "invozap_invoices" : "invozap_quotations";
    const idKey = isInvoice ? "invoiceNumber" : "quotationNumber";
    const label = isInvoice ? "Invoice" : "Quotation";

    const activeList = isInvoice ? currentInvoices : currentQuotations;
    let rec = activeList.find(item => item[idKey] === id || item._id === id);
    let localRecords = JSON.parse(localStorage.getItem(key) || "[]");
    if (!rec) {
      rec = localRecords.find(item => item[idKey] === id || item._id === id);
    }
    if (!rec) {
      alert(`${label} "${id}" not found.`);
      return;
    }

    const authToken = localStorage.getItem("invozap_token");
    const status = (rec.status || "").toLowerCase();

    if (isInvoice && status !== "draft") {
      // Issued invoice: Cannot be permanently deleted under accounting rules; offer to VOID
      if (status === "void") {
        alert(`Invoice "${id}" is already voided.`);
        return;
      }

      const confirmed = confirm(
        `Issued invoices cannot be permanently deleted under accounting rules.\n\nDo you want to VOID Invoice "${id}" instead? This cancels the balance due and revokes active public share links.`
      );
      if (!confirmed) return;

      if (authToken && rec._id) {
        try {
          const res = await fetch(`/api/invoices/${rec._id}/void`, {
            method: "POST",
            headers: { Authorization: `Bearer ${authToken}` },
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            alert(data.message || `Failed to void invoice "${id}".`);
            return;
          }
        } catch (err) {
          console.warn("Cloud void error:", err);
          alert("Network error while trying to void invoice on server.");
          return;
        }
      }

      // Update local storage record if present
      localRecords = localRecords.map(item => {
        if (item[idKey] === id || item._id === rec._id) {
          return { ...item, status: "Void" };
        }
        return item;
      });
      localStorage.setItem(key, JSON.stringify(localRecords));

      await loadInvoices();
      return;
    }

    // Deletion for Draft invoice or Quotation
    if (!confirm(`Are you sure you want to delete ${label} "${id}"? This cannot be undone.`)) {
      return;
    }

    if (authToken && rec._id) {
      try {
        const endpoint = isInvoice ? `/api/invoices/${rec._id}` : `/api/quotations/${rec._id}`;
        const res = await fetch(endpoint, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          alert(data.message || `Failed to delete ${label} "${id}".`);
          return;
        }
      } catch (err) {
        console.warn("Cloud delete error:", err);
        alert(`Network error while trying to delete ${label} on server.`);
        return;
      }
    }

    localRecords = localRecords.filter(item => item[idKey] !== id && item._id !== rec._id);
    localStorage.setItem(key, JSON.stringify(localRecords));

    if (isInvoice) {
      await loadInvoices();
    } else {
      await loadQuotations();
    }
  }

  // --- 8. Initial Load ---
  loadInvoices();
  loadQuotations();
});
