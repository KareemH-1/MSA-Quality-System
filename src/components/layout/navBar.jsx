import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/NavBar.css";
import { Bell, Info, X, CheckCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "../../hooks/useNotifications";
import { useAuth } from "../../services/AuthContext";
import { normalizeRole } from "../../services/roleUtils";
import { ROLES } from "../../constants/roles";

const MotionNav = motion.nav;
const MotionSpan = motion.span;

const NavBar = ({ components = [] }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const normalizedRole = normalizeRole(user?.role);
  const isStudent = normalizedRole === ROLES.STUDENT;
  const isInstructor = normalizedRole === ROLES.INSTRUCTOR;
  const notificationsEnabled = isStudent || isInstructor;

  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications(notificationsEnabled);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleBellClick = () => {
    if (!notificationsEnabled) return;
    if (!dropdownOpen) fetchNotifications();
    setDropdownOpen((prev) => !prev);
  };

  const handleGoToAll = () => {
    setDropdownOpen(false);
    navigate(
      isInstructor ? "/instructor-notifications" : "/student-notifications",
    );
  };

  const formatTime = (sentAt) => {
    if (!sentAt) return "";
    const d = new Date(sentAt);
    if (isNaN(d.getTime())) return "";
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    }).format(d);
  };

  const typeColor = (type) => {
    if (type === "appeal") return "var(--info-text)";
    if (type === "survey") return "var(--success-text)";
    return "var(--primary-color)";
  };

  const preview = notifications.slice(0, 5);

  return (
    <MotionNav
      className="navbar"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="nav-pages">
        {components.length > 0 ? (
          components.map((component, index) => (
            <button
              type="button"
              key={index}
              onClick={() => component.onClick?.()}
              className={`navbar-page-btn ${component.active ? "active" : ""}`}
            >
              {component.name}
            </button>
          ))
        ) : (
          <h2 className="navbar-title">MSA Quality System</h2>
        )}
      </div>

      <div className="navbar-actions">
        <input className="navbar-search" type="text" placeholder="Search..." />
        <div className="navbar-icons">
          <MotionSpan
            whileHover={{ y: -1 }}
            transition={{ duration: 0.1 }}
            ref={dropdownRef}
            style={{ position: "relative" }}
          >
            <button
              type="button"
              className="navbar-icon-btn"
              aria-label="Notifications"
              onClick={handleBellClick}
            >
              <Bell />
              {notificationsEnabled && unreadCount > 0 && (
                <motion.span
                  className="bell-badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </motion.span>
              )}
            </button>
            <AnimatePresence>
              {dropdownOpen && notificationsEnabled && (
                <motion.div
                  className="notif-dropdown"
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <div className="notif-dropdown-header">
                    <span className="notif-dropdown-title">Notifications</span>
                    <div className="notif-dropdown-header-actions">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          className="notif-mark-all-btn"
                          onClick={markAllAsRead}
                          title="Mark all as read"
                        >
                          <CheckCheck size={14} />
                          All read
                        </button>
                      )}
                      <button
                        type="button"
                        className="notif-close-btn"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="notif-dropdown-body">
                    {loading ? (
                      <div className="notif-empty">Loading…</div>
                    ) : preview.length === 0 ? (
                      <div className="notif-empty">
                        <Bell size={28} strokeWidth={1.5} />
                        <p>No notifications yet</p>
                      </div>
                    ) : (
                      preview.map((n) => (
                        <button
                          type="button"
                          key={n.notification_id}
                          className={`notif-item ${!n.is_read ? "unread" : ""}`}
                          onClick={() => {
                            if (!n.is_read) markAsRead(n.notification_id);
                          }}
                        >
                          <span
                            className="notif-type-dot"
                            style={{ background: typeColor(n.sender_type) }}
                          />
                          <div className="notif-item-content">
                            <p className="notif-item-title">{n.title}</p>
                            <span className="notif-item-time">
                              {formatTime(n.sent_at)}
                            </span>
                          </div>
                          {!n.is_read && <span className="notif-unread-dot" />}
                        </button>
                      ))
                    )}
                  </div>

                  <div className="notif-dropdown-footer">
                    <button
                      type="button"
                      className="notif-view-all-btn"
                      onClick={handleGoToAll}
                    >
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </MotionSpan>

          <MotionSpan whileHover={{ y: -1 }} transition={{ duration: 0.1 }}>
            <Link
              to="/contact"
              className="navbar-badge-container"
              aria-label="Info"
            >
              <Info className="navbar-icon-btn" />
              <span className="badge">Support</span>
            </Link>
          </MotionSpan>
        </div>
      </div>
    </MotionNav>
  );
};

export default NavBar;
