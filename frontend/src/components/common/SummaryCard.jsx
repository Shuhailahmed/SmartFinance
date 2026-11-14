import { Wallet, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";

const SummaryCard = ({ title, value, type = "balance" }) => {
  const iconConfig = {
    balance: {
      icon: Wallet,
      bg: "bg-blue-50",
      text: "text-blue-600",
    },

    income: {
      icon: TrendingUp,
      bg: "bg-emerald-50",
      text: "text-emerald-600",
    },

    expense: {
      icon: TrendingDown,
      bg: "bg-rose-50",
      text: "text-rose-600",
    },

    savings: {
      icon: PiggyBank,
      bg: "bg-violet-50",
      text: "text-violet-600",
    },
  };

  const config = iconConfig[type] || iconConfig.balance;

  const Icon = config.icon;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <h3 className="mt-2 text-2xl font-bold text-slate-900">{value}</h3>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${config.bg} ${config.text}`}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
