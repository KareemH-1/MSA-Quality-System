<?php

require_once __DIR__ . '/JsonView.php';
require_once __DIR__ . '/../Controller/FacultyController.php';

class FacultyView extends JsonView
{
    private FacultyController $controller;

    public function __construct()
    {
        $this->controller = new FacultyController();
    }

    public function handle(): void
    {
        header('Content-Type: application/json');

        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

        if ($method === 'GET') {
            $result = $this->controller->getFaculties();
            $this->respond(200, $result);
            return;
        }

        if ($method === 'POST') {
            $payload = $this->readJsonBody();
            $result = $this->controller->createFaculty($payload);

            if (($result['status'] ?? '') === 'success') {
                $this->respond(201, $result);
                return;
            }

            $this->respond(400, $result);
            return;
        }

        if ($method === 'DELETE') {
            $payload = $this->readJsonBody();
            $result = $this->controller->deleteFaculty($payload);

            if (($result['status'] ?? '') === 'success') {
                $this->respond(200, $result);
                return;
            }

            $this->respond(400, $result);
            return;
        }

        $this->respond(405, [
            'status' => 'error',
            'message' => 'Method not allowed',
        ]);
    }
}

$facultyView = new FacultyView();
$facultyView->handle();
