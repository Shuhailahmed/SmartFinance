const User = require("../models/User");
const cloudinary = require("../config/cloudinary");

// Upload image to Cloudinary
const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `smart-finance/${folder}`,
        resource_type: "image",
        transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      },
    );

    stream.end(buffer);
  });
};

// Delete old image from Cloudinary
const deleteCloudinaryImage = async (imageUrl) => {
  if (!imageUrl) return;

  try {
    const parts = imageUrl.split("/");
    const uploadIndex = parts.indexOf("upload");

    if (uploadIndex === -1) return;

    const publicIdWithExtension = parts.slice(uploadIndex + 2).join("/");

    const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, "");

    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete error:", error.message);
  }
};

// Get user profile
const getProfile = async (req, res, next) => {
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
      user,
    });
  } catch (error) {
    next(error);
  }
};

// Update name and currency
const updateProfile = async (req, res, next) => {
  try {
    const { name, currency } = req.body;

    const updates = {};

    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        name.trim().length < 2 ||
        name.trim().length > 50
      ) {
        return res.status(400).json({
          success: false,
          message: "Name must contain between 2 and 50 characters.",
        });
      }

      updates.name = name.trim();
    }

    if (currency !== undefined) {
      const allowedCurrencies = ["INR", "USD", "EUR", "GBP"];

      if (!allowedCurrencies.includes(currency)) {
        return res.status(400).json({
          success: false,
          message: "Invalid currency.",
        });
      }

      updates.currency = currency;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid profile information provided.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true },
    ).select("-password -emailOTP -emailOTPExpires -emailOTPResendAt");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user,
    });
  } catch (error) {
    next(error);
  }
};

// Upload profile picture
const uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a profile image.",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const result = await uploadToCloudinary(req.file.buffer, "profile-images");

    const oldImage = user.profileImage;

    user.profileImage = result.secure_url;
    await user.save();

    if (oldImage) {
      await deleteCloudinaryImage(oldImage);
    }

    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully.",
      profileImage: user.profileImage,
    });
  } catch (error) {
    next(error);
  }
};

// Upload cover banner
const uploadCoverImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a cover image.",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const result = await uploadToCloudinary(req.file.buffer, "cover-images");

    const oldImage = user.coverImage;

    user.coverImage = result.secure_url;
    await user.save();

    if (oldImage) {
      await deleteCloudinaryImage(oldImage);
    }

    return res.status(200).json({
      success: true,
      message: "Cover image updated successfully.",
      coverImage: user.coverImage,
    });
  } catch (error) {
    next(error);
  }
};

// Remove profile picture
const removeProfileImage = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const oldImage = user.profileImage;

    user.profileImage = "";
    await user.save();

    if (oldImage) {
      await deleteCloudinaryImage(oldImage);
    }

    return res.status(200).json({
      success: true,
      message: "Profile picture removed successfully.",
      user,
    });
  } catch (error) {
    next(error);
  }
};

// Remove cover banner
const removeCoverImage = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const oldImage = user.coverImage;

    user.coverImage = "";
    await user.save();

    if (oldImage) {
      await deleteCloudinaryImage(oldImage);
    }

    return res.status(200).json({
      success: true,
      message: "Cover image removed successfully.",
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadProfileImage,
  uploadCoverImage,
  removeProfileImage,
  removeCoverImage,
};
