import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import {
  deleteAdminTransaction,
  getAdminTransactionDetails,
  getAdminTransactions,
} from "../../services/adminService";

const initialStats = {
  totalTransactions: 0,
  totalIncome: 0,
  totalExpenses: 0,
  incomeCount: 0,
  expenseCount: 0,
};

const currency = (value = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const dateLabel = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const downloadCSV = (transactions) => {
  const columns = [
    "Date",
    "User",
    "Email",
    "Type",
    "Category",
    "Description",
    "Payment Method",
    "Amount",
    "Notes",
  ];

  const escapeCSV = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

  const rows = transactions.map((item) => [
    dateLabel(item.date),
    item.userId?.name,
    item.userId?.email,
    item.type,
    item.category,
    item.description,
    item.paymentMethod,
    item.amount,
    item.notes,
  ]);

  const csv = [columns, ...rows]
    .map((row) => row.map(escapeCSV).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "smart-finance-transactions.csv";
  link.click();
  URL.revokeObjectURL(url);
};

const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{title}</p>
        <p className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </p>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      </div>
      <div className={`rounded-xl p-3 ${color}`}>
        <Icon size={21} />
      </div>
    </div>
  </div>
);

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(initialStats);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [limit, setLimit] = useState(10);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [notice, setNotice] = useState("");

  const loadTransactions = useCallback(
    async ({ refresh = false, page = pagination.page } = {}) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      try {
        setError("");

        const response = await getAdminTransactions({
          page,
          limit,
          search,
          type: type === "all" ? "" : type,
          startDate,
          endDate,
          sortBy,
          sortOrder,
        });

        if (!response?.success) {
          throw new Error(response?.message || "Could not load transactions.");
        }

        setTransactions(response.transactions || []);
        setStats(response.stats || initialStats);
        setPagination(
          response.pagination || {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        );
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Transactions load nahi hue. Backend API check karo.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      pagination.page,
      limit,
      search,
      type,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    ],
  );

  useEffect(() => {
    loadTransactions({ page: 1 });
  }, [search, type, startDate, endDate, sortBy, sortOrder, limit]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadTransactions({ refresh: true });
    }, 30000);

    return () => clearInterval(interval);
  }, [loadTransactions]);

  const netBalance = useMemo(
    () => stats.totalIncome - stats.totalExpenses,
    [stats.totalIncome, stats.totalExpenses],
  );

  const openDetails = async (id) => {
    setDetailLoading(true);
    setSelected(null);

    try {
      const response = await getAdminTransactionDetails(id);
      setSelected(response.transaction);
    } catch (err) {
      setNotice(
        err.response?.data?.message || "Transaction details load nahi hue.",
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Delete this ${item.type} transaction of ${currency(item.amount)}? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingId(item._id);
    setNotice("");

    try {
      await deleteAdminTransaction(item._id);
      setSelected(null);
      setNotice("Transaction deleted successfully.");
      await loadTransactions({ refresh: true });
    } catch (err) {
      setNotice(err.response?.data?.message || "Transaction delete nahi hua.");
    } finally {
      setDeletingId("");
    }
  };

  const exportCSV = async () => {
    try {
      // Export every matching record, not just the current page.
      const response = await getAdminTransactions({
        page: 1,
        limit: 100,
        search,
        type: type === "all" ? "" : type,
        startDate,
        endDate,
        sortBy,
        sortOrder,
      });

      const total = response.pagination?.total || 0;
      let allRows = response.transactions || [];

      for (let page = 2; page <= Math.ceil(total / 100); page += 1) {
        const next = await getAdminTransactions({
          page,
          limit: 100,
          search,
          type: type === "all" ? "" : type,
          startDate,
          endDate,
          sortBy,
          sortOrder,
        });
        allRows = allRows.concat(next.transactions || []);
      }

      downloadCSV(allRows);
      setNotice(`Exported ${allRows.length} transactions.`);
    } catch (err) {
      setNotice(err.response?.data?.message || "CSV export failed.");
    }
  };

  const changePage = (nextPage) => {
    if (nextPage < 1 || nextPage > pagination.totalPages) return;
    loadTransactions({ page: nextPage });
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setType("all");
    setStartDate("");
    setEndDate("");
    setSortBy("date");
    setSortOrder("desc");
    setLimit(10);
  };

  return (
    <div className="min-w-0 space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-emerald-600">
            Administration / Transactions
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Transaction Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor platform transactions, review activity and manage records.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadTransactions({ refresh: true })}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            type="button"
            onClick={exportCSV}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </header>

      {notice && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total transactions"
          value={stats.totalTransactions.toLocaleString("en-IN")}
          subtitle={`${stats.incomeCount} income · ${stats.expenseCount} expense`}
          icon={Activity}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Total income"
          value={currency(stats.totalIncome)}
          subtitle="All recorded income"
          icon={ArrowUpRight}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Total expenses"
          value={currency(stats.totalExpenses)}
          subtitle="All recorded expenses"
          icon={ArrowDownRight}
          color="bg-rose-50 text-rose-600"
        />
        <StatCard
          title="Net balance"
          value={currency(netBalance)}
          subtitle="Income minus expenses"
          icon={Wallet}
          color="bg-violet-50 text-violet-600"
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
            <div>
              <h2 className="font-semibold text-slate-900">All transactions</h2>
              <p className="mt-1 text-xs text-slate-500">
                {pagination.total.toLocaleString("en-IN")} matching records ·
                Auto-refresh every 30 seconds
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              <div className="relative sm:col-span-2 xl:col-span-1">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search user, email, category..."
                  aria-label="Search transactions"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <select
                value={type}
                onChange={(event) => setType(event.target.value)}
                aria-label="Transaction type"
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
              >
                <option value="all">All types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>

              <select
                value={limit}
                onChange={(event) => setLimit(Number(event.target.value))}
                aria-label="Rows per page"
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>

              <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-500">
                <CalendarDays size={15} />
                <span>From</span>
                <input
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(event) => setStartDate(event.target.value)}
                  aria-label="Start date"
                  className="min-w-0 bg-transparent text-sm text-slate-700 outline-none"
                />
              </label>

              <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-500">
                <CalendarDays size={15} />
                <span>To</span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(event) => setEndDate(event.target.value)}
                  aria-label="End date"
                  className="min-w-0 bg-transparent text-sm text-slate-700 outline-none"
                />
              </label>

              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  aria-label="Sort field"
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 px-2 py-2.5 text-sm outline-none"
                >
                  <option value="date">Date</option>
                  <option value="amount">Amount</option>
                  <option value="createdAt">Created</option>
                  <option value="category">Category</option>
                </select>
                <button
                  type="button"
                  onClick={() =>
                    setSortOrder((value) => (value === "desc" ? "asc" : "desc"))
                  }
                  className="rounded-xl border border-slate-200 px-3 text-sm text-slate-700 hover:bg-slate-50"
                  title={`Sort ${sortOrder === "desc" ? "ascending" : "descending"}`}
                >
                  {sortOrder === "desc" ? "↓" : "↑"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-500">
              Showing{" "}
              {transactions.length
                ? (pagination.page - 1) * pagination.limit + 1
                : 0}
              {"–"}
              {(pagination.page - 1) * pagination.limit + transactions.length}
              {" of "}
              {pagination.total}
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Clear filters
            </button>
          </div>
        </div>

        {error && (
          <div className="m-4 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <ShieldAlert size={20} className="shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">Unable to load transactions</p>
              <p className="mt-1">{error}</p>
              <button
                type="button"
                onClick={() => loadTransactions({ refresh: true })}
                className="mt-2 font-semibold underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Transaction</th>
                <th className="px-5 py-4 font-semibold">User</th>
                <th className="px-5 py-4 font-semibold">Type</th>
                <th className="px-5 py-4 font-semibold">Payment</th>
                <th className="px-5 py-4 font-semibold">Date</th>
                <th className="px-5 py-4 text-right font-semibold">Amount</th>
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
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                      <Activity size={22} />
                    </div>
                    <p className="mt-3 font-semibold text-slate-800">
                      No transactions found
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Try changing your search or filters.
                    </p>
                  </td>
                </tr>
              ) : (
                transactions.map((item) => (
                  <tr
                    key={item._id}
                    className="transition hover:bg-slate-50/80"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {item.category || "Uncategorized"}
                      </p>
                      <p className="mt-1 max-w-[230px] truncate text-xs text-slate-500">
                        {item.description || item.notes || "No description"}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">
                        {item.userId?.name || "Deleted / unknown user"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.userId?.email || "—"}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.type === "income"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {item.type === "income" ? "Income" : "Expense"}
                      </span>
                    </td>
                    <td className="px-5 py-4 capitalize text-slate-600">
                      {(item.paymentMethod || "other").replaceAll("_", " ")}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                      {dateLabel(item.date)}
                    </td>
                    <td
                      className={`px-5 py-4 text-right font-bold whitespace-nowrap ${
                        item.type === "income"
                          ? "text-emerald-700"
                          : "text-rose-700"
                      }`}
                    >
                      {item.type === "income" ? "+" : "−"}
                      {currency(item.amount)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openDetails(item._id)}
                          aria-label="View transaction details"
                          title="View details"
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === item._id}
                          aria-label="Delete transaction"
                          title="Delete transaction"
                          className="rounded-lg border border-rose-100 p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                        >
                          {deletingId === item._id ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-col justify-between gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
          <p className="text-sm text-slate-500">
            Page {pagination.page} of {Math.max(1, pagination.totalPages)}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => changePage(pagination.page - 1)}
              disabled={loading || pagination.page <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <button
              type="button"
              onClick={() => changePage(pagination.page + 1)}
              disabled={loading || pagination.page >= pagination.totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </footer>
      </section>

      {(selected || detailLoading) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-detail-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2
                  id="transaction-detail-title"
                  className="font-bold text-slate-900"
                >
                  Transaction details
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Full record from the database
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close details"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            {detailLoading ? (
              <div className="space-y-3 p-5">
                <div className="h-6 animate-pulse rounded bg-slate-100" />
                <div className="h-6 animate-pulse rounded bg-slate-100" />
                <div className="h-6 animate-pulse rounded bg-slate-100" />
              </div>
            ) : (
              selected && (
                <div className="space-y-4 p-5">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">
                      {selected.category}
                    </p>
                    <p
                      className={`mt-1 text-2xl font-bold ${
                        selected.type === "income"
                          ? "text-emerald-700"
                          : "text-rose-700"
                      }`}
                    >
                      {selected.type === "income" ? "+" : "−"}
                      {currency(selected.amount)}
                    </p>
                    <p className="mt-1 text-xs capitalize text-slate-500">
                      {selected.type} · {dateLabel(selected.date)}
                    </p>
                  </div>

                  {[
                    ["User", selected.userId?.name || "Deleted / unknown user"],
                    ["Email", selected.userId?.email || "—"],
                    ["Description", selected.description || "—"],
                    [
                      "Payment method",
                      (selected.paymentMethod || "other").replaceAll("_", " "),
                    ],
                    ["Notes", selected.notes || "—"],
                    ["Created at", dateLabel(selected.createdAt)],
                    ["Transaction ID", selected._id],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex flex-col gap-1 border-b border-slate-100 pb-3 sm:flex-row sm:justify-between"
                    >
                      <span className="text-sm text-slate-500">{label}</span>
                      <span className="break-all text-sm font-medium text-slate-800 sm:max-w-[65%] sm:text-right">
                        {value}
                      </span>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => handleDelete(selected)}
                    disabled={Boolean(deletingId)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                  >
                    <Trash2 size={16} /> Delete transaction
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
