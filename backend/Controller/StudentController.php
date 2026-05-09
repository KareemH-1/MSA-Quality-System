<?php

require_once __DIR__ . '/../Model/Database.php';
require_once __DIR__ . '/../Model/Student.php';

class StudentController
{
  private Student $studentModel;

  public function __construct()
  {
    $database = new Database();
    $db = $database->getConnection();
    $this->studentModel = new Student($db);
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
        'body' => ['status' => 'error', 'message' => 'Not authenticated'],
      ];
    }

    if ($_SESSION['role'] !== 'Student') {
      return [
        'statusCode' => 403,
        'body' => ['status' => 'error', 'message' => 'Forbidden'],
      ];
    }

    return null;
  }


  public function getSessions(): array
  {
    if ($err = $this->requireStudent()) return $err;

    $sessions = $this->studentModel->getActiveAppealSessions();
    return [
      'statusCode' => 200,
      'body' => ['status' => 'success', 'sessions' => $sessions],
    ];
  }

  public function getEnrolledCourses(?string $semester = null): array
  {
    if ($err = $this->requireStudent()) return $err;

    $studentId = (int)$_SESSION['user_id'];
    $courses = $this->studentModel->getStudentEnrolledCourses($studentId, $semester);
    return [
      'statusCode' => 200,
      'body' => ['status' => 'success', 'courses' => $courses],
    ];
  }

  public function getMyAppeals(): array
  {
    if ($err = $this->requireStudent()) return $err;

    $studentId = (int)$_SESSION['user_id'];
    $sessions = $this->studentModel->getActiveAppealSessions();

    $appealsData = [];
    foreach ($sessions as $session) {
      $appealCount = $this->studentModel->getStudentAppealCountInSession(
        $studentId,
        (int)$session['session_id']
      );
      $appealsData[] = [
        'session' => $session,
        'appeal_count' => $appealCount,
      ];
    }

    return [
      'statusCode' => 200,
      'body' => ['status' => 'success', 'appeals' => $appealsData],
    ];
  }

  public function getMyAppealRows(): array
  {
    if ($err = $this->requireStudent()) return $err;

    $studentId = (int)$_SESSION['user_id'];
    $appeals = $this->studentModel->getStudentAppeals($studentId);
    return [
      'statusCode' => 200,
      'body' => ['status' => 'success', 'appeals' => $appeals],
    ];
  }

  public function submit(array $data): array
  {
    if ($err = $this->requireStudent()) return $err;

    $required = ['course_id', 'session_id', 'original_grade', 'reason'];
    foreach ($required as $key) {
      if (!isset($data[$key]) || $data[$key] === '') {
        return [
          'statusCode' => 400,
          'body' => ['status' => 'error', 'message' => "Missing field: {$key}"],
        ];
      }
    }

    $studentId    = (int)$_SESSION['user_id'];
    $courseId     = (int)$data['course_id'];
    $sessionId    = (int)$data['session_id'];
    $originalGrade = (string)$data['original_grade'];
    $reason       = (string)$data['reason'];

    $ok = $this->studentModel->submitAppeal(
      $studentId, $courseId, $sessionId, $originalGrade, $reason
    );

    if (!$ok) {
      return [
        'statusCode' => 500,
        'body' => ['status' => 'error', 'message' => 'Failed to submit appeal'],
      ];
    }

    return [
      'statusCode' => 200,
      'body' => ['status' => 'success', 'message' => 'Appeal submitted'],
    ];
  }


  public function getAllSurveys(): array
  {
    if ($err = $this->requireStudent()) return $err;

    $surveys = $this->studentModel->getAllSurveys();
    return [
      'statusCode' => 200,
      'body' => ['status' => 'success', 'surveys' => $surveys],
    ];
  }

  public function getMySurveys(): array
  {
    if ($err = $this->requireStudent()) return $err;

    $studentId = (int)$_SESSION['user_id'];
    $surveys = $this->studentModel->getStudentSurveys($studentId);

    foreach ($surveys as &$survey) {
      $survey['is_submitted'] = $survey['status'] === 'completed';
    }

    return [
      'statusCode' => 200,
      'body' => ['status' => 'success', 'surveys' => $surveys],
    ];
  }

  public function getStudentResponses(): array
  {
    if ($err = $this->requireStudent()) return $err;

    $studentId = (int)$_SESSION['user_id'];
    $responses = $this->studentModel->getStudentResponses($studentId);
    return [
      'statusCode' => 200,
      'body' => ['status' => 'success', 'responses' => $responses],
    ];
  }

  public function getSurveyQuestions(int $surveyId, int $courseId): array
  {
    if ($err = $this->requireStudent()) return $err;

    $studentId = (int)$_SESSION['user_id'];

    if ($this->studentModel->hasStudentCompletedSurvey($studentId, $surveyId, $courseId)) {
      return [
        'statusCode' => 400,
        'body' => ['status' => 'error', 'message' => 'Survey already completed'],
      ];
    }

    if (!$this->studentModel->isSurveyOpen($surveyId)) {
      return [
        'statusCode' => 400,
        'body' => ['status' => 'error', 'message' => 'Survey is not open'],
      ];
    }

    $sections = $this->studentModel->getSurveyQuestions($surveyId, $courseId);
    return [
      'statusCode' => 200,
      'body' => ['status' => 'success', 'sections' => $sections],
    ];
  }

  public function submitSurvey(array $data): array
  {
    if ($err = $this->requireStudent()) return $err;

    foreach (['survey_id', 'course_id', 'answers'] as $key) {
      if (!isset($data[$key]) || $data[$key] === '') {
        return [
          'statusCode' => 400,
          'body' => ['status' => 'error', 'message' => "Missing field: {$key}"],
        ];
      }
    }

    $studentId = (int)$_SESSION['user_id'];
    $surveyId  = (int)$data['survey_id'];
    $courseId  = (int)$data['course_id'];
    $answers   = $data['answers'];

    if (empty($answers) || !is_array($answers)) {
      return [
        'statusCode' => 400,
        'body' => ['status' => 'error', 'message' => 'Answers must be a non-empty array'],
      ];
    }

    if ($this->studentModel->hasStudentCompletedSurvey($studentId, $surveyId, $courseId)) {
      return [
        'statusCode' => 400,
        'body' => ['status' => 'error', 'message' => 'Survey already completed'],
      ];
    }

    if (!$this->studentModel->isSurveyOpen($surveyId)) {
      return [
        'statusCode' => 400,
        'body' => ['status' => 'error', 'message' => 'Survey is not open'],
      ];
    }

    if (!$this->studentModel->isCourseLinkedToSurvey($surveyId, $courseId)) {
      return [
        'statusCode' => 403,
        'body' => ['status' => 'error', 'message' => 'This survey is not available for this course.'],
      ];
    }

    $questions   = $this->studentModel->getSurveyQuestions($surveyId, $courseId);
    $answeredIds = array_column($answers, 'question_id');

    foreach ($questions as $section) {
      foreach ($section['questions'] as $q) {
        if ($q['is_required'] && !in_array($q['question_id'], array_map('intval', $answeredIds))) {
          return [
            'statusCode' => 400,
            'body' => [
              'status' => 'error',
              'message' => "All questions must be answered. Missing question ID: {$q['question_id']}",
            ],
          ];
        }
      }
    }

    $ok = $this->studentModel->submitSurvey($studentId, $surveyId, $courseId, $answers);

    if (!$ok) {
      return [
        'statusCode' => 500,
        'body' => ['status' => 'error', 'message' => 'Failed to submit survey'],
      ];
    }

    return [
      'statusCode' => 200,
      'body' => ['status' => 'success', 'message' => 'Survey submitted successfully'],
    ];
  }
}