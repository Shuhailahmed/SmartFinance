const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema(
  {
    platformName: {
      type: String,
      default: "Smart Finance",
      trim: true,
    },
    supportEmail: {
      type: String,
      default: "support@smartfinance.com",
      trim: true,
      lowercase: true,
    },
    currency: {
      type: String,
      enum: ["INR", "USD", "EUR", "GBP"],
      default: "INR",
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    securityAlerts: {
      type: Boolean,
      default: true,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    twoFactorAuth: {
      type: Boolean,
      default: false,
    },
    sessionTimeout: {
      type: Number,
      enum: [15, 30, 60, 120],
      default: 30,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SystemSettings", systemSettingsSchema);
