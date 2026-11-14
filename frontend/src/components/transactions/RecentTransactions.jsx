import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const RecentTransactions = ({ transactions = [] }) => {
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (date) =>
    new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Transactions
          </h2>

          <p className="text-sm text-slate-500">
            Your latest financial activity
          </p>
        </div>

        <Link
          to="/transactions"
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
        >
          View all
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="font-medium text-slate-600">No transactions yet</p>

          <p className="mt-1 text-sm text-slate-400">
            Add your first transaction to start tracking your finances.
          </p>

          <Link
            to="/add-transaction"
            className="mt-4 inline-block text-sm font-medium text-emerald-600"
          >
            Add transaction
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {transactions.map((transaction) => {
            const isIncome = transaction.type === "income";

            return (
              <div
                key={transaction._id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      isIncome
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-rose-50 text-rose-600"
                    }`}
                  >
                    {isIncome ? (
                      <ArrowDownLeft size={18} />
                    ) : (
                      <ArrowUpRight size={18} />
                    )}
                  </div>

                  <div>
                    <p className="font-medium text-slate-800">
                      {transaction.description || transaction.category}
                    </p>

                    <p className="text-sm text-slate-400">
                      {transaction.category} • {formatDate(transaction.date)}
                    </p>
                  </div>
                </div>

                <p
                  className={`font-semibold ${
                    isIncome ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {isIncome ? "+" : "-"}
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentTransactions;
