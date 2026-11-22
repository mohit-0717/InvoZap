/* ========================================================
   InvoZap - Student Invoice Generator JavaScript
   Simple, easy-to-read DOM manipulation, MongoDB cloud sync,
   deterministic calculations, and WhatsApp sharing.
   ======================================================== */

// Wait for the web page to load
document.addEventListener("DOMContentLoaded", function () {

  // Current working invoice ID from MongoDB
  let currentInvoiceId = null;
  let currentThemeColor = "navy";

  // --- 1. DOM Elements ---
  const invNumberInput = document.getElementById("invNumber");
  const invDateInput = document.getElementById("invDate");
  const dueDateInput = document.getElementById("dueDate");
  const currencySelect = document.getElementById("currency");
  const invStatusSelect = document.getElementById("invStatus");

  const clientNameInput = document.getElementById("clientName");
  const clientAddressInput = document.getElementById("clientAddress");
  const clientEmailInput = document.getElementById("clientEmail");
  const clientPhoneInput = document.getElementById("clientPhone");
  const clientGstInput = document.getElementById("clientGst");

  // State & UPI Elements (Spec F5 & F11)
  const sellerStateCodeSelect = document.getElementById("sellerStateCode");
  const buyerStateCodeSelect = document.getElementById("buyerStateCode");
  const upiVpaInput = document.getElementById("upiVpa");
  const upiPayeeNameInput = document.getElementById("upiPayeeName");

  // Sheet Preview Elements
  const headerInvBadge = document.getElementById("headerInvBadge");
  const prevInvNumber = document.getElementById("prevInvNumber");
  const prevInvDate = document.getElementById("prevInvDate");
  const prevDueDate = document.getElementById("prevDueDate");
  const prevStatus = document.getElementById("prevStatus");
  const prevClientName = document.getElementById("prevClientName");
  const prevClientAddress = document.getElementById("prevClientAddress");
  const prevClientContact = document.getElementById("prevClientContact");

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
  const invoicePaper = document.getElementById("invoicePaper");
  const saveInvoiceBtn = document.getElementById("saveInvoiceBtn");
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

  // --- 2.1 Initialize Home Page Billing Lottie Animation ---
  const billingAnimContainer = document.getElementById("billingAnimContainer");
  if (billingAnimContainer && typeof lottie !== "undefined") {
    try {
      if (window.BILLING_ANIMATION_DATA) {
        lottie.loadAnimation({
          container: billingAnimContainer,
          renderer: "svg",
          loop: true,
          autoplay: true,
          animationData: window.BILLING_ANIMATION_DATA
        });
      } else {
        lottie.loadAnimation({
          container: billingAnimContainer,
          renderer: "svg",
          loop: true,
          autoplay: true,
          path: "Bill Paid Successful.json"
        });
      }
    } catch (err) {
      console.warn("Could not initialize billing animation:", err);
    }
  }

  // --- 3. If on Invoice Creator Page, Initialize Form & Preview ---
  if (!invNumberInput) {
    return; // Stop here on other pages like Home, History, Analytics
  }

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  if (invDateInput) invDateInput.value = todayStr;

  const defaultDue = new Date();
  defaultDue.setDate(defaultDue.getDate() + 7);
  if (dueDateInput) dueDateInput.value = defaultDue.toISOString().split("T")[0];

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

  // --- 4. Live Update Sheet Preview ---
  function updatePreview() {
    const symbol = currencySelect.value || "₹";

    // Header & Meta sync
    const invNum = invNumberInput.value || "INV-0001";
    headerInvBadge.textContent = invNum;
    prevInvNumber.textContent = invNum;

    prevInvDate.textContent = formatDate(invDateInput.value);
    prevDueDate.textContent = formatDate(dueDateInput.value);

    // Status sync
    const status = invStatusSelect.value;
    prevStatus.textContent = status.toUpperCase();
    if (status === "Paid") {
      prevStatus.className = "status-pill status-paid";
    } else {
      prevStatus.className = "status-pill status-unpaid";
    }

    // Client details sync
    prevClientName.textContent = clientNameInput.value || "Client Name";
    prevClientAddress.textContent = clientAddressInput.value || "";

    const email = clientEmailInput.value;
    const phone = clientPhoneInput.value;
    let contactInfo = "";
    if (email && phone) contactInfo = `${email} • ${phone}`;
    else contactInfo = email || phone || "";
    prevClientContact.textContent = contactInfo;

    renderItemsPreview(symbol);
  }

  // --- 5. Render Items & Calculate Totals (Deterministic Calculations) ---
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
          description: desc || "Item", quantity: qty, price: price, rowTotal: rowTotal,
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
          invoiceNumber: invNumberInput ? invNumberInput.value : "INV-0001",
          currencySymbol: currencySymbol
        });
      }
    }
  }



  // --- 6. Quick Date Chip Buttons ---
  const dateChips = document.querySelectorAll(".date-chips button");
  dateChips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      const days = parseInt(this.getAttribute("data-days"));
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      dueDateInput.value = targetDate.toISOString().split("T")[0];
      updatePreview();
    });
  });

  // --- 7. Theme Color Change ---
  const themeRadios = document.querySelectorAll('input[name="themeColor"]');
  themeRadios.forEach(function (radio) {
    radio.addEventListener("change", function () {
      invoicePaper.classList.remove("theme-navy", "theme-indigo", "theme-burgundy");
      currentThemeColor = this.value;
      if (this.value === "navy") invoicePaper.classList.add("theme-navy");
      if (this.value === "indigo") invoicePaper.classList.add("theme-indigo");
      if (this.value === "burgundy") invoicePaper.classList.add("theme-burgundy");
    });
  });

  // Safe helper to construct an item row using direct DOM property assignment
  function createItemRow(description = "", quantity = 1, price = 0, taxRate = 18, hsnSac = "", unit = "") {
    const tr = document.createElement("tr");
    tr.dataset.taxRate = String(taxRate);
    tr.dataset.hsnSac = hsnSac;
    tr.dataset.unit = unit;

    const tdDesc = document.createElement("td");
    const inputDesc = document.createElement("input");
    inputDesc.type = "text";
    inputDesc.className = "item-desc";
    inputDesc.placeholder = "Product or service name";
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

  // --- 8. Add & Remove Item Rows ---
  addItemBtn.addEventListener("click", function () {
    const newRow = createItemRow("", 1, 0);
    itemsTableBody.appendChild(newRow);
    updatePreview();
  });

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
          alert("At least one item row is required.");
        }
      });
    }
  }

  itemsTableBody.querySelectorAll("tr").forEach(attachRowListeners);

  // --- 9. Attach Live Listeners to All Form Inputs ---
  const allInputs = [
    invNumberInput, invDateInput, dueDateInput, currencySelect, invStatusSelect,
    clientNameInput, clientAddressInput, clientEmailInput, clientPhoneInput, clientGstInput,
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

  // --- 11. Cloud Persistence & Local Storage Fallback ---
  if (saveInvoiceBtn) {
    saveInvoiceBtn.addEventListener("click", async function () {
      const items = getItemsData();

      const invoicePayload = {
        invoiceNumber: invNumberInput.value.trim(),
        invoiceDate: invDateInput.value,
        dueDate: dueDateInput.value,
        currency: currencySelect.value,
        status: invStatusSelect.value,
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
      };

      // Auto-save client to directory seamlessly (no extra manual click needed)
      if (invoicePayload.clientDetails && invoicePayload.clientDetails.clientName) {
        autoSaveClientProfile({
          name: invoicePayload.clientDetails.clientName,
          address: invoicePayload.clientDetails.address,
          email: invoicePayload.clientDetails.email,
          phone: invoicePayload.clientDetails.phone,
          gst: invoicePayload.clientDetails.gstin,
          stateCode: invoicePayload.buyerStateCode
        });
      }

      // Always save to localStorage as a safe local fallback
      const localInvoices = JSON.parse(localStorage.getItem("invozap_invoices") || "[]");
      const invNum = invNumberInput.value.trim();
      const existingIdx = localInvoices.findIndex(i => i.invoiceNumber === invNum);
      if (existingIdx !== -1) {
        localInvoices[existingIdx] = {
          ...localInvoices[existingIdx],
          ...invoicePayload,
          clientName: clientNameInput.value.trim(),
          total: prevTotal.textContent,
          updatedAt: new Date().toISOString()
        };
      } else {
        localInvoices.push({
          ...invoicePayload,
          clientName: clientNameInput.value.trim(),
          total: prevTotal.textContent,
          savedAt: new Date().toISOString()
        });
      }
      localStorage.setItem("invozap_invoices", JSON.stringify(localInvoices));

      // Commit persistent monotonic sequence high-water mark (Spec F4)
      if (window.InvoZapNumbering) {
        const parsed = window.InvoZapNumbering.parseDocumentNumber(invNum);
        if (parsed && parsed.seq) {
          window.InvoZapNumbering.commitAllocatedSequence("invoice", parsed.seq, parsed.prefix, invoicePayload.invoiceDate);
        }
      }

      // Attempt Cloud Save if user has a JWT token
      const authToken = localStorage.getItem("invozap_token");
      if (!authToken) {
        alert("Saved to local storage!\n\nTip: Sign in with your account to save directly to MongoDB Atlas cloud and unlock public sharing.");
        return;
      }

      saveInvoiceBtn.textContent = "Saving...";
      try {
        const url = currentInvoiceId
          ? `/api/invoices/${currentInvoiceId}`
          : "/api/invoices";
        
        const method = currentInvoiceId ? "PUT" : "POST";

        const res = await fetch(url, {
          method: method,
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`,
          },
          body: JSON.stringify(invoicePayload),
        });

        const data = await res.json();
        if (!res.ok) {
          alert(`Server Error: ${data.message || "Failed to save to cloud."}`);
        } else {
          currentInvoiceId = data.invoice._id;
          alert("Saved to MongoDB Atlas successfully!");
        }
      } catch (err) {
        alert("Cloud server offline: Invoice safely stored in your browser local storage.");
      } finally {
        saveInvoiceBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cloud-upload"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg> Save to Cloud`;
      }
    });
  }

  // --- 12. Public Sharing & WhatsApp Workflow ---
  const openShareModalBtn = document.getElementById("openShareModalBtn");
  const shareModal = document.getElementById("shareModal");
  const closeShareModalBtn = document.getElementById("closeShareModalBtn");
  const generateShareLinkBtn = document.getElementById("generateShareLinkBtn");
  const shareActionArea = document.getElementById("shareActionArea");
  const shareActiveArea = document.getElementById("shareActiveArea");
  const publicUrlInput = document.getElementById("publicUrlInput");
  const copyShareLinkBtn = document.getElementById("copyShareLinkBtn");
  const whatsappShareBtn = document.getElementById("whatsappShareBtn");
  const revokeShareBtn = document.getElementById("revokeShareBtn");

  if (openShareModalBtn) {
    openShareModalBtn.addEventListener("click", () => {
      const authToken = localStorage.getItem("invozap_token");
      if (!authToken) {
        if (confirm("Please Sign In or Register first to create secure public share links. Go to Sign In?")) {
          window.location.href = "auth.html";
        }
        return;
      }

      if (!currentInvoiceId) {
        alert("Please click 'Save to Cloud' first so your invoice is stored in MongoDB Atlas before generating a share link.");
        return;
      }

      shareModal.style.display = "flex";
    });
  }

  if (closeShareModalBtn) {
    closeShareModalBtn.addEventListener("click", () => {
      shareModal.style.display = "none";
    });
  }

  // Generate Link
  if (generateShareLinkBtn) {
    generateShareLinkBtn.addEventListener("click", async () => {
      const authToken = localStorage.getItem("invozap_token");
      generateShareLinkBtn.textContent = "⏳ Generating...";

      try {
        const res = await fetch(`/api/share/generate/${currentInvoiceId}`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${authToken}` },
        });

        const data = await res.json();
        if (!res.ok) {
          alert(data.message || "Could not generate link.");
          return;
        }

        publicUrlInput.value = data.shareUrl || "";
        const clientName = clientNameInput ? clientNameInput.value.trim() : "Client";
        const invNum = invNumberInput ? invNumberInput.value.trim() : "Invoice";
        const total = prevTotal ? prevTotal.textContent.trim() : "";
        const waText = `Hello ${clientName},\n\nPlease find your invoice (${invNum}) for ${total} here:\n${data.shareUrl}\n\nThank you!`;
        whatsappShareBtn.href = `https://wa.me/?text=${encodeURIComponent(waText)}`;

        shareActionArea.style.display = "none";
        shareActiveArea.style.display = "block";
      } catch (err) {
        alert("Failed to connect to backend server.");
      } finally {
        generateShareLinkBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zap"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Generate Share Link`;
      }
    });
  }

  // Copy Link
  if (copyShareLinkBtn) {
    copyShareLinkBtn.addEventListener("click", () => {
      publicUrlInput.select();
      navigator.clipboard.writeText(publicUrlInput.value);
      alert("Copied public invoice URL to clipboard!");
    });
  }

  // Revoke Link
  if (revokeShareBtn) {
    revokeShareBtn.addEventListener("click", async () => {
      if (!confirm("Are you sure you want to revoke this link? Anyone with this URL will immediately lose access.")) return;

      const authToken = localStorage.getItem("invozap_token");
      try {
        const res = await fetch(`/api/share/revoke/${currentInvoiceId}`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${authToken}` },
        });

        const data = await res.json();
        alert(data.message || "Link revoked successfully.");
        shareActiveArea.style.display = "none";
        shareActionArea.style.display = "block";
      } catch (err) {
        alert("Error revoking link.");
      }
    });
  }

  // --- 13. Client Directory (Spec F3 Compliance) ---
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
      // Prevent duplicates by updating if client already exists by name
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

  // --- 14. Check URL for Edit Invoice Mode (?edit=INV-XXXX) ---
  function loadExistingInvoiceForEditing() {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit") || params.get("id");
    if (!editId) return;

    const invoices = JSON.parse(localStorage.getItem("invozap_invoices") || "[]");
    const inv = invoices.find(i => i.invoiceNumber === editId);
    if (!inv) return;

    // Change Header title safely
    const headerTitle = document.querySelector(".editor-header h1");
    if (headerTitle) {
      headerTitle.innerHTML = "";
      headerTitle.append(document.createTextNode("Edit Invoice "));
      const badge = document.createElement("span");
      badge.id = "headerInvBadge";
      badge.textContent = inv.invoiceNumber || "";
      headerTitle.appendChild(badge);
    }

    invNumberInput.value = inv.invoiceNumber || "";
    if (inv.invoiceDate && invDateInput) invDateInput.value = inv.invoiceDate;
    if (inv.dueDate && dueDateInput) dueDateInput.value = inv.dueDate;
    if (inv.currency && currencySelect) currencySelect.value = inv.currency;
    if (inv.status && invStatusSelect) invStatusSelect.value = inv.status;

    const client = inv.clientDetails || { clientName: inv.clientName };
    if (clientNameInput) clientNameInput.value = client.clientName || inv.clientName || "";
    if (clientAddressInput) clientAddressInput.value = client.address || "";
    if (clientEmailInput) clientEmailInput.value = client.email || "";
    if (clientPhoneInput) clientPhoneInput.value = client.phone || "";
    if (clientGstInput) clientGstInput.value = client.gstin || "";

    // Restore States and UPI
    if (inv.sellerStateCode && sellerStateCodeSelect) sellerStateCodeSelect.value = inv.sellerStateCode;
    if (inv.buyerStateCode && buyerStateCodeSelect) buyerStateCodeSelect.value = inv.buyerStateCode;
    if (inv.upiDetails) {
      if (inv.upiDetails.vpa && upiVpaInput) upiVpaInput.value = inv.upiDetails.vpa;
      if (inv.upiDetails.payeeName && upiPayeeNameInput) upiPayeeNameInput.value = inv.upiDetails.payeeName;
    }

    // Set Theme
    if (inv.themeColor) {
      currentThemeColor = inv.themeColor;
      const themeRadio = document.querySelector(`input[name="themeColor"][value="${inv.themeColor}"]`);
      if (themeRadio) themeRadio.checked = true;
      if (invoicePaper) {
        invoicePaper.classList.remove("theme-navy", "theme-indigo", "theme-burgundy");
        invoicePaper.classList.add(`theme-${inv.themeColor}`);
      }
    }

    // Populate items safely using createItemRow
    if (inv.items && inv.items.length > 0 && itemsTableBody) {
      itemsTableBody.innerHTML = "";
      inv.items.forEach(function (item) {
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
          if (desc && desc !== "Web Development & Consultation" && desc !== "Cloud Hosting Setup") {
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

  // --- 12. Indian Financial Year Auto-Numbering (Spec F4) ---
  const urlParams = new URLSearchParams(window.location.search);
  const editInvId = urlParams.get("edit");
  if (!editInvId && window.InvoZapNumbering && invNumberInput) {
    const existingInvoices = JSON.parse(localStorage.getItem("invozap_invoices") || "[]");
    const nextInvNo = window.InvoZapNumbering.getNextDocumentNumber("invoice", existingInvoices, "INV", invDateInput ? invDateInput.value : null);
    invNumberInput.value = nextInvNo;
    if (headerInvBadge) headerInvBadge.textContent = nextInvNo;
    if (prevInvNumber) prevInvNumber.textContent = nextInvNo;
  }

  // --- 13. Collapsible Invoice Settings Accordion ---
  const invoiceSettingsToggle = document.getElementById("invoiceSettingsToggle");
  const invoiceSettingsCard = document.getElementById("invoiceSettingsCard");
  const settingsSummaryBadge = document.getElementById("settingsSummaryBadge");

  function updateSettingsSummary() {
    if (!settingsSummaryBadge) return;
    const curr = (currencySelect && currencySelect.value) || "₹";
    const stateCode = (sellerStateCodeSelect && sellerStateCodeSelect.value) || "27";
    settingsSummaryBadge.textContent = `${curr} • POS ${stateCode}`;
  }

  if (invoiceSettingsToggle && invoiceSettingsCard) {
    invoiceSettingsToggle.addEventListener("click", () => {
      invoiceSettingsCard.classList.toggle("collapsed");
    });
    if (currencySelect) currencySelect.addEventListener("change", updateSettingsSummary);
    if (sellerStateCodeSelect) sellerStateCodeSelect.addEventListener("change", updateSettingsSummary);
    updateSettingsSummary();
  }

  // Initial runs
  loadCatalogItems();
  loadClientProfiles();
  loadExistingInvoiceForEditing();
  updatePreview();
});
