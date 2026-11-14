const SystemSettings = require("../models/SystemSettings");

const DEFAULT_SETTINGS = {
  platformName: "Smart Finance",
  supportEmail: "support@smartfinance.com",
  currency: "INR",
  timezone: "Asia/Kolkata",
  emailNotifications: true,
  securityAlerts: true,
  maintenanceMode: false,
  twoFactorAuth: false,
  sessionTimeout: 30,
};

// GET /api/admin/settings
const getSystemSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();

    if (!settings) {
      settings = await SystemSettings.create(DEFAULT_SETTINGS);
    }

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Get system settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load system settings.",
    });
  }
};

// PUT /api/admin/settings
const updateSystemSettings = async (req, res) => {
  try {
    const {
      platformName,
      supportEmail,
      currency,
      timezone,
      emailNotifications,
      securityAlerts,
      maintenanceMode,
      twoFactorAuth,
      sessionTimeout,
    } = req.body;

    const updates = {};

    if (platformName !== undefined) {
      if (typeof platformName !== "string" || !platformName.trim()) {
        return res.status(400).json({
          success: false,
          message: "Platform name is required.",
        });
      }
      updates.platformName = platformName.trim();
    }

    if (supportEmail !== undefined) {
      if (
        typeof supportEmail !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid support email.",
        });
      }
      updates.supportEmail = supportEmail.trim().toLowerCase();
    }

    if (currency !== undefined) {
      if (!["INR", "USD", "EUR", "GBP"].includes(currency)) {
        return res.status(400).json({
          success: false,
          message: "Invalid currency.",
        });
      }
      updates.currency = currency;
    }

    if (timezone !== undefined) {
      if (typeof timezone !== "string" || !timezone.trim()) {
        return res.status(400).json({
          success: false,
          message: "A valid timezone is required.",
        });
      }
      updates.timezone = timezone.trim();
    }

    for (const key of [
      "emailNotifications",
      "securityAlerts",
      "maintenanceMode",
      "twoFactorAuth",
    ]) {
      if (req.body[key] !== undefined) {
        if (typeof req.body[key] !== "boolean") {
          return res.status(400).json({
            success: false,
            message: `${key} must be true or false.`,
          });
        }
        updates[key] = req.body[key];
      }
    }

    if (sessionTimeout !== undefined) {
      const timeout = Number(sessionTimeout);

      if (![15, 30, 60, 120].includes(timeout)) {
        return res.status(400).json({
          success: false,
          message: "Session timeout must be 15, 30, 60, or 120 minutes.",
        });
      }

      updates.sessionTimeout = timeout;
    }

    let settings = await SystemSettings.findOne();

    if (!settings) {
      settings = new SystemSettings(DEFAULT_SETTINGS);
    }

    Object.assign(settings, updates);
    await settings.save();

    return res.status(200).json({
      success: true,
      message: "System settings saved successfully.",
      data: settings,
    });
  } catch (error) {
    console.error("Update system settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save system settings.",
    });
  }
};

module.exports = {
  getSystemSettings,
  updateSystemSettings,
};
