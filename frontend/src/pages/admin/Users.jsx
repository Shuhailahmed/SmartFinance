import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Users as UsersIcon,
  UserCheck,
  UserX,
  ShieldCheck,
  RefreshCw,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  X,
  Mail,
  CalendarDays,
  Wallet,
  ArrowLeftRight,
  Power,
  Trash2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Target,
} from "lucide-react";

import {
  getAdminUsers,
  getAdminUserDetails,
  updateAdminUserStatus,
  deleteAdminUser,
  exportAdminUsers,
} from "../../services/adminService";

// Format currency
const currency = (amount = 0, currencyCode = "INR") => {
  const safeCurrency = /^[A-Z]{3}$/.test(currencyCode) ? currencyCode : "INR";

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: safeCurrency,
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);
  } catch {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);
  }
};

// Format date
const dateFormat = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

// Get initials
const initials = (name = "") =>
  String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "U";

// Stat card
const StatCard = ({ label, value, icon: Icon, tone }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-medium text-slate-500">{label}</p>

      <div className={`rounded-xl p-2.5 ${tone}`}>
        <Icon size={20} />
      </div>
    </div>

    <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
      {Number(value || 0).toLocaleString("en-IN")}
    </p>
  </div>
);

// Financial summary card
const FinancialCard = ({ label, value, icon: Icon, color, currencyCode }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4">
    <div className="flex items-center gap-2 text-slate-500">
      <Icon size={17} />
      <span className="text-sm">{label}</span>
    </div>

    <p className={`mt-2 break-words text-lg font-bold ${color}`}>
      {currency(value, currencyCode)}
    </p>
  </div>
);

const Users = () => {
  const [users, setUsers] = useState([]);

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    admins: 0,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");

  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  // Load users
  const loadUsers = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const data = await getAdminUsers({
          page: pagination.page,
          limit: pagination.limit,
          search,
          role,
          status,
          sortBy,
          sortOrder,
        });

        setUsers(data.users || []);

        setStats({
          totalUsers:
            data.stats?.totalUsers ?? data.stats?.registeredUsers ?? 0,
          activeUsers: data.stats?.activeUsers ?? 0,
          inactiveUsers: data.stats?.inactiveUsers ?? 0,
          admins: data.stats?.admins ?? 0,
        });

        setPagination((previous) => ({
          ...previous,
          ...(data.pagination || {}),
        }));
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Users load nahi hue. Backend aur login session check karo.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      pagination.page,
      pagination.limit,
      search,
      role,
      status,
      sortBy,
      sortOrder,
    ],
  );

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Filter change
  const changeFilter = (setter, value) => {
    setter(value);

    setPagination((previous) => ({
      ...previous,
      page: 1,
    }));
  };

  // Open user details
  const openDetails = async (user) => {
    setSelectedUser(user);
    setUserDetails(null);
    setDetailsLoading(true);
    setNotice("");

    try {
      const data = await getAdminUserDetails(user._id);
      setUserDetails(data);
    } catch (err) {
      setNotice(
        err.response?.data?.message || "User details load nahi ho sake.",
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  // Close details
  const closeDetails = () => {
    setSelectedUser(null);
    setUserDetails(null);
  };

  // Activate / Deactivate
  const toggleStatus = async (user) => {
    const nextStatus = !user.isActive;

    const action = nextStatus ? "activate" : "deactivate";

    if (!window.confirm(`Are you sure you want to ${action} ${user.name}?`)) {
      return;
    }

    setBusyId(user._id);
    setNotice("");

    try {
      const data = await updateAdminUserStatus(user._id, nextStatus);

      setNotice(data.message || "Account status updated.");

      await loadUsers(true);

      if (selectedUser?._id === user._id) {
        setSelectedUser((previous) =>
          previous
            ? {
                ...previous,
                isActive: nextStatus,
              }
            : previous,
        );

        setUserDetails((previous) =>
          previous?.user
            ? {
                ...previous,
                user: {
                  ...previous.user,
                  isActive: nextStatus,
                },
              }
            : previous,
        );
      }
    } catch (err) {
      setNotice(err.response?.data?.message || "Status update failed.");
    } finally {
      setBusyId("");
    }
  };

  // Delete user
  const handleDelete = async () => {
    if (!confirmDelete) return;

    setBusyId(confirmDelete._id);
    setNotice("");

    try {
      const data = await deleteAdminUser(confirmDelete._id);

      setNotice(data.message || "User deleted.");

      if (selectedUser?._id === confirmDelete._id) {
        closeDetails();
      }

      setConfirmDelete(null);

      const nextPage =
        users.length === 1 && pagination.page > 1
          ? pagination.page - 1
          : pagination.page;

      if (nextPage !== pagination.page) {
        setPagination((previous) => ({
          ...previous,
          page: nextPage,
        }));
      } else {
        await loadUsers(true);
      }
    } catch (err) {
      setNotice(err.response?.data?.message || "User delete failed.");
    } finally {
      setBusyId("");
    }
  };

  // Export CSV
  const handleExport = async () => {
    try {
      setNotice("");

      await exportAdminUsers({
        search,
        role,
        status,
      });

      setNotice("CSV export downloaded.");
    } catch (err) {
      setNotice(err.response?.data?.message || "CSV export failed.");
    }
  };

  // Sorting
  const toggleSort = (field) => {
    if (sortBy === field) {
      changeFilter(setSortOrder, sortOrder === "asc" ? "desc" : "asc");
    } else {
      changeFilter(setSortBy, field);

      setSortOrder(field === "createdAt" ? "desc" : "asc");
    }
  };

  const summary = userDetails?.summary || {};

  const selectedCurrency =
    userDetails?.user?.currency || selectedUser?.currency || "INR";

  return (
    <div className="min-w-0 space-y-6">
      {/* PAGE HEADER */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-emerald-600">
            Administration / Users
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            User Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage registered accounts, financial activity and account access.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => loadUsers(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </header>

      {/* NOTIFICATION */}
      {notice && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span>{notice}</span>

          <button onClick={() => setNotice("")} aria-label="Dismiss message">
            <X size={16} />
          </button>
        </div>
      )}

      {/* STATISTICS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Registered users"
          value={stats.totalUsers}
          icon={UsersIcon}
          tone="bg-blue-50 text-blue-600"
        />

        <StatCard
          label="Active users"
          value={stats.activeUsers}
          icon={UserCheck}
          tone="bg-emerald-50 text-emerald-600"
        />

        <StatCard
          label="Inactive users"
          value={stats.inactiveUsers}
          icon={UserX}
          tone="bg-rose-50 text-rose-600"
        />

        <StatCard
          label="Administrators"
          value={stats.admins}
          icon={ShieldCheck}
          tone="bg-violet-50 text-violet-600"
        />
      </section>

      {/* USERS TABLE */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* TABLE FILTERS */}
        <div className="border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">All accounts</h2>

              <p className="mt-1 text-sm text-slate-500">
                {pagination.total.toLocaleString("en-IN")} matching records
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:flex">
              {/* SEARCH */}
              <div className="relative sm:col-span-2 xl:w-72">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={searchInput}
                  onChange={(event) => {
                    setSearchInput(event.target.value);

                    setPagination((previous) => ({
                      ...previous,
                      page: 1,
                    }));
                  }}
                  placeholder="Search name or email..."
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-9 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />

                {searchInput && (
                  <button
                    onClick={() => {
                      setSearchInput("");
                      setSearch("");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    aria-label="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* ROLE FILTER */}
              <select
                value={role}
                onChange={(event) => changeFilter(setRole, event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
              >
                <option value="">All roles</option>
                <option value="user">Users</option>
                <option value="admin">Admins</option>
              </select>

              {/* STATUS FILTER */}
              <select
                value={status}
                onChange={(event) =>
                  changeFilter(setStatus, event.target.value)
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              {/* LIMIT */}
              <select
                value={pagination.limit}
                onChange={(event) => {
                  setPagination((previous) => ({
                    ...previous,
                    page: 1,
                    limit: Number(event.target.value),
                  }));
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
                aria-label="Rows per page"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="m-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />

            <div className="flex-1">
              <p className="font-semibold">Unable to load users</p>

              <p className="mt-1">{error}</p>

              <button
                onClick={() => loadUsers()}
                className="mt-2 font-semibold underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">
                  <button
                    onClick={() => toggleSort("name")}
                    className="inline-flex items-center gap-2"
                  >
                    User
                    <ArrowUpDown size={13} />
                  </button>
                </th>

                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Total Income</th>
                <th className="px-5 py-4">Total Expenses</th>
                <th className="px-5 py-4">Transactions</th>
                <th className="px-5 py-4">Currency</th>

                <th className="px-5 py-4">
                  <button
                    onClick={() => toggleSort("createdAt")}
                    className="inline-flex items-center gap-2"
                  >
                    Registered
                    <ArrowUpDown size={13} />
                  </button>
                </th>

                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {/* LOADING */}
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    {Array.from({ length: 9 }).map((__, cell) => (
                      <td key={cell} className="px-5 py-5">
                        <div className="h-4 animate-pulse rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                /* EMPTY */
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                      <UsersIcon size={23} />
                    </div>

                    <p className="mt-3 font-semibold text-slate-800">
                      No users found
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Try changing your search or filters.
                    </p>

                    <button
                      onClick={() => {
                        setSearchInput("");
                        setSearch("");
                        setRole("");
                        setStatus("");
                      }}
                      className="mt-3 text-sm font-semibold text-emerald-700"
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              ) : (
                /* USER ROWS */
                users.map((user) => {
                  const financial = user.financialSummary || {};

                  const userCurrency = user.currency || "INR";

                  return (
                    <tr
                      key={user._id}
                      className="transition hover:bg-slate-50/80"
                    >
                      {/* USER */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {user.profileImage ? (
                            <img
                              src={user.profileImage}
                              alt=""
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-700">
                              {initials(user.name)}
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {user.name}
                            </p>

                            <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500">
                              <Mail size={12} />
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* ROLE */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            user.role === "admin"
                              ? "bg-violet-50 text-violet-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {user.role === "admin" ? "Admin" : "User"}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            user.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              user.isActive ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />

                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* TOTAL INCOME */}
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-emerald-700">
                        {currency(financial.totalIncome, userCurrency)}
                      </td>

                      {/* TOTAL EXPENSES */}
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-rose-600">
                        {currency(financial.totalExpenses, userCurrency)}
                      </td>

                      {/* TRANSACTIONS */}
                      <td className="px-5 py-4 font-semibold text-slate-700">
                        {Number(financial.transactionCount || 0).toLocaleString(
                          "en-IN",
                        )}
                      </td>

                      {/* CURRENCY */}
                      <td className="px-5 py-4 text-slate-600">
                        {userCurrency}
                      </td>

                      {/* REGISTERED */}
                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {dateFormat(user.createdAt)}
                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openDetails(user)}
                            title="View details"
                            aria-label={`View ${user.name}`}
                            className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Eye size={17} />
                          </button>

                          {user.role !== "admin" && (
                            <>
                              <button
                                onClick={() => toggleStatus(user)}
                                disabled={busyId === user._id}
                                title={
                                  user.isActive ? "Deactivate" : "Activate"
                                }
                                aria-label={
                                  user.isActive
                                    ? "Deactivate user"
                                    : "Activate user"
                                }
                                className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-50"
                              >
                                <Power size={17} />
                              </button>

                              <button
                                onClick={() => setConfirmDelete(user)}
                                title="Delete user"
                                aria-label={`Delete ${user.name}`}
                                className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                              >
                                <Trash2 size={17} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <footer className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-sm text-slate-500">
            {pagination.total === 0
              ? "Showing 0 users"
              : `Showing ${
                  (pagination.page - 1) * pagination.limit + 1
                }–${Math.min(
                  pagination.page * pagination.limit,
                  pagination.total,
                )} of ${pagination.total}`}
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1 || loading}
              onClick={() =>
                setPagination((previous) => ({
                  ...previous,
                  page: previous.page - 1,
                }))
              }
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <span className="px-2 text-sm text-slate-600">
              {pagination.totalPages
                ? `${pagination.page} / ${pagination.totalPages}`
                : "0 / 0"}
            </span>

            <button
              disabled={
                !pagination.totalPages ||
                pagination.page >= pagination.totalPages ||
                loading
              }
              onClick={() =>
                setPagination((previous) => ({
                  ...previous,
                  page: previous.page + 1,
                }))
              }
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </footer>
      </section>

      {/* USER DETAILS MODAL */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDetails();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-detail-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2
                  id="user-detail-title"
                  className="text-lg font-bold text-slate-900"
                >
                  User details
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Account information and financial summary
                </p>
              </div>

              <button
                onClick={closeDetails}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close details"
              >
                <X size={19} />
              </button>
            </div>

            {/* DETAILS LOADING */}
            {detailsLoading ? (
              <div className="space-y-4 p-6">
                <div className="h-12 animate-pulse rounded bg-slate-100" />
                <div className="h-20 animate-pulse rounded bg-slate-100" />
                <div className="h-20 animate-pulse rounded bg-slate-100" />
              </div>
            ) : userDetails ? (
              <div className="space-y-6 p-5">
                {/* USER PROFILE */}
                <div className="flex items-center gap-3">
                  {userDetails.user?.profileImage ? (
                    <img
                      src={userDetails.user.profileImage}
                      alt=""
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-lg font-bold text-emerald-700">
                      {initials(userDetails.user?.name)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="break-words font-bold text-slate-900">
                      {userDetails.user?.name}
                    </p>

                    <p className="break-all text-sm text-slate-500">
                      {userDetails.user?.email}
                    </p>

                    <p className="mt-1 text-xs capitalize text-slate-500">
                      {userDetails.user?.role} ·{" "}
                      {userDetails.user?.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>

                {/* FINANCIAL SUMMARY */}
                <div>
                  <h3 className="mb-3 font-semibold text-slate-900">
                    Financial overview
                  </h3>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FinancialCard
                      label="Total income"
                      value={summary.totalIncome}
                      icon={TrendingUp}
                      color="text-emerald-700"
                      currencyCode={selectedCurrency}
                    />

                    <FinancialCard
                      label="Total expenses"
                      value={summary.totalExpenses}
                      icon={TrendingDown}
                      color="text-rose-600"
                      currencyCode={selectedCurrency}
                    />

                    <FinancialCard
                      label="Net balance"
                      value={summary.balance}
                      icon={Wallet}
                      color={
                        Number(summary.balance || 0) >= 0
                          ? "text-emerald-700"
                          : "text-rose-600"
                      }
                      currencyCode={selectedCurrency}
                    />

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <ArrowLeftRight size={17} />
                        <span className="text-sm">Total transactions</span>
                      </div>

                      <p className="mt-2 text-lg font-bold text-slate-900">
                        {summary.transactionCount ??
                          summary.totalTransactions ??
                          0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* TRANSACTION COUNTS */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-emerald-50 p-4">
                    <p className="text-sm text-emerald-700">
                      Income transactions
                    </p>

                    <p className="mt-2 text-xl font-bold text-emerald-800">
                      {summary.incomeCount || 0}
                    </p>
                  </div>

                  <div className="rounded-xl bg-rose-50 p-4">
                    <p className="text-sm text-rose-700">
                      Expense transactions
                    </p>

                    <p className="mt-2 text-xl font-bold text-rose-800">
                      {summary.expenseCount || 0}
                    </p>
                  </div>
                </div>

                {/* BUDGET AND SAVINGS */}
                <div>
                  <h3 className="mb-3 font-semibold text-slate-900">
                    Budget & Savings
                  </h3>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FinancialCard
                      label="Total budget"
                      value={summary.totalBudget}
                      icon={Wallet}
                      color="text-blue-700"
                      currencyCode={selectedCurrency}
                    />

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Target size={17} />
                        <span className="text-sm">Savings goals</span>
                      </div>

                      <p className="mt-2 text-lg font-bold text-slate-900">
                        {summary.totalSavingsGoals || 0}
                      </p>
                    </div>

                    <FinancialCard
                      label="Target savings"
                      value={summary.totalTargetSavings}
                      icon={Target}
                      color="text-violet-700"
                      currencyCode={selectedCurrency}
                    />

                    <FinancialCard
                      label="Amount saved"
                      value={summary.totalSaved}
                      icon={PiggyBank}
                      color="text-emerald-700"
                      currencyCode={selectedCurrency}
                    />
                  </div>
                </div>

                {/* RECENT TRANSACTIONS */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">
                      Recent transactions
                    </h3>

                    <span className="text-xs text-slate-500">Latest 10</span>
                  </div>

                  {userDetails.recentTransactions?.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full min-w-[450px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                          <tr>
                            <th className="px-4 py-3">Transaction</th>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3 text-right">Amount</th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {userDetails.recentTransactions.map((transaction) => {
                            const isIncome = transaction.type === "income";

                            return (
                              <tr key={transaction._id}>
                                <td className="px-4 py-3">
                                  <p className="font-medium text-slate-800">
                                    {transaction.title ||
                                      transaction.description ||
                                      transaction.category ||
                                      "Transaction"}
                                  </p>

                                  <p
                                    className={`mt-1 text-xs capitalize ${
                                      isIncome
                                        ? "text-emerald-600"
                                        : "text-rose-600"
                                    }`}
                                  >
                                    {transaction.type || "Other"}
                                  </p>
                                </td>

                                <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                                  {dateFormat(transaction.date)}
                                </td>

                                <td
                                  className={`whitespace-nowrap px-4 py-3 text-right font-semibold ${
                                    isIncome
                                      ? "text-emerald-700"
                                      : "text-rose-600"
                                  }`}
                                >
                                  {isIncome ? "+" : "-"}
                                  {currency(
                                    transaction.amount,
                                    selectedCurrency,
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                      <ArrowLeftRight
                        size={22}
                        className="mx-auto text-slate-400"
                      />

                      <p className="mt-2 text-sm text-slate-500">
                        No transactions found for this user.
                      </p>
                    </div>
                  )}
                </div>

                {/* ACCOUNT DETAILS */}
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <CalendarDays size={16} />
                    Registered: {dateFormat(userDetails.user?.createdAt)}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Wallet size={16} />
                    Currency: {selectedCurrency}
                  </div>
                </div>

                {/* ACCOUNT ACTIONS */}
                {userDetails.user?.role !== "admin" && (
                  <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row">
                    <button
                      onClick={() => toggleStatus(selectedUser)}
                      disabled={busyId === selectedUser._id}
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {selectedUser.isActive
                        ? "Deactivate account"
                        : "Activate account"}
                    </button>

                    <button
                      onClick={() => setConfirmDelete(selectedUser)}
                      className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700"
                    >
                      Delete account
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="p-6 text-sm text-slate-500">
                Details could not be loaded.
              </p>
            )}
          </section>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-user-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <Trash2 size={21} />
            </div>

            <h2
              id="delete-user-title"
              className="mt-4 text-lg font-bold text-slate-900"
            >
              Delete this account?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              You are about to permanently delete{" "}
              <strong className="text-slate-700">{confirmDelete.name}</strong>{" "}
              and their transaction records. This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={busyId === confirmDelete._id}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                disabled={busyId === confirmDelete._id}
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {busyId === confirmDelete._id
                  ? "Deleting..."
                  : "Delete permanently"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Users;
