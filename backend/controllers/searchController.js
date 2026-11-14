const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");
const SavingsGoal = require("../models/SavingsGoal");

// Escape special regex characters from user input
const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// GLOBAL SEARCH
const globalSearch = async (req, res, next) => {
  try {
    const query = String(req.query.q || "").trim();

    if (query.length < 2) {
      return res.status(200).json({
        success: true,
        results: {
          transactions: [],
          budgets: [],
          savingsGoals: [],
          categories: [],
        },
      });
    }

    if (query.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Search query cannot exceed 100 characters.",
      });
    }

    const userId = req.user.id;
    const searchRegex = new RegExp(escapeRegex(query), "i");
    const numericQuery = Number(query);
    const isNumeric = query !== "" && Number.isFinite(numericQuery);

    const amountCondition = isNumeric ? { amount: numericQuery } : null;

    // Search transactions
    const transactionConditions = [
      { description: searchRegex },
      { category: searchRegex },
      { paymentMethod: searchRegex },
      { notes: searchRegex },
      { type: searchRegex },
    ];

    if (amountCondition) {
      transactionConditions.push(amountCondition);
    }

    // Search budgets
    const budgetConditions = [{ category: searchRegex }];

    if (isNumeric) {
      budgetConditions.push({ amount: numericQuery });
      budgetConditions.push({ month: numericQuery });
      budgetConditions.push({ year: numericQuery });
    }

    // Search savings goals
    const savingsConditions = [
      { name: searchRegex },
      { description: searchRegex },
      { status: searchRegex },
    ];

    if (isNumeric) {
      savingsConditions.push({ targetAmount: numericQuery });
      savingsConditions.push({ savedAmount: numericQuery });
    }

    const [
      transactions,
      budgets,
      savingsGoals,
      transactionCategories,
      budgetCategories,
    ] = await Promise.all([
      Transaction.find({
        userId,
        $or: transactionConditions,
      })
        .sort({ date: -1 })
        .limit(5)
        .select("type amount category description paymentMethod date"),

      Budget.find({
        userId,
        $or: budgetConditions,
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("category amount month year"),

      SavingsGoal.find({
        userId,
        status: { $ne: "cancelled" },
        $or: savingsConditions,
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name targetAmount savedAmount status deadline"),

      Transaction.distinct("category", {
        userId,
        category: searchRegex,
      }),

      Budget.distinct("category", {
        userId,
        category: searchRegex,
      }),
    ]);

    // Combine duplicate categories
    const categories = [
      ...new Set([...transactionCategories, ...budgetCategories]),
    ].slice(0, 5);

    return res.status(200).json({
      success: true,
      results: {
        transactions,
        budgets,
        savingsGoals,
        categories,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { globalSearch };
