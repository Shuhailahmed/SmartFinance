import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Target,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import savingsService from "../../services/savingsService";

const SavingsGoals = () => {
  const { token } = useAuth();

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);

  const [editingGoal, setEditingGoal] = useState(null);

  const [deletingGoal, setDeletingGoal] = useState(null);

  const [form, setForm] = useState({
    name: "",
    targetAmount: "",
    savedAmount: "",
    deadline: "",
    description: "",
  });

  // ==========================================
  // LOAD GOALS
  // ==========================================

  const loadGoals = async () => {
    try {
      setLoading(true);

      const response = await savingsService.getSavingsGoals(token);

      if (response.success) {
        setGoals(response.data);
      }
    } catch (error) {
      console.error("Failed to load savings goals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    const timer = setTimeout(() => {
      loadGoals();
    }, 0);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // RESET FORM
  // ==========================================

  const resetForm = () => {
    setForm({
      name: "",
      targetAmount: "",
      savedAmount: "",
      deadline: "",
      description: "",
    });
  };

  // ==========================================
  // CREATE GOAL
  // ==========================================

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      await savingsService.createSavingsGoal(token, {
        name: form.name,
        targetAmount: Number(form.targetAmount),
        savedAmount: Number(form.savedAmount) || 0,
        deadline: form.deadline || null,
        description: form.description,
      });

      resetForm();
      setShowForm(false);

      await loadGoals();
    } catch (error) {
      console.error("Failed to create savings goal:", error);

      alert(error.response?.data?.message || "Failed to create savings goal");
    }
  };

  // ==========================================
  // OPEN EDIT
  // ==========================================

  const handleEditOpen = (goal) => {
    setEditingGoal(goal);

    setForm({
      name: goal.name || "",
      targetAmount: goal.targetAmount || "",
      savedAmount: goal.savedAmount || "",
      deadline: goal.deadline ? goal.deadline.split("T")[0] : "",
      description: goal.description || "",
    });
  };

  // ==========================================
  // UPDATE GOAL
  // ==========================================

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!editingGoal) return;

    try {
      await savingsService.updateSavingsGoal(token, editingGoal._id, {
        name: form.name,
        targetAmount: Number(form.targetAmount),
        savedAmount: Number(form.savedAmount) || 0,
        deadline: form.deadline || null,
        description: form.description,
      });

      resetForm();
      setEditingGoal(null);

      await loadGoals();
    } catch (error) {
      console.error("Failed to update savings goal:", error);

      alert(error.response?.data?.message || "Failed to update savings goal");
    }
  };

  // ==========================================
  // DELETE GOAL
  // ==========================================

  const handleDelete = async () => {
    if (!deletingGoal) return;

    try {
      await savingsService.deleteSavingsGoal(token, deletingGoal._id);

      setDeletingGoal(null);

      await loadGoals();
    } catch (error) {
      console.error("Failed to delete savings goal:", error);

      alert(error.response?.data?.message || "Failed to delete savings goal");
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
  // DATE
  // ==========================================

  const formatDate = (date) => {
    if (!date) return "No deadline";

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-slate-500">Loading savings goals...</p>
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
          <h1 className="text-2xl font-bold text-slate-900">Savings Goals</h1>

          <p className="mt-1 text-sm text-slate-500">
            Set goals and track your progress toward them.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setEditingGoal(null);
            setShowForm(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <Plus size={18} />
          Add Goal
        </button>
      </div>

      {/* ======================================
          CREATE FORM
      ====================================== */}

      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Create Savings Goal
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Define what you want to save for.
              </p>
            </div>

            <button
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Goal Name */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Goal Name
                </label>

                <input
                  type="text"
                  name="name"
                  placeholder="e.g. New Phone"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Target Amount */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Target Amount
                </label>

                <input
                  type="number"
                  name="targetAmount"
                  min="1"
                  placeholder="30000"
                  value={form.targetAmount}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Saved Amount */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Already Saved
                </label>

                <input
                  type="number"
                  name="savedAmount"
                  min="0"
                  placeholder="5000"
                  value={form.savedAmount}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              {/* Deadline */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Deadline
                </label>

                <input
                  type="date"
                  name="deadline"
                  value={form.deadline}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            {/* Description */}

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Description
              </label>

              <textarea
                name="description"
                rows="3"
                placeholder="Why are you saving for this goal?"
                value={form.description}
                onChange={handleChange}
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {/* Buttons */}

            <div className="mt-5 flex gap-3">
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Create Goal
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================
          EMPTY STATE
      ====================================== */}

      {goals.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Target size={26} />
          </div>

          <h3 className="mt-4 font-semibold text-slate-800">
            No savings goals yet
          </h3>

          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Create your first savings goal and start tracking your progress.
          </p>

          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Create Your First Goal
          </button>
        </div>
      ) : (
        /* ======================================
           GOAL CARDS
        ====================================== */

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {goals.map((goal) => (
            <div
              key={goal._id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {/* Card Header */}

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      goal.status === "completed"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-violet-50 text-violet-600"
                    }`}
                  >
                    {goal.status === "completed" ? (
                      <CheckCircle2 size={21} />
                    ) : (
                      <Target size={21} />
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {goal.name}
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      {goal.status === "completed"
                        ? "Goal completed"
                        : "Savings goal"}
                    </p>
                  </div>
                </div>

                {/* Actions */}

                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditOpen(goal)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    title="Edit goal"
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    onClick={() => setDeletingGoal(goal)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    title="Delete goal"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>

              {/* Amount */}

              <div className="mt-6 flex items-end justify-between">
                <div>
                  <p className="text-xs text-slate-400">Saved</p>

                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {formatCurrency(goal.savedAmount)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-400">Target</p>

                  <p className="mt-1 font-semibold text-slate-700">
                    {formatCurrency(goal.targetAmount)}
                  </p>
                </div>
              </div>

              {/* Progress */}

              <div className="mt-5">
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${
                      goal.status === "completed"
                        ? "bg-emerald-500"
                        : "bg-violet-500"
                    }`}
                    style={{
                      width: `${Math.min(goal.percentage, 100)}%`,
                    }}
                  />
                </div>

                <div className="mt-2 flex justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    {goal.percentage}% complete
                  </span>

                  <span className="text-xs font-medium text-slate-500">
                    {formatCurrency(goal.remaining)} remaining
                  </span>
                </div>
              </div>

              {/* Bottom Info */}

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <CalendarDays size={15} />

                  <span>{formatDate(goal.deadline)}</span>
                </div>

                {goal.status === "completed" && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                    Completed
                  </span>
                )}
              </div>

              {/* Description */}

              {goal.description && (
                <p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-500">
                  {goal.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ======================================
          EDIT MODAL
      ====================================== */}

      {editingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Edit Savings Goal
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update your savings target and progress.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingGoal(null);
                  resetForm();
                }}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="mt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Goal Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Target Amount
                  </label>

                  <input
                    type="number"
                    name="targetAmount"
                    min="1"
                    value={form.targetAmount}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Saved Amount
                  </label>

                  <input
                    type="number"
                    name="savedAmount"
                    min="0"
                    value={form.savedAmount}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Deadline
                  </label>

                  <input
                    type="date"
                    name="deadline"
                    value={form.deadline}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>

                <textarea
                  name="description"
                  rows="3"
                  value={form.description}
                  onChange={handleChange}
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingGoal(null);
                    resetForm();
                  }}
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
          DELETE MODAL
      ====================================== */}

      {deletingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <Trash2 size={22} />
            </div>

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              Delete Savings Goal?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-700">
                {deletingGoal.name}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeletingGoal(null)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
              >
                Delete Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavingsGoals;
