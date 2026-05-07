<?php
require_once 'JsonView.php';
require_once '../Controller/NotificationController.php';

class NotificationView extends JsonView
{
  private NotificationController $controller;

  public function __construct()
  {
      $this->controller = new NotificationController();
  }

  public function handle(): void
  {
    header('Content-Type: application/json');
    $action = $_GET['action'] ?? '';
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($action) {

      case 'list':
        $result = $this->controller->getNotifications();
        break;

      case 'unread-count':
        $result = $this->controller->getUnreadCount();
        break;

      case 'mark-read':
        if ($method !== 'POST') {
            $result = ['statusCode' => 405, 'body' => ['status' => 'error', 'message' => 'POST required']];
            break;
        }
        $data = $this->readJsonBody();
        $id = isset($data['notification_id']) ? (int)$data['notification_id'] : 0;
        $result = $this->controller->markAsRead($id);
        break;

      case 'mark-all-read':
        if ($method !== 'POST') {
            $result = ['statusCode' => 405, 'body' => ['status' => 'error', 'message' => 'POST required']];
            break;
        }
        $result = $this->controller->markAllAsRead();
        break;

      default:
        $result = [
            'statusCode' => 400,
            'body' => [
                'status'  => 'error',
                'message' => 'Unknown action',
                'allowed' => ['list', 'unread-count', 'mark-read', 'mark-all-read'],
            ],
        ];
    }

    $this->respond($result['statusCode'], $result['body']);
  }
}

$view = new NotificationView();
$view->handle();