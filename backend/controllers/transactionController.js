const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");
const Budget = require("../models/Budget");

// ======================================
// CREATE TRANSACTION
// ======================================

const createTransaction = async (req, res, next) => {
  try {
    const { type, amount, category, description, paymentMethod, date, notes } =
      req.body;

    if (!type || !amount || !category) {
      return res.status(400).json({
        success: false,
        message: "Type, amount and category are required",
      });
    }

    const transaction = await Transaction.create({
      userId: req.user.id,
      type,
      amount,
      category,
      description,
      paymentMethod,
      date,
      notes,
    });

    // Create transaction notification
    try {
      const isIncome = transaction.type === "income";

      await Notification.create({
        userId: req.user.id,
        title: isIncome ? "Income Added" : "Expense Recorded",
        message: `${transaction.category}: ${transaction.amount} added successfully.`,
        type: isIncome ? "income" : "expense",
      });

      // Check budget alerts only for expenses
      if (transaction.type === "expense") {
        const transactionDate = new Date(transaction.date);
        const month = transactionDate.getMonth() + 1;
        const year = transactionDate.getFullYear();

        const budgets = await Budget.find({
          userId: req.user.id,
          month,
          year,
        });

        const matchingBudget = budgets.find(
          (budget) =>
            budget.category.toLowerCase() ===
            transaction.category.toLowerCase(),
        );

        if (matchingBudget && matchingBudget.amount > 0) {
          const startDate = new Date(year, month - 1, 1);
          const endDate = new Date(year, month, 1);

          const expenses = await Transaction.find({
            userId: req.user.id,
            type: "expense",
            date: {
              $gte: startDate,
              $lt: endDate,
            },
          }).lean();

          const totalSpent = expenses
            .filter(
              (item) =>
                item.category.toLowerCase() ===
                matchingBudget.category.toLowerCase(),
            )
            .reduce((total, item) => total + Number(item.amount), 0);

          const previousSpent = totalSpent - Number(transaction.amount);

          const previousPercentage =
            (previousSpent / matchingBudget.amount) * 100;

          const currentPercentage = (totalSpent / matchingBudget.amount) * 100;

          // Budget exceeded: 100% or more
          if (previousPercentage < 100 && currentPercentage >= 100) {
            await Notification.create({
              userId: req.user.id,
              title: "Budget Limit Exceeded!",
              message: `Your ${matchingBudget.category} budget has reached ${currentPercentage.toFixed(1)}%. You have exceeded your monthly budget.`,
              type: "warning",
            });
          }

          // Budget warning: crossed 80%, but not 100%
          else if (previousPercentage < 80 && currentPercentage >= 80) {
            await Notification.create({
              userId: req.user.id,
              title: "Budget Warning",
              message: `You have used ${currentPercentage.toFixed(1)}% of your ${matchingBudget.category} budget. Monitor your spending carefully.`,
              type: "budget",
            });
          }
        }
      }
    } catch (notificationError) {
      // Notification failure must not cancel a saved transaction
      console.error("Transaction notification error:", notificationError);
    }

    return res.status(201).json({
      success: true,
      message: "Transaction created successfully",
      transaction,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================
// GET USER TRANSACTIONS
// ======================================

const getTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({
      userId: req.user.id,
    }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================
// GET SINGLE TRANSACTION
// ======================================

const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.status(200).json({
      success: true,
      transaction,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================
// UPDATE TRANSACTION
// ======================================

const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    const { type, amount, category, description, paymentMethod, date, notes } =
      req.body;

    transaction.type = type ?? transaction.type;

    transaction.amount = amount ?? transaction.amount;

    transaction.category = category ?? transaction.category;

    transaction.description = description ?? transaction.description;

    transaction.paymentMethod = paymentMethod ?? transaction.paymentMethod;

    transaction.date = date ?? transaction.date;

    transaction.notes = notes ?? transaction.notes;

    await transaction.save();

    res.status(200).json({
      success: true,
      message: "Transaction updated successfully",
      transaction,
    });
  } catch (error) {
    next(error);
  }
};

// ======================================
// DELETE TRANSACTION
// ======================================

const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};
