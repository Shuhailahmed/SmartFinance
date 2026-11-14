const SavingsGoal = require("../models/SavingsGoal");

// ==========================================
// CREATE SAVINGS GOAL
// ==========================================

const createSavingsGoal = async (req, res) => {
  try {
    const userId = req.user.id;

    const { name, targetAmount, savedAmount, deadline, description } = req.body;

    if (!name || !targetAmount) {
      return res.status(400).json({
        success: false,
        message: "Goal name and target amount are required",
      });
    }

    if (Number(targetAmount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Target amount must be greater than 0",
      });
    }

    if (savedAmount !== undefined && Number(savedAmount) < 0) {
      return res.status(400).json({
        success: false,
        message: "Saved amount cannot be negative",
      });
    }

    const initialSavedAmount = Number(savedAmount) || 0;

    const goal = await SavingsGoal.create({
      userId,
      name,
      targetAmount: Number(targetAmount),
      savedAmount: initialSavedAmount,
      deadline: deadline || null,
      description,
      status:
        initialSavedAmount >= Number(targetAmount) ? "completed" : "active",
    });

    return res.status(201).json({
      success: true,
      message: "Savings goal created successfully",
      data: goal,
    });
  } catch (error) {
    console.error("Create savings goal error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create savings goal",
    });
  }
};

// ==========================================
// GET SAVINGS GOALS
// ==========================================

const getSavingsGoals = async (req, res) => {
  try {
    const userId = req.user.id;

    const goals = await SavingsGoal.find({
      userId,
      status: {
        $ne: "cancelled",
      },
    }).sort({
      createdAt: -1,
    });

    const result = goals.map((goal) => {
      const percentage =
        goal.targetAmount > 0
          ? (goal.savedAmount / goal.targetAmount) * 100
          : 0;

      const remaining = Math.max(goal.targetAmount - goal.savedAmount, 0);

      const isCompleted = goal.savedAmount >= goal.targetAmount;

      return {
        _id: goal._id,
        name: goal.name,
        targetAmount: goal.targetAmount,
        savedAmount: goal.savedAmount,
        remaining,
        percentage: Number(Math.min(percentage, 100).toFixed(1)),
        deadline: goal.deadline,
        description: goal.description,
        status: isCompleted ? "completed" : goal.status,
        createdAt: goal.createdAt,
      };
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get savings goals error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch savings goals",
    });
  }
};

// ==========================================
// GET SINGLE GOAL
// ==========================================

const getSavingsGoalById = async (req, res) => {
  try {
    const userId = req.user.id;

    const goal = await SavingsGoal.findOne({
      _id: req.params.id,
      userId,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Savings goal not found",
      });
    }

    const percentage =
      goal.targetAmount > 0 ? (goal.savedAmount / goal.targetAmount) * 100 : 0;

    const remaining = Math.max(goal.targetAmount - goal.savedAmount, 0);

    return res.status(200).json({
      success: true,
      data: {
        ...goal.toObject(),
        remaining,
        percentage: Number(Math.min(percentage, 100).toFixed(1)),
      },
    });
  } catch (error) {
    console.error("Get savings goal error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch savings goal",
    });
  }
};

// ==========================================
// UPDATE SAVINGS GOAL
// ==========================================

const updateSavingsGoal = async (req, res) => {
  try {
    const userId = req.user.id;

    const goal = await SavingsGoal.findOne({
      _id: req.params.id,
      userId,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Savings goal not found",
      });
    }

    const { name, targetAmount, savedAmount, deadline, description } = req.body;

    if (name !== undefined) {
      goal.name = name;
    }

    if (targetAmount !== undefined) {
      if (Number(targetAmount) <= 0) {
        return res.status(400).json({
          success: false,
          message: "Target amount must be greater than 0",
        });
      }

      goal.targetAmount = Number(targetAmount);
    }

    if (savedAmount !== undefined) {
      if (Number(savedAmount) < 0) {
        return res.status(400).json({
          success: false,
          message: "Saved amount cannot be negative",
        });
      }

      goal.savedAmount = Number(savedAmount);
    }

    if (deadline !== undefined) {
      goal.deadline = deadline || null;
    }

    if (description !== undefined) {
      goal.description = description;
    }

    // Automatically update status
    if (goal.savedAmount >= goal.targetAmount) {
      goal.status = "completed";
    } else if (goal.status === "completed") {
      goal.status = "active";
    }

    await goal.save();

    return res.status(200).json({
      success: true,
      message: "Savings goal updated successfully",
      data: goal,
    });
  } catch (error) {
    console.error("Update savings goal error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update savings goal",
    });
  }
};

// ==========================================
// DELETE / CANCEL SAVINGS GOAL
// ==========================================

const deleteSavingsGoal = async (req, res) => {
  try {
    const userId = req.user.id;

    const goal = await SavingsGoal.findOneAndDelete({
      _id: req.params.id,
      userId,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Savings goal not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Savings goal deleted successfully",
    });
  } catch (error) {
    console.error("Delete savings goal error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete savings goal",
    });
  }
};

module.exports = {
  createSavingsGoal,
  getSavingsGoals,
  getSavingsGoalById,
  updateSavingsGoal,
  deleteSavingsGoal,
};
