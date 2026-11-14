import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  Tags,
  Wallet,
  BarChart3,
  FileText,
  Activity,
  Settings,
  LogOut,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

const menuItems = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users", path: "/admin/users", icon: Users },
  { label: "Transactions", path: "/admin/transactions", icon: ArrowLeftRight },
  { label: "Categories", path: "/admin/categories", icon: Tags },
  { label: "Budgets", path: "/admin/budgets", icon: Wallet },
  { label: "Analytics", path: "/admin/analytics", icon: BarChart3 },
  { label: "Reports", path: "/admin/reports", icon: FileText },
  { label: "Activity Logs", path: "/admin/activity-logs", icon: Activity },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];

const AdminSidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 shrink-0 flex-col bg-slate-950 text-slate-300">
      {/* BRAND LOGO */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg shadow-emerald-900/30">
          <WalletCards size={24} strokeWidth={2.2} />
        </div>

        <div>
          <h2 className="font-bold tracking-wide text-white">SmartFinance</h2>
          <p className="text-xs text-slate-400">Admin Console</p>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Management
        </p>

        {menuItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/admin/dashboard"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-950/30"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* SECURITY AND LOGOUT */}
      <div className="border-t border-white/10 p-3">
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-white/5 p-3">
          <ShieldCheck size={18} className="text-emerald-400" />

          <div>
            <p className="text-xs font-semibold text-white">Secure Access</p>
            <p className="text-[11px] text-slate-400">Administrator area</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-400"
        >
          <LogOut size={19} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
