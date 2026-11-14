import {
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Pencil,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";

const TransactionTable = ({
  transactions = [],
  onEdit,
  onDelete,
  deletingId = null,
}) => {
  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);

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

  const formatPaymentMethod = (method) => {
    const methods = {
      cash: "Cash",
      upi: "UPI",
      card: "Card",
      bank_transfer: "Bank Transfer",
      other: "Other",
    };

    return methods[method] || method || "Other";
  };

  if (!transactions.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <CreditCard size={26} />
        </div>

        <h3 className="mt-4 text-lg font-semibold text-slate-900">
          No transactions found
        </h3>

        <p className="mt-2 text-sm text-slate-500">
          Your transactions will appear here after you add them.
        </p>

        <Link
          to="/transactions/add"
          className="mt-5 inline-flex rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Add Transaction
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Transaction
              </th>
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Category
              </th>
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Date
              </th>
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Payment
              </th>
              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Amount
              </th>
              {(onEdit || onDelete) && (
                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {transactions.map((transaction) => {
              const isIncome = transaction.type === "income";
              const transactionId = transaction._id || transaction.id;

              return (
                <tr
                  key={transactionId}
                  className="transition hover:bg-slate-50/80"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          isIncome
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-rose-50 text-rose-600"
                        }`}
                      >
                        {isIncome ? (
                          <ArrowDownLeft size={19} />
                        ) : (
                          <ArrowUpRight size={19} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="max-w-[220px] truncate text-sm font-semibold text-slate-900">
                          {transaction.description ||
                            transaction.category ||
                            "Transaction"}
                        </p>
                        <p className="mt-1 text-xs capitalize text-slate-500">
                          {transaction.type || "expense"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700">
                      {transaction.category || "Other"}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                    {formatDate(transaction.date)}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {formatPaymentMethod(transaction.paymentMethod)}
                  </td>

                  <td
                    className={`whitespace-nowrap px-5 py-4 text-right text-sm font-bold ${
                      isIncome ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {isIncome ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </td>

                  {(onEdit || onDelete) && (
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(transaction)}
                            aria-label="Edit transaction"
                            title="Edit transaction"
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Pencil size={17} />
                          </button>
                        )}

                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(transaction)}
                            disabled={deletingId === transactionId}
                            aria-label="Delete transaction"
                            title="Delete transaction"
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 size={17} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
        Showing {transactions.length} transaction
        {transactions.length === 1 ? "" : "s"}
      </div>
    </div>
  );
};

export default TransactionTable;
