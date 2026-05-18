<?php

session_start();

require_once 'JsonView.php';
require_once '../Controller/LogsViewController.php';
require_once '../Service/Log.php';

class LogsView extends JsonView
{
  private LogsViewController $controller;
  private $log;

  public function __construct()
  {
    $this->controller = new LogsViewController();
    $this->log = new Log();
  }

  public function handle(): void
  {
    header('Content-Type: application/json');

    if (!isset($_SESSION['user_id'])) {
      http_response_code(401);
      echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
      exit;
    }

    $role = $_SESSION['role'] ?? '';
    if (strtolower($role) !== 'admin') {
      $this->log->logSecurity("Unauthorized logs access attempt by user: {$_SESSION['email']} with role: {$role}");
      http_response_code(403);
      echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
      exit;
    }

    $action = $_GET['action'] ?? '';
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    
    $result = $this->controller->getData();
    $this->respond($result['statusCode'], $result['body']);
  }
}

$view = new LogsView();
$view->handle();
