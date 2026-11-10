/* ========================================================
   InvoZap - Quotation Maker JavaScript (quotation.js)
   Handles quotation generation, deterministic calculations,
   live paper preview, and quotation persistence in localStorage.
   ======================================================== */

document.addEventListener("DOMContentLoaded", function () {
  let currentThemeColor = "navy";

  // --- 1. DOM Elements ---
  const quoteNumberInput = document.getElementById("quoteNumber");
  const quoteDateInput = document.getElementById("quoteDate");
  const validUntilDateInput = document.getElementById("validUntilDate");
  const quoteCurrencySelect = document.getElementById("quoteCurrency");
  const quoteStatusSelect = document.getElementById("quoteStatus");

  const clientNameInput = document.getElementById("clientName");
  const clientAddressInput = document.getElementById("clientAddress");
  const clientEmailInput = document.getElementById("clientEmail");
  const clientPhoneInput = document.getElementById("clientPhone");
  const clientGstInput = document.getElementById("clientGst");
  const quoteTermsInput = document.getElementById("quoteTerms");

  // State & UPI Elements (Spec F5 & F11)
  const sellerStateCodeSelect = document.getElementById("sellerStateCode");
  const buyerStateCodeSelect = document.getElementById("buyerStateCode");
  const upiVpaInput = document.getElementById("upiVpa");
  const upiPayeeNameInput = document.getElementById("upiPayeeName");

  // Sheet Preview Elements
  const headerQuoteBadge = document.getElementById("headerQuoteBadge");
  const prevQuoteNumber = document.getElementById("prevQuoteNumber");
  const prevQuoteDate = document.getElementById("prevQuoteDate");
  const prevValidUntil = document.getElementById("prevValidUntil");
  const prevStatus = document.getElementById("prevStatus");
  const prevClientName = document.getElementById("prevClientName");
  const prevClientAddress = document.getElementById("prevClientAddress");
  const prevClientContact = document.getElementById("prevClientContact");
  const prevQuoteTerms = document.getElementById("prevQuoteTerms");

  const itemsTableBody = document.getElementById("itemsTableBody");
  const prevTableBody = document.getElementById("prevTableBody");
  const prevSubtotal = document.getElementById("prevSubtotal");
  const taxBreakdownArea = document.getElementById("taxBreakdownArea");
  const prevTotal = document.getElementById("prevTotal");
  const prevUpiContainer = document.getElementById("prevUpiContainer");

  const addItemBtn = document.getElementById("addItemBtn");
  const quotePaper = document.getElementById("quotePaper");
  const saveQuoteBtn = document.getElementById("saveQuoteBtn");
  const downloadPdfBtn = document.getElementById("downloadPdfBtn");

  // --- 2. Initialize Auth State on Navbar ---
  const authNavWrap = document.getElementById("authNavWrap");
  const token = localStorage.getItem("invozap_token");
  const user = JSON.parse(localStorage.getItem("invozap_user") || "null");

  if (authNavWrap) {
    if (token && user) {
      authNavWrap.innerHTML = `
        <span style="color: #94a3b8; font-size: 13px; margin-right: 8px;">👤 ${user.name}</span>
        <button type="button" id="logoutBtn" style="background: none; border: 1px solid #475569; color: #f87171; padding: 3px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">Sign Out</button>
      `;
      document.getElementById("logoutBtn").addEventListener("click", () => {
        localStorage.removeItem("invozap_token");
        localStorage.removeItem("invozap_user");
        window.location.reload();
      });
    } else {
      authNavWrap.innerHTML = `<a href="auth.html" style="color: #38bdf8; text-decoration: none; font-size: 13px; font-weight: 600;">Sign In</a>`;
    }
  }

  // --- 3. Auto-calculate Next Quotation Number ---
  function getNextQuotationNumber() {
    const quotes = JSON.parse(localStorage.getItem("invozap_quotations") || "[]");
    let maxNum = 0;
    quotes.forEach(function (q) {
      const match = (q.quotationNumber || "").match(/QT-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextNum = maxNum + 1;
    return "QT-" + String(nextNum).padStart(4, "0");
  }

  if (quoteNumberInput) {
    quoteNumberInput.value = getNextQuotationNumber();
  }

  // Set default dates
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  if (quoteDateInput) quoteDateInput.value = todayStr;

  const defaultValid = new Date();
  defaultValid.setDate(defaultValid.getDate() + 15);
  if (validUntilDateInput) validUntilDateInput.value = defaultValid.toISOString().split("T")[0];

  function formatDate(dateStr) {
    if (!dateStr) return "--";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  // Populate State Select Dropdowns (Spec F5)
  if (window.InvoZapCalc && sellerStateCodeSelect && buyerStateCodeSelect) {
    const states = window.InvoZapCalc.INDIAN_GST_STATES;
    states.forEach(s => {
      const optSeller = document.createElement("option");
      optSeller.value = s.code;
      optSeller.textContent = `${s.code} - ${s.name}`;
      if (s.code === "27") optSeller.selected = true; // Default Maharashtra
      sellerStateCodeSelect.appendChild(optSeller);

      const optBuyer = document.createElement("option");
      optBuyer.value = s.code;
      optBuyer.textContent = `${s.code} - ${s.name}`;
      if (s.code === "27") optBuyer.selected = true; // Default Maharashtra
      buyerStateCodeSelect.appendChild(optBuyer);
    });

    // Auto-detect buyer state code when typing GSTIN
    if (clientGstInput) {
      clientGstInput.addEventListener("input", function () {
        const detectedCode = window.InvoZapCalc.extractStateCodeFromGstin(this.value);
        if (detectedCode && buyerStateCodeSelect) {
          buyerStateCodeSelect.value = detectedCode;
          updatePreview();
        }
      });
    }
  }

  // --- 4. Live Update Quotation Preview ---
  function updatePreview() {
    const symbol = quoteCurrencySelect.value || "₹";

    // Meta details
    const quoteNum = quoteNumberInput.value || "QT-0001";
    if (headerQuoteBadge) headerQuoteBadge.textContent = quoteNum;
    if (prevQuoteNumber) prevQuoteNumber.textContent = quoteNum;

    if (prevQuoteDate) prevQuoteDate.textContent = formatDate(quoteDateInput.value);
    if (prevValidUntil) prevValidUntil.textContent = formatDate(validUntilDateInput.value);

    // Status pill
    const status = quoteStatusSelect.value || "Draft";
    if (prevStatus) {
      prevStatus.textContent = status.toUpperCase();
      prevStatus.className = `status-pill status-${status.toLowerCase()}`;
    }

    // Client details
    if (prevClientName) prevClientName.textContent = clientNameInput.value || "Client Name";
    if (prevClientAddress) prevClientAddress.textContent = clientAddressInput.value || "";

    const email = clientEmailInput.value;
    const phone = clientPhoneInput.value;
    let contactInfo = "";
    if (email && phone) contactInfo = `${email} • ${phone}`;
    else contactInfo = email || phone || "";
    if (prevClientContact) prevClientContact.textContent = contactInfo;

    // Terms & Conditions live sync
    if (prevQuoteTerms && quoteTermsInput) {
      prevQuoteTerms.textContent = quoteTermsInput.value || "";
    }

    renderItemsPreview(symbol);
    runPreSendChecker();
  }

  // --- 5. Line Items Extraction & Deterministic Calculations ---
  function getItemsData() {
    const items = [];
    const rows = itemsTableBody.querySelectorAll("tr");
    rows.forEach(function (row) {
      const descInput = row.querySelector(".item-desc");
      const qtyInput = row.querySelector(".item-qty");
      const priceInput = row.querySelector(".item-price");

      const desc = descInput ? descInput.value.trim() : "";
      const qty = parseFloat(qtyInput ? qtyInput.value : 1) || 1;
      const price = parseFloat(priceInput ? priceInput.value : 0) || 0;
      const rowTotal = Math.round(qty * price * 100) / 100;

      if (desc || price > 0) {
        items.push({ description: desc || "Service / Item", quantity: qty, price: price, rowTotal: rowTotal });
      }
    });
    return items;
  }

  function renderItemsPreview(currencySymbol) {
    if (!prevTableBody) return;
    prevTableBody.innerHTML = "";

    const items = getItemsData();
    const sellerCode = sellerStateCodeSelect ? sellerStateCodeSelect.value : "27";
    const buyerCode = buyerStateCodeSelect ? buyerStateCodeSelect.value : "27";

    let calcResult = null;
    if (window.InvoZapCalc) {
      calcResult = window.InvoZapCalc.calculateFinancials({
        items: items,
        taxMode: "gst",
        taxRatePercent: 18,
        sellerStateCode: sellerCode,
        buyerStateCode: buyerCode,
        currencySymbol: currencySymbol
      });
    }

    if (calcResult) {
      calcResult.items.forEach(function (item) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${item.no}</td>
          <td>${item.description}</td>
          <td>${item.quantity}</td>
          <td>${item.unitPriceFormatted}</td>
          <td><b>${item.taxableFormatted}</b></td>
        `;
        prevTableBody.appendChild(tr);
      });

      if (prevSubtotal) prevSubtotal.textContent = calcResult.totals.subtotalFormatted;
      if (prevTotal) prevTotal.textContent = calcResult.totals.grandTotalFormatted;

      // Render Tax Breakdown (Intra: CGST+SGST vs Inter: IGST)
      if (taxBreakdownArea) {
        taxBreakdownArea.innerHTML = "";
        if (calcResult.regime === "intra") {
          taxBreakdownArea.innerHTML = `
            <div style="display: flex; justify-content: space-between; color: #475569;">
              <span>CGST (9%):</span>
              <b>${calcResult.totals.cgstFormatted}</b>
            </div>
            <div style="display: flex; justify-content: space-between; color: #475569;">
              <span>SGST (9%):</span>
              <b>${calcResult.totals.sgstFormatted}</b>
            </div>
          `;
        } else if (calcResult.regime === "inter") {
          taxBreakdownArea.innerHTML = `
            <div style="display: flex; justify-content: space-between; color: #475569;">
              <span>IGST (18%):</span>
              <b>${calcResult.totals.igstFormatted}</b>
            </div>
          `;
        }
      }

      // Render Dynamic UPI QR Payment Card (Only when valid VPA is set)
      if (window.InvoZapUpi && prevUpiContainer) {
        window.InvoZapUpi.renderUpiPaymentBlock(prevUpiContainer, {
          vpa: upiVpaInput ? upiVpaInput.value.trim() : "",
          payeeName: upiPayeeNameInput ? upiPayeeNameInput.value.trim() : "InvoZap Solutions",
          amount: calcResult.totals.grandTotalPaise / 100,
          invoiceNumber: quoteNumberInput ? quoteNumberInput.value : "QT-0001",
          currencySymbol: currencySymbol
        });
      }
    }
  }

  // --- 5.1 Run Pre-Send Quality Checker for Quotation (Spec F8) ---
  function runPreSendChecker() {
    if (!window.InvoZapChecker) return;

    const items = getItemsData();
    const docPayload = {
      sellerDetails: { businessName: "InvoZap Solutions" },
      clientDetails: {
        clientName: clientNameInput ? clientNameInput.value : "",
        gstin: clientGstInput ? clientGstInput.value : ""
      },
      quotationDate: quoteDateInput ? quoteDateInput.value : "",
      validUntil: validUntilDateInput ? validUntilDateInput.value : "",
      buyerStateCode: buyerStateCodeSelect ? buyerStateCodeSelect.value : "27",
      upiDetails: {
        vpa: upiVpaInput ? upiVpaInput.value : ""
      },
      items: items
    };

    const audit = window.InvoZapChecker.inspectDocument(docPayload);

    const checkerStatusIcon = document.getElementById("checkerStatusIcon");
    const checkerStatusTitle = document.getElementById("checkerStatusTitle");
    const checkerBadge = document.getElementById("checkerBadge");
    const checkerDetails = document.getElementById("checkerDetails");

    if (!checkerBadge || !checkerDetails) return;

    checkerDetails.innerHTML = "";

    if (audit.canSend && audit.warnings.length === 0) {
      if (checkerStatusIcon) checkerStatusIcon.textContent = "✅";
      if (checkerStatusTitle) checkerStatusTitle.textContent = "All Systems Go! Quotation is Ready to Issue";
      checkerBadge.textContent = "PASSED";
      checkerBadge.style.background = "#dcfce7";
      checkerBadge.style.color = "#166534";
    } else if (audit.blockers.length > 0) {
      if (checkerStatusIcon) checkerStatusIcon.textContent = "⚠️";
      if (checkerStatusTitle) checkerStatusTitle.textContent = `${audit.blockers.length} Critical Issue(s) to Fix`;
      checkerBadge.textContent = `${audit.blockers.length} BLOCKER(S)`;
      checkerBadge.style.background = "#fee2e2";
      checkerBadge.style.color = "#991b1b";
    } else {
      if (checkerStatusIcon) checkerStatusIcon.textContent = "💡";
      if (checkerStatusTitle) checkerStatusTitle.textContent = `${audit.warnings.length} Quality Suggestion(s)`;
      checkerBadge.textContent = `${audit.warnings.length} SUGGESTION(S)`;
      checkerBadge.style.background = "#fef3c7";
      checkerBadge.style.color = "#92400e";
    }

    // Render Blockers
    audit.blockers.forEach(b => {
      const div = document.createElement("div");
      div.className = "checker-finding blocker";
      div.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px;">
          <span>⛔</span>
          <span><b>[Blocker]</b> ${b.message}</span>
        </div>
      `;
      checkerDetails.appendChild(div);
    });

    // Render Warnings with 1-click fixes
    audit.warnings.forEach(w => {
      const div = document.createElement("div");
      div.className = "checker-finding warning";
      let fixBtnHtml = "";
      if (w.fix) {
        fixBtnHtml = `<button type="button" class="btn-checker-fix" data-fix-type="${w.fix.type}" data-fix-val="${w.fix.stateCode || w.fix.days || w.fix.vpa || ''}">⚡ ${w.fix.label}</button>`;
      }
      div.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px;">
          <span>⚠️</span>
          <span>${w.message}</span>
        </div>
        ${fixBtnHtml}
      `;
      checkerDetails.appendChild(div);
    });

    // Attach 1-click fix listeners
    checkerDetails.querySelectorAll(".btn-checker-fix").forEach(btn => {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        const fixType = this.getAttribute("data-fix-type");
        const fixVal = this.getAttribute("data-fix-val");
        applyCheckerFix(fixType, fixVal);
      });
    });
  }

  function applyCheckerFix(fixType, fixVal) {
    if (fixType === "SYNC_BUYER_STATE" && buyerStateCodeSelect) {
      buyerStateCodeSelect.value = fixVal;
      updatePreview();
    } else if (fixType === "SET_DUE_DAYS" && validUntilDateInput) {
      const d = new Date();
      d.setDate(d.getDate() + parseInt(fixVal || "15", 10));
      validUntilDateInput.value = d.toISOString().split("T")[0];
      updatePreview();
    } else if (fixType === "USE_SAVED_UPI" && upiVpaInput) {
      upiVpaInput.value = fixVal;
      updatePreview();
    } else if (fixType === "FOCUS_UPI_INPUT" && upiVpaInput) {
      upiVpaInput.focus();
      upiVpaInput.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  // --- 6. Quick Validity Date Chips ---
  const dateChips = document.querySelectorAll(".date-chips button");
  dateChips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      const days = parseInt(this.getAttribute("data-days"), 10);
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      validUntilDateInput.value = targetDate.toISOString().split("T")[0];
      updatePreview();
    });
  });

  // --- 7. Theme Accent Color Change ---
  const themeRadios = document.querySelectorAll('input[name="themeColor"]');
  themeRadios.forEach(function (radio) {
    radio.addEventListener("change", function () {
      quotePaper.classList.remove("theme-navy", "theme-indigo", "theme-burgundy");
      currentThemeColor = this.value;
      if (this.value === "navy") quotePaper.classList.add("theme-navy");
      if (this.value === "indigo") quotePaper.classList.add("theme-indigo");
      if (this.value === "burgundy") quotePaper.classList.add("theme-burgundy");
    });
  });

  // --- 8. Add & Remove Quotation Items ---
  if (addItemBtn) {
    addItemBtn.addEventListener("click", function () {
      const newRow = document.createElement("tr");
      newRow.innerHTML = `
        <td><input type="text" class="item-desc" placeholder="Scope description or product"></td>
        <td><input type="number" class="item-qty" value="1" min="1"></td>
        <td><input type="number" class="item-price" value="0" min="0"></td>
        <td><button type="button" class="btn-remove-row">✕</button></td>
      `;
      itemsTableBody.appendChild(newRow);
      attachRowListeners(newRow);
      updatePreview();
    });
  }

  function attachRowListeners(row) {
    const inputs = row.querySelectorAll("input");
    inputs.forEach(function (input) {
      input.addEventListener("input", updatePreview);
    });

    const removeBtn = row.querySelector(".btn-remove-row");
    if (removeBtn) {
      removeBtn.addEventListener("click", function () {
        if (itemsTableBody.querySelectorAll("tr").length > 1) {
          row.remove();
          updatePreview();
        } else {
          alert("At least one quotation item row is required.");
        }
      });
    }
  }

  if (itemsTableBody) {
    itemsTableBody.querySelectorAll("tr").forEach(attachRowListeners);
  }

  // --- 9. Attach Input Listeners ---
  const allInputs = [
    quoteNumberInput, quoteDateInput, validUntilDateInput, quoteCurrencySelect, quoteStatusSelect,
    clientNameInput, clientAddressInput, clientEmailInput, clientPhoneInput, clientGstInput, quoteTermsInput,
    sellerStateCodeSelect, buyerStateCodeSelect, upiVpaInput, upiPayeeNameInput
  ];

  allInputs.forEach(function (elem) {
    if (elem) {
      elem.addEventListener("input", updatePreview);
      elem.addEventListener("change", updatePreview);
    }
  });

  // --- 10. Print / Save to PDF ---
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener("click", function () {
      window.print();
    });
  }

  // --- 11. View Switcher (Responsive Mobile Form vs Sheet) ---
  const btnViewForm = document.getElementById("btnViewForm");
  const btnViewSheet = document.getElementById("btnViewSheet");
  const previewColumn = document.querySelector(".preview-column");
  const quoteForm = document.getElementById("quotationForm");

  if (btnViewForm && btnViewSheet) {
    btnViewForm.addEventListener("click", function () {
      btnViewForm.classList.add("active");
      btnViewSheet.classList.remove("active");
      if (quoteForm) quoteForm.style.display = "grid";
      if (previewColumn) previewColumn.style.display = "";
    });

    btnViewSheet.addEventListener("click", function () {
      btnViewSheet.classList.add("active");
      btnViewForm.classList.remove("active");
      if (quoteForm && window.innerWidth <= 860) quoteForm.style.display = "none";
      if (previewColumn && window.innerWidth <= 860) previewColumn.style.display = "block";
    });
  }

  // --- 12. Save Quotation to LocalStorage ---
  if (saveQuoteBtn) {
    saveQuoteBtn.addEventListener("click", function () {
      const items = getItemsData();
      if (items.length === 0) {
        alert("Please enter at least one valid item with a description or price.");
        return;
      }

      const quoteNum = quoteNumberInput.value.trim() || "QT-0001";
      const quotationPayload = {
        quotationNumber: quoteNum,
        quotationDate: quoteDateInput.value,
        validUntil: validUntilDateInput.value,
        currency: quoteCurrencySelect.value || "₹",
        status: quoteStatusSelect.value || "Draft",
        themeColor: currentThemeColor,
        sellerDetails: {
          businessName: "InvoZap Solutions",
          tagline: "Sourcing Quality, Delivering Reliability",
          address: "Shivaji Nagar, Pune, Maharashtra 411005",
          email: "support@invozap.com",
          phone: "+91 91234 56789",
        },
        clientName: clientNameInput.value.trim(),
        clientDetails: {
          clientName: clientNameInput.value.trim(),
          address: clientAddressInput.value.trim(),
          email: clientEmailInput.value.trim(),
          phone: clientPhoneInput.value.trim(),
          gstin: clientGstInput ? clientGstInput.value.trim() : "",
        },
        items: items,
        taxRate: 18,
        sellerStateCode: sellerStateCodeSelect ? sellerStateCodeSelect.value : "27",
        buyerStateCode: buyerStateCodeSelect ? buyerStateCodeSelect.value : "27",
        upiDetails: {
          vpa: upiVpaInput ? upiVpaInput.value.trim() : "",
          payeeName: upiPayeeNameInput ? upiPayeeNameInput.value.trim() : ""
        },
        subtotal: prevSubtotal.textContent,
        taxAmount: prevGst ? prevGst.textContent : "₹0.00",
        total: prevTotal.textContent,
        terms: quoteTermsInput ? quoteTermsInput.value : "",
        savedAt: new Date().toISOString()
      };

      // Read existing quotations
      const localQuotes = JSON.parse(localStorage.getItem("invozap_quotations") || "[]");
      
      // If quotation with same number exists, update it; otherwise append
      const existingIdx = localQuotes.findIndex(q => q.quotationNumber === quoteNum);
      if (existingIdx !== -1) {
        localQuotes[existingIdx] = quotationPayload;
      } else {
        localQuotes.push(quotationPayload);
      }

      localStorage.setItem("invozap_quotations", JSON.stringify(localQuotes));

      // Commit persistent monotonic sequence high-water mark (Spec F4)
      if (window.InvoZapNumbering) {
        const parsed = window.InvoZapNumbering.parseDocumentNumber(quoteNum);
        if (parsed && parsed.seq) {
          window.InvoZapNumbering.commitAllocatedSequence("quotation", parsed.seq, parsed.prefix, quotationPayload.quotationDate);
        }
      }

      const wantViewHistory = confirm(
        `✅ Quotation ${quoteNum} saved successfully!\n\nWould you like to open Quotation History to view it or convert it to an invoice?`
      );

      if (wantViewHistory) {
        window.location.href = "recents.html?tab=quotations";
      }
    });
  }

  // --- 13. Client Directory Integration ---
  const saveClientProfileBtn = document.getElementById("saveClientProfileBtn");
  const returningClientSelect = document.getElementById("returningClientSelect");

  function loadClientProfiles() {
    if (!returningClientSelect) return;
    const profiles = JSON.parse(localStorage.getItem("invozap_clients") || "[]");
    returningClientSelect.innerHTML = `<option value="">-- Choose a returning client profile to auto-fill --</option>`;
    profiles.forEach(function (client, idx) {
      const opt = document.createElement("option");
      opt.value = idx;
      opt.textContent = `${client.name} (${client.phone || client.email || "Client"})`;
      returningClientSelect.appendChild(opt);
    });
  }

  if (saveClientProfileBtn) {
    saveClientProfileBtn.addEventListener("click", function () {
      const name = clientNameInput.value.trim();
      if (!name) {
        alert("Please enter a Client / Company Name first.");
        return;
      }

      const clientObj = {
        name: name,
        address: clientAddressInput.value,
        email: clientEmailInput.value,
        phone: clientPhoneInput.value,
        gst: clientGstInput ? clientGstInput.value : ""
      };

      const profiles = JSON.parse(localStorage.getItem("invozap_clients") || "[]");
      profiles.push(clientObj);
      localStorage.setItem("invozap_clients", JSON.stringify(profiles));

      alert(`Saved profile for "${name}" to directory!`);
      loadClientProfiles();
    });
  }

  if (returningClientSelect) {
    returningClientSelect.addEventListener("change", function () {
      const idx = this.value;
      if (idx === "") return;
      const profiles = JSON.parse(localStorage.getItem("invozap_clients") || "[]");
      const client = profiles[idx];
      if (client) {
        clientNameInput.value = client.name || "";
        clientAddressInput.value = client.address || "";
        clientEmailInput.value = client.email || "";
        clientPhoneInput.value = client.phone || "";
        if (clientGstInput) clientGstInput.value = client.gst || "";
        updatePreview();
      }
    });
  }

  // --- 14. Check URL for Edit Quotation Mode (?edit=QT-XXXX) ---
  function loadExistingQuotationForEditing() {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit") || params.get("id");
    if (!editId) return;

    const quotes = JSON.parse(localStorage.getItem("invozap_quotations") || "[]");
    const quote = quotes.find(q => q.quotationNumber === editId);
    if (!quote) return;

    // Change Header title
    const headerTitle = document.querySelector(".editor-header h1");
    if (headerTitle) {
      headerTitle.innerHTML = `Edit Quotation <span id="headerQuoteBadge" class="quotation-badge">${quote.quotationNumber}</span>`;
    }

    quoteNumberInput.value = quote.quotationNumber || "";
    if (quote.quotationDate && quoteDateInput) quoteDateInput.value = quote.quotationDate;
    if (quote.validUntil && validUntilDateInput) validUntilDateInput.value = quote.validUntil;
    if (quote.currency && quoteCurrencySelect) quoteCurrencySelect.value = quote.currency;
    if (quote.status && quoteStatusSelect) quoteStatusSelect.value = quote.status;
    if (quote.terms && quoteTermsInput) quoteTermsInput.value = quote.terms;

    const client = quote.clientDetails || { clientName: quote.clientName };
    if (clientNameInput) clientNameInput.value = client.clientName || quote.clientName || "";
    if (clientAddressInput) clientAddressInput.value = client.address || "";
    if (clientEmailInput) clientEmailInput.value = client.email || "";
    if (clientPhoneInput) clientPhoneInput.value = client.phone || "";
    if (clientGstInput) clientGstInput.value = client.gstin || "";

    // Restore States and UPI
    if (quote.sellerStateCode && sellerStateCodeSelect) sellerStateCodeSelect.value = quote.sellerStateCode;
    if (quote.buyerStateCode && buyerStateCodeSelect) buyerStateCodeSelect.value = quote.buyerStateCode;
    if (quote.upiDetails) {
      if (quote.upiDetails.vpa && upiVpaInput) upiVpaInput.value = quote.upiDetails.vpa;
      if (quote.upiDetails.payeeName && upiPayeeNameInput) upiPayeeNameInput.value = quote.upiDetails.payeeName;
    }

    // Set Theme
    if (quote.themeColor) {
      currentThemeColor = quote.themeColor;
      const themeRadio = document.querySelector(`input[name="themeColor"][value="${quote.themeColor}"]`);
      if (themeRadio) themeRadio.checked = true;
      if (quotePaper) {
        quotePaper.classList.remove("theme-navy", "theme-indigo", "theme-burgundy");
        quotePaper.classList.add(`theme-${quote.themeColor}`);
      }
    }

    // Populate items
    if (quote.items && quote.items.length > 0 && itemsTableBody) {
      itemsTableBody.innerHTML = "";
      quote.items.forEach(function (item) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><input type="text" class="item-desc" value="${item.description || ''}"></td>
          <td><input type="number" class="item-qty" value="${item.quantity || 1}" min="1"></td>
          <td><input type="number" class="item-price" value="${item.price || 0}" min="0"></td>
          <td><button type="button" class="btn-remove-row">✕</button></td>
        `;
        itemsTableBody.appendChild(tr);
        attachRowListeners(tr);
      });
    }
  }

  // --- 11. AI Brief-to-Quotation Handlers (Spec F7) ---
  const openAiDraftBtn = document.getElementById("openAiDraftBtn");
  const aiDraftModal = document.getElementById("aiDraftModal");
  const closeAiDraftModalBtn = document.getElementById("closeAiDraftModalBtn");
  const cancelAiDraftBtn = document.getElementById("cancelAiDraftBtn");
  const executeAiDraftBtn = document.getElementById("executeAiDraftBtn");
  const aiBriefInput = document.getElementById("aiBriefInput");
  const aiAssumptionsContainer = document.getElementById("aiAssumptionsContainer");
  const assumptionsList = document.getElementById("assumptionsList");
  const confirmAllAssumptionsBtn = document.getElementById("confirmAllAssumptionsBtn");

  const SAMPLE_BRIEFS = {
    freelance: "Hi Rahul, please quote Acme Tech Solutions in Bangalore for 3 landing pages at ₹4,000 each and SEO Setup for ₹15,000. Validity: 15 days.",
    agency: "Quotation for Nexus Media Agency in Mumbai: Complete Brand Guidelines & Logo Kit for ₹35,000, and Social Media Templates (10 designs) for ₹12,000.",
    retainer: "Quote for CloudScale Innovations Pune for Monthly Full-Stack Engineering Retainer for ₹75,000. Scope: API optimization, DevOps & frontend features."
  };

  if (openAiDraftBtn && aiDraftModal) {
    openAiDraftBtn.addEventListener("click", () => {
      aiDraftModal.style.display = "flex";
      if (aiBriefInput) aiBriefInput.focus();
    });

    [closeAiDraftModalBtn, cancelAiDraftBtn].forEach(btn => {
      if (btn) btn.addEventListener("click", () => { aiDraftModal.style.display = "none"; });
    });

    document.querySelectorAll(".btn-sample-brief").forEach(btn => {
      btn.addEventListener("click", function () {
        const type = this.getAttribute("data-sample");
        if (SAMPLE_BRIEFS[type] && aiBriefInput) {
          aiBriefInput.value = SAMPLE_BRIEFS[type];
        }
      });
    });

    if (executeAiDraftBtn && window.InvoZapAiDraft) {
      executeAiDraftBtn.addEventListener("click", () => {
        const brief = (aiBriefInput.value || "").trim();
        if (!brief) {
          alert("Please paste a client message or brief first.");
          return;
        }

        const draft = window.InvoZapAiDraft.parseBriefToDraft(brief, "quotation");
        if (draft) {
          // Populate client
          if (clientNameInput && draft.clientName) clientNameInput.value = draft.clientName;
          if (buyerStateCodeSelect && draft.buyerStateCode) buyerStateCodeSelect.value = draft.buyerStateCode;

          // Populate items
          if (draft.items && draft.items.length > 0 && itemsTableBody) {
            itemsTableBody.innerHTML = "";
            draft.items.forEach(it => {
              const tr = document.createElement("tr");
              tr.innerHTML = `
                <td><input type="text" class="item-desc" value="${it.description}"></td>
                <td><input type="number" class="item-qty" value="${it.quantity || 1}" min="1"></td>
                <td><input type="number" class="item-price" value="${it.price || 0}" min="0"></td>
                <td><button type="button" class="btn-remove-row">✕</button></td>
              `;
              itemsTableBody.appendChild(tr);
              attachRowListeners(tr);
            });
          }

          // Populate assumptions
          if (aiAssumptionsContainer && assumptionsList && draft.assumptions) {
            assumptionsList.innerHTML = "";
            draft.assumptions.forEach(asm => {
              const chip = document.createElement("div");
              chip.className = "assumption-chip-row";
              chip.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="assumption-risk ${asm.risk}">${asm.risk} RISK</span>
                  <span style="font-weight: 600; color: #1e293b;">${asm.field}: ${asm.value}</span>
                  <span style="color: #64748b; font-size: 11px;">(${asm.reason})</span>
                </div>
                <button type="button" style="background: none; border: none; color: #64748b; cursor: pointer; font-size: 13px;" title="Dismiss assumption">✕</button>
              `;
              chip.querySelector("button").addEventListener("click", () => chip.remove());
              assumptionsList.appendChild(chip);
            });
            aiAssumptionsContainer.style.display = "block";
          }

          aiDraftModal.style.display = "none";
          updatePreview();
        }
      });
    }

    if (confirmAllAssumptionsBtn && aiAssumptionsContainer) {
      confirmAllAssumptionsBtn.addEventListener("click", () => {
        aiAssumptionsContainer.style.display = "none";
      });
    }
  }

  // --- 12. Indian Financial Year Auto-Numbering for Quotations (Spec F4) ---
  const urlParams = new URLSearchParams(window.location.search);
  const editQuoteId = urlParams.get("edit");
  if (!editQuoteId && window.InvoZapNumbering && quoteNumberInput) {
    const existingQuotes = JSON.parse(localStorage.getItem("invozap_quotations") || "[]");
    const nextQuoteNo = window.InvoZapNumbering.getNextDocumentNumber("quotation", existingQuotes, "QT", quoteDateInput ? quoteDateInput.value : null);
    quoteNumberInput.value = nextQuoteNo;
    if (headerQuoteBadge) headerQuoteBadge.textContent = nextQuoteNo;
    if (prevQuoteNumber) prevQuoteNumber.textContent = nextQuoteNo;
  }

  // Initial runs
  loadClientProfiles();
  loadExistingQuotationForEditing();
  updatePreview();
});
