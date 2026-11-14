import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { createTransaction } from "../../services/transactionService";

const AddTransaction = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    type: "expense",
    amount: "",
    category: "Food & Dining",
    description: "",
    paymentMethod: "upi",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      await createTransaction({
        ...formData,
        amount: Number(formData.amount),
      });

      navigate("/transactions");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to create transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add Transaction</h1>

        <p className="mt-1 text-sm text-slate-500">
          Record your income or expense.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
        {error && (
          <div className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type */}

          <div>
            <label className="mb-2 block text-sm font-medium">
              Transaction Type
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    type: "expense",
                  })
                }
                className={`rounded-xl border px-4 py-3 font-medium ${
                  formData.type === "expense"
                    ? "border-red-500 bg-red-50 text-red-600"
                    : "border-slate-200"
                }`}
              >
                Expense
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    type: "income",
                  })
                }
                className={`rounded-xl border px-4 py-3 font-medium ${
                  formData.type === "income"
                    ? "border-green-500 bg-green-50 text-green-600"
                    : "border-slate-200"
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {/* Amount */}

          <div>
            <label className="mb-2 block text-sm font-medium">Amount</label>

            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter amount"
              min="0.01"
              step="0.01"
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500"
            />
          </div>

          {/* Category */}

          <div>
            <label className="mb-2 block text-sm font-medium">Category</label>

            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500"
            >
              <option>Food & Dining</option>
              <option>Shopping</option>
              <option>Transport</option>
              <option>Bills & Utilities</option>
              <option>Entertainment</option>
              <option>Healthcare</option>
              <option>Education</option>
              <option>Salary</option>
              <option>Freelance</option>
              <option>Investment</option>
              <option>Other</option>
            </select>
          </div>

          {/* Description */}

          <div>
            <label className="mb-2 block text-sm font-medium">
              Description
            </label>

            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g. Lunch, Salary, Electricity bill"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500"
            />
          </div>

          {/* Payment Method */}

          <div>
            <label className="mb-2 block text-sm font-medium">
              Payment Method
            </label>

            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500"
            >
              <option value="upi">UPI</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Date */}

          <div>
            <label className="mb-2 block text-sm font-medium">Date</label>

            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500"
            />
          </div>

          {/* Notes */}

          <div>
            <label className="mb-2 block text-sm font-medium">Notes</label>

            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="4"
              placeholder="Optional notes..."
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-green-600 py-3.5 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save Transaction"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTransaction;
