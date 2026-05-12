<?php

declare(strict_types=1);

class QA
{
  private mysqli $conn;

  public function __construct(mysqli $conn)
  {
    $this->conn = $conn;
  }

  public function getAllCourses(): array
  {
    $sql = "SELECT course_id AS id, code, name FROM courses ORDER BY code LIMIT 1000";
    $stmt = $this->conn->prepare($sql);
    if (!$stmt) return [];

    $stmt->execute();
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
  }

  public function getAllFaculties(): array
  {
    $sql = "SELECT faculty_id AS id, name FROM faculties ORDER BY name";
    $stmt = $this->conn->prepare($sql);
    if (!$stmt) return [];

    $stmt->execute();
    return $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
  }

  public function getAggregateStats(): array
  {

  //this function is for dashboard
    $stats = [
      'total' => 0,
      'accepted' => 0,
      'pending' => 0,
      'hasActiveSession' => false,
      'sessionType' => null,
      'lastMidtermTotal' => 0,
      'lastFinalTotal' => 0,
    ];

    $stmt = $this->conn->prepare("SELECT COUNT(*) AS cnt FROM grade_appeals");
    if ($stmt) {
      $stmt->execute();
      $res = $stmt->get_result();
      if ($row = $res->fetch_assoc()) {
        $stats['total'] = (int)$row['cnt'];
      }
      $stmt->close();
    }

    $stmt = $this->conn->prepare("SELECT COUNT(*) AS cnt FROM grade_appeals WHERE status = 'Resolved'");
    if ($stmt) {
      $stmt->execute();
      $res = $stmt->get_result();
      if ($row = $res->fetch_assoc()) {
        $stats['accepted'] = (int)$row['cnt'];
      }
      $stmt->close();
    }

    $stmt = $this->conn->prepare("SELECT COUNT(*) AS cnt FROM grade_appeals WHERE status IN ('Pending','Under Review')");
    if ($stmt) {
      $stmt->execute();
      $res = $stmt->get_result();
      if ($row = $res->fetch_assoc()) {
        $stats['pending'] = (int)$row['cnt'];
      }
      $stmt->close();
    }

    $stmt = $this->conn->prepare("SELECT COUNT(*) AS cnt, type FROM appeal_sessions WHERE status='Open' AND start_date <= NOW() AND end_date >= NOW() LIMIT 1");
    if ($stmt) {
      $stmt->execute();
      $res = $stmt->get_result();
      if ($row = $res->fetch_assoc()) {
        $stats['hasActiveSession'] = ((int)$row['cnt'] > 0);
        $stats['sessionType'] = $row['type'];
      }
      $stmt->close();
    }

    $stmt = $this->conn->prepare("SELECT COUNT(ga.appeal_id) AS cnt FROM appeal_sessions s LEFT JOIN grade_appeals ga ON s.session_id = ga.session_id WHERE s.type = 'Midterm' ORDER BY s.start_date DESC LIMIT 1");
    if ($stmt) {
      $stmt->execute();
      $res = $stmt->get_result();
      if ($row = $res->fetch_assoc()) {
        $stats['lastMidtermTotal'] = (int)$row['cnt'];
      }
      $stmt->close();
    }

    $stmt = $this->conn->prepare("SELECT COUNT(ga.appeal_id) AS cnt FROM appeal_sessions s LEFT JOIN grade_appeals ga ON s.session_id = ga.session_id WHERE s.type = 'Final' ORDER BY s.start_date DESC LIMIT 1");
    if ($stmt) {
      $stmt->execute();
      $res = $stmt->get_result();
      if ($row = $res->fetch_assoc()) {
        $stats['lastFinalTotal'] = (int)$row['cnt'];
      }
      $stmt->close();
    }

    return $stats;
  }

  public function getSessionHistory(): array
  {
    $sql = "SELECT 
              s.session_id,
              s.type AS session,
              s.status,
              DATE_FORMAT(s.start_date, '%Y-%m-%d') AS start_date,
              DATE_FORMAT(s.end_date, '%Y-%m-%d') AS end_date,
              COUNT(ga.appeal_id) AS count,
              SUM(CASE WHEN ga.status = 'Resolved' THEN 1 ELSE 0 END) AS acceptedCount,
              SUM(CASE WHEN ga.status = 'Pending' THEN 1 ELSE 0 END) AS pendingCount,
              SUM(CASE WHEN ga.status = 'Under Review' THEN 1 ELSE 0 END) AS inProgressCount,
              SUM(CASE WHEN ga.status <> 'Resolved' AND ga.appeal_id IS NOT NULL THEN 1 ELSE 0 END) AS activeCount
            FROM appeal_sessions s
            LEFT JOIN grade_appeals ga ON s.session_id = ga.session_id
            GROUP BY s.session_id
            ORDER BY s.start_date DESC";

    $stmt = $this->conn->prepare($sql);
    if (!$stmt) return [];

    $stmt->execute();
    $result = $stmt->get_result();
    $history = [];

    while ($row = $result->fetch_assoc()) {
      $history[] = [
        'session_id' => (int)$row['session_id'],
        'session' => $row['session'],
        'status' => $row['status'],
        'start_date' => $row['start_date'],
        'end_date' => $row['end_date'],
        'count' => (int)$row['count'],
        'acceptedCount' => (int)$row['acceptedCount'],
        'pendingCount' => (int)$row['pendingCount'],
        'inProgressCount' => (int)$row['inProgressCount'],
        'activeCount' => (int)$row['activeCount'],
      ];
    }

    $stmt->close();
    return $history;
  }

  public function getSessionWindows(): array
  {
    $history = $this->getSessionHistory();
    $windows = [];

    foreach ($history as $rec) {
      $yr = date('Y', strtotime($rec['start_date']));
      $key = "{$yr}::{$rec['session']}";
      $windows[$key] = [
        'startedAt' => $rec['start_date'],
        'endedAt' => $rec['end_date'],
      ];
    }

    return $windows;
  }

  public function getCapacityInfo(
    array $activeLevelIds,
    array $exemptFacultyIds,
    array $exemptCourseIds,
    int $maxAppeals
  ): array
  {
    $capacity = [
      'eligibleStudents' => 0,
      'excludedStudents' => 0,
      'netEligible' => 0,
      'capacity' => 0,
      'avgPerInstructor' => 0,
      'totalInstructors' => 0,
      'totalModuleLeaders' => 0,
    ];

    if (empty($activeLevelIds) || $maxAppeals < 1) {
      return $capacity;
    }

    $instStmt = $this->conn->prepare("SELECT COUNT(DISTINCT u.user_id) AS cnt FROM users u WHERE u.role = 'Instructor'");
    if ($instStmt) {
      $instStmt->execute();
      $res = $instStmt->get_result();
      if ($row = $res->fetch_assoc()) {
        $capacity['totalInstructors'] = max(1, (int)$row['cnt']);
      }
      $instStmt->close();
    }

    $mlStmt = $this->conn->prepare("SELECT COUNT(DISTINCT u.user_id) AS cnt FROM users u WHERE u.role = 'Module_Leader'");
    if ($mlStmt) {
      $mlStmt->execute();
      $res = $mlStmt->get_result();
      if ($row = $res->fetch_assoc()) {
        $capacity['totalModuleLeaders'] = max(1, (int)$row['cnt']);
      }
      $mlStmt->close();
    }

    $levelPlaceholders = implode(',', array_map(fn($x) => '?', $activeLevelIds));
    $studentStmt = $this->conn->prepare("
      SELECT COUNT(DISTINCT u.user_id) AS cnt
      FROM users u
      WHERE u.role = 'Student' AND u.level IN ($levelPlaceholders)
    ");

    if ($studentStmt) {
      $types = str_repeat('i', count($activeLevelIds));
      $studentStmt->bind_param($types, ...$activeLevelIds);
      $studentStmt->execute();
      $res = $studentStmt->get_result();
      if ($row = $res->fetch_assoc()) {
        $capacity['eligibleStudents'] = (int)$row['cnt'];
      }
      $studentStmt->close();
    }

    $excludedCount = 0;

    if (!empty($exemptFacultyIds)) {
      $facPlaceholders = implode(',', array_map(fn($x) => '?', $exemptFacultyIds));
      $facStmt = $this->conn->prepare("
        SELECT COUNT(DISTINCT cs.student_id) AS cnt
        FROM course_students cs
        JOIN courses c ON cs.course_id = c.course_id
        WHERE c.faculty_id IN ($facPlaceholders)
      ");
      if ($facStmt) {
        $types = str_repeat('i', count($exemptFacultyIds));
        $facStmt->bind_param($types, ...$exemptFacultyIds);
        $facStmt->execute();
        $res = $facStmt->get_result();
        if ($row = $res->fetch_assoc()) {
          $excludedCount += (int)$row['cnt'];
        }
        $facStmt->close();
      }
    }

    if (!empty($exemptCourseIds)) {
      $coursePlaceholders = implode(',', array_map(fn($x) => '?', $exemptCourseIds));
      $courseStmt = $this->conn->prepare("
        SELECT COUNT(DISTINCT student_id) AS cnt
        FROM course_students
        WHERE course_id IN ($coursePlaceholders)
      ");
      if ($courseStmt) {
        $types = str_repeat('i', count($exemptCourseIds));
        $courseStmt->bind_param($types, ...$exemptCourseIds);
        $courseStmt->execute();
        $res = $courseStmt->get_result();
        if ($row = $res->fetch_assoc()) {
          $excludedCount += (int)$row['cnt'];
        }
        $courseStmt->close();
      }
    }

    $capacity['excludedStudents'] = $excludedCount;
    $capacity['netEligible'] = max(0, $capacity['eligibleStudents'] - $excludedCount);
    $capacity['capacity'] = $capacity['netEligible'] * $maxAppeals;
    $capacity['avgPerInstructor'] = $capacity['totalInstructors'] > 0
      ? (int)round($capacity['capacity'] / $capacity['totalInstructors'])
      : 0;

    return $capacity;
  }


  public function getAppealsByFilters(
    ?int $courseId = null,
    ?int $facultyId = null,
    ?int $levelId = null,
    ?string $status = null,
    ?string $search = null,
    int $limit = 1000,
    int $offset = 0
  ): array
  {
    $sql = "
      SELECT
        ga.appeal_id,
        ga.student_id,
        ga.course_id,
        ga.session_id,
        ga.original_grade,
        ga.new_grade,
        ga.reason,
        ga.note,
        ga.status,
        ga.submitted_at,
        ga.resolved_at,
        c.code AS course_code,
        c.name AS course_name,
        f.name AS faculty_name,
        u.name AS student_name,
        u.level,
        s.type AS session_type,
        instr.name AS assigned_instructor
      FROM grade_appeals ga
      JOIN courses c ON ga.course_id = c.course_id
      JOIN faculties f ON c.faculty_id = f.faculty_id
      JOIN users u ON ga.student_id = u.user_id
      JOIN appeal_sessions s ON ga.session_id = s.session_id
      LEFT JOIN users instr ON ga.assigned_instructor_id = instr.user_id
      WHERE 1=1
    ";

    $types = '';
    $params = [];

    if ($courseId !== null) {
      $sql .= " AND c.course_id = ?";
      $types .= 'i';
      $params[] = $courseId;
    }

    if ($facultyId !== null) {
      $sql .= " AND f.faculty_id = ?";
      $types .= 'i';
      $params[] = $facultyId;
    }

    if ($levelId !== null) {
      $sql .= " AND u.level = ?";
      $types .= 'i';
      $params[] = $levelId;
    }

    if ($status !== null && $status !== '') {
      $sql .= " AND ga.status = ?";
      $types .= 's';
      $params[] = $status;
    }

    if ($search !== null && $search !== '') {
      $searchTerm = '%' . $search . '%';
      $sql .= " AND (u.name LIKE ? OR c.code LIKE ? OR c.name LIKE ?)";
      $types .= 'sss';
      $params[] = $searchTerm;
      $params[] = $searchTerm;
      $params[] = $searchTerm;
    }

    $sql .= " ORDER BY ga.submitted_at DESC LIMIT ? OFFSET ?";
    $types .= 'ii';
    $params[] = $limit;
    $params[] = $offset;

    $stmt = $this->conn->prepare($sql);
    if (!$stmt) return [];

    if ($params) {
      $stmt->bind_param($types, ...$params);
    }

    $stmt->execute();
    $result = $stmt->get_result();
    $appeals = [];

    while ($row = $result->fetch_assoc()) {
      $appeals[] = [
        'appeal_id' => (int)$row['appeal_id'],
        'student_id' => (int)$row['student_id'],
        'student_name' => $row['student_name'],
        'student_level' => (int)$row['level'],
        'course_id' => (int)$row['course_id'],
        'course_code' => $row['course_code'],
        'course_name' => $row['course_name'],
        'faculty_name' => $row['faculty_name'],
        'session_id' => (int)$row['session_id'],
        'session_type' => $row['session_type'],
        'original_grade' => $row['original_grade'],
        'new_grade' => $row['new_grade'],
        'reason' => $row['reason'],
        'note' => $row['note'],
        'status' => $row['status'],
        'assigned_instructor' => $row['assigned_instructor'],
        'submitted_at' => $row['submitted_at'],
        'resolved_at' => $row['resolved_at'],
      ];
    }

    $stmt->close();
    return $appeals;
  }


  public function getSessionAppeals(int $sessionId): array
  {
    return $this->getAppealsByFilters(
      courseId: null,
      facultyId: null,
      levelId: null,
      status: null,
      search: null,
      limit: 10000
    );

    $sql = "
      SELECT
        ga.appeal_id,
        ga.student_id,
        ga.original_grade,
        ga.new_grade,
        ga.status,
        ga.submitted_at,
        u.name AS student_name,
        c.code AS course_code,
        c.name AS course_name
      FROM grade_appeals ga
      JOIN users u ON ga.student_id = u.user_id
      JOIN courses c ON ga.course_id = c.course_id
      WHERE ga.session_id = ?
      ORDER BY ga.submitted_at DESC
    ";

    $stmt = $this->conn->prepare($sql);
    if (!$stmt) return [];

    $stmt->bind_param('i', $sessionId);
    $stmt->execute();
    $result = $stmt->get_result();
    $appeals = [];

    while ($row = $result->fetch_assoc()) {
      $appeals[] = [
        'appeal_id' => (int)$row['appeal_id'],
        'student_id' => (int)$row['student_id'],
        'student_name' => $row['student_name'],
        'original_grade' => $row['original_grade'],
        'new_grade' => $row['new_grade'],
        'status' => $row['status'],
        'submitted_at' => $row['submitted_at'],
        'course_code' => $row['course_code'],
        'course_name' => $row['course_name'],
      ];
    }

    $stmt->close();
    return $appeals;
  }

  public function importAppealData(array $records): array
  {
    $imported = 0;
    $errors = [];

    foreach ($records as $idx => $record) {
      $studentId = isset($record['student_id']) ? (int)$record['student_id'] : null;
      $courseId = isset($record['course_id']) ? (int)$record['course_id'] : null;
      $sessionId = isset($record['session_id']) ? (int)$record['session_id'] : null;
      $originalGrade = isset($record['original_grade']) ? (string)$record['original_grade'] : null;
      $reason = isset($record['reason']) ? (string)$record['reason'] : null;

      if (!$studentId || !$courseId || !$sessionId || !$originalGrade || !$reason) {
        $errors[] = "Row " . ($idx + 1) . ": Missing required fields";
        continue;
      }

      $userStmt = $this->conn->prepare("SELECT role FROM users WHERE user_id = ?");
      if (!$userStmt) {
        $errors[] = "Row " . ($idx + 1) . ": Database error";
        continue;
      }
      $userStmt->bind_param('i', $studentId);
      $userStmt->execute();
      $res = $userStmt->get_result();
      if (!($userRow = $res->fetch_assoc()) || $userRow['role'] !== 'Student') {
        $errors[] = "Row " . ($idx + 1) . ": Student ID {$studentId} not found or is not a student";
        $userStmt->close();
        continue;
      }
      $userStmt->close();

      $courseStmt = $this->conn->prepare("SELECT course_id FROM courses WHERE course_id = ?");
      if (!$courseStmt) {
        $errors[] = "Row " . ($idx + 1) . ": Database error";
        continue;
      }
      $courseStmt->bind_param('i', $courseId);
      $courseStmt->execute();
      $courseRes = $courseStmt->get_result();
      if (!$courseRes->fetch_assoc()) {
        $errors[] = "Row " . ($idx + 1) . ": Course ID {$courseId} not found";
        $courseStmt->close();
        continue;
      }
      $courseStmt->close();

      $sessionStmt = $this->conn->prepare("SELECT session_id FROM appeal_sessions WHERE session_id = ?");
      if (!$sessionStmt) {
        $errors[] = "Row " . ($idx + 1) . ": Database error";
        continue;
      }
      $sessionStmt->bind_param('i', $sessionId);
      $sessionStmt->execute();
      $sessionRes = $sessionStmt->get_result();
      if (!$sessionRes->fetch_assoc()) {
        $errors[] = "Row " . ($idx + 1) . ": Session ID {$sessionId} not found";
        $sessionStmt->close();
        continue;
      }
      $sessionStmt->close();

      $insertSql = "INSERT INTO grade_appeals (student_id, course_id, session_id, original_grade, reason, status)
                    VALUES (?, ?, ?, ?, ?, 'Pending')";
      $insertStmt = $this->conn->prepare($insertSql);
      if (!$insertStmt) {
        $errors[] = "Row " . ($idx + 1) . ": Failed to insert";
        continue;
      }

      $insertStmt->bind_param('iiiss', $studentId, $courseId, $sessionId, $originalGrade, $reason);
      if (!$insertStmt->execute()) {
        $errors[] = "Row " . ($idx + 1) . ": " . $this->conn->error;
      } else {
        $imported++;
      }
      $insertStmt->close();
    }

    return [
      'imported' => $imported,
      'total' => count($records),
      'errors' => $errors,
    ];
  }

  public function getOverviewData(): array
  {
    $data = [
      'kpis' => [
        'totalAppeals' => ['value' => 0],
        'pendingAppeals' => ['value' => 0, 'description' => 'Number of appeals pending review'],
        'approvedAppeals' => ['value' => 0, 'ratePercent' => 0],
        'rejectedAppeals' => ['value' => 0, 'ratePercent' => 0],
        'appealResolutionTime' => ['value' => 0, 'description' => 'Average time to resolve an appeal'],
        'satisfactionScore' => ['value' => 0, 'target' => 85, 'description' => 'Average satisfaction score from surveys'],
      ],
      'appeals' => [
        'midterm' => ['total' => 0, 'resolved' => 0, 'pending' => 0, 'rejected' => 0],
        'final' => ['total' => 0, 'resolved' => 0, 'pending' => 0, 'rejected' => 0],
      ],
      'previousSemesterData' => [
        'appeals' => [
          'midterm' => ['total' => 0],
          'final' => ['total' => 0],
        ],
      ],
    ];

    $stmt = $this->conn->prepare("SELECT COUNT(*) AS cnt FROM grade_appeals");
    if ($stmt) {
      $stmt->execute();
      $res = $stmt->get_result();
      if ($row = $res->fetch_assoc()) {
        $data['kpis']['totalAppeals']['value'] = (int)$row['cnt'];
      }
      $stmt->close();
    }

    $stmt = $this->conn->prepare("SELECT COUNT(*) AS cnt FROM grade_appeals WHERE status IN ('Pending', 'Under Review')");
    if ($stmt) {
      $stmt->execute();
      $res = $stmt->get_result();
      if ($row = $res->fetch_assoc()) {
        $data['kpis']['pendingAppeals']['value'] = (int)$row['cnt'];
        $data['kpis']['pendingAppeals']['severity'] = (int)$row['cnt'] > 50 ? 'warn' : 'cool';
      }
      $stmt->close();
    }

    $stmt = $this->conn->prepare("SELECT COUNT(*) AS cnt FROM grade_appeals WHERE status = 'Resolved'");
    if ($stmt) {
      $stmt->execute();
      $res = $stmt->get_result();
      if ($row = $res->fetch_assoc()) {
        $approved = (int)$row['cnt'];
        $data['kpis']['approvedAppeals']['value'] = $approved;
        $total = $data['kpis']['totalAppeals']['value'];
        $data['kpis']['approvedAppeals']['ratePercent'] = $total > 0 ? round(($approved / $total) * 100, 1) : 0;
      }
      $stmt->close();
    }

    $stmt = $this->conn->prepare("SELECT COUNT(*) AS cnt FROM grade_appeals WHERE status = 'Rejected'");
    if ($stmt) {
      $stmt->execute();
      $res = $stmt->get_result();
      if ($row = $res->fetch_assoc()) {
        $rejected = (int)$row['cnt'];
        $data['kpis']['rejectedAppeals']['value'] = $rejected;
        $total = $data['kpis']['totalAppeals']['value'];
        $data['kpis']['rejectedAppeals']['ratePercent'] = $total > 0 ? round(($rejected / $total) * 100, 1) : 0;
        $data['kpis']['rejectedAppeals']['severity'] = $data['kpis']['rejectedAppeals']['ratePercent'] > 40 ? 'warn' : 'cool';
      }
      $stmt->close();
    }

    $stmt = $this->conn->prepare("
      SELECT AVG(TIMESTAMPDIFF(MINUTE, submitted_at, COALESCE(resolved_at, NOW()))) AS avg_minutes
      FROM grade_appeals
      WHERE status IN ('Resolved', 'Rejected')
    ");
    if ($stmt) {
      $stmt->execute();
      $res = $stmt->get_result();
      if ($row = $res->fetch_assoc()) {
        if ($row['avg_minutes'] !== null) {
          $data['kpis']['appealResolutionTime']['value'] = (int)$row['avg_minutes'];
        }
      }
      $stmt->close();
    }

    $stmt = $this->conn->prepare("
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN ga.status = 'Resolved' THEN 1 ELSE 0 END) AS resolved,
        SUM(CASE WHEN ga.status IN ('Pending', 'Under Review') THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN ga.status = 'Rejected' THEN 1 ELSE 0 END) AS rejected
      FROM appeal_sessions s
      LEFT JOIN grade_appeals ga ON s.session_id = ga.session_id
      WHERE s.type = 'Midterm'
      ORDER BY s.start_date DESC
      LIMIT 1
    ");
    if ($stmt) {
      $stmt->execute();
      $res = $stmt->get_result();
      if ($row = $res->fetch_assoc()) {
        $data['appeals']['midterm'] = [
          'total' => (int)($row['total'] ?? 0),
          'resolved' => (int)($row['resolved'] ?? 0),
          'pending' => (int)($row['pending'] ?? 0),
          'rejected' => (int)($row['rejected'] ?? 0),
        ];
      }
      $stmt->close();
    }

    $stmt = $this->conn->prepare("
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN ga.status = 'Resolved' THEN 1 ELSE 0 END) AS resolved,
        SUM(CASE WHEN ga.status IN ('Pending', 'Under Review') THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN ga.status = 'Rejected' THEN 1 ELSE 0 END) AS rejected
      FROM appeal_sessions s
      LEFT JOIN grade_appeals ga ON s.session_id = ga.session_id
      WHERE s.type = 'Final'
      ORDER BY s.start_date DESC
      LIMIT 1
    ");
    if ($stmt) {
      $stmt->execute();
      $res = $stmt->get_result();
      if ($row = $res->fetch_assoc()) {
        $data['appeals']['final'] = [
          'total' => (int)($row['total'] ?? 0),
          'resolved' => (int)($row['resolved'] ?? 0),
          'pending' => (int)($row['pending'] ?? 0),
          'rejected' => (int)($row['rejected'] ?? 0),
        ];
      }
      $stmt->close();
    }

    return $data;
  }
}

?>
