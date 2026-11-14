import { Link } from "react-router-dom";

const BudgetCard = ({ budgets = [] }) => {
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Monthly Budgets
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Track your spending limits
          </p>
        </div>

        <Link
          to="/budgets"
          className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
        >
          View all
        </Link>
      </div>

      {/* Empty State */}
      {budgets.length === 0 ? (
        <div className="py-10 text-center">
          <p className="font-medium text-slate-700">No budgets yet</p>

          <p className="mt-1 text-sm text-slate-400">
            Create a budget to start tracking your spending.
          </p>

          <Link
            to="/budgets"
            className="mt-4 inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Create Budget
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {budgets.slice(0, 4).map((budget) => (
            <div key={budget._id}>
              {/* Category + Amount */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {budget.category}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {formatCurrency(budget.spent)} of{" "}
                    {formatCurrency(budget.amount)}
                  </p>
                </div>

                <span
                  className={`text-xs font-semibold ${
                    budget.status === "exceeded"
                      ? "text-rose-600"
                      : budget.status === "warning"
                        ? "text-amber-600"
                        : "text-emerald-600"
                  }`}
                >
                  {budget.percentage}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    budget.status === "exceeded"
                      ? "bg-rose-500"
                      : budget.status === "warning"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  }`}
                  style={{
                    width: `${Math.min(budget.percentage, 100)}%`,
                  }}
                />
              </div>

              {/* Remaining */}
              <div className="mt-2 flex justify-between text-xs">
                <span className="text-slate-400">
                  {budget.status === "exceeded" ? "Over budget" : "Remaining"}
                </span>

                <span
                  className={`font-medium ${
                    budget.status === "exceeded"
                      ? "text-rose-600"
                      : "text-slate-600"
                  }`}
                >
                  {formatCurrency(Math.abs(budget.remaining))}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BudgetCard;
