<?php

declare(strict_types=1);

class InstructorAppeal
{
  private mysqli $conn;
  private string $table = 'grade_appeals';

  public function __construct(mysqli $conn)
  {
    $this->conn = $conn;
  }

  public function getAssignedAppeals(int $instructorId): array
  {
    $sql = "SELECT 
            ga.appeal_id,
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
          WHERE ga.assigned_instructor_id = ?                
          ORDER BY ga.submitted_at DESC    
        ";

    $stmt = $this->conn->prepare($sql);
    if (!$stmt) return [];

    $stmt->bind_param("i", $instructorId);
    $stmt->execute();
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
  }

  public function reviewAppeal(
    int $appealId,
    int $instructorId,
    string $newStatus,
    ?string $newGrade = null,
    ?string $note = null
  ): bool {
    $sql = "UPDATE " . $this->table . " 
            SET status = ?, new_grade = ?, note = ?, resolved_at = NOW() 
            WHERE appeal_id = ? AND assigned_instructor_id = ?";
    $stmt = $this->conn->prepare($sql);
    if (!$stmt) return false;

    $stmt->bind_param('sssii', $newStatus, $newGrade, $note, $appealId, $instructorId);
    error_log("DEBUG: status='{$newStatus}' grade='{$newGrade}' note='{$note}' appeal={$appealId} instructor={$instructorId}");
    return $stmt->execute();
  }
}