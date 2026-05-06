<?php
require_once 'Database.php';

class Course {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    private function facultyExists($facultyId) {
        $sql = "SELECT faculty_id FROM faculties WHERE faculty_id = ? LIMIT 1";
        $stmt = $this->conn->prepare($sql);
        if (!$stmt) {
            return false;
        }

        $stmt->bind_param('i', $facultyId);
        $stmt->execute();
        $foundId = null;
        $stmt->bind_result($foundId);
        $exists = $stmt->fetch() ? true : false;
        $stmt->close();

        return $exists;
    }

    private function normalizeSemesterList($semestersInput) {
        $semesters = [];

        if (is_array($semestersInput)) {
            foreach ($semestersInput as $semester) {
                $semesterName = trim((string)$semester);
                if ($semesterName === '') {
                    continue;
                }

                $seen = false;
                foreach ($semesters as $existingSemester) {
                    if ($existingSemester === $semesterName) {
                        $seen = true;
                        break;
                    }
                }

                if (!$seen) {
                    $semesters[] = $semesterName;
                }
            }

            return $semesters;
        }

        $rawValue = trim((string)$semestersInput);
        if ($rawValue === '') {
            return $semesters;
        }

        $parts = explode(',', $rawValue);
        foreach ($parts as $part) {
            $semesterName = trim($part);
            if ($semesterName === '') {
                continue;
            }

            $seen = false;
            foreach ($semesters as $existingSemester) {
                if ($existingSemester === $semesterName) {
                    $seen = true;
                    break;
                }
            }

            if (!$seen) {
                $semesters[] = $semesterName;
            }
        }

        return $semesters;
    }

    private function getLatestCourseSemester($courseId) {
        $sql = "SELECT semesters FROM courses WHERE course_id = ? LIMIT 1";
        $stmt = $this->conn->prepare($sql);
        if (!$stmt) {
            return null;
        }

        $stmt->bind_param('i', $courseId);
        $stmt->execute();
        $semestersJson = null;
        $stmt->bind_result($semestersJson);

        if (!$stmt->fetch()) {
            $stmt->close();
            return null;
        }

        $stmt->close();

        $decoded = json_decode($semestersJson, true);
        if (!is_array($decoded)) {
            return null;
        }

        $latestSemester = null;
        foreach ($decoded as $semesterItem) {
            $semesterName = trim((string)$semesterItem);
            if ($semesterName !== '') {
                $latestSemester = $semesterName;
            }
        }

        return $latestSemester;
    }

    private function countAppealsForSemester($courseId, $semesterLabel, $term, $onlyOpen = false) {
        if ($semesterLabel === null || trim($semesterLabel) === '') {
            return 0;
        }

        $semesterPattern = '%' . strtolower(trim($semesterLabel)) . '%';
        $termPattern = '%' . strtolower(trim($term)) . '%';

        if ($onlyOpen) {
            $sql = "SELECT COUNT(*) FROM grade_appeals ga
                    INNER JOIN appeal_sessions s ON ga.session_id = s.session_id
                    WHERE ga.course_id = ?
                      AND LOWER(s.type) LIKE ?
                      AND LOWER(s.type) LIKE ?
                      AND ga.status IN ('Pending', 'Under Review')";
        } else {
            $sql = "SELECT COUNT(*) FROM grade_appeals ga
                    INNER JOIN appeal_sessions s ON ga.session_id = s.session_id
                    WHERE ga.course_id = ?
                      AND LOWER(s.type) LIKE ?
                      AND LOWER(s.type) LIKE ?";
        }

        $stmt = $this->conn->prepare($sql);
        if (!$stmt) {
            return 0;
        }

        $stmt->bind_param('iss', $courseId, $termPattern, $semesterPattern);
        $stmt->execute();
        $countValue = null;
        $stmt->bind_result($countValue);
        $stmt->fetch();
        $stmt->close();

        return (int)$countValue;
    }

    private function getLatestSurveyForCourse($courseId) {
        $sql = "SELECT s.survey_id, s.title
                FROM course_surveys cs
                INNER JOIN surveys s ON cs.survey_id = s.survey_id
                WHERE cs.course_id = ?
                ORDER BY s.end_at DESC, s.survey_id DESC
                LIMIT 1";

        $stmt = $this->conn->prepare($sql);
        if (!$stmt) {
            return null;
        }

        $stmt->bind_param('i', $courseId);
        $stmt->execute();
        $surveyId = null;
        $surveyTitle = null;
        $stmt->bind_result($surveyId, $surveyTitle);

        if (!$stmt->fetch()) {
            $stmt->close();
            return null;
        }

        $stmt->close();

        return [
            'survey_id' => (int)$surveyId,
            'title' => $surveyTitle,
        ];
    }

    private function getSurveySatisfactionRate($surveyId) {
        $sql = "SELECT a.answer_text
                FROM survey_responses r
                INNER JOIN answers a ON r.response_id = a.response_id
                WHERE r.survey_id = ?";

        $stmt = $this->conn->prepare($sql);
        if (!$stmt) {
            return 0;
        }

        $stmt->bind_param('i', $surveyId);
        $stmt->execute();
        $answerText = null;
        $stmt->bind_result($answerText);

        $total = 0.0;
        $count = 0;
        while ($stmt->fetch()) {
            $value = trim((string)$answerText);
            if ($value === '') {
                continue;
            }

            if (is_numeric($value)) {
                $total += (float)$value;
                $count++;
            }
        }

        $stmt->close();

        if ($count === 0) {
            return 0;
        }

        return round($total / $count, 2);
    }

    public function getCourses($page = 1, $perPage = 10, $search = null) {
        $offset = max(0, ($page - 1) * $perPage);

        $baseSql = "SELECT c.course_id, c.code, c.name, c.level, c.semesters, c.faculty_id, c.module_leader_id, f.name as faculty_name, u.name as module_leader_name
                    FROM courses c
                    LEFT JOIN faculties f ON c.faculty_id = f.faculty_id
                    LEFT JOIN users u ON c.module_leader_id = u.user_id";

        $where = '';
        if (!empty($search)) {
            $where = " WHERE (c.code LIKE ? OR c.name LIKE ?)";
        }

        $countSql = "SELECT COUNT(*) FROM courses c" . ($where ?: '');
        $countStmt = $this->conn->prepare($countSql);
        if ($countStmt) {
            if (!empty($search)) {
                $like = "%" . $search . "%";
                $countStmt->bind_param('s', $like);
            }
            $countStmt->execute();
            $total = null;
            $countStmt->bind_result($total);
            $countStmt->fetch();
            $countStmt->close();
            $total = (int)$total;
        } else {
            $total = 0;
        }

        $sql = $baseSql . $where . " ORDER BY c.code ASC LIMIT ? OFFSET ?";
        $stmt = $this->conn->prepare($sql);
        if (!$stmt) {
            return ['status' => 'error', 'message' => 'Database error: '.$this->conn->error];
        }

        if (!empty($search)) {
            $like = "%" . $search . "%";
            $stmt->bind_param('sii', $like, $perPage, $offset);
        } else {
            $stmt->bind_param('ii', $perPage, $offset);
        }

        $stmt->execute();
        $cid = null; $code = null; $name = null; $level = null; $semesters = null; $faculty_id = null; $module_leader_id = null; $faculty_name = null; $ml_name = null;
        $stmt->bind_result($cid, $code, $name, $level, $semesters, $faculty_id, $module_leader_id, $faculty_name, $ml_name);

        $rows = [];
        while ($stmt->fetch()) {
            $rows[] = [
                'course_id' => (int)$cid,
                'code' => $code,
                'name' => $name,
                'level' => $level,
                'semesters' => ($semesters !== null ? json_decode($semesters, true) : null),
                'faculty_id' => $faculty_id,
                'faculty_name' => $faculty_name,
                'module_leader_id' => $module_leader_id,
                'module_leader_name' => $ml_name,
            ];
        }
        $stmt->close();

        return ['status' => 'success', 'courses' => $rows, 'total' => $total, 'page' => $page, 'perPage' => $perPage];
    }

    public function getCourseById($id) {
        $sql = "SELECT course_id, code, name, level, semesters, faculty_id, module_leader_id FROM courses WHERE course_id = ? LIMIT 1";
        $stmt = $this->conn->prepare($sql);
        if (!$stmt) return ['status'=>'error','message'=>'Database error'];
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $cid = null; $code = null; $name = null; $level=null; $semesters=null; $fid=null; $ml=null;
        $stmt->bind_result($cid,$code,$name,$level,$semesters,$fid,$ml);
        if ($stmt->fetch()) {
            $stmt->close();
            return ['status'=>'success','course'=>['course_id'=>$cid,'code'=>$code,'name'=>$name,'level'=>$level,'semesters'=>($semesters !== null ? json_decode($semesters, true) : null),'faculty_id'=>$fid,'module_leader_id'=>$ml]];
        }
        $stmt->close();
        return ['status'=>'error','message'=>'Course not found'];
    }

    public function createCourse($data) {
        $code = trim($data['code'] ?? '');
        $name = trim($data['name'] ?? '');
        $level = isset($data['level']) ? (int)$data['level'] : null;

        $semesters = $data['semesters'] ?? null;
        $faculty_id = isset($data['faculty_id']) ? (int)$data['faculty_id'] : 0;
        $module_leader_id = isset($data['module_leader_id']) ? (int)$data['module_leader_id'] : null;

        if ($code === '' || $name === '') return ['status'=>'error','message'=>'Code and name required'];
        if (!$faculty_id || $faculty_id <= 0) return ['status'=>'error','message'=>'faculty_id is required and must be valid'];
        if (!$this->facultyExists($faculty_id)) return ['status'=>'error','message'=>'faculty_id is required and must be valid'];

        if ($module_leader_id !== null && $module_leader_id > 0) {
            $check = $this->conn->prepare("SELECT role FROM users WHERE user_id = ? LIMIT 1");
            if ($check) {
                $check->bind_param('i', $module_leader_id);
                $check->execute();
                $role = null;
                $check->bind_result($role);
                if ($check->fetch()) {
                    if ($role !== 'Module_Leader') {
                        $check->close();
                        return ['status'=>'error','message'=>'Assigned module leader must have role Module_Leader'];
                    }
                } else {
                    $check->close();
                    return ['status'=>'error','message'=>'Module leader user not found'];
                }
                $check->close();
            }
        }

        $semestersJson = null;
        $semestersList = $this->normalizeSemesterList($semesters);
        if (!empty($semestersList)) {
            $semestersJson = json_encode($semestersList);
        }

        if ($module_leader_id === null || $module_leader_id === 0) {
            $sql = "INSERT INTO courses (code, name, level, semesters, faculty_id, module_leader_id) VALUES (?, ?, ?, ?, ?, NULL)";
            $stmt = $this->conn->prepare($sql);
            if (!$stmt) return ['status'=>'error','message'=>'Database error: '.$this->conn->error];
            $stmt->bind_param('ssisi', $code, $name, $level, $semestersJson, $faculty_id);
        } else {
            $sql = "INSERT INTO courses (code, name, level, semesters, faculty_id, module_leader_id) VALUES (?, ?, ?, ?, ?, ?)";
            $stmt = $this->conn->prepare($sql);
            if (!$stmt) return ['status'=>'error','message'=>'Database error: '.$this->conn->error];
            $stmt->bind_param('ssissi', $code, $name, $level, $semestersJson, $faculty_id, $module_leader_id);
        }

        if (!$stmt->execute()) {
            $err = $stmt->error ?: 'Could not create course';
            $stmt->close();
            return ['status'=>'error','message'=>$err];
        }
        $id = $this->conn->insert_id;
        $stmt->close();
        return ['status'=>'success','course_id'=>$id];
    }

    public function updateCourse($id, $data) {

        $updated = false;

        if (isset($data['code'])) {
            $val = trim($data['code']);
            $s = $this->conn->prepare("UPDATE courses SET code = ? WHERE course_id = ?");
            if (!$s) return ['status'=>'error','message'=>'DB error'];
            $s->bind_param('si', $val, $id);
            if (!$s->execute()) { $err = $s->error ?: 'Could not update code'; $s->close(); return ['status'=>'error','message'=>$err]; }
            $s->close(); $updated = true;
        }

        if (isset($data['name'])) {
            $val = trim($data['name']);
            $s = $this->conn->prepare("UPDATE courses SET name = ? WHERE course_id = ?");
            if (!$s) return ['status'=>'error','message'=>'DB error'];
            $s->bind_param('si', $val, $id);
            if (!$s->execute()) { $err = $s->error ?: 'Could not update name'; $s->close(); return ['status'=>'error','message'=>$err]; }
            $s->close(); $updated = true;
        }

        if (isset($data['level'])) {
            $val = (int)$data['level'];
            $s = $this->conn->prepare("UPDATE courses SET level = ? WHERE course_id = ?");
            if (!$s) return ['status'=>'error','message'=>'DB error'];
            $s->bind_param('ii', $val, $id);
            if (!$s->execute()) { $err = $s->error ?: 'Could not update level'; $s->close(); return ['status'=>'error','message'=>$err]; }
            $s->close(); $updated = true;
        }

        if (isset($data['semesters'])) {
            $semesters = $data['semesters'];
            $semJson = null;
            $semestersList = $this->normalizeSemesterList($semesters);
            if (!empty($semestersList)) {
                $semJson = json_encode($semestersList);
            }
            $s = $this->conn->prepare("UPDATE courses SET semesters = ? WHERE course_id = ?");
            if (!$s) return ['status'=>'error','message'=>'DB error'];
            $s->bind_param('si', $semJson, $id);
            if (!$s->execute()) { $err = $s->error ?: 'Could not update semesters'; $s->close(); return ['status'=>'error','message'=>$err]; }
            $s->close(); $updated = true;
        }

        if (isset($data['faculty_id'])) {
            $val = $data['faculty_id'] !== null ? (int)$data['faculty_id'] : null;
            if ($val !== null && !$this->facultyExists($val)) {
                return ['status'=>'error','message'=>'faculty_id is required and must be valid'];
            }
            $s = $this->conn->prepare("UPDATE courses SET faculty_id = ? WHERE course_id = ?");
            if (!$s) return ['status'=>'error','message'=>'DB error'];
            $s->bind_param('ii', $val, $id);
            if (!$s->execute()) { $err = $s->error ?: 'Could not update faculty'; $s->close(); return ['status'=>'error','message'=>$err]; }
            $s->close(); $updated = true;
        }

        if (in_array('module_leader_id', array_keys($data))) {

            $val = $data['module_leader_id'];
            if ($val === null || $val === '') {
                $s = $this->conn->prepare("UPDATE courses SET module_leader_id = NULL WHERE course_id = ?");
                if (!$s) return ['status'=>'error','message'=>'DB error'];
                $s->bind_param('i', $id);
                if (!$s->execute()) { $err = $s->error ?: 'Could not clear module leader'; $s->close(); return ['status'=>'error','message'=>$err]; }
                $s->close(); $updated = true;
            } else {
                $val = (int)$val;

                $check = $this->conn->prepare("SELECT role FROM users WHERE user_id = ? LIMIT 1");
                if ($check) {
                    $check->bind_param('i', $val);
                    $check->execute(); $role = null; $check->bind_result($role);
                    if ($check->fetch()) {
                        if ($role !== 'Module_Leader') { $check->close(); return ['status'=>'error','message'=>'Assigned module leader must have role Module_Leader']; }
                    } else { $check->close(); return ['status'=>'error','message'=>'Module leader user not found']; }
                    $check->close();
                }
                $s = $this->conn->prepare("UPDATE courses SET module_leader_id = ? WHERE course_id = ?");
                if (!$s) return ['status'=>'error','message'=>'DB error'];
                $s->bind_param('ii', $val, $id);
                if (!$s->execute()) { $err = $s->error ?: 'Could not set module leader'; $s->close(); return ['status'=>'error','message'=>$err]; }
                $s->close(); $updated = true;
            }
        }

        if (!$updated) return ['status'=>'error','message'=>'No fields to update'];
        return ['status'=>'success'];
    }

    public function deleteCourse($id) {
        $sql = "DELETE FROM courses WHERE course_id = ?";
        $stmt = $this->conn->prepare($sql);
        if (!$stmt) return ['status'=>'error','message'=>'Database error'];
        $stmt->bind_param('i', $id);
        if (!$stmt->execute()) {
            $err = $stmt->error ?: 'Could not delete course';
            $stmt->close();
            return ['status'=>'error','message'=>$err];
        }
        $stmt->close();
        return ['status'=>'success'];
    }

    public function addInstructorToCourse($courseId, $instructorId) {
        $sql = "INSERT IGNORE INTO course_instructors (course_id, instructor_id) VALUES (?, ?)";
        $stmt = $this->conn->prepare($sql);
        if (!$stmt) return ['status'=>'error','message'=>'DB error'];
        $stmt->bind_param('ii', $courseId, $instructorId);
        $res = $stmt->execute();
        $stmt->close();
        return $res ? ['status'=>'success'] : ['status'=>'error','message'=>'Could not add instructor'];
    }

    public function addStudentToCourse($courseId, $studentId) {
        $sql = "INSERT IGNORE INTO course_students (course_id, student_id) VALUES (?, ?)";
        $stmt = $this->conn->prepare($sql);
        if (!$stmt) return ['status'=>'error','message'=>'DB error'];
        $stmt->bind_param('ii', $courseId, $studentId);
        $res = $stmt->execute();
        $stmt->close();
        return $res ? ['status'=>'success'] : ['status'=>'error','message'=>'Could not add student'];
    }

    public function assignModuleLeader($courseId, $userId) {

        if ($userId === null || $userId === '') {
            $s = $this->conn->prepare("UPDATE courses SET module_leader_id = NULL WHERE course_id = ?");
            if (!$s) return ['status'=>'error','message'=>'DB error'];
            $s->bind_param('i', $courseId);
            $res = $s->execute();
            $s->close();
            return $res ? ['status'=>'success'] : ['status'=>'error','message'=>'Could not clear module leader'];
        }

        $userId = (int)$userId;

        $check = $this->conn->prepare("SELECT role FROM users WHERE user_id = ? LIMIT 1");
        if ($check) {
            $check->bind_param('i', $userId);
            $check->execute();
            $role = null;
            $check->bind_result($role);
            if ($check->fetch()) {
                if ($role !== 'Module_Leader') { $check->close(); return ['status'=>'error','message'=>'Assigned module leader must have role Module_Leader']; }
            } else { $check->close(); return ['status'=>'error','message'=>'Module leader user not found']; }
            $check->close();
        }

        $sql = "UPDATE courses SET module_leader_id = ? WHERE course_id = ?";
        $stmt = $this->conn->prepare($sql);
        if (!$stmt) return ['status'=>'error','message'=>'DB error'];
        $stmt->bind_param('ii', $userId, $courseId);
        $res = $stmt->execute();
        $stmt->close();
        return $res ? ['status'=>'success'] : ['status'=>'error','message'=>'Could not assign module leader'];
    }

    public function getGeneralStats() {
        $stats = [];
        $sql = "SELECT COUNT(*) FROM courses";
        $s = $this->conn->prepare($sql);
        $s->execute(); $cnt = null; $s->bind_result($cnt); $s->fetch(); $s->close(); $stats['total_courses'] = (int)$cnt;

        $sql = "SELECT COUNT(DISTINCT student_id) FROM course_students";
        $s = $this->conn->prepare($sql);
        $s->execute(); $cnt = null; $s->bind_result($cnt); $s->fetch(); $s->close(); $stats['total_enrolled_students'] = (int)$cnt;

        $sql = "SELECT COUNT(DISTINCT user_id) FROM (
                SELECT instructor_id AS user_id FROM course_instructors
                UNION
                SELECT module_leader_id AS user_id FROM courses WHERE module_leader_id IS NOT NULL
            ) AS all_instructors";
        $s = $this->conn->prepare($sql);
        $s->execute(); $cnt = null; $s->bind_result($cnt); $s->fetch(); $s->close(); $stats['total_instructors'] = (int)$cnt;

        return ['status'=>'success','stats'=>$stats];
    }

    public function getCourseStats($courseId) {
        $stats = [];
        $latestSemester = $this->getLatestCourseSemester($courseId);
        
        $sql = "SELECT COUNT(*) FROM course_students WHERE course_id = ?";
        $s = $this->conn->prepare($sql);
        $s->bind_param('i', $courseId);
        $s->execute(); $cnt = null; $s->bind_result($cnt); $s->fetch(); $s->close(); $stats['enrolled_students'] = (int)$cnt;

        $sql = "SELECT COUNT(DISTINCT user_id) FROM (
                SELECT instructor_id AS user_id FROM course_instructors WHERE course_id = ?
                UNION
                SELECT module_leader_id AS user_id FROM courses WHERE course_id = ? AND module_leader_id IS NOT NULL
            ) AS course_instructors_union";
        $s = $this->conn->prepare($sql);
        $s->bind_param('ii', $courseId, $courseId);
        $s->execute(); $cnt = null; $s->bind_result($cnt); $s->fetch(); $s->close(); $stats['instructors'] = (int)$cnt;

        $sql = "SELECT COUNT(*) FROM grade_appeals WHERE course_id = ?";
        $s = $this->conn->prepare($sql);
        $s->bind_param('i', $courseId);
        $s->execute(); $cnt = null; $s->bind_result($cnt); $s->fetch(); $s->close(); $stats['appeals'] = (int)$cnt;

        $sql = "SELECT COUNT(*) FROM grade_appeals WHERE course_id = ? AND status IN ('Pending', 'Under Review')";
        $s = $this->conn->prepare($sql);
        $s->bind_param('i', $courseId);
        $s->execute(); $cnt = null; $s->bind_result($cnt); $s->fetch(); $s->close(); $stats['open_appeals'] = (int)$cnt;

        $sql = "SELECT COUNT(*) FROM grade_appeals WHERE course_id = ? AND status = 'Resolved'";
        $s = $this->conn->prepare($sql);
        $s->bind_param('i', $courseId);
        $s->execute(); $cnt = null; $s->bind_result($cnt); $s->fetch(); $s->close(); $stats['closed_appeals'] = (int)$cnt;

        $stats['midterm_appeals'] = $this->countAppealsForSemester($courseId, $latestSemester, 'midterm', false);
        $stats['finals_appeals'] = $this->countAppealsForSemester($courseId, $latestSemester, 'final', false);
        $stats['midterm_open'] = $this->countAppealsForSemester($courseId, $latestSemester, 'midterm', true) > 0;
        $stats['finals_open'] = $this->countAppealsForSemester($courseId, $latestSemester, 'final', true) > 0;

        $latestSurvey = $this->getLatestSurveyForCourse($courseId);
        if ($latestSurvey === null) {
            $stats['satisfaction_rate'] = 0;
            $stats['satisfaction_source'] = 'latest_survey';
            $stats['latest_survey_title'] = null;
        } else {
            $stats['latest_survey_title'] = $latestSurvey['title'];
            $stats['satisfaction_rate'] = $this->getSurveySatisfactionRate((int)$latestSurvey['survey_id']);
            $stats['satisfaction_source'] = 'latest_survey';
        }

        return ['status'=>'success','stats'=>$stats];
    }
}

?>
