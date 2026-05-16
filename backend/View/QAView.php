<?php

require_once 'JsonView.php';
require_once __DIR__ . '/../Controller/QAController.php';

class QAView extends JsonView
{
  private QAController $controller;

  public function __construct()
  {
    $this->controller = new QAController();
  }

  public function handle(): void
  {
    header('Content-Type: application/json');

    $action = $_GET['action'] ?? '';
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    switch ($action) {
      case 'dashboard': {
        $result = $this->controller->getDashboardData();
        break;
      }

      case 'capacity': {
        if (strtoupper($method) !== 'POST') {
          $result = [
            'statusCode' => 405,
            'body' => ['status' => 'error', 'message' => 'Method not allowed'],
          ];
          break;
        }
        $data = $this->readJsonBody();
        $result = $this->controller->getCapacity($data);
        break;
      }

      case 'appeals': {
        $data = strtoupper($method) === 'POST' ? $this->readJsonBody() : $_GET;
        $result = $this->controller->getAppeals($data);
        break;
      }

      case 'session-appeals': {
        $data = strtoupper($method) === 'POST' ? $this->readJsonBody() : $_GET;
        $result = $this->controller->getSessionAppeals($data);
        break;
      }

      case 'import': {
        if (strtoupper($method) !== 'POST') {
          $result = [
            'statusCode' => 405,
            'body' => ['status' => 'error', 'message' => 'Method not allowed'],
          ];
          break;
        }
        $data = $this->readJsonBody();
        $result = $this->controller->importData($data);
        break;
      }

      case 'overview': {
        $result = $this->controller->getOverviewData();
        break;
      }

      case 'surveys': {
        if (strtoupper($method) !== 'GET') {
          $result = [
            'statusCode' => 405,
            'body' => ['status' => 'error', 'message' => 'Method not allowed'],
          ];
          break;
        }

        $result = $this->controller->getAllSurveys();
        break;
      }

      case 'survey': {
        if (strtoupper($method) !== 'GET') {
          $result = [
            'statusCode' => 405,
            'body' => ['status' => 'error', 'message' => 'Method not allowed'],
          ];
          break;
        }

        $result = $this->controller->getSurveyById($_GET);
        break;
      }

      case 'create-survey': {
        if (strtoupper($method) !== 'POST') {
          $result = [
            'statusCode' => 405,
            'body' => ['status' => 'error', 'message' => 'Method not allowed'],
          ];
          break;
        }

        $data = $this->readJsonBody();
        $result = $this->controller->createSurvey($data);
        break;
      }

      case 'update-survey': {
        if (strtoupper($method) !== 'PUT' && strtoupper($method) !== 'POST') {
          $result = [
            'statusCode' => 405,
            'body' => ['status' => 'error', 'message' => 'Method not allowed'],
          ];
          break;
        }

        $data = $this->readJsonBody();
        $result = $this->controller->updateSurvey($data);
        break;
      }

      case 'delete-survey': {
        if (strtoupper($method) !== 'DELETE' && strtoupper($method) !== 'POST') {
          $result = [
            'statusCode' => 405,
            'body' => ['status' => 'error', 'message' => 'Method not allowed'],
          ];
          break;
        }

        $data = $this->readJsonBody();
        $result = $this->controller->deleteSurvey($data);
        break;
      }

      default: {
        $result = [
          'statusCode' => 400,
          'body' => [
            'status' => 'error',
            'message' => 'Unknown action',
            'allowed' => [
              'dashboard',
              'capacity',
              'appeals',
              'session-appeals',
              'import',
              'overview',
              'surveys',
              'survey',
              'create-survey',
              'update-survey',
              'delete-survey'
            ],
          ],
        ];
        break;
      }
    }

    $this->respond($result['statusCode'], $result['body']);
  }
}

$view = new QAView();
$view->handle();

?>
