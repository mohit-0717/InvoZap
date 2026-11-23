/**
 * InvoZap - Automated Engine Suite Verification
 * Validates Spec F4, F5, F7, F8, F11
 */

const fs = require('fs');
const enginePath = fs.existsSync('./public/js/engine') ? './public/js/engine' : './js/engine';
const calc = require(`${enginePath}/calc.js`);
const upi = require(`${enginePath}/upi.js`);
const numbering = require(`${enginePath}/numbering.js`);
const checker = require(`${enginePath}/checker.js`);
const aiDraft = require(`${enginePath}/aiDraft.js`);

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

console.log('=== 1. TESTING FINANCIAL ENGINE (Spec F5) ===');
// Intra-state test (27 to 27 -> CGST 9% + SGST 9%)
const intraRes = calc.calculateFinancials({
  items: [{ description: 'Dev', quantity: 2, price: 1000 }],
  sellerStateCode: '27',
  buyerStateCode: '27'
});
assert(intraRes.regime === 'intra', 'Intra-state regime detected for matching 27');
assert(intraRes.totals.subtotalPaise === 200000, 'Subtotal integer paise is 200000 (₹2,000.00)');
assert(intraRes.totals.cgstPaise === 18000, 'CGST is 9% (₹180.00)');
assert(intraRes.totals.sgstPaise === 18000, 'SGST is 9% (₹180.00)');
assert(intraRes.totals.grandTotalPaise === 236000, 'Grand total is ₹2,360.00');

// Inter-state test (27 to 29 -> IGST 18%)
const interRes = calc.calculateFinancials({
  items: [{ description: 'Dev', quantity: 1, price: 5000 }],
  sellerStateCode: '27',
  buyerStateCode: '29'
});
assert(interRes.regime === 'inter', 'Inter-state regime detected for 27 -> 29');
assert(interRes.totals.igstPaise === 90000, 'IGST is 18% (₹900.00)');

console.log('\n=== 2. TESTING UPI QR ENGINE (Spec F11) ===');
const upiUri = upi.buildUpiUri({
  vpa: 'test@upi',
  payeeName: 'InvoZap',
  amount: 2360,
  invoiceNumber: 'INV/2026-27/0001'
});
assert(upiUri.includes('pa=test%40upi') || upiUri.includes('pa=test@upi'), 'URI includes encoded VPA');
assert(upiUri.includes('am=2360.00'), 'URI includes formatted amount 2360.00');

const qrSvg = upi.generateUpiQrSvg(upiUri, 120);
assert(qrSvg.startsWith('<svg') && qrSvg.endsWith('</svg>'), 'Generated valid standalone vector SVG QR');

console.log('\n=== 3. TESTING FY NUMBERING ENGINE (Spec F4) ===');
const fy = numbering.calculateIndianFinancialYear(new Date('2026-11-09'));
assert(fy === '2026-27', `FY for Nov 2026 is 2026-27 (got ${fy})`);
const nextInv = numbering.getNextDocumentNumber('invoice', [{ invoiceNumber: 'INV/2026-27/0001' }]);
assert(nextInv === 'INV/2026-27/0002', `Next sequence increments to 0002 (got ${nextInv})`);
const nextQt = numbering.getNextDocumentNumber('quotation', [{ quotationNumber: 'QT/2026-27/0004' }]);
assert(nextQt === 'QT/2026-27/0005', `Next quote sequence increments to 0005 (got ${nextQt})`);

console.log('\n=== 4. TESTING PRE-SEND CHECKER ENGINE (Spec F8) ===');
const checkDoc = {
  sellerDetails: { businessName: 'InvoZap Solutions' },
  clientDetails: { clientName: 'Acme Corp', gstin: '29ABCDE1234F1Z5' },
  buyerStateCode: '27', // Mismatch! GSTIN is 29
  dueDate: '', // Missing!
  upiDetails: { vpa: '' }, // Missing!
  items: [{ description: 'Landing Page', quantity: 1, price: 5000 }]
};
const audit = checker.inspectDocument(checkDoc);
assert(audit.canSend === true, 'No blockers present, document can be sent');
assert(audit.warnings.some(w => w.code === 'GSTIN_STATE_MISMATCH'), 'Detected GSTIN_STATE_MISMATCH warning');
assert(audit.warnings.some(w => w.code === 'NO_DUE_DATE'), 'Detected NO_DUE_DATE warning');
assert(audit.warnings.some(w => w.code === 'NO_PAYMENT_DETAILS'), 'Detected NO_PAYMENT_DETAILS warning');

console.log('\n=== 5. TESTING PASTE ITEMS LIST ENGINE ===');
const sampleItems = `2 ESP32 -- 410rs
LOAD CELL + HX711 -- 200rs
MPU6050 -- 150rs
3 BREAD BOARD (800 pin) -- 80rs
Jumper wires 2₹ per piece
2S BMS -- 70rs
VL53L0X -- 170rs`;

const parsedItems = aiDraft.parseItemsList(sampleItems);
assert(parsedItems.length === 7, `Extracted 7 line items (got ${parsedItems.length})`);
assert(parsedItems[0].quantity === 2 && parsedItems[0].description === 'ESP32' && parsedItems[0].price === 410, 'Parsed 2 ESP32 with ₹410');
assert(parsedItems[1].quantity === 1 && parsedItems[1].description === 'LOAD CELL + HX711' && parsedItems[1].price === 200, 'Parsed LOAD CELL + HX711 with ₹200');
assert(parsedItems[2].quantity === 1 && parsedItems[2].description === 'MPU6050' && parsedItems[2].price === 150, 'Parsed MPU6050 with ₹150');
assert(parsedItems[3].quantity === 3 && parsedItems[3].description === 'BREAD BOARD (800 pin)' && parsedItems[3].price === 80, 'Parsed 3 BREAD BOARD with ₹80');
assert(parsedItems[4].quantity === 1 && parsedItems[4].description === 'Jumper wires' && parsedItems[4].price === 2, 'Parsed Jumper wires with ₹2');
assert(parsedItems[5].quantity === 1 && parsedItems[5].description === '2S BMS' && parsedItems[5].price === 70, 'Parsed 2S BMS as component name with ₹70');

console.log('\n=== 6. TESTING NUMBERING INTEGRITY AFTER DELETE (Spec F4 & C4) ===');
// Simulated persistent storage adapter for Node test
const testStorage = {};
const mockStorage = {
  getItem: (k) => testStorage[k] || null,
  setItem: (k, v) => { testStorage[k] = String(v); }
};

// 1. Allocate up to INV/2026-27/0003
numbering.commitAllocatedSequence('invoice', 3, 'INV', '2026-11-09', mockStorage);
// 2. Existing records only has 0001 and 0002 (0003 was deleted)
const docsAfterDelete = [
  { invoiceNumber: 'INV/2026-27/0001' },
  { invoiceNumber: 'INV/2026-27/0002' }
];
const nextAllocated = numbering.getNextDocumentNumber('invoice', docsAfterDelete, 'INV', '2026-11-09', mockStorage);
assert(nextAllocated === 'INV/2026-27/0004', `Sequence NEVER reuses deleted 0003; increments to 0004 (got ${nextAllocated})`);

console.log('\n=== 7. TESTING ODD-PAISE ROUND-HALF-UP CALCULATION (Spec C1, C2 & U5) ===');
// Odd paise case 1: ₹10.55 taxable @ 18% Intra (9% CGST = 94.95 paise -> rounds to 95 paise)
const oddPaiseIntra = calc.calculateFinancials({
  items: [{ description: 'Odd item', quantity: 1, price: 10.55 }],
  taxMode: 'gst',
  taxRatePercent: 18,
  sellerStateCode: '27',
  buyerStateCode: '27'
});
assert(oddPaiseIntra.totals.subtotalPaise === 1055, 'Subtotal is exactly 1055 paise (₹10.55)');
assert(oddPaiseIntra.totals.cgstPaise === 95, `CGST 9% on 1055 rounds half-up from 94.95 to 95 paise (got ${oddPaiseIntra.totals.cgstPaise})`);
assert(oddPaiseIntra.totals.sgstPaise === 95, `SGST 9% on 1055 rounds half-up to 95 paise (got ${oddPaiseIntra.totals.sgstPaise})`);
assert(oddPaiseIntra.totals.grandTotalPaise === 1245, `Grand total is 1245 paise / ₹12.45 (got ${oddPaiseIntra.totals.grandTotalPaise})`);

// Odd paise case 2: ₹33.33 taxable @ 18% Inter (18% IGST = 599.94 paise -> rounds to 600 paise)
const oddPaiseInter = calc.calculateFinancials({
  items: [{ description: 'Odd item 2', quantity: 1, price: 33.33 }],
  taxMode: 'gst',
  taxRatePercent: 18,
  sellerStateCode: '27',
  buyerStateCode: '29'
});
assert(oddPaiseInter.totals.subtotalPaise === 3333, 'Subtotal is exactly 3333 paise (₹33.33)');
assert(oddPaiseInter.totals.igstPaise === 600, `IGST 18% on 3333 rounds half-up from 599.94 to 600 paise (got ${oddPaiseInter.totals.igstPaise})`);
assert(oddPaiseInter.totals.grandTotalPaise === 3933, `Grand total is 3933 paise / ₹39.33 (got ${oddPaiseInter.totals.grandTotalPaise})`);

console.log('\n=== 8. TESTING PAYMENTS & TDS SETTLEMENT MODEL (Spec F12) ===');
const testSettlement1 = calc.calculateSettlement({
  totalPaise: 3933,
  payments: [
    { paymentId: 'p1', kind: 'received', amountPaise: 2000, receivedOn: '2026-11-09', method: 'bank' }
  ]
});
assert(testSettlement1.paymentState === 'partial', 'State is partial when 2000/3933 is received');
assert(testSettlement1.balanceDuePaise === 1933, `Balance due is 1933 paise (got ${testSettlement1.balanceDuePaise})`);

// Realistic Section 194J TDS Case:
// ₹50,000 Consulting Fee + 18% GST (₹9,000) = ₹59,000 Total (5,900,000 paise).
// Client deducts 10% TDS on taxable value (₹5,000 = 500,000 paise).
// Client remits remaining ₹54,000 (5,400,000 paise) via NEFT/Bank.
const consultingTds = calc.calculateSettlement({
  totalPaise: 5900000,
  payments: [
    { paymentId: 'p_tds', kind: 'tds_credit', amountPaise: 500000, receivedOn: '2026-11-10', reference: 'Sec 194J 10% TDS' },
    { paymentId: 'p_bank', kind: 'received', amountPaise: 5400000, receivedOn: '2026-11-10', method: 'bank', reference: 'UTR99887766' }
  ]
});
assert(consultingTds.paymentState === 'paid', 'Full settlement achieved with ₹54,000 received + ₹5,000 TDS credit');
assert(consultingTds.tdsCreditedPaise === 500000, 'TDS credit of ₹5,000 accurately isolated in ledger');
assert(consultingTds.receivedPaise === 5400000, 'Direct bank receipt of ₹54,000 accurately isolated');
assert(consultingTds.balanceDuePaise === 0, 'Balance due is exactly 0 paise');

// Reject Overpayment Test (Spec F12 requirement)
const overpaymentAttempt = calc.calculateSettlement({
  totalPaise: 100000, // ₹1,000
  payments: [
    { paymentId: 'p_typo', kind: 'received', amountPaise: 150000, receivedOn: '2026-11-10', method: 'bank' } // Typo ₹1,500
  ]
});
assert(overpaymentAttempt.isOverpaid === true, 'Overpayment is detected and flagged');
assert(overpaymentAttempt.error === 'OVERPAYMENT_REJECTED', 'Overpayment is rejected rather than silently clamped to 0');

// Voided Payment Exclusion Test
const voidedPaymentTest = calc.calculateSettlement({
  totalPaise: 500000, // ₹5,000
  payments: [
    { paymentId: 'p_valid', kind: 'received', amountPaise: 200000, receivedOn: '2026-11-08' },
    { paymentId: 'p_bounced', kind: 'received', amountPaise: 300000, receivedOn: '2026-11-09', voidedAt: '2026-11-09T15:00:00Z', voidReason: 'Cheque bounced' }
  ]
});
assert(voidedPaymentTest.paymentState === 'partial', 'Voided bounced cheque is excluded from settlement');
assert(voidedPaymentTest.balanceDuePaise === 300000, 'Remaining balance due is ₹3,000 after excluding voided payment');

// Strict Object Signature Enforcement (Positional call throws TypeError)
let positionalThrew = false;
try {
  calc.calculateSettlement(1180000, [{ paymentId: 'p_pos', kind: 'received', amountPaise: 100 }]);
} catch (e) {
  if (e instanceof TypeError) positionalThrew = true;
}
assert(positionalThrew === true, 'calculateSettlement rejects positional arguments with TypeError');

const objectSettlement = calc.calculateSettlement({
  totalPaise: 1180000,
  payments: [{ paymentId: 'p_pos', kind: 'received', amountPaise: 100, receivedOn: '2026-11-10' }]
});
assert(objectSettlement.paymentState === 'partial', 'Object call calculateSettlement({ totalPaise, payments }) sets status to partial');
assert(objectSettlement.balanceDuePaise === 1179900, `Object call balance due is 1179900 paise (got ${objectSettlement.balanceDuePaise})`);

// Fractional Quantity Calculation (0.5 units at ₹100.00)
const fractionalQtyTest = calc.calculateFinancials({
  items: [{ description: 'Half Hour Consulting', quantity: 0.5, price: 100 }],
  taxRatePercent: 0
});
assert(fractionalQtyTest.totals.subtotalPaise === 5000, `Fractional quantity 0.5 at ₹100 computes exactly 5000 paise / ₹50.00 (got ${fractionalQtyTest.totals.subtotalPaise})`);
assert(fractionalQtyTest.totals.grandTotalPaise === 5000, 'Fractional quantity grand total is ₹50.00');

console.log('\n=== 9. TESTING GSTIN MOD-36 CHECK-DIGIT VALIDATION ===');
assert(calc.validateGstinChecksum('27AAPFU0939F1ZV') === true, 'Valid Maharashtra GSTIN (27AAPFU0939F1ZV) passes Mod 36 checksum');
assert(calc.validateGstinChecksum('27AAPFU0939F1ZX') === false, 'Tampered GSTIN checksum character (ending in X instead of V) fails validation');
assert(calc.validateGstinChecksum('INVALID_GSTIN') === false, 'Malformed GSTIN fails validation');

console.log('\n=== 10. TESTING FINANCIAL YEAR ROLLOVER (31 MARCH -> 1 APRIL IST) ===');
const marchLastDay = numbering.calculateIndianFinancialYear('2026-03-31');
const aprilFirstDay = numbering.calculateIndianFinancialYear('2026-04-01');
assert(marchLastDay === '2025-26', `31 March 2026 belongs to FY 2025-26 (got ${marchLastDay})`);
assert(aprilFirstDay === '2026-27', `1 April 2026 rolls over to FY 2026-27 (got ${aprilFirstDay})`);

// Rollover sequence allocation test:
const marchDocs = [{ invoiceNumber: 'INV/2025-26/0099' }];
const aprilNext = numbering.getNextDocumentNumber('invoice', marchDocs, 'INV', '2026-04-01');
assert(aprilNext === 'INV/2026-27/0001', `Sequence resets to 0001 upon crossing into new FY 2026-27 (got ${aprilNext})`);

console.log('\n=== 11. TESTING INDIAN CURRENCY AMOUNT IN WORDS (LAKHS & CRORES) ===');
const util = require('./public/js/util.js');

// 1. Zero amount
const wZero = util.rupeesToWords(0);
assert(wZero === 'Zero Rupees Only', `0 format: "${wZero}"`);

// 2. One paisa
const wOnePaisa = util.rupeesToWords(0.01);
assert(wOnePaisa === 'One Paisa Only', `0.01 (1 paisa) format: "${wOnePaisa}"`);
const wOnePaisaFromPaise = util.paiseToWords(1);
assert(wOnePaisaFromPaise === 'One Paisa Only', `1 paisa via paiseToWords: "${wOnePaisaFromPaise}"`);

// 3. One hundred
const w100 = util.rupeesToWords(100);
assert(w100 === 'One Hundred Rupees Only', `100 format: "${w100}"`);

// 4. One lakh (100,000)
const wLakh = util.rupeesToWords(100000);
assert(wLakh === 'One Lakh Rupees Only', `100,000 format: "${wLakh}"`);

// 5. One crore (10,000,000)
const wCrore = util.rupeesToWords(10000000);
assert(wCrore === 'One Crore Rupees Only', `10,000,000 format: "${wCrore}"`);

// 6. An amount with paise
const wPaise = util.rupeesToWords(11800.50);
assert(wPaise === 'Eleven Thousand Eight Hundred Rupees and Fifty Paise Only', `11800.50 format: "${wPaise}"`);

// 7. Large amount with paise
const wLarge = util.rupeesToWords(1542350.50);
assert(wLarge === 'Fifteen Lakh Forty Two Thousand Three Hundred and Fifty Rupees and Fifty Paise Only', `1542350.50 format: "${wLarge}"`);

console.log(`\n========================================`);
console.log(`RESULTS: ${passedTests}/${totalTests} tests passed successfully!`);
console.log(`========================================`);
