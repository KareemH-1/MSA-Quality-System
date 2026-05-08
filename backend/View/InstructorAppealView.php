<?php

require_once 'JsonView.php';
require_once '../Controller/InstructorAppealController.php';

class InstructorAppealView extends JsonView
{
  private InstructorAppealController $controller;

  public function __construct()
  {
    $this->controller = new InstructorAppealController();
  }

  public function handle(): void
  {
    header('Content-Type: application/json');

    $action = $_GET['action'] ?? '';
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    switch($action){
      case 'assigned-appeals': {
        $result = $this->controller->getAssignedAppeals();
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
            'allowed' => ['assigned-appeals', 'review'],
          ],
        ];
        break;
      }
    }
    $this->respond($result['statusCode'], $result['body']);
  }
}

$view = new InstructorAppealView();
$view->handle();
