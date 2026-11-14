const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  createSavingsGoal,
  getSavingsGoals,
  getSavingsGoalById,
  updateSavingsGoal,
  deleteSavingsGoal,
} = require("../controllers/savingsController");

router.use(protect);

// Create goal
router.post("/", createSavingsGoal);

// Get all goals
router.get("/", getSavingsGoals);

// Get single goal
router.get("/:id", getSavingsGoalById);

// Update goal
router.put("/:id", updateSavingsGoal);

// Delete goal
router.delete("/:id", deleteSavingsGoal);

module.exports = router;
