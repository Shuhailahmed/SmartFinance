import { Link } from "react-router-dom";
import { Target, CheckCircle2 } from "lucide-react";

const SavingsGoalCard = ({ goals = [] }) => {
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);

  const formatDate = (date) => {
    if (!date) return "No deadline";

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Savings Goals
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Track your financial goals
          </p>
        </div>

        <Link
          to="/savings-goals"
          className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
        >
          View all
        </Link>
      </div>

      {/* Empty State */}

      {goals.length === 0 ? (
        <div className="py-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <Target size={22} />
          </div>

          <p className="mt-4 font-medium text-slate-700">
            No savings goals yet
          </p>

          <p className="mt-1 text-sm text-slate-400">
            Create a goal and start saving.
          </p>

          <Link
            to="/savings-goals"
            className="mt-4 inline-flex rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Create Goal
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {goals.slice(0, 3).map((goal) => (
            <div key={goal._id}>
              {/* Goal Header */}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      goal.status === "completed"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-violet-50 text-violet-600"
                    }`}
                  >
                    {goal.status === "completed" ? (
                      <CheckCircle2 size={17} />
                    ) : (
                      <Target size={17} />
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {goal.name}
                    </p>

                    <p className="text-xs text-slate-400">
                      {formatDate(goal.deadline)}
                    </p>
                  </div>
                </div>

                <span className="text-sm font-semibold text-violet-600">
                  {goal.percentage}%
                </span>
              </div>

              {/* Progress */}

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    goal.status === "completed"
                      ? "bg-emerald-500"
                      : "bg-violet-500"
                  }`}
                  style={{
                    width: `${Math.min(goal.percentage, 100)}%`,
                  }}
                />
              </div>

              {/* Amount */}

              <div className="mt-2 flex justify-between text-xs">
                <span className="text-slate-500">
                  {formatCurrency(goal.savedAmount)} saved
                </span>

                <span className="text-slate-400">
                  {formatCurrency(goal.targetAmount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavingsGoalCard;
