const BudgetProgress = ({ budget = 0, spent = 0, category = "Budget" }) => {
  const limit = Number(budget) || 0;
  const used = Number(spent) || 0;
  const percentage = limit > 0 ? (used / limit) * 100 : 0;
  const progress = Math.min(percentage, 100);
  const exceeded = percentage >= 100;
  const warning = percentage >= 80 && !exceeded;
  const remaining = limit - used;

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  const barColor = exceeded
    ? "bg-rose-500"
    : warning
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-800">{category}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {formatCurrency(used)} of {formatCurrency(limit)}
          </p>
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            exceeded
              ? "bg-rose-50 text-rose-600"
              : warning
                ? "bg-amber-50 text-amber-700"
                : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {Math.round(percentage)}%
        </span>
      </div>

      <div
        className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={Math.min(Math.round(percentage), 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${category} budget usage`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <p
        className={`mt-3 text-sm ${
          exceeded ? "text-rose-600" : "text-slate-500"
        }`}
      >
        {exceeded
          ? `${formatCurrency(Math.abs(remaining))} over budget`
          : `${formatCurrency(remaining)} remaining`}
      </p>
    </div>
  );
};

export default BudgetProgress;
