<?php

declare(strict_types=1);

require_once __DIR__ . '/NotificationObserver.php';
require_once __DIR__ . '/../Model/Notification.php';

class InAppNotificationObserver implements NotificationObserver
{
  private Notification $notificationModel;

  public function __construct(mysqli $db)
  {
    $this->notificationModel = new Notification($db);
  }

  public function update(string $event, array $data): void
  {
    $this->notificationModel->insert(
      $data['title'],
      $data['receiver_id'],
      $data['sender_type'] ?? 'system',
      $data['sender_id'] ?? null,
      $data['notify_by_email'] ?? false
    );
  }
}