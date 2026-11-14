const express = require("express");

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  getProfile,
  updateProfile,
  uploadProfileImage,
  uploadCoverImage,
  removeProfileImage,
  removeCoverImage,
} = require("../controllers/userController");

const router = express.Router();

// Existing dashboard route
router.get("/dashboard", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to your user dashboard",
    user: req.user,
  });
});

// Get profile
router.get("/profile", protect, getProfile);

// Update profile details
router.put("/profile", protect, updateProfile);

// Upload profile picture
router.post(
  "/profile/image",
  protect,
  upload.single("image"),
  uploadProfileImage,
);

// Upload cover banner
router.post(
  "/profile/cover",
  protect,
  upload.single("image"),
  uploadCoverImage,
);

// Remove profile picture
router.delete("/profile/image", protect, removeProfileImage);

// Remove cover banner
router.delete("/profile/cover", protect, removeCoverImage);

module.exports = router;
