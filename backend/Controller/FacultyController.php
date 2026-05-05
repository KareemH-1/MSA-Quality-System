<?php

class FacultyController
{
    private $model;

    public function __construct()
    {
        require_once '../Model/Database.php';
        require_once '../Model/Faculty.php';

        $database = new Database();
        $this->model = new Faculty($database->getConnection());
    }

    public function getFaculties(): array
    {
        return $this->model->getFaculties();
    }

    public function createFaculty(array $data): array
    {
        $facultyName = $data['name'] ?? $data['faculty_name'];
        return $this->model->createFaculty((string)$facultyName);
    }

    public function deleteFaculty(array $data): array
    {
        $facultyId = (int)($data['id']);
        return $this->model->deleteFaculty($facultyId);
    }
}

?>