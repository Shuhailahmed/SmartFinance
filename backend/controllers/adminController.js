const User = require("../models/User");
const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");
const Category = require("../models/Category");
const Budget = require("../models/Budget");
const SavingsGoal = require("../models/SavingsGoal");
const ActivityLog = require("../models/ActivityLog");

// GET /api/admin/dashboard/stats

const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalAdmins,
      totalTransactions,
      financialByCurrency,
      savingsStats,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),

      User.countDocuments({
        role: "user",
        isActive: true,
      }),

      User.countDocuments({
        role: "user",
        isActive: false,
      }),

      User.countDocuments({ role: "admin" }),

      Transaction.countDocuments(),

      Transaction.aggregate([
        {
          $lookup: {
            from: User.collection.name,
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: {
              $ifNull: ["$user.currency", "UNKNOWN"],
            },

            totalIncome: {
              $sum: {
                $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
              },
            },

            totalExpenses: {
              $sum: {
                $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
              },
            },

            incomeTransactions: {
              $sum: {
                $cond: [{ $eq: ["$type", "income"] }, 1, 0],
              },
            },

            expenseTransactions: {
              $sum: {
                $cond: [{ $eq: ["$type", "expense"] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            currency: "$_id",
            totalIncome: 1,
            totalExpenses: 1,
            incomeTransactions: 1,
            expenseTransactions: 1,
          },
        },
        { $sort: { currency: 1 } },
      ]),

      SavingsGoal.aggregate([
        {
          $group: {
            _id: null,

            totalGoals: { $sum: 1 },

            activeGoals: {
              $sum: {
                $cond: [{ $eq: ["$status", "active"] }, 1, 0],
              },
            },

            completedGoals: {
              $sum: {
                $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
              },
            },

            totalTargetAmount: {
              $sum: "$targetAmount",
            },

            totalSavedAmount: {
              $sum: "$savedAmount",
            },
          },
        },
      ]),
    ]);

    const incomeTransactions = financialByCurrency.reduce(
      (sum, item) => sum + item.incomeTransactions,
      0,
    );

    const expenseTransactions = financialByCurrency.reduce(
      (sum, item) => sum + item.expenseTransactions,
      0,
    );

    const savings = savingsStats[0] || {};

    const singleCurrency =
      financialByCurrency.length === 1 ? financialByCurrency[0] : null;

    return res.status(200).json({
      success: true,

      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        totalAdmins,
        totalTransactions,
        incomeTransactions,
        expenseTransactions,

        // Only expose combined totals for one currency.
        totalIncome: singleCurrency ? singleCurrency.totalIncome : null,

        totalExpenses: singleCurrency ? singleCurrency.totalExpenses : null,

        currency: singleCurrency ? singleCurrency.currency : null,

        financialByCurrency,

        totalSavingsGoals: savings.totalGoals || 0,
        activeSavingsGoals: savings.activeGoals || 0,
        completedSavingsGoals: savings.completedGoals || 0,

        // Raw savings totals; currency grouping
        // will be added in a later step.
        totalSavingsTarget: savings.totalTargetAmount || 0,

        totalSavedAmount: savings.totalSavedAmount || 0,
      },
    });
  } catch (error) {
    console.error("Admin dashboard stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
    });
  }
};

// GET /api/admin/users/recent
const getRecentUsers = async (req, res) => {
  try {
    const parsedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 50)
      : 5;

    const users = await User.find({ role: "user" })
      .select("name email profileImage isActive createdAt")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Recent users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load recent users.",
    });
  }
};

// ActivityLog model is currently empty, so return an empty list for now.
// GET /api/admin/activity-logs
const getActivityLogs = async (req, res) => {
  try {
    const parsedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 100)
      : 50;

    const logs = await ActivityLog.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const totalActivities = await ActivityLog.countDocuments();

    const successfulActivities = await ActivityLog.countDocuments({
      status: "success",
    });

    const failedActivities = await ActivityLog.countDocuments({
      status: "failed",
    });

    return res.status(200).json({
      success: true,
      logs,
      summary: {
        totalActivities,
        successfulActivities,
        failedActivities,
      },
      pagination: {
        limit,
        total: totalActivities,
      },
    });
  } catch (error) {
    console.error("Get activity logs error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch activity logs",
    });
  }
};

// GET /api/admin/analytics/income-expenses
const getIncomeExpenseData = async (req, res) => {
  try {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 5, 1);
    startDate.setHours(0, 0, 0, 0);

    const monthlyData = await Transaction.aggregate([
      { $match: { date: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            type: "$type",
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const months = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - i);

      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const income =
        monthlyData.find(
          (item) =>
            item._id.year === year &&
            item._id.month === month &&
            item._id.type === "income",
        )?.total || 0;

      const expenses =
        monthlyData.find(
          (item) =>
            item._id.year === year &&
            item._id.month === month &&
            item._id.type === "expense",
        )?.total || 0;

      months.push({
        month: date.toLocaleString("en-IN", { month: "short" }),
        year,
        income,
        expenses,
      });
    }

    return res.status(200).json({
      success: true,
      data: months,
    });
  } catch (error) {
    console.error("Income expense analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load income and expense analytics.",
    });
  }
};

// GET /api/admin/analytics/expense-breakdown
const getExpenseBreakdown = async (req, res) => {
  try {
    const breakdown = await Transaction.aggregate([
      { $match: { type: "expense" } },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
        },
      },
      { $sort: { total: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      data: breakdown.map((item) => ({
        category: item._id || "Uncategorized",
        amount: item.total,
      })),
    });
  } catch (error) {
    console.error("Expense breakdown error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load expense breakdown.",
    });
  }
};

// GET /api/admin/users
const getAdminUsers = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10),
    );

    const search = String(req.query.search || "").trim();
    const role = String(req.query.role || "").trim();
    const status = String(req.query.status || "").trim();
    const sortBy = ["name", "email", "createdAt"].includes(req.query.sortBy)
      ? req.query.sortBy
      : "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    const filter = {};

    if (role === "admin" || role === "user") {
      filter.role = role;
    }

    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;

    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const [users, total, totalUsers, activeUsers, inactiveUsers, admins] =
      await Promise.all([
        User.find(filter)
          .select("name email role profileImage isActive currency createdAt")
          .sort({ [sortBy]: sortOrder, _id: 1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),

        User.countDocuments(filter),
        User.countDocuments({ role: "user" }),
        User.countDocuments({ role: "user", isActive: true }),
        User.countDocuments({ role: "user", isActive: false }),
        User.countDocuments({ role: "admin" }),
      ]);

    res.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: { totalUsers, activeUsers, inactiveUsers, admins },
    });
  } catch (error) {
    console.error("Admin users list error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load users.",
    });
  }
};

const getAdminUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const user = await User.findById(id)
      .select(
        "name email role profileImage coverImage isActive currency createdAt updatedAt",
      )
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(id);

    const [
      transactionSummary,
      totalTransactions,
      recentTransactions,
      budgets,
      savingsGoals,
    ] = await Promise.all([
      Transaction.aggregate([
        { $match: { userId: userObjectId } },
        {
          $group: {
            _id: "$type",
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),

      Transaction.countDocuments({ userId: userObjectId }),

      Transaction.find({ userId: userObjectId })
        .sort({ date: -1 })
        .limit(10)
        .lean(),

      Budget.find({ userId: userObjectId })
        .sort({ year: -1, month: -1 })
        .lean(),

      SavingsGoal.find({ userId: userObjectId }).sort({ createdAt: -1 }).lean(),
    ]);

    const income = transactionSummary.find((item) => item._id === "income");

    const expense = transactionSummary.find((item) => item._id === "expense");

    const totalIncome = income?.total || 0;
    const totalExpenses = expense?.total || 0;

    const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);

    const totalTargetSavings = savingsGoals.reduce(
      (sum, goal) => sum + goal.targetAmount,
      0,
    );

    const totalSaved = savingsGoals.reduce(
      (sum, goal) => sum + goal.savedAmount,
      0,
    );

    return res.status(200).json({
      success: true,

      user,

      summary: {
        totalTransactions,
        transactionCount: totalTransactions,

        totalIncome,
        totalExpenses,

        balance: totalIncome - totalExpenses,

        incomeCount: income?.count || 0,
        expenseCount: expense?.count || 0,

        totalBudget,
        totalSavingsGoals: savingsGoals.length,
        totalTargetSavings,
        totalSaved,
      },

      recentTransactions,
      budgets,
      savingsGoals,
    });
  } catch (error) {
    console.error("Admin user details error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load user details.",
    });
  }
};

// PATCH /api/admin/users/:id/status
const updateAdminUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false.",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Administrator accounts cannot be disabled here.",
      });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Update user status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user status.",
    });
  }
};

// DELETE /api/admin/users/:id
const deleteAdminUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Administrator accounts cannot be deleted here.",
      });
    }

    // Remove known transaction records to avoid leaving orphaned transactions.
    await Transaction.deleteMany({ userId: user._id });
    await user.deleteOne();

    res.json({
      success: true,
      message: "User and their transaction records were deleted.",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user.",
    });
  }
};

// GET /api/admin/users/export
const exportAdminUsers = async (req, res) => {
  try {
    const filter = {};
    const role = String(req.query.role || "");
    const status = String(req.query.status || "");
    const search = String(req.query.search || "").trim();

    if (role === "admin" || role === "user") filter.role = role;
    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;

    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("name email role isActive currency createdAt")
      .sort({ createdAt: -1 })
      .limit(10000)
      .lean();

    const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = [
      ["Name", "Email", "Role", "Status", "Currency", "Registered At"],
      ...users.map((user) => [
        user.name,
        user.email,
        user.role,
        user.isActive ? "Active" : "Inactive",
        user.currency,
        user.createdAt ? new Date(user.createdAt).toISOString() : "",
      ]),
    ];

    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="users.csv"');
    res.send("\uFEFF" + csv);
  } catch (error) {
    console.error("Export users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export users.",
    });
  }
};

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10),
    );

    const search = String(req.query.search || "").trim();
    const role = String(req.query.role || "").trim();
    const status = String(req.query.status || "").trim();

    const sortBy = ["createdAt", "name", "email"].includes(req.query.sortBy)
      ? req.query.sortBy
      : "createdAt";

    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    const filter = {};

    if (["user", "admin"].includes(role)) {
      filter.role = role;
    }

    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { email: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    // Fetch users and global account statistics
    const [users, total, totalUsers, activeUsers, inactiveUsers, admins] =
      await Promise.all([
        User.find(filter)
          .select("name email role isActive currency profileImage createdAt")
          .sort({ [sortBy]: sortOrder, _id: 1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),

        User.countDocuments(filter),

        User.countDocuments({ role: "user" }),

        User.countDocuments({
          role: "user",
          isActive: true,
        }),

        User.countDocuments({
          role: "user",
          isActive: false,
        }),

        User.countDocuments({ role: "admin" }),
      ]);

    // Get financial summaries for users on the current page
    const userIds = users.map((user) => user._id);

    const financialData = userIds.length
      ? await Transaction.aggregate([
          {
            $match: {
              userId: { $in: userIds },
            },
          },
          {
            $group: {
              _id: "$userId",
              totalIncome: {
                $sum: {
                  $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
                },
              },
              totalExpenses: {
                $sum: {
                  $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
                },
              },
              transactionCount: {
                $sum: 1,
              },
              incomeCount: {
                $sum: {
                  $cond: [{ $eq: ["$type", "income"] }, 1, 0],
                },
              },
              expenseCount: {
                $sum: {
                  $cond: [{ $eq: ["$type", "expense"] }, 1, 0],
                },
              },
            },
          },
        ])
      : [];

    // Map financial records to individual users
    const financialMap = new Map(
      financialData.map((item) => [
        String(item._id),
        {
          totalIncome: item.totalIncome || 0,
          totalExpenses: item.totalExpenses || 0,
          transactionCount: item.transactionCount || 0,
          incomeCount: item.incomeCount || 0,
          expenseCount: item.expenseCount || 0,
          balance: (item.totalIncome || 0) - (item.totalExpenses || 0),
        },
      ]),
    );

    const usersWithFinancials = users.map((user) => ({
      ...user,
      financialSummary: financialMap.get(String(user._id)) || {
        totalIncome: 0,
        totalExpenses: 0,
        transactionCount: 0,
        incomeCount: 0,
        expenseCount: 0,
        balance: 0,
      },
    }));

    return res.status(200).json({
      success: true,

      users: usersWithFinancials,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },

      stats: {
        totalUsers,
        registeredUsers: totalUsers,
        activeUsers,
        inactiveUsers,
        admins,
      },
    });
  } catch (error) {
    console.error("Admin users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load users.",
    });
  }
};

// GET /api/admin/transactions
const getAdminTransactions = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10),
    );

    const search = String(req.query.search || "").trim();
    const type = String(req.query.type || "")
      .trim()
      .toLowerCase();
    const startDate = String(req.query.startDate || "").trim();
    const endDate = String(req.query.endDate || "").trim();
    const sortBy = ["date", "amount", "createdAt", "category"].includes(
      req.query.sortBy,
    )
      ? req.query.sortBy
      : "date";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    const filter = {};

    if (["income", "expense"].includes(type)) {
      filter.type = type;
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: escaped, $options: "i" } },
          { email: { $regex: escaped, $options: "i" } },
        ],
      }).select("_id");

      const userIds = matchingUsers.map((user) => user._id);

      filter.$or = [
        { category: { $regex: escaped, $options: "i" } },
        { description: { $regex: escaped, $options: "i" } },
        { notes: { $regex: escaped, $options: "i" } },
        { paymentMethod: { $regex: escaped, $options: "i" } },
        { userId: { $in: userIds } },
      ];
    }

    if (startDate || endDate) {
      const dateFilter = {};

      if (startDate) {
        const start = new Date(`${startDate}T00:00:00.000Z`);
        if (Number.isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid start date.",
          });
        }
        dateFilter.$gte = start;
      }

      if (endDate) {
        const end = new Date(`${endDate}T23:59:59.999Z`);
        if (Number.isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid end date.",
          });
        }
        dateFilter.$lte = end;
      }

      filter.date = dateFilter;
    }

    const [transactions, total, summary] = await Promise.all([
      Transaction.find(filter)
        .populate("userId", "name email")
        .sort({ [sortBy]: sortOrder, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Transaction.countDocuments(filter),

      Transaction.aggregate([
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
            amount: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    const income = summary.find((item) => item._id === "income");
    const expense = summary.find((item) => item._id === "expense");

    return res.status(200).json({
      success: true,
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalTransactions: summary.reduce((sum, item) => sum + item.count, 0),
        totalIncome: income?.amount || 0,
        totalExpenses: expense?.amount || 0,
        incomeCount: income?.count || 0,
        expenseCount: expense?.count || 0,
      },
    });
  } catch (error) {
    console.error("Admin transactions error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load transactions.",
    });
  }
};

// GET /api/admin/transactions/:id
const getAdminTransactionDetails = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID.",
      });
    }

    const transaction = await Transaction.findById(req.params.id)
      .populate("userId", "name email")
      .lean();

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    return res.json({ success: true, transaction });
  } catch (error) {
    console.error("Transaction details error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load transaction details.",
    });
  }
};

// DELETE /api/admin/transactions/:id
const deleteAdminTransaction = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID.",
      });
    }

    const transaction = await Transaction.findByIdAndDelete(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    return res.json({
      success: true,
      message: "Transaction deleted successfully.",
    });
  } catch (error) {
    console.error("Delete transaction error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete transaction.",
    });
  }
};

// ==========================================
// ADMIN CATEGORY MANAGEMENT
// ==========================================

// ==========================================
// ADMIN CATEGORY MANAGEMENT
// ==========================================

// GET /api/admin/categories
const listCategories = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10),
    );

    const search = String(req.query.search || "").trim();
    const type = String(req.query.type || "all").toLowerCase();
    const status = String(req.query.status || "all").toLowerCase();

    const filter = {};

    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } },
      ];
    }

    if (["income", "expense", "both"].includes(type)) {
      filter.type = type;
    }

    if (status === "active") {
      filter.isActive = true;
    } else if (status === "inactive") {
      filter.isActive = false;
    }

    const [
      totalCategories,
      activeCategories,
      inactiveCategories,
      totalFiltered,
      categories,
    ] = await Promise.all([
      Category.countDocuments(),
      Category.countDocuments({ isActive: true }),
      Category.countDocuments({ isActive: false }),
      Category.countDocuments(filter),

      Category.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    const categoryNames = categories.map((item) =>
      String(item.name || "")
        .trim()
        .toLowerCase(),
    );

    let transactionStats = [];

    if (categoryNames.length > 0) {
      transactionStats = await Transaction.aggregate([
        {
          $addFields: {
            normalizedCategory: {
              $toLower: {
                $trim: {
                  input: { $ifNull: ["$category", ""] },
                },
              },
            },
          },
        },
        {
          $match: {
            normalizedCategory: { $in: categoryNames },
          },
        },
        {
          $group: {
            _id: "$normalizedCategory",
            transactionCount: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
            incomeCount: {
              $sum: {
                $cond: [{ $eq: ["$type", "income"] }, 1, 0],
              },
            },
            expenseCount: {
              $sum: {
                $cond: [{ $eq: ["$type", "expense"] }, 1, 0],
              },
            },
          },
        },
      ]);
    }

    const transactionMap = new Map(
      transactionStats.map((item) => [
        item._id,
        {
          transactionCount: item.transactionCount || 0,
          totalAmount: item.totalAmount || 0,
          incomeCount: item.incomeCount || 0,
          expenseCount: item.expenseCount || 0,
        },
      ]),
    );

    const categoriesWithStats = categories.map((category) => ({
      ...category,
      ...(transactionMap.get(
        String(category.name || "")
          .trim()
          .toLowerCase(),
      ) || {
        transactionCount: 0,
        totalAmount: 0,
        incomeCount: 0,
        expenseCount: 0,
      }),
    }));

    return res.status(200).json({
      success: true,
      categories: categoriesWithStats,
      stats: {
        totalCategories,
        activeCategories,
        inactiveCategories,
      },
      pagination: {
        page,
        limit,
        total: totalFiltered,
        totalPages: Math.ceil(totalFiltered / limit),
      },
    });
  } catch (error) {
    console.error("List categories error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load categories.",
    });
  }
};

// POST /api/admin/categories
const createCategory = async (req, res) => {
  try {
    const { name, type, description, color } = req.body;

    if (typeof name !== "string" || !name.trim() || name.trim().length > 60) {
      return res.status(400).json({
        success: false,
        message: "Category name is required and must be under 60 characters.",
      });
    }

    if (!["income", "expense", "both"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid category type.",
      });
    }

    const category = await Category.create({
      name: name.trim(),
      type,
      description: typeof description === "string" ? description.trim() : "",
      color: typeof color === "string" ? color : "#10b981",
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully.",
      category,
    });
  } catch (error) {
    console.error("Create category error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This category already exists for this type.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create category.",
    });
  }
};

// PATCH /api/admin/categories/:id
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID.",
      });
    }

    const updates = {};

    if (typeof req.body.name === "string") {
      const name = req.body.name.trim();

      if (!name || name.length > 60) {
        return res.status(400).json({
          success: false,
          message: "Category name must contain 1 to 60 characters.",
        });
      }

      updates.name = name;
    }

    if (req.body.type !== undefined) {
      if (!["income", "expense", "both"].includes(req.body.type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category type.",
        });
      }

      updates.type = req.body.type;
    }

    if (typeof req.body.description === "string") {
      updates.description = req.body.description.trim();
    }

    if (typeof req.body.color === "string") {
      updates.color = req.body.color;
    }

    if (typeof req.body.isActive === "boolean") {
      updates.isActive = req.body.isActive;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid category updates provided.",
      });
    }

    const category = await Category.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category updated successfully.",
      category,
    });
  } catch (error) {
    console.error("Update category error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A category with this name and type already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update category.",
    });
  }
};

// DELETE /api/admin/categories/:id
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID.",
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    const escapedName = category.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const transactionExists = await Transaction.exists({
      category: {
        $regex: `^${escapedName}$`,
        $options: "i",
      },
    });

    if (transactionExists) {
      return res.status(409).json({
        success: false,
        message:
          "This category is already used in transactions. Deactivate it instead.",
      });
    }

    await category.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully.",
    });
  } catch (error) {
    console.error("Delete category error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete category.",
    });
  }
};

const getAdminBudgets = async (req, res) => {
  try {
    const month = Math.min(
      12,
      Math.max(1, Number(req.query.month) || new Date().getMonth() + 1),
    );
    const year = Number(req.query.year) || new Date().getFullYear();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));

    const search = String(req.query.search || "").trim();
    const requestedStatus = String(req.query.status || "all").toLowerCase();
    const sortBy = String(req.query.sortBy || "createdAt");
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    const allowedSortFields = [
      "createdAt",
      "category",
      "amount",
      "spent",
      "remaining",
      "percentage",
    ];

    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const budgets = await Budget.find({ month, year })
      .populate("userId", "name email currency")
      .sort({ createdAt: -1 })
      .lean();

    const userIds = budgets.map((budget) => budget.userId?._id).filter(Boolean);

    const transactions = await Transaction.find({
      userId: { $in: userIds },
      type: "expense",
      date: { $gte: startDate, $lt: endDate },
    }).lean();

    let data = budgets.map((budget) => {
      const userId = String(budget.userId?._id);

      const spent = transactions
        .filter(
          (transaction) =>
            String(transaction.userId) === userId &&
            String(transaction.category).trim().toLowerCase() ===
              String(budget.category).trim().toLowerCase(),
        )
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

      const amount = Number(budget.amount || 0);
      const remaining = amount - spent;
      const percentage =
        amount > 0 ? Number(((spent / amount) * 100).toFixed(1)) : 0;

      const budgetStatus =
        spent >= amount
          ? "exceeded"
          : spent >= amount * 0.8
            ? "warning"
            : "safe";

      return {
        ...budget,
        user: budget.userId,
        spent,
        remaining,
        percentage,
        status: budgetStatus,
      };
    });

    // Search by user name, email or category
    if (search) {
      const searchRegex = new RegExp(
        search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );

      data = data.filter(
        (budget) =>
          searchRegex.test(budget.user?.name || "") ||
          searchRegex.test(budget.user?.email || "") ||
          searchRegex.test(budget.category || ""),
      );
    }

    // Filter by budget status
    if (["safe", "warning", "exceeded"].includes(requestedStatus)) {
      data = data.filter((budget) => budget.status === requestedStatus);
    }

    // Sort calculated and stored fields
    data.sort((a, b) => {
      const first = a[safeSortBy];
      const second = b[safeSortBy];

      if (typeof first === "string" && typeof second === "string") {
        return first.localeCompare(second) * sortOrder;
      }

      return ((Number(first) || 0) - (Number(second) || 0)) * sortOrder;
    });

    // Summary is calculated across all budgets matching the period,
    // before search and status filters.
    const summary = {
      budgets: budgets.length,
      activeUsers: new Set(
        budgets.map((budget) => String(budget.userId?._id)).filter(Boolean),
      ).size,
      allocated:
        data.length === budgets.length
          ? data.reduce((sum, budget) => sum + Number(budget.amount || 0), 0)
          : budgets.reduce(
              (sum, budget) => sum + Number(budget.amount || 0),
              0,
            ),
      spent: budgets.reduce((sum, budget) => {
        const userId = String(budget.userId?._id);
        const budgetSpent = transactions
          .filter(
            (transaction) =>
              String(transaction.userId) === userId &&
              String(transaction.category).trim().toLowerCase() ===
                String(budget.category).trim().toLowerCase(),
          )
          .reduce(
            (total, transaction) => total + Number(transaction.amount || 0),
            0,
          );

        return sum + budgetSpent;
      }, 0),
      safe: budgets.length,
      warning: 0,
      exceeded: 0,
    };

    // Count statuses for all period budgets
    const allStatuses = budgets.map((budget) => {
      const userId = String(budget.userId?._id);
      const spent = transactions
        .filter(
          (transaction) =>
            String(transaction.userId) === userId &&
            String(transaction.category).trim().toLowerCase() ===
              String(budget.category).trim().toLowerCase(),
        )
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

      const amount = Number(budget.amount || 0);

      return spent >= amount
        ? "exceeded"
        : spent >= amount * 0.8
          ? "warning"
          : "safe";
    });

    summary.safe = allStatuses.filter((status) => status === "safe").length;
    summary.warning = allStatuses.filter(
      (status) => status === "warning",
    ).length;
    summary.exceeded = allStatuses.filter(
      (status) => status === "exceeded",
    ).length;

    const total = data.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedData = data.slice((page - 1) * limit, page * limit);

    return res.status(200).json({
      success: true,
      data: paginatedData,
      summary,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Get admin budgets error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin budgets",
    });
  }
};

const getAdminBudgetDetails = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id)
      .populate("userId", "name email")
      .lean();

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: { ...budget, user: budget.userId },
    });
  } catch (error) {
    console.error("Get admin budget details error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch budget details",
    });
  }
};

const updateAdminBudget = async (req, res) => {
  try {
    const { amount, category } = req.body;
    const updates = {};

    if (amount !== undefined) {
      const parsedAmount = Number(amount);

      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Budget amount must be greater than zero",
        });
      }

      updates.amount = parsedAmount;
    }

    if (category !== undefined) {
      if (!String(category).trim()) {
        return res.status(400).json({
          success: false,
          message: "Category is required",
        });
      }

      updates.category = String(category).trim();
    }

    const budget = await Budget.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true },
    ).populate("userId", "name email");

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: "Budget not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Budget updated successfully",
      data: budget,
    });
  } catch (error) {
    console.error("Update admin budget error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update budget",
    });
  }
};

const deleteAdminBudget = async (req, res) => {
  try {
    const budget = await Budget.findByIdAndDelete(req.params.id);

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
    console.error("Delete admin budget error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete budget",
    });
  }
};

const exportAdminBudgets = async (req, res) => {
  try {
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const year = Number(req.query.year) || new Date().getFullYear();

    const budgets = await Budget.find({ month, year })
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = [
      ["User", "Email", "Category", "Amount", "Month", "Year"],
      ...budgets.map((b) => [
        b.userId?.name || "",
        b.userId?.email || "",
        b.category,
        b.amount,
        b.month,
        b.year,
      ]),
    ];

    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="admin-budgets-${year}-${month}.csv"`,
    );

    return res.status(200).send("\uFEFF" + csv);
  } catch (error) {
    console.error("Export admin budgets error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export budgets",
    });
  }
};

// ==========================================
// ADMIN: USER REGISTRATION GROWTH
// ==========================================

const getUserGrowthData = async (req, res) => {
  try {
    const months = await User.aggregate([
      {
        $match: {
          role: "user",
          createdAt: {
            $gte: new Date(
              new Date().getFullYear(),
              new Date().getMonth() - 11,
              1,
            ),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          users: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          users: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: months,
    });
  } catch (error) {
    console.error("User growth error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user growth data",
    });
  }
};

// ==========================================
// ADMIN: SAVINGS ANALYTICS
// ==========================================

const getSavingsAnalytics = async (req, res) => {
  try {
    const data = await SavingsGoal.aggregate([
      {
        $lookup: {
          from: User.collection.name,
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: {
            currency: {
              $ifNull: ["$user.currency", "UNKNOWN"],
            },
            status: "$status",
          },

          goals: { $sum: 1 },
          targetAmount: { $sum: "$targetAmount" },
          savedAmount: { $sum: "$savedAmount" },
        },
      },
      {
        $project: {
          _id: 0,
          currency: "$_id.currency",
          status: "$_id.status",
          goals: 1,
          targetAmount: 1,
          savedAmount: 1,
        },
      },
      {
        $sort: {
          currency: 1,
          status: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Savings analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch savings analytics",
    });
  }
};

// ==========================================
// ADMIN: RECENT TRANSACTIONS
// ==========================================

const getRecentTransactions = async (req, res) => {
  try {
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 10, 1),
      50,
    );

    const transactions = await Transaction.find()
      .sort({ date: -1, createdAt: -1 })
      .limit(limit)
      .populate("userId", "name email currency")
      .lean();

    return res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error("Recent transactions error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch recent transactions",
    });
  }
};

// ==========================================
// ADMIN: TOP ACTIVE USERS
// ==========================================

const getTopActiveUsers = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 5, 1), 20);

    const users = await Transaction.aggregate([
      {
        $group: {
          _id: "$userId",
          totalTransactions: { $sum: 1 },
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
            },
          },
          totalExpenses: {
            $sum: {
              $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
            },
          },
          lastTransaction: { $max: "$date" },
        },
      },
      {
        $lookup: {
          from: User.collection.name,
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $match: {
          "user.role": "user",
        },
      },
      {
        $sort: {
          totalTransactions: -1,
        },
      },
      {
        $limit: limit,
      },
      {
        $project: {
          _id: 0,
          userId: "$user._id",
          name: "$user.name",
          email: "$user.email",
          profileImage: "$user.profileImage",
          currency: "$user.currency",
          totalTransactions: 1,
          totalIncome: 1,
          totalExpenses: 1,
          lastTransaction: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Top active users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch top active users",
    });
  }
};

module.exports = {
  getDashboardStats,
  getRecentUsers,
  getActivityLogs,
  getIncomeExpenseData,
  getExpenseBreakdown,
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
  getUserGrowthData,
  getSavingsAnalytics,
  getRecentTransactions,
  getTopActiveUsers,
};
