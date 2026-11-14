import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

import analyticsService from "../../services/analyticsService";
import budgetService from "../../services/budgetService";
import savingsService from "../../services/savingsService";

import SummaryCard from "../../components/common/SummaryCard";
import IncomeExpenseChart from "../../components/charts/IncomeExpenseChart";
import ExpenseBreakdown from "../../components/charts/ExpenseBreakdown";
import RecentTransactions from "../../components/transactions/RecentTransactions";
import BudgetCard from "../../components/budget/BudgetCard";
import SavingsGoalCard from "../../components/savings/SavingsGoalCard";
import InsightCard from "../../components/insights/InsightCard";
import DashboardSkeleton from "../../components/common/DashboardSkeleton";

const Dashboard = () => {
  const { user, token } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // LOAD DASHBOARD DATA
  // ==========================================

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);

        const now = new Date();

        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        // Load all dashboard-related data together
        const [dashboardResponse, budgetResponse, savingsResponse] =
          await Promise.all([
            analyticsService.getDashboardData(token),
            budgetService.getBudgets(token, month, year),
            savingsService.getSavingsGoals(token),
          ]);

        // ==========================================
        // DASHBOARD DATA
        // ==========================================

        if (dashboardResponse?.success) {
          setDashboard(dashboardResponse.data);
        }

        // ==========================================
        // BUDGET DATA
        // ==========================================

        if (budgetResponse?.success) {
          setBudgets(budgetResponse.data || []);
        }

        // ==========================================
        // SAVINGS GOALS DATA
        // ==========================================

        if (savingsResponse?.success) {
          setSavingsGoals(savingsResponse.data || []);
        }
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadDashboard();
    }
  }, [token]);

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return <DashboardSkeleton />;
  }

  // ==========================================
  // ERROR STATE
  // ==========================================

  if (!dashboard) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
            <span className="text-2xl">!</span>
          </div>

          <h2 className="mt-4 text-xl font-semibold text-slate-900">
            Unable to load dashboard
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Something went wrong while loading your financial data.
          </p>

          <button
            onClick={() => window.location.reload()}
            className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Refresh Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // CURRENCY FORMATTER
  // ==========================================

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);
  };

  // ==========================================
  // SAFE VALUES
  // ==========================================

  const totalBalance = Number(dashboard.balance) || 0;
  const totalIncome = Number(dashboard.totalIncome) || 0;
  const totalExpenses = Number(dashboard.totalExpenses) || 0;
  const totalSavings = Number(dashboard.savings) || 0;

  const monthlyIncome = Number(dashboard.monthlyIncome) || 0;
  const monthlyExpenses = Number(dashboard.monthlyExpenses) || 0;

  const savingsRate = Number(dashboard.savingsRate) || 0;

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="space-y-6">
      {/* ======================================
          HEADER
      ====================================== */}

      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {user?.name || "User"} 👋
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Here's your financial overview.
        </p>
      </div>

      {/* ======================================
          SUMMARY CARDS
      ====================================== */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Balance"
          value={formatCurrency(totalBalance)}
          type="balance"
        />

        <SummaryCard
          title="Total Income"
          value={formatCurrency(totalIncome)}
          type="income"
        />

        <SummaryCard
          title="Total Expenses"
          value={formatCurrency(totalExpenses)}
          type="expense"
        />

        <SummaryCard
          title="Total Savings"
          value={formatCurrency(totalSavings)}
          type="savings"
        />
      </div>

      {/* ======================================
          CURRENT MONTH SUMMARY
      ====================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Monthly Income */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">
            This Month Income
          </p>

          <p className="mt-2 text-lg font-bold text-emerald-600">
            {formatCurrency(monthlyIncome)}
          </p>
        </div>

        {/* Monthly Expenses */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">
            This Month Expenses
          </p>

          <p className="mt-2 text-lg font-bold text-rose-600">
            {formatCurrency(monthlyExpenses)}
          </p>
        </div>

        {/* Savings Rate */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Savings Rate</p>

          <p className="mt-2 text-lg font-bold text-slate-900">
            {savingsRate}%
          </p>
        </div>
      </div>

      {/* ======================================
          INCOME VS EXPENSE + EXPENSE BREAKDOWN
      ====================================== */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Income vs Expense */}

        <div className="xl:col-span-2">
          <IncomeExpenseChart data={dashboard.monthlyData || []} />
        </div>

        {/* Expense Breakdown */}

        <ExpenseBreakdown data={dashboard.categoryWiseExpenses || []} />
      </div>

      {/* ======================================
          RECENT TRANSACTIONS
      ====================================== */}

      <RecentTransactions transactions={dashboard.recentTransactions || []} />

      {/* ======================================
          BUDGET + SAVINGS GOALS
      ====================================== */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Budget */}

        <BudgetCard budgets={budgets} />

        {/* Savings Goals */}

        <SavingsGoalCard goals={savingsGoals} />
      </div>

      {/* ======================================
          INSIGHTS
      ====================================== */}

      <div>
        <InsightCard />
      </div>
    </div>
  );
};

export default Dashboard;
