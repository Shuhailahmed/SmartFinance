import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, X } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import budgetService from "../../services/budgetService";

const categories = [
  "Food",
  "Shopping",
  "Transport",
  "Bills",
  "Entertainment",
  "Health",
  "Education",
  "Travel",
  "Other",
];

const Budgets = () => {
  const { token } = useAuth();

  const [budgets, setBudgets] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);

  const [editingBudget, setEditingBudget] = useState(null);

  const [deletingBudget, setDeletingBudget] = useState(null);

  const [form, setForm] = useState({
    category: "Food",
    amount: "",
  });

  const now = new Date();

  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // ==========================================
  // LOAD BUDGETS
  // ==========================================

  const loadBudgets = async () => {
    try {
      setLoading(true);

      const response = await budgetService.getBudgets(token, month, year);

      if (response.success) {
        setBudgets(response.data);
      }
    } catch (error) {
      console.error("Failed to load budgets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadBudgets();
    }
  }, [token]);

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ==========================================
  // CREATE BUDGET
  // ==========================================

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      await budgetService.createBudget(token, {
        category: form.category,
        amount: Number(form.amount),
        month,
        year,
      });

      setForm({
        category: "Food",
        amount: "",
      });

      setShowForm(false);

      await loadBudgets();
    } catch (error) {
      console.error("Failed to create budget:", error);

      alert(error.response?.data?.message || "Failed to create budget");
    }
  };

  // ==========================================
  // OPEN EDIT MODAL
  // ==========================================

  const handleEditOpen = (budget) => {
    setEditingBudget(budget);

    setForm({
      category: budget.category,
      amount: budget.amount,
    });
  };

  // ==========================================
  // UPDATE BUDGET
  // ==========================================

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!editingBudget) return;

    try {
      await budgetService.updateBudget(token, editingBudget._id, {
        category: form.category,
        amount: Number(form.amount),
      });

      setEditingBudget(null);

      setForm({
        category: "Food",
        amount: "",
      });

      await loadBudgets();
    } catch (error) {
      console.error("Failed to update budget:", error);

      alert(error.response?.data?.message || "Failed to update budget");
    }
  };

  // ==========================================
  // DELETE BUDGET
  // ==========================================

  const handleDelete = async () => {
    if (!deletingBudget) return;

    try {
      await budgetService.deleteBudget(token, deletingBudget._id);

      setDeletingBudget(null);

      await loadBudgets();
    } catch (error) {
      console.error("Failed to delete budget:", error);

      alert(error.response?.data?.message || "Failed to delete budget");
    }
  };

  // ==========================================
  // CURRENCY
  // ==========================================

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <p className="text-sm text-slate-500">Loading budgets...</p>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="space-y-6">
      {/* ======================================
          HEADER
      ====================================== */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Budgets</h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage your spending limits for this month.
          </p>
        </div>

        <button
          onClick={() => {
            setShowForm(true);
            setEditingBudget(null);

            setForm({
              category: "Food",
              amount: "",
            });
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <Plus size={18} />
          Add Budget
        </button>
      </div>

      {/* ======================================
          CREATE BUDGET FORM
      ====================================== */}

      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Create Monthly Budget
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Set a spending limit for a category.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Category */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Category
                </label>

                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Budget Amount
                </label>

                <input
                  type="number"
                  name="amount"
                  min="1"
                  placeholder="e.g. 10000"
                  value={form.amount}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  required
                />
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Create Budget
              </button>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================
          BUDGET LIST
      ====================================== */}

      {budgets.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Plus size={24} />
          </div>

          <h3 className="mt-4 font-semibold text-slate-800">
            No budgets created
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Create a budget to start tracking your spending.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {budgets.map((budget) => (
            <div
              key={budget._id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              {/* ==================================
                  CARD HEADER
              ================================== */}

              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {budget.category}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">Monthly budget</p>
                </div>

                {/* Actions */}

                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditOpen(budget)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    title="Edit budget"
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    onClick={() => setDeletingBudget(budget)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    title="Delete budget"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>

              {/* ==================================
                  AMOUNTS
              ================================== */}

              <div className="mt-6 flex items-end justify-between">
                <div>
                  <p className="text-xs text-slate-400">Spent</p>

                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {formatCurrency(budget.spent)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-400">Budget</p>

                  <p className="mt-1 font-semibold text-slate-700">
                    {formatCurrency(budget.amount)}
                  </p>
                </div>
              </div>

              {/* ==================================
                  PROGRESS BAR
              ================================== */}

              <div className="mt-5">
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${
                      budget.status === "exceeded"
                        ? "bg-rose-500"
                        : budget.status === "warning"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    }`}
                    style={{
                      width: `${Math.min(budget.percentage, 100)}%`,
                    }}
                  />
                </div>

                <div className="mt-2 flex justify-between text-xs">
                  <span className="text-slate-500">
                    {budget.percentage}% used
                  </span>

                  <span
                    className={
                      budget.status === "exceeded"
                        ? "font-medium text-rose-600"
                        : budget.status === "warning"
                          ? "font-medium text-amber-600"
                          : "font-medium text-emerald-600"
                    }
                  >
                    {budget.remaining >= 0
                      ? `${formatCurrency(budget.remaining)} remaining`
                      : `${formatCurrency(
                          Math.abs(budget.remaining),
                        )} over budget`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================
          EDIT MODAL
      ====================================== */}

      {editingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            {/* Modal Header */}

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Edit Budget
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update your monthly spending limit.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditingBudget(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Edit Form */}

            <form onSubmit={handleUpdate} className="mt-6">
              {/* Category */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Category
                </label>

                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Budget Amount
                </label>

                <input
                  type="number"
                  name="amount"
                  min="1"
                  value={form.amount}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  required
                />
              </div>

              {/* Buttons */}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingBudget(null)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================
          DELETE CONFIRMATION MODAL
      ====================================== */}

      {deletingBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <Trash2 size={22} />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              Delete Budget?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Are you sure you want to delete the{" "}
              <span className="font-semibold text-slate-700">
                {deletingBudget.category}
              </span>{" "}
              budget? This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingBudget(null)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
              >
                Delete Budget
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budgets;
