// Authenticated client directory. Profiles are reusable across invoices and quotations.

const express = require("express");
const mongoose = require("mongoose");
const Client = require("../models/Client");
const Invoice = require("../models/Invoice");
const AdjustmentNote = require("../models/AdjustmentNote");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

function normalizeName(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function profileFrom(body) {
  const clientName = String(body.clientName || body.name || "").trim().replace(/\s+/g, " ");
  return {
    clientName,
    normalizedName: normalizeName(clientName),
    address: String(body.address || "").trim().slice(0, 1000),
    email: String(body.email || "").trim().slice(0, 254),
    phone: String(body.phone || "").trim().slice(0, 40),
    gstin: String(body.gstin || body.gst || "").trim().toUpperCase().slice(0, 15),
    stateCode: String(body.stateCode || "").trim().slice(0, 2),
  };
}

router.get("/", async (req, res) => {
  try {
    const query = { owner: req.user.id };
    if (typeof req.query.search === "string" && req.query.search.trim()) {
      const safeSearch = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.clientName = { $regex: safeSearch, $options: "i" };
    }
    const clients = await Client.find(query).sort({ clientName: 1 }).select("-__v");
    return res.status(200).json({ success: true, clients });
  } catch (error) {
    console.error("List Clients Error:", error);
    return res.status(500).json({ success: false, message: "Failed to retrieve client profiles." });
  }
});

// Creates a profile or updates the matching profile name for this account.
router.post("/", async (req, res) => {
  try {
    const profile = profileFrom(req.body);
    if (!profile.clientName) {
      return res.status(400).json({ success: false, message: "Client name is required." });
    }

    const client = await Client.findOneAndUpdate(
      { owner: req.user.id, normalizedName: profile.normalizedName },
      { $set: profile, $setOnInsert: { owner: req.user.id } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).select("-__v");
    return res.status(200).json({ success: true, client });
  } catch (error) {
    console.error("Save Client Error:", error);
    return res.status(500).json({ success: false, message: "Failed to save client profile." });
  }
});

// A dated, account-level client ledger assembled from immutable invoice events.
async function generateClientStatement(client, req, res) {
  try {
    const escapedName = client.clientName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Only issued, non-void invoices appear on the statement of account
    const invoices = await Invoice.find({
      owner: req.user.id,
      status: { $nin: ["Void", "Draft"] },
      "clientDetails.clientName": { $regex: `^${escapedName}$`, $options: "i" },
    }).select("invoiceNumber invoiceDate grandTotal grandTotalPaise payments");

    const invoiceIds = invoices.map(invoice => invoice._id);
    const notes = invoiceIds.length
      ? await AdjustmentNote.find({ owner: req.user.id, invoice: { $in: invoiceIds } }).select("invoice noteNumber type amount amountPaise reason issuedAt")
      : [];
    const invoiceNumberById = new Map(invoices.map(invoice => [String(invoice._id), invoice.invoiceNumber]));
    const events = [];

    invoices.forEach(invoice => {
      events.push({
        date: invoice.invoiceDate,
        type: "Invoice",
        reference: invoice.invoiceNumber,
        description: "Invoice issued",
        debitPaise: invoice.grandTotalPaise ?? Math.round((invoice.grandTotal || 0) * 100),
        creditPaise: 0,
      });
      (invoice.payments || []).filter(payment => !payment.voidedAt).forEach(payment => {
        events.push({
          date: payment.receivedOn || payment.recordedAt,
          type: payment.kind === "tds_credit" ? "TDS Credit" : "Payment",
          reference: invoice.invoiceNumber,
          description: payment.reference ? `Ref: ${payment.reference}` : (payment.method ? `Payment via ${payment.method.toUpperCase()}` : "Payment received"),
          debitPaise: 0,
          creditPaise: payment.amountPaise ?? Math.round((payment.amount || 0) * 100),
        });
      });
    });

    notes.forEach(note => {
      const amountPaise = note.amountPaise ?? Math.round((note.amount || 0) * 100);
      events.push({
        date: note.issuedAt,
        type: note.type === "credit" ? "Credit Note" : "Debit Note",
        reference: note.noteNumber,
        description: `${invoiceNumberById.get(String(note.invoice)) || "Invoice"}: ${note.reason}`,
        debitPaise: note.type === "debit" ? amountPaise : 0,
        creditPaise: note.type === "credit" ? amountPaise : 0,
      });
    });

    const from = req.query.from ? new Date(`${req.query.from}T00:00:00.000Z`) : null;
    const to = req.query.to ? new Date(`${req.query.to}T23:59:59.999Z`) : null;
    if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime()))) {
      return res.status(400).json({ success: false, message: "Invalid statement date range." });
    }

    // Sort chronologically. If on same date, post debits before credits
    events.sort((a, b) => {
      const diff = new Date(a.date) - new Date(b.date);
      if (diff !== 0) return diff;
      const order = { Invoice: 1, "Debit Note": 2, "Credit Note": 3, Payment: 4, "TDS Credit": 5 };
      return (order[a.type] || 99) - (order[b.type] || 99);
    });

    let openingBalancePaise = 0;
    const entries = [];
    let periodDebitPaise = 0;
    let periodCreditPaise = 0;

    events.forEach(event => {
      const eventDate = new Date(event.date);
      const change = event.debitPaise - event.creditPaise;
      if (from && eventDate < from) {
        openingBalancePaise += change;
        return;
      }
      if (to && eventDate > to) return;

      periodDebitPaise += event.debitPaise;
      periodCreditPaise += event.creditPaise;

      entries.push({
        ...event,
        date: eventDate.toISOString().slice(0, 10),
        debit: event.debitPaise / 100,
        credit: event.creditPaise / 100,
      });
    });

    let runningBalancePaise = openingBalancePaise;
    entries.forEach(entry => {
      runningBalancePaise += entry.debitPaise - entry.creditPaise;
      entry.balancePaise = runningBalancePaise;
      entry.balance = runningBalancePaise / 100;
    });

    return res.status(200).json({
      success: true,
      client: {
        id: client._id || client.id || null,
        clientName: client.clientName,
        email: client.email || "",
        phone: client.phone || "",
        gstin: client.gstin || "",
        address: client.address || "",
      },
      from: req.query.from || null,
      to: req.query.to || null,
      openingBalancePaise,
      openingBalance: openingBalancePaise / 100,
      closingBalancePaise: runningBalancePaise,
      closingBalance: runningBalancePaise / 100,
      totalDebitPaise: periodDebitPaise,
      totalDebit: periodDebitPaise / 100,
      totalCreditPaise: periodCreditPaise,
      totalCredit: periodCreditPaise / 100,
      entries,
    });
  } catch (error) {
    console.error("Client Statement Error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate client statement." });
  }
}

// 1. GET /api/clients/statement?clientName=Acme
router.get("/statement", async (req, res) => {
  try {
    const clientName = String(req.query.clientName || "").trim();
    if (!clientName) {
      return res.status(400).json({ success: false, message: "Client name is required." });
    }

    // Lookup in directory first
    let client = await Client.findOne({
      owner: req.user.id,
      normalizedName: normalizeName(clientName),
    }).select("-__v");

    // If not found in directory, check if any invoices exist for this client name
    if (!client) {
      const escapedName = clientName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const inv = await Invoice.findOne({
        owner: req.user.id,
        "clientDetails.clientName": { $regex: `^${escapedName}$`, $options: "i" },
      }).select("clientDetails");

      if (!inv) {
        return res.status(404).json({ success: false, message: `No records found for client "${clientName}".` });
      }

      client = {
        _id: null,
        clientName: inv.clientDetails?.clientName || clientName,
        email: inv.clientDetails?.email || "",
        phone: inv.clientDetails?.phone || "",
        gstin: inv.clientDetails?.gstin || "",
        address: inv.clientDetails?.address || "",
      };
    }

    return generateClientStatement(client, req, res);
  } catch (error) {
    console.error("Client Statement Lookup Error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate client statement." });
  }
});

// 2. GET /api/clients/:id/statement (By Client ObjectId)
router.get("/:id/statement", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid client ID format." });
    }
    const client = await Client.findOne({ _id: req.params.id, owner: req.user.id }).select("-__v");
    if (!client) return res.status(404).json({ success: false, message: "Client profile not found." });

    return generateClientStatement(client, req, res);
  } catch (error) {
    console.error("Client Statement By ID Error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate client statement." });
  }
});

router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid client ID format." });
    }
    const profile = profileFrom(req.body);
    if (!profile.clientName) {
      return res.status(400).json({ success: false, message: "Client name is required." });
    }
    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      { $set: profile },
      { new: true, runValidators: true }
    ).select("-__v");
    if (!client) return res.status(404).json({ success: false, message: "Client profile not found." });
    return res.status(200).json({ success: true, client });
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ success: false, message: "A client with this name already exists." });
    }
    return res.status(500).json({ success: false, message: "Failed to update client profile." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid client ID format." });
    }
    const client = await Client.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!client) return res.status(404).json({ success: false, message: "Client profile not found." });
    return res.status(200).json({ success: true, message: "Client profile deleted." });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete client profile." });
  }
});

module.exports = router;
