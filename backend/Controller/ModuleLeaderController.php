<?php

require_once __DIR__ . '/../Model/Database.php';
require_once __DIR__ . '/../Model/ModuleLeader.php';

class ModuleLeaderController
{
  private ModuleLeader $moduleLeaderModel;

  public function __construct()
  {
    $database = new Database();
    $db = $database->getConnection();
    $this->moduleLeaderModel = new ModuleLeader($db);
  }

  private function startSession()
  {
    if (session_status() === PHP_SESSION_NONE) {
      session_start();
    }
  }

  private function requireModuleLeader(): ?array
  {
    $this->startSession();

    if (empty($_SESSION['user_id']) || empty($_SESSION['role'])) {
      return [
        'statusCode' => 401,
        'body' => [
          'status' => 'error',
          'message' => 'Not authenticated',
        ]
      ];
    }

    if ($_SESSION['role'] !== 'Module_Leader') {
      return [
        'statusCode' => 403,
        'body' => [
          'status' => 'error',
          'message' => 'Forbidden',
        ]
      ];
    }

    return null;
  }

  public function getAppeals(): array
  {
    if ($err = $this->requireModuleLeader()) return $err;

    $moduleLeaderId = (int)$_SESSION['user_id'];
    $appeals = $this->moduleLeaderModel->getAppealsByCourses($moduleLeaderId);

    return [
      'statusCode' => 200,
      'body' => [
        'status' => 'success',
        'data' => $appeals
      ]
    ];
  }

  public function getCourseInstructors(): array
  {
    if ($err = $this->requireModuleLeader()) return $err;

    $courseId = isset($_GET['course_id']) ? (int)$_GET['course_id'] : null;
    if (!$courseId) {
      return [
        'statusCode' => 400,
        'body' => [
          'status' => 'error',
          'message' => 'course_id parameter is required'
        ]
      ];
    }

    $instructors = $this->moduleLeaderModel->getCourseInstructors($courseId);

    return [
      'statusCode' => 200,
      'body' => [
        'status' => 'success',
        'data' => $instructors
      ]
    ];
  }

  public function assignAppeal(array $data): array
  {
    if ($err = $this->requireModuleLeader()) return $err;

    $appealId = isset($data['appeal_id']) ? (int)$data['appeal_id'] : null;
    $instructorId = isset($data['instructor_id']) ? (int)$data['instructor_id'] : null;
    $moduleLeaderId = (int)$_SESSION['user_id'];

    if (!$appealId || !$instructorId || !$moduleLeaderId) {
      return [
        'statusCode' => 400,
        'body' => [
          'status' => 'error',
          'message' => 'appeal_id and instructor_id are required'
        ]
      ];
    }

    $success = $this->moduleLeaderModel->assignAppeal($appealId, $instructorId, $moduleLeaderId);

    if ($success) {
      return [
        'statusCode' => 200,
        'body' => [
          'status' => 'success',
          'message' => 'Appeal assigned successfully'
        ]
      ];
    }

    return [
      'statusCode' => 500,
      'body' => [
        'status' => 'error',
        'message' => 'Failed to assign appeal'
      ]
    ];
  }

  public function reviewAppeal(array $data): array
  {
    if ($err = $this->requireModuleLeader()) return $err;

    if (empty($data['appeal_id']) || empty($data['status'])) {
      return [
        'statusCode' => 400,
        'body' => [
          'status' => 'error',
          'message' => 'appeal_id and status are required',
        ]
      ];
    }

    $allowedStatuses = ['Resolved', 'Rejected'];
    if (!in_array($data['status'], $allowedStatuses, true)) {
      return [
        'statusCode' => 400,
        'body' => [
          'status' => 'error',
          'message' => 'Invalid status',
        ]
      ];
    }

    $moduleLeaderId = (int)$_SESSION['user_id'];
    $appealId = (int)$data['appeal_id'];
    $newStatus = (string)$data['status'];
    $newGrade = $data['new_grade'] ?? null;
    $note = $data['note'] ?? null;

    $ok = $this->moduleLeaderModel->reviewAppealAsModuleLeader(
      $appealId,
      $moduleLeaderId,
      $newStatus,
      $newGrade,
      $note
    );

    if (!$ok) {
      return [
        'statusCode' => 500,
        'body' => [
          'status' => 'error',
          'message' => 'Failed to review appeal',
        ]
      ];
    }

    return [
      'statusCode' => 200,
      'body' => [
        'status' => 'success',
        'message' => 'Appeal reviewed successfully',
      ]
    ];
  }
}