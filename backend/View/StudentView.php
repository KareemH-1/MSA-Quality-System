<?php

require_once 'JsonView.php';
require_once '../Controller/StudentController.php';

class StudentView extends JsonView
{
  private StudentController $controller;

  public function __construct()
  {
    $this->controller = new StudentController();
  }

  public function handle(): void
  {
    header('Content-Type: application/json');

    $action = $_GET['action'] ?? '';
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    switch ($action) {

      // ── Appeal Actions ──────────────────────────
      case 'sessions': {
        $result = $this->controller->getSessions();
        break;
      }

      case 'enrolled-courses': {
        $semester = isset($_GET['semester']) && $_GET['semester'] !== ''
          ? (string)$_GET['semester']
          : null;
        $result = $this->controller->getEnrolledCourses($semester);
        break;
      }

      case 'my-appeals': {
        $result = $this->controller->getMyAppeals();
        break;
      }

      case 'my-appeal-rows': {
        $result = $this->controller->getMyAppealRows();
        break;
      }

      case 'submit-appeal': {
        if (strtoupper($method) !== 'POST') {
          $result = [
            'statusCode' => 405,
            'body' => ['status' => 'error', 'message' => 'Method not allowed'],
          ];
          break;
        }
        $data = $this->readJsonBody();
        $result = $this->controller->submit($data);
        break;
      }

      // ── Survey Actions ──────────────────────────
      case 'all-surveys': {
        $result = $this->controller->getAllSurveys();
        break;
      }

      case 'my-surveys': {
        $result = $this->controller->getMySurveys();
        break;
      }

      case 'student-responses': {
        $result = $this->controller->getStudentResponses();
        break;
      }

      case 'survey-questions': {
        $surveyId = isset($_GET['surveyId']) ? (int)$_GET['surveyId'] : 0;
        $courseId = isset($_GET['courseId']) ? (int)$_GET['courseId'] : 0;

        if (!$surveyId || !$courseId) {
          $result = [
            'statusCode' => 400,
            'body' => ['status' => 'error', 'message' => 'Missing surveyId or courseId'],
          ];
          break;
        }

        $result = $this->controller->getSurveyQuestions($surveyId, $courseId);
        break;
      }

      case 'submit-survey': {
        if (strtoupper($method) !== 'POST') {
          $result = [
            'statusCode' => 405,
            'body' => ['status' => 'error', 'message' => 'Method not allowed'],
          ];
          break;
        }
        $data = $this->readJsonBody();
        $result = $this->controller->submitSurvey($data);
        break;
      }

      // ── Default ─────────────────────────────────
      default: {
        $result = [
          'statusCode' => 400,
          'body' => [
            'status' => 'error',
            'message' => 'Unknown action',
            'allowed' => [
              'sessions', 'enrolled-courses', 'my-appeals',
              'my-appeal-rows', 'submit-appeal', 'all-surveys',
              'my-surveys', 'student-responses',
              'survey-questions', 'submit-survey',
            ],
          ],
        ];
        break;
      }
    }

    $this->respond($result['statusCode'], $result['body']);
  }
}

$view = new StudentView();
$view->handle();