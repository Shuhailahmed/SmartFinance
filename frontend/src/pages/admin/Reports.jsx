import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Download,
  FileBarChart,
  RefreshCw,
  Wallet,
  AlertCircle,
  TrendingUp,
  Receipt,
} from "lucide-react";
import {
  getIncomeExpenseData,
  getExpenseBreakdown,
} from "../../services/adminService";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const currentDate = new Date();

const Reports = () => {
  const [period, setPeriod] = useState("6");
  const [reportType, setReportType] = useState("all");
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [incomeResponse, expenseResponse] = await Promise.all([
        getIncomeExpenseData(),
        getExpenseBreakdown(),
      ]);

      setMonthlyData(
        Array.isArray(incomeResponse?.data) ? incomeResponse.data : [],
      );

      setCategoryData(
        Array.isArray(expenseResponse?.data) ? expenseResponse.data : [],
      );
    } catch (err) {
      console.error("Admin reports error:", err);
      setError(
        err.response?.data?.message ||
          "Reports load nahi hue. Backend API aur admin authentication check karo.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const filteredMonths = useMemo(() => {
    const count = Number(period);
    const months = monthlyData.slice(-count);

    if (reportType === "income") {
      return months.map((item) => ({ ...item, expenses: 0 }));
    }

    if (reportType === "expenses") {
      return months.map((item) => ({ ...item, income: 0 }));
    }

    return months;
  }, [monthlyData, period, reportType]);

  const filteredCategories = useMemo(() => {
    return [...categoryData]
      .filter((item) => Number(item.amount) > 0)
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 6);
  }, [categoryData]);

  const totals = useMemo(() => {
    const income = filteredMonths.reduce(
      (sum, item) => sum + Number(item.income || 0),
      0,
    );

    const expenses = filteredMonths.reduce(
      (sum, item) => sum + Number(item.expenses || 0),
      0,
    );

    const categoryTotal = filteredCategories.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );

    return {
      income,
      expenses,
      balance: income - expenses,
      categoryTotal,
    };
  }, [filteredMonths, filteredCategories]);

  const maxMonthlyValue = Math.max(
    1,
    ...filteredMonths.flatMap((item) => [
      Number(item.income || 0),
      Number(item.expenses || 0),
    ]),
  );

  const exportCSV = () => {
    const rows = [
      ["Monthly Financial Report"],
      ["Generated At", new Date().toLocaleString("en-IN")],
      [],
      ["Month", "Year", "Income (INR)", "Expenses (INR)", "Net Balance (INR)"],
      ...filteredMonths.map((item) => [
        item.month,
        item.year,
        Number(item.income || 0),
        Number(item.expenses || 0),
        Number(item.income || 0) - Number(item.expenses || 0),
      ]),
      [],
      ["Expense Category", "Amount (INR)"],
      ...filteredCategories.map((item) => [item.category, item.amount]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell ?? "");
            return `"${value.replace(/"/g, '""')}"`;
          })
          .join(","),
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "smart-finance-admin-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-full space-y-6 pb-8">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700">
            <FileBarChart size={17} />
            Administration / Reports
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Reports Management
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Review financial performance, income, expenses and spending trends.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadReports}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={exportCSV}
            disabled={loading || monthlyData.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Unable to load reports</p>
            <p className="mt-1">{error}</p>
            <button
              type="button"
              onClick={loadReports}
              className="mt-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <CalendarDays size={18} className="text-emerald-600" />
          Reporting period
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            aria-label="Reporting period"
          >
            <option value="3">Last 3 months</option>
            <option value="6">Last 6 months</option>
          </select>

          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            aria-label="Report type"
          >
            <option value="all">Income & Expenses</option>
            <option value="income">Income only</option>
            <option value="expenses">Expenses only</option>
          </select>
        </div>
      </section>

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Income"
          value={currency(totals.income)}
          note="For selected reporting period"
          icon={ArrowUpRight}
          color="emerald"
          loading={loading}
        />

        <SummaryCard
          title="Total Expenses"
          value={currency(totals.expenses)}
          note="For selected reporting period"
          icon={ArrowDownRight}
          color="rose"
          loading={loading}
        />

        <SummaryCard
          title="Net Balance"
          value={currency(totals.balance)}
          note="Income minus expenses"
          icon={Wallet}
          color="blue"
          loading={loading}
        />

        <SummaryCard
          title="Expense Categories"
          value={String(categoryData.length)}
          note="Categories with recorded expenses"
          icon={Receipt}
          color="violet"
          loading={loading}
        />
      </section>

      {/* Monthly chart */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Income vs Expenses
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Monthly comparison from recorded transactions
            </p>
          </div>

          <div className="flex gap-4 text-xs font-medium text-slate-600">
            {reportType !== "expenses" && (
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Income
              </span>
            )}
            {reportType !== "income" && (
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                Expenses
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
        ) : filteredMonths.length === 0 ? (
          <EmptyState message="No monthly transaction data is available yet." />
        ) : (
          <div className="overflow-x-auto">
            <div className="flex h-64 min-w-[520px] items-end gap-3 border-b border-slate-200 px-2 sm:gap-5">
              {filteredMonths.map((item, index) => (
                <div
                  key={`${item.year}-${item.month}-${index}`}
                  className="flex h-full min-w-0 flex-1 flex-col justify-end"
                >
                  <div className="flex h-[calc(100%-28px)] items-end justify-center gap-1.5">
                    {reportType !== "income" && (
                      <div
                        title={`Expenses: ${currency(item.expenses)}`}
                        className="min-h-1 w-3/12 max-w-8 rounded-t-md bg-rose-400 transition-all duration-500 sm:w-5/12"
                        style={{
                          height: `${Math.max(
                            item.expenses > 0 ? 2 : 0,
                            (Number(item.expenses || 0) / maxMonthlyValue) *
                              100,
                          )}%`,
                        }}
                      />
                    )}

                    {reportType !== "expenses" && (
                      <div
                        title={`Income: ${currency(item.income)}`}
                        className="min-h-1 w-3/12 max-w-8 rounded-t-md bg-emerald-500 transition-all duration-500 sm:w-5/12"
                        style={{
                          height: `${Math.max(
                            item.income > 0 ? 2 : 0,
                            (Number(item.income || 0) / maxMonthlyValue) * 100,
                          )}%`,
                        }}
                      />
                    )}
                  </div>

                  <p className="mt-2 truncate pb-2 text-center text-xs font-medium text-slate-500">
                    {item.month}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Detailed report sections */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Monthly table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="font-bold text-slate-900">Monthly Breakdown</h2>
            <p className="mt-1 text-sm text-slate-500">
              Detailed income and expense figures
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Month</th>
                  <th className="px-4 py-3 text-right font-semibold">Income</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Expense
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {!loading &&
                  filteredMonths.map((item, index) => (
                    <tr key={`${item.year}-${item.month}-${index}`}>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {item.month} {item.year}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-emerald-700">
                        {currency(item.income)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-rose-600">
                        {currency(item.expenses)}
                      </td>
                    </tr>
                  ))}

                {!loading && filteredMonths.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8">
                      <EmptyState message="No monthly data found." />
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      Loading report data...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900">Expense Breakdown</h2>
              <p className="mt-1 text-sm text-slate-500">
                Highest-spending categories
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
              <TrendingUp size={20} />
            </div>
          </div>

          {loading ? (
            <div className="space-y-5">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-12 animate-pulse rounded-lg bg-slate-100"
                />
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <EmptyState message="No expense categories found." />
          ) : (
            <div className="space-y-5">
              {filteredCategories.map((item, index) => {
                const percentage =
                  totals.categoryTotal > 0
                    ? (Number(item.amount) / totals.categoryTotal) * 100
                    : 0;

                return (
                  <div key={`${item.category}-${index}`}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-medium text-slate-700">
                        {item.category}
                      </span>
                      <span className="whitespace-nowrap text-sm font-semibold text-slate-900">
                        {currency(item.amount)}
                      </span>
                    </div>

                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{
                          width: `${Math.min(100, percentage)}%`,
                        }}
                      />
                    </div>

                    <p className="mt-1 text-right text-xs text-slate-400">
                      {percentage.toFixed(1)}% of displayed categories
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Footer note */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        <Activity size={19} className="mt-0.5 shrink-0" />
        <p>
          Figures are based on the data returned by your admin analytics APIs.
          The category breakdown reflects the backend endpoint's returned
          expense data and may cover all recorded dates rather than only the
          selected monthly period.
        </p>
      </div>
    </div>
  );
};

function SummaryCard({ title, value, note, icon: Icon, color, loading }) {
  const styles = {
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-600",
    blue: "bg-blue-50 text-blue-700",
    violet: "bg-violet-50 text-violet-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          {loading ? (
            <div className="mt-3 h-7 w-28 animate-pulse rounded bg-slate-100" />
          ) : (
            <p className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-900">
              {value}
            </p>
          )}
        </div>

        <div className={`rounded-xl p-3 ${styles[color]}`}>
          <Icon size={21} />
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">{note}</p>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex min-h-28 flex-col items-center justify-center gap-2 text-center">
      <FileBarChart size={27} className="text-slate-300" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

export default Reports;
