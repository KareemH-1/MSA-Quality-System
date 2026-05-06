<?php

declare(strict_types=1);

class StudentSurvey
{
  private mysqli $conn;

  public function __construct(mysqli $db)
  {
    $this->conn = $db;
  }

  
  public function getStudentSurveys(int $studentId): array
  {
    $sql = "
    SELECT
        s.survey_id,
        s.title          AS survey_title,
        s.start_at,
        s.end_at,
        c.course_id,
        c.code           AS course_code,
        c.name           AS course_name,
        f.name           AS faculty_name,
        (
            SELECT COUNT(*) FROM survey_questions sq WHERE sq.survey_id = s.survey_id
        )                AS total_questions,
        CASE
            WHEN sr.response_id IS NOT NULL THEN 'completed'
            WHEN NOW() < s.start_at          THEN 'upcoming'
            WHEN NOW() > s.end_at            THEN 'expired'
            ELSE 'pending'
        END              AS status,
        sr.submitted_at
      FROM course_surveys cs
      JOIN surveys  s ON cs.survey_id  = s.survey_id
      JOIN courses  c ON cs.course_id  = c.course_id
      JOIN faculties f ON c.faculty_id = f.faculty_id
      JOIN course_students cst ON cst.course_id = c.course_id AND cst.student_id = ?
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

  public function submitSurvey(int $studentId, int $surveyId, int $courseId, array $answers): bool
  {
    $this->conn->begin_transaction();

    try {
      $sql = "
        INSERT INTO survey_responses (student_id, survey_id, course_id, submitted_at)
        VALUES (?, ?, ?, NOW())
      ";

      $stmt = $this->conn->prepare($sql);
      if (!$stmt) throw new Exception("Prepare failed: response");

      $stmt->bind_param("iii", $studentId, $surveyId, $courseId);
      $stmt->execute();
      $responseId = (int)$this->conn->insert_id;
  

      $sql = "
        INSERT INTO answers (response_id, question_id, answer_text)
        VALUES (?, ?, ?)
      ";

      $stmt = $this->conn->prepare($sql);
      if (!$stmt) throw new Exception("Prepare failed: answers");

      foreach ($answers as $answer) {
          $questionId = (int)$answer['question_id'];
          $answerText = (string)($answer['answer_text'] ?? '');

          $stmt->bind_param("iis", $responseId, $questionId, $answerText);
          $stmt->execute();
      }

      $this->conn->commit();
      return true;

    } catch (Exception $e) {
      $this->conn->rollback();
      return false;
    }
  }
}