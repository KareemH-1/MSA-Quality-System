<?php

declare(strict_types=1);

require_once __DIR__ . '/../Service/NotificationService.php';

class ModuleLeader
{
  private mysqli $conn;
  private string $table = 'grade_appeals';

  public function __construct(mysqli $conn)
  {
    $this->conn = $conn;
  }

  public function getAppealsByCourses(int $moduleLeaderId): array
  {
    $sql = "SELECT
            ga.appeal_id,
            ga.course_id,
            ga.original_grade,
            ga.new_grade,
            ga.reason,
            ga.note,
            ga.status,
            ga.submitted_at,
            c.name AS course_name,
            c.code AS course_code,
            u.name AS student_name
          FROM grade_appeals ga
          JOIN courses c ON ga.course_id = c.course_id
          JOIN users u ON ga.student_id = u.user_id
          WHERE c.module_leader_id = ?
          ORDER BY ga.submitted_at DESC";

    $stmt = $this->conn->prepare($sql);
    if (!$stmt) return [];

    $stmt->bind_param("i", $moduleLeaderId);
    $stmt->execute();
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
  }

  public function getCourseInstructors(int $courseId): array
  {
    $sql = "SELECT 
              u.user_id,
              u.name
          FROM course_instructors ci
          JOIN users u ON ci.instructor_id = u.user_id
          WHERE ci.course_id = ?
          AND u.role = 'Instructor'";

    $stmt = $this->conn->prepare($sql);
    if (!$stmt) return [];

    $stmt->bind_param("i", $courseId);
    $stmt->execute();
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
  }

  public function assignAppeal(
    int $appealId,
    int $instructorId,
    int $moduleLeaderId
  ): bool {
    $sql = "UPDATE " . $this->table . "
            SET assigned_instructor_id = ?, assigned_by = ?, assigned_at = NOW(), status = 'Under Review'
            WHERE appeal_id = ? AND assigned_instructor_id IS NULL";
    
    $stmt = $this->conn->prepare($sql);
    if (!$stmt) return false;

    $stmt->bind_param("iii", $instructorId, $moduleLeaderId, $appealId);
    $stmt->execute();
    if($stmt->affected_rows === 0) {
      return false;
    }

    $infoSql = "SELECT ga.student_id, c.name AS course_name FROM grade_appeals ga
                    JOIN courses c ON ga.course_id = c.course_id
                    WHERE ga.appeal_id = ?";

    $infoStmt = $this->conn->prepare($infoSql);
    $infoStmt->bind_param("i", $appealId);
    $infoStmt->execute();
    $infoResult = $infoStmt->get_result()->fetch_assoc();

    if($infoResult) {
      $courseName = $infoResult['course_name'];

      NotificationService::send(
        $this->conn,
        "You have been assigned a new grade appeal for $courseName",
        $instructorId,        
        'appeal',
        $moduleLeaderId,
        true
      );
    }

    return true;
  }
}