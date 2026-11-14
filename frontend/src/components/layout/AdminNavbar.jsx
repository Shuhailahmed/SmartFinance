import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import {
  Bell,
  Search,
  ShieldCheck,
  X,
  Users,
  ArrowLeftRight,
  Tags,
  Wallet,
  Loader2,
  SearchX,
  Settings,
  LogOut,
  Check,
  CheckCheck,
  Trash2,
  ChevronDown,
  Clock,
  UserPlus,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Info,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import notificationService from "../../services/notificationService";

// ==========================================
// HELPERS
// ==========================================

const extractArray = (response, keys = []) => {
  const candidates = [
    response,
    response?.data,
    response?.data?.data,
    response?.data?.result,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;

    if (candidate && typeof candidate === "object") {
      for (const key of keys) {
        if (Array.isArray(candidate[key])) {
          return candidate[key];
        }
      }
    }
  }

  return [];
};

const getSearchableText = (item) =>
  [
    item?.name,
    item?.title,
    item?.email,
    item?.description,
    item?.category,
    item?.type,
    item?.paymentMethod,
    item?.status,
    item?.budgetName,
    item?.userId?.name,
    item?.userId?.email,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const getItemTitle = (item, type) => {
  if (type === "Users") {
    return item.name || item.email || "Unknown User";
  }

  if (type === "Transactions") {
    return item.description || item.category || "Transaction";
  }

  if (type === "Categories") {
    return item.name || item.title || "Category";
  }

  return item.name || item.title || item.budgetName || "Budget";
};

const getItemSubtitle = (item, type) => {
  if (type === "Users") return item.email || "Registered user";

  if (type === "Transactions") {
    return `${item.category || "Other"} • ${item.type || "Transaction"}`;
  }

  if (type === "Categories") {
    return item.description || "Expense category";
  }

  return item.description || item.status || "Budget";
};

const searchConfig = [
  {
    type: "Users",
    path: "/admin/users",
    icon: Users,
    endpoint: "/admin/users",
    keys: ["users", "results"],
  },
  {
    type: "Transactions",
    path: "/admin/transactions",
    icon: ArrowLeftRight,
    endpoint: "/admin/transactions",
    keys: ["transactions", "results"],
  },
  {
    type: "Categories",
    path: "/admin/categories",
    icon: Tags,
    endpoint: "/admin/categories",
    keys: ["categories", "results"],
  },
  {
    type: "Budgets",
    path: "/admin/budgets",
    icon: Wallet,
    endpoint: "/admin/budgets",
    keys: ["budgets", "results"],
  },
];

const getNotificationList = (response) =>
  extractArray(response, ["notifications", "results", "items"]);

const getUnreadValue = (response) => {
  const data = response?.data ?? response;

  return Number(data?.unreadCount ?? data?.count ?? data?.unread ?? 0);
};

const formatNotificationTime = (date) => {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Notification icon and color based on type
const getNotificationStyle = (type) => {
  const styles = {
    success: {
      icon: CheckCircle2,
      container: "bg-emerald-100 text-emerald-700",
      label: "Success",
      badge: "bg-emerald-50 text-emerald-700",
    },
    system: {
      icon: ShieldCheck,
      container: "bg-indigo-100 text-indigo-700",
      label: "System",
      badge: "bg-indigo-50 text-indigo-700",
    },
    warning: {
      icon: AlertTriangle,
      container: "bg-amber-100 text-amber-700",
      label: "Warning",
      badge: "bg-amber-50 text-amber-700",
    },
    expense: {
      icon: TrendingDown,
      container: "bg-rose-100 text-rose-700",
      label: "Expense",
      badge: "bg-rose-50 text-rose-700",
    },
    income: {
      icon: TrendingUp,
      container: "bg-emerald-100 text-emerald-700",
      label: "Income",
      badge: "bg-emerald-50 text-emerald-700",
    },
    budget: {
      icon: Wallet,
      container: "bg-orange-100 text-orange-700",
      label: "Budget",
      badge: "bg-orange-50 text-orange-700",
    },
    savings: {
      icon: PiggyBank,
      container: "bg-cyan-100 text-cyan-700",
      label: "Savings",
      badge: "bg-cyan-50 text-cyan-700",
    },
    info: {
      icon: Info,
      container: "bg-blue-100 text-blue-700",
      label: "Information",
      badge: "bg-blue-50 text-blue-700",
    },
  };

  return styles[type] || styles.info;
};

// ==========================================
// ADMIN NAVBAR
// ==========================================

const AdminNavbar = () => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  // Search states
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Profile states
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const searchRef = useRef(null);
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  // ==========================================
  // FETCH NOTIFICATIONS
  // ==========================================

  const loadNotifications = useCallback(async () => {
    if (!token) return;

    setNotificationsLoading(true);
    setNotificationError("");

    try {
      const [notificationResponse, unreadResponse] = await Promise.all([
        notificationService.getNotifications(token),
        notificationService.getUnreadCount(token),
      ]);

      setNotifications(getNotificationList(notificationResponse));
      setUnreadCount(getUnreadValue(unreadResponse));
    } catch (error) {
      console.error("Notification loading error:", error);

      setNotificationError(
        error.response?.data?.message || "Unable to load notifications.",
      );
    } finally {
      setNotificationsLoading(false);
    }
  }, [token]);

  // Initial load and automatic refresh
  useEffect(() => {
    if (!token) return;

    loadNotifications();

    const intervalId = setInterval(() => {
      loadNotifications();
    }, 60000);

    return () => clearInterval(intervalId);
  }, [token, loadNotifications]);

  // ==========================================
  // MARK SINGLE NOTIFICATION AS READ
  // ==========================================

  const handleMarkAsRead = async (notification) => {
    if (!token || notification.isRead) return;

    try {
      await notificationService.markAsRead(token, notification._id);

      setNotifications((previous) =>
        previous.map((item) =>
          item._id === notification._id ? { ...item, isRead: true } : item,
        ),
      );

      setUnreadCount((previous) => Math.max(0, previous - 1));
    } catch (error) {
      console.error("Mark as read error:", error);

      setNotificationError(
        error.response?.data?.message || "Unable to update notification.",
      );
    }
  };

  // ==========================================
  // MARK ALL NOTIFICATIONS AS READ
  // ==========================================

  const handleMarkAllAsRead = async () => {
    if (!token || unreadCount === 0) return;

    try {
      await notificationService.markAllAsRead(token);

      setNotifications((previous) =>
        previous.map((item) => ({
          ...item,
          isRead: true,
        })),
      );

      setUnreadCount(0);
    } catch (error) {
      console.error("Mark all as read error:", error);

      setNotificationError(
        error.response?.data?.message ||
          "Unable to mark notifications as read.",
      );
    }
  };

  // ==========================================
  // DELETE NOTIFICATION
  // ==========================================

  const handleDeleteNotification = async (notification) => {
    if (!token || !notification._id) return;

    try {
      await notificationService.deleteNotification(token, notification._id);

      setNotifications((previous) =>
        previous.filter((item) => item._id !== notification._id),
      );

      if (!notification.isRead) {
        setUnreadCount((previous) => Math.max(0, previous - 1));
      }
    } catch (error) {
      console.error("Delete notification error:", error);

      setNotificationError(
        error.response?.data?.message || "Unable to delete notification.",
      );
    }
  };

  // ==========================================
  // GLOBAL SEARCH
  // ==========================================

  useEffect(() => {
    const searchTerm = query.trim().toLowerCase();

    if (searchTerm.length < 2) {
      setResults([]);
      setSearching(false);
      setSearchError("");
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setSearching(true);
      setSearchError("");

      try {
        const responses = await Promise.allSettled(
          searchConfig.map((config) =>
            api.get(config.endpoint, {
              params: {
                page: 1,
                limit: 100,
              },
            }),
          ),
        );

        if (cancelled) return;

        const allResults = [];

        responses.forEach((response, index) => {
          if (response.status !== "fulfilled") {
            console.error(
              `${searchConfig[index].type} search error:`,
              response.reason,
            );
            return;
          }

          const config = searchConfig[index];
          const items = extractArray(response.value, config.keys);

          const matchingItems = items
            .filter((item) => getSearchableText(item).includes(searchTerm))
            .slice(0, 5);

          matchingItems.forEach((item) => {
            allResults.push({
              ...item,
              searchType: config.type,
              searchPath: config.path,
              searchIcon: config.icon,
              searchTitle: getItemTitle(item, config.type),
              searchSubtitle: getItemSubtitle(item, config.type),
            });
          });
        });

        if (!cancelled) {
          setResults(allResults.slice(0, 12));
        }
      } catch (error) {
        console.error("Global search error:", error);

        if (!cancelled) {
          setSearchError("Unable to search right now.");
        }
      } finally {
        if (!cancelled) {
          setSearching(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const handleSelectResult = (result) => {
    setIsSearchOpen(false);
    setQuery("");
    setResults([]);

    navigate(result.searchPath);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setSearchError("");
    setIsSearchOpen(false);
  };

  // ==========================================
  // PROFILE ACTIONS
  // ==========================================

  const handleSettings = () => {
    setIsProfileOpen(false);
    navigate("/admin/settings");
  };

  const handleLogout = () => {
    setIsProfileOpen(false);
    logout();
    navigate("/admin/login", { replace: true });
  };

  // ==========================================
  // CLOSE DROPDOWNS ON OUTSIDE CLICK
  // ==========================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsNotificationOpen(false);
      }

      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
      {/* LEFT SIDE */}

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
          Administration
        </p>

        <h1 className="text-lg font-semibold text-slate-900">Admin Panel</h1>
      </div>

      {/* RIGHT SIDE */}

      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {/* ======================================
            GLOBAL SEARCH
        ====================================== */}

        <div ref={searchRef} className="relative w-36 sm:w-52 md:w-64 lg:w-72">
          <div
            className={`flex items-center gap-2 rounded-xl border bg-slate-50 px-3 py-2.5 transition ${
              isSearchOpen
                ? "border-emerald-400 bg-white ring-4 ring-emerald-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            {searching ? (
              <Loader2
                size={17}
                className="shrink-0 animate-spin text-emerald-600"
              />
            ) : (
              <Search size={17} className="shrink-0 text-slate-400" />
            )}

            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && results.length > 0) {
                  handleSelectResult(results[0]);
                }

                if (event.key === "Escape") {
                  setIsSearchOpen(false);
                }
              }}
              placeholder="Search anything..."
              aria-label="Search platform"
              className="w-full min-w-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />

            {query && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {isSearchOpen && query.trim().length >= 2 && (
            <div className="absolute right-0 top-full z-[100] mt-2 max-h-[420px] w-[min(90vw,380px)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
              <div className="flex items-center justify-between px-3 py-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Search Results
                </p>

                {!searching && (
                  <span className="text-xs text-slate-400">
                    {results.length} found
                  </span>
                )}
              </div>

              {searching ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                  <Loader2
                    size={17}
                    className="animate-spin text-emerald-600"
                  />
                  Searching platform...
                </div>
              ) : searchError ? (
                <div className="px-3 py-8 text-center text-sm text-red-500">
                  {searchError}
                </div>
              ) : results.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                  <SearchX size={25} className="text-slate-300" />

                  <p className="text-sm font-semibold text-slate-700">
                    No results found
                  </p>

                  <p className="text-xs text-slate-400">
                    Try another name, email or keyword.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {results.map((result, index) => {
                    const Icon = result.searchIcon;

                    return (
                      <button
                        key={`${result.searchType}-${result._id || index}`}
                        type="button"
                        onClick={() => handleSelectResult(result)}
                        className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-emerald-50"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                          <Icon size={18} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {result.searchTitle}
                          </p>

                          <p className="truncate text-xs text-slate-500">
                            {result.searchSubtitle}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
                          {result.searchType}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ======================================
            NOTIFICATION CENTER
        ====================================== */}

        <div ref={notificationRef} className="relative">
          {/* BELL BUTTON */}

          <button
            type="button"
            aria-label={`Notifications, ${unreadCount} unread`}
            aria-expanded={isNotificationOpen}
            onClick={() => {
              const nextState = !isNotificationOpen;

              setIsNotificationOpen(nextState);
              setIsProfileOpen(false);
              setIsSearchOpen(false);

              if (nextState) loadNotifications();
            }}
            className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
              isNotificationOpen
                ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Bell size={20} />

            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* NOTIFICATION DROPDOWN */}

          {isNotificationOpen && (
            <div className="absolute right-0 top-full z-[100] mt-3 w-[min(92vw,420px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
              {/* HEADER */}

              <div className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-white to-white px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">
                        Notifications
                      </h3>

                      {unreadCount > 0 && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          {unreadCount} NEW
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      Stay updated with your platform activity
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllAsRead}
                        title="Mark all as read"
                        className="rounded-lg p-2 text-emerald-600 transition hover:bg-emerald-100"
                      >
                        <CheckCheck size={18} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={loadNotifications}
                      title="Refresh notifications"
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Loader2
                        size={17}
                        className={notificationsLoading ? "animate-spin" : ""}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* NOTIFICATION CONTENT */}

              <div className="max-h-[420px] overflow-y-auto">
                {notificationsLoading && notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2
                      size={25}
                      className="animate-spin text-emerald-500"
                    />

                    <p className="mt-3 text-xs text-slate-400">
                      Loading notifications...
                    </p>
                  </div>
                ) : notificationError ? (
                  <div className="px-5 py-10 text-center">
                    <p className="text-sm text-rose-500">{notificationError}</p>

                    <button
                      type="button"
                      onClick={loadNotifications}
                      className="mt-3 text-xs font-semibold text-emerald-600 hover:underline"
                    >
                      Try again
                    </button>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <Bell size={27} />
                    </div>

                    <h4 className="mt-4 text-sm font-bold text-slate-800">
                      You're all caught up!
                    </h4>

                    <p className="mt-1 text-xs text-slate-400">
                      New notifications will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.slice(0, 10).map((notification) => {
                      const style = getNotificationStyle(notification.type);
                      const NotificationIcon = style.icon;

                      return (
                        <div
                          key={notification._id}
                          className={`group flex gap-3 px-5 py-4 transition-colors ${
                            !notification.isRead
                              ? "bg-emerald-50/60 hover:bg-emerald-50"
                              : "bg-white hover:bg-slate-50"
                          }`}
                        >
                          {/* TYPE ICON */}

                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.container}`}
                          >
                            <NotificationIcon size={20} />
                          </div>

                          {/* CONTENT */}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-bold leading-5 text-slate-800">
                                {notification.title || "Notification"}
                              </h4>

                              {!notification.isRead && (
                                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                              )}
                            </div>

                            <p className="mt-1 break-words text-xs leading-5 text-slate-500">
                              {notification.message ||
                                notification.description ||
                                "You have a new notification."}
                            </p>

                            <div className="mt-2 flex items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                  <Clock size={12} />
                                  {formatNotificationTime(
                                    notification.createdAt,
                                  )}
                                </span>

                                <span
                                  className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${style.badge}`}
                                >
                                  {style.label}
                                </span>
                              </div>

                              {/* ACTIONS */}

                              <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-70 sm:group-hover:opacity-100">
                                {!notification.isRead && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleMarkAsRead(notification)
                                    }
                                    title="Mark as read"
                                    className="rounded-lg p-2 text-emerald-600 transition hover:bg-emerald-100"
                                  >
                                    <Check size={15} />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteNotification(notification)
                                  }
                                  title="Delete notification"
                                  className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-100 hover:text-rose-600"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* FOOTER */}

              {notifications.length > 0 && (
                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3">
                  <p className="text-[11px] text-slate-500">
                    Showing {Math.min(notifications.length, 10)} of{" "}
                    {notifications.length}
                  </p>

                  <span className="text-[11px] font-semibold text-emerald-600">
                    SmartFinance Admin
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ======================================
            ADMIN PROFILE DROPDOWN
        ====================================== */}

        <div
          ref={profileRef}
          className="relative border-l border-slate-200 pl-3"
        >
          <button
            type="button"
            onClick={() => {
              setIsProfileOpen((previous) => !previous);
              setIsNotificationOpen(false);
              setIsSearchOpen(false);
            }}
            aria-expanded={isProfileOpen}
            aria-label="Open administrator profile menu"
            className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-50"
          >
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt="Admin profile"
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                {(user?.name || "Admin").charAt(0).toUpperCase()}
              </div>
            )}

            <div className="hidden text-left sm:block">
              <p className="max-w-32 truncate text-sm font-semibold text-slate-800">
                {user?.name || "Administrator"}
              </p>

              <p className="flex items-center gap-1 text-xs text-emerald-600">
                <ShieldCheck size={12} />
                Administrator
              </p>
            </div>

            <ChevronDown
              size={15}
              className={`hidden text-slate-400 transition sm:block ${
                isProfileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* PROFILE MENU */}

          {isProfileOpen && (
            <div className="absolute right-0 top-full z-[100] mt-3 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-4">
                <div className="flex items-center gap-3">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt="Admin"
                      className="h-11 w-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700">
                      {(user?.name || "Admin").charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {user?.name || "Administrator"}
                    </p>

                    <p className="truncate text-xs text-slate-500">
                      {user?.email || "Admin account"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-2">
                <button
                  type="button"
                  onClick={handleSettings}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <Settings size={18} />
                  Account Settings
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;
