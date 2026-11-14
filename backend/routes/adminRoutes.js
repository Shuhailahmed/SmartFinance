const express = require("express");

const protect = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");

const {
  // Dashboard
  getDashboardStats,
  getRecentUsers,
  getActivityLogs,
  getIncomeExpenseData,
  getExpenseBreakdown,
  getUserGrowthData,
  getSavingsAnalytics,
  getRecentTransactions,
  getTopActiveUsers,

  // Users
  getAdminUsers,
  getAdminUserDetails,
  updateAdminUserStatus,
  deleteAdminUser,
  exportAdminUsers,
  getUsers,

  // Transactions
  getAdminTransactions,
  getAdminTransactionDetails,
  deleteAdminTransaction,

  // Categories
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,

  // Budgets
  getAdminBudgets,
  getAdminBudgetDetails,
  updateAdminBudget,
  deleteAdminBudget,
  exportAdminBudgets,
} = require("../controllers/adminController");

const router = express.Router();

// ==========================================
// CONTROLLER VALIDATION
// ==========================================

const controllerNames = {
  getDashboardStats,
  getRecentUsers,
  getActivityLogs,
  getIncomeExpenseData,
  getExpenseBreakdown,
  getUserGrowthData,
  getSavingsAnalytics,
  getRecentTransactions,
  getTopActiveUsers,

  getAdminUsers,
  getAdminUserDetails,
  updateAdminUserStatus,
  deleteAdminUser,
  exportAdminUsers,
  getUsers,

  getAdminTransactions,
  getAdminTransactionDetails,
  deleteAdminTransaction,

  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,

  getAdminBudgets,
  getAdminBudgetDetails,
  updateAdminBudget,
  deleteAdminBudget,
  exportAdminBudgets,
};

for (const [name, handler] of Object.entries(controllerNames)) {
  if (typeof handler !== "function") {
    console.error(`Invalid controller handler: ${name}`);
  }
}

// ==========================================
// ADMIN AUTHENTICATION
// All routes require admin authentication.
// ==========================================

router.use(protect, adminOnly);

// ==========================================
// DASHBOARD ROUTES
// Static routes before dynamic routes.
// ==========================================

router.get("/dashboard/stats", getDashboardStats);

router.get("/dashboard", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Welcome to the admin dashboard",
    user: req.user,
  });
});

// Recent and top-active users
router.get("/users/recent", getRecentUsers);
router.get("/users/top-active", getTopActiveUsers);

// Recent transactions
router.get("/transactions/recent", getRecentTransactions);

// Activity and analytics
router.get("/activity-logs", getActivityLogs);

router.get("/analytics/income-expenses", getIncomeExpenseData);

router.get("/analytics/expense-breakdown", getExpenseBreakdown);

router.get("/analytics/user-growth", getUserGrowthData);

router.get("/analytics/savings", getSavingsAnalytics);

// ==========================================
// USER MANAGEMENT ROUTES
// Static routes before /users/:id.
// ==========================================

router.get("/users/export", exportAdminUsers);

router.get("/users", getUsers);

// Dynamic user routes
router.get("/users/:id", getAdminUserDetails);

router.patch("/users/:id/status", updateAdminUserStatus);

router.delete("/users/:id", deleteAdminUser);

// ==========================================
// TRANSACTION MANAGEMENT ROUTES
// Static routes before /transactions/:id.
// ==========================================

router.get("/transactions", getAdminTransactions);

// Dynamic transaction routes
router.get("/transactions/:id", getAdminTransactionDetails);

router.delete("/transactions/:id", deleteAdminTransaction);

// ==========================================
// CATEGORY MANAGEMENT ROUTES
// ==========================================

router.get("/categories", listCategories);

router.post("/categories", createCategory);

router.patch("/categories/:id", updateCategory);

router.delete("/categories/:id", deleteCategory);

// ==========================================
// BUDGET MANAGEMENT ROUTES
// Static export route before /budgets/:id.
// ==========================================

router.get("/budgets/export", exportAdminBudgets);

router.get("/budgets", getAdminBudgets);

// Dynamic budget routes
router.get("/budgets/:id", getAdminBudgetDetails);

router.patch("/budgets/:id", updateAdminBudget);

router.delete("/budgets/:id", deleteAdminBudget);

// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;
