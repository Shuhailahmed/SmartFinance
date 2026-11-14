import { Link } from "react-router-dom";
import { Users, ArrowRight } from "lucide-react";

const RecentUsers = ({ users = [], loading = false }) => {
  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    return Number.isNaN(parsedDate.getTime())
      ? "—"
      : parsedDate.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <div>
          <h2 className="font-semibold text-slate-900">Recent Users</h2>
          <p className="mt-1 text-sm text-slate-500">
            Latest registered accounts
          </p>
        </div>

        <Users size={21} className="text-slate-400" />
      </div>

      {loading ? (
        <div className="space-y-4 p-5">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex animate-pulse items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded bg-slate-100" />
                <div className="h-3 w-48 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="p-10 text-center">
          <Users className="mx-auto text-slate-300" size={32} />
          <p className="mt-3 text-sm font-medium text-slate-700">
            No users available
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Registered users will appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {users.slice(0, 5).map((user) => (
            <div
              key={user._id || user.id || user.email}
              className="flex items-center gap-3 p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 font-semibold text-emerald-700">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {user.name || "Unnamed user"}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {user.email || "No email"}
                </p>
              </div>

              <span className="hidden text-xs text-slate-400 sm:block">
                {formatDate(user.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-slate-100 p-4">
        <Link
          to="/admin/users"
          className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
        >
          View all users <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
};

export default RecentUsers;
