const Transaction = require("../models/Transaction");

// GET /api/analytics/dashboard
const getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;

    const transactions = await Transaction.find({ userId })
      .sort({ date: -1 })
      .lean();

    // =============================
    // TOTALS
    // =============================

    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpenses;
    const savings = Math.max(balance, 0);

    // =============================
    // CURRENT MONTH
    // =============================

    const now = new Date();

    const currentMonthTransactions = transactions.filter((t) => {
      const date = new Date(t.date);

      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    });

    const monthlyIncome = currentMonthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = currentMonthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    // =============================
    // SAVINGS RATE
    // =============================

    const savingsRate =
      monthlyIncome > 0
        ? Number(
            (((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100).toFixed(
              1,
            ),
          )
        : 0;

    // =============================
    // LAST 12 MONTHS CHART
    // =============================

    const monthlyData = [];

    for (let i = 11; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);

      const month = targetDate.getMonth();
      const year = targetDate.getFullYear();

      const monthTransactions = transactions.filter((t) => {
        const transactionDate = new Date(t.date);

        return (
          transactionDate.getMonth() === month &&
          transactionDate.getFullYear() === year
        );
      });

      const income = monthTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

      const expense = monthTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      monthlyData.push({
        month: targetDate.toLocaleString("en-US", {
          month: "short",
        }),
        year,
        income,
        expense,
      });
    }

    // =============================
    // CURRENT MONTH CATEGORY EXPENSES
    // =============================

    const categoryMap = {};

    currentMonthTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const category = t.category || "Other";

        categoryMap[category] = (categoryMap[category] || 0) + t.amount;
      });

    const categoryWiseExpenses = Object.entries(categoryMap)
      .map(([category, amount]) => ({
        category,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);

    // =============================
    // RECENT TRANSACTIONS
    // =============================

    const recentTransactions = transactions.slice(0, 5);

    return res.status(200).json({
      success: true,

      data: {
        totalIncome,
        totalExpenses,
        balance,
        savings,

        monthlyIncome,
        monthlyExpenses,
        savingsRate,

        monthlyData,
        categoryWiseExpenses,
        recentTransactions,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard data",
    });
  }
};

const getAdvancedAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    const transactions = await Transaction.find({ userId })
      .sort({ date: 1 })
      .lean();

    const now = new Date();

    // -----------------------------------
    // Monthly Income & Expense
    // -----------------------------------

    const monthlyMap = {};

    transactions.forEach((transaction) => {
      const date = new Date(transaction.date);

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0",
      )}`;

      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          month: key,
          income: 0,
          expense: 0,
        };
      }

      if (transaction.type === "income") {
        monthlyMap[key].income += Number(transaction.amount);
      }

      if (transaction.type === "expense") {
        monthlyMap[key].expense += Number(transaction.amount);
      }
    });

    const monthlyTrend = Object.values(monthlyMap).slice(-12);

    // -----------------------------------
    // Category-wise Expenses
    // -----------------------------------

    const categoryMap = {};

    transactions
      .filter((transaction) => transaction.type === "expense")
      .forEach((transaction) => {
        const category = transaction.category;

        categoryMap[category] =
          (categoryMap[category] || 0) + Number(transaction.amount);
      });

    const categoryExpenses = Object.entries(categoryMap)
      .map(([category, amount]) => ({
        category,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);

    // -----------------------------------
    // Payment Method Analysis
    // -----------------------------------

    const paymentMap = {};

    transactions
      .filter((transaction) => transaction.type === "expense")
      .forEach((transaction) => {
        const method = transaction.paymentMethod || "other";

        paymentMap[method] =
          (paymentMap[method] || 0) + Number(transaction.amount);
      });

    const paymentMethods = Object.entries(paymentMap)
      .map(([method, amount]) => ({
        method,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);

    // -----------------------------------
    // Current Month Daily Spending
    // -----------------------------------

    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const dailyMap = {};

    transactions
      .filter((transaction) => {
        const date = new Date(transaction.date);

        return (
          transaction.type === "expense" &&
          date.getMonth() === currentMonth &&
          date.getFullYear() === currentYear
        );
      })
      .forEach((transaction) => {
        const day = new Date(transaction.date).getDate().toString();

        dailyMap[day] = (dailyMap[day] || 0) + Number(transaction.amount);
      });

    const dailySpending = Object.entries(dailyMap)
      .map(([day, amount]) => ({
        day: Number(day),
        amount,
      }))
      .sort((a, b) => a.day - b.day);

    // -----------------------------------
    // Overall Statistics
    // -----------------------------------

    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach((transaction) => {
      if (transaction.type === "income") {
        totalIncome += Number(transaction.amount);
      }

      if (transaction.type === "expense") {
        totalExpenses += Number(transaction.amount);
      }
    });

    const balance = totalIncome - totalExpenses;

    const averageTransaction =
      transactions.length > 0
        ? (totalIncome + totalExpenses) / transactions.length
        : 0;

    const expenseMonths = monthlyTrend.filter((item) => item.expense > 0);

    const averageMonthlyExpense =
      expenseMonths.length > 0 ? totalExpenses / expenseMonths.length : 0;

    const savingsRate =
      totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    const highestSpendingCategory =
      categoryExpenses.length > 0 ? categoryExpenses[0] : null;

    // -----------------------------------
    // Response
    // -----------------------------------

    res.json({
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        balance,

        averageTransaction: Number(averageTransaction.toFixed(2)),

        averageMonthlyExpense: Number(averageMonthlyExpense.toFixed(2)),

        savingsRate: Number(savingsRate.toFixed(2)),

        highestSpendingCategory,

        monthlyTrend,
        categoryExpenses,
        paymentMethods,
        dailySpending,
      },
    });
  } catch (error) {
    console.error("Advanced analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load advanced analytics",
    });
  }
};

module.exports = {
  getDashboardData,
  getAdvancedAnalytics,
};
