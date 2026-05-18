<?php

require_once 'JsonView.php';
require_once '../Controller/LogsViewController.php';

class LogsView extends JsonView
{
  private LogsViewController $controller;

  public function __construct()
  {
    $this->controller = new LogsViewController();
  }

  public function handle(): void
  {
    header('Content-Type: application/json');

    $action = $_GET['action'] ?? '';
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    
    $result = $this->controller->getData();
    $this->respond($result['statusCode'], $result['body']);
  }
}

$view = new LogsView();
$view->handle();
