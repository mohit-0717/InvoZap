/**
 * InvoZap Utility Functions (public/js/util.js)
 * - Safe HTML entity escaping to eliminate Stored & DOM XSS
 * - Indian Currency Amount in Words (Crores, Lakhs, Thousands, Hundreds, Units & Paise)
 */

(function (root, factory) {
  if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = factory();
  } else {
    const exports = factory();
    root.esc = exports.esc;
    root.escAttr = exports.escAttr;
    root.rupeesToWords = exports.rupeesToWords;
    root.paiseToWords = exports.paiseToWords;
    root.InvoZapUtil = exports;
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /**
   * HTML Entity Escape helper
   * Neutralizes < > & " ' characters in dynamic strings before interpolation.
   */
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

  /**
   * Attribute escape helper
   */
  function escAttr(s) {
    return esc(s);
  }

  const ONES = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];

  const TENS = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  function convertTwoDigits(num) {
    if (num < 20) return ONES[num];
    const ten = Math.floor(num / 10);
    const unit = num % 10;
    return TENS[ten] + (unit ? " " + ONES[unit] : "");
  }

  function convertThreeDigits(num) {
    const hundred = Math.floor(num / 100);
    const remainder = num % 100;
    let res = "";
    if (hundred) {
      res += ONES[hundred] + " Hundred";
      if (remainder) res += " and ";
    }
    if (remainder) {
      res += convertTwoDigits(remainder);
    }
    return res;
  }

  /**
   * Converts an integer amount into Indian numbering system words (Lakhs & Crores).
   * Example: 11800 -> "Eleven Thousand Eight Hundred"
   * Example: 1542350 -> "Fifteen Lakh Forty Two Thousand Three Hundred and Fifty"
   */
  function numberToIndianWords(num) {
    if (num === 0) return "Zero";
    let n = Math.floor(num);

    const crore = Math.floor(n / 10000000);
    n %= 10000000;

    const lakh = Math.floor(n / 100000);
    n %= 100000;

    const thousand = Math.floor(n / 1000);
    n %= 1000;

    const remainder = n;

    const parts = [];

    if (crore) {
      parts.push(numberToIndianWords(crore) + " Crore");
    }
    if (lakh) {
      parts.push(convertTwoDigits(lakh) + " Lakh");
    }
    if (thousand) {
      parts.push(convertTwoDigits(thousand) + " Thousand");
    }
    if (remainder) {
      parts.push(convertThreeDigits(remainder));
    }

    return parts.join(" ").trim();
  }

  /**
   * Converts Rupee amounts into full statutory words format:
   * e.g. 11800.50 -> "Rupees Eleven Thousand Eight Hundred and Fifty Paise Only"
   * e.g. 5000 -> "Rupees Five Thousand Only"
   */
  function rupeesToWords(amount) {
    const num = Math.max(0, parseFloat(amount) || 0);
    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);

    let words = "Rupees " + numberToIndianWords(rupees);
    if (paise > 0) {
      words += " and " + convertTwoDigits(paise) + " Paise";
    }
    return words + " Only";
  }

  /**
   * Converts integer paise directly into words:
   * e.g. 1180050 paise -> "Rupees Eleven Thousand Eight Hundred and Fifty Paise Only"
   */
  function paiseToWords(totalPaise) {
    return rupeesToWords((parseInt(totalPaise, 10) || 0) / 100);
  }

  return {
    esc: esc,
    escAttr: escAttr,
    rupeesToWords: rupeesToWords,
    paiseToWords: paiseToWords
  };
});
