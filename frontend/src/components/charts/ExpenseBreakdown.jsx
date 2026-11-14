import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#64748b",
];

const ExpenseBreakdown = ({ data = [] }) => {
  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);

  const totalExpense = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Expense Breakdown
        </h2>

        <p className="text-sm text-slate-500">Current month by category</p>
      </div>

      {data.length === 0 ? (
        <div className="flex h-[300px] flex-col items-center justify-center">
          <p className="font-medium text-slate-600">No expenses yet</p>

          <p className="mt-1 text-sm text-slate-400">
            Your category breakdown will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={entry.category}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>

                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mb-5 text-center">
            <p className="text-xs text-slate-500">Total Expenses</p>

            <p className="text-xl font-bold text-slate-900">
              {formatCurrency(totalExpense)}
            </p>
          </div>

          <div className="space-y-3">
            {data.map((item, index) => {
              const percentage =
                totalExpense > 0
                  ? ((item.amount / totalExpense) * 100).toFixed(1)
                  : 0;

              return (
                <div
                  key={item.category}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />

                    <span className="text-sm text-slate-600">
                      {item.category}
                    </span>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-800">
                      {formatCurrency(item.amount)}
                    </p>

                    <p className="text-xs text-slate-400">{percentage}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default ExpenseBreakdown;
