import { ArrowDownLeft, ArrowUpRight, ReceiptText } from "lucide-react";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString("en-IN");
};

const AdminTransactionTable = ({ transactions = [], loading = false }) => {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5">
        <h2 className="font-semibold text-slate-900">Recent Transactions</h2>
        <p className="mt-1 text-sm text-slate-500">
          Financial activity across user accounts
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-slate-500">
          Loading transactions...
        </div>
      ) : transactions.length === 0 ? (
        <div className="p-10 text-center">
          <ReceiptText size={34} className="mx-auto text-slate-300" />
          <p className="mt-3 font-medium text-slate-700">
            No transactions found
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Transactions will appear here when available.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Transaction</th>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Type</th>
                <th className="px-5 py-4 text-right">Amount</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {transactions.map((transaction) => {
                const isIncome = transaction.type === "income";

                const user =
                  transaction.userId && typeof transaction.userId === "object"
                    ? transaction.userId
                    : null;

                return (
                  <tr
                    key={transaction._id || transaction.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-xl ${
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
                          <p className="text-sm font-medium text-slate-800">
                            {transaction.description ||
                              transaction.category ||
                              "Transaction"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {transaction.category || "Other"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-700">
                        {user?.name || "User"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {user?.email || "—"}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-500">
                      {formatDate(transaction.date || transaction.createdAt)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          isIncome
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {transaction.type || "unknown"}
                      </span>
                    </td>

                    <td
                      className={`px-5 py-4 text-right text-sm font-semibold ${
                        isIncome ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {isIncome ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default AdminTransactionTable;
