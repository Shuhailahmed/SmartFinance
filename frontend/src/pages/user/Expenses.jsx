import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getTransactions,
  deleteTransaction,
} from "../../services/transactionService";

const Expenses = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadExpenses = async () => {
    try {
      const data = await getTransactions();

      const expenseTransactions = (data.transactions || []).filter(
        (transaction) => transaction.type === "expense",
      );

      setTransactions(expenseTransactions);
    } catch (error) {
      console.error("Failed to load expense transactions", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense transaction?",
    );

    if (!confirmed) return;

    try {
      await deleteTransaction(id);

      setTransactions((current) =>
        current.filter((transaction) => transaction._id !== id),
      );
    } catch (error) {
      console.error("Failed to delete expense transaction", error);
    }
  };

  const totalExpenses = transactions.reduce(
    (total, transaction) => total + Number(transaction.amount || 0),
    0,
  );

  if (loading) {
    return <div className="py-20 text-center">Loading expenses...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Expenses</h1>

          <p className="mt-1 text-sm text-slate-500">
            Track and manage all your expenses.
          </p>
        </div>

        <Link
          to="/add-transaction"
          className="rounded-xl bg-red-500 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-red-600"
        >
          + Add Expense
        </Link>
      </div>

      {/* Total Expenses */}
      <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-5">
        <p className="text-sm font-medium text-slate-500">Total Expenses</p>

        <h2 className="mt-2 text-3xl font-bold text-red-500">
          ₹{totalExpenses.toLocaleString("en-IN")}
        </h2>
      </div>

      {/* Expense Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {transactions.length === 0 ? (
          <div className="p-12 text-center">
            <h2 className="text-lg font-semibold text-slate-900">
              No expense transactions yet
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Add your first expense transaction to start tracking your
              spending.
            </p>

            <Link
              to="/add-transaction"
              className="mt-5 inline-block rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-600"
            >
              Add Expense
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {transactions.map((transaction) => (
                  <tr
                    key={transaction._id}
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(transaction.date).toLocaleDateString("en-IN")}
                    </td>

                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {transaction.description || "—"}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-500">
                      {transaction.category}
                    </td>

                    <td className="px-6 py-4 text-sm capitalize text-slate-500">
                      {transaction.paymentMethod.replace("_", " ")}
                    </td>

                    <td className="px-6 py-4 text-right text-sm font-bold text-red-500">
                      -₹
                      {Number(transaction.amount).toLocaleString("en-IN")}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(transaction._id)}
                        className="text-sm font-medium text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Expenses;
