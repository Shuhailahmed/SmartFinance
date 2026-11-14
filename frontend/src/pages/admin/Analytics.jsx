import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Download,
  RefreshCw,
  TrendingUp,
  Wallet,
  AlertCircle,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  getIncomeExpenseData,
  getExpenseBreakdown,
  getAdminStats,
} from "../../services/adminService";

const COLORS = [
  "#10b981",
  "#6366f1",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#8b5cf6",
  "#f97316",
  "#64748b",
];

const formatMoney = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const unwrapArray = (response) => {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.data)) return response.data;

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  return [];
};

const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </h3>
        <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
      </div>
      <div className={`rounded-xl p-3 ${color}`}>
        <Icon size={21} />
      </div>
    </div>
  </div>
);

const ChartCard = ({ title, description, children, className = "" }) => (
  <section
    className={`min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
  >
    <div className="mb-5">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
    {children}
  </section>
);

const Analytics = () => {
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState("6");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const results = await Promise.allSettled([
        getIncomeExpenseData(),
        getExpenseBreakdown(),
        getAdminStats(),
      ]);

      const [incomeResult, expenseResult, statsResult] = results;

      if (results.every((result) => result.status === "rejected")) {
        throw new Error(
          "Analytics APIs could not be reached. Check your backend and admin authentication.",
        );
      }

      if (incomeResult.status === "fulfilled") {
        setMonthlyData(unwrapArray(incomeResult.value));
      } else {
        setMonthlyData([]);
      }

      if (expenseResult.status === "fulfilled") {
        setCategoryData(unwrapArray(expenseResult.value));
      } else {
        setCategoryData([]);
      }

      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value);
      } else {
        setStats(null);
      }

      const failures = results.filter(
        (result) => result.status === "rejected",
      ).length;

      if (failures > 0) {
        setError(
          `${failures} analytics request(s) failed. Some sections may be unavailable.`,
        );
      }
    } catch (err) {
      console.error("Analytics loading error:", err);
      setError(err?.message || "Unable to load analytics. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const filteredMonthlyData = useMemo(() => {
    const count = Number(period);
    return monthlyData.slice(-count).map((item) => ({
      ...item,
      income: Number(item.income) || 0,
      expenses: Number(item.expenses) || 0,
      label: item.year
        ? `${item.month} '${String(item.year).slice(-2)}`
        : item.month,
    }));
  }, [monthlyData, period]);

  const totals = useMemo(() => {
    const income = filteredMonthlyData.reduce(
      (sum, item) => sum + item.income,
      0,
    );
    const expenses = filteredMonthlyData.reduce(
      (sum, item) => sum + item.expenses,
      0,
    );

    const categories = categoryData
      .map((item) => ({
        ...item,
        amount: Number(item.amount) || 0,
        category: item.category || "Uncategorized",
      }))
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    return {
      income,
      expenses,
      balance: income - expenses,
      categories,
      totalCategoryExpenses: categories.reduce(
        (sum, item) => sum + item.amount,
        0,
      ),
    };
  }, [filteredMonthlyData, categoryData]);

  const userCount = stats?.stats?.totalUsers ?? stats?.totalUsers ?? 0;

  const transactionCount =
    stats?.stats?.totalTransactions ?? stats?.totalTransactions ?? 0;
  const exportCsv = () => {
    const rows = [
      ["Month", "Year", "Income (INR)", "Expenses (INR)", "Net (INR)"],
      ...filteredMonthlyData.map((item) => [
        item.month,
        item.year || "",
        item.income,
        item.expenses,
        item.income - item.expenses,
      ]),
    ];

    rows.push([]);
    rows.push(["Expense Category", "Amount (INR)"]);
    totals.categories.forEach((item) => {
      rows.push([item.category, item.amount]);
    });

    const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "smart-finance-admin-analytics.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-1 text-sm font-medium text-emerald-700">
            Administration / Analytics
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Financial Analytics
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Monitor platform-wide financial activity and spending patterns.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadAnalytics(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!monthlyData.length && !categoryData.length}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* API error */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Analytics warning</p>
            <p className="mt-1">{error}</p>
            <button
              type="button"
              onClick={() => loadAnalytics(true)}
              className="mt-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Reporting period */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <CalendarDays size={18} className="text-emerald-600" />
          Reporting period
        </div>
        <select
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="3">Last 3 months</option>
          <option value="6">Last 6 months</option>
        </select>
        <p className="text-xs text-slate-500">
          Period filter applies to the monthly chart and income/expense totals.
          Category breakdown uses all available expense records.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total income"
          value={formatMoney(totals.income)}
          subtitle={`Across ${filteredMonthlyData.length} displayed months`}
          icon={ArrowUpRight}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Total expenses"
          value={formatMoney(totals.expenses)}
          subtitle="Across the displayed months"
          icon={ArrowDownRight}
          color="bg-rose-50 text-rose-600"
        />
        <StatCard
          title="Net cash flow"
          value={formatMoney(totals.balance)}
          subtitle={
            totals.balance >= 0
              ? "Income exceeds expenses"
              : "Expenses exceed income"
          }
          icon={Wallet}
          color="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          title="Total users"
          value={Number(userCount).toLocaleString("en-IN")}
          subtitle={`${Number(transactionCount).toLocaleString("en-IN")} transactions recorded`}
          icon={Activity}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Monthly income and expenses */}
      <ChartCard
        title="Income vs. expenses"
        description="Monthly financial movement across the platform"
      >
        {filteredMonthlyData.length ? (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={filteredMonthlyData}
                margin={{ top: 10, right: 8, left: 4, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="incomeGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="expenseGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={75}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  tickFormatter={(value) =>
                    value >= 100000
                      ? `₹${(value / 100000).toFixed(1)}L`
                      : value >= 1000
                        ? `₹${(value / 1000).toFixed(0)}k`
                        : `₹${value}`
                  }
                />
                <Tooltip
                  formatter={(value, name) => [formatMoney(value), name]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 8px 24px rgba(15,23,42,.08)",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fill="url(#incomeGradient)"
                  activeDot={{ r: 5 }}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  fill="url(#expenseGradient)"
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <BarChart3 size={32} className="text-slate-300" />
            <p className="mt-3 font-medium text-slate-700">
              No monthly data available
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Add transactions with valid dates to populate this chart.
            </p>
          </div>
        )}
      </ChartCard>

      {/* Expense categories and cash flow */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ChartCard
          title="Expense breakdown"
          description="Categories ranked by recorded expense amount"
        >
          {totals.categories.length ? (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={totals.categories.slice(0, 8)}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={94}
                      paddingAngle={3}
                    >
                      {totals.categories.slice(0, 8).map((item, index) => (
                        <Cell
                          key={`${item.category}-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatMoney(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-3">
                {totals.categories.slice(0, 5).map((item, index) => (
                  <div
                    key={`${item.category}-${index}`}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <span className="truncate text-slate-600">
                        {item.category}
                      </span>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="font-semibold text-slate-900">
                        {formatMoney(item.amount)}
                      </span>
                      <span className="ml-2 text-xs text-slate-500">
                        {totals.totalCategoryExpenses
                          ? `${(
                              (item.amount / totals.totalCategoryExpenses) *
                              100
                            ).toFixed(1)}%`
                          : "0%"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <PieChartIcon size={32} className="text-slate-300" />
              <p className="mt-3 font-medium text-slate-700">
                No expenses found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Category analytics will appear when expense records exist.
              </p>
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Monthly net cash flow"
          description="Compare income and expenses for each month"
        >
          {filteredMonthlyData.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredMonthlyData.map((item) => ({
                    ...item,
                    net: item.income - item.expenses,
                  }))}
                  margin={{ top: 10, right: 4, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    stroke="#e2e8f0"
                    strokeDasharray="4 4"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={70}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    tickFormatter={(value) =>
                      value >= 1000 || value <= -1000
                        ? `₹${(value / 1000).toFixed(0)}k`
                        : `₹${value}`
                    }
                  />
                  <Tooltip formatter={(value) => formatMoney(value)} />
                  <Bar
                    dataKey="net"
                    name="Net cash flow"
                    fill="#6366f1"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-slate-500">
              No cash flow data available.
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
            <TrendingUp size={18} className="shrink-0 text-indigo-600" />
            <span>
              Net cash flow is calculated as income minus expenses for each
              displayed month.
            </span>
          </div>
        </ChartCard>
      </div>

      {/* Category table */}
      <ChartCard
        title="Category performance"
        description="A detailed view of recorded platform-wide expenses"
      >
        {totals.categories.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[460px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-3 font-semibold">Category</th>
                  <th className="px-3 py-3 text-right font-semibold">Amount</th>
                  <th className="px-3 py-3 text-right font-semibold">Share</th>
                </tr>
              </thead>
              <tbody>
                {totals.categories.map((item, index) => {
                  const share = totals.totalCategoryExpenses
                    ? (item.amount / totals.totalCategoryExpenses) * 100
                    : 0;

                  return (
                    <tr
                      key={`${item.category}-${index}`}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >
                      <td className="px-3 py-4 font-medium text-slate-800">
                        {item.category}
                      </td>
                      <td className="px-3 py-4 text-right font-semibold text-slate-900">
                        {formatMoney(item.amount)}
                      </td>
                      <td className="px-3 py-4 text-right text-slate-500">
                        {share.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-slate-500">
            No category records are available yet.
          </p>
        )}
      </ChartCard>

      <p className="text-xs text-slate-400">
        Analytics are calculated from available API responses. Category totals
        currently include all expense records returned by the backend, while
        monthly figures use the selected display period.
      </p>
    </div>
  );
};

export default Analytics;
