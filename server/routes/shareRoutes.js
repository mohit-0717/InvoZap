// server/routes/shareRoutes.js
// Public Invoice Share Links with SHA-256 token hashing, whitelist DTO, and instant revocation

const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");
const ShareLink = require("../models/ShareLink");
const Invoice = require("../models/Invoice");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Helper to hash raw share token with SHA-256
function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

// 1. POST /api/share/generate/:invoiceId (Generate or regenerate active share link)
router.post("/generate/:invoiceId", authMiddleware, async (req, res) => {
  try {
    const { invoiceId } = req.params;

    if (!mongoose.isValidObjectId(invoiceId)) {
      return res.status(400).json({ success: false, message: "Invalid invoice ID format." });
    }

    const invoice = await Invoice.findOne({
      _id: invoiceId,
      owner: req.user.id,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found or unauthorized.",
      });
    }

    // Protection: Drafts cannot be shared publicly (must be issued first)
    if (invoice.status === "Draft") {
      return res.status(400).json({
        success: false,
        message: "Draft invoices cannot be publicly shared. Please issue the invoice first.",
      });
    }

    // Protection: Voided invoices cannot be shared
    if (invoice.status === "Void") {
      return res.status(400).json({
        success: false,
        message: "Voided invoices cannot be shared.",
      });
    }

    // Revoke any previous active or expired links for this invoice so a fresh link can always be created
    await ShareLink.updateMany(
      { invoice: invoice._id, owner: req.user.id, isRevoked: false },
      { $set: { isRevoked: true } }
    );

    // Generate cryptographically random 32-byte (64-character hex) token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);

    const shareRecord = new ShareLink({
      invoice: invoice._id,
      owner: req.user.id,
      tokenHash,
      isRevoked: false,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    await shareRecord.save();

    const baseUrl = process.env.CLIENT_URL || "http://localhost:5000";
    // Security: Token placed in URL fragment (#) so it never leaks in Referer headers or server access logs
    const shareUrl = `${baseUrl}/shared.html#${rawToken}`;

    return res.status(201).json({
      success: true,
      message: "Share link generated successfully (valid for 30 days).",
      shareUrl,
      token: rawToken,
      expiresAt: shareRecord.expiresAt,
    });
  } catch (error) {
    console.error("Share Generation Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate share link.",
    });
  }
});

// 2. POST /api/share/revoke/:invoiceId (Revoke public link)
router.post("/revoke/:invoiceId", authMiddleware, async (req, res) => {
  try {
    const { invoiceId } = req.params;

    if (!mongoose.isValidObjectId(invoiceId)) {
      return res.status(400).json({ success: false, message: "Invalid invoice ID format." });
    }

    const result = await ShareLink.updateMany(
      { invoice: invoiceId, owner: req.user.id, isRevoked: false },
      { $set: { isRevoked: true } }
    );

    return res.status(200).json({
      success: true,
      message: "Share link has been revoked successfully.",
      revokedCount: result.modifiedCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to revoke share link.",
    });
  }
});

// 3. GET /api/share/status/:invoiceId (Check if invoice is currently shared)
router.get("/status/:invoiceId", authMiddleware, async (req, res) => {
  try {
    const { invoiceId } = req.params;

    if (!mongoose.isValidObjectId(invoiceId)) {
      return res.status(400).json({ success: false, message: "Invalid invoice ID format." });
    }

    const activeLink = await ShareLink.findOne({
      invoice: invoiceId,
      owner: req.user.id,
      isRevoked: false,
      expiresAt: { $gt: new Date() }, // Link must not be expired
    });

    return res.status(200).json({
      success: true,
      isShared: !!activeLink,
      expiresAt: activeLink ? activeLink.expiresAt : null,
      firstViewedAt: activeLink ? activeLink.firstViewedAt : null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error checking share status.",
    });
  }
});

// 4. GET /api/share/view/:token (PUBLIC: View read-only invoice via strict Whitelist DTO)
router.get("/view/:token", async (req, res) => {
  try {
    const { token } = req.params;

    // Strict validation: Token must be exactly 64 hexadecimal characters
    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or malformed share token format.",
      });
    }

    const tokenHash = hashToken(token);

    // Look up the active share link
    const shareRecord = await ShareLink.findOne({
      tokenHash,
      isRevoked: false,
    }).populate("invoice");

    if (!shareRecord || !shareRecord.invoice) {
      return res.status(404).json({
        success: false,
        message: "This invoice link is invalid or has been revoked by the issuer.",
      });
    }

    const inv = shareRecord.invoice;

    // Protection: Reject voided invoices
    if (inv.status === "Void") {
      return res.status(410).json({
        success: false,
        message: "This invoice has been voided by the issuer and is no longer payable.",
      });
    }

    // Check expiration
    if (shareRecord.expiresAt && new Date() > new Date(shareRecord.expiresAt)) {
      return res.status(410).json({
        success: false,
        message: "This invoice link has expired. Please contact the seller for an updated link.",
      });
    }

    // Set privacy and security response headers
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("X-Robots-Tag", "noindex, nofollow");

    // Whitelist DTO: Expose ONLY safe presentation fields.
    // Never leak database IDs, user IDs, internal tokens, or raw audit fields.
    const publicInvoiceDto = {
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.invoiceDate,
      dueDate: inv.dueDate,
      status: inv.status,
      currency: inv.currency,
      themeColor: inv.themeColor,
      seller: {
        businessName: inv.sellerDetails?.businessName || "",
        tagline: inv.sellerDetails?.tagline || "",
        address: inv.sellerDetails?.address || "",
        email: inv.sellerDetails?.email || "",
        phone: inv.sellerDetails?.phone || "",
        upiId: inv.sellerDetails?.upiId || "",
        gstin: inv.sellerDetails?.gstin || "",
        stateCode: inv.sellerDetails?.stateCode || "",
      },
      client: {
        clientName: inv.clientDetails?.clientName || "Client",
        address: inv.clientDetails?.address || "",
        gstin: inv.clientDetails?.gstin || "",
        stateCode: inv.clientDetails?.stateCode || "",
      },
      items: (inv.items || []).map((i) => ({
        description: i.description,
        quantity: i.quantity,
        price: i.price,
        rowTotal: i.rowTotal,
      })),
      regime: inv.regime || "none",
      subtotalPaise: inv.subtotalPaise || Math.round(inv.subtotal * 100),
      cgstPaise: inv.cgstPaise || 0,
      sgstPaise: inv.sgstPaise || 0,
      igstPaise: inv.igstPaise || 0,
      taxPaise: inv.taxPaise || Math.round(inv.taxAmount * 100),
      grandTotalPaise: inv.grandTotalPaise || Math.round(inv.grandTotal * 100),
      balanceDuePaise: typeof inv.balanceDuePaise === "number" ? inv.balanceDuePaise : Math.round((inv.balanceDue ?? inv.grandTotal) * 100),
      subtotal: inv.subtotal,
      taxRate: inv.taxRate,
      taxAmount: inv.taxAmount,
      grandTotal: inv.grandTotal,
      balanceDue: typeof inv.balanceDue === "number" ? inv.balanceDue : inv.grandTotal,
    };

    return res.status(200).json({
      success: true,
      invoice: publicInvoiceDto,
    });
  } catch (error) {
    console.error("Public Invoice View Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error retrieving public invoice.",
    });
  }
});

// 5. POST /api/share/viewed/:token (PUBLIC BEACON: Recipient first-opened beacon)
// Called by shared.html ONLY after user has had the page visible for >= 1 second.
// Prevents crawler/WhatsApp link unfurling previews from marking the invoice opened.
router.post("/viewed/:token", async (req, res) => {
  try {
    const { token } = req.params;

    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({ success: false, message: "Invalid token format." });
    }

    const tokenHash = hashToken(token);
    const link = await ShareLink.findOne({ tokenHash, isRevoked: false });

    if (!link) {
      return res.status(404).json({ success: false, message: "Active link not found." });
    }

    if (!link.firstViewedAt) {
      link.firstViewedAt = new Date();
      await link.save();
    }

    return res.status(200).json({ success: true, firstViewedAt: link.firstViewedAt });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Beacon record error." });
  }
});

module.exports = router;
