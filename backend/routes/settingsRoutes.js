const express = require("express");
const protect = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");

const {
  getSystemSettings,
  updateSystemSettings,
} = require("../controllers/settingsController");

const router = express.Router();

// Only authenticated admins can access settings.
router.use(protect, adminOnly);

router.get("/", getSystemSettings);
router.put("/", updateSystemSettings);

module.exports = router;
