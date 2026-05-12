<?php

declare(strict_types=1);

require_once __DIR__ . '/../Model/Database.php';
require_once __DIR__ . '/../Model/QA.php';

class QAController
{
  private QA $qaModel;

  public function __construct()
  {
    $database = new Database();
    $db = $database->getConnection();
    $this->qaModel = new QA($db);
  }

  private function startSession(): void
  {
    if (session_status() === PHP_SESSION_NONE) {
      session_start();
    }
  }

  private function requireQA(): ?array
  {
    $this->startSession();

    if (empty($_SESSION['user_id']) || empty($_SESSION['role'])) {
      return [
        'statusCode' => 401,
        'body' => ['status' => 'error', 'message' => 'Not authenticated'],
      ];
    }

    $role = (string)($_SESSION['role'] ?? '');
    $normalizedRole = strtolower(trim($role));

    if (
      $normalizedRole !== 'qa' && 
      $normalizedRole !== 'qa_admin' && 
      strpos($normalizedRole, 'qa') === false
    ) {
      return [
        'statusCode' => 403,
        'body' => ['status' => 'error', 'message' => 'Forbidden'],
      ];
    }

    return null;
  }

  public function getDashboardData(): array
  {
    if ($err = $this->requireQA()) {
      return $err;
    }

    try {
      $courses = $this->qaModel->getAllCourses();
      $faculties = $this->qaModel->getAllFaculties();
      $stats = $this->qaModel->getAggregateStats();
      $appealRecords = $this->qaModel->getSessionHistory();
      $sessionWindows = $this->qaModel->getSessionWindows();

      return [
        'statusCode' => 200,
        'body' => [
          'status' => 'success',
          'courses' => $courses,
          'faculties' => $faculties,
          'stats' => $stats,
          'appealRecords' => $appealRecords,
          'sessionWindows' => $sessionWindows,
        ],
      ];
    } catch (Exception $e) {
      return [
        'statusCode' => 500,
        'body' => ['status' => 'error', 'message' => 'Server error'],
      ];
    }
  }


  public function getCapacity(array $data): array
  {
    if ($err = $this->requireQA()) {
      return $err;
    }

    try {
      $activeLevels = isset($data['activeLevels']) && is_array($data['activeLevels'])
        ? array_map('intval', $data['activeLevels'])
        : [];

      $exemptFaculties = isset($data['exemptFaculties']) && is_array($data['exemptFaculties'])
        ? array_map('intval', $data['exemptFaculties'])
        : [];

      $exemptCourses = isset($data['exemptCourses']) && is_array($data['exemptCourses'])
        ? array_map('intval', $data['exemptCourses'])
        : [];

      $maxAppeals = isset($data['maxAppeals']) ? (int)$data['maxAppeals'] : 1;

      $capacity = $this->qaModel->getCapacityInfo($activeLevels, $exemptFaculties, $exemptCourses, $maxAppeals);

      return [
        'statusCode' => 200,
        'body' => [
          'status' => 'success',
          'capacity' => $capacity,
        ],
      ];
    } catch (Exception $e) {
      return [
        'statusCode' => 500,
        'body' => ['status' => 'error', 'message' => 'Server error'],
      ];
    }
  }

  public function getAppeals(array $data): array
  {
    if ($err = $this->requireQA()) {
      return $err;
    }

    try {
      $courseId = isset($data['course_id']) ? (int)$data['course_id'] : null;
      $facultyId = isset($data['faculty_id']) ? (int)$data['faculty_id'] : null;
      $levelId = isset($data['level_id']) ? (int)$data['level_id'] : null;
      $status = isset($data['status']) ? (string)$data['status'] : null;
      $search = isset($data['search']) ? (string)$data['search'] : null;
      $limit = isset($data['limit']) ? (int)$data['limit'] : 1000;
      $offset = isset($data['offset']) ? (int)$data['offset'] : 0;

      $appeals = $this->qaModel->getAppealsByFilters(
        $courseId,
        $facultyId,
        $levelId,
        $status,
        $search,
        $limit,
        $offset
      );

      return [
        'statusCode' => 200,
        'body' => [
          'status' => 'success',
          'appeals' => $appeals,
          'count' => count($appeals),
        ],
      ];
    } catch (Exception $e) {
      return [
        'statusCode' => 500,
        'body' => ['status' => 'error', 'message' => 'Server error'],
      ];
    }
  }


  public function getSessionAppeals(array $data): array
  {
    if ($err = $this->requireQA()) {
      return $err;
    }

    if (!isset($data['session_id'])) {
      return [
        'statusCode' => 400,
        'body' => ['status' => 'error', 'message' => 'Missing session_id'],
      ];
    }

    try {
      $sessionId = (int)$data['session_id'];
      $appeals = $this->qaModel->getSessionAppeals($sessionId);

      if (empty($appeals)) {
        return [
          'statusCode' => 200,
          'body' => [
            'status' => 'success',
            'message' => 'No appeals to preview',
            'appeals' => [],
            'count' => 0,
          ],
        ];
      }

      return [
        'statusCode' => 200,
        'body' => [
          'status' => 'success',
          'appeals' => $appeals,
          'count' => count($appeals),
        ],
      ];
    } catch (Exception $e) {
      return [
        'statusCode' => 500,
        'body' => ['status' => 'error', 'message' => 'Server error'],
      ];
    }
  }


  public function importData(array $data): array
  {
    if ($err = $this->requireQA()) {
      return $err;
    }

    if (!isset($data['records']) || !is_array($data['records'])) {
      return [
        'statusCode' => 400,
        'body' => ['status' => 'error', 'message' => 'Missing records array'],
      ];
    }

    try {
      $result = $this->qaModel->importAppealData($data['records']);

      return [
        'statusCode' => 200,
        'body' => [
          'status' => 'success',
          'imported' => $result['imported'],
          'total' => $result['total'],
          'errors' => $result['errors'],
          'message' => $result['imported'] . ' of ' . $result['total'] . ' records imported',
        ],
      ];
    } catch (Exception $e) {
      return [
        'statusCode' => 500,
        'body' => ['status' => 'error', 'message' => 'Server error'],
      ];
    }
  }

  public function getOverviewData(): array
  {
    if ($err = $this->requireQA()) {
      return $err;
    }

    try {
      $data = $this->qaModel->getOverviewData();

      return [
        'statusCode' => 200,
        'body' => [
          'status' => 'success',
          'data' => $data,
        ],
      ];
    } catch (Exception $e) {
      return [
        'statusCode' => 500,
        'body' => ['status' => 'error', 'message' => 'Server error'],
      ];
    }
  }
}

?>
