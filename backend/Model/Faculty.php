<?php

require_once 'Database.php';

class Faculty
{
    private $conn;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    public function getFaculties(): array
    {
        $sql = "SELECT faculty_id, name FROM faculties ORDER BY name ASC";

        $stmt = $this->conn->prepare($sql);
        if (!$stmt) {
            return ['status' => 'error', 'message' => 'Database error: ' . $this->conn->error];
        }

        $stmt->execute();
        $facultyId = null;
        $name = null;
        $stmt->bind_result($facultyId, $name);

        $facultyRows = [];
        while ($stmt->fetch()) {
            $facultyRows[] = [
                'id' => $facultyId,
                'name' => $name,
            ];
        }

        $stmt->close();

        $faculties = [];
        foreach ($facultyRows as $facultyRow) {
            $facultyId = (int)$facultyRow['id'];

            $courseCount = 0;
            $courseSql = "SELECT COUNT(*) FROM courses WHERE faculty_id = ?";
            $courseStmt = $this->conn->prepare($courseSql);
            if ($courseStmt) {
                $courseStmt->bind_param('i', $facultyId);
                $courseStmt->execute();
                $countValue = null;
                $courseStmt->bind_result($countValue);
                if ($courseStmt->fetch()) {
                    $courseCount = (int)$countValue;
                }
                $courseStmt->close();
            }

            $studentCount = 0;
            $studentSql = "SELECT COUNT(*) FROM users WHERE faculty_id = ? AND role = 'Student'";
            $studentStmt = $this->conn->prepare($studentSql);
            if ($studentStmt) {
                $studentStmt->bind_param('i', $facultyId);
                $studentStmt->execute();
                $countValue = null;
                $studentStmt->bind_result($countValue);
                if ($studentStmt->fetch()) {
                    $studentCount = (int)$countValue;
                }
                $studentStmt->close();
            }

            $instructorCount = 0;
            $instructorSql = "SELECT COUNT(*) FROM users WHERE faculty_id = ? AND role = 'Instructor'";
            $instructorStmt = $this->conn->prepare($instructorSql);
            if ($instructorStmt) {
                $instructorStmt->bind_param('i', $facultyId);
                $instructorStmt->execute();
                $countValue = null;
                $instructorStmt->bind_result($countValue);
                if ($instructorStmt->fetch()) {
                    $instructorCount = (int)$countValue;
                }
                $instructorStmt->close();
            }

            $faculties[] = [
                'id' => $facultyRow['id'],
                'name' => $facultyRow['name'],
                'courseCount' => $courseCount,
                'studentCount' => $studentCount,
                'instructorCount' => $instructorCount,
            ];
        }

        return ['status' => 'success', 'faculties' => $faculties];
    }

    public function createFaculty(string $name): array
    {
        $facultyName = trim($name);
        if ($facultyName === '') {
            return ['status' => 'error', 'message' => 'Faculty name is required'];
        }

        $sql = "INSERT INTO faculties (name) VALUES (?)";
        $stmt = $this->conn->prepare($sql);
        if (!$stmt) {
            return ['status' => 'error', 'message' => 'Database error: ' . $this->conn->error];
        }

        $stmt->bind_param('s', $facultyName);
        if (!$stmt->execute()) {
            $message = 'Could not create faculty';
            if (!empty($stmt->error)) {
                $message = $stmt->error;
            }

            $stmt->close();
            return ['status' => 'error', 'message' => $message];
        }

        $facultyId = $this->conn->insert_id;
        $stmt->close();

        return [
            'status' => 'success',
            'faculty' => [
                'id' => $facultyId,
                'name' => $facultyName,
                'courseCount' => 0,
                'studentCount' => 0,
                'instructorCount' => 0,
            ],
        ];
    }

    public function deleteFaculty(int $facultyId): array
    {
        if ($facultyId <= 0) {
            return ['status' => 'error', 'message' => 'Faculty id is required'];
        }

        $checkSql = "SELECT name FROM faculties WHERE faculty_id = ? LIMIT 1";
        $checkStmt = $this->conn->prepare($checkSql);
        if (!$checkStmt) {
            return ['status' => 'error', 'message' => 'Database error: ' . $this->conn->error];
        }

        $checkStmt->bind_param('i', $facultyId);
        $checkStmt->execute();
        $facultyName = null;
        $checkStmt->bind_result($facultyName);

        if (!$checkStmt->fetch()) {
            $checkStmt->close();
            return ['status' => 'error', 'message' => 'Faculty not found'];
        }

        $checkStmt->close();

        $deleteSql = "DELETE FROM faculties WHERE faculty_id = ?";
        $deleteStmt = $this->conn->prepare($deleteSql);
        if (!$deleteStmt) {
            return ['status' => 'error', 'message' => 'Database error: ' . $this->conn->error];
        }

        $deleteStmt->bind_param('i', $facultyId);
        if (!$deleteStmt->execute()) {
            $message = 'Could not delete faculty';
            if (!empty($deleteStmt->error)) {
                $message = $deleteStmt->error;
            }

            $deleteStmt->close();
            return ['status' => 'error', 'message' => $message];
        }

        $deleteStmt->close();

        return [
            'status' => 'success',
            'message' => 'Faculty deleted',
            'faculty' => [
                'id' => $facultyId,
                'name' => $facultyName,
            ],
        ];
    }
}

?>