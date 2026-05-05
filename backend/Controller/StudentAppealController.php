<?php

require_once __DIR__ . '/../Model/Database.php';
require_once __DIR__ . '/../Model/StudentAppeal.php';

class StudentAppealController 
{
  private StudentAppeal $appealModel;

  public function __construct()
  {
    $database = new Database();
    $db = $database->getConnection();
    $this->appealModel = new StudentAppeal($db);
  }

  private function startSession()
  {
    if (session_status() === PHP_SESSION_NONE) {
      session_start();
    }
  }

  private function requireStudent(): ?array
  {
    $this->startSession();

    if (empty($_SESSION['user_id']) || empty($_SESSION['role'])) {
        return [
            'statusCode' => 401,
            'body' => [
                'status' => 'error',
                'message' => 'Not authenticated',
            ],
        ];
    }

    if ($_SESSION['role'] !== 'Student') {
        return [
            'statusCode' => 403,
            'body' => [
                'status' => 'error',
                'message' => 'Forbidden',
            ],
        ];
    }

    return null; // OK
  }

  public function getSessions(): array
  {
    $authError = $this->requireStudent();
    if ($authError) return $authError;

    $sessions = $this->appealModel->getActiveAppealSessions();

    return [
      'statusCode' => 200,
      'body' => [
        'status' => 'success',
        'sessions' => $sessions,
      ],
    ];
  }

  public function getEnrolledCourses(?string $semester = null): array
  {
    $authError = $this->requireStudent();
    if ($authError) return $authError;

    $studentId = (int)$_SESSION['user_id'];
    $courses = $this->appealModel->getStudentEnrolledCourses($studentId, $semester);

    return [
      'statusCode' => 200,
      'body' => [
        'status' => 'success',
        'courses' => $courses,
      ],
    ];
  }

  public function getMyAppeals(): array 
  {
    $authError = $this->requireStudent();
    if ($authError) return $authError;

    $studentId = (int)$_SESSION['user_id'];
    $sessions = $this->appealModel->getActiveAppealSessions();

    $appealsData = [];
    foreach($sessions as $session) {
      $appealCount = $this->appealModel->getStudentAppealCountInSession($studentId, (int)$session['session_id']);
      $appealsData[] = [
        'session' => $session,
        'appeal_count' => $appealCount,
      ];
    }

    return [
      'statusCode' => 200,
      'body' => [
        'status' => 'success',
        'appeals' => $appealsData,
      ],
    ];
  }

  public function submit(array $data): array
  {
    if ($authError = $this->requireStudent()) return $authError;

    $required = ['course_id', 'session_id', 'original_grade', 'reason'];
    foreach ($required as $key) {
        if (!isset($data[$key]) || $data[$key] === '') {
            return [
                'statusCode' => 400,
                'body' => [
                    'status' => 'error',
                    'message' => "Missing field: {$key}",
                ],
            ];
        }
    }

    $studentId = (int)$_SESSION['user_id'];
    $courseId = (int)$data['course_id'];
    $sessionId = (int)$data['session_id'];
    $originalGrade = (string)$data['original_grade'];
    $reason = (string)$data['reason'];

    $ok = $this->appealModel->submitAppeal($studentId, $courseId, $sessionId, $originalGrade, $reason);

    if (!$ok) {
        return [
            'statusCode' => 500,
            'body' => [
                'status' => 'error',
                'message' => 'Failed to submit appeal',
            ],
        ];
    }

    return [
        'statusCode' => 200,
        'body' => [
            'status' => 'success',
            'message' => 'Appeal submitted',
        ],
    ];
}

}

