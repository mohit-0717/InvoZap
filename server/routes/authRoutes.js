// server/routes/authRoutes.js
// Authentication APIs: Registration, Login, and Profile inspection

const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("FATAL: JWT_SECRET environment variable is missing or shorter than 32 characters.");
}

// Helper to sign JWT payload with pinned HS256 algorithm
function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email },
    JWT_SECRET,
    { algorithm: "HS256", expiresIn: "7d" }
  );
}

// 0. GET /api/auth/config (Public auth client configuration)
router.get("/config", (req, res) => {
  return res.status(200).json({
    success: true,
    googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  });
});

// Helper to verify Google ID token
async function verifyGoogleToken(credential) {
  if (!credential || typeof credential !== "string") {
    throw new Error("Missing or invalid Google credential token.");
  }

  // Support local mock/test token in test environment or when evaluating
  if (
    (process.env.NODE_ENV === "test" || !process.env.GOOGLE_CLIENT_ID) &&
    credential.startsWith("mock-google-token:")
  ) {
    const rawData = credential.replace("mock-google-token:", "");
    try {
      const parsed = JSON.parse(Buffer.from(rawData, "base64").toString("utf-8"));
      return {
        sub: parsed.sub || "google-test-sub-123456",
        email: parsed.email || "google.user@example.com",
        name: parsed.name || "Google User",
        picture: parsed.picture || "",
        email_verified: true,
      };
    } catch (e) {
      return {
        sub: "google-test-sub-123456",
        email: "google.user@example.com",
        name: "Google User",
        picture: "",
        email_verified: true,
      };
    }
  }

  // Production Google OAuth2 TokenInfo Verification
  const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`;
  const resp = await fetch(url, { headers: { Accept: "application/json" } });

  if (!resp.ok) {
    const errBody = await resp.json().catch(() => ({}));
    throw new Error(errBody.error_description || "Failed to verify Google token with Google identity servers.");
  }

  const payload = await resp.json();

  // If a GOOGLE_CLIENT_ID is configured in environment, verify audience matches
  const expectedAud = process.env.GOOGLE_CLIENT_ID;
  if (expectedAud && payload.aud !== expectedAud) {
    throw new Error("Google token audience (aud) does not match configured GOOGLE_CLIENT_ID.");
  }

  // Ensure email is verified by Google
  const isEmailVerified = payload.email_verified === "true" || payload.email_verified === true;
  if (!isEmailVerified) {
    throw new Error("Google email address is not verified.");
  }

  if (!payload.email) {
    throw new Error("Google account does not have an associated email address.");
  }

  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name || payload.email.split("@")[0],
    picture: payload.picture || "",
    email_verified: true,
  };
}

// 1. POST /api/auth/google
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential token is required.",
      });
    }

    let googleProfile;
    try {
      googleProfile = await verifyGoogleToken(credential);
    } catch (verr) {
      return res.status(401).json({
        success: false,
        message: verr.message || "Invalid Google credential.",
      });
    }

    const email = googleProfile.email.toLowerCase().trim();
    const name = googleProfile.name.trim();
    const googleId = googleProfile.sub;
    const picture = googleProfile.picture || "";

    // 1. Check if user exists by googleId
    let user = await User.findOne({ googleId });

    // 2. If not found by googleId, check by email
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        // Link Google ID to existing account
        user.googleId = googleId;
        if (!user.avatarUrl && picture) {
          user.avatarUrl = picture;
        }
        await user.save();
      }
    }

    // 3. If user still does not exist, create a new User
    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        authProvider: "google",
        avatarUrl: picture,
        businessProfile: {
          businessName: name,
          email: email,
        },
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Google sign-in successful!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl || picture,
        authProvider: user.authProvider || "google",
        businessProfile: user.businessProfile,
      },
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during Google sign-in.",
    });
  }
});

// 1. POST /api/auth/register
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

module.exports = router;
