const Category = require("../models/Category");
const Transaction = require("../models/Transaction");

const validTypes = ["income", "expense", "both"];

const listCategories = async (req, res) => {
  try {
    const {
      search = "",
      type = "all",
      status = "all",
      page = "1",
      limit = "10",
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, Number.parseInt(limit, 10) || 10),
    );

    const filter = {};

    if (search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (validTypes.includes(type)) filter.type = type;
    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;

    const allowedSortFields = ["name", "type", "createdAt", "isActive"];
    const safeSort = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

    const sort = { [safeSort]: order === "asc" ? 1 : -1 };

    const [
      categories,
      total,
      totalCategories,
      activeCategories,
      inactiveCategories,
    ] = await Promise.all([
      Category.find(filter)
        .sort(sort)
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Category.countDocuments(filter),
      Category.countDocuments(),
      Category.countDocuments({ isActive: true }),
      Category.countDocuments({ isActive: false }),
    ]);

    const categoryNames = categories.map((item) => item.name);

    const usage = categoryNames.length
      ? await Transaction.aggregate([
          {
            $match: {
              category: { $in: categoryNames },
            },
          },
          {
            $group: {
              _id: "$category",
              transactionCount: { $sum: 1 },
              totalAmount: { $sum: "$amount" },
            },
          },
        ])
      : [];

    const usageMap = new Map(usage.map((item) => [item._id, item]));

    const items = categories.map((category) => {
      const stats = usageMap.get(category.name);

      return {
        ...category,
        transactionCount: stats?.transactionCount || 0,
        totalAmount: stats?.totalAmount || 0,
      };
    });

    return res.status(200).json({
      success: true,
      categories: items,
      stats: {
        totalCategories,
        activeCategories,
        inactiveCategories,
      },
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
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

const createCategory = async (req, res) => {
  try {
    const {
      name,
      type = "expense",
      description = "",
      color = "#10b981",
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required.",
      });
    }

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category type.",
      });
    }

    const category = await Category.create({
      name: name.trim(),
      type,
      description,
      color,
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully.",
      category,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A category with this name and type already exists.",
      });
    }

    console.error("Create category error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create category.",
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { name, type, description, color, isActive } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Category name cannot be empty.",
        });
      }
      updates.name = name.trim();
    }

    if (type !== undefined) {
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category type.",
        });
      }
      updates.type = type;
    }

    if (description !== undefined) updates.description = description;
    if (color !== undefined) updates.color = color;
    if (typeof isActive === "boolean") updates.isActive = isActive;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true },
    );

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
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A category with this name and type already exists.",
      });
    }

    console.error("Update category error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update category.",
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    // Transaction.category currently stores a string, not a Category ObjectId.
    // Keep categories that are already referenced by transactions.
    const isUsed = await Transaction.exists({
      category: category.name,
    });

    if (isUsed) {
      return res.status(409).json({
        success: false,
        message:
          "This category is used by existing transactions. Deactivate it instead of deleting it.",
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

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
