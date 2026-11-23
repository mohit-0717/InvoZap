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
  const catalogItemSelect = document.getElementById("catalogItemSelect");
  const addCatalogItemBtn = document.getElementById("addCatalogItemBtn");
  const saveCatalogItemBtn = document.getElementById("saveCatalogItemBtn");
  const catalogItemNameInput = document.getElementById("catalogItemName");
  const catalogItemPriceInput = document.getElementById("catalogItemPrice");
  const catalogItemUnitInput = document.getElementById("catalogItemUnit");
  const catalogItemHsnSacInput = document.getElementById("catalogItemHsnSac");
  const catalogItemTaxRateInput = document.getElementById("catalogItemTaxRate");
  const quotePaper = document.getElementById("quotePaper");
  const saveQuoteBtn = document.getElementById("saveQuoteBtn");
  const downloadPdfBtn = document.getElementById("downloadPdfBtn");

  // --- 2. Initialize Auth State on Navbar (Safe DOM Creation) ---
  if (typeof window.renderNavbarProfile === "function") {
    window.renderNavbarProfile();
  } else {
    const authNavWrap = document.getElementById("authNavWrap");
    const token = localStorage.getItem("invozap_token");
    const user = JSON.parse(localStorage.getItem("invozap_user") || "null");

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
          d.style.cssText = "display: flex; justify-content: space-between; color: #475569;";
          const s = document.createElement("span");
          s.textContent = label;
          const b = document.createElement("b");
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

      // Update Dynamic GST Supply Indicator Chip
      const gstChip = document.getElementById("gstSupplyTypeChip");
      const gstIcon = document.getElementById("gstSupplyIcon");
      const gstText = document.getElementById("gstSupplyText");
      if (gstChip && gstIcon && gstText) {
        if (calcResult.regime === "intra") {
          gstIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle-2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`;
          gstText.textContent = "Intra-State Supply (CGST 9% + SGST 9% applied)";
          gstChip.style.background = "#f0fdf4";
          gstChip.style.borderColor = "#bbf7d0";
          gstChip.style.color = "#166534";
        } else {
          gstIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`;
          gstText.textContent = "Inter-State Supply (IGST 18% applied)";
          gstChip.style.background = "#eff6ff";
          gstChip.style.borderColor = "#bfdbfe";
          gstChip.style.color = "#1e40af";
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

  // --- 7.1 Product & Service Catalog ---
  let catalogItems = [];

  function localCatalogItems() {
    return JSON.parse(localStorage.getItem("invozap_catalog") || "[]");
  }

  async function loadCatalogItems() {
    catalogItems = localCatalogItems();
    const authToken = localStorage.getItem("invozap_token");
    if (authToken) {
      try {
        const response = await fetch("/api/catalog", { headers: { "Authorization": `Bearer ${authToken}` } });
        const data = await response.json();
        if (response.ok && data.success) catalogItems = data.items || [];
      } catch (error) {
        // Local entries keep the editor usable when the server is unavailable.
      }
    }
    if (!catalogItemSelect) return;
    catalogItemSelect.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select a saved item";
    catalogItemSelect.appendChild(placeholder);
    catalogItems.forEach((item, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = `${item.name} — ₹${Number(item.defaultPrice || 0).toLocaleString("en-IN")}`;
      catalogItemSelect.appendChild(option);
    });
  }

  if (addCatalogItemBtn) {
    addCatalogItemBtn.addEventListener("click", function () {
      if (!catalogItemSelect || catalogItemSelect.value === "") return alert("Choose a saved product or service first.");
      const item = catalogItems[Number(catalogItemSelect.value)];
      if (!item) return alert("Choose a saved product or service first.");
      itemsTableBody.appendChild(createItemRow(item.description || item.name, 1, item.defaultPrice, item.defaultTaxRate, item.hsnSac, item.unit));
      updatePreview();
    });
  }

  if (saveCatalogItemBtn) {
    saveCatalogItemBtn.addEventListener("click", async function () {
      const name = catalogItemNameInput ? catalogItemNameInput.value.trim() : "";
      if (!name) return alert("Enter a product or service name first.");
      const item = {
        name,
        description: name,
        defaultPrice: Number(catalogItemPriceInput && catalogItemPriceInput.value) || 0,
        unit: (catalogItemUnitInput && catalogItemUnitInput.value.trim()) || "unit",
        hsnSac: (catalogItemHsnSacInput && catalogItemHsnSacInput.value.trim()) || "",
        defaultTaxRate: Number(catalogItemTaxRateInput && catalogItemTaxRateInput.value) || 0
      };
      const local = localCatalogItems();
      const existing = local.findIndex(entry => String(entry.name).toLowerCase() === name.toLowerCase());
      if (existing >= 0) local[existing] = item;
      else local.push(item);
      localStorage.setItem("invozap_catalog", JSON.stringify(local));

      const authToken = localStorage.getItem("invozap_token");
      if (authToken) {
        try {
          const response = await fetch("/api/catalog", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
            body: JSON.stringify(item)
          });
          const data = await response.json();
          if (!response.ok || !data.success) return alert(data.message || "Could not save the catalog item to your account.");
        } catch (error) {
          return alert("Could not reach the server. The item remains saved on this device.");
        }
      }
      if (catalogItemNameInput) catalogItemNameInput.value = "";
      if (catalogItemPriceInput) catalogItemPriceInput.value = "";
      if (catalogItemHsnSacInput) catalogItemHsnSacInput.value = "";
      await loadCatalogItems();
      alert(`Saved "${name}" to your catalog.`);
    });
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
          businessName: (user && user.businessProfile && user.businessProfile.businessName) || "InvoZap Solutions",
          tagline: (user && user.businessProfile && user.businessProfile.tagline) || "",
          address: (user && user.businessProfile && user.businessProfile.address) || "Shivaji Nagar, Pune, Maharashtra 411005",
          email: (user && user.businessProfile && user.businessProfile.email) || (user ? user.email : "support@invozap.com"),
          phone: (user && user.businessProfile && user.businessProfile.phone) || "+91 91234 56789",
          gstin: (user && user.businessProfile && user.businessProfile.gstin) || "",
          stateCode: (user && user.businessProfile && user.businessProfile.stateCode) || (sellerStateCodeSelect ? sellerStateCodeSelect.value : "27"),
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

      // Auto-save client to directory seamlessly (no extra manual click needed)
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

      // Attempt Cloud Save if user has a JWT token
      const authToken = localStorage.getItem("invozap_token");
      if (authToken) {
        saveQuoteBtn.textContent = "Saving...";
        fetch("/api/quotations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`,
          },
          body: JSON.stringify(quotationPayload),
        })
          .then(res => res.json())
          .then(data => {
            if (data && data.quotation && data.quotation._id) {
              const updatedLocalQuotes = JSON.parse(localStorage.getItem("invozap_quotations") || "[]");
              const uIdx = updatedLocalQuotes.findIndex(q => q.quotationNumber === quoteNum);
              if (uIdx !== -1) {
                updatedLocalQuotes[uIdx]._id = data.quotation._id;
                localStorage.setItem("invozap_quotations", JSON.stringify(updatedLocalQuotes));
              }
            }
          })
          .catch(err => {
            console.warn("Cloud quotation save offline fallback:", err);
          })
          .finally(() => {
            saveQuoteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 6px;"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>Save Quotation`;
          });
      }

      const wantViewHistory = confirm(
        `Quotation ${quoteNum} saved successfully!\n\nWould you like to open Quotation History to view it or convert it to an invoice?`
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
        if (buyerStateCodeSelect && (client.stateCode || client.gst)) {
          const derivedState = client.stateCode || (window.InvoZapCalc ? window.InvoZapCalc.extractStateCodeFromGstin(client.gst) : "");
          if (derivedState) buyerStateCodeSelect.value = derivedState;
        }
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

    // Populate items safely using createItemRow
    if (quote.items && quote.items.length > 0 && itemsTableBody) {
      itemsTableBody.innerHTML = "";
      quote.items.forEach(function (item) {
        const row = createItemRow(item.description || "", item.quantity || 1, item.price || 0, item.taxRate, item.hsnSac, item.unit);
        itemsTableBody.appendChild(row);
      });
    }
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

  // --- 13. Collapsible Quotation Settings Accordion ---
  const quoteSettingsToggle = document.getElementById("quoteSettingsToggle");
  const quoteSettingsCard = document.getElementById("quoteSettingsCard");
  const quoteSettingsSummaryBadge = document.getElementById("quoteSettingsSummaryBadge");

  function updateQuoteSettingsSummary() {
    if (!quoteSettingsSummaryBadge) return;
    const curr = (currencySelect && currencySelect.value) || "₹";
    const stateCode = (sellerStateCodeSelect && sellerStateCodeSelect.value) || "27";
    quoteSettingsSummaryBadge.textContent = `${curr} • POS ${stateCode}`;
  }

  if (quoteSettingsToggle && quoteSettingsCard) {
    quoteSettingsToggle.addEventListener("click", () => {
      quoteSettingsCard.classList.toggle("collapsed");
    });
    if (currencySelect) currencySelect.addEventListener("change", updateQuoteSettingsSummary);
    if (sellerStateCodeSelect) sellerStateCodeSelect.addEventListener("change", updateQuoteSettingsSummary);
    updateQuoteSettingsSummary();
  }

  // Initial runs
  loadCatalogItems();
  loadClientProfiles();
  loadExistingQuotationForEditing();
  updatePreview();
});
