/* ========================================================
   InvoZap - Quotation Maker JavaScript (quotation.js)
   Handles quotation generation, deterministic calculations,
   live paper preview, and quotation persistence in localStorage.
   ======================================================== */

document.addEventListener("DOMContentLoaded", function () {
  let currentThemeColor = "navy";
  let currentQuotationId = null;

  // Global user & auth session state
  const token = localStorage.getItem("invozap_token");
  const user = JSON.parse(localStorage.getItem("invozap_user") || "null");

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

  // --- 2. Initialize Auth State on Navbar (Safe DOM Creation) ---
  if (typeof window.renderNavbarProfile === "function") {
    window.renderNavbarProfile();
  } else {
    const authNavWrap = document.getElementById("authNavWrap");

    if (authNavWrap && !authNavWrap.hasChildNodes()) {
      if (!token || !user) {
        const signInLink = document.createElement("a");
        signInLink.href = "auth.html";
        signInLink.style.cssText = "color: #38bdf8; text-decoration: none; font-size: 13px; font-weight: 600;";
        signInLink.textContent = "Sign In";
        authNavWrap.appendChild(signInLink);
      }
    }
  }

  // --- 3. If on Quotation Creator Page, Initialize Form & Preview ---
  if (!quoteNumberInput) {
    return; // Stop here on other pages
  }

  // Auto-calculate Next Quotation Number
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

  if (validUntilDateInput) validUntilDateInput.value = "";

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
  }

  // --- 4. Live Update Quotation Preview ---
  function updatePreview() {
    const symbol = (quoteCurrencySelect ? quoteCurrencySelect.value : "₹") || "₹";

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
        items.push({
          description: desc || "Service / Item", quantity: qty, price: price, rowTotal: rowTotal,
          hsnSac: row.dataset.hsnSac || "", unit: row.dataset.unit || "",
          taxRate: Number(row.dataset.taxRate || 18)
        });
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
        const createCell = (text, isBold = false) => {
          const c = document.createElement("td");
          if (isBold) {
            const b = document.createElement("b");
            b.textContent = text;
            c.appendChild(b);
          } else {
            c.textContent = text;
          }
          return c;
        };
        tr.append(
          createCell(String(item.no)),
          createCell(item.description || ""),
          createCell(String(item.quantity)),
          createCell(item.unitPriceFormatted),
          createCell(item.taxableFormatted, true)
        );
        prevTableBody.appendChild(tr);
      });

      if (prevSubtotal) prevSubtotal.textContent = calcResult.totals.subtotalFormatted;
      if (prevTotal) prevTotal.textContent = calcResult.totals.grandTotalFormatted;

      const prevWords = document.getElementById("prevWords");
      if (prevWords && window.paiseToWords) {
        prevWords.textContent = window.paiseToWords(calcResult.totals.grandTotalPaise);
      }

      // Render Tax Breakdown Safely (Intra: CGST+SGST vs Inter: IGST)
      if (taxBreakdownArea) {
        taxBreakdownArea.innerHTML = "";
        const createBreakdownRow = (label, val) => {
          const d = document.createElement("div");
          d.className = "totals-row";
          d.style.cssText = "display: flex; justify-content: space-between; align-items: center; width: 100%; color: #475569;";
          const s = document.createElement("span");
          s.className = "total-label";
          s.textContent = label;
          const b = document.createElement("b");
          b.className = "total-value";
          b.textContent = val;
          d.append(s, b);
          return d;
        };

        if (calcResult.regime === "intra") {
          taxBreakdownArea.append(
            createBreakdownRow("CGST (9%):", calcResult.totals.cgstFormatted),
            createBreakdownRow("SGST (9%):", calcResult.totals.sgstFormatted)
          );
        } else if (calcResult.regime === "inter") {
          taxBreakdownArea.appendChild(createBreakdownRow("IGST (18%):", calcResult.totals.igstFormatted));
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

  // Safe helper to construct a quotation item row using direct DOM property assignment
  function createItemRow(description = "", quantity = 1, price = 0, taxRate = 18, hsnSac = "", unit = "") {
    const tr = document.createElement("tr");
    tr.dataset.taxRate = String(taxRate);
    tr.dataset.hsnSac = hsnSac;
    tr.dataset.unit = unit;

    const tdDesc = document.createElement("td");
    const inputDesc = document.createElement("input");
    inputDesc.type = "text";
    inputDesc.className = "item-desc";
    inputDesc.placeholder = "Scope description or product";
    inputDesc.value = description;
    tdDesc.appendChild(inputDesc);
    if (hsnSac || Number(taxRate) !== 18) {
      const meta = document.createElement("small");
      meta.className = "item-tax-meta";
      meta.textContent = `GST ${Number(taxRate)}%${hsnSac ? ` · HSN/SAC ${hsnSac}` : ""}`;
      tdDesc.appendChild(meta);
    }

    const tdQty = document.createElement("td");
    const inputQty = document.createElement("input");
    inputQty.type = "number";
    inputQty.className = "item-qty";
    inputQty.min = "0.001";
    inputQty.step = "any";
    inputQty.value = quantity;
    tdQty.appendChild(inputQty);

    const tdPrice = document.createElement("td");
    const inputPrice = document.createElement("input");
    inputPrice.type = "number";
    inputPrice.className = "item-price";
    inputPrice.min = "0";
    inputPrice.step = "any";
    inputPrice.value = price;
    tdPrice.appendChild(inputPrice);

    const tdAction = document.createElement("td");
    const btnRemove = document.createElement("button");
    btnRemove.type = "button";
    btnRemove.className = "btn-remove-row";
    btnRemove.textContent = "✕";
    tdAction.appendChild(btnRemove);

    tr.append(tdDesc, tdQty, tdPrice, tdAction);
    attachRowListeners(tr);
    return tr;
  }

  // --- 8. Add & Remove Quotation Items ---
  if (addItemBtn) {
    addItemBtn.addEventListener("click", function () {
      const newRow = createItemRow("", 1, 0);
      itemsTableBody.appendChild(newRow);
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



  // --- 12. Save Quotation ---
  if (saveQuoteBtn) {
    saveQuoteBtn.addEventListener("click", async function () {
      const items = getItemsData();
      if (items.length === 0) {
        alert("Please enter at least one valid item with a description or price.");
        return;
      }

      const quoteNum = quoteNumberInput.value.trim() || "QT-0001";
      const resolvedVpa = (upiVpaInput ? upiVpaInput.value.trim() : "") || (user && user.businessProfile && user.businessProfile.upiId) || "";
      const resolvedPayee = (upiPayeeNameInput ? upiPayeeNameInput.value.trim() : "") || (user && user.businessProfile && user.businessProfile.businessName) || "Merchant";

      const quotationPayload = {
        quotationNumber: quoteNum,
        quotationDate: quoteDateInput.value,
        validUntil: validUntilDateInput.value,
        currency: (quoteCurrencySelect ? quoteCurrencySelect.value : "₹") || "₹",
        status: quoteStatusSelect.value || "Draft",
        themeColor: currentThemeColor,
        sellerDetails: {
          businessName: (user && user.businessProfile && user.businessProfile.businessName) || resolvedPayee || "InvoZap Solutions",
          tagline: (user && user.businessProfile && user.businessProfile.tagline) || "",
          address: (user && user.businessProfile && user.businessProfile.address) || "Shivaji Nagar, Pune, Maharashtra 411005",
          email: (user && user.businessProfile && user.businessProfile.email) || (user ? user.email : "support@invozap.com"),
          phone: (user && user.businessProfile && user.businessProfile.phone) || "+91 91234 56789",
          gstin: (user && user.businessProfile && user.businessProfile.gstin) || "",
          stateCode: (user && user.businessProfile && user.businessProfile.stateCode) || (sellerStateCodeSelect ? sellerStateCodeSelect.value : "27"),
          upiId: resolvedVpa,
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
          vpa: resolvedVpa,
          payeeName: resolvedPayee
        },
        subtotal: prevSubtotal.textContent,
        taxAmount: prevGst ? prevGst.textContent : "₹0.00",
        total: prevTotal.textContent,
        terms: quoteTermsInput ? quoteTermsInput.value : "",
        savedAt: new Date().toISOString()
      };

      // Auto-save client to directory seamlessly
      if (quotationPayload.clientDetails && quotationPayload.clientDetails.clientName) {
        autoSaveClientProfile({
          name: quotationPayload.clientDetails.clientName,
          address: quotationPayload.clientDetails.address,
          email: quotationPayload.clientDetails.email,
          phone: quotationPayload.clientDetails.phone,
          gst: quotationPayload.clientDetails.gstin,
          stateCode: quotationPayload.buyerStateCode
        });
      }

      // Safe local storage persistence
      const localQuotes = JSON.parse(localStorage.getItem("invozap_quotations") || "[]");
      const existingIdx = localQuotes.findIndex(q => q.quotationNumber === quoteNum);
      if (existingIdx !== -1) {
        if (!currentQuotationId && localQuotes[existingIdx]._id) {
          currentQuotationId = localQuotes[existingIdx]._id;
        }
        localQuotes[existingIdx] = {
          ...localQuotes[existingIdx],
          ...quotationPayload,
          updatedAt: new Date().toISOString()
        };
      } else {
        localQuotes.push(quotationPayload);
      }
      localStorage.setItem("invozap_quotations", JSON.stringify(localQuotes));

      // Commit persistent sequence counter
      if (window.InvoZapNumbering) {
        const parsed = window.InvoZapNumbering.parseDocumentNumber(quoteNum);
        if (parsed && parsed.seq) {
          window.InvoZapNumbering.commitAllocatedSequence("quotation", parsed.seq, parsed.prefix, quotationPayload.quotationDate);
        }
      }

      // Sync to MongoDB Atlas Cloud if user has an auth token
      const authToken = localStorage.getItem("invozap_token");
      if (authToken) {
        saveQuoteBtn.textContent = "Saving to Cloud...";
        try {
          const url = (typeof currentQuotationId !== "undefined" && currentQuotationId)
            ? `/api/quotations/${currentQuotationId}`
            : "/api/quotations";
          const method = (typeof currentQuotationId !== "undefined" && currentQuotationId) ? "PUT" : "POST";

          const res = await fetch(url, {
            method: method,
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${authToken}`,
            },
            body: JSON.stringify(quotationPayload),
          });

          const data = await res.json();
          if (res.ok && data.quotation && data.quotation._id) {
            currentQuotationId = data.quotation._id;
            const updatedQuotes = JSON.parse(localStorage.getItem("invozap_quotations") || "[]");
            const uIdx = updatedQuotes.findIndex(q => q.quotationNumber === quoteNum);
            if (uIdx !== -1) {
              updatedQuotes[uIdx]._id = data.quotation._id;
              localStorage.setItem("invozap_quotations", JSON.stringify(updatedQuotes));
            }
          }
        } catch (err) {
          console.warn("Cloud quotation save offline fallback:", err);
        } finally {
          saveQuoteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 6px;"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>Save Quotation`;
        }
      }

      const wantViewHistory = confirm(
        `Quotation ${quoteNum} saved successfully!\n\nWould you like to open Quotation History to view it?`
      );
      if (wantViewHistory) {
        window.location.href = "recents.html?tab=quotations";
      }
    });
  }

  // --- 13. Client Directory Integration (Spec F3 Compliance) ---
  const saveClientProfileBtn = document.getElementById("saveClientProfileBtn");
  const returningClientSelect = document.getElementById("returningClientSelect");

  let clientProfiles = [];

  function localClientProfiles() {
    return JSON.parse(localStorage.getItem("invozap_clients") || "[]");
  }

  function autoSaveClientProfile(clientObj) {
    if (!clientObj || !clientObj.name) return;
    const profiles = localClientProfiles();
    const existingIdx = profiles.findIndex(p => p.name.toLowerCase() === clientObj.name.toLowerCase());
    if (existingIdx >= 0) {
      profiles[existingIdx] = Object.assign({}, profiles[existingIdx], clientObj);
    } else {
      profiles.push(clientObj);
    }
    localStorage.setItem("invozap_clients", JSON.stringify(profiles));

    const authToken = localStorage.getItem("invozap_token");
    if (authToken) {
      fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          clientName: clientObj.name,
          address: clientObj.address,
          email: clientObj.email,
          phone: clientObj.phone,
          gstin: clientObj.gst,
          stateCode: clientObj.stateCode
        })
      }).catch(() => {});
    }
    loadClientProfiles();
  }

  async function loadClientProfiles() {
    if (!returningClientSelect) return;
    const authToken = localStorage.getItem("invozap_token");
    clientProfiles = localClientProfiles();
    if (authToken) {
      try {
        const response = await fetch("/api/clients", {
          headers: { "Authorization": `Bearer ${authToken}` }
        });
        const data = await response.json();
        if (response.ok && data.success) {
          clientProfiles = data.clients.map(client => ({
            id: client._id,
            name: client.clientName,
            address: client.address,
            email: client.email,
            phone: client.phone,
            gst: client.gstin,
            stateCode: client.stateCode
          }));
        }
      } catch (error) {
        // Keep the local directory available during a temporary network failure.
      }
    }
    returningClientSelect.innerHTML = "";
    const defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = "-- Choose a returning client profile to auto-fill --";
    returningClientSelect.appendChild(defaultOpt);

    clientProfiles.forEach(function (client, idx) {
      const opt = document.createElement("option");
      opt.value = String(idx);
      opt.textContent = `${client.name} (${client.phone || client.email || "Client"})`;
      returningClientSelect.appendChild(opt);
    });
  }

  if (saveClientProfileBtn) {
    saveClientProfileBtn.addEventListener("click", async function () {
      const name = clientNameInput ? clientNameInput.value.trim() : "";
      if (!name) {
        alert("Please enter a Client / Company Name first.");
        return;
      }

      const clientObj = {
        name: name,
        address: clientAddressInput ? clientAddressInput.value.trim() : "",
        email: clientEmailInput ? clientEmailInput.value.trim() : "",
        phone: clientPhoneInput ? clientPhoneInput.value.trim() : "",
        gst: clientGstInput ? clientGstInput.value.trim() : "",
        stateCode: buyerStateCodeSelect ? buyerStateCodeSelect.value : ""
      };

      const profiles = localClientProfiles();
      const existingIdx = profiles.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
      if (existingIdx >= 0) {
        profiles[existingIdx] = clientObj;
      } else {
        profiles.push(clientObj);
      }
      localStorage.setItem("invozap_clients", JSON.stringify(profiles));

      const authToken = localStorage.getItem("invozap_token");
      if (authToken) {
        try {
          const response = await fetch("/api/clients", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${authToken}`
            },
            body: JSON.stringify({ clientName: name, ...clientObj })
          });
          const data = await response.json();
          if (!response.ok || !data.success) {
            alert(data.message || "Could not save the client profile to your account.");
            return;
          }
        } catch (error) {
          alert("Could not reach the server. The profile remains saved on this device.");
          return;
        }
      }

      alert(`Saved profile for "${name}" to directory!`);
      await loadClientProfiles();
    });
  }

  if (returningClientSelect) {
    returningClientSelect.addEventListener("change", function () {
      const idx = this.value;
      if (idx === "") return;
      const client = clientProfiles[Number(idx)];
      if (client) {
        if (clientNameInput) clientNameInput.value = client.name || "";
        if (clientAddressInput) clientAddressInput.value = client.address || "";
        if (clientEmailInput) clientEmailInput.value = client.email || "";
        if (clientPhoneInput) clientPhoneInput.value = client.phone || "";
        if (clientGstInput) clientGstInput.value = client.gst || "";
        if (buyerStateCodeSelect && client.stateCode) {
          buyerStateCodeSelect.value = client.stateCode;
        }
        updatePreview();
      }
    });
  }

  // --- 14. Check URL for Edit Quotation Mode (?edit=QT-XXXX or ?id=673c...) ---
  async function loadExistingQuotationForEditing() {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit") || params.get("id");
    if (!editId) return;

    let quote = null;
    const authToken = localStorage.getItem("invozap_token");
    if (authToken) {
      try {
        const res = await fetch(`/api/quotations/${encodeURIComponent(editId)}`, {
          headers: { "Authorization": `Bearer ${authToken}` }
        });
        const data = await res.json();
        if (res.ok && data.success && data.quotation) {
          quote = data.quotation;
        }
      } catch (e) {
        console.warn("Could not fetch quotation from cloud:", e);
      }
    }

    if (!quote) {
      const quotes = JSON.parse(localStorage.getItem("invozap_quotations") || "[]");
      quote = quotes.find(q => q.quotationNumber === editId || q._id === editId);
    }

    if (!quote) return;

    if (quote._id) {
      currentQuotationId = quote._id;
    }

    // Change Header title safely
    const headerTitle = document.querySelector(".editor-header h1");
    if (headerTitle) {
      headerTitle.innerHTML = "";
      headerTitle.append(document.createTextNode("Edit Quotation "));
      const badge = document.createElement("span");
      badge.id = "headerQuoteBadge";
      badge.className = "quotation-badge";
      badge.textContent = quote.quotationNumber || "";
      headerTitle.appendChild(badge);
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
    const restoredSellerState = quote.sellerStateCode || (quote.sellerDetails && quote.sellerDetails.stateCode) || "";
    if (restoredSellerState && sellerStateCodeSelect) sellerStateCodeSelect.value = restoredSellerState;

    const restoredBuyerState = quote.buyerStateCode || (quote.clientDetails && quote.clientDetails.stateCode) || "";
    if (restoredBuyerState && buyerStateCodeSelect) buyerStateCodeSelect.value = restoredBuyerState;
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

    // Populate items safely using createItemRow
    if (quote.items && quote.items.length > 0 && itemsTableBody) {
      itemsTableBody.innerHTML = "";
      quote.items.forEach(function (item) {
        const row = createItemRow(item.description || "", item.quantity || 1, item.price || 0, item.taxRate, item.hsnSac, item.unit);
        itemsTableBody.appendChild(row);
      });
    }

    updatePreview();
  }

  // --- 11. Paste Items List Handlers ---
  const openPasteItemsBtn = document.getElementById("openPasteItemsBtn");
  const pasteItemsModal = document.getElementById("pasteItemsModal");
  const closePasteItemsModalBtn = document.getElementById("closePasteItemsModalBtn");
  const cancelPasteItemsBtn = document.getElementById("cancelPasteItemsBtn");
  const insertPastedItemsBtn = document.getElementById("insertPastedItemsBtn");
  const pasteItemsInput = document.getElementById("pasteItemsInput");

  if (openPasteItemsBtn && pasteItemsModal) {
    openPasteItemsBtn.addEventListener("click", () => {
      pasteItemsModal.style.display = "flex";
      if (pasteItemsInput) {
        pasteItemsInput.value = "";
        pasteItemsInput.focus();
      }
    });

    [closePasteItemsModalBtn, cancelPasteItemsBtn].forEach(btn => {
      if (btn) btn.addEventListener("click", () => { pasteItemsModal.style.display = "none"; });
    });

    if (insertPastedItemsBtn) {
      insertPastedItemsBtn.addEventListener("click", () => {
        const rawText = (pasteItemsInput.value || "").trim();
        if (!rawText) {
          alert("Please paste your items and prices first.");
          return;
        }

        const parsedItems = window.InvoZapAiDraft && window.InvoZapAiDraft.parseItemsList
          ? window.InvoZapAiDraft.parseItemsList(rawText)
          : [];

        if (parsedItems.length === 0) {
          alert("Could not detect any valid items. Please check the format.");
          return;
        }

        // Check if existing items table has only empty/default placeholder rows
        const existingRows = itemsTableBody ? itemsTableBody.querySelectorAll("tr") : [];
        let allEmpty = existingRows.length > 0;
        existingRows.forEach(r => {
          const desc = r.querySelector(".item-desc")?.value.trim();
          if (desc && desc !== "Full Stack Web Portal Development" && desc !== "API & Cloud Infrastructure Deployment") {
            allEmpty = false;
          }
        });

        if (allEmpty && itemsTableBody) {
          itemsTableBody.innerHTML = "";
        }

        parsedItems.forEach(it => {
          const row = createItemRow(it.description, it.quantity || 1, it.price || 0);
          itemsTableBody.appendChild(row);
        });

        pasteItemsModal.style.display = "none";
        updatePreview();
      });
    }
  }

  // --- 12. Simple Presentation Auto-Numbering for Quotations (QT-0001, QT-0002...) ---
  const urlParams = new URLSearchParams(window.location.search);
  const editQuoteId = urlParams.get("edit") || urlParams.get("id");
  if (!editQuoteId && window.InvoZapNumbering && quoteNumberInput) {
    const existingQuotes = JSON.parse(localStorage.getItem("invozap_quotations") || "[]");
    const nextQuoteNo = window.InvoZapNumbering.getNextSimpleDocumentNumber("quotation", existingQuotes, "QT");
    quoteNumberInput.value = nextQuoteNo;
    if (headerQuoteBadge) headerQuoteBadge.textContent = nextQuoteNo;
    if (prevQuoteNumber) prevQuoteNumber.textContent = nextQuoteNo;

    // Asynchronously check cloud records to ensure monotonic simple numbering
    const authToken = localStorage.getItem("invozap_token");
    if (authToken) {
      fetch("/api/quotations", { headers: { "Authorization": `Bearer ${authToken}` } })
        .then(res => res.json())
        .then(data => {
          if (data && data.success && Array.isArray(data.quotations) && data.quotations.length > 0) {
            const combined = [...existingQuotes, ...data.quotations];
            const cloudNext = window.InvoZapNumbering.getNextSimpleDocumentNumber("quotation", combined, "QT");
            if (cloudNext) {
              quoteNumberInput.value = cloudNext;
              if (headerQuoteBadge) headerQuoteBadge.textContent = cloudNext;
              if (prevQuoteNumber) prevQuoteNumber.textContent = cloudNext;
            }
          }
        })
        .catch(() => {});
    }
  }

  // --- 13. Collapsible Quotation Settings Accordion ---
  const quoteSettingsToggle = document.getElementById("quoteSettingsToggle");
  const quoteSettingsCard = document.getElementById("quoteSettingsCard");

  if (quoteSettingsToggle && quoteSettingsCard) {
    quoteSettingsToggle.addEventListener("click", () => {
      quoteSettingsCard.classList.toggle("collapsed");
    });
  }

  // Initial runs
  loadClientProfiles();
  loadExistingQuotationForEditing();
  updatePreview();
});
