import { useEffect, useState } from "react";
import {
  Bell,
  CheckCheck,
  Megaphone,
  ClipboardList,
  Info,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "../../hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import "./styles/InstructorNotifications.css";

const MotionDiv = motion.div;

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

const formatTime = (sentAt) => {
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
};

function NotificationItem({ notification, onMarkRead }) {
  const navigate = useNavigate();
  const type = notification.sender_type ?? "system";
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.system;
  const Icon = config.icon;
  const isUnread = Number(notification.is_read) === 0;

  const handleCardClick = () => {
    if (isUnread) onMarkRead(notification.notification_id);
  };

  const handleAction = (e) => {
    e.stopPropagation();
    if (isUnread) onMarkRead(notification.notification_id);
    if (config.actionPath) {
      navigate(config.actionPath, {
        state: { activeTab: config.actionTab },
      });
    }
  };

  return (
    <MotionDiv
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className={`inotif-card ${isUnread ? "inotif-card--unread" : ""}`}
      onClick={handleCardClick}
    >
      <div
        className="inotif-card-icon"
        style={{ background: config.bgVar, color: config.colorVar }}
      >
        <Icon size={18} />
      </div>

      <div className="inotif-card-body">
        <p className="inotif-card-title">{notification.title}</p>
        <div className="inotif-card-meta">
          <span
            className="inotif-type-badge"
            style={{ background: config.bgVar, color: config.colorVar }}
          >
            {config.label}
          </span>
          <span className="inotif-card-time">
            {formatTime(notification.sent_at)}
          </span>
        </div>
      </div>

      <div className="inotif-card-actions">
        {config.actionLabel && (
          <button className="inotif-action-btn" onClick={handleAction}>
            {config.actionLabel}
            <ArrowRight size={14} />
          </button>
        )}
        {isUnread && <span className="inotif-card-unread-dot" />}
      </div>
    </MotionDiv>
  );
}

const FILTERS = ["All", "Unread", "Appeal", "Survey", "System"];

export default function InstructorNotifications() {
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
    if (filter === "Unread") return Number(n.is_read) === 0;
    if (filter === "All") return true;
    return n.sender_type === filter.toLowerCase();
  });

  return (
    <div className="instructor-notifications-page">
      <div className="inotif-head">
        <div>
          <h1>Notifications</h1>
          <p>
            Track your assigned appeals, survey results, and system updates.
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="inotif-mark-all-btn" onClick={markAllAsRead}>
            <CheckCheck size={16} />
            Mark all as read
          </button>
        )}
      </div>

      <div className="inotif-filters">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={`inotif-filter-btn ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f}
            {f === "Unread" && unreadCount > 0 && (
              <span className="inotif-filter-count">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="inotif-loading-state">
          <p>Loading notifications…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="inotif-empty-state">
          <Bell size={36} strokeWidth={1.5} />
          <h3>No notifications</h3>
          <p>
            {filter === "Unread"
              ? "You're all caught up!"
              : "Nothing here yet."}
          </p>
        </div>
      ) : (
        <div className="inotif-list">
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
