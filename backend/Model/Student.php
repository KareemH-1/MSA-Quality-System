<?php

declare(strict_types=1);

class Student
{
  private mysqli $conn;
  private string $table = 'grade_appeals';

  public function __construct(mysqli $db)
  {
    $this->conn = $db;
  }

  private function loadSurveyStrategyFiles(): void
  {
    $base = __DIR__ . '/SurveyStrategies';
    require_once $base . '/SurveyStrategyInterface.php';
    require_once $base . '/SurveyStrategyFactory.php';
  }

  public function getActiveAppealSessions(): array
  {
    $sql = "SELECT * FROM appeal_sessions WHERE status='Open' and start_date <= NOW() and end_date >= Now()";
      $stmt = $this->conn->prepare($sql);

      if(!$stmt) return [];

      $stmt->execute();
      return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
  }

  public function getStudentEnrolledCourses(int $studentId, ?string $semester = null): array
  {
      $sql = "SELECT c.course_id, c.code, c.name, f.name as faculty, c.semester, GROUP_CONCAT(u.name) as instructors FROM course_students cs JOIN courses c ON cs.course_id = c.course_id JOIN faculties f ON c.faculty_id = f.faculty_id LEFT JOIN course_instructors ci ON c.course_id = ci.course_id LEFT JOIN users u ON ci.instructor_id = u.user_id WHERE cs.student_id = ?";
      if($semester) {
        $sql .= " AND c.semester = ?";
      }

      $sql .= " GROUP BY c.course_id";

      $stmt = $this->conn->prepare($sql);
      if(!$stmt) return [];

      if($semester){
        $stmt->bind_param("is", $studentId, $semester);
      }
      else {
        $stmt->bind_param("i", $studentId);
      }

      $stmt->execute();
      return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
  }

  public function getStudentAppealCountInSession(int $studentId, int $sessionId): int
  {
      $sql = "SELECT COUNT(*) as appeal_count FROM " . $this->table . " WHERE student_id = ? AND session_id = ?";
      $stmt = $this->conn->prepare($sql);
      if(!$stmt) return 0;

      $stmt->bind_param("ii", $studentId, $sessionId);
      $stmt->execute();
      $result = $stmt->get_result()->fetch_assoc();
      return (int)$result['appeal_count'];
  }

  public function submitAppeal(
      int $studentId,
      int $courseId,
      int $sessionId,
      string $originalGrade,
      string $reason
  ): bool {
      $sql = "INSERT INTO " . $this->table . " (student_id, course_id, session_id, original_grade, reason) VALUES (?, ?, ?, ?, ?)";
      $stmt = $this->conn->prepare($sql);

      if (!$stmt) return false;

      $stmt->bind_param("iiiss", $studentId, $courseId, $sessionId, $originalGrade, $reason);
      return $stmt->execute();
  }

  public function getStudentAppeals(int $studentId): array
  {
    $sql = "SELECT a.appeal_id, a.course_id, c.code as course_code, c.name as course_name, f.name as faculty_name, a.session_id, s.type as session_type, a.original_grade, a.new_grade, a.reason, a.note, a.status, a.submitted_at, a.resolved_at, u.name as instructor_name FROM " . $this->table . " a JOIN courses c ON a.course_id = c.course_id JOIN faculties f ON c.faculty_id = f.faculty_id JOIN appeal_sessions s ON a.session_id = s.session_id LEFT JOIN users u ON a.assigned_instructor_id = u.user_id WHERE a.student_id = ? ORDER BY a.submitted_at DESC";
    $stmt = $this->conn->prepare($sql);

    if (!$stmt) return [];

    $stmt->bind_param("i", $studentId);
    $stmt->execute();
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
  }

  
  public function getAllSurveys(): array
  {
    $sql = "
      SELECT
        s.survey_id,
        s.title,
        s.start_at,
        s.end_at,
        s.created_by,
        s.qr_code,
        (SELECT COUNT(*) FROM survey_questions sq WHERE sq.survey_id = s.survey_id) AS total_questions,
        (SELECT COUNT(*) FROM course_surveys cs WHERE cs.survey_id = s.survey_id) AS assigned_courses,
        CASE
          WHEN NOW() < s.start_at THEN 'upcoming'
          WHEN NOW() > s.end_at   THEN 'expired'
          ELSE 'active'
        END AS status
      FROM surveys s
      ORDER BY s.start_at DESC
    ";

    $stmt = $this->conn->prepare($sql);
    if (!$stmt) return [];

    $stmt->execute();
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
  }

  
  public function getStudentSurveys(int $studentId): array
  {
    $sql = "
    SELECT
        s.survey_id,
        s.title          AS survey_title,
        s.start_at       AS start_date,
        s.end_at         AS end_date,
        c.course_id,
        c.code           AS course_code,
        c.name           AS course_name,
        f.name           AS faculty_name,
        (SELECT COUNT(*) FROM survey_questions sq WHERE sq.survey_id = s.survey_id) AS total_questions,
        CASE
            WHEN sr.response_id IS NOT NULL THEN 'completed'
            WHEN NOW() < s.start_at          THEN 'upcoming'
            WHEN NOW() > s.end_at            THEN 'expired'
            ELSE 'pending'
        END              AS status,
        sr.submitted_at,
        u.name           AS instructor_name
      FROM course_surveys cs
      JOIN surveys  s ON cs.survey_id  = s.survey_id
      JOIN courses  c ON cs.course_id  = c.course_id
      JOIN faculties f ON c.faculty_id = f.faculty_id
      JOIN course_students cst ON cst.course_id = c.course_id AND cst.student_id = ?
      LEFT JOIN course_instructors ci ON ci.course_id = c.course_id
      LEFT JOIN instructor_profiles ip ON ci.instructor_id = ip.instructor_id
      LEFT JOIN users u ON ip.instructor_id = u.user_id   -- ← fixed
      LEFT JOIN survey_responses sr
        ON  sr.survey_id  = s.survey_id
        AND sr.course_id  = c.course_id   
        AND sr.student_id = ?
      ORDER BY
          FIELD(status, 'pending', 'upcoming', 'expired', 'completed'),
          s.end_at ASC
    ";

    $stmt = $this->conn->prepare($sql);
    if(!$stmt) return [];

    $stmt->bind_param("ii", $studentId, $studentId);
    $stmt->execute();
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
  }

  public function getSurveyQuestions(int $surveyId, int $courseId): array
  {
    $sql = "
    SELECT
        question_id,
        section,
        question_text,
        question_type,
        is_required,
        display_order
      FROM survey_questions
      WHERE survey_id = ?
      ORDER BY display_order ASC
    ";

    $stmt = $this->conn->prepare($sql);
    if(!$stmt) return [];

    $stmt->bind_param("i", $surveyId);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    $sections = [];
    foreach($rows as $row){
      $section = $row['section'] ?? 'General';
      if(!isset($sections[$section])){
        $sections[$section] = [
          'section'   => $section,
          'questions' => [],
        ];
      }

      $sections[$section]['questions'][] = [
        'question_id'   => (int)$row['question_id'],
        'question_text' => $row['question_text'],
        'question_type' => $row['question_type'],
        'is_required'   => (bool)$row['is_required'],
        'display_order' => (int)$row['display_order'],
      ];
    }

    return array_values($sections);
  }

  public function hasStudentCompletedSurvey(int $studentId, int $surveyId, int $courseId): bool
  {
    $sql = "
      SELECT response_id FROM survey_responses
      WHERE student_id = ? AND survey_id = ? AND course_id = ?
      LIMIT 1
    ";

    $stmt = $this->conn->prepare($sql);
    if (!$stmt) return false;

    $stmt->bind_param("iii", $studentId, $surveyId, $courseId);
    $stmt->execute();
    $result = $stmt->get_result();
    return $result->num_rows > 0; 
  }

  public function isSurveyOpen(int $surveyId): bool
  {
    $sql = "
      SELECT survey_id FROM surveys
      WHERE survey_id = ? AND start_at <= NOW() AND end_at >= NOW()
      LIMIT 1
    ";

    $stmt = $this->conn->prepare($sql);
    if (!$stmt) return false;

    $stmt->bind_param("i", $surveyId);
    $stmt->execute();
    return $stmt->get_result()->num_rows > 0;
  }

  public function isCourseLinkedToSurvey(int $surveyId, int $courseId): bool
  {
    $sql = "
      SELECT 1 FROM course_surveys
      WHERE survey_id = ? AND course_id = ?
      LIMIT 1
    ";

    $stmt = $this->conn->prepare($sql);
    if (!$stmt) return false;

    $stmt->bind_param("ii", $surveyId, $courseId);
    $stmt->execute();
    return $stmt->get_result()->num_rows > 0;
  }

  public function getStudentResponses(int $studentId): array
  {
    $sql = "
      SELECT
        sr.response_id,
        sr.survey_id,
        sr.course_id,
        sr.submitted_at,
        s.title         AS title,
        c.name          AS course_name,
        'survey'        AS type
      FROM survey_responses sr
      JOIN surveys s ON sr.survey_id = s.survey_id
      JOIN courses c ON sr.course_id = c.course_id
      WHERE sr.student_id = ?
      ORDER BY sr.submitted_at DESC
    ";

    $stmt = $this->conn->prepare($sql);
    if (!$stmt) return [];

    $stmt->bind_param("i", $studentId);
    $stmt->execute();
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
  }

  public function submitSurvey(int $studentId, int $surveyId, int $courseId, array $answers): bool
  {
    $this->loadSurveyStrategyFiles();

    $this->conn->begin_transaction();

    try {
      $sId = (int)$studentId;
      $svId = (int)$surveyId;
      $cId = (int)$courseId;

      $sql = "INSERT INTO survey_responses (student_id, survey_id, course_id, submitted_at) VALUES ({$sId}, {$svId}, {$cId}, NOW())";
      $ok = $this->conn->query($sql);
      if ($ok === false) throw new Exception("Insert response failed: " . $this->conn->error);
      $responseId = (int)$this->conn->insert_id;

      foreach ($answers as $answer) {
        $type = $answer['question_type'] ?? 'likert';
        $strategy = SurveyStrategyFactory::make($type);
        $ok = $strategy->saveAnswer($this->conn, $responseId, $answer);
        if (!$ok) {
          throw new Exception("Answer insert failed for question: " . (int)($answer['question_id'] ?? 0));
        }
      }

      $this->conn->commit();
      return true;
    } catch (Exception $e) {
      error_log("submitSurvey failed: " . $e->getMessage());
      $this->conn->rollback();
      return false;
    }
  }
}