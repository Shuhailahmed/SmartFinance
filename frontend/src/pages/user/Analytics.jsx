import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  CreditCard,
  BarChart3,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import analyticsService from "../../services/analyticsService";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const Analytics = () => {
  const { token } = useAuth();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const loadAnalytics = async () => {
      try {
        setLoading(true);

        const response = await analyticsService.getAdvancedAnalytics(token);

        if (response.success) {
          setAnalytics(response.data);
        }
      } catch (error) {
        console.error("Failed to load analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [token]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-slate-500">Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm text-slate-500">Unable to load analytics.</p>
      </div>
    );
  }

  const categoryData = analytics.categoryExpenses || [];

  const paymentData = analytics.paymentMethods || [];

  const monthlyData = analytics.monthlyTrend || [];

  const dailyData = analytics.dailySpending || [];

  const pieColors = [
    "#10b981",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#ec4899",
    "#64748b",
  ];

  const paymentLabels = {
    cash: "Cash",
    upi: "UPI",
    card: "Card",
    bank_transfer: "Bank Transfer",
    other: "Other",
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Financial Analytics
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Understand your income, expenses and spending patterns.
        </p>
      </div>

      {/* SUMMARY CARDS */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Income</p>

              <h3 className="mt-2 text-2xl font-bold text-slate-900">
                {formatCurrency(analytics.totalIncome)}
              </h3>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Expenses</p>

              <h3 className="mt-2 text-2xl font-bold text-slate-900">
                {formatCurrency(analytics.totalExpenses)}
              </h3>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <TrendingDown size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Current Balance</p>

              <h3 className="mt-2 text-2xl font-bold text-slate-900">
                {formatCurrency(analytics.balance)}
              </h3>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Wallet size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Savings Rate</p>

              <h3 className="mt-2 text-2xl font-bold text-slate-900">
                {analytics.savingsRate || 0}%
              </h3>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <PiggyBank size={21} />
            </div>
          </div>
        </div>
      </div>

      {/* SECONDARY STATS */}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Average Monthly Expense</p>

          <p className="mt-2 text-xl font-bold text-slate-900">
            {formatCurrency(analytics.averageMonthlyExpense)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Average Transaction</p>

          <p className="mt-2 text-xl font-bold text-slate-900">
            {formatCurrency(analytics.averageTransaction)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Highest Spending Category</p>

          <p className="mt-2 text-xl font-bold text-slate-900">
            {analytics.highestSpendingCategory?.category || "No data"}
          </p>

          {analytics.highestSpendingCategory && (
            <p className="mt-1 text-sm text-rose-500">
              {formatCurrency(analytics.highestSpendingCategory.amount)}
            </p>
          )}
        </div>
      </div>

      {/* MONTHLY TREND */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Income vs Expenses
          </h2>

          <p className="text-sm text-slate-500">Monthly financial activity</p>
        </div>

        {monthlyData.length === 0 ? (
          <div className="flex h-[320px] items-center justify-center text-sm text-slate-400">
            No monthly data available
          </div>
        ) : (
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />

                <XAxis dataKey="month" tickLine={false} axisLine={false} />

                <YAxis tickLine={false} axisLine={false} />

                <Tooltip formatter={(value) => formatCurrency(value)} />

                <Bar
                  dataKey="income"
                  name="Income"
                  fill="#10b981"
                  radius={[5, 5, 0, 0]}
                />

                <Bar
                  dataKey="expense"
                  name="Expense"
                  fill="#f43f5e"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* CATEGORY + PAYMENT */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* CATEGORY */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Expense by Category
            </h2>

            <p className="text-sm text-slate-500">
              Where your money is being spent
            </p>
          </div>

          {categoryData.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center text-sm text-slate-400">
              No expense data available
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {categoryData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={pieColors[index % pieColors.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* PAYMENT METHODS */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Payment Methods
            </h2>

            <p className="text-sm text-slate-500">
              How you usually pay for expenses
            </p>
          </div>

          {paymentData.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center text-sm text-slate-400">
              No payment data available
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />

                  <XAxis type="number" tickLine={false} axisLine={false} />

                  <YAxis
                    type="category"
                    dataKey="method"
                    tickFormatter={(value) => paymentLabels[value] || value}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />

                  <Tooltip formatter={(value) => formatCurrency(value)} />

                  <Bar
                    dataKey="amount"
                    name="Amount"
                    fill="#3b82f6"
                    radius={[0, 5, 5, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* DAILY SPENDING */}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Daily Spending
          </h2>

          <p className="text-sm text-slate-500">
            Your expense activity during the current month
          </p>
        </div>

        {dailyData.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-slate-400">
            No spending data available
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />

                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: "Day",
                    position: "insideBottom",
                    offset: -5,
                  }}
                />

                <YAxis tickLine={false} axisLine={false} />

                <Tooltip formatter={(value) => formatCurrency(value)} />

                <Line
                  type="monotone"
                  dataKey="amount"
                  name="Spending"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* FINANCIAL INSIGHT */}

      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
            <BarChart3 size={21} />
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">Financial Overview</h2>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Your total income is{" "}
              <strong>{formatCurrency(analytics.totalIncome)}</strong> and your
              total expenses are{" "}
              <strong>{formatCurrency(analytics.totalExpenses)}</strong>. Your
              current savings rate is{" "}
              <strong>{analytics.savingsRate || 0}%</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
