import { useEffect, useState } from "react";
import { Bell, CheckCheck, Megaphone, ClipboardList, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "../../hooks/useNotifications";
import "./styles/StudentNotifications.css";

const TYPE_CONFIG = {
  appeal: {
    label: "Appeal",
    icon: Megaphone,
    colorVar: "var(--info-text)",
    bgVar: "var(--info-light)",
  },
  survey: {
    label: "Survey",
    icon: ClipboardList,
    colorVar: "var(--success-text)",
    bgVar: "var(--success-light)",
  },
  system: {
    label: "System",
    icon: Info,
    colorVar: "var(--primary-color)",
    bgVar: "var(--tint-color)",
  },
};

function formatTime(sentAt) {
  if (!sentAt) return "";
  const d = new Date(sentAt);
  if (isNaN(d.getTime())) return String(sentAt);
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function NotificationItem({ notification, onMarkRead }) {
  const type = notification.sender_type ?? "system";
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.system;
  const Icon = config.icon;
  const isUnread = !notification.is_read;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className={`notif-card ${isUnread ? "notif-card--unread" : ""}`}
      onClick={() => isUnread && onMarkRead(notification.notification_id)}
    >
      <div
        className="notif-card-icon"
        style={{ background: config.bgVar, color: config.colorVar }}
      >
        <Icon size={18} />
      </div>

      <div className="notif-card-body">
        <p className="notif-card-title">{notification.title}</p>
        <div className="notif-card-meta">
          <span
            className="notif-type-badge"
            style={{ background: config.bgVar, color: config.colorVar }}
          >
            {config.label}
          </span>
          <span className="notif-card-time">
            {formatTime(notification.sent_at)}
          </span>
        </div>
      </div>

      {isUnread && <span className="notif-card-unread-dot" />}
    </motion.div>
  );
}

const FILTERS = ["All", "Unread", "Appeal", "Survey", "System"];

export default function StudentNotifications() {
  const [filter, setFilter] = useState("All");
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const filtered = notifications.filter((n) => {
    if (filter === "Unread") return !n.is_read;
    if (filter === "All") return true;
    return (n.sender_type ?? "system").toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="student-notifications-page">
      <div className="head">
        <div>
          <h1>Notifications</h1>
          <p>
            Stay updated on your appeals, surveys, and system announcements.
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="mark-all-btn" onClick={markAllAsRead}>
            <CheckCheck size={16} />
            Mark all as read
          </button>
        )}
      </div>

      <div className="notif-filters">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={`notif-filter-btn ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f}
            {f === "Unread" && unreadCount > 0 && (
              <span className="notif-filter-count">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state">
          <p>Loading notifications…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Bell size={36} strokeWidth={1.5} />
          <h3>No notifications</h3>
          <p>
            {filter === "Unread"
              ? "You're all caught up!"
              : "Nothing here yet."}
          </p>
        </div>
      ) : (
        <div className="notif-list">
          <AnimatePresence mode="popLayout">
            {filtered.map((n) => (
              <NotificationItem
                key={n.notification_id}
                notification={n}
                onMarkRead={markAsRead}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
