import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  Download,
  Plus,
  Tags,
  CheckCircle2,
  CircleOff,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ReceiptText,
  Wallet,
} from "lucide-react";

import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from "../../services/adminService";

const initialForm = {
  name: "",
  type: "expense",
  description: "",
  color: "#10b981",
};

const currency = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const dateFormat = (date) => {
  if (!date) return "—";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const exportCSV = (categories) => {
  const headers = [
    "Name",
    "Type",
    "Status",
    "Transactions",
    "Transaction Amount (INR)",
    "Created",
    "Description",
  ];

  const escapeCSV = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

  const rows = categories.map((category) => [
    category.name,
    category.type,
    category.isActive ? "Active" : "Inactive",
    category.transactionCount || 0,
    category.totalAmount || 0,
    dateFormat(category.createdAt),
    category.description || "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCSV).join(","))
    .join("\r\n");

  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }),
  );

  const link = document.createElement("a");
  link.href = url;
  link.download = "smart-finance-categories.csv";
  link.click();
  URL.revokeObjectURL(url);
};

const StatCard = ({ title, value, icon: Icon, tone }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <span className={`rounded-xl p-2.5 ${tone}`}>
        <Icon size={19} />
      </span>
    </div>
    <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
      {value}
    </p>
  </div>
);

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    totalCategories: 0,
    activeCategories: 0,
    inactiveCategories: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(initialForm);

  const loadCategories = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        setError("");

        const response = await getAdminCategories({
          search,
          type,
          status,
          page,
          limit,
          sortBy: "createdAt",
          order: "desc",
        });

        setCategories(response.categories || []);
        setStats(
          response.stats || {
            totalCategories: 0,
            activeCategories: 0,
            inactiveCategories: 0,
          },
        );
        setPagination(
          response.pagination || {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        );
      } catch (err) {
        console.error("Load categories error:", err);
        setError(
          err.response?.data?.message ||
            "Categories load nahi hui. Backend server aur login session check karo.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, type, status, page, limit],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Refresh server data every 30 seconds while this page is open.
  useEffect(() => {
    const intervalId = setInterval(() => {
      loadCategories(true);
    }, 30000);

    return () => clearInterval(intervalId);
  }, [loadCategories]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setForm(initialForm);
    setNotice("");
    setModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setForm({
      name: category.name || "",
      type: category.type || "expense",
      description: category.description || "",
      color: category.color || "#10b981",
      isActive: category.isActive,
    });
    setNotice("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingCategory(null);
    setForm(initialForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setNotice("Category name enter karo.");
      return;
    }

    setSaving(true);
    setNotice("");

    try {
      if (editingCategory) {
        await updateAdminCategory(editingCategory._id, {
          name: form.name.trim(),
          type: form.type,
          description: form.description,
          color: form.color,
        });
        setNotice("Category successfully updated.");
      } else {
        await createAdminCategory({
          name: form.name.trim(),
          type: form.type,
          description: form.description,
          color: form.color,
        });
        setNotice("Category successfully created.");
      }

      setModalOpen(false);
      setEditingCategory(null);
      setForm(initialForm);
      await loadCategories(true);
    } catch (err) {
      setNotice(err.response?.data?.message || "Category save nahi ho saki.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (category) => {
    const nextStatus = !category.isActive;
    const confirmed = window.confirm(
      `${category.name} ko ${nextStatus ? "activate" : "deactivate"} karna hai?`,
    );

    if (!confirmed) return;

    try {
      setError("");
      await updateAdminCategory(category._id, {
        isActive: nextStatus,
      });
      await loadCategories(true);
    } catch (err) {
      setError(
        err.response?.data?.message || "Category status update nahi hua.",
      );
    }
  };

  const handleDelete = async (category) => {
    const confirmed = window.confirm(
      `Delete "${category.name}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setError("");
      await deleteAdminCategory(category._id);

      if (categories.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadCategories(true);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Category delete nahi hui. Used categories ko deactivate karo.",
      );
    }
  };

  const visibleRange = useMemo(() => {
    if (!pagination.total) return "0 records";
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, pagination.total);
    return `${start}–${end} of ${pagination.total}`;
  }, [page, limit, pagination.total]);

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-emerald-600">
            Administration / Categories
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Category Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage income and expense categories across Smart Finance.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadCategories(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => exportCSV(categories)}
            disabled={!categories.length}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <Download size={16} />
            Export CSV
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            <Plus size={17} />
            Add category
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Something went wrong</p>
            <p className="mt-1">{error}</p>
            <button
              type="button"
              onClick={() => loadCategories(true)}
              className="mt-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total categories"
          value={stats.totalCategories}
          icon={Tags}
          tone="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Active categories"
          value={stats.activeCategories}
          icon={CheckCircle2}
          tone="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Inactive categories"
          value={stats.inactiveCategories}
          icon={CircleOff}
          tone="bg-rose-50 text-rose-600"
        />
        <StatCard
          title="Transactions in results"
          value={categories.reduce(
            (sum, category) => sum + (category.transactionCount || 0),
            0,
          )}
          icon={ReceiptText}
          tone="bg-violet-50 text-violet-600"
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">All categories</h2>
            <p className="mt-1 text-sm text-slate-500">
              {visibleRange} · Changes refresh automatically every 30 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex">
            <div className="relative sm:col-span-2 xl:w-64">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search categories..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <select
              value={type}
              onChange={(event) => {
                setType(event.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
              aria-label="Filter by category type"
            >
              <option value="all">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="both">Both</option>
            </select>

            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={limit}
              onChange={(event) => {
                setLimit(Number(event.target.value));
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
              aria-label="Rows per page"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Category</th>
                <th className="px-5 py-4 font-semibold">Type</th>
                <th className="px-5 py-4 font-semibold">Usage</th>
                <th className="px-5 py-4 font-semibold">Transaction total</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Created</th>
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    {Array.from({ length: 7 }).map((__, cell) => (
                      <td key={cell} className="px-5 py-5">
                        <div className="h-4 animate-pulse rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : categories.length ? (
                categories.map((category) => (
                  <tr
                    key={category._id}
                    className="transition hover:bg-slate-50/80"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor: `${category.color || "#10b981"}20`,
                            color: category.color || "#10b981",
                          }}
                        >
                          <Wallet size={19} />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">
                            {category.name}
                          </p>
                          <p className="mt-0.5 max-w-56 truncate text-xs text-slate-500">
                            {category.description || "No description"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">
                        {category.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {category.transactionCount || 0} transactions
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {currency(category.totalAmount)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          category.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${category.isActive ? "bg-emerald-500" : "bg-slate-400"}`}
                        />
                        {category.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                      {dateFormat(category.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(category)}
                          title="Edit category"
                          aria-label={`Edit ${category.name}`}
                          className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(category)}
                          title={category.isActive ? "Deactivate" : "Activate"}
                          aria-label={`${category.isActive ? "Deactivate" : "Activate"} ${category.name}`}
                          className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-600"
                        >
                          {category.isActive ? (
                            <CircleOff size={17} />
                          ) : (
                            <CheckCircle2 size={17} />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(category)}
                          title="Delete category"
                          aria-label={`Delete ${category.name}`}
                          className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                      <Tags size={22} />
                    </div>
                    <p className="mt-3 font-semibold text-slate-800">
                      No categories found
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Change your filters or create your first category.
                    </p>
                    {!search && type === "all" && status === "all" && (
                      <button
                        type="button"
                        onClick={openCreateModal}
                        className="mt-4 font-semibold text-emerald-700 hover:underline"
                      >
                        + Create category
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">{visibleRange}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <span className="px-2 text-sm text-slate-600">
              Page {page} of {Math.max(1, pagination.totalPages)}
            </span>
            <button
              type="button"
              disabled={page >= pagination.totalPages || loading}
              onClick={() => setPage((current) => current + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-modal-title"
            className="my-auto w-full max-w-lg rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2
                  id="category-modal-title"
                  className="text-lg font-bold text-slate-900"
                >
                  {editingCategory ? "Edit category" : "Create category"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add details for this finance category.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close modal"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              {notice && (
                <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  {notice}
                </p>
              )}

              <div>
                <label
                  htmlFor="category-name"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Category name *
                </label>
                <input
                  id="category-name"
                  required
                  maxLength={60}
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="e.g. Groceries"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label
                  htmlFor="category-type"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Category type *
                </label>
                <select
                  id="category-type"
                  value={form.type}
                  onChange={(event) =>
                    setForm({ ...form, type: event.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="both">Both income and expense</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="category-description"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Description
                </label>
                <textarea
                  id="category-description"
                  rows={3}
                  maxLength={200}
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  placeholder="What is this category used for?"
                  className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label
                  htmlFor="category-color"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Display color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="category-color"
                    type="color"
                    value={form.color}
                    onChange={(event) =>
                      setForm({ ...form, color: event.target.value })
                    }
                    className="h-11 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                  />
                  <span className="text-sm text-slate-500">{form.color}</span>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingCategory
                      ? "Save changes"
                      : "Create category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
