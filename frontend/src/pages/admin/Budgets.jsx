import { useCallback, useEffect, useState } from "react";
import {
  Wallet,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Search,
  RefreshCw,
  Download,
  Pencil,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Users,
  LoaderCircle,
} from "lucide-react";
import {
  getAdminBudgets,
  updateAdminBudget,
  deleteAdminBudget,
  exportAdminBudgets,
} from "../../services/adminBudgetService";

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const initialPeriod = () => {
  const now = new Date();
  return { month: String(now.getMonth() + 1), year: String(now.getFullYear()) };
};

const StatCard = ({ title, value, detail, icon: Icon, color }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </p>
        <p className="mt-2 text-xs text-slate-500">{detail}</p>
      </div>
      <div className={`rounded-xl p-3 ${color}`}>
        <Icon size={21} />
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    safe: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    exceeded: "bg-rose-50 text-rose-700",
  };

  const labels = {
    safe: "Within budget",
    warning: "Near limit",
    exceeded: "Exceeded",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] || "bg-slate-100 text-slate-600"}`}
    >
      {labels[status] || status}
    </span>
  );
};

const Budgets = () => {
  const [period, setPeriod] = useState(initialPeriod);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState("10");
  const [result, setResult] = useState({
    data: [],
    pagination: { page: 1, pages: 1, total: 0 },
    summary: {},
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const fetchBudgets = useCallback(
    async (quiet = false) => {
      if (quiet) setRefreshing(true);
      else setLoading(true);

      setError("");

      try {
        const response = await getAdminBudgets({
          month: Number(period.month),
          year: Number(period.year),
          page,
          limit: Number(limit),
          search,
          status,
          sortBy,
          sortOrder,
        });

        setResult({
          data: response.data || [],
          pagination: response.pagination || { page: 1, pages: 1, total: 0 },
          summary: response.summary || {},
        });
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Budgets load nahi hue. Backend server aur admin login check karo.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [period, page, limit, search, status, sortBy, sortOrder],
  );

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const changePeriod = (key, value) => {
    setPeriod((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleEdit = (budget) => {
    setEditing({
      _id: budget._id,
      category: budget.category,
      amount: String(budget.amount),
      month: String(budget.month),
      year: String(budget.year),
    });
    setNotice("");
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    if (!editing) return;

    const amount = Number(editing.amount);
    if (!editing.category.trim() || !Number.isFinite(amount) || amount <= 0) {
      setError("Valid category aur positive budget amount enter karo.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await updateAdminBudget(editing._id, {
        category: editing.category.trim(),
        amount,
        month: Number(editing.month),
        year: Number(editing.year),
      });

      setEditing(null);
      setNotice("Budget updated successfully.");
      await fetchBudgets(true);
    } catch (err) {
      setError(err.response?.data?.message || "Budget update nahi hua.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (budget) => {
    const confirmed = window.confirm(
      `Delete ${budget.category} budget for ${budget.user?.name || "this user"}?`,
    );
    if (!confirmed) return;

    setDeletingId(budget._id);
    setError("");
    setNotice("");

    try {
      await deleteAdminBudget(budget._id);
      setNotice("Budget deleted successfully.");
      await fetchBudgets(true);
    } catch (err) {
      setError(err.response?.data?.message || "Budget delete nahi hua.");
    } finally {
      setDeletingId("");
    }
  };

  const summary = result.summary || {};
  const totalAllocated = summary.allocated || 0;
  const totalSpent = summary.spent || 0;
  const usage =
    totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

  const monthOptions = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div className="min-h-full space-y-6 pb-8">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-medium text-emerald-700">
            Administration / Budgets
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Budget Management
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Monitor budget limits, spending and users across your platform.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => fetchBudgets(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={async () => {
              setError("");
              try {
                await exportAdminBudgets({
                  month: Number(period.month),
                  year: Number(period.year),
                });
              } catch (err) {
                setError(err.response?.data?.message || "CSV export failed.");
              }
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          <div>
            <p className="font-semibold">Something went wrong</p>
            <p className="mt-1">{error}</p>
            <button
              className="mt-2 font-semibold underline"
              onClick={() => fetchBudgets(true)}
            >
              Try again
            </button>
          </div>
          <button aria-label="Dismiss error" onClick={() => setError("")}>
            <X size={18} />
          </button>
        </div>
      )}

      {notice && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {notice}
          <button aria-label="Dismiss notice" onClick={() => setNotice("")}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <CalendarDays size={18} className="text-emerald-600" />
          Reporting period
        </div>
        <select
          aria-label="Month"
          value={period.month}
          onChange={(e) => changePeriod("month", e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
        >
          {monthOptions.map((month, i) => (
            <option key={month} value={i + 1}>
              {month}
            </option>
          ))}
        </select>
        <select
          aria-label="Year"
          value={period.year}
          onChange={(e) => changePeriod("year", e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
        >
          {Array.from(
            { length: 7 },
            (_, i) => new Date().getFullYear() - 3 + i,
          ).map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-500">
          Figures are calculated from saved budgets and expense transactions.
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total budgets"
          value={summary.budgets ?? 0}
          detail={`${summary.activeUsers ?? 0} users with budgets`}
          icon={Wallet}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Total allocated"
          value={money(totalAllocated)}
          detail="Budget limit for selected period"
          icon={ShieldCheck}
          color="bg-violet-50 text-violet-600"
        />
        <StatCard
          title="Total spent"
          value={money(totalSpent)}
          detail={`${usage}% of allocated budget`}
          icon={TrendingUp}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Budgets at risk"
          value={(summary.warning || 0) + (summary.exceeded || 0)}
          detail={`${summary.exceeded || 0} exceeded · ${summary.warning || 0} near limit`}
          icon={AlertTriangle}
          color="bg-rose-50 text-rose-600"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">
              Overall budget utilization
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {money(totalSpent)} spent out of {money(totalAllocated)}
            </p>
          </div>
          <p
            className={`text-2xl font-bold ${usage >= 100 ? "text-rose-600" : usage >= 80 ? "text-amber-600" : "text-emerald-600"}`}
          >
            {usage}%
          </p>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all ${usage >= 100 ? "bg-rose-500" : usage >= 80 ? "bg-amber-500" : "bg-emerald-500"}`}
            style={{ width: `${Math.min(usage, 100)}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-500">
          <span>0% used</span>
          <span>100% allocated</span>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">All user budgets</h2>
            <p className="mt-1 text-sm text-slate-500">
              {result.pagination.total || 0} matching records
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex">
            <label className="relative block">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search user or category..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 xl:w-60"
              />
            </label>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="safe">Within budget</option>
              <option value="warning">Near limit</option>
              <option value="exceeded">Exceeded</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            >
              <option value="createdAt">Newest first</option>
              <option value="category">Category</option>
              <option value="amount">Budget amount</option>
              <option value="spent">Amount spent</option>
              <option value="remaining">Remaining amount</option>
              <option value="percentage">Usage percentage</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500">
            <LoaderCircle className="animate-spin" size={22} />
            Loading live budget data...
          </div>
        ) : result.data.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
            <div className="rounded-2xl bg-slate-100 p-4 text-slate-500">
              <Users size={28} />
            </div>
            <p className="mt-4 font-semibold text-slate-800">
              No budgets found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Try a different period or remove some filters.
            </p>
            <button
              onClick={() => {
                setSearchInput("");
                setSearch("");
                setStatus("all");
              }}
              className="mt-3 text-sm font-semibold text-emerald-700 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">User / Category</th>
                    <th className="px-5 py-4">Period</th>
                    <th className="px-5 py-4">Allocated</th>
                    <th className="px-5 py-4">Spent</th>
                    <th className="px-5 py-4">Remaining</th>
                    <th className="px-5 py-4">Utilization</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.data.map((budget) => (
                    <tr
                      key={budget._id}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {budget.user?.name || "Unknown user"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {budget.user?.email || "No email"}
                        </p>
                        <p className="mt-2 inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                          {budget.category}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {monthOptions[budget.month - 1]} {budget.year}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                        {money(budget.amount)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-700">
                        {money(budget.spent)}
                      </td>
                      <td
                        className={`whitespace-nowrap px-5 py-4 font-medium ${budget.remaining < 0 ? "text-rose-600" : "text-emerald-700"}`}
                      >
                        {money(budget.remaining)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${budget.percentage >= 100 ? "bg-rose-500" : budget.percentage >= 80 ? "bg-amber-500" : "bg-emerald-500"}`}
                              style={{
                                width: `${Math.min(budget.percentage, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-600">
                            {budget.percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={budget.status} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            title="Edit budget"
                            onClick={() => handleEdit(budget)}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            title="Delete budget"
                            disabled={deletingId === budget._id}
                            onClick={() => handleDelete(budget)}
                            className="rounded-lg border border-slate-200 p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                          >
                            {deletingId === budget._id ? (
                              <LoaderCircle
                                size={15}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={15} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>Rows per page</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(e.target.value);
                    setPage(1);
                  }}
                  className="rounded-lg border border-slate-200 px-2 py-1.5"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <span className="text-sm text-slate-500">
                  Page {result.pagination.page || page} of{" "}
                  {Math.max(1, result.pagination.pages || 1)}
                </span>
                <button
                  aria-label="Previous page"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  aria-label="Next page"
                  disabled={page >= (result.pagination.pages || 1)}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <form
            onSubmit={saveEdit}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Edit budget
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Update this user budget and its period.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <label className="mb-4 block text-sm font-medium text-slate-700">
              Category
              <input
                required
                maxLength={80}
                value={editing.category}
                onChange={(e) =>
                  setEditing((p) => ({ ...p, category: e.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-500"
              />
            </label>

            <label className="mb-4 block text-sm font-medium text-slate-700">
              Budget amount (₹)
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={editing.amount}
                onChange={(e) =>
                  setEditing((p) => ({ ...p, amount: e.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-emerald-500"
              />
            </label>

            <div className="mb-6 grid grid-cols-2 gap-3">
              <label className="text-sm font-medium text-slate-700">
                Month
                <select
                  value={editing.month}
                  onChange={(e) =>
                    setEditing((p) => ({ ...p, month: e.target.value }))
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                >
                  {monthOptions.map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Year
                <input
                  type="number"
                  min="2000"
                  max="2200"
                  required
                  value={editing.year}
                  onChange={(e) =>
                    setEditing((p) => ({ ...p, year: e.target.value }))
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                />
              </label>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving && <LoaderCircle size={16} className="animate-spin" />}
                Save changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Budgets;
