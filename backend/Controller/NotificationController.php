<?php

declare(strict_types=1);

require_once '../Model/Database.php';
require_once '../Model/Notification.php';

class NotificationController
{
  private Notification $notificationModel;

  public function __construct()
  {
    $database = new Database();
    $db = $database->getConnection();
    $this->notificationModel = new Notification($db);
  }

  private function startSession()
  {
    if (session_status() === PHP_SESSION_NONE) {
      session_start();
    }
  }

private function requireAuth(): ?array
{
    $this->startSession();

    if (empty($_SESSION['user_id']) || empty($_SESSION['role'])) {
        return [
            'statusCode' => 401,
            'body' => ['status' => 'error', 'message' => 'Not authenticated'],
        ];
    }

    return null; 
}

  private function getUserId(): int
  {
    return (int)$_SESSION['user_id'];
  }

  public function getNotifications(): array
  {
    if($err = $this->requireAuth()) return $err;

    return [
      'statusCode' => 200,
      'body' => [
        'status' => 'success',
        'notifications' => $this->notificationModel->getNotifications($this->getUserId()),
      ],
    ];
  }

  public function getUnreadCount(): array
  {
    if($err = $this->requireAuth()) return $err;

    return [
      'statusCode' => 200,
      'body' => [
        'status' => 'success',
        'unreadCount' => $this->notificationModel->getUnreadCount($this->getUserId()),
      ],
    ];
  }

  public function markAsRead(int $notificationId): array
  {
    if ($err = $this->requireAuth()) return $err;
    $ok = $this->notificationModel->markAsRead($notificationId, $this->getUserId());

    return [
        'statusCode' => $ok ? 200 : 500,
        'body' => ['status' => $ok ? 'success' : 'error'],
    ];
  }

  public function markAllAsRead(): array
  {
    if ($err = $this->requireAuth()) return $err;
    $ok = $this->notificationModel->markAllAsRead($this->getUserId());

    return [
        'statusCode' => $ok ? 200 : 500,
        'body' => ['status' => $ok ? 'success' : 'error'],
    ];
  }
}