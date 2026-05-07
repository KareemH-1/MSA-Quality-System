<?php

declare(strict_types=1);

require_once 'JsonView.php';
require_once '../Controller/NotificationController.php';

class NotificationView extends JsonView
{
  private NotificationController $notificationController;

  public function __construct()
  {
    $this->notificationController = new NotificationController();
  }

  public function handle(): void
  {
    header('Content-Type: application/json');

    $action = $_GET['action'] ?? '';
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($action) {
      case 'list': {
        $result = $this->notificationController->getNotifications();
        break;
      }
      case 'unread-count': {
        $result = $this->notificationController->getUnreadCount();
        break;
      }
    }

    $this->respond($result['statusCode'], $result['body']);
  }
}

$view = new NotificationView();
$view->handle();