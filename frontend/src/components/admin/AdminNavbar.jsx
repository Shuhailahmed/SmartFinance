import { Menu, Search, Bell, ChevronDown } from "lucide-react";

import { useAuth } from "../../context/AuthContext";

const AdminNavbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
        >
          <Menu size={22} />
        </button>

        <div className="hidden w-[420px] items-center gap-3 rounded-xl bg-slate-100 px-4 py-2.5 md:flex">
          <Search size={19} className="text-slate-400" />

          <input
            type="text"
            placeholder="Search users, transactions..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative rounded-xl p-2.5 hover:bg-slate-100">
          <Bell size={21} />

          <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 font-bold text-white">
            {user?.name?.charAt(0)?.toUpperCase() || "A"}
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-semibold">
              {user?.name || "Administrator"}
            </p>

            <p className="text-xs text-slate-500">Administrator</p>
          </div>

          <ChevronDown size={17} className="text-slate-500" />
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;
