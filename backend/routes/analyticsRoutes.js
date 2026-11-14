const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  getDashboardData,
  getAdvancedAnalytics,
} = require("../controllers/analyticsController");

// Dashboard analytics
router.get("/dashboard", protect, getDashboardData);

// Advanced analytics
router.get("/overview", protect, getAdvancedAnalytics);

module.exports = router;
