const express = require("express");

const {
  registerUser,
  loginUser,
  getCurrentUser,
  verifyEmail,
  resendOTP,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Registration and email verification
router.post("/register", registerUser);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOTP);

// Login
router.post("/login", loginUser);

// Current user
router.get("/me", protect, getCurrentUser);

module.exports = router;
