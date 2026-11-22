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
  const tabBtnStatements = document.getElementById("tabBtnStatements");
  const invoiceSection = document.getElementById("invoiceSection");
  const quotationSection = document.getElementById("quotationSection");
  const statementSection = document.getElementById("statementSection");
  const openStatementsTabBtn = document.getElementById("openStatementsTabBtn");

  const invoiceCount = document.getElementById("invoiceCount");
  const quotationCount = document.getElementById("quotationCount");

  const invoicesTable = document.getElementById("invoicesTable");
  const invoicesTableBody = document.getElementById("invoicesTableBody");
  const invoicesEmptyNotice = document.getElementById("invoicesEmptyNotice");

  const quotationsTable = document.getElementById("quotationsTable");
  const quotationsTableBody = document.getElementById("quotationsTableBody");
  const quotationsEmptyNotice = document.getElementById("quotationsEmptyNotice");
  const exportInvoicesCsvBtn = document.getElementById("exportInvoicesCsvBtn");
  const exportPaymentsCsvBtn = document.getElementById("exportPaymentsCsvBtn");

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
    if (tabBtnStatements) tabBtnStatements.classList.remove("active");
    if (invoiceSection) invoiceSection.style.display = "block";
    if (quotationSection) quotationSection.style.display = "none";
    if (statementSection) statementSection.style.display = "none";
  }

  function showQuotationsTab() {
    if (tabBtnQuotations) tabBtnQuotations.classList.add("active");
    if (tabBtnInvoices) tabBtnInvoices.classList.remove("active");
    if (tabBtnStatements) tabBtnStatements.classList.remove("active");
    if (invoiceSection) invoiceSection.style.display = "none";
    if (quotationSection) quotationSection.style.display = "block";
    if (statementSection) statementSection.style.display = "none";
  }

  function showStatementsTab(clientNameToSelect) {
    if (tabBtnStatements) tabBtnStatements.classList.add("active");
    if (tabBtnInvoices) tabBtnInvoices.classList.remove("active");
    if (tabBtnQuotations) tabBtnQuotations.classList.remove("active");
    if (invoiceSection) invoiceSection.style.display = "none";
    if (quotationSection) quotationSection.style.display = "none";
    if (statementSection) statementSection.style.display = "block";
    loadStatementClients(clientNameToSelect);
  }

  if (tabBtnInvoices) tabBtnInvoices.addEventListener("click", showInvoicesTab);
  if (tabBtnQuotations) tabBtnQuotations.addEventListener("click", showQuotationsTab);
  if (tabBtnStatements) tabBtnStatements.addEventListener("click", () => showStatementsTab());
  if (openStatementsTabBtn) openStatementsTabBtn.addEventListener("click", () => showStatementsTab());

  // Check URL query parameters for ?tab=quotations or ?tab=statements
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("tab") === "quotations") {
    showQuotationsTab();
  } else if (urlParams.get("tab") === "statements") {
    showStatementsTab(urlParams.get("client"));
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

  // --- 2.2 Payment Follow-up Reminder ---
  function reminderPhoneNumber(phone) {
    let digits = String(phone || "").replace(/\D/g, "");
    if (digits.length === 10) digits = "91" + digits;
    if (digits.length === 11 && digits.startsWith("0")) digits = "91" + digits.slice(1);
    return digits;
  }

  function reminderMessage(button) {
    const dueDate = button.dataset.dueDate;
    const clientName = button.dataset.clientName || "there";
    const invoiceNumber = button.dataset.invoiceNumber || "";
    const balance = button.dataset.balance || "";
    const isOverdue = dueDate && new Date(`${dueDate}T23:59:59`).getTime() < Date.now();
    const timing = isOverdue ? "is now overdue" : (dueDate ? `is due on ${formatDate(dueDate)}` : "is awaiting payment");
    return `Hello ${clientName},\n\nA friendly reminder that payment of ${balance} for Invoice ${invoiceNumber} ${timing}.\n\nPlease let us know once payment has been made. Thank you.`;
  }

  function openPaymentReminder(button) {
    const phone = reminderPhoneNumber(button.dataset.phone);
    if (phone.length < 10) {
      alert("Add a valid client phone number before sending a WhatsApp reminder.");
      return;
    }
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(reminderMessage(button))}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }

  async function createAdjustmentNote(button) {
    const type = (prompt("Enter note type: credit or debit") || "").trim().toLowerCase();
    if (type !== "credit" && type !== "debit") return;
    const amount = Number(prompt(`Enter ${type} note amount in rupees:`));
    if (!Number.isFinite(amount) || amount <= 0) return alert("Enter a valid positive amount.");
    const reason = (prompt(`Reason for this ${type} note:`) || "").trim();
    if (!reason) return alert("A reason is required for an adjustment note.");

    const authToken = localStorage.getItem("invozap_token");
    if (!authToken) return alert("Sign in to create a credit or debit note.");
    try {
      const response = await fetch(`/api/invoices/${button.dataset.invoiceId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
        body: JSON.stringify({ type, amount, reason })
      });
      const data = await response.json();
      if (!response.ok || !data.success) return alert(data.message || "Could not create the adjustment note.");

      const invoices = JSON.parse(localStorage.getItem("invozap_invoices") || "[]");
      const index = invoices.findIndex(invoice => String(invoice._id) === String(button.dataset.invoiceId));
      if (index >= 0) {
        invoices[index] = { ...invoices[index], ...data.invoice };
        localStorage.setItem("invozap_invoices", JSON.stringify(invoices));
      }
      alert(`${type === "credit" ? "Credit" : "Debit"} note ${data.note.noteNumber} created.`);
      loadInvoices();
    } catch (error) {
      alert("Could not reach the server. Please try again.");
    }
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

  if (exportPaymentsCsvBtn) {
    exportPaymentsCsvBtn.addEventListener("click", async function () {
      const invoices = await getInvoicesForExport();
      const rows = [["Invoice Number", "Client", "Entry Date", "Entry Type", "Method", "Amount", "Reference", "Status"]];
      invoices.forEach(invoice => {
        const clientName = (invoice.clientDetails && invoice.clientDetails.clientName) || invoice.clientName || "";
        (invoice.payments || []).forEach(payment => {
          rows.push([
            invoice.invoiceNumber, clientName, dateForExport(payment.receivedOn || payment.recordedAt),
            payment.kind === "tds_credit" ? "TDS Credit" : "Payment Received", payment.method,
            typeof payment.amount === "number" ? payment.amount : Number(payment.amountPaise || 0) / 100,
            payment.reference, payment.voidedAt ? "Voided" : "Active"
          ]);
        });
      });
      downloadCsv(`invozap-payments-${exportDateStamp()}.csv`, rows);
    });
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
        deleteOrVoidHtml = `<button type="button" class="btn-action btn-delete" data-type="invoice" data-id="${esc(inv.invoiceNumber)}">Delete</button>`;
      } else if (!isVoid) {
        deleteOrVoidHtml = `<button type="button" class="btn-action btn-void" data-type="invoice" data-id="${esc(inv.invoiceNumber)}" style="background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1;">Void</button>`;
      }

      const clientDetails = inv.clientDetails || {};
      const clientPhone = clientDetails.phone || inv.clientPhone || "";
      const reminderHtml = (!isVoid && !isDraft && !isPaid && clientPhone)
        ? `<button type="button" class="btn-action btn-remind" data-phone="${esc(clientPhone)}" data-client-name="${esc(client)}" data-invoice-number="${esc(inv.invoiceNumber)}" data-due-date="${esc(String(inv.dueDate || "").slice(0, 10))}" data-balance="${esc(String(invoiceBalance(inv)))}" title="Prepare WhatsApp payment reminder">Remind</button>`
        : "";
      const noteHtml = (!isVoid && !isDraft && inv._id)
        ? `<button type="button" class="btn-action btn-note" data-invoice-id="${esc(inv._id)}" title="Create credit or debit note">Adjust</button>`
        : "";
      const statementHtml = client && client !== "Unnamed Client"
        ? `<button type="button" class="btn-action btn-statement" data-client-name="${esc(client)}" style="background: #f8fafc; color: #0f766e; border: 1px solid #99f6e4;" title="View Client Statement of Account">Statement</button>`
        : "";

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
            <button type="button" class="btn-action btn-view" data-type="invoice" data-id="${esc(inv.invoiceNumber)}">View</button>
            ${!isVoid ? `<a href="createnew.html?edit=${encodeURIComponent(inv.invoiceNumber)}" class="btn-action btn-edit">Edit</a>` : ''}
            ${statementHtml}
            ${reminderHtml}
            ${noteHtml}
            ${deleteOrVoidHtml}
          </div>
        </td>
      `;
      invoicesTableBody.appendChild(tr);
    });

    // Attach Record Payment / Status Modal trigger for Invoices
    invoicesTableBody.querySelectorAll(".status-toggle").forEach(function (pill) {
      pill.addEventListener("click", function (e) {
        e.stopPropagation();
        const invNo = this.getAttribute("data-inv");
        openRecordPaymentModal(invNo);
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

    invoicesTableBody.querySelectorAll(".btn-remind").forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        event.stopPropagation();
        openPaymentReminder(this);
      });
    });

    invoicesTableBody.querySelectorAll(".btn-note").forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        event.stopPropagation();
        createAdjustmentNote(this);
      });
    });

    invoicesTableBody.querySelectorAll(".btn-statement").forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        event.stopPropagation();
        const clientName = this.dataset.clientName;
        showStatementsTab(clientName);
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

  // --- 3.1 Interactive Record Payment / TDS Credit Dialog (Spec F12 Ledger) ---
  const paymentModal = document.getElementById("paymentModal");
  const payModalCloseBtn = document.getElementById("payModalCloseBtn");
  const payCancelBtn = document.getElementById("payCancelBtn");
  const recordPaymentForm = document.getElementById("recordPaymentForm");
  const btnPayFullBalance = document.getElementById("btnPayFullBalance");

  function openRecordPaymentModal(invNumber) {
    const invoices = JSON.parse(localStorage.getItem("invozap_invoices") || "[]");
    const inv = invoices.find(i => i.invoiceNumber === invNumber);
    if (!inv) return;

    const statusLower = (inv.status || "").toLowerCase();
    if (statusLower === "void") {
      alert("Cannot record payments on a Voided invoice.");
      return;
    }
    if (statusLower === "draft") {
      alert("Cannot record payments on an unissued Draft invoice. Please issue the invoice first.");
      return;
    }

    const totalPaise = inv.grandTotalPaise || Math.round((inv.grandTotal || 0) * 100);
    const settlement = window.InvoZapCalc ? window.InvoZapCalc.calculateSettlement({
      totalPaise: totalPaise,
      payments: inv.payments || []
    }) : {
      totalSettledPaise: statusLower === "paid" ? totalPaise : 0,
      balanceDuePaise: statusLower === "paid" ? 0 : totalPaise
    };

    const currency = inv.currency || "₹";
    const totalRupees = totalPaise / 100;
    const settledRupees = settlement.totalSettledPaise / 100;
    const balanceRupees = settlement.balanceDuePaise / 100;

    document.getElementById("payModalTitle").textContent = `Record Payment: ${inv.invoiceNumber}`;
    document.getElementById("payModalTotal").textContent = `${currency}${totalRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
    document.getElementById("payModalSettled").textContent = `${currency}${settledRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
    document.getElementById("payModalBalance").textContent = `${currency}${balanceRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

    document.getElementById("payInvoiceId").value = inv._id || inv.id || "";
    document.getElementById("payInvoiceNumber").value = inv.invoiceNumber;
    document.getElementById("payDateInput").value = new Date().toISOString().slice(0, 10);
    document.getElementById("payAmountInput").value = balanceRupees > 0 ? balanceRupees.toFixed(2) : "";
    document.getElementById("payAmountInput").max = balanceRupees > 0 ? balanceRupees : 0;
    document.getElementById("payRefInput").value = "";

    if (paymentModal) paymentModal.style.display = "flex";
  }

  if (payModalCloseBtn) payModalCloseBtn.addEventListener("click", () => { if (paymentModal) paymentModal.style.display = "none"; });
  if (payCancelBtn) payCancelBtn.addEventListener("click", () => { if (paymentModal) paymentModal.style.display = "none"; });
  if (btnPayFullBalance) {
    btnPayFullBalance.addEventListener("click", () => {
      const balanceText = document.getElementById("payModalBalance").textContent.replace(/[^0-9.]/g, "");
      const bal = parseFloat(balanceText) || 0;
      if (bal > 0) document.getElementById("payAmountInput").value = bal.toFixed(2);
    });
  }

  if (recordPaymentForm) {
    recordPaymentForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const invNumber = document.getElementById("payInvoiceNumber").value;
      const invId = document.getElementById("payInvoiceId").value;
      const amountVal = parseFloat(document.getElementById("payAmountInput").value);
      const kind = document.getElementById("payKindSelect").value;
      const method = document.getElementById("payMethodSelect").value;
      const receivedOn = document.getElementById("payDateInput").value;
      const reference = document.getElementById("payRefInput").value.trim();

      if (!amountVal || amountVal <= 0) {
        alert("Please enter a valid payment amount greater than 0.");
        return;
      }

      const authToken = localStorage.getItem("invozap_token");
      const candidatePayment = {
        amount: amountVal,
        kind,
        method,
        receivedOn,
        reference
      };

      // 1. If user is authenticated and invoice has a database ID, sync to server
      if (authToken && invId) {
        try {
          const res = await fetch(`/api/invoices/${invId}/payments`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${authToken}`
            },
            body: JSON.stringify(candidatePayment)
          });
          const data = await res.json();
          if (!res.ok) {
            alert(data.message || "Failed to record payment on server.");
            return;
          }
        } catch (err) {
          console.warn("Could not connect to backend; storing in local ledger.", err);
        }
      }

      // 2. Update local state
      const invoices = JSON.parse(localStorage.getItem("invozap_invoices") || "[]");
      const idx = invoices.findIndex(i => i.invoiceNumber === invNumber);
      if (idx >= 0) {
        const inv = invoices[idx];
        inv.payments = inv.payments || [];
        const candPaise = Math.round(amountVal * 100);
        const totalPaise = inv.grandTotalPaise || Math.round((inv.grandTotal || 0) * 100);

        if (window.InvoZapCalc) {
          const settlement = window.InvoZapCalc.calculateSettlement({
            totalPaise,
            payments: [...inv.payments, { amountPaise: candPaise, kind, method, receivedOn, reference }]
          });
          if (settlement.isOverpaid) {
            alert("Payment rejected: Total payments cannot exceed the invoice balance.");
            return;
          }
          inv.payments.push({
            paymentId: "pay_" + Math.random().toString(36).substring(2, 9),
            amountPaise: candPaise,
            amount: amountVal,
            kind,
            method,
            receivedOn,
            reference,
            recordedAt: new Date().toISOString()
          });
          inv.balanceDuePaise = settlement.balanceDuePaise;
          inv.balanceDue = settlement.balanceDuePaise / 100;
          inv.status = settlement.balanceDuePaise === 0 ? "Paid" : "Partial";
        }
        localStorage.setItem("invozap_invoices", JSON.stringify(invoices));
      }

      if (paymentModal) paymentModal.style.display = "none";
      alert("Payment successfully recorded!");
      loadInvoices();
    });
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
        actionConvertHtml = `<span class="converted-badge">Converted (${esc(q.convertedInvoiceNumber || 'Invoice')})</span>`;
      } else {
        actionConvertHtml = `<button type="button" class="btn-convert" data-quoteno="${esc(q.quotationNumber)}">Convert</button>`;
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
            <button type="button" class="btn-action btn-view" data-type="quotation" data-id="${esc(q.quotationNumber)}">View</button>
            <a href="quotation.html?edit=${encodeURIComponent(q.quotationNumber)}" class="btn-action btn-edit">Edit</a>
            ${actionConvertHtml}
            <button type="button" class="btn-action btn-delete" data-type="quotation" data-id="${esc(q.quotationNumber)}">Delete</button>
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
          <div style="font-size: 11px; color: #64748b; font-style: italic; margin-top: 4px; text-align: right; width: 100%;">
            <span>${esc(window.paiseToWords && doc.grandTotalPaise ? window.paiseToWords(doc.grandTotalPaise) : (window.rupeesToWords ? window.rupeesToWords(String(doc.total || doc.grandTotal || "0").replace(/[^0-9.]/g, "")) : ""))}</span>
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
      `Quotation Converted Successfully!\n\n` +
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

  // ========================================================
  // 9. CLIENT STATEMENTS OF ACCOUNT
  // ========================================================
  const statementClientSelect = document.getElementById("statementClientSelect");
  const statementFromDate = document.getElementById("statementFromDate");
  const statementToDate = document.getElementById("statementToDate");
  const btnFilterAllTime = document.getElementById("btnFilterAllTime");
  const btnFilterThisFY = document.getElementById("btnFilterThisFY");
  const btnFilter30Days = document.getElementById("btnFilter30Days");
  const btnApplyStatementFilter = document.getElementById("btnApplyStatementFilter");
  const exportStatementCsvBtn = document.getElementById("exportStatementCsvBtn");
  const printStatementBtn = document.getElementById("printStatementBtn");
  const statementPaperContent = document.getElementById("statementPaperContent");
  const statementEmptyState = document.getElementById("statementEmptyState");

  let currentStatementData = null;

  async function loadStatementClients(selectedClientName) {
    if (!statementClientSelect) return;

    // Collect clients from localStorage
    const localInvoices = JSON.parse(localStorage.getItem("invozap_invoices") || "[]");
    const localClients = JSON.parse(localStorage.getItem("invozap_clients") || "[]");

    const clientSet = new Map();
    localClients.forEach(c => {
      const name = c.clientName || c.name;
      if (name) clientSet.set(name.trim(), { clientName: name.trim(), gstin: c.gstin || "", email: c.email || "", phone: c.phone || "", address: c.address || "" });
    });
    localInvoices.forEach(inv => {
      const name = inv.clientName || inv.clientDetails?.clientName;
      if (name && !clientSet.has(name.trim())) {
        clientSet.set(name.trim(), {
          clientName: name.trim(),
          gstin: inv.clientDetails?.gstin || "",
          email: inv.clientDetails?.email || "",
          phone: inv.clientDetails?.phone || "",
          address: inv.clientDetails?.address || "",
        });
      }
    });

    // If signed in, also merge clients from server
    const authToken = localStorage.getItem("invozap_token");
    if (authToken) {
      try {
        const res = await fetch("/api/clients", {
          headers: { "Authorization": `Bearer ${authToken}` }
        });
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.clients)) {
          data.clients.forEach(c => {
            if (c.clientName) {
              clientSet.set(c.clientName.trim(), {
                id: c._id,
                clientName: c.clientName.trim(),
                gstin: c.gstin || "",
                email: c.email || "",
                phone: c.phone || "",
                address: c.address || "",
              });
            }
          });
        }
      } catch (err) {
        // Fallback to local
      }
    }

    const currentVal = selectedClientName || statementClientSelect.value;
    statementClientSelect.innerHTML = `<option value="">-- Choose a client --</option>`;
    const sortedClients = Array.from(clientSet.values()).sort((a, b) => a.clientName.localeCompare(b.clientName));
    sortedClients.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.clientName;
      opt.textContent = c.gstin ? `${c.clientName} (${c.gstin})` : c.clientName;
      if (c.id) opt.dataset.id = c.id;
      if (currentVal && currentVal.toLowerCase() === c.clientName.toLowerCase()) {
        opt.selected = true;
      }
      statementClientSelect.appendChild(opt);
    });

    if (currentVal && clientSet.has(currentVal.trim())) {
      fetchAndRenderStatement();
    }
  }

  // Quick preset filters
  if (btnFilterAllTime) {
    btnFilterAllTime.addEventListener("click", () => {
      if (statementFromDate) statementFromDate.value = "";
      if (statementToDate) statementToDate.value = "";
      fetchAndRenderStatement();
    });
  }

  if (btnFilterThisFY) {
    btnFilterThisFY.addEventListener("click", () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const fyStartYear = (now.getMonth() + 1 >= 4) ? currentYear : currentYear - 1;
      if (statementFromDate) statementFromDate.value = `${fyStartYear}-04-01`;
      if (statementToDate) statementToDate.value = `${fyStartYear + 1}-03-31`;
      fetchAndRenderStatement();
    });
  }

  if (btnFilter30Days) {
    btnFilter30Days.addEventListener("click", () => {
      const now = new Date();
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      if (statementFromDate) statementFromDate.value = past.toISOString().slice(0, 10);
      if (statementToDate) statementToDate.value = now.toISOString().slice(0, 10);
      fetchAndRenderStatement();
    });
  }

  if (btnApplyStatementFilter) {
    btnApplyStatementFilter.addEventListener("click", fetchAndRenderStatement);
  }

  if (statementClientSelect) {
    statementClientSelect.addEventListener("change", fetchAndRenderStatement);
  }

  // Fetch or Compute Statement
  async function fetchAndRenderStatement() {
    if (!statementClientSelect || !statementClientSelect.value) {
      if (statementEmptyState) statementEmptyState.style.display = "block";
      if (statementPaperContent) statementPaperContent.style.display = "none";
      if (exportStatementCsvBtn) exportStatementCsvBtn.style.display = "none";
      if (printStatementBtn) printStatementBtn.style.display = "none";
      return;
    }

    const clientName = statementClientSelect.value.trim();
    const from = statementFromDate ? statementFromDate.value : "";
    const to = statementToDate ? statementToDate.value : "";

    const selectedOption = statementClientSelect.selectedOptions[0];
    const clientId = selectedOption ? selectedOption.dataset.id : null;

    let statement = null;
    const authToken = localStorage.getItem("invozap_token");

    if (authToken) {
      try {
        const queryParams = new URLSearchParams();
        if (from) queryParams.set("from", from);
        if (to) queryParams.set("to", to);

        const url = clientId
          ? `/api/clients/${clientId}/statement?${queryParams.toString()}`
          : `/api/clients/statement?clientName=${encodeURIComponent(clientName)}&${queryParams.toString()}`;

        const res = await fetch(url, {
          headers: { "Authorization": `Bearer ${authToken}` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          statement = data;
        }
      } catch (e) {
        // Fall back to client-side ledger computation
      }
    }

    // Client-side computation fallback (for offline or local users)
    if (!statement) {
      statement = computeStatementLocally(clientName, from, to);
    }

    currentStatementData = statement;
    renderStatementPaper(statement);
  }

  function computeStatementLocally(clientName, fromStr, toStr) {
    const invoices = JSON.parse(localStorage.getItem("invozap_invoices") || "[]");
    const targetName = clientName.toLowerCase();
    const matching = invoices.filter(inv => {
      const name = (inv.clientName || inv.clientDetails?.clientName || "").toLowerCase().trim();
      const status = (inv.status || "").toLowerCase();
      return name === targetName && status !== "void" && status !== "draft";
    });

    const clientInfo = matching[0]?.clientDetails || { clientName };
    const events = [];

    matching.forEach(inv => {
      const grandTotalPaise = inv.grandTotalPaise ?? Math.round((parseFloat(String(inv.total || inv.grandTotal || 0).replace(/[^0-9.]/g, "")) || 0) * 100);
      events.push({
        date: inv.invoiceDate || inv.createdAt,
        type: "Invoice",
        reference: inv.invoiceNumber,
        description: "Invoice issued",
        debitPaise: grandTotalPaise,
        creditPaise: 0,
      });

      (inv.payments || []).filter(p => !p.voidedAt).forEach(p => {
        const amtPaise = p.amountPaise ?? Math.round((parseFloat(p.amount) || 0) * 100);
        events.push({
          date: p.receivedOn || p.recordedAt,
          type: p.kind === "tds_credit" ? "TDS Credit" : "Payment",
          reference: inv.invoiceNumber,
          description: p.reference ? `Ref: ${p.reference}` : (p.method ? `Payment via ${p.method.toUpperCase()}` : "Payment received"),
          debitPaise: 0,
          creditPaise: amtPaise,
        });
      });

      (inv.notes || []).forEach(n => {
        const amtPaise = n.amountPaise ?? Math.round((parseFloat(n.amount) || 0) * 100);
        events.push({
          date: n.issuedAt || n.createdAt,
          type: n.type === "credit" ? "Credit Note" : "Debit Note",
          reference: n.noteNumber,
          description: `${inv.invoiceNumber}: ${n.reason || "Adjustment note"}`,
          debitPaise: n.type === "debit" ? amtPaise : 0,
          creditPaise: n.type === "credit" ? amtPaise : 0,
        });
      });
    });

    events.sort((a, b) => {
      const diff = new Date(a.date) - new Date(b.date);
      if (diff !== 0) return diff;
      const order = { Invoice: 1, "Debit Note": 2, "Credit Note": 3, Payment: 4, "TDS Credit": 5 };
      return (order[a.type] || 99) - (order[b.type] || 99);
    });

    const fromDate = fromStr ? new Date(`${fromStr}T00:00:00.000Z`) : null;
    const toDate = toStr ? new Date(`${toStr}T23:59:59.999Z`) : null;

    let openingBalancePaise = 0;
    const entries = [];
    let periodDebitPaise = 0;
    let periodCreditPaise = 0;

    events.forEach(ev => {
      const evDate = new Date(ev.date);
      const change = ev.debitPaise - ev.creditPaise;
      if (fromDate && evDate < fromDate) {
        openingBalancePaise += change;
        return;
      }
      if (toDate && evDate > toDate) return;

      periodDebitPaise += ev.debitPaise;
      periodCreditPaise += ev.creditPaise;

      entries.push({
        ...ev,
        date: evDate.toISOString().slice(0, 10),
        debit: ev.debitPaise / 100,
        credit: ev.creditPaise / 100,
      });
    });

    let runningBalancePaise = openingBalancePaise;
    entries.forEach(entry => {
      runningBalancePaise += entry.debitPaise - entry.creditPaise;
      entry.balancePaise = runningBalancePaise;
      entry.balance = runningBalancePaise / 100;
    });

    return {
      success: true,
      client: {
        clientName: clientInfo.clientName || clientName,
        email: clientInfo.email || "",
        phone: clientInfo.phone || "",
        gstin: clientInfo.gstin || "",
        address: clientInfo.address || "",
      },
      from: fromStr || null,
      to: toStr || null,
      openingBalancePaise,
      openingBalance: openingBalancePaise / 100,
      closingBalancePaise: runningBalancePaise,
      closingBalance: runningBalancePaise / 100,
      totalDebitPaise: periodDebitPaise,
      totalDebit: periodDebitPaise / 100,
      totalCreditPaise: periodCreditPaise,
      totalCredit: periodCreditPaise / 100,
      entries,
    };
  }

  function fmtCurrency(num) {
    const val = Number(num || 0);
    return "₹" + val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function renderStatementPaper(statement) {
    if (!statement || !statementPaperContent) return;

    if (statementEmptyState) statementEmptyState.style.display = "none";
    statementPaperContent.style.display = "block";
    if (exportStatementCsvBtn) exportStatementCsvBtn.style.display = "inline-block";
    if (printStatementBtn) printStatementBtn.style.display = "inline-block";

    const client = statement.client || {};
    const fromLabel = statement.from ? formatDate(statement.from) : "Inception";
    const toLabel = statement.to ? formatDate(statement.to) : "Present";
    const periodStr = `${fromLabel} to ${toLabel}`;
    const generatedOn = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    // Business details
    const businessProfile = JSON.parse(localStorage.getItem("invozap_business_profile") || "{}");
    const sellerName = businessProfile.businessName || "InvoZap Merchant Studio";
    const sellerGstin = businessProfile.gstin || "";
    const sellerState = businessProfile.stateCode || "";

    const typeBadges = {
      "Invoice": `<span class="history-pill" style="background:#e0f2fe; color:#0369a1; font-weight:600;">Invoice</span>`,
      "Payment": `<span class="history-pill paid" style="font-weight:600;">Payment</span>`,
      "TDS Credit": `<span class="history-pill" style="background:#f3e8ff; color:#7e22ce; font-weight:600;">TDS Credit</span>`,
      "Credit Note": `<span class="history-pill" style="background:#fef3c7; color:#b45309; font-weight:600;">Credit Note</span>`,
      "Debit Note": `<span class="history-pill" style="background:#ede9fe; color:#6d28d9; font-weight:600;">Debit Note</span>`,
    };

    let rowsHtml = "";
    if (!statement.entries || statement.entries.length === 0) {
      rowsHtml = `
        <tr>
          <td colspan="7" style="text-align: center; color: #94a3b8; padding: 24px;">No ledger transactions recorded in this period.</td>
        </tr>
      `;
    } else {
      statement.entries.forEach(e => {
        const badge = typeBadges[e.type] || `<span class="history-pill">${esc(e.type)}</span>`;
        const debitText = e.debit > 0 ? fmtCurrency(e.debit) : "-";
        const creditText = e.credit > 0 ? fmtCurrency(e.credit) : "-";
        rowsHtml += `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px; font-size: 13px; color: #334155;">${esc(formatDate(e.date))}</td>
            <td style="padding: 10px;">${badge}</td>
            <td style="padding: 10px; font-size: 13px; font-weight: 600; color: #0f172a;">${esc(e.reference || "--")}</td>
            <td style="padding: 10px; font-size: 13px; color: #475569;">${esc(e.description || "")}</td>
            <td style="padding: 10px; text-align: right; font-size: 13px; color: #0284c7; font-weight: 600;">${debitText}</td>
            <td style="padding: 10px; text-align: right; font-size: 13px; color: #16a34a; font-weight: 600;">${creditText}</td>
            <td style="padding: 10px; text-align: right; font-size: 13px; font-weight: 700; color: #0f172a;">${fmtCurrency(e.balance)}</td>
          </tr>
        `;
      });
    }

    const words = window.rupeesToWords ? window.rupeesToWords(statement.closingBalance) : "";

    statementPaperContent.innerHTML = `
      <div class="sheet-paper theme-navy" style="margin: 0 auto; max-width: 900px; padding: 36px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
        <!-- TOP LETTERHEAD -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px;">
          <div>
            <h1 style="margin: 0; font-size: 24px; color: #0f172a; letter-spacing: -0.5px;">STATEMENT OF ACCOUNT</h1>
            <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Period: <b>${esc(periodStr)}</b></div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">Generated on: ${esc(generatedOn)}</div>
          </div>
          <div style="text-align: right;">
            <h3 style="margin: 0; color: #0f172a; font-size: 16px;">${esc(sellerName)}</h3>
            ${sellerGstin ? `<div style="font-size: 12px; color: #475569; margin-top: 2px;">GSTIN: <b>${esc(sellerGstin)}</b></div>` : ''}
            ${sellerState ? `<div style="font-size: 12px; color: #475569;">State Code: <b>${esc(sellerState)}</b></div>` : ''}
          </div>
        </div>

        <!-- CLIENT ACCOUNT DETAILS -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 18px; margin-bottom: 24px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div>
            <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px;">Account Statement For:</span>
            <h2 style="margin: 2px 0 4px; font-size: 18px; color: #0f172a;">${esc(client.clientName || "")}</h2>
            ${client.address ? `<div style="font-size: 13px; color: #475569;">${esc(client.address)}</div>` : ''}
          </div>
          <div style="text-align: right; font-size: 13px; color: #334155; line-height: 1.6;">
            ${client.gstin ? `<div><b>GSTIN:</b> ${esc(client.gstin)}</div>` : ''}
            ${client.phone ? `<div><b>Phone:</b> ${esc(client.phone)}</div>` : ''}
            ${client.email ? `<div><b>Email:</b> ${esc(client.email)}</div>` : ''}
          </div>
        </div>

        <!-- 4 SUMMARY METRIC CARDS -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px;">
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 14px;">
            <small style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 600;">Opening Balance</small>
            <div style="font-size: 17px; font-weight: 700; color: #0f172a; margin-top: 4px;">${fmtCurrency(statement.openingBalance)}</div>
          </div>
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 14px;">
            <small style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 600;">Invoiced (Debits)</small>
            <div style="font-size: 17px; font-weight: 700; color: #0284c7; margin-top: 4px;">${fmtCurrency(statement.totalDebit)}</div>
          </div>
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 14px;">
            <small style="color: #64748b; font-size: 11px; text-transform: uppercase; font-weight: 600;">Payments / Credits</small>
            <div style="font-size: 17px; font-weight: 700; color: #16a34a; margin-top: 4px;">${fmtCurrency(statement.totalCredit)}</div>
          </div>
          <div style="background: ${statement.closingBalance > 0 ? '#fef2f2' : '#f0fdf4'}; border: 1px solid ${statement.closingBalance > 0 ? '#fecaca' : '#bbf7d0'}; border-radius: 6px; padding: 12px 14px;">
            <small style="color: ${statement.closingBalance > 0 ? '#991b1b' : '#166534'}; font-size: 11px; text-transform: uppercase; font-weight: 600;">Closing Balance Due</small>
            <div style="font-size: 18px; font-weight: 800; color: ${statement.closingBalance > 0 ? '#dc2626' : '#16a34a'}; margin-top: 4px;">${fmtCurrency(statement.closingBalance)}</div>
          </div>
        </div>

        <!-- LEDGER TRANSACTIONS TABLE -->
        <table class="preview-table" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #0f172a; color: #ffffff;">
              <th style="padding: 10px; text-align: left; font-size: 12px;">Date</th>
              <th style="padding: 10px; text-align: left; font-size: 12px;">Type</th>
              <th style="padding: 10px; text-align: left; font-size: 12px;">Reference</th>
              <th style="padding: 10px; text-align: left; font-size: 12px;">Description</th>
              <th style="padding: 10px; text-align: right; font-size: 12px;">Debit (₹)</th>
              <th style="padding: 10px; text-align: right; font-size: 12px;">Credit (₹)</th>
              <th style="padding: 10px; text-align: right; font-size: 12px;">Balance (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background: #f8fafc; font-weight: 600; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; font-size: 13px; color: #64748b;">${statement.from ? esc(formatDate(statement.from)) : "--"}</td>
              <td style="padding: 10px;"><span class="history-pill" style="background: #e2e8f0; color: #334155;">Opening</span></td>
              <td style="padding: 10px; color: #94a3b8;">--</td>
              <td style="padding: 10px; color: #475569;">Opening Balance Brought Forward</td>
              <td style="padding: 10px; text-align: right; color: #94a3b8;">-</td>
              <td style="padding: 10px; text-align: right; color: #94a3b8;">-</td>
              <td style="padding: 10px; text-align: right; font-weight: 700; color: #0f172a;">${fmtCurrency(statement.openingBalance)}</td>
            </tr>
            ${rowsHtml}
            <tr style="background: #f1f5f9; font-weight: 700; border-top: 2px solid #0f172a;">
              <td colspan="4" style="padding: 12px 10px; text-align: right; font-size: 13px;">Closing Balance Due:</td>
              <td style="padding: 12px 10px; text-align: right; color: #0284c7; font-size: 13px;">${fmtCurrency(statement.totalDebit)}</td>
              <td style="padding: 12px 10px; text-align: right; color: #16a34a; font-size: 13px;">${fmtCurrency(statement.totalCredit)}</td>
              <td style="padding: 12px 10px; text-align: right; color: ${statement.closingBalance > 0 ? '#dc2626' : '#16a34a'}; font-size: 15px;">${fmtCurrency(statement.closingBalance)}</td>
            </tr>
          </tbody>
        </table>

        <!-- AMOUNT IN WORDS -->
        <div style="font-size: 12px; color: #475569; font-style: italic; text-align: right; border-top: 1px dashed #cbd5e1; padding-top: 10px;">
          Closing Balance in Words: <b>${esc(words)}</b>
        </div>
      </div>
    `;
  }

  // Export Statement CSV
  if (exportStatementCsvBtn) {
    exportStatementCsvBtn.addEventListener("click", () => {
      if (!currentStatementData) return alert("Generate a statement first.");
      const s = currentStatementData;
      const client = s.client || {};
      const safeName = (client.clientName || "Client").replace(/[^a-zA-Z0-9_-]/g, "_");
      const fromStr = s.from || "all";
      const toStr = s.to || "all";

      const rows = [
        ["STATEMENT OF ACCOUNT"],
        ["Client Name", client.clientName || ""],
        ["Client GSTIN", client.gstin || ""],
        ["Client Address", client.address || ""],
        ["Statement Period", `${fromStr} to ${toStr}`],
        ["Generated Date", new Date().toISOString().slice(0, 10)],
        [],
        ["Summary"],
        ["Opening Balance", s.openingBalance.toFixed(2)],
        ["Total Debits (Invoiced)", s.totalDebit.toFixed(2)],
        ["Total Credits (Received/Adjusted)", s.totalCredit.toFixed(2)],
        ["Closing Balance Due", s.closingBalance.toFixed(2)],
        [],
        ["Date", "Type", "Reference", "Description", "Debit (INR)", "Credit (INR)", "Running Balance (INR)"],
        [s.from || "", "Opening Balance", "--", "Opening Balance Brought Forward", "0.00", "0.00", s.openingBalance.toFixed(2)]
      ];

      (s.entries || []).forEach(e => {
        rows.push([
          e.date,
          e.type,
          e.reference || "",
          e.description || "",
          Number(e.debit || 0).toFixed(2),
          Number(e.credit || 0).toFixed(2),
          Number(e.balance || 0).toFixed(2)
        ]);
      });

      rows.push([
        s.to || "",
        "Closing Balance",
        "--",
        "Closing Balance Due",
        s.totalDebit.toFixed(2),
        s.totalCredit.toFixed(2),
        s.closingBalance.toFixed(2)
      ]);

      downloadCsv(`statement-${safeName}-${exportDateStamp()}.csv`, rows);
    });
  }

  // Print Statement
  if (printStatementBtn) {
    printStatementBtn.addEventListener("click", () => {
      if (!currentStatementData) return alert("Generate a statement first.");
      window.print();
    });
  }

  // --- 10. Initial Load ---
  loadInvoices();
  loadQuotations();
  loadStatementClients();
});
