// public/js/onboarding.js
// Business Profile, Personal Settings, and Simple Navbar Profile Dropdown

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
      signInLink.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-log-in"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg> Sign In`;
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
    chevron.style.cssText = "display: inline-flex; align-items: center; margin-left: 2px;";
    chevron.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down" style="color: #64748b;"><polyline points="6 9 12 15 18 9"/></svg>`;
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
    optProfile.style.cssText = "width: 100%; text-align: left; padding: 9px 14px; background: none; border: none; font-size: 13px; color: #334155; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 10px;";
    optProfile.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user" style="color: #475569; flex-shrink: 0;"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Personal & Business Details`;
    optProfile.addEventListener("mouseenter", () => { optProfile.style.background = "#f1f5f9"; });
    optProfile.addEventListener("mouseleave", () => { optProfile.style.background = "none"; });
    optProfile.addEventListener("click", () => {
      dropdownMenu.style.display = "none";
      window.openBusinessProfileModal(false);
    });
    dropdownMenu.appendChild(optProfile);

    // Divider
    const divider = document.createElement("div");
    divider.style.cssText = "height: 1px; background: #e2e8f0; margin: 4px 0;";
    dropdownMenu.appendChild(divider);

    // Option 3: Sign Out
    const optLogout = document.createElement("button");
    optLogout.type = "button";
    optLogout.style.cssText = "width: 100%; text-align: left; padding: 9px 14px; background: none; border: none; font-size: 13px; color: #dc2626; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 10px;";
    optLogout.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-log-out" style="color: #dc2626; flex-shrink: 0;"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg> Sign Out`;
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

  // Catalog feature removed in favor of Paste Items list. Stubs kept for safe compatibility.
  window.openCatalogModal = function () {};
  window.refreshCatalogModalList = async function () {};
  window.refreshPageCatalogDropdowns = function () {};

  // =========================================================================
  // 2. BUSINESS PROFILE & PERSONAL SETTINGS MODAL
  // =========================================================================
  function injectOnboardingModal() {
    if (document.getElementById("businessProfileModal")) return;

    const modalHtml = `
      <div id="businessProfileModal" style="display: none; position: fixed; inset: 0; z-index: 9999; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(5px); align-items: center; justify-content: center; padding: 16px; overflow-y: auto;">
        <div style="background: #ffffff; border-radius: 20px; max-width: 620px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 32px 28px; box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25); border: 1px solid #e2e8f0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif;">
          
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
            <div>
              <div style="display: inline-flex; align-items: center; gap: 6px; background: #eff6ff; color: #2563eb; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; margin-bottom: 8px; border: 1px solid #dbeafe;">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zap" style="vertical-align: -1px; margin-right: 3px;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>PROFILE & BUSINESS SETUP
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
                <button type="submit" id="btnSaveBusinessProfile" style="background: #2563eb; border: none; color: #ffffff; padding: 10px 22px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">Save Details</button>
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
        saveBtn.textContent = "Save Details";

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
        saveBtn.textContent = "Save Details";
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
        ? `Welcome to InvoZap, ${user?.name ? user.name.split(" ")[0] : "there"}!`
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
    renderNavbarProfile();

    const { token, user } = getAuth();
    if (!token || !user) return;

    // Apply saved business profile to the editor immediately
    if (user.businessProfile) {
      applyBusinessProfileToPage(user.businessProfile, user);
    }
  });

})();
