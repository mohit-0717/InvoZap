// server/routes/authRoutes.js
// Authentication APIs: Registration, Login, and Profile inspection

const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "invozap_super_secure_enterprise_jwt_signing_secret_key_2026_x89";

// Helper to sign JWT payload with pinned HS256 algorithm
function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email },
    JWT_SECRET,
    { algorithm: "HS256", expiresIn: "7d" }
  );
}

// 1. POST /api/auth/register (Create new user account in MongoDB)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, businessProfile } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // Minimum password length check
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    // Check duplicate email
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Hash password with bcryptjs
    const passwordHash = await User.hashPassword(password);

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      businessProfile: businessProfile || {},
    });

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: "Registration successful!",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        businessProfile: newUser.businessProfile,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during registration.",
    });
  }
});

// 2. POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide both email and password.",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        businessProfile: user.businessProfile,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during login.",
    });
  }
});

// 3. GET /api/auth/me (Protected profile verification)
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash -__v");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve profile.",
    });
  }
});

// 4. PUT /api/auth/profile (Update business profile & complete onboarding)
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User profile not found." });
    }

    const {
      name,
      businessName,
      tagline,
      address,
      email,
      phone,
      upiId,
      gstin,
      stateCode,
      bankName,
      accountNumber,
      ifscCode,
      onboardingCompleted,
    } = req.body;

    if (name && typeof name === "string" && name.trim()) {
      user.name = name.trim().slice(0, 100);
    }

    user.businessProfile = {
      businessName: String(businessName || user.businessProfile?.businessName || "").trim().slice(0, 150),
      tagline: String(tagline || user.businessProfile?.tagline || "").trim().slice(0, 150),
      address: String(address || user.businessProfile?.address || "").trim().slice(0, 500),
      email: String(email || user.businessProfile?.email || user.email || "").trim().slice(0, 254),
      phone: String(phone || user.businessProfile?.phone || "").trim().slice(0, 40),
      upiId: String(upiId || user.businessProfile?.upiId || "").trim().slice(0, 100),
      gstin: String(gstin || user.businessProfile?.gstin || "").trim().toUpperCase().slice(0, 15),
      stateCode: String(stateCode || user.businessProfile?.stateCode || "").trim().slice(0, 2),
      bankName: String(bankName || user.businessProfile?.bankName || "").trim().slice(0, 100),
      accountNumber: String(accountNumber || user.businessProfile?.accountNumber || "").trim().slice(0, 40),
      ifscCode: String(ifscCode || user.businessProfile?.ifscCode || "").trim().toUpperCase().slice(0, 15),
      onboardingCompleted: onboardingCompleted !== undefined ? Boolean(onboardingCompleted) : true,
    };

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Business profile saved successfully!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        businessProfile: user.businessProfile,
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update business profile.",
    });
  }
});

module.exports = router;
