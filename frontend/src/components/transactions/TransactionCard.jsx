import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  CreditCard,
  Wallet,
} from "lucide-react";

const TransactionCard = ({ transaction }) => {
  if (!transaction) return null;

  const isIncome = transaction.type === "income";

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const paymentMethod = (method) => {
    const methods = {
      cash: "Cash",
      upi: "UPI",
      card: "Card",
      bank_transfer: "Bank Transfer",
      other: "Other",
    };

    return methods[method] || method || "Other";
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
              isIncome
                ? "bg-emerald-50 text-emerald-600"
                : "bg-rose-50 text-rose-600"
            }`}
          >
            {isIncome ? (
              <ArrowDownLeft size={23} />
            ) : (
              <ArrowUpRight size={23} />
            )}
          </div>

          <div className="min-w-0">
            <h3 className="truncate font-semibold text-slate-900">
              {transaction.description || transaction.category || "Transaction"}
            </h3>

            <p className="mt-1 truncate text-sm text-slate-500">
              {transaction.category || "Uncategorized"}
            </p>
          </div>
        </div>

        <p
          className={`shrink-0 text-right font-bold ${
            isIncome ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {isIncome ? "+" : "-"}
          {formatCurrency(transaction.amount)}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays size={14} />
          {formatDate(transaction.date)}
        </span>

        <span className="inline-flex items-center gap-1.5">
          <CreditCard size={14} />
          {paymentMethod(transaction.paymentMethod)}
        </span>

        <span
          className={`rounded-full px-2.5 py-1 font-medium ${
            isIncome
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {isIncome ? "Income" : "Expense"}
        </span>
      </div>
    </article>
  );
};

export default TransactionCard;
