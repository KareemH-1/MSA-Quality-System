<?php

declare(strict_types=1);

class StudentAppeal
{
    private mysqli $conn;
    private string $table = 'grade_appeals';

    public function __construct(mysqli $db)
    {
        $this->conn = $db;
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
}
