import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Receipt,
  Download,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import reportService from "../../services/reportService";

const Reports = () => {
  const { token } = useAuth();

  const currentDate = new Date();

  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await reportService.getMonthlyReport(token, month, year);

      if (response.success) {
        setReport(response.data);
      }
    } catch (error) {
      console.error("Failed to load report:", error);

      setError(error?.response?.data?.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadReport();
    }
  }, [token, month, year]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);
  };

  const getMonthName = (monthNumber) => {
    return new Date(2000, monthNumber - 1, 1).toLocaleString("en-IN", {
      month: "long",
    });
  };

  // Download Monthly Report as CSV
  const downloadCSV = () => {
    if (!report) return;

    const rows = [
      ["SmartFinance - Monthly Financial Report"],
      ["Report Period", `${getMonthName(report.month)} ${report.year}`],
      [],
      ["Financial Summary"],
      ["Metric", "Amount"],
      ["Total Income", report.totalIncome],
      ["Total Expenses", report.totalExpenses],
      ["Net Savings", report.netSavings],
      ["Savings Rate", `${report.savingsRate}%`],
      [],
      ["Transaction Statistics"],
      ["Metric", "Count"],
      ["Total Transactions", report.transactionCount],
      ["Income Transactions", report.incomeTransactionCount],
      ["Expense Transactions", report.expenseTransactionCount],
      [],
      ["Expense by Category"],
      ["Category", "Amount"],
      ...(report.categoryExpenses || []).map((item) => [
        item.category,
        item.amount,
      ]),
    ];

    const csvContent = rows
      .map((row) =>
        row
          .map((value) => {
            const text = String(value ?? "").replace(/"/g, '""');
            return `"${text}"`;
          })
          .join(","),
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `SmartFinance_Report_${report.month}_${report.year}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">Loading report...</div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
        <h2 className="text-lg font-semibold text-red-600">
          Unable to load report
        </h2>

        <p className="mt-2 text-sm text-red-500">{error}</p>

        <button
          onClick={loadReport}
          className="mt-5 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Financial Reports
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View your monthly financial summary.
          </p>
        </div>

        {/* Month / Year Filter + Download */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-500"
          >
            {Array.from({ length: 12 }, (_, index) => {
              const monthNumber = index + 1;

              return (
                <option key={monthNumber} value={monthNumber}>
                  {getMonthName(monthNumber)}
                </option>
              );
            })}
          </select>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-green-500"
          >
            {Array.from({ length: 5 }, (_, index) => {
              const yearValue = currentDate.getFullYear() - index;

              return (
                <option key={yearValue} value={yearValue}>
                  {yearValue}
                </option>
              );
            })}
          </select>

          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Download size={18} />
            Download CSV
          </button>
        </div>
      </div>

      {/* Report Period */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
            <BarChart3 size={22} className="text-slate-700" />
          </div>

          <div>
            <p className="text-sm text-slate-500">Report Period</p>

            <h2 className="text-lg font-semibold text-slate-900">
              {getMonthName(report.month)} {report.year}
            </h2>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {/* Income */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Income</p>

              <h3 className="mt-2 text-2xl font-bold text-emerald-600">
                {formatCurrency(report.totalIncome)}
              </h3>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
              <TrendingUp size={21} className="text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Expenses */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Expenses</p>

              <h3 className="mt-2 text-2xl font-bold text-rose-500">
                {formatCurrency(report.totalExpenses)}
              </h3>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50">
              <TrendingDown size={21} className="text-rose-500" />
            </div>
          </div>
        </div>

        {/* Savings */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Net Savings</p>

              <h3
                className={`mt-2 text-2xl font-bold ${
                  report.netSavings >= 0 ? "text-violet-600" : "text-rose-500"
                }`}
              >
                {formatCurrency(report.netSavings)}
              </h3>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50">
              <PiggyBank size={21} className="text-violet-600" />
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Transactions</p>

              <h3 className="mt-2 text-2xl font-bold text-blue-600">
                {report.transactionCount}
              </h3>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
              <Receipt size={21} className="text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Income / Expense Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Financial Overview
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Income and expense summary for this month.
          </p>

          <div className="mt-6 space-y-5">
            {/* Income */}
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-slate-500">Income</span>

                <span className="font-semibold text-emerald-600">
                  {formatCurrency(report.totalIncome)}
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width: `${report.totalIncome > 0 ? 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Expenses */}
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-slate-500">Expenses</span>

                <span className="font-semibold text-rose-500">
                  {formatCurrency(report.totalExpenses)}
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-rose-500"
                  style={{
                    width: `${
                      report.totalIncome > 0
                        ? Math.min(
                            (report.totalExpenses / report.totalIncome) * 100,
                            100,
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Savings Rate */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Savings Performance
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Your savings rate for the selected month.
          </p>

          <div className="mt-8 flex items-center justify-center">
            <div className="flex h-40 w-40 items-center justify-center rounded-full border-[16px] border-emerald-100">
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-600">
                  {report.savingsRate}%
                </p>

                <p className="text-xs text-slate-500">Savings Rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Expenses */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Expense by Category
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Breakdown of your spending categories.
          </p>
        </div>

        {report.categoryExpenses?.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">
            No expense data available for this month.
          </div>
        ) : (
          <div className="space-y-4">
            {report.categoryExpenses.map((item, index) => {
              const percentage =
                report.totalExpenses > 0
                  ? ((item.amount / report.totalExpenses) * 100).toFixed(1)
                  : 0;

              return (
                <div key={item.category}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
                        {index + 1}
                      </div>

                      <span className="text-sm font-medium text-slate-700">
                        {item.category}
                      </span>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatCurrency(item.amount)}
                      </p>

                      <p className="text-xs text-slate-400">{percentage}%</p>
                    </div>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-700"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction Statistics */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Transaction Statistics
        </h2>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Total Transactions</p>

            <p className="mt-1 text-xl font-bold text-slate-900">
              {report.transactionCount}
            </p>
          </div>

          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-sm text-slate-500">Income Transactions</p>

            <p className="mt-1 text-xl font-bold text-emerald-600">
              {report.incomeTransactionCount}
            </p>
          </div>

          <div className="rounded-xl bg-rose-50 p-4">
            <p className="text-sm text-slate-500">Expense Transactions</p>

            <p className="mt-1 text-xl font-bold text-rose-500">
              {report.expenseTransactionCount}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
