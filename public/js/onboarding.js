// public/js/onboarding.js
// Business Profile Onboarding Modal & Settings Controller
// Comprehensive Setup: Business Name, GSTIN, State, Address, Phone, UPI & Bank Details

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

  function injectOnboardingModal() {
    if (document.getElementById("businessProfileModal")) return;

    const modalHtml = `
      <div id="businessProfileModal" style="display: none; position: fixed; inset: 0; z-index: 9999; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(5px); align-items: center; justify-content: center; padding: 16px; overflow-y: auto;">
        <div style="background: #ffffff; border-radius: 20px; max-width: 620px; width: 100%; max-height: 90vh; overflow-y: auto; padding: 32px 28px; box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25); border: 1px solid #e2e8f0; font-family: 'Plus Jakarta Sans', system-ui, sans-serif;">
          
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
            <div>
              <div style="display: inline-flex; align-items: center; gap: 6px; background: #eff6ff; color: #2563eb; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; margin-bottom: 8px; border: 1px solid #dbeafe;">
                ⚡ BUSINESS SETUP
              </div>
              <h2 id="modalProfileTitle" style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">Set Up Your Business Profile</h2>
              <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">Personalize your invoices and quotations with your business details, GSTIN, and instant UPI QR payments.</p>
            </div>
            <button type="button" id="closeProfileModalX" style="background: none; border: none; font-size: 20px; color: #94a3b8; cursor: pointer; padding: 4px;">✕</button>
          </div>

          <div id="profileAlert" style="display: none; padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 16px;"></div>

          <form id="businessProfileForm" style="display: flex; flex-direction: column; gap: 16px;">
            
            <!-- SECTION 1: BUSINESS IDENTITY -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
              <span style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 10px;">1. Business Identity</span>
              
              <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 12px; margin-bottom: 12px;">
                <div>
                  <label style="font-size: 12px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Business / Trade Name *</label>
                  <input type="text" id="bpName" placeholder="e.g. Acme Web Studio or Mohit Sharma" required style="width: 100%; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 13px; box-sizing: border-box;">
                </div>
                <div>
                  <label style="font-size: 12px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Tagline / Subtitle</label>
                  <input type="text" id="bpTagline" placeholder="e.g. Design & Consulting" style="width: 100%; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 13px; box-sizing: border-box;">
                </div>
              </div>

              <div>
                <label style="font-size: 12px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Registered Business Address *</label>
                <textarea id="bpAddress" rows="2" placeholder="Street address, city, state, pincode" required style="width: 100%; padding: 9px 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 13px; box-sizing: border-box; resize: vertical;"></textarea>
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
                <button type="submit" id="btnSaveBusinessProfile" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); border: none; color: #ffffff; padding: 10px 22px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);">💾 Save & Apply to Invoices</button>
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
        alert("Please sign in to save your business profile.");
        return;
      }

      const payload = {
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
        saveBtn.textContent = "💾 Save & Apply to Invoices";

        if (!res.ok) {
          alertBox.style.display = "block";
          alertBox.className = "auth-alert error";
          alertBox.textContent = data.message || "Failed to save business profile.";
          return;
        }

        // Update local storage user profile
        localStorage.setItem("invozap_user", JSON.stringify(data.user));
        sessionStorage.setItem("invozap_onboarding_dismissed", "true");

        // Apply immediately to current invoice/quotation editor
        applyBusinessProfileToPage(data.user.businessProfile, data.user);

        alertBox.style.display = "block";
        alertBox.className = "auth-alert success";
        alertBox.textContent = "✓ Business profile saved! Pre-filling your invoices...";

        setTimeout(() => {
          closeModal();
          alertBox.style.display = "none";
        }, 900);

      } catch (err) {
        saveBtn.disabled = false;
        saveBtn.textContent = "💾 Save & Apply to Invoices";
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
        : "Edit Business Profile & Bank Details";
    }

    document.getElementById("bpName").value = bp.businessName || (user ? user.name : "");
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

  // Auto-init on page load
  document.addEventListener("DOMContentLoaded", () => {
    const { token, user } = getAuth();
    if (!token || !user) return;

    // Apply saved business profile to the editor immediately
    if (user.businessProfile) {
      applyBusinessProfileToPage(user.businessProfile, user);
    }

    // Add "⚙️ Business Setup" button to navbar
    const authNavWrap = document.getElementById("authNavWrap");
    if (authNavWrap) {
      const setupBtn = document.createElement("button");
      setupBtn.type = "button";
      setupBtn.id = "btnOpenBusinessSetup";
      setupBtn.style.cssText = "background: none; border: 1px solid #475569; color: #38bdf8; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer; margin-right: 8px;";
      setupBtn.textContent = "⚙️ Business Setup";
      setupBtn.addEventListener("click", () => {
        window.openBusinessProfileModal(false);
      });
      authNavWrap.prepend(setupBtn);
    }

    // Check if new user needs onboarding
    const needsOnboarding = !user.businessProfile || !user.businessProfile.onboardingCompleted;
    const isDismissed = sessionStorage.getItem("invozap_onboarding_dismissed");

    if (needsOnboarding && !isDismissed) {
      setTimeout(() => {
        window.openBusinessProfileModal(true);
      }, 500);
    }
  });

})();
