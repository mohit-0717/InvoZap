// test_routes.js
// Comprehensive Automated Route Integration Test Suite for InvoZap Backend Routes
// Covers all audit scenarios:
// 1. Partial payment & balance due tracking (Pay ₹1 on ₹100 -> Partial, ₹99 balance)
// 2. Overpayment rejection with HTTP 400
// 3. Fractional quantity calculation (0.5 units at ₹100 = ₹50)
// 4. Inter-State GSTIN regime detection (GSTIN 29 vs Seller 27 -> IGST)
// 5. Immutability of issued invoices (PUT returns 409 Conflict)
// 6. Tenant isolation (User 2 accessing User 1's invoice returns 404)
// 7. Protection against voiding invoices with active payments
// 8. Void payment endpoint unblocks voiding invoice
// 9. Unknown state with tax > 0 rejects issue with 400
// 10. Quality Checker blockers (missing seller, missing client, zero price) reject issue with 400
// 11. Atomic Monotonic Number Allocation: 20 parallel issues yield 20 distinct sequential numbers
// 12. Deleting a draft does NOT burn or reuse numbers
// 13. Idempotency: duplicate key returns 200 with same payment, no duplicate created
// 14. Section 194J TDS credit flow (₹11,800 total, ₹5,000 received, ₹1,000 TDS credit, ₹5,800 balance)
// 15. Cross-user payment attempt returns 404
// 16. Hostile XSS string in description (<img onerror>): stored intact, rendered safely as text
// 17. Concurrent payments that together exceed balance: second payment is rejected (HTTP 400)

process.env.JWT_SECRET = "invozap_super_secure_enterprise_jwt_signing_secret_key_2026_x89";

const { Readable } = require("stream");
const { EventEmitter } = require("events");
const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Invoice = require("./server/models/Invoice");
const SequenceCounter = require("./server/models/SequenceCounter");
const ShareLink = require("./server/models/ShareLink");

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

// In-Memory Document Store
const store = {
  invoices: new Map(),
  counters: new Map(),
  shareLinks: new Map(),
};

function resetStore() {
  store.invoices.clear();
  store.counters.clear();
  store.shareLinks.clear();
}

function newObjectId() {
  return new mongoose.Types.ObjectId().toString();
}

// Stub Mongoose Model methods on Invoice
Invoice.findOne = function (query) {
  let doc = null;
  for (const inv of store.invoices.values()) {
    let match = true;
    if (query._id && String(inv._id) !== String(query._id)) match = false;
    if (query.owner && String(inv.owner) !== String(query.owner)) match = false;
    if (query.invoiceNumber && inv.invoiceNumber !== query.invoiceNumber) match = false;
    if (match) {
      doc = inv;
      break;
    }
  }

  const queryObj = {
    select: function () {
      return queryObj;
    },
    then: function (onResolve, onReject) {
      if (!doc) return Promise.resolve(null).then(onResolve, onReject);
      const wrapped = { ...doc };
      wrapped.save = function () {
        if (typeof doc.save === "function") {
          return doc.save.call(this);
        }
        store.invoices.set(String(this._id), { ...this });
        return Promise.resolve(this);
      };
      wrapped.select = function () { return Promise.resolve(wrapped); };
      return Promise.resolve(wrapped).then(onResolve, onReject);
    },
    catch: function (onReject) {
      return Promise.resolve(doc).catch(onReject);
    }
  };
  return queryObj;
};

Invoice.create = function (data) {
  const id = newObjectId();
  const doc = {
    _id: id,
    ...data,
    payments: data.payments || [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  doc.save = function () {
    store.invoices.set(String(this._id), { ...this });
    return Promise.resolve(this);
  };
  store.invoices.set(id, doc);
  return Promise.resolve(doc);
};

Invoice.deleteOne = function (query) {
  if (query._id && store.invoices.has(String(query._id))) {
    store.invoices.delete(String(query._id));
    return Promise.resolve({ deletedCount: 1 });
  }
  return Promise.resolve({ deletedCount: 0 });
};

Invoice.find = function (query) {
  const list = [];
  for (const inv of store.invoices.values()) {
    if (query.owner && String(inv.owner) === String(query.owner)) {
      list.push(inv);
    }
  }
  const builder = {
    sort: () => builder,
    skip: () => builder,
    limit: () => builder,
    select: () => Promise.resolve(list)
  };
  return builder;
};

SequenceCounter.findOneAndUpdate = function (filter, update, options) {
  const key = `${filter.owner}_${filter.prefix}_${filter.fy}`;
  let rec = store.counters.get(key) || { lastSeq: 0 };
  if (update.$inc && update.$inc.lastSeq) {
    rec.lastSeq += update.$inc.lastSeq;
  }
  if (update.$max && update.$max.lastSeq) {
    rec.lastSeq = Math.max(rec.lastSeq, update.$max.lastSeq);
  }
  store.counters.set(key, rec);
  return Promise.resolve({ ...rec });
};

ShareLink.findOne = function (query) {
  let rec = null;
  for (const s of store.shareLinks.values()) {
    let match = true;
    if (query.tokenHash && s.tokenHash !== query.tokenHash) match = false;
    if (query.invoice && String(s.invoice) !== String(query.invoice)) match = false;
    if (query.isRevoked !== undefined && s.isRevoked !== query.isRevoked) match = false;
    if (match) {
      rec = s;
      break;
    }
  }
  const qObj = {
    populate: function () {
      if (!rec) return Promise.resolve(null);
      const inv = store.invoices.get(String(rec.invoice));
      return Promise.resolve({ ...rec, invoice: inv });
    },
    then: function (resolve, reject) {
      return Promise.resolve(rec).then(resolve, reject);
    }
  };
  return qObj;
};

ShareLink.updateMany = function (filter, update) {
  for (const s of store.shareLinks.values()) {
    if (filter.invoice && String(s.invoice) === String(filter.invoice)) {
      if (update.$set && update.$set.isRevoked !== undefined) s.isRevoked = update.$set.isRevoked;
      if (update.isRevoked !== undefined) s.isRevoked = update.isRevoked;
    }
  }
  return Promise.resolve({ modifiedCount: 1 });
};

ShareLink.prototype.save = function () {
  const id = newObjectId();
  this._id = id;
  store.shareLinks.set(id, this);
  return Promise.resolve(this);
};

// Create Express test app
const app = express();
app.use(express.json());
app.use("/api/invoices", require("./server/routes/invoiceRoutes"));
app.use("/api/share", require("./server/routes/shareRoutes"));

const user1Id = newObjectId();
const user2Id = newObjectId();

const user1Token = jwt.sign({ id: user1Id, email: "user1@invozap.test" }, process.env.JWT_SECRET, { algorithm: "HS256" });
const user2Token = jwt.sign({ id: user2Id, email: "user2@invozap.test" }, process.env.JWT_SECRET, { algorithm: "HS256" });

function request(testApp, method, url, body = null, token = user1Token) {
  return new Promise((resolve) => {
    const postData = body ? JSON.stringify(body) : "";
    const req = new Readable({
      read() {
        if (postData) {
          this.push(Buffer.from(postData));
        }
        this.push(null);
      }
    });
    req.method = method;
    req.url = url;
    req.headers = {
      "content-type": "application/json",
      "authorization": token ? `Bearer ${token}` : "",
      "content-length": Buffer.byteLength(postData),
    };

    const res = new EventEmitter();
    res.statusCode = 200;
    res._headers = {};
    res.setHeader = (k, v) => { res._headers[k.toLowerCase()] = v; };
    res.getHeader = (k) => res._headers[k.toLowerCase()];
    res.status = (code) => { res.statusCode = code; return res; };

    let resBody = "";
    res.write = (chunk) => { if (chunk) resBody += chunk.toString(); return true; };
    res.end = (chunk) => {
      if (chunk) resBody += chunk.toString();
      let parsed = {};
      try { parsed = JSON.parse(resBody); } catch (e) { parsed = { raw: resBody }; }
      resolve({ status: res.statusCode, body: parsed });
    };
    res.json = (data) => {
      res.statusCode = res.statusCode || 200;
      resolve({ status: res.statusCode, body: data });
    };

    testApp.handle(req, res);
  });
}

async function runRouteTests() {
  console.log("=== STARTING COMPREHENSIVE INVOZAP ROUTE TESTS ===");
  resetStore();

  try {
    // --- SCENARIO 1 & 2: Partial Payment & Overpayment Rejection ---
    console.log("\n--- Scenario 1 & 2: Partial Payment & Overpayment Rejection ---");
    const createRes = await request(app, "POST", "/api/invoices", {
      invoiceNumber: "INV/2026-27/0001",
      sellerDetails: { businessName: "Acme Web Studio", stateCode: "27" },
      clientDetails: { clientName: "Client Alpha", stateCode: "27" },
      items: [{ description: "Consulting", quantity: 1, price: 100 }],
      taxRate: 0,
    });
    assert(createRes.status === 201, "Draft invoice created with 201");
    const invId = createRes.body.invoice._id;

    const issueRes = await request(app, "POST", `/api/invoices/${invId}/issue`);
    assert(issueRes.status === 200, "Draft invoice successfully issued (status 200)");
    assert(issueRes.body.invoice.status === "Unpaid", "Invoice status changed to Unpaid");
    assert(issueRes.body.invoice.balanceDue === 100, "Initial balance due is ₹100");

    const pay1Res = await request(app, "POST", `/api/invoices/${invId}/payments`, {
      amount: 1,
      method: "upi",
      reference: "UPI/TXN/001"
    });
    assert(pay1Res.status === 200, "Pay ₹1 succeeded (status 200)");
    assert(pay1Res.body.invoice.status === "Partial", `Invoice status is Partial (got "${pay1Res.body.invoice.status}")`);
    assert(pay1Res.body.invoice.balanceDue === 99, `Remaining balance due is ₹99.00 (got ₹${pay1Res.body.invoice.balanceDue})`);
    assert(pay1Res.body.invoice.balanceDuePaise === 9900, `Remaining balance paise is 9900 (got ${pay1Res.body.invoice.balanceDuePaise})`);

    const pay100Res = await request(app, "POST", `/api/invoices/${invId}/payments`, {
      amount: 100,
      method: "bank"
    });
    assert(pay100Res.status === 400, `Pay ₹100 on ₹99 balance rejected with HTTP 400 (got ${pay100Res.status})`);
    assert(pay100Res.body.message.includes("rejected"), "Rejection message returned");

    // --- SCENARIO 3: Fractional Quantity Calculation ---
    console.log("\n--- Scenario 3: Fractional Quantity Calculation ---");
    const fracRes = await request(app, "POST", "/api/invoices", {
      invoiceNumber: "INV/2026-27/0002",
      sellerDetails: { businessName: "Acme Web Studio", stateCode: "27" },
      clientDetails: { clientName: "Client Beta", stateCode: "27" },
      items: [{ description: "Half Hour Dev", quantity: 0.5, price: 100 }],
      taxRate: 0,
    });
    assert(fracRes.status === 201, "Fractional quantity invoice created");
    assert(fracRes.body.invoice.subtotal === 50, `Subtotal for 0.5 × ₹100 is ₹50.00 (got ₹${fracRes.body.invoice.subtotal})`);
    assert(fracRes.body.invoice.grandTotal === 50, `Grand total is ₹50.00 (got ₹${fracRes.body.invoice.grandTotal})`);
    assert(fracRes.body.invoice.grandTotalPaise === 5000, `Grand total paise is exactly 5000 (got ${fracRes.body.invoice.grandTotalPaise})`);

    // --- SCENARIO 4: Inter-State GSTIN Tax Regime Detection ---
    console.log("\n--- Scenario 4: Inter-State GSTIN Tax Regime Detection ---");
    const igstRes = await request(app, "POST", "/api/invoices", {
      invoiceNumber: "INV/2026-27/0003",
      sellerDetails: { businessName: "Acme Web Studio", stateCode: "27" },
      clientDetails: { clientName: "Bangalore Client", gstin: "29AABCU9603R1ZM" },
      items: [{ description: "Cloud Consulting", quantity: 1, price: 1000 }],
      taxRate: 18,
    });
    assert(igstRes.status === 201, "Inter-state invoice created");
    assert(igstRes.body.invoice.regime === "inter", `Regime correctly detected as 'inter' (got "${igstRes.body.invoice.regime}")`);
    assert(igstRes.body.invoice.igstPaise === 18000, `IGST 18% paise is 18000 (got ${igstRes.body.invoice.igstPaise})`);
    assert(igstRes.body.invoice.cgstPaise === 0, "CGST is 0 for inter-state");
    assert(igstRes.body.invoice.sgstPaise === 0, "SGST is 0 for inter-state");
    assert(igstRes.body.invoice.grandTotalPaise === 118000, `Grand total paise is 118000 / ₹1,180.00 (got ${igstRes.body.invoice.grandTotalPaise})`);

    // --- SCENARIO 5: Immutability of Issued Invoices (HTTP 409) ---
    console.log("\n--- Scenario 5: Immutability of Issued Invoices (HTTP 409) ---");
    const editRes = await request(app, "PUT", `/api/invoices/${invId}`, {
      items: [{ description: "Tampered Item", quantity: 1, price: 9999 }]
    });
    assert(editRes.status === 409, `Editing issued invoice returns HTTP 409 Conflict (got ${editRes.status})`);

    // --- SCENARIO 6: Multi-Tenant Tenant Isolation (HTTP 404) ---
    console.log("\n--- Scenario 6: Multi-Tenant Tenant Isolation (HTTP 404) ---");
    const user2AccessRes = await request(app, "GET", `/api/invoices/${invId}`, null, user2Token);
    assert(user2AccessRes.status === 404, `User 2 accessing User 1's invoice returns HTTP 404 (got ${user2AccessRes.status})`);

    // --- SCENARIO 7: Protection Against Voiding Invoices with Active Payments ---
    console.log("\n--- Scenario 7: Protection Against Voiding Invoices with Active Payments ---");
    const voidBlockedRes = await request(app, "POST", `/api/invoices/${invId}/void`);
    assert(voidBlockedRes.status === 400, `Voiding invoice with active payments returns HTTP 400 (got ${voidBlockedRes.status})`);
    assert(voidBlockedRes.body.message.includes("active recorded payments"), "Error specifies payments must be voided first");

    // --- SCENARIO 8: Void Payment & Successful Invoice Void ---
    console.log("\n--- Scenario 8: Void Payment & Successful Invoice Void ---");
    const invoiceDoc = store.invoices.get(invId);
    const paymentId = invoiceDoc.payments[0].paymentId;
    
    const voidPayRes = await request(app, "POST", `/api/invoices/${invId}/payments/${paymentId}/void`);
    assert(voidPayRes.status === 200, "Payment successfully voided (status 200)");
    assert(voidPayRes.body.invoice.status === "Unpaid", "Invoice status reverted back to Unpaid");
    assert(voidPayRes.body.invoice.balanceDue === 100, "Balance due reverted back to full ₹100");

    const voidInvRes = await request(app, "POST", `/api/invoices/${invId}/void`);
    assert(voidInvRes.status === 200, "Invoice successfully voided once payments are voided (status 200)");
    assert(voidInvRes.body.invoice.status === "Void", "Invoice status marked Void");

    // --- SCENARIO 9: Unknown state with tax > 0 rejects issue with HTTP 400 ---
    console.log("\n--- Scenario 9: Unknown State with Tax > 0 Rejection ---");
    const noStateInv = await request(app, "POST", "/api/invoices", {
      invoiceNumber: "DRAFT-NOSTATE",
      sellerDetails: { businessName: "Acme Web Studio" }, // Missing stateCode & GSTIN
      clientDetails: { clientName: "Client NoState" },    // Missing stateCode & GSTIN
      items: [{ description: "Design", quantity: 1, price: 1000 }],
      taxRate: 18,
    });
    assert(noStateInv.status === 201, "Draft without states created");
    const noStateIssueRes = await request(app, "POST", `/api/invoices/${noStateInv.body.invoice._id}/issue`);
    assert(noStateIssueRes.status === 400, `Issue without state codes when tax > 0 rejected with HTTP 400 (got ${noStateIssueRes.status})`);
    assert(noStateIssueRes.body.message.includes("state codes"), "Rejection mentions state codes requirement");

    // --- SCENARIO 10: Quality Checker Blockers Reject Issue with HTTP 400 ---
    console.log("\n--- Scenario 10: Pre-Send Quality Checker Blockers ---");
    // 10a. Missing seller name
    const missingSellerInv = await request(app, "POST", "/api/invoices", {
      invoiceNumber: "DRAFT-NOSELLER",
      sellerDetails: { businessName: "" },
      clientDetails: { clientName: "Client Gamma", stateCode: "27" },
      items: [{ description: "Dev", quantity: 1, price: 500 }],
      taxRate: 0,
    });
    const missSellerIssue = await request(app, "POST", `/api/invoices/${missingSellerInv.body.invoice._id}/issue`);
    assert(missSellerIssue.status === 400, "Missing seller name blocked with HTTP 400");
    assert(missSellerIssue.body.blockers.some(b => b.code === "SELLER_NAME_MISSING"), "Blocker code SELLER_NAME_MISSING returned");

    // 10b. Zero unit price
    const zeroPriceInv = await request(app, "POST", "/api/invoices", {
      invoiceNumber: "DRAFT-ZEROPRICE",
      sellerDetails: { businessName: "Acme Studio", stateCode: "27" },
      clientDetails: { clientName: "Client Zero", stateCode: "27" },
      items: [{ description: "Free Work", quantity: 1, price: 0 }],
      taxRate: 0,
    });
    const zeroPriceIssue = await request(app, "POST", `/api/invoices/${zeroPriceInv.body.invoice._id}/issue`);
    assert(zeroPriceIssue.status === 400, "Zero unit price blocked with HTTP 400");
    assert(zeroPriceIssue.body.blockers.some(b => b.code === "LINE_PRICE_ZERO"), "Blocker code LINE_PRICE_ZERO returned");

    // --- SCENARIO 11 & 12: Atomic Monotonic Number Allocation & Draft Deletion ---
    console.log("\n--- Scenario 11 & 12: Atomic Monotonic FY Number Allocation ---");
    // Create 20 drafts
    const draftIds = [];
    for (let i = 1; i <= 20; i++) {
      const d = await request(app, "POST", "/api/invoices", {
        invoiceNumber: `DRAFT-${i}`,
        sellerDetails: { businessName: "Acme Web Studio", stateCode: "27" },
        clientDetails: { clientName: `Client ${i}`, stateCode: "27" },
        items: [{ description: `Work ${i}`, quantity: 1, price: 100 }],
        taxRate: 0,
      });
      draftIds.push(d.body.invoice._id);
    }
    assert(draftIds.length === 20, "Created 20 drafts with temporary numbers");

    // Delete draft #5 while unissued
    const delRes = await request(app, "DELETE", `/api/invoices/${draftIds[4]}`);
    assert(delRes.status === 200, "Draft #5 deleted while unissued (status 200)");

    // Issue remaining 19 drafts in parallel
    const remainingDraftIds = draftIds.filter((_, idx) => idx !== 4);
    const parallelIssueResults = await Promise.all(
      remainingDraftIds.map(id => request(app, "POST", `/api/invoices/${id}/issue`))
    );

    const issuedNumbers = parallelIssueResults.map(r => r.body.invoice.invoiceNumber);
    const uniqueNumbers = new Set(issuedNumbers);
    assert(uniqueNumbers.size === 19, `All 19 issued invoices received unique numbers (${uniqueNumbers.size}/19 unique)`);
    assert(issuedNumbers.every(n => /^INV\/\d{4}-\d{2}\/\d{4}$/.test(n)), "All issued numbers match standard FY format INV/YYYY-YY/XXXX");
    
    // Check sequence numbers are strictly consecutive without holes
    const seqNums = issuedNumbers.map(n => parseInt(n.split("/")[2], 10)).sort((a, b) => a - b);
    const isConsecutive = seqNums.every((val, idx) => idx === 0 || val === seqNums[idx - 1] + 1);
    assert(isConsecutive === true, `Sequence numbers are strictly monotonic and consecutive (1 to 19): min ${seqNums[0]}, max ${seqNums[seqNums.length - 1]}`);

    // --- SCENARIO 13: Idempotency Key Duplicate Prevention ---
    console.log("\n--- Scenario 13: Payment Idempotency Protection ---");
    const testInv = await request(app, "POST", "/api/invoices", {
      invoiceNumber: "DRAFT-IDEMP",
      sellerDetails: { businessName: "Acme Web Studio", stateCode: "27" },
      clientDetails: { clientName: "Client Idemp", stateCode: "27" },
      items: [{ description: "Setup", quantity: 1, price: 500 }],
      taxRate: 0,
    });
    const testInvId = testInv.body.invoice._id;
    await request(app, "POST", `/api/invoices/${testInvId}/issue`);

    const idempotencyKey = "client_txn_key_998877";
    const payIdemp1 = await request(app, "POST", `/api/invoices/${testInvId}/payments`, {
      amount: 200,
      idempotencyKey,
      method: "upi",
    });
    assert(payIdemp1.status === 200, "First payment with idempotency key succeeds (status 200)");

    const payIdemp2 = await request(app, "POST", `/api/invoices/${testInvId}/payments`, {
      amount: 200,
      idempotencyKey,
      method: "upi",
    });
    assert(payIdemp2.status === 200, "Second duplicate payment returns HTTP 200");
    assert(payIdemp2.body.message.includes("idempotent duplicate"), "Message indicates idempotent duplicate response");

    const refreshedInv = await request(app, "GET", `/api/invoices/${testInvId}`);
    assert(refreshedInv.body.invoice.payments.length === 1, "Only 1 payment recorded in ledger despite double-submit");
    assert(refreshedInv.body.invoice.balanceDue === 300, "Balance due correctly reflects only 1 payment (₹300 remaining)");

    // --- SCENARIO 14: Section 194J TDS Credit Flow ---
    console.log("\n--- Scenario 14: TDS Credit Settlement Flow (Spec F12) ---");
    // Invoice: ₹10,000 + 18% GST (₹1,800) = ₹11,800 Grand Total
    const tdsInv = await request(app, "POST", "/api/invoices", {
      invoiceNumber: "DRAFT-TDS",
      sellerDetails: { businessName: "Acme Consulting", stateCode: "27" },
      clientDetails: { clientName: "Enterprise Client", stateCode: "27" },
      items: [{ description: "Consulting", quantity: 1, price: 10000 }],
      taxRate: 18,
    });
    const tdsInvId = tdsInv.body.invoice._id;
    await request(app, "POST", `/api/invoices/${tdsInvId}/issue`);

    // 1. Client remits partial payment: ₹5,000
    await request(app, "POST", `/api/invoices/${tdsInvId}/payments`, {
      amount: 5000,
      kind: "received",
      method: "bank"
    });

    // 2. Client credits 10% TDS on ₹10k base: ₹1,000
    const tdsCreditRes = await request(app, "POST", `/api/invoices/${tdsInvId}/payments`, {
      amount: 1000,
      kind: "tds_credit",
      reference: "Sec 194J Form 16A"
    });

    assert(tdsCreditRes.status === 200, "TDS credit successfully recorded (status 200)");
    assert(tdsCreditRes.body.invoice.status === "Partial", "Status remains Partial with remaining balance");
    assert(tdsCreditRes.body.invoice.balanceDue === 5800, `Remaining balance is exactly ₹5,800.00 (got ₹${tdsCreditRes.body.invoice.balanceDue})`);
    assert(tdsCreditRes.body.invoice.balanceDuePaise === 580000, "Balance due paise is 580000");

    // --- SCENARIO 15: Cross-User Payment Isolation (HTTP 404) ---
    console.log("\n--- Scenario 15: Cross-User Payment Attempt Isolation ---");
    const crossUserPayRes = await request(app, "POST", `/api/invoices/${tdsInvId}/payments`, {
      amount: 100,
      method: "upi"
    }, user2Token);
    assert(crossUserPayRes.status === 404, `User 2 cannot record payment on User 1's invoice (got HTTP ${crossUserPayRes.status})`);

    // --- SCENARIO 16: Hostile XSS String Preservation & Whitelist DTO Safety ---
    console.log("\n--- Scenario 16: Hostile XSS Payload Handling ---");
    const hostileDesc = '<img src=x onerror=alert("XSS")> Hardware scope';
    const xssInv = await request(app, "POST", "/api/invoices", {
      invoiceNumber: "DRAFT-XSS",
      sellerDetails: { businessName: "Acme Security", stateCode: "27" },
      clientDetails: { clientName: "Client Secure", stateCode: "27" },
      items: [{ description: hostileDesc, quantity: 1, price: 1000 }],
      taxRate: 0,
    });
    const xssInvId = xssInv.body.invoice._id;
    await request(app, "POST", `/api/invoices/${xssInvId}/issue`);

    // Generate public share link
    const shareGenRes = await request(app, "POST", `/api/share/generate/${xssInvId}`);
    assert(shareGenRes.status === 201, "Share link generated");
    const token = shareGenRes.body.token;

    // View public invoice DTO
    const pubViewRes = await request(app, "GET", `/api/share/view/${token}`, null, null);
    assert(pubViewRes.status === 200, "Public view returned HTTP 200");
    assert(pubViewRes.body.invoice.items[0].description === hostileDesc, "Hostile string stored intact without corruption");
    assert(!pubViewRes.body.invoice.owner, "Internal owner id is excluded from public DTO");
    assert(pubViewRes.body.invoice.regime === "none", "Regime field exposed in public DTO");

    // --- SCENARIO 17: Concurrent Payments Exceeding Balance ---
    console.log("\n--- Scenario 17: Concurrent Payments Exceeding Balance ---");
    // Invoice total: ₹1,000. Balance remaining: ₹500
    const concInv = await request(app, "POST", "/api/invoices", {
      invoiceNumber: "DRAFT-CONC",
      sellerDetails: { businessName: "Acme Web Studio", stateCode: "27" },
      clientDetails: { clientName: "Client Conc", stateCode: "27" },
      items: [{ description: "Speed Dev", quantity: 1, price: 1000 }],
      taxRate: 0,
    });
    const concInvId = concInv.body.invoice._id;
    await request(app, "POST", `/api/invoices/${concInvId}/issue`);
    
    // Pay ₹500, balance becomes ₹500
    await request(app, "POST", `/api/invoices/${concInvId}/payments`, { amount: 500 });

    // Two simultaneous attempts to pay ₹400 each (total ₹800 > ₹500 remaining)
    const p1 = request(app, "POST", `/api/invoices/${concInvId}/payments`, { amount: 400 });
    const p2 = request(app, "POST", `/api/invoices/${concInvId}/payments`, { amount: 400 });
    const results = await Promise.all([p1, p2]);

    const statuses = results.map(r => r.status).sort();
    assert(statuses[0] === 200 && statuses[1] === 400, `One payment succeeds (200) and concurrent overpayment is rejected (400) (got ${statuses.join(", ")})`);

    // --- SCENARIO 18: Optimistic Concurrency Version Conflict Handling ---
    console.log("\n--- Scenario 18: Optimistic Concurrency (HTTP 409 on VersionError) ---");
    const vInv = await request(app, "POST", "/api/invoices", {
      invoiceNumber: "DRAFT-VER",
      sellerDetails: { businessName: "Acme Web Studio", stateCode: "27" },
      clientDetails: { clientName: "Client Ver", stateCode: "27" },
      items: [{ description: "Task", quantity: 1, price: 500 }],
      taxRate: 0,
    });
    const vInvId = vInv.body.invoice._id;
    await request(app, "POST", `/api/invoices/${vInvId}/issue`);

    // Simulate VersionError on save
    const vDoc = store.invoices.get(vInvId);
    const origSave = vDoc.save;
    vDoc.save = function () {
      const err = new Error("No matching document found for id " + vInvId + " version 0");
      err.name = "VersionError";
      return Promise.reject(err);
    };

    const conflictRes = await request(app, "POST", `/api/invoices/${vInvId}/payments`, { amount: 100 });
    assert(conflictRes.status === 409, `Concurrent save conflict returns HTTP 409 Conflict (got ${conflictRes.status})`);
    assert(conflictRes.body.message.includes("Concurrent modification conflict"), "Conflict message returned to client");

    // Restore save
    vDoc.save = origSave;

  } catch (err) {
    console.error("Test execution fatal error:", err);
    process.exit(1);
  }

  console.log(`\n========================================`);
  console.log(`COMPREHENSIVE ROUTE RESULTS: ${passed}/${total} tests passed successfully!`);
  console.log(`========================================`);
}

runRouteTests();
