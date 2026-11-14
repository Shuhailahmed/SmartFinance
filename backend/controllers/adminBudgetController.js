const mongoose = require("mongoose");
const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

const getAdminBudgets = async (req, res) => {
  try {
    const now = new Date();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const year = Number(req.query.year) || now.getFullYear();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "all");
    const sortBy = String(req.query.sortBy || "createdAt");
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    if (month < 1 || month > 12 || year < 2000 || year > 2200) {
      return res.status(400).json({
        success: false,
        message: "Invalid month or year.",
      });
    }

    const match = { month, year };

    if (req.query.userId) {
      if (!mongoose.isValidObjectId(req.query.userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID.",
        });
      }
      match.userId = new mongoose.Types.ObjectId(req.query.userId);
    }

    const budgets = await Budget.find(match)
      .populate("userId", "name email isActive")
      .lean();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const userIds = [
      ...new Set(
        budgets.filter((b) => b.userId?._id).map((b) => String(b.userId._id)),
      ),
    ].map((id) => new mongoose.Types.ObjectId(id));

    const spending = await Transaction.aggregate([
      {
        $match: {
          userId: { $in: userIds },
          type: "expense",
          date: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: {
            userId: "$userId",
            category: { $toLower: "$category" },
          },
          spent: { $sum: "$amount" },
        },
      },
    ]);

    const spendingMap = new Map(
      spending.map((item) => [
        `${item._id.userId}:${item._id.category}`,
        item.spent,
      ]),
    );

    let records = budgets.map((budget) => {
      const spent =
        spendingMap.get(
          `${budget.userId?._id}:${String(budget.category).toLowerCase()}`,
        ) || 0;

      const percentage =
        budget.amount > 0
          ? Number(((spent / budget.amount) * 100).toFixed(1))
          : 0;

      return {
        ...budget,
        user: budget.userId || null,
        userId: budget.userId?._id || budget.userId,
        spent,
        remaining: budget.amount - spent,
        percentage,
        status:
          percentage >= 100
            ? "exceeded"
            : percentage >= 80
              ? "warning"
              : "safe",
      };
    });

    if (search) {
      const term = search.toLowerCase();
      records = records.filter(
        (b) =>
          String(b.category).toLowerCase().includes(term) ||
          String(b.user?.name || "")
            .toLowerCase()
            .includes(term) ||
          String(b.user?.email || "")
            .toLowerCase()
            .includes(term),
      );
    }

    if (["safe", "warning", "exceeded"].includes(status)) {
      records = records.filter((b) => b.status === status);
    }

    const totals = records.reduce(
      (acc, b) => {
        acc.allocated += b.amount;
        acc.spent += b.spent;
        acc.remaining += b.remaining;
        if (b.status === "exceeded") acc.exceeded += 1;
        if (b.status === "warning") acc.warning += 1;
        return acc;
      },
      { allocated: 0, spent: 0, remaining: 0, exceeded: 0, warning: 0 },
    );

    const sortFields = {
      category: (b) => b.category,
      amount: (b) => b.amount,
      spent: (b) => b.spent,
      remaining: (b) => b.remaining,
      percentage: (b) => b.percentage,
      createdAt: (b) => new Date(b.createdAt || 0).getTime(),
    };

    const getter = sortFields[sortBy] || sortFields.createdAt;
    records.sort((a, b) => {
      const av = getter(a);
      const bv = getter(b);
      return (
        (typeof av === "string" ? av.localeCompare(bv) : av - bv) * sortOrder
      );
    });

    const total = records.length;
    const paginated = records.slice((page - 1) * limit, page * limit);

    return res.json({
      success: true,
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      summary: {
        ...totals,
        budgets: total,
        activeUsers: new Set(records.map((b) => String(b.userId))).size,
      },
      period: { month, year },
    });
  } catch (error) {
    console.error("Admin budgets error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load admin budgets.",
    });
  }
};

const getAdminBudgetDetails = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid budget ID." });
    }

    const budget = await Budget.findById(req.params.id)
      .populate("userId", "name email isActive")
      .lean();

    if (!budget) {
      return res
        .status(404)
        .json({ success: false, message: "Budget not found." });
    }

    const startDate = new Date(budget.year, budget.month - 1, 1);
    const endDate = new Date(budget.year, budget.month, 1);

    const result = await Transaction.aggregate([
      {
        $match: {
          userId: budget.userId._id,
          type: "expense",
          date: { $gte: startDate, $lt: endDate },
          $expr: {
            $eq: [
              { $toLower: "$category" },
              String(budget.category).toLowerCase(),
            ],
          },
        },
      },
      { $group: { _id: null, spent: { $sum: "$amount" } } },
    ]);

    const spent = result[0]?.spent || 0;
    const percentage =
      budget.amount > 0
        ? Number(((spent / budget.amount) * 100).toFixed(1))
        : 0;

    return res.json({
      success: true,
      data: {
        ...budget,
        user: budget.userId,
        spent,
        remaining: budget.amount - spent,
        percentage,
        status:
          percentage >= 100
            ? "exceeded"
            : percentage >= 80
              ? "warning"
              : "safe",
      },
    });
  } catch (error) {
    console.error("Admin budget details error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to load budget details." });
  }
};

const updateAdminBudget = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid budget ID." });
    }

    const budget = await Budget.findById(req.params.id);
    if (!budget) {
      return res
        .status(404)
        .json({ success: false, message: "Budget not found." });
    }

    const { category, amount, month, year } = req.body;

    if (category !== undefined) {
      if (typeof category !== "string" || !category.trim()) {
        return res
          .status(400)
          .json({ success: false, message: "Category is required." });
      }
      budget.category = category.trim();
    }

    if (amount !== undefined) {
      const value = Number(amount);
      if (!Number.isFinite(value) || value <= 0) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Amount must be greater than zero.",
          });
      }
      budget.amount = value;
    }

    if (month !== undefined) {
      const value = Number(month);
      if (!Number.isInteger(value) || value < 1 || value > 12) {
        return res
          .status(400)
          .json({ success: false, message: "Month must be between 1 and 12." });
      }
      budget.month = value;
    }

    if (year !== undefined) {
      const value = Number(year);
      if (!Number.isInteger(value) || value < 2000 || value > 2200) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid year." });
      }
      budget.year = value;
    }

    await budget.save();
    return res.json({
      success: true,
      message: "Budget updated.",
      data: budget,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A budget for this user, category and period already exists.",
      });
    }
    console.error("Update admin budget error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update budget." });
  }
};

const deleteAdminBudget = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid budget ID." });
    }

    const budget = await Budget.findByIdAndDelete(req.params.id);
    if (!budget) {
      return res
        .status(404)
        .json({ success: false, message: "Budget not found." });
    }

    return res.json({ success: true, message: "Budget deleted successfully." });
  } catch (error) {
    console.error("Delete admin budget error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete budget." });
  }
};

const exportAdminBudgets = async (req, res) => {
  try {
    const now = new Date();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const year = Number(req.query.year) || now.getFullYear();

    const budgets = await Budget.find({ month, year })
      .populate("userId", "name email")
      .sort({ category: 1 })
      .lean();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    const userIds = budgets.map((b) => b.userId?._id).filter(Boolean);

    const spending = await Transaction.aggregate([
      {
        $match: {
          userId: { $in: userIds },
          type: "expense",
          date: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: {
            userId: "$userId",
            category: { $toLower: "$category" },
          },
          spent: { $sum: "$amount" },
        },
      },
    ]);

    const map = new Map(
      spending.map((s) => [`${s._id.userId}:${s._id.category}`, s.spent]),
    );

    const rows = [
      [
        "User",
        "Email",
        "Category",
        "Month",
        "Year",
        "Budget",
        "Spent",
        "Remaining",
        "Usage %",
      ],
      ...budgets.map((b) => {
        const spent =
          map.get(`${b.userId?._id}:${String(b.category).toLowerCase()}`) || 0;
        return [
          b.userId?.name || "",
          b.userId?.email || "",
          b.category,
          b.month,
          b.year,
          b.amount,
          spent,
          b.amount - spent,
          b.amount ? ((spent / b.amount) * 100).toFixed(1) : "0",
        ];
      }),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="admin-budgets-${year}-${month}.csv"`,
    );
    return res.send("\uFEFF" + csv);
  } catch (error) {
    console.error("Export admin budgets error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to export budgets." });
  }
};

module.exports = {
  getAdminBudgets,
  getAdminBudgetDetails,
  updateAdminBudget,
  deleteAdminBudget,
  exportAdminBudgets,
};
