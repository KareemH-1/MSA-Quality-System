<?php

require_once 'JsonView.php';
require_once '../Controller/ModuleLeaderController.php';

class ModuleLeaderView extends JsonView
{
  private ModuleLeaderController $controller;

  public function __construct()
  {
    $this->controller = new ModuleLeaderController();
  }

  public function handle(): void
  {
    header('Content-Type: application/json');

    $action = $_GET['action'] ?? '';
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    switch ($action) {
      case 'appeals': {
        $result = $this->controller->getAppeals();
        break;
      }

      case 'course-instructors': {
        $result = $this->controller->getCourseInstructors();
        break;
      }

      case 'assign': {
        if ($method !== 'POST') {
          $result = [
            'statusCode' => 405,
            'body' => ['status' => 'error', 'message' => 'Method not allowed'],
          ];
          break;
        }

        $data = $this->readJsonBody();
        $result = $this->controller->assignAppeal($data);
        break;
      }

      case 'review': {
        if ($method !== 'POST') {
          $result = [
            'statusCode' => 405,
            'body' => ['status' => 'error', 'message' => 'Method not allowed'],
          ];
          break;
        }

        $data = $this->readJsonBody();
        $result = $this->controller->reviewAppeal($data);
        break;
      }

      default: {
        $result = [
          'statusCode' => 400,
          'body' => [
            'status' => 'error',
            'message' => 'Unknown action',
            'allowed' => ['appeals', 'course-instructors', 'assign', 'review'],
          ],
        ];
        break;
      }
    }

    $this->respond($result['statusCode'], $result['body']);
  }
}

$view = new ModuleLeaderView();
$view->handle();