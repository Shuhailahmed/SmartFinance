const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = require("../models/User");
const Notification = require("../models/Notification");
const ActivityLog = require("../models/ActivityLog");

const generateToken = require("../utils/generateToken");
const { sendVerificationEmail } = require("../utils/emailService");

const OTP_EXPIRY_MINUTES = 5;
const OTP_RESEND_SECONDS = 60;
const MAX_OTP_ATTEMPTS = 5;

const generateOTP = () => crypto.randomInt(100000, 1000000).toString();

const hashOTP = (otp) => crypto.createHash("sha256").update(otp).digest("hex");

// SAVE ACTIVITY LOG
const logActivity = async ({
  userId = null,
  actorName = "System",
  actorEmail = "",
  action,
  description = "",
  category = "system",
  status = "success",
  req,
}) => {
  try {
    await ActivityLog.create({
      userId,
      actorName,
      actorEmail,
      action,
      description,
      category,
      status,
      ipAddress: req?.ip || "",
      userAgent: req?.get("user-agent") || "",
    });
  } catch (error) {
    console.error("Activity logging error:", error.message);
  }
};

// CREATE AND SEND OTP
const createAndSendOTP = async (user) => {
  const otp = generateOTP();

  user.emailOTP = hashOTP(otp);
  user.emailOTPExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  user.emailOTPResendAt = new Date(Date.now() + OTP_RESEND_SECONDS * 1000);
  user.otpAttempts = 0;

  await user.save();

  await sendVerificationEmail(user.email, otp, user.name);
};

// REGISTER USER
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    if (name.trim().length < 2 || name.trim().length > 50) {
      return res.status(400).json({
        success: false,
        message: "Name must contain 2 to 50 characters.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters.",
      });
    }

    let user = await User.findOne({
      email: normalizedEmail,
    });

    if (user && (user.isEmailVerified || user.role === "admin")) {
      return res.status(409).json({
        success: false,
        message: "Email already registered. Please login.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    if (user) {
      user.name = name.trim();
      user.password = hashedPassword;
    } else {
      user = new User({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: "user",
        isEmailVerified: false,
      });
    }

    await createAndSendOTP(user);

    return res.status(201).json({
      success: true,
      message: "OTP sent to your email. Please verify your email.",
      email: user.email,
      requiresVerification: true,
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already registered.",
      });
    }

    if (
      error.message?.includes("Invalid login") ||
      error.message?.includes("Invalid credentials") ||
      error.message?.includes("SMTP configuration")
    ) {
      return res.status(503).json({
        success: false,
        message: "Email service is unavailable. Please check SMTP settings.",
      });
    }

    next(error);
  }
};

// VERIFY EMAIL OTP
const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (
      typeof email !== "string" ||
      typeof otp !== "string" ||
      !/^\d{6}$/.test(otp)
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 6-digit OTP.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      role: "user",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Registration not found. Please register again.",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified. Please login.",
      });
    }

    if (!user.emailOTP || !user.emailOTPExpires) {
      return res.status(400).json({
        success: false,
        message: "OTP not found. Please request a new OTP.",
      });
    }

    if (user.emailOTPExpires.getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new OTP.",
      });
    }

    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Please request a new OTP.",
      });
    }

    const submittedHash = hashOTP(otp);

    const isOTPValid =
      submittedHash.length === user.emailOTP.length &&
      crypto.timingSafeEqual(
        Buffer.from(submittedHash, "hex"),
        Buffer.from(user.emailOTP, "hex"),
      );

    if (!isOTPValid) {
      user.otpAttempts += 1;
      await user.save();

      return res.status(400).json({
        success: false,
        message: "Incorrect OTP. Please try again.",
        remainingAttempts: MAX_OTP_ATTEMPTS - user.otpAttempts,
      });
    }

    // Successfully verified email.
    user.isEmailVerified = true;
    user.emailOTP = undefined;
    user.emailOTPExpires = undefined;
    user.emailOTPResendAt = undefined;
    user.otpAttempts = 0;

    await user.save();

    // Log successful registration after email verification.
    await logActivity({
      userId: user._id,
      actorName: user.name,
      actorEmail: user.email,
      action: "User registered",
      description: `${user.name} successfully verified their email and registered.`,
      category: "user",
      status: "success",
      req,
    });

    // Notify all administrators.
    try {
      const admins = await User.find({
        role: "admin",
      }).select("_id");

      if (admins.length > 0) {
        await Notification.insertMany(
          admins.map((admin) => ({
            userId: admin._id,
            title: "New User Registered",
            message: `${user.name} (${user.email}) has successfully verified their email and joined SmartFinance.`,
            type: "success",
          })),
        );
      }
    } catch (notificationError) {
      console.error(
        "Admin registration notification error:",
        notificationError,
      );
    }

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now login.",
    });
  } catch (error) {
    next(error);
  }
};

// RESEND OTP
const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      role: "user",
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Registration not found.",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified. Please login.",
      });
    }

    if (user.emailOTPResendAt && user.emailOTPResendAt.getTime() > Date.now()) {
      const remainingSeconds = Math.ceil(
        (user.emailOTPResendAt.getTime() - Date.now()) / 1000,
      );

      return res.status(429).json({
        success: false,
        message: `Please wait ${remainingSeconds} seconds before requesting another OTP.`,
        remainingSeconds,
      });
    }

    await createAndSendOTP(user);

    return res.status(200).json({
      success: true,
      message: "A new OTP has been sent to your email.",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    next(error);
  }
};

// LOGIN USER / ADMIN
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user) {
      await logActivity({
        actorName: "Unknown User",
        actorEmail: email.trim().toLowerCase(),
        action: "Login failed",
        description: "Login attempted with an unregistered email.",
        category: "auth",
        status: "failed",
        req,
      });

      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.isActive) {
      await logActivity({
        userId: user._id,
        actorName: user.name,
        actorEmail: user.email,
        action: "Login failed",
        description: "Login attempted with a disabled account.",
        category: "auth",
        status: "failed",
        req,
      });

      return res.status(403).json({
        success: false,
        message: "Your account has been disabled.",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      await logActivity({
        userId: user._id,
        actorName: user.name,
        actorEmail: user.email,
        action: "Login failed",
        description: "Incorrect password entered during login.",
        category: "auth",
        status: "failed",
        req,
      });

      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (user.role !== "admin" && user.isEmailVerified !== true) {
      return res.status(403).json({
        success: false,
        requiresVerification: true,
        email: user.email,
        message: "Please verify your email before logging in.",
      });
    }

    const token = generateToken(user);

    await logActivity({
      userId: user._id,
      actorName: user.name,
      actorEmail: user.email,
      action: "Login successful",
      description: `${user.name} logged in successfully.`,
      category: "auth",
      status: "success",
      req,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET CURRENT USER
const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -emailOTP -emailOTPExpires -emailOTPResendAt",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        currency: user.currency,
        profileImage: user.profileImage,
        coverImage: user.coverImage,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  verifyEmail,
  resendOTP,
};
