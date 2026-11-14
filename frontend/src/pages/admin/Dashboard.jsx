import { useCallback, useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Target,
  RefreshCw,
  Activity,
  CalendarDays,
  Wallet,
} from "lucide-react";

import AdminStatCard from "../../components/admin/AdminStatCard";
import RecentUsers from "../../components/admin/RecentUsers";
import IncomeExpenseChart from "../../components/charts/IncomeExpenseChart";
import ExpenseBreakdown from "../../components/charts/ExpenseBreakdown";

import {
  getAdminStats,
  getRecentUsers,
  getIncomeExpenseData,
  getExpenseBreakdown,
  getUserGrowthData,
  getSavingsAnalytics,
  getRecentTransactions,
  getTopActiveUsers,
} from "../../services/adminService";

// ==========================================
// HELPERS
// ==========================================

const initialStats = {
  totalUsers: 0,
  activeUsers: 0,
  inactiveUsers: 0,
  totalTransactions: 0,
  incomeTransactions: 0,
  expenseTransactions: 0,
  totalSavingsGoals: 0,
  activeSavingsGoals: 0,
  completedSavingsGoals: 0,
  financialByCurrency: [],
};

const extractArray = (response, keys = []) => {
  const candidates = [
    response,
    response?.data,
    response?.result,
    response?.data?.data,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;

    if (candidate && typeof candidate === "object") {
      for (const key of keys) {
        if (Array.isArray(candidate[key])) {
          return candidate[key];
        }
      }
    }
  }

  return [];
};

const extractStats = (response) =>
  response?.stats ?? response?.data?.stats ?? response?.data ?? response ?? {};

const formatNumber = (value) => Number(value || 0).toLocaleString("en-IN");

const formatMoney = (amount, currency = "INR") => {
  const numericAmount = Number(amount || 0);

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 0,
    }).format(numericAmount);
  } catch {
    return `${currency || ""} ${formatNumber(numericAmount)}`;
  }
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInitials = (name = "User") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

// ==========================================
// SMALL REUSABLE COMPONENTS
// ==========================================

const SectionHeading = ({ title, subtitle, icon: Icon }) => (
  <div className="mb-5 flex items-center gap-3">
    {Icon && (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
        <Icon size={19} />
      </div>
    )}

    <div>
      <h2 className="text-base font-bold text-slate-900 sm:text-lg">{title}</h2>
      {subtitle && (
        <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">{subtitle}</p>
      )}
    </div>
  </div>
);

const EmptyState = ({ message }) => (
  <div className="flex min-h-36 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm text-slate-500">
    {message}
  </div>
);

const Panel = ({ children, className = "" }) => (
  <div
    className={`min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}
  >
    {children}
  </div>
);

// ==========================================
// USER GROWTH CHART
// No additional chart package required.
// ==========================================

const UserGrowthChart = ({ data = [] }) => {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const now = new Date();

  const months = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);

    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      label: monthNames[date.getMonth()],
      users: 0,
    };
  });

  data.forEach((item) => {
    const matchingMonth = months.find(
      (month) =>
        month.year === Number(item.year) && month.month === Number(item.month),
    );

    if (matchingMonth) {
      matchingMonth.users = Number(item.users || 0);
    }
  });

  const maxUsers = Math.max(...months.map((item) => item.users), 1);

  const totalRegistrations = months.reduce((sum, item) => sum + item.users, 0);

  return (
    <Panel>
      <SectionHeading
        title="User Registration Growth"
        subtitle="New user registrations over the last 12 months"
        icon={Users}
      />

      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">Total registrations</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatNumber(totalRegistrations)}
          </p>
        </div>

        <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          Last 12 months
        </span>
      </div>

      <div className="flex h-48 items-end gap-2 sm:gap-3">
        {months.map((item, index) => (
          <div
            key={`${item.year}-${item.month}`}
            className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
          >
            <span className="text-[10px] font-medium text-slate-500 sm:text-xs">
              {item.users > 0 ? item.users : ""}
            </span>

            <div className="flex h-36 w-full items-end justify-center">
              <div
                title={`${item.label} ${item.year}: ${item.users} users`}
                className="w-full max-w-8 rounded-t-md bg-emerald-500 transition-all duration-300 hover:bg-emerald-600"
                style={{
                  height: `${Math.max(
                    (item.users / maxUsers) * 100,
                    item.users > 0 ? 5 : 0,
                  )}%`,
                }}
              />
            </div>

            <span className="text-[10px] text-slate-500 sm:text-xs">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
};

// ==========================================
// CURRENCY BREAKDOWN
// ==========================================

const CurrencyBreakdown = ({ data = [] }) => (
  <Panel>
    <SectionHeading
      title="Financial Overview"
      subtitle="Income and expenses grouped by user currency"
      icon={Wallet}
    />

    {data.length === 0 ? (
      <EmptyState message="No financial transactions available yet." />
    ) : (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div
            key={`${item.currency}-${index}`}
            className="rounded-xl border border-slate-100 bg-slate-50 p-4"
          >
            <p className="mb-3 text-sm font-bold text-slate-800">
              {item.currency}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-500">Income</p>
                <p className="mt-1 break-words text-sm font-bold text-emerald-600">
                  {formatMoney(item.totalIncome, item.currency)}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Expenses</p>
                <p className="mt-1 break-words text-sm font-bold text-red-500">
                  {formatMoney(item.totalExpenses, item.currency)}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
              <span>
                {formatNumber(item.incomeTransactions)} income transactions
              </span>
              <span>
                {formatNumber(item.expenseTransactions)} expense transactions
              </span>
            </div>
          </div>
        ))}
      </div>
    )}
  </Panel>
);

// ==========================================
// SAVINGS ANALYTICS
// ==========================================

const SavingsAnalytics = ({ data = [] }) => {
  const currencies = [...new Set(data.map((item) => item.currency))];

  return (
    <Panel>
      <SectionHeading
        title="Savings Analytics"
        subtitle="Savings goals grouped by currency and status"
        icon={PiggyBank}
      />

      {data.length === 0 ? (
        <EmptyState message="No savings goals have been created yet." />
      ) : (
        <div className="space-y-4">
          {currencies.map((currency) => {
            const currencyItems = data.filter(
              (item) => item.currency === currency,
            );

            const target = currencyItems.reduce(
              (sum, item) => sum + Number(item.targetAmount || 0),
              0,
            );

            const saved = currencyItems.reduce(
              (sum, item) => sum + Number(item.savedAmount || 0),
              0,
            );

            const percentage =
              target > 0 ? Math.min((saved / target) * 100, 100) : 0;

            const goalCount = currencyItems.reduce(
              (sum, item) => sum + Number(item.goals || 0),
              0,
            );

            return (
              <div
                key={currency}
                className="rounded-xl border border-slate-100 p-4"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="text-sm font-bold text-slate-800">
                    {currency}
                  </span>
                  <span className="text-xs text-slate-500">
                    {goalCount} goals
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500">Saved</p>
                    <p className="mt-1 break-words text-sm font-bold text-emerald-600">
                      {formatMoney(saved, currency)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Target</p>
                    <p className="mt-1 break-words text-sm font-bold text-slate-800">
                      {formatMoney(target, currency)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="mt-2 flex justify-between text-xs text-slate-500">
                  <span>{percentage.toFixed(1)}% saved</span>
                  <span>
                    {currencyItems
                      .map((item) => `${item.status}: ${item.goals}`)
                      .join(" · ")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
};

// ==========================================
// TOP ACTIVE USERS
// ==========================================

const TopActiveUsers = ({ users = [] }) => (
  <Panel>
    <SectionHeading
      title="Top Active Users"
      subtitle="Users ranked by transaction activity"
      icon={Activity}
    />

    {users.length === 0 ? (
      <EmptyState message="No user transaction activity available yet." />
    ) : (
      <div className="space-y-3">
        {users.map((user, index) => (
          <div
            key={user.userId || index}
            className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 p-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-700">
              {index + 1}
            </div>

            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name || "User"}
                className="h-10 w-10 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                {getInitials(user.name)}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">
                {user.name || "Unknown user"}
              </p>
              <p className="truncate text-xs text-slate-500">
                {user.email || "No email"}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-sm font-bold text-slate-800">
                {formatNumber(user.totalTransactions)}
              </p>
              <p className="text-[10px] text-slate-500">Transactions</p>
            </div>
          </div>
        ))}
      </div>
    )}
  </Panel>
);

// ==========================================
// RECENT TRANSACTIONS
// ==========================================

const RecentTransactions = ({ transactions = [] }) => (
  <Panel>
    <SectionHeading
      title="Recent Transactions"
      subtitle="Latest transactions across the platform"
      icon={ArrowLeftRight}
    />

    {transactions.length === 0 ? (
      <EmptyState message="No transactions found." />
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[580px] text-left">
          <thead>
            <tr className="border-b border-slate-100 text-xs text-slate-500">
              <th className="px-3 py-3 font-medium">User</th>
              <th className="px-3 py-3 font-medium">Category</th>
              <th className="px-3 py-3 font-medium">Type</th>
              <th className="px-3 py-3 font-medium">Amount</th>
              <th className="px-3 py-3 font-medium">Date</th>
            </tr>
          </thead>

          <tbody>
            {transactions.map((transaction) => {
              const user =
                transaction.userId && typeof transaction.userId === "object"
                  ? transaction.userId
                  : null;

              const isIncome = transaction.type === "income";

              return (
                <tr
                  key={transaction._id}
                  className="border-b border-slate-50 last:border-0"
                >
                  <td className="max-w-36 truncate px-3 py-3 text-sm font-medium text-slate-700">
                    {user?.name || "Unknown user"}
                  </td>

                  <td className="px-3 py-3 text-sm text-slate-600">
                    {transaction.category || "Other"}
                  </td>

                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isIncome
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {isIncome ? "Income" : "Expense"}
                    </span>
                  </td>

                  <td
                    className={`whitespace-nowrap px-3 py-3 text-sm font-bold ${
                      isIncome ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {isIncome ? "+" : "-"}
                    {formatMoney(transaction.amount, user?.currency || "INR")}
                  </td>

                  <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-500">
                    {formatDate(transaction.date)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </Panel>
);

// ==========================================
// MAIN DASHBOARD
// ==========================================

const Dashboard = () => {
  const [stats, setStats] = useState(initialStats);

  const [recentUsers, setRecentUsers] = useState([]);
  const [incomeExpenseData, setIncomeExpenseData] = useState([]);
  const [expenseBreakdownData, setExpenseBreakdownData] = useState([]);
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [savingsData, setSavingsData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [topActiveUsers, setTopActiveUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [widgetsError, setWidgetsError] = useState("");

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");
    setWidgetsError("");

    try {
      const results = await Promise.allSettled([
        getAdminStats(),
        getRecentUsers(5),
        getIncomeExpenseData(),
        getExpenseBreakdown(),
        getUserGrowthData(),
        getSavingsAnalytics(),
        getRecentTransactions(10),
        getTopActiveUsers(5),
      ]);

      const [
        statsResult,
        usersResult,
        incomeResult,
        expenseResult,
        growthResult,
        savingsResult,
        transactionsResult,
        topUsersResult,
      ] = results;

      // 1. Main statistics
      if (statsResult.status === "fulfilled") {
        const data = extractStats(statsResult.value);

        setStats({
          ...initialStats,
          ...data,
          totalUsers: Number(data.totalUsers || 0),
          activeUsers: Number(data.activeUsers || 0),
          inactiveUsers: Number(data.inactiveUsers || 0),
          totalTransactions: Number(data.totalTransactions || 0),
          incomeTransactions: Number(data.incomeTransactions || 0),
          expenseTransactions: Number(data.expenseTransactions || 0),
          totalSavingsGoals: Number(data.totalSavingsGoals || 0),
          activeSavingsGoals: Number(data.activeSavingsGoals || 0),
          completedSavingsGoals: Number(data.completedSavingsGoals || 0),
          financialByCurrency: Array.isArray(data.financialByCurrency)
            ? data.financialByCurrency
            : [],
        });
      } else {
        console.error("Dashboard stats error:", statsResult.reason);
        setError(
          statsResult.reason?.response?.data?.message ||
            "Dashboard statistics could not be loaded.",
        );
      }

      // 2. Recent users
      if (usersResult.status === "fulfilled") {
        setRecentUsers(
          extractArray(usersResult.value, ["users", "recentUsers", "results"]),
        );
      } else {
        console.error("Recent users error:", usersResult.reason);
        setWidgetsError("Some dashboard sections could not be loaded.");
      }

      // 3. Income vs expenses
      if (incomeResult.status === "fulfilled") {
        setIncomeExpenseData(
          extractArray(incomeResult.value, [
            "chartData",
            "monthlyData",
            "incomeExpenseData",
            "data",
            "results",
          ]),
        );
      } else {
        console.error("Income expense error:", incomeResult.reason);
        setWidgetsError("Some dashboard sections could not be loaded.");
      }

      // 4. Expense breakdown
      if (expenseResult.status === "fulfilled") {
        setExpenseBreakdownData(
          extractArray(expenseResult.value, [
            "categories",
            "expenseBreakdown",
            "breakdown",
            "data",
            "results",
          ]),
        );
      } else {
        console.error("Expense breakdown error:", expenseResult.reason);
        setWidgetsError("Some dashboard sections could not be loaded.");
      }

      // 5. User growth
      if (growthResult.status === "fulfilled") {
        setUserGrowthData(
          extractArray(growthResult.value, ["data", "results"]),
        );
      } else {
        console.error("User growth error:", growthResult.reason);
        setWidgetsError("Some dashboard sections could not be loaded.");
      }

      // 6. Savings analytics
      if (savingsResult.status === "fulfilled") {
        setSavingsData(extractArray(savingsResult.value, ["data", "results"]));
      } else {
        console.error("Savings analytics error:", savingsResult.reason);
        setWidgetsError("Some dashboard sections could not be loaded.");
      }

      // 7. Recent transactions
      if (transactionsResult.status === "fulfilled") {
        setRecentTransactions(
          extractArray(transactionsResult.value, [
            "transactions",
            "data",
            "results",
          ]),
        );
      } else {
        console.error("Recent transactions error:", transactionsResult.reason);
        setWidgetsError("Some dashboard sections could not be loaded.");
      }

      // 8. Top active users
      if (topUsersResult.status === "fulfilled") {
        setTopActiveUsers(
          extractArray(topUsersResult.value, ["users", "data", "results"]),
        );
      } else {
        console.error("Top active users error:", topUsersResult.reason);
        setWidgetsError("Some dashboard sections could not be loaded.");
      }
    } catch (err) {
      console.error("Admin dashboard error:", err);

      setError(
        err.response?.data?.message || "Unable to load dashboard information.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();

    const intervalId = setInterval(() => {
      loadDashboard(true);
    }, 30000);

    return () => clearInterval(intervalId);
  }, [loadDashboard]);

  const statCards = [
    {
      title: "Total Users",
      value: formatNumber(stats.totalUsers),
      subtitle: "Registered user accounts",
      icon: Users,
      iconClass: "bg-green-100 text-green-600",
    },
    {
      title: "Active Users",
      value: formatNumber(stats.activeUsers),
      subtitle: "Currently marked active",
      icon: UserCheck,
      iconClass: "bg-emerald-100 text-emerald-600",
    },
    {
      title: "Inactive Users",
      value: formatNumber(stats.inactiveUsers),
      subtitle: "Currently marked inactive",
      icon: UserX,
      iconClass: "bg-orange-100 text-orange-600",
    },
    {
      title: "Total Transactions",
      value: formatNumber(stats.totalTransactions),
      subtitle: "All recorded transactions",
      icon: ArrowLeftRight,
      iconClass: "bg-blue-100 text-blue-600",
    },
    {
      title: "Income Transactions",
      value: formatNumber(stats.incomeTransactions),
      subtitle: "Income records",
      icon: TrendingUp,
      iconClass: "bg-purple-100 text-purple-600",
    },
    {
      title: "Expense Transactions",
      value: formatNumber(stats.expenseTransactions),
      subtitle: "Expense records",
      icon: TrendingDown,
      iconClass: "bg-red-100 text-red-500",
    },
    {
      title: "Savings Goals",
      value: formatNumber(stats.totalSavingsGoals),
      subtitle: `${formatNumber(stats.activeSavingsGoals)} active goals`,
      icon: PiggyBank,
      iconClass: "bg-cyan-100 text-cyan-600",
    },
    {
      title: "Completed Goals",
      value: formatNumber(stats.completedSavingsGoals),
      subtitle: "Successfully completed",
      icon: Target,
      iconClass: "bg-amber-100 text-amber-600",
    },
  ];

  return (
    <div className="min-w-0 space-y-6 sm:space-y-7">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <p className="text-sm font-semibold text-emerald-600">
              Administration
            </p>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Admin Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor users, transactions and platform performance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm">
            <Activity size={16} className="text-emerald-600" />
            <span className="text-slate-600">Live dashboard</span>
          </div>

          <button
            type="button"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* ERROR MESSAGES */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p className="font-semibold">Dashboard statistics error</p>
          <p className="mt-1">{error}</p>
          <button
            type="button"
            onClick={() => loadDashboard(true)}
            className="mt-2 font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      {widgetsError && (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
        >
          Some dashboard widgets could not be loaded. Check the browser Network
          tab and backend terminal for the failed API.
        </div>
      )}

      {/* KPI CARDS */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Platform Overview
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Key platform statistics
            </p>
          </div>

          <span className="text-xs text-slate-400">Auto refresh: 30 sec</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <div key={card.title} className="min-w-0">
              {loading ? (
                <div className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="h-3 w-24 rounded bg-slate-200" />
                  <div className="mt-5 h-7 w-32 rounded bg-slate-200" />
                  <div className="mt-3 h-3 w-28 rounded bg-slate-100" />
                </div>
              ) : (
                <AdminStatCard {...card} />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FINANCIAL OVERVIEW */}
      <section>
        <SectionHeading
          title="Financial Performance"
          subtitle="Income and expenses across the platform"
          icon={Wallet}
        />

        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="min-w-0">
            <CurrencyBreakdown data={stats.financialByCurrency} />
          </div>

          <div className="min-w-0">
            <SavingsAnalytics data={savingsData} />
          </div>
        </div>
      </section>

      {/* CHARTS */}
      <section>
        <SectionHeading
          title="Analytics & Trends"
          subtitle="Understand platform activity and financial patterns"
          icon={TrendingUp}
        />

        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="min-w-0 overflow-hidden">
            <IncomeExpenseChart data={incomeExpenseData} />
          </div>

          <div className="min-w-0 overflow-hidden">
            <ExpenseBreakdown data={expenseBreakdownData} />
          </div>

          <div className="min-w-0 xl:col-span-2">
            <UserGrowthChart data={userGrowthData} />
          </div>
        </div>
      </section>

      {/* USER ACTIVITY */}
      <section>
        <SectionHeading
          title="User Activity"
          subtitle="Recently registered and most active users"
          icon={Users}
        />

        <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="min-w-0 overflow-hidden">
            <RecentUsers users={recentUsers} loading={loading} />
          </div>

          <TopActiveUsers users={topActiveUsers} />
        </div>
      </section>

      {/* RECENT TRANSACTIONS */}
      <section>
        <SectionHeading
          title="Transaction Activity"
          subtitle="Latest financial activity from platform users"
          icon={CalendarDays}
        />

        <RecentTransactions transactions={recentTransactions} />
      </section>

      {/* FOOTER */}
      <div className="flex flex-col justify-between gap-2 border-t border-slate-200 pt-4 text-xs text-slate-400 sm:flex-row">
        <span>SmartFinance Admin Panel</span>
        <span>Dashboard data refreshes automatically every 30 seconds.</span>
      </div>
    </div>
  );
};

export default Dashboard;
