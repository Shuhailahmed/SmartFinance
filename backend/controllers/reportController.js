const Transaction = require("../models/Transaction");

const getMonthlyReport = async (req, res) => {
  try {
    const userId = req.user.id;

    const currentDate = new Date();

    const month = Number(req.query.month) || currentDate.getMonth() + 1;
    const year = Number(req.query.year) || currentDate.getFullYear();

    if (month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: "Invalid month",
      });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const transactions = await Transaction.find({
      userId,
      date: {
        $gte: startDate,
        $lt: endDate,
      },
    })
      .sort({ date: -1 })
      .lean();

    let totalIncome = 0;
    let totalExpenses = 0;

    const categoryMap = {};

    transactions.forEach((transaction) => {
      const amount = Number(transaction.amount) || 0;

      if (transaction.type === "income") {
        totalIncome += amount;
      }

      if (transaction.type === "expense") {
        totalExpenses += amount;

        const category = transaction.category || "Other";

        categoryMap[category] = (categoryMap[category] || 0) + amount;
      }
    });

    const netSavings = totalIncome - totalExpenses;

    const categoryExpenses = Object.entries(categoryMap)
      .map(([category, amount]) => ({
        category,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);

    const savingsRate =
      totalIncome > 0
        ? Number(((netSavings / totalIncome) * 100).toFixed(2))
        : 0;

    res.json({
      success: true,
      data: {
        month,
        year,

        totalIncome,
        totalExpenses,
        netSavings,

        savingsRate,

        transactionCount: transactions.length,

        incomeTransactionCount: transactions.filter(
          (transaction) => transaction.type === "income",
        ).length,

        expenseTransactionCount: transactions.filter(
          (transaction) => transaction.type === "expense",
        ).length,

        categoryExpenses,

        transactions,
      },
    });
  } catch (error) {
    console.error("Monthly report error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate monthly report",
    });
  }
};

module.exports = {
  getMonthlyReport,
};
