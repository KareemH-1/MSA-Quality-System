<?php

declare(strict_types=1);

class Notification
{
  private mysqli $conn;

  public function __construct(mysqli $db)
  {
    $this->conn = $db;
  }

  public function getStudentNotifications(int $studentId): array
  {
    $sql = "
        SELECT notification_id, title, sender_type, is_read, notify_by_email, sent_at
        FROM notifications
        WHERE receiver_id = ?
        ORDER BY sent_at DESC
        LIMIT 50
    ";

    $stmt = $this->conn->prepare($sql);
    if (!$stmt) return [];

    $stmt->bind_param("i", $studentId);
    $stmt->execute();
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
  }

  public function getUnreadCount(int $studentId): int
  {
    $sql = "SELECT COUNT(*) AS cnt FROM notifications WHERE receiver_id = ? AND is_read = 0";

    $stmt = $this->conn->prepare($sql);
    if (!$stmt) return 0;

    $stmt->bind_param("i", $studentId);
    $stmt->execute();
    return (int)$stmt->get_result()->fetch_assoc()['cnt'];
  }
}