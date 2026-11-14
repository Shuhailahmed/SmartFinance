const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  getNotifications,
  getUnreadCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createAdminTestNotification,
} = require("../controllers/notificationController");

router.use(protect);

router.post("/test-admin", createAdminTestNotification);

router.get("/", getNotifications);

router.get("/unread-count", getUnreadCount);

router.post("/", createNotification);

router.put("/:id/read", markAsRead);

router.put("/read-all", markAllAsRead);

router.delete("/:id", deleteNotification);

module.exports = router;
