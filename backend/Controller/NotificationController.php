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


  private function requireStudent(): ?array
  {
    $this->startSession();

    if (empty($_SESSION['user_id']) || empty($_SESSION['role'])) {
        return [
            'statusCode' => 401,
            'body' => [
                'status' => 'error',
                'message' => 'Not authenticated',
            ],
        ];
    }

    if ($_SESSION['role'] !== 'Student') {
        return [
            'statusCode' => 403,
            'body' => [
                'status' => 'error',
                'message' => 'Forbidden',
            ],
        ];
    }

    return null;
  }

  private function getStudentId(): int
  {
    return (int)$_SESSION['user_id'];
  }

  public function getNotifications(): array
  {
    if($err = $this->requireStudent()) return $err;

    return [
      'statusCode' => 200,
      'body' => [
        'status' => 'success',
        'notifications' => $this->notificationModel->getStudentNotifications($this->getStudentId()),
      ],
    ];
  }

  public function getUnreadCount(): array
  {
    if($err = $this->requireStudent()) return $err;

    return [
      'statusCode' => 200,
      'body' => [
        'status' => 'success',
        'unreadCount' => $this->notificationModel->getUnreadCountForStudent($this->getStudentId()),
      ],
    ];
  }
}