<?php

class ManageCoursesController
{
    private $model;

    public function __construct()
    {
        require_once '../Model/Database.php';
        require_once '../Model/Course.php';

        $database = new Database();
        $this->model = new Course($database->getConnection());
    }

    public function listCourses($data)
    {
        $page = isset($data['page']) ? (int)$data['page'] : 1;
        $perPage = isset($data['perPage']) ? (int)$data['perPage'] : 10;
        $search = $data['search'] ?? null;
        return $this->model->getCourses($page, $perPage, $search);
    }

    public function getCourse($data)
    {
        $id = isset($data['course_id']) ? (int)$data['course_id'] : null;
        if (!$id) return ['status' => 'error', 'message' => 'course_id required'];
        return $this->model->getCourseById($id);
    }

    public function createCourse($data)
    {
        return $this->model->createCourse($data);
    }

    public function updateCourse($data)
    {
        $id = isset($data['course_id']) ? (int)$data['course_id'] : null;
        if (!$id) return ['status' => 'error', 'message' => 'course_id required'];
        return $this->model->updateCourse($id, $data);
    }

    public function deleteCourse($data)
    {
        $id = isset($data['course_id']) ? (int)$data['course_id'] : null;
        if (!$id) return ['status' => 'error', 'message' => 'course_id required'];
        return $this->model->deleteCourse($id);
    }

    public function addInstructor($data)
    {
        $courseId = (int)($data['course_id'] ?? 0);
        $instructorId = (int)($data['instructor_id'] ?? 0);
        if (!$courseId || !$instructorId) return ['status' => 'error', 'message' => 'course_id and instructor_id required'];
        return $this->model->addInstructorToCourse($courseId, $instructorId);
    }

    public function addStudent($data)
    {
        $courseId = (int)($data['course_id'] ?? 0);
        $studentId = (int)($data['student_id'] ?? 0);
        if (!$courseId || !$studentId) return ['status' => 'error', 'message' => 'course_id and student_id required'];
        return $this->model->addStudentToCourse($courseId, $studentId);
    }

    public function assignModuleLeader($data)
    {
        $courseId = (int)($data['course_id'] ?? 0);
        $userId = isset($data['user_id']) ? (int)$data['user_id'] : null;
        if (!$courseId) return ['status' => 'error', 'message' => 'course_id required'];
        return $this->model->assignModuleLeader($courseId, $userId);
    }

    public function getGeneralStats()
    {
        return $this->model->getGeneralStats();
    }

    public function getCourseStats($data)
    {
        $courseId = (int)($data['course_id'] ?? 0);
        if (!$courseId) return ['status' => 'error', 'message' => 'course_id required'];
        return $this->model->getCourseStats($courseId);
    }
}

?>
