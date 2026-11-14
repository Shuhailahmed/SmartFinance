const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");

// ==========================================
// CREATE BUDGET
// ==========================================

const createBudget = async (req, res) => {
  try {
    const userId = req.user.id;

    const { category, amount, month, year } = req.body;

    if (!category || !amount || !month || !year) {
      return res.status(400).json({
        success: false,
        message: "All budget fields are required",
      });
    }

    const existingBudget = await Budget.findOne({
      userId,
      category,
      month,
      year,
    });

    if (existingBudget) {
      return res.status(400).json({
        success: false,
        message: "Budget already exists for this category and month",
      });
    }

    const budget = await Budget.create({
      userId,
      category,
      amount,
      month,
      year,
    });

    return res.status(201).json({
      success: true,
      message: "Budget created successfully",
      data: budget,
    });
  } catch (error) {
    console.error("Create budget error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create budget",
    });
  }
};

// ==========================================
// GET BUDGETS
// ==========================================

const getBudgets = async (req, res) => {
  try {
    const userId = req.user.id;

    const now = new Date();

    const month = Number(req.query.month) || now.getMonth() + 1;

    const year = Number(req.query.year) || now.getFullYear();

    const budgets = await Budget.find({
      userId,
      month,
      year,
    }).sort({ category: 1 });

    const startDate = new Date(year, month - 1, 1);

    const endDate = new Date(year, month, 1);

    const transactions = await Transaction.find({
      userId,
      type: "expense",
      date: {
        $gte: startDate,
        $lt: endDate,
      },
    }).lean();

    const result = budgets.map((budget) => {
      const spent = transactions
        .filter(
          (transaction) =>
            transaction.category.toLowerCase() ===
            budget.category.toLowerCase(),
        )
        .reduce((sum, transaction) => sum + transaction.amount, 0);

      const remaining = budget.amount - spent;

      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      let status = "safe";

      if (percentage >= 100) {
        status = "exceeded";
      } else if (percentage >= 80) {
        status = "warning";
      }

      return {
        _id: budget._id,
        category: budget.category,
        amount: budget.amount,
        spent,
        remaining,
        percentage: Number(percentage.toFixed(1)),
        status,
        month,
        year,
      };
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get budgets error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch budgets",
    });
  }
};

// ==========================================
// UPDATE BUDGET
// ==========================================

const updateBudget = async (req, res) => {
  try {
    const userId = req.user.id;

    const budget = await Budget.findOne({
      _id: req.params.id,
      userId,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    const { category, amount } = req.body;

    if (category !== undefined) {
      budget.category = category;
    }

    if (amount !== undefined) {
      budget.amount = amount;
    }

    await budget.save();

    return res.status(200).json({
      success: true,
      message: "Budget updated successfully",
      data: budget,
    });
  } catch (error) {
    console.error("Update budget error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update budget",
    });
  }
};

// ==========================================
// DELETE BUDGET
// ==========================================

const deleteBudget = async (req, res) => {
  try {
    const userId = req.user.id;

    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Budget deleted successfully",
    });
  } catch (error) {
    console.error("Delete budget error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete budget",
    });
  }
};

module.exports = {
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
};
