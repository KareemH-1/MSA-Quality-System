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

  public function markAsRead(int $notificationId, int $studentId): bool
  {
    $sql = "UPDATE notifications SET is_read = 1 WHERE notification_id = ? AND receiver_id = ?";
    $stmt = $this->conn->prepare($sql);
    if (!$stmt) return false;

    $stmt->bind_param('ii', $notificationId, $studentId);
    return $stmt->execute();
  }

  public function markAllAsRead(int $studentId): bool
  {
    $sql = "UPDATE notifications SET is_read = 1 WHERE receiver_id = ? AND is_read = 0";
    $stmt = $this->conn->prepare($sql);
    if (!$stmt) return false;

    $stmt->bind_param('i', $studentId);
    return $stmt->execute();
  }

  public function insert(
    string $title,
    int $receiverId,
    string $senderType,   
    ?int $senderId,
    bool $notifyByEmail
    ): bool {
    $sql = "
        INSERT INTO notifications
            (title, sender_id, sender_type, receiver_id, notify_by_email, is_read, sent_at)
        VALUES (?, ?, ?, ?, ?, 0, NOW())
    ";
    $stmt = $this->conn->prepare($sql);
    if (!$stmt) return false;

    $emailFlag = $notifyByEmail ? 1 : 0;
    $stmt->bind_param('sisis', $title, $senderId, $senderType, $receiverId, $emailFlag);
    return $stmt->execute();
  }

  public function getStudentEmail(int $studentId): string
  {
    $sql = "SELECT email FROM users WHERE user_id = ? LIMIT 1";
    $stmt = $this->conn->prepare($sql);
    if (!$stmt) return '';
    
    $stmt->bind_param('i', $studentId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    return $row ? (string)$row['email'] : '';
  }
}