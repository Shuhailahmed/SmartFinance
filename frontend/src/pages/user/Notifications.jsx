import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Info,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  WalletCards,
  AlertTriangle,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import notificationService from "../../services/notificationService";

const Notifications = () => {
  const { token } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setLoading(true);

      const response = await notificationService.getNotifications(token);

      if (response.success) {
        setNotifications(response.data || []);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadNotifications();
    }
  }, [token]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(token, id);

      setNotifications((current) =>
        current.map((notification) =>
          notification._id === id
            ? {
                ...notification,
                isRead: true,
              }
            : notification,
        ),
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead(token);

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(token, id);

      setNotifications((current) =>
        current.filter((notification) => notification._id !== id),
      );
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const getNotificationIcon = (type) => {
    const iconClass = "h-5 w-5";

    switch (type) {
      case "success":
      case "income":
        return <TrendingUp className={`${iconClass} text-emerald-600`} />;

      case "expense":
        return <TrendingDown className={`${iconClass} text-rose-500`} />;

      case "budget":
        return <WalletCards className={`${iconClass} text-orange-500`} />;

      case "savings":
        return <PiggyBank className={`${iconClass} text-violet-600`} />;

      case "warning":
        return <AlertTriangle className={`${iconClass} text-amber-500`} />;

      default:
        return <Info className={`${iconClass} text-blue-600`} />;
    }
  };

  const getIconBackground = (type) => {
    switch (type) {
      case "success":
      case "income":
        return "bg-emerald-50";

      case "expense":
        return "bg-rose-50";

      case "budget":
        return "bg-orange-50";

      case "savings":
        return "bg-violet-50";

      case "warning":
        return "bg-amber-50";

      default:
        return "bg-blue-50";
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length;

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        Loading notifications...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>

            {unreadCount > 0 && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                {unreadCount} unread
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Stay updated with your financial activity.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            <CheckCheck size={18} />
            Mark All as Read
          </button>
        )}
      </div>

      {/* Notifications */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <Bell size={28} className="text-slate-400" />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-slate-900">
              No notifications
            </h2>

            <p className="mt-2 max-w-md text-sm text-slate-500">
              You're all caught up. New financial notifications will appear
              here.
            </p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`flex gap-4 border-b border-slate-100 p-5 last:border-0 ${
                  !notification.isRead ? "bg-green-50/40" : "bg-white"
                }`}
              >
                {/* Icon */}
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${getIconBackground(
                    notification.type,
                  )}`}
                >
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {notification.title}
                        </h3>

                        {!notification.isRead && (
                          <span className="h-2 w-2 rounded-full bg-green-500" />
                        )}
                      </div>

                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {notification.message}
                      </p>
                    </div>

                    <p className="shrink-0 text-xs text-slate-400">
                      {new Date(notification.createdAt).toLocaleString(
                        "en-IN",
                        {
                          dateStyle: "medium",
                          timeStyle: "short",
                        },
                      )}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notification._id)}
                        className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
                      >
                        <Check size={15} />
                        Mark as Read
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(notification._id)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
