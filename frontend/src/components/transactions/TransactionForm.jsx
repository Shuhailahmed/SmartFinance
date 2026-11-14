import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { Link } from "react-router-dom";

const categories = [
  "Food",
  "Shopping",
  "Transport",
  "Bills",
  "Entertainment",
  "Health",
  "Education",
  "Travel",
  "Salary",
  "Business",
  "Investment",
  "Other",
];

const paymentMethods = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "other", label: "Other" },
];

const TransactionForm = ({
  initialData = {},
  onSubmit,
  submitting = false,
  submitLabel = "Save Transaction",
}) => {
  const [formData, setFormData] = useState({
    type: initialData.type || "expense",
    amount: initialData.amount ?? "",
    category: initialData.category || "Food",
    description: initialData.description || "",
    paymentMethod: initialData.paymentMethod || "upi",
    date: initialData.date
      ? new Date(initialData.date).toISOString().slice(0, 10)
      : new Date().toLocaleDateString("en-CA"),
    notes: initialData.notes || "",
  });

  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const amount = Number(formData.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter an amount greater than zero.");
      return;
    }

    if (!formData.category.trim()) {
      setError("Please select a category.");
      return;
    }

    if (!formData.date || Number.isNaN(new Date(formData.date).getTime())) {
      setError("Please select a valid date.");
      return;
    }

    if (typeof onSubmit !== "function") {
      setError("Form submission handler is not configured.");
      return;
    }

    try {
      await onSubmit({
        ...formData,
        amount,
        date: new Date(`${formData.date}T12:00:00`).toISOString(),
        description: formData.description.trim(),
        notes: formData.notes.trim(),
      });
    } catch (submitError) {
      setError(
        submitError?.response?.data?.message ||
          submitError?.message ||
          "Unable to save transaction. Please try again.",
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
    >
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Transaction Type
        </label>

        <div className="grid grid-cols-2 gap-3">
          {["expense", "income"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFormData((previous) => ({ ...previous, type }))}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold capitalize transition ${
                formData.type === type
                  ? type === "income"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-rose-500 bg-rose-50 text-rose-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {type === "income" ? "+ Income" : "− Expense"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="amount"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Amount (₹) *
          </label>

          <input
            id="amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            max="1000000000"
            value={formData.amount}
            onChange={handleChange}
            placeholder="Enter amount"
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div>
          <label
            htmlFor="category"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Category *
          </label>

          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Description
          </label>

          <input
            id="description"
            name="description"
            type="text"
            maxLength={200}
            value={formData.description}
            onChange={handleChange}
            placeholder="e.g. Monthly groceries"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div>
          <label
            htmlFor="paymentMethod"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Payment Method
          </label>

          <select
            id="paymentMethod"
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            {paymentMethods.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="date"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Transaction Date *
          </label>

          <input
            id="date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="notes"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Notes (Optional)
          </label>

          <textarea
            id="notes"
            name="notes"
            rows={3}
            maxLength={500}
            value={formData.notes}
            onChange={handleChange}
            placeholder="Add any additional details..."
            className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          to="/transactions"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft size={17} />
          Cancel
        </Link>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={17} />
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;
