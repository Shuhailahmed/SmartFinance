import {
  LayoutDashboard,
  ArrowLeftRight,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  WalletCards,
  PiggyBank,
  BarChart3,
  FileText,
  Bell,
  Settings,
  X,
} from "lucide-react";

import { useState } from "react";
import { NavLink } from "react-router-dom";

const UserSidebar = ({ open, onClose }) => {
  const [showSubscription, setShowSubscription] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("yearly");

  const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Transactions", icon: ArrowLeftRight, path: "/transactions" },
    { label: "Add Transaction", icon: PlusCircle, path: "/add-transaction" },
    { label: "Income", icon: TrendingUp, path: "/income" },
    { label: "Expenses", icon: TrendingDown, path: "/expenses" },
    { label: "Budgets", icon: WalletCards, path: "/budgets" },
    { label: "Savings Goals", icon: PiggyBank, path: "/savings-goals" },
    { label: "Analytics", icon: BarChart3, path: "/analytics" },
    { label: "Reports", icon: FileText, path: "/reports" },
    { label: "Notifications", icon: Bell, path: "/notifications" },
    { label: "Profile & Settings", icon: Settings, path: "/profile" },
  ];

  const plans = [
    {
      id: "quarterly",
      name: "Quarterly Plan",
      duration: "3 Months",
      price: "₹499",
      description: "Billed every 3 months",
    },
    {
      id: "halfyearly",
      name: "Half-Yearly Plan",
      duration: "6 Months",
      price: "₹899",
      description: "Billed every 6 months",
    },
    {
      id: "yearly",
      name: "Yearly Plan",
      duration: "12 Months",
      price: "₹1,499",
      description: "Billed annually",
      popular: true,
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col
        bg-[#071C25] text-white transition-transform duration-300
        lg:translate-x-0
        ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Logo Section */}
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 shadow-md shadow-green-500/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3v18h18" />
                <path d="M8 15v-3" />
                <path d="M13 15V8" />
                <path d="M18 15V5" />
              </svg>
            </div>

            <div>
              <h1 className="text-lg font-bold">SmartFinance</h1>
              <p className="text-[10px] text-slate-400">PERSONAL FINANCE</p>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="rounded-lg p-1 transition hover:bg-white/10 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-scrollbar flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Main Menu
          </p>

          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.label}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                      isActive
                        ? "bg-green-500 text-white shadow-lg shadow-green-900/20"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  <Icon size={19} className="shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Smart Insights Card */}
        <div className="m-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 text-2xl">👑</div>

          <h3 className="text-sm font-semibold">Smart Insights</h3>

          <p className="mt-1 text-xs leading-5 text-slate-400">
            Get smarter insights about your spending and savings.
          </p>

          <button
            type="button"
            onClick={() => setShowSubscription(true)}
            className="mt-4 w-full rounded-xl bg-green-500 py-2.5 text-sm font-semibold transition hover:bg-green-400"
          >
            Explore Insights
          </button>
        </div>
      </aside>

      {/* Subscription Popup */}
      {showSubscription && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setShowSubscription(false)}
        >
          <div
            className="relative my-auto w-full max-w-lg rounded-3xl border border-white/10 bg-[#0B2029] p-6 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowSubscription(false)}
              className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Close subscription popup"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400/10 text-3xl">
              👑
            </div>

            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-green-400">
              SmartFinance Premium
            </p>

            <h2 className="text-2xl font-bold">Unlock Smart Insights</h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Get a deeper understanding of your money and make smarter
              financial decisions.
            </p>

            {/* Premium Features */}
            <div className="my-5 grid grid-cols-2 gap-3">
              {[
                "Advanced financial analytics",
                "AI-powered spending insights",
                "Personalized saving recommendations",
                "Detailed financial reports",
              ].map((feature) => (
                <div key={feature} className="flex items-start gap-2 text-xs">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-400">
                    ✓
                  </span>
                  <span className="leading-5 text-slate-300">{feature}</span>
                </div>
              ))}
            </div>

            {/* Subscription Plans */}
            <div className="mb-5 space-y-3">
              <h3 className="text-sm font-semibold">Choose Your Plan</h3>

              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.id;

                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-green-400 bg-green-500/10"
                        : "border-white/10 bg-white/5 hover:border-white/30"
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-2.5 right-4 rounded-full bg-green-500 px-3 py-1 text-[9px] font-bold text-white">
                        BEST VALUE
                      </span>
                    )}

                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                          isSelected ? "border-green-400" : "border-slate-500"
                        }`}
                      >
                        {isSelected && (
                          <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                        )}
                      </div>

                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            isSelected ? "text-green-400" : "text-white"
                          }`}
                        >
                          {plan.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {plan.duration} · {plan.description}
                        </p>
                      </div>
                    </div>

                    <span className="text-xl font-bold">{plan.price}</span>
                  </button>
                );
              })}
            </div>

            {/* Subscribe Button */}
            <button
              type="button"
              onClick={() => {
                alert(
                  `You selected the ${
                    plans.find((plan) => plan.id === selectedPlan).name
                  }. Payment integration coming soon!`,
                );
              }}
              className="w-full rounded-xl bg-green-500 py-3 font-semibold text-white transition hover:bg-green-400"
            >
              Subscribe Now
            </button>

            <p className="mt-3 text-center text-xs text-slate-500">
              Demo plans · Secure payment options coming soon.
            </p>
          </div>
        </div>
      )}

      {/* Hide Sidebar Scrollbar */}
      <style>
        {`
          .sidebar-scrollbar {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }

          .sidebar-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
    </>
  );
};

export default UserSidebar;
