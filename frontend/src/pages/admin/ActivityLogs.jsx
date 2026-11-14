import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Search,
  RefreshCw,
  Download,
  Clock3,
  ShieldCheck,
  AlertCircle,
  CircleCheck,
  CircleX,
  FileClock,
  UserRound,
} from "lucide-react";
import { getActivityLogs } from "../../services/adminService";

const getRecords = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.logs)) return response.data.logs;
  if (Array.isArray(response?.logs)) return response.logs;
  return [];
};

const formatDate = (value) => {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getAction = (log) =>
  log.action || log.event || log.activity || log.type || "Activity recorded";

const getActor = (log) =>
  log.user?.name ||
  log.user?.email ||
  log.userName ||
  log.email ||
  log.admin?.name ||
  "System";

const getDescription = (log) =>
  log.description ||
  log.message ||
  log.details ||
  log.actionDescription ||
  "An activity was recorded in the system.";

const getStatus = (log) => {
  const value = String(log.status || log.result || "").toLowerCase();

  if (
    value.includes("fail") ||
    value.includes("error") ||
    value.includes("denied")
  ) {
    return "failed";
  }

  if (
    value.includes("success") ||
    value.includes("complete") ||
    value.includes("approved")
  ) {
    return "success";
  }

  return "recorded";
};

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getActivityLogs(100);
      setLogs(getRecords(response));
    } catch (err) {
      console.error("Activity logs error:", err);
      setError(
        err.response?.data?.message ||
          "Activity logs load nahi hue. Backend API aur admin authentication check karo.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const actionOptions = useMemo(() => {
    const actions = [...new Set(logs.map(getAction))];
    return actions.sort((a, b) => a.localeCompare(b));
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return logs.filter((log) => {
      const searchableText = [
        getAction(log),
        getActor(log),
        getDescription(log),
        log.ipAddress,
        log.ip,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);
      const matchesAction =
        actionFilter === "all" || getAction(log) === actionFilter;
      const matchesStatus =
        statusFilter === "all" || getStatus(log) === statusFilter;

      return matchesSearch && matchesAction && matchesStatus;
    });
  }, [logs, search, actionFilter, statusFilter]);

  const successfulCount = logs.filter(
    (log) => getStatus(log) === "success",
  ).length;

  const failedCount = logs.filter((log) => getStatus(log) === "failed").length;

  const exportCSV = () => {
    const rows = [
      ["Activity", "Description", "User", "Status", "IP Address", "Date"],
      ...filteredLogs.map((log) => [
        getAction(log),
        getDescription(log),
        getActor(log),
        getStatus(log),
        log.ipAddress || log.ip || "",
        formatDate(log.createdAt || log.timestamp || log.date),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "smart-finance-activity-logs.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-full space-y-6 pb-8">
      {/* Heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700">
            <ShieldCheck size={17} />
            Administration / Security
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Activity Logs
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Monitor recorded actions and review system activity.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadLogs}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          <button
            type="button"
            onClick={exportCSV}
            disabled={loading || filteredLogs.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Unable to load activity logs</p>
            <p className="mt-1">{error}</p>
            <button
              type="button"
              onClick={loadLogs}
              className="mt-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Total Activities"
          value={logs.length}
          description="Records returned by the API"
          icon={Activity}
          color="blue"
          loading={loading}
        />

        <SummaryCard
          title="Successful Activities"
          value={successfulCount}
          description="Records marked successful"
          icon={CircleCheck}
          color="green"
          loading={loading}
        />

        <SummaryCard
          title="Failed Activities"
          value={failedCount}
          description="Records marked failed"
          icon={CircleX}
          color="red"
          loading={loading}
        />
      </section>

      {/* Filters */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4">
          <h2 className="font-bold text-slate-900">Audit Trail</h2>
          <p className="mt-1 text-sm text-slate-500">
            Search and filter the activity records returned by your backend.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search activity or user..."
              aria-label="Search activity logs"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            aria-label="Filter by action"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
          >
            <option value="all">All activities</option>
            {actionOptions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"
          >
            <option value="all">All statuses</option>
            <option value="success">Successful</option>
            <option value="failed">Failed</option>
            <option value="recorded">Other / Unspecified</option>
          </select>
        </div>
      </section>

      {/* Activity table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold text-slate-900">Recent Activity</h2>
            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? "Loading records..."
                : `${filteredLogs.length} matching record${filteredLogs.length === 1 ? "" : "s"}`}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock3 size={15} />
            Timestamps shown in local time
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Activity</th>
                <th className="px-5 py-4 font-semibold">User / Actor</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">IP Address</th>
                <th className="px-5 py-4 font-semibold">Date & Time</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading &&
                [1, 2, 3, 4].map((item) => (
                  <tr key={item}>
                    <td colSpan={5} className="px-5 py-4">
                      <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                    </td>
                  </tr>
                ))}

              {!loading &&
                filteredLogs.map((log, index) => {
                  const status = getStatus(log);

                  return (
                    <tr
                      key={log._id || log.id || index}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="max-w-sm px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                            <FileClock size={17} />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-800">
                              {getAction(log)}
                            </p>
                            <p className="mt-1 break-words text-xs leading-5 text-slate-500">
                              {getDescription(log)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <UserRound
                            size={16}
                            className="shrink-0 text-slate-400"
                          />
                          <span className="max-w-48 break-words text-slate-700">
                            {getActor(log)}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={status} />
                      </td>

                      <td className="px-5 py-4 font-mono text-xs text-slate-500">
                        {log.ipAddress || log.ip || "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                        {formatDate(log.createdAt || log.timestamp || log.date)}
                      </td>
                    </tr>
                  );
                })}

              {!loading && filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
                        <FileClock size={27} />
                      </div>
                      <p className="mt-4 font-semibold text-slate-800">
                        {logs.length
                          ? "No matching activities"
                          : "No activity records found"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {logs.length
                          ? "Try changing your search or filters."
                          : "Records will appear here when the backend returns activity logs."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3 text-xs text-slate-500 sm:flex-row">
          <span>
            Showing {loading ? 0 : filteredLogs.length} of {logs.length} loaded
            records
          </span>
          <span>Smart Finance · Admin Audit Trail</span>
        </div>
      </section>
    </div>
  );
};

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  color,
  loading,
}) {
  const iconStyles = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-rose-50 text-rose-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          {loading ? (
            <div className="mt-3 h-8 w-16 animate-pulse rounded bg-slate-100" />
          ) : (
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              {value}
            </p>
          )}
        </div>

        <div className={`rounded-xl p-3 ${iconStyles[color]}`}>
          <Icon size={21} />
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    failed: "bg-rose-50 text-rose-700 ring-rose-600/20",
    recorded: "bg-slate-100 text-slate-600 ring-slate-500/20",
  };

  const labels = {
    success: "Successful",
    failed: "Failed",
    recorded: "Recorded",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "success"
            ? "bg-emerald-500"
            : status === "failed"
              ? "bg-rose-500"
              : "bg-slate-400"
        }`}
      />
      {labels[status]}
    </span>
  );
}

export default ActivityLogs;
