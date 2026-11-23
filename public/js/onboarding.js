// public/js/onboarding.js
// Business Profile, Personal Settings, Catalog Manager, and Simple Navbar Profile Dropdown

(function () {
  const INDIAN_STATES = [
    { code: "27", name: "Maharashtra (27)" },
    { code: "29", name: "Karnataka (29)" },
    { code: "07", name: "Delhi (07)" },
    { code: "06", name: "Haryana (06)" },
    { code: "08", name: "Rajasthan (08)" },
    { code: "09", name: "Uttar Pradesh (09)" },
    { code: "19", name: "West Bengal (19)" },
    { code: "24", name: "Gujarat (24)" },
    { code: "33", name: "Tamil Nadu (33)" },
    { code: "36", name: "Telangana (36)" },
    { code: "37", name: "Andhra Pradesh (37)" },
    { code: "32", name: "Kerala (32)" },
    { code: "23", name: "Madhya Pradesh (23)" },
    { code: "03", name: "Punjab (03)" },
    { code: "10", name: "Bihar (10)" },
    { code: "21", name: "Odisha (21)" },
    { code: "05", name: "Uttarakhand (05)" },
    { code: "02", name: "Himachal Pradesh (02)" },
    { code: "01", name: "Jammu & Kashmir (01)" },
    { code: "18", name: "Assam (18)" },
    { code: "30", name: "Goa (30)" },
    { code: "22", name: "Chhattisgarh (22)" },
    { code: "20", name: "Jharkhand (20)" },
  ];

  function esc(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/[&<>"']/g, function (c) {
      switch (c) {
        case "&": return "&amp;";
        case "<": return "&lt;";
        case ">": return "&gt;";
        case '"': return "&quot;";
        case "'": return "&#39;";
        default: return c;
      }
    });
  }

  function getAuth() {
    const token = localStorage.getItem("invozap_token");
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem("invozap_user") || "null");
    } catch (e) {}
    return { token, user };
  }

  // Pre-fill Invoice or Quotation editor with saved business profile
  function applyBusinessProfileToPage(bp, user) {
    if (!bp) return;

    const bizName = bp.businessName || (user ? user.name : "");
    const bizAddress = bp.address || "";
    const bizPhone = bp.phone || "";
    const bizEmail = bp.email || (user ? user.email : "");
    const bizGst = bp.gstin || "";
    const bizState = bp.stateCode || "27";
    const bizUpi = bp.upiId || "";

    // 1. Invoice Preview Paper Header
    const paper = document.getElementById("invoicePaper") || document.getElementById("quotePaper");
    if (paper) {
      const titleEl = paper.querySelector(".biz-title");
      if (titleEl && bizName) titleEl.textContent = bizName;

      const taglineEl = paper.querySelector(".biz-tagline");
      if (taglineEl) taglineEl.textContent = bp.tagline || "GST Invoicing & Billing Studio";

      const addressEl = paper.querySelector(".biz-address");
      if (addressEl) {
        let contactParts = [];
        if (bizEmail) contactParts.push(bizEmail);
        if (bizPhone) contactParts.push(bizPhone);
        if (bizGst) contactParts.push(`GSTIN: ${bizGst}`);
        
        addressEl.innerHTML = `${esc(bizAddress)}<br>${esc(contactParts.join(" • "))}`;
      }
    }

    // 2. Editor Form Controls
    const sellerStateSelect = document.getElementById("sellerStateCode");
    if (sellerStateSelect && bizState) {
      sellerStateSelect.value = bizState;
      sellerStateSelect.dispatchEvent(new Event("change"));
    }

    const upiVpaInput = document.getElementById("upiVpa");
    if (upiVpaInput && bizUpi && !upiVpaInput.value) {
      upiVpaInput.value = bizUpi;
      upiVpaInput.dispatchEvent(new Event("input"));
    }

    const upiPayeeNameInput = document.getElementById("upiPayeeName");
    if (upiPayeeNameInput && bizName) {
      upiPayeeNameInput.value = bizName;
    }
  }

  // =========================================================================
  // 1. SIMPLE NAVBAR PROFILE DROPDOWN
  // =========================================================================
  function renderNavbarProfile() {
    const authNavWrap = document.getElementById("authNavWrap");
    if (!authNavWrap) return;

    authNavWrap.innerHTML = "";
    const { token, user } = getAuth();

    if (!token || !user) {
      // Guest View: Simple Sign In Link
      const signInLink = document.createElement("a");
      signInLink.href = "auth.html";
      signInLink.style.cssText = "display: inline-flex; align-items: center; gap: 6px; color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe; font-size: 13px; font-weight: 700; text-decoration: none; padding: 6px 14px; border-radius: 6px; transition: all 0.2s;";
      signInLink.innerHTML = "<span>👤</span> Sign In";
      authNavWrap.appendChild(signInLink);
      return;
    }

    // Logged-in View: Simple, Clean Profile Dropdown (Not Too Premium)
    const profileWrap = document.createElement("div");
    profileWrap.style.cssText = "position: relative; display: inline-block;";

    // Initials calculation
    const nameParts = (user.name || "User").trim().split(/\s+/);
    const initials = nameParts.length > 1
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : (nameParts[0].slice(0, 2)).toUpperCase();

    // Trigger Pill Button
    const triggerBtn = document.createElement("button");
    triggerBtn.type = "button";
    triggerBtn.id = "btnNavProfileTrigger";
    triggerBtn.style.cssText = "display: inline-flex; align-items: center; gap: 8px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 20px; padding: 4px 12px 4px 5px; cursor: pointer; font-family: inherit; transition: border-color 0.15s, box-shadow 0.15s;";

    // Avatar/Initials Circle
    if (user.avatarUrl) {
      const avatarImg = document.createElement("img");
      avatarImg.src = user.avatarUrl;
      avatarImg.alt = user.name || "Profile";
      avatarImg.style.cssText = "width: 26px; height: 26px; border-radius: 50%; object-fit: cover;";
      avatarImg.onerror = () => { avatarImg.style.display = "none"; };
      triggerBtn.appendChild(avatarImg);
    } else {
      const avatarCircle = document.createElement("span");
      avatarCircle.style.cssText = "width: 26px; height: 26px; border-radius: 50%; background: #2563eb; color: #ffffff; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; letter-spacing: 0.5px;";
      avatarCircle.textContent = initials;
      triggerBtn.appendChild(avatarCircle);
    }

    const nameSpan = document.createElement("span");
    nameSpan.style.cssText = "font-size: 13px; font-weight: 600; color: #1e293b; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;";
    nameSpan.textContent = nameParts[0] || "Account";
    triggerBtn.appendChild(nameSpan);

    const chevron = document.createElement("span");
    chevron.style.cssText = "font-size: 10px; color: #64748b; margin-left: 2px;";
    chevron.textContent = "▾";
    triggerBtn.appendChild(chevron);

    // Dropdown Card (Simple, Crisp White)
    const dropdownMenu = document.createElement("div");
    dropdownMenu.id = "navProfileDropdown";
    dropdownMenu.style.cssText = "display: none; position: absolute; right: 0; top: calc(100% + 8px); width: 230px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.06); z-index: 99999; padding: 6px 0; font-family: inherit;";

    // User Summary Header
    const userHeader = document.createElement("div");
    userHeader.style.cssText = "padding: 10px 14px; border-bottom: 1px solid #f1f5f9; background: #f8fafc; border-top-left-radius: 9px; border-top-right-radius: 9px;";
    userHeader.innerHTML = `
      <div style="font-size: 13px; font-weight: 700; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${esc(user.name || "User")}</div>
      <div style="font-size: 11px; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 2px;">${esc(user.email || "")}</div>
    `;
    dropdownMenu.appendChild(userHeader);

    // Option 1: Personal & Business Details
    const optProfile = document.createElement("button");
    optProfile.type = "button";
    optProfile.style.cssText = "width: 100%; text-align: left; padding: 9px 14px; background: none; border: none; font-size: 13px; color: #334155; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 8px;";
    optProfile.innerHTML = `<span>👤</span> Personal & Business Details`;
    optProfile.addEventListener("mouseenter", () => { optProfile.style.background = "#f1f5f9"; });
    optProfile.addEventListener("mouseleave", () => { optProfile.style.background = "none"; });
    optProfile.addEventListener("click", () => {
      dropdownMenu.style.display = "none";
      window.openBusinessProfileModal(false);
    });
    dropdownMenu.appendChild(optProfile);

    // Option 2: Product & Service Catalog
    const optCatalog = document.createElement("button");
    optCatalog.type = "button";
    optCatalog.style.cssText = "width: 100%; text-align: left; padding: 9px 14px; background: none; border: none; font-size: 13px; color: #334155; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 8px;";
    optCatalog.innerHTML = `<span>📦</span> Product & Service Catalog`;
    optCatalog.addEventListener("mouseenter", () => { optCatalog.style.background = "#f1f5f9"; });
    optCatalog.addEventListener("mouseleave", () => { optCatalog.style.background = "none"; });
    optCatalog.addEventListener("click", () => {
      dropdownMenu.style.display = "none";
      window.openCatalogModal();
    });
    dropdownMenu.appendChild(optCatalog);

    // Divider
    const divider = document.createElement("div");
    divider.style.cssText = "height: 1px; background: #e2e8f0; margin: 4px 0;";
    dropdownMenu.appendChild(divider);

    // Option 3: Sign Out
    const optLogout = document.createElement("button");
    optLogout.type = "button";
    optLogout.style.cssText = "width: 100%; text-align: left; padding: 9px 14px; background: none; border: none; font-size: 13px; color: #dc2626; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px;";
    optLogout.innerHTML = `<span>🚪</span> Sign Out`;
    optLogout.addEventListener("mouseenter", () => { optLogout.style.background = "#fef2f2"; });
    optLogout.addEventListener("mouseleave", () => { optLogout.style.background = "none"; });
    optLogout.addEventListener("click", () => {
      localStorage.removeItem("invozap_token");
      localStorage.removeItem("invozap_user");
      window.location.reload();
    });
    dropdownMenu.appendChild(optLogout);

    // Toggle Dropdown
    triggerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isVisible = dropdownMenu.style.display === "block";
      dropdownMenu.style.display = isVisible ? "none" : "block";
    });

    document.addEventListener("click", (e) => {
      if (!profileWrap.contains(e.target)) {
        dropdownMenu.style.display = "none";
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") dropdownMenu.style.display = "none";
    });

    profileWrap.appendChild(triggerBtn);
    profileWrap.appendChild(dropdownMenu);
    authNavWrap.appendChild(profileWrap);
  }

  // =========================================================================
  // 2. PRODUCT & SERVICE CATALOG MODAL
  // =========================================================================
  function injectCatalogModal() {
    if (document.getElementById("invozapCatalogModal")) return;

    const modalHtml = `
      <div id="invozapCatalogModal" style="display: none; position: fixed; inset: 0; z-index: 99999; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(4px); align-items: center; justify-content: center; padding: 16px; overflow-y: auto;">
        <div style="background: #ffffff; border-radius: 16px; max-width: 680px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 24px; box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.2); border: 1px solid #e2e8f0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif;">
          
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px;">
            <div>
              <div style="display: inline-flex; align-items: center; gap: 6px; background: #eff6ff; color: #2563eb; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; margin-bottom: 6px;">
                📦 ITEM CATALOG
              </div>
              <h2 style="margin: 0; font-size: 20px; font-weight: 800; color: #0f172a;">Product & Service Catalog</h2>
              <p style="margin: 4px 0 0; font-size: 13px; color: #64748b;">Save your standard items with prices and tax rates to auto-fill them in 1 click.</p>
            </div>
            <button type="button" id="closeCatalogModalX" style="background: none; border: none; font-size: 22px; color: #94a3b8; cursor: pointer; padding: 2px;">✕</button>
          </div>

          <div id="catalogModalAlert" style="display: none; padding: 8px 12px; border-radius: 6px; font-size: 12px; margin-bottom: 14px;"></div>

          <!-- Add Item Quick Form -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 18px;">
            <div style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 8px;">+ Add New Product or Service</div>
            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 8px; margin-bottom: 8px;">
              <input type="text" id="catInputName" placeholder="Item Name / Description *" style="padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px;">
              <input type="number" id="catInputPrice" min="0" step="0.01" placeholder="Price (₹) *" style="padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px;">
              <input type="text" id="catInputUnit" value="unit" placeholder="Unit (hrs, pcs)" style="padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px;">
            </div>
            <div style="display: grid; grid-template-columns: 1.5fr 1.5fr auto; gap: 8px; align-items: center;">
              <input type="text" id="catInputHsn" placeholder="HSN / SAC Code" style="padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px;">
              <select id="catInputTaxRate" style="padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 12px; background: #fff;">
                <option value="0">GST 0%</option>
                <option value="5">GST 5%</option>
                <option value="12">GST 12%</option>
                <option value="18" selected>GST 18%</option>
                <option value="28">GST 28%</option>
              </select>
              <button type="button" id="btnAddCatalogItemModal" style="background: #2563eb; color: #ffffff; border: none; padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap;">+ Save Item</button>
            </div>
          </div>

          <!-- Catalog Items Table -->
          <div style="font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
            <span>Saved Catalog Items (<span id="catTotalCount">0</span>)</span>
            <span style="font-size: 11px; color: #94a3b8;">Click ✕ to delete</span>
          </div>

          <div style="max-height: 280px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
              <thead>
                <tr style="background: #f1f5f9; border-bottom: 1px solid #e2e8f0; color: #475569;">
                  <th style="padding: 8px 10px;">Item / Service</th>
                  <th style="padding: 8px 10px;">Unit</th>
                  <th style="padding: 8px 10px;">Price (₹)</th>
                  <th style="padding: 8px 10px;">Tax</th>
                  <th style="padding: 8px 10px; text-align: center;">Action</th>
                </tr>
              </thead>
              <tbody id="catalogTableBody">
                <!-- Dynamically populated -->
              </tbody>
            </table>
            <div id="catalogEmptyMsg" style="display: none; padding: 24px; text-align: center; color: #94a3b8; font-size: 13px;">
              No items in catalog yet. Use the form above to add your first product or service.
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 18px;">
            <button type="button" id="btnCloseCatalogModalBtn" style="background: #f1f5f9; border: 1px solid #cbd5e1; color: #475569; padding: 8px 18px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer;">Close</button>
          </div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);

    const modal = document.getElementById("invozapCatalogModal");
    const closeX = document.getElementById("closeCatalogModalX");
    const closeBtn = document.getElementById("btnCloseCatalogModalBtn");
    const addBtn = document.getElementById("btnAddCatalogItemModal");
    const alertBox = document.getElementById("catalogModalAlert");

    function closeModal() {
      sessionStorage.setItem("invozap_onboarding_dismissed", "true");
      modal.style.display = "none";
    }

    closeX.addEventListener("click", closeModal);
    closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    addBtn.addEventListener("click", async () => {
      const nameInput = document.getElementById("catInputName");
      const priceInput = document.getElementById("catInputPrice");
      const unitInput = document.getElementById("catInputUnit");
      const hsnInput = document.getElementById("catInputHsn");
      const taxSelect = document.getElementById("catInputTaxRate");

      const name = nameInput.value.trim();
      const price = parseFloat(priceInput.value) || 0;
      const unit = unitInput.value.trim() || "unit";
      const hsnSac = hsnInput.value.trim().toUpperCase();
      const defaultTaxRate = parseFloat(taxSelect.value) || 18;

      if (!name) {
        alertBox.style.display = "block";
        alertBox.style.background = "#fee2e2";
        alertBox.style.color = "#991b1b";
        alertBox.textContent = "Please enter an item name or description.";
        return;
      }

      const itemPayload = {
        name,
        description: name,
        unit,
        defaultPrice: price,
        defaultTaxRate,
        hsnSac,
      };

      // 1. Local Storage Sync
      const local = JSON.parse(localStorage.getItem("invozap_catalog") || "[]");
      const existingIdx = local.findIndex(i => String(i.name).toLowerCase() === name.toLowerCase());
      if (existingIdx >= 0) {
        local[existingIdx] = itemPayload;
      } else {
        local.push(itemPayload);
      }
      localStorage.setItem("invozap_catalog", JSON.stringify(local));

      // 2. Cloud Sync if logged in
      const { token } = getAuth();
      if (token) {
        try {
          await fetch("/api/catalog", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(itemPayload)
          });
        } catch (e) {
          console.warn("Could not sync item to cloud, saved locally.", e);
        }
      }

      // Clear input fields
      nameInput.value = "";
      priceInput.value = "";
      hsnInput.value = "";

      alertBox.style.display = "block";
      alertBox.style.background = "#dcfce7";
      alertBox.style.color = "#166534";
      alertBox.textContent = `✓ Saved "${name}" to catalog!`;
      setTimeout(() => { alertBox.style.display = "none"; }, 2000);

      await window.refreshCatalogModalList();
      window.refreshPageCatalogDropdowns();
    });
  }

  // Refresh items listed inside Catalog Modal
  window.refreshCatalogModalList = async function () {
    const tbody = document.getElementById("catalogTableBody");
    const countEl = document.getElementById("catTotalCount");
    const emptyMsg = document.getElementById("catalogEmptyMsg");
    if (!tbody) return;

    tbody.innerHTML = "";
    let items = JSON.parse(localStorage.getItem("invozap_catalog") || "[]");

    const { token } = getAuth();
    if (token) {
      try {
        const res = await fetch("/api/catalog", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.items)) {
          items = data.items;
          localStorage.setItem("invozap_catalog", JSON.stringify(items));
        }
      } catch (e) {}
    }

    if (countEl) countEl.textContent = String(items.length);

    if (items.length === 0) {
      emptyMsg.style.display = "block";
      return;
    }
    emptyMsg.style.display = "none";

    items.forEach((item, index) => {
      const tr = document.createElement("tr");
      tr.style.cssText = "border-bottom: 1px solid #f1f5f9;";

      tr.innerHTML = `
        <td style="padding: 8px 10px; font-weight: 600; color: #1e293b;">
          ${esc(item.name)}
          ${item.hsnSac ? `<br><small style="color: #64748b; font-size: 10px;">HSN/SAC: ${esc(item.hsnSac)}</small>` : ""}
        </td>
        <td style="padding: 8px 10px; color: #64748b;">${esc(item.unit || "unit")}</td>
        <td style="padding: 8px 10px; font-weight: 600; color: #0f172a;">₹${Number(item.defaultPrice || 0).toLocaleString("en-IN")}</td>
        <td style="padding: 8px 10px; color: #64748b;">${item.defaultTaxRate !== undefined ? item.defaultTaxRate : 18}%</td>
        <td style="padding: 8px 10px; text-align: center;">
          <button type="button" class="btn-del-cat-item" data-index="${index}" data-id="${item._id || ''}" style="background: none; border: none; color: #dc2626; cursor: pointer; font-size: 14px; padding: 2px 6px;">✕</button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    // Attach delete listeners
    tbody.querySelectorAll(".btn-del-cat-item").forEach(btn => {
      btn.addEventListener("click", async function () {
        const idx = Number(this.getAttribute("data-index"));
        const id = this.getAttribute("data-id");

        let current = JSON.parse(localStorage.getItem("invozap_catalog") || "[]");
        current.splice(idx, 1);
        localStorage.setItem("invozap_catalog", JSON.stringify(current));

        if (id && token) {
          try {
            await fetch(`/api/catalog/${id}`, {
              method: "DELETE",
              headers: { "Authorization": `Bearer ${token}` }
            });
          } catch (e) {}
        }

        await window.refreshCatalogModalList();
        window.refreshPageCatalogDropdowns();
      });
    });
  };

  // Synchronize any catalog select dropdowns on the active page
  window.refreshPageCatalogDropdowns = function () {
    const catalogSelect = document.getElementById("catalogItemSelect");
    if (!catalogSelect) return;

    const items = JSON.parse(localStorage.getItem("invozap_catalog") || "[]");
    catalogSelect.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "-- Select a saved item --";
    catalogSelect.appendChild(placeholder);

    items.forEach((item, index) => {
      const opt = document.createElement("option");
      opt.value = String(index);
      opt.textContent = `${item.name} — ₹${Number(item.defaultPrice || 0).toLocaleString("en-IN")}`;
      catalogSelect.appendChild(opt);
    });
  };

  window.openCatalogModal = async function () {
    injectCatalogModal();
    const modal = document.getElementById("invozapCatalogModal");
    if (modal) modal.style.display = "flex";
    await window.refreshCatalogModalList();
  };

  // =========================================================================
  // 3. BUSINESS PROFILE & PERSONAL SETTINGS MODAL
  // =========================================================================
  function injectOnboardingModal() {
    if (document.getElementById("businessProfileModal")) return;

    const modalHtml = `
      <div id="businessProfileModal" style="display: none; position: fixed; inset: 0; z-index: 9999; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(5px); align-items: center; justify-content: center; padding: 16px; overflow-y: auto;">
        <div style="background: #ffffff; border-radius: 20px; max-width: 620px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 32px 28px; box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25); border: 1px solid #e2e8f0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif;">
          
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
            <div>
              <div style="display: inline-flex; align-items: center; gap: 6px; background: #eff6ff; color: #2563eb; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; margin-bottom: 8px; border: 1px solid #dbeafe;">
                ⚡ PROFILE & BUSINESS SETUP
              </div>
              <h2 id="modalProfileTitle" style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">Edit Profile & Business Details</h2>
              <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">Personalize your profile, business details, GSTIN, and instant UPI QR payments.</p>
            </div>
            <button type="button" id="closeProfileModalX" style="background: none; border: none; font-size: 20px; color: #94a3b8; cursor: pointer; padding: 4px;">✕</button>
          </div>

          <div id="profileAlert" style="display: none; padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 16px;"></div>

          <form id="businessProfileForm" style="display: flex; flex-direction: column; gap: 16px;">
            
            <!-- SECTION 1: PERSONAL & BUSINESS IDENTITY -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
              <span style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 10px;">1. Personal & Business Identity</span>
              
              <div style="margin-bottom: 12px;">
                <label style="font-size: 12px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Your Full Name *</label>
                <input type="text" id="bpPersonalName" placeholder="e.g. Mohit Sharma" required style="width: 100%; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 13px; box-sizing: border-box;">
              </div>

              <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 12px; margin-bottom: 12px;">
                <div>
                  <label style="font-size: 12px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Business / Trade Name</label>
                  <input type="text" id="bpName" placeholder="e.g. Acme Web Studio" style="width: 100%; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 13px; box-sizing: border-box;">
                </div>
                <div>
                  <label style="font-size: 12px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Tagline / Subtitle</label>
                  <input type="text" id="bpTagline" placeholder="e.g. Design & Consulting" style="width: 100%; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 13px; box-sizing: border-box;">
                </div>
              </div>

              <div>
                <label style="font-size: 12px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Registered Business Address</label>
                <textarea id="bpAddress" rows="2" placeholder="Street address, city, state, pincode" style="width: 100%; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 13px; box-sizing: border-box; resize: vertical;"></textarea>
              </div>
            </div>

            <!-- SECTION 2: TAX & GST COMPLIANCE -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
              <span style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 10px;">2. GST & Tax Compliance</span>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                  <label style="font-size: 12px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">GSTIN (Optional)</label>
                  <input type="text" id="bpGstin" maxlength="15" placeholder="e.g. 27AAPFU0939F1ZV" style="width: 100%; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 13px; text-transform: uppercase; font-family: monospace; box-sizing: border-box;">
                  <small id="bpGstFeedback" style="font-size: 11px; color: #64748b; margin-top: 2px; display: block;">15-character GST identification</small>
                </div>
                <div>
                  <label style="font-size: 12px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Business State (POS Origin) *</label>
                  <select id="bpState" style="width: 100%; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 13px; box-sizing: border-box; background: #fff;">
                    ${INDIAN_STATES.map(s => `<option value="${s.code}">${s.name}</option>`).join("")}
                  </select>
                </div>
              </div>
            </div>

            <!-- SECTION 3: PAYMENTS & BANKING -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
              <span style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 10px;">3. Payment & Settlement Details</span>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                <div>
                  <label style="font-size: 12px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">UPI ID (VPA for QR Code)</label>
                  <input type="text" id="bpUpi" placeholder="e.g. yourname@okhdfcbank" style="width: 100%; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 13px; box-sizing: border-box;">
                </div>
                <div>
                  <label style="font-size: 12px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Phone / WhatsApp Number</label>
                  <input type="text" id="bpPhone" placeholder="e.g. +91 98765 43210" style="width: 100%; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 13px; box-sizing: border-box;">
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1.2fr 1fr; gap: 12px;">
                <div>
                  <label style="font-size: 12px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Bank Name</label>
                  <input type="text" id="bpBankName" placeholder="e.g. HDFC Bank" style="width: 100%; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 13px; box-sizing: border-box;">
                </div>
                <div>
                  <label style="font-size: 12px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Account Number</label>
                  <input type="text" id="bpAccountNum" placeholder="e.g. 50100123456789" style="width: 100%; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 13px; box-sizing: border-box;">
                </div>
                <div>
                  <label style="font-size: 12px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">IFSC Code</label>
                  <input type="text" id="bpIfsc" maxlength="11" placeholder="e.g. HDFC0001234" style="width: 100%; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 13px; text-transform: uppercase; box-sizing: border-box;">
                </div>
              </div>
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 8px;">
              <button type="button" id="btnSkipOnboarding" style="background: none; border: none; color: #64748b; font-size: 13px; font-weight: 600; cursor: pointer; padding: 8px 12px;">Skip for now</button>
              
              <div style="display: flex; gap: 10px;">
                <button type="button" id="btnCancelProfileModal" style="background: #f1f5f9; border: 1px solid #cbd5e1; color: #475569; padding: 10px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;">Cancel</button>
                <button type="submit" id="btnSaveBusinessProfile" style="background: #2563eb; border: none; color: #ffffff; padding: 10px 22px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">💾 Save Details</button>
              </div>
            </div>

          </form>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);

    const modal = document.getElementById("businessProfileModal");
    const form = document.getElementById("businessProfileForm");
    const closeX = document.getElementById("closeProfileModalX");
    const btnCancel = document.getElementById("btnCancelProfileModal");
    const btnSkip = document.getElementById("btnSkipOnboarding");
    const gstinInput = document.getElementById("bpGstin");
    const stateSelect = document.getElementById("bpState");
    const gstFeedback = document.getElementById("bpGstFeedback");
    const alertBox = document.getElementById("profileAlert");

    function closeModal() {
      sessionStorage.setItem("invozap_onboarding_dismissed", "true");
      modal.style.display = "none";
    }

    closeX.addEventListener("click", closeModal);
    btnCancel.addEventListener("click", closeModal);
    btnSkip.addEventListener("click", () => {
      sessionStorage.setItem("invozap_onboarding_dismissed", "true");
      closeModal();
    });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    // Auto-detect state code from GSTIN input
    gstinInput.addEventListener("input", () => {
      const gstin = gstinInput.value.trim().toUpperCase();
      gstinInput.value = gstin;
      if (gstin.length >= 2) {
        const prefix = gstin.slice(0, 2);
        const match = Array.from(stateSelect.options).find(o => o.value === prefix);
        if (match) {
          stateSelect.value = prefix;
          gstFeedback.textContent = `✓ Auto-detected state: ${match.textContent}`;
          gstFeedback.style.color = "#16a34a";
        }
      } else {
        gstFeedback.textContent = "15-character GST identification";
        gstFeedback.style.color = "#64748b";
      }
    });

    // Submit & Save Profile
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const { token } = getAuth();
      if (!token) {
        alert("Please sign in to save your profile.");
        return;
      }

      const personalName = document.getElementById("bpPersonalName").value.trim();
      const payload = {
        name: personalName,
        businessName: document.getElementById("bpName").value.trim(),
        tagline: document.getElementById("bpTagline").value.trim(),
        address: document.getElementById("bpAddress").value.trim(),
        gstin: document.getElementById("bpGstin").value.trim().toUpperCase(),
        stateCode: document.getElementById("bpState").value,
        upiId: document.getElementById("bpUpi").value.trim(),
        phone: document.getElementById("bpPhone").value.trim(),
        bankName: document.getElementById("bpBankName").value.trim(),
        accountNumber: document.getElementById("bpAccountNum").value.trim(),
        ifscCode: document.getElementById("bpIfsc").value.trim().toUpperCase(),
        onboardingCompleted: true,
      };

      const saveBtn = document.getElementById("btnSaveBusinessProfile");
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";

      try {
        const res = await fetch("/api/auth/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        saveBtn.disabled = false;
        saveBtn.textContent = "💾 Save Details";

        if (!res.ok) {
          alertBox.style.display = "block";
          alertBox.className = "auth-alert error";
          alertBox.textContent = data.message || "Failed to save profile.";
          return;
        }

        // Update local storage user profile
        localStorage.setItem("invozap_user", JSON.stringify(data.user));
        sessionStorage.setItem("invozap_onboarding_dismissed", "true");

        // Re-render Navbar Profile
        renderNavbarProfile();

        // Apply immediately to current invoice/quotation editor
        applyBusinessProfileToPage(data.user.businessProfile, data.user);

        alertBox.style.display = "block";
        alertBox.className = "auth-alert success";
        alertBox.textContent = "✓ Details saved successfully!";

        setTimeout(() => {
          closeModal();
          alertBox.style.display = "none";
        }, 800);

      } catch (err) {
        saveBtn.disabled = false;
        saveBtn.textContent = "💾 Save Details";
        alertBox.style.display = "block";
        alertBox.className = "auth-alert error";
        alertBox.textContent = "Network error. Please try again.";
      }
    });
  }

  // Open modal and pre-fill form
  window.openBusinessProfileModal = function (isInitialOnboarding = false) {
    injectOnboardingModal();
    const modal = document.getElementById("businessProfileModal");
    const { user } = getAuth();
    const bp = (user && user.businessProfile) || {};

    const titleEl = document.getElementById("modalProfileTitle");
    if (titleEl) {
      titleEl.textContent = isInitialOnboarding
        ? `Welcome to InvoZap, ${user?.name ? user.name.split(" ")[0] : "there"}! 🎉`
        : "Edit Personal & Business Details";
    }

    const personalNameInput = document.getElementById("bpPersonalName");
    if (personalNameInput) personalNameInput.value = user?.name || "";

    document.getElementById("bpName").value = bp.businessName || "";
    document.getElementById("bpTagline").value = bp.tagline || "";
    document.getElementById("bpAddress").value = bp.address || "";
    document.getElementById("bpGstin").value = bp.gstin || "";
    if (bp.stateCode) document.getElementById("bpState").value = bp.stateCode;
    document.getElementById("bpUpi").value = bp.upiId || "";
    document.getElementById("bpPhone").value = bp.phone || "";
    document.getElementById("bpBankName").value = bp.bankName || "";
    document.getElementById("bpAccountNum").value = bp.accountNumber || "";
    document.getElementById("bpIfsc").value = bp.ifscCode || "";

    modal.style.display = "flex";
  };

  // Expose renderNavbarProfile globally
  window.renderNavbarProfile = renderNavbarProfile;

  // Auto-init on page load
  document.addEventListener("DOMContentLoaded", () => {
    injectOnboardingModal();
    injectCatalogModal();
    renderNavbarProfile();

    const { token, user } = getAuth();
    if (!token || !user) return;

    // Apply saved business profile to the editor immediately
    if (user.businessProfile) {
      applyBusinessProfileToPage(user.businessProfile, user);
    }
  });

})();
