import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { X, Filter } from "lucide-react";

import {
  getTransactions,
  deleteTransaction,
} from "../../services/transactionService";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();

  // Read category from URL
  const selectedCategory = searchParams.get("category") || "";

  const loadTransactions = async () => {
    try {
      const data = await getTransactions();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error("Failed to load transactions", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  // Filter transactions by category
  const filteredTransactions = useMemo(() => {
    if (!selectedCategory) return transactions;

    return transactions.filter(
      (transaction) =>
        transaction.category?.toLowerCase() === selectedCategory.toLowerCase(),
    );
  }, [transactions, selectedCategory]);

  // Clear category filter
  const clearCategoryFilter = () => {
    setSearchParams({});
  };

  // Delete transaction
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?",
    );

    if (!confirmed) return;

    try {
      await deleteTransaction(id);

      setTransactions((current) =>
        current.filter((transaction) => transaction._id !== id),
      );
    } catch (error) {
      console.error("Failed to delete transaction", error);
    }
  };

  if (loading) {
    return <div className="py-20 text-center">Loading transactions...</div>;
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage all your income and expenses.
          </p>
        </div>

        <Link
          to="/add-transaction"
          className="rounded-xl bg-green-600 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-green-700"
        >
          + Add Transaction
        </Link>
      </div>

      {/* Active Category Filter */}
      {selectedCategory && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-green-100 bg-green-50 p-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-green-700" />

            <div>
              <p className="text-xs text-green-700">Filtering by category</p>

              <p className="font-semibold text-green-800">{selectedCategory}</p>
            </div>
          </div>

          <button
            onClick={clearCategoryFilter}
            className="flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            <X size={15} />
            Clear Filter
          </button>
        </div>
      )}

      {/* Transactions Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <h2 className="text-lg font-semibold">
              {selectedCategory
                ? "No transactions found in this category"
                : "No transactions yet"}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {selectedCategory
                ? `There are no transactions under ${selectedCategory}.`
                : "Add your first transaction to start tracking your finances."}
            </p>

            {selectedCategory && (
              <button
                onClick={clearCategoryFilter}
                className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Show All Transactions
              </button>
            )}
          </div>
        ) : (
          <>
            {selectedCategory && (
              <div className="border-b border-slate-100 px-6 py-3 text-sm text-slate-500">
                Showing {filteredTransactions.length} transaction(s)
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Payment</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr
                      key={transaction._id}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(transaction.date).toLocaleDateString("en-IN")}
                      </td>

                      <td className="px-6 py-4 text-sm font-medium">
                        {transaction.description || "—"}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-500">
                        {transaction.category}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            transaction.type === "income"
                              ? "bg-green-50 text-green-600"
                              : "bg-red-50 text-red-500"
                          }`}
                        >
                          {transaction.type}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm capitalize text-slate-500">
                        {(transaction.paymentMethod || "—").replace("_", " ")}
                      </td>

                      <td
                        className={`px-6 py-4 text-right text-sm font-bold ${
                          transaction.type === "income"
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}₹
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
          </>
        )}
      </div>
    </div>
  );
};

export default Transactions;
