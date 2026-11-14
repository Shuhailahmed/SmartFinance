const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // Email verification
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailOTP: {
      type: String,
      default: undefined,
    },

    emailOTPExpires: {
      type: Date,
      default: undefined,
    },

    emailOTPResendAt: {
      type: Date,
      default: undefined,
    },

    otpAttempts: {
      type: Number,
      default: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    profileImage: {
      type: String,
      default: "",
    },

    coverImage: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
