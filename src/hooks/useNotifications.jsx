import { useState, useEffect, useCallback, useRef } from "react";
import api from "../api/axios";

export function useNotifications(enabled = true, pollInterval = 30000) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await api.get(
        "/View/NotificationView.php?action=unread-count",
      );
      const count = res.data?.body?.unreadCount ?? res.data?.unreadCount ?? 0;
      setUnreadCount(Number(count));
    } catch (err) {
      console.error("Failed to fetch unread count", err);
    }
  }, [enabled]);

  const fetchNotifications = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const res = await api.get("/View/NotificationView.php?action=list");
      const list =
        res.data?.body?.notifications ?? res.data?.notifications ?? [];

      const actualUnread = list.filter((n) => Number(n.is_read) === 0).length;

      setNotifications(list);
      setUnreadCount(actualUnread);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await api.post("/View/NotificationView.php?action=mark-read", {
        notification_id: notificationId,
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n.notification_id === notificationId ? { ...n, is_read: 1 } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.post("/View/NotificationView.php?action=mark-all-read", {});
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    fetchUnreadCount();

    intervalRef.current = setInterval(() => {
      fetchUnreadCount();
    }, pollInterval);

    return () => clearInterval(intervalRef.current);
  }, [enabled, fetchUnreadCount, pollInterval]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
