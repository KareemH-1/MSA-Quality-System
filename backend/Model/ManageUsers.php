<?php
require_once 'Database.php';
require_once __DIR__ . '/../Service/NotificationService.php';

class ManageUsers {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    private function getFacultyId($faculty) {
        if ($faculty === null) return null;
        if (is_numeric($faculty)) return (int)$faculty;

        $sql = "SELECT faculty_id FROM faculties WHERE name = ? LIMIT 1";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('s', $faculty);
        $stmt->execute();
        $fid = null;
        $stmt->bind_result($fid);
        if ($stmt->fetch()) {
            $stmt->close();
            return $fid;
        }
        $stmt->close();

        $sql = "INSERT INTO faculties (name) VALUES (?)";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('s', $faculty);
        if ($stmt->execute()) {
            $id = $this->conn->insert_id;
            $stmt->close();
            return $id;
        }
        $stmt->close();
        return null;
    }

    private function GetCourseId($course) {
        if ($course === null) return null;
        if (is_numeric($course)) return (int)$course;

        $sql = "SELECT course_id FROM courses WHERE code = ? OR name = ? LIMIT 1";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('ss', $course, $course);
        $stmt->execute();
        $cid = null;
        $stmt->bind_result($cid);
        if ($stmt->fetch()) {
            $stmt->close();
            return $cid;
        }
        $stmt->close();
        return null;
    }

    public function sendWelcomeNotification(int $userId, string $name): void {
        $notificationService = NotificationService::create($this->conn);
        $welcomeMessage = "Your account has been created successfully, {$name}. Please sign in at " . APP_URL . ".";
        $notificationService->send($welcomeMessage, $userId, 'system', null, true, true);
    }
    public function createUser($name, $email, $password, $role, $faculty = null, $level = null, $courses = null, $managedCourses = null) {
        $this->conn->begin_transaction();
        try {
            $facultyId = $this->getFacultyId($faculty);

            if ($role === 'Dean') {
                $sql = "SELECT user_id FROM users WHERE role = 'Dean' AND faculty_id = ? LIMIT 1";
                $stmt = $this->conn->prepare($sql);
                $stmt->bind_param('i', $facultyId);
                $stmt->execute();
                $existingDean = null;
                $stmt->bind_result($existingDean);
                if ($stmt->fetch()) {
                    $stmt->close();
                    $this->conn->rollback();
                    return ['status' => 'error', 'message' => 'Faculty already has a dean'];
                }
                $stmt->close();
            }

            $hashed = password_hash($password, PASSWORD_DEFAULT);
            $sql = "INSERT INTO users (name, email, password, role, level, faculty_id) VALUES (?, ?, ?, ?, ?, ? )";
            $stmt = $this->conn->prepare($sql);
            $lvl = null;
            if ($level !== null) {
                $lvl = (int)$level;
            }

            $fid = null;
            if ($facultyId !== null) {
                $fid = $facultyId;
            }
            $stmt->bind_param('ssssii', $name, $email, $hashed, $role, $lvl, $fid);
            if (!$stmt->execute()) {
                $stmt->close();
                $this->conn->rollback();
                return ['status' => 'error', 'message' => 'Could not create user'];
            }
            $newUserId = $this->conn->insert_id;
            $stmt->close();

            // handle courses associations
            if (is_array($courses)) {
                foreach ($courses as $c) {
                    $cid = $this->GetCourseId($c);
                    if ($cid === null) continue;
                    if ($role === 'Student') {
                        $sql = "INSERT IGNORE INTO course_students (course_id, student_id) VALUES (?, ?)";
                        $s = $this->conn->prepare($sql);
                        $s->bind_param('ii', $cid, $newUserId);
                        $s->execute();
                        $s->close();
                    } else if ($role === 'Instructor') {
                        $sql = "INSERT IGNORE INTO course_instructors (course_id, instructor_id) VALUES (?, ?)";
                        $s = $this->conn->prepare($sql);
                        $s->bind_param('ii', $cid, $newUserId);
                        $s->execute();
                        $s->close();
                    }
                }
            }

            if ($role === 'Module_Leader' && is_array($managedCourses)) {
                foreach ($managedCourses as $mc) {
                    $cid = $this->GetCourseId($mc);
                    if ($cid === null) continue;
                    $sql = "SELECT module_leader_id FROM courses WHERE course_id = ? LIMIT 1";
                    $s = $this->conn->prepare($sql);
                    $s->bind_param('i', $cid);
                    $s->execute();
                    $s->bind_result($existingLeader);
                    if ($s->fetch() && $existingLeader !== null) {
                        $s->close();
                        $this->conn->rollback();
                        return ['status' => 'error', 'message' => "Course already has a module leader (course_id={$cid})"];
                    }
                    $s->close();

                    $sql = "UPDATE courses SET module_leader_id = ? WHERE course_id = ?";
                    $u = $this->conn->prepare($sql);
                    $u->bind_param('ii', $newUserId, $cid);
                    $u->execute();
                    $u->close();
                }
            }

            $this->conn->commit();
            $this->sendWelcomeNotification($newUserId, $name);
            return ['status' => 'success', 'user_id' => $newUserId];
        } catch (Exception $e) {
            $this->conn->rollback();
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    public function deleteUser($email) {
        if (!$email || empty(trim($email))) {
            return ['status' => 'error', 'message' => 'Email is required'];
        }
        
        try {
            $sql = "DELETE FROM users WHERE email = ?";
            $stmt = $this->conn->prepare($sql);
            if (!$stmt) {
                return ['status' => 'error', 'message' => 'Database error: ' . $this->conn->error];
            }
            
            $stmt->bind_param('s', $email);
            $result = $stmt->execute();
            $stmt->close();
            
            if ($result) {
                return ['status' => 'success', 'message' => 'User deleted'];
            } else {
                return ['status' => 'error', 'message' => 'Delete failed: ' . $this->conn->error];
            }
        } catch (Exception $e) {
            return ['status' => 'error', 'message' => 'Error: ' . $e->getMessage()];
        }
    }

    public function getUserRoleByEmail($email) {
        if (!$email || empty(trim($email))) {
            return null;
        }

        $sql = "SELECT role FROM users WHERE email = ? LIMIT 1";
        $stmt = $this->conn->prepare($sql);
        if (!$stmt) {
            return null;
        }

        $stmt->bind_param('s', $email);
        $stmt->execute();
        $role = null;
        $stmt->bind_result($role);

        if ($stmt->fetch()) {
            $stmt->close();
            return $role;
        }

        $stmt->close();
        return null;
    }

    public function updateUser($email, $name, $password) {
        $hashed = password_hash($password, PASSWORD_DEFAULT);
        $sql = "UPDATE users SET name = ?, password = ? WHERE email = ?";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('sss', $name, $hashed, $email);
        $res = $stmt->execute();
        $stmt->close();
        if ($res) {
            return ['status' => 'success'];
        }

        return ['status' => 'error', 'message' => 'Failed to update user'];
    }

    public function getUsers() {
        $users = [];
        $sql = "SELECT u.user_id, u.name, u.email, u.role, u.level, f.name as faculty_name
                FROM users u
                LEFT JOIN faculties f ON u.faculty_id = f.faculty_id";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        $id = null;
        $name = null;
        $email = null;
        $role = null;
        $level = null;
        $faculty_name = null;
        $stmt->bind_result($id, $name, $email, $role, $level, $faculty_name);
        while ($stmt->fetch()) {
            $users[] = [
                'id' => $id,
                'username' => $name,
                'email' => $email,
                'role' => $role,
                'level' => $level,
                'Faculty' => $faculty_name,
            ];
        }
        $stmt->close();

        // Get all courses at once (avoid N+1 queries)
        $allCourses = [];
        $managedCoursesByUser = [];
        $csql = "SELECT faculty_id, code, name, module_leader_id FROM courses";
        $cstmt = $this->conn->prepare($csql);
        $cstmt->execute();
        $fid = null;
        $ccode = null;
        $cname = null;
        $cmoduleLeaderId = null;
        $cstmt->bind_result($fid, $ccode, $cname, $cmoduleLeaderId);
        while ($cstmt->fetch()) {
            if ($fid === null) {
                if ($cmoduleLeaderId !== null) {
                    $leaderKey = (string)$cmoduleLeaderId;
                    if (!isset($managedCoursesByUser[$leaderKey])) {
                        $managedCoursesByUser[$leaderKey] = [];
                    }
                    $managedCoursesByUser[$leaderKey][] = ['code' => $ccode, 'name' => $cname];
                }
                continue;
            }

            $facultyKey = (string)$fid;
            if (!isset($allCourses[$facultyKey])) {
                $allCourses[$facultyKey] = [];
            }
            $allCourses[$facultyKey][] = ['code' => $ccode, 'name' => $cname];

            if ($cmoduleLeaderId !== null) {
                $leaderKey = (string)$cmoduleLeaderId;
                if (!isset($managedCoursesByUser[$leaderKey])) {
                    $managedCoursesByUser[$leaderKey] = [];
                }
                $managedCoursesByUser[$leaderKey][] = ['code' => $ccode, 'name' => $cname];
            }
        }
        $cstmt->close();

        $faculties = [];
        $sql = "SELECT f.faculty_id, f.name, u.user_id as dean_id
                FROM faculties f
                LEFT JOIN users u ON u.role = 'Dean' AND u.faculty_id = f.faculty_id";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        $fid = null;
        $fname = null;
        $deanId = null;
        $stmt->bind_result($fid, $fname, $deanId);
        while ($stmt->fetch()) {
            if ($fid === null || $fname === null) {
                continue;
            }

            $facultyKey = (string)$fid;
            $facultyName = (string)$fname;
            $courses = $allCourses[$facultyKey] ?? [];
            $faculties[] = [
                'name' => $facultyName,
                'deanId' => $deanId,
                'courses' => $courses,
                'courseCount' => count($courses),
            ];
        }
        $stmt->close();

        for ($i = 0; $i < count($users); $i++) {
            $user = $users[$i];
            $userIdKey = (string)$user['id'];
            $managedCourses = $managedCoursesByUser[$userIdKey] ?? [];
            $managedCourseCount = count($managedCourses);

            $users[$i]['managedCourses'] = $managedCourses;
            $users[$i]['managedCourseCount'] = $managedCourseCount;
        }

        return ['users' => $users, 'faculties' => $faculties];
    }

    public function getFacultyStatus($faculty) {
        $fid = $this->getFacultyId($faculty);
        if ($fid === null) return ['hasDean' => false];
        $sql = "SELECT user_id FROM users WHERE role = 'Dean' AND faculty_id = ? LIMIT 1";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('i', $fid);
        $stmt->execute();
        $did = null;
        $stmt->bind_result($did);
        $has = false;
        if ($stmt->fetch()) {
            $has = true;
        }
        $stmt->close();
        return ['hasDean' => $has, 'faculty_id' => $fid];
    }

    public function getCourseStatus($course) {
        $cid = $this->GetCourseId($course);
        if ($cid === null) return ['hasModuleLeader' => false];
        $sql = "SELECT module_leader_id FROM courses WHERE course_id = ? LIMIT 1";
        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param('i', $cid);
        $stmt->execute();
        $ml = null;
        $stmt->bind_result($ml);
        $has = false;
        if ($stmt->fetch() && $ml !== null) $has = true;
        $stmt->close();
        return ['hasModuleLeader' => $has, 'course_id' => $cid];
    }
}

?>
