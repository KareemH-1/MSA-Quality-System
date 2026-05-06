<?php
session_start();
require_once 'JsonView.php';
require_once '../Controller/ManageCoursesController.php';

class ManageCoursesView extends JsonView
{
    private ManageCoursesController $controller;

    public function __construct()
    {
        $this->controller = new ManageCoursesController();
    }

    public function handle()
    {
        header('Content-Type: application/json');
        $method = $_SERVER['REQUEST_METHOD'];
        if (strtoupper($method) === 'OPTIONS') { http_response_code(200); exit; }

        $statusCode = 200;
        $result = null;

        if (strtoupper($method) === 'GET') {
            $q = $_GET ?? [];
            if (isset($q['get_type']) && $q['get_type'] === 'generalStats') {
                $result = $this->controller->getGeneralStats();

            } else if (isset($q['get_type']) && $q['get_type'] === 'courseStats') {
                $result = $this->controller->getCourseStats($q);

            } else if (isset($q['course_id'])) {

                $result = $this->controller->getCourse($q);
            } else {

                $body = $this->readJsonBody();
                $body['page'] = isset($q['page']) ? (int)$q['page'] : ($body['page'] ?? 1);
                $body['perPage'] = isset($q['perPage']) ? (int)$q['perPage'] : ($body['perPage'] ?? 10);
                $body['search'] = $q['search'] ?? ($body['search'] ?? null);
                $result = $this->controller->listCourses($body);

            }
        } else if (strtoupper($method) === 'POST') {

            $payload = $this->readJsonBody();
            $action = $payload['action'] ?? 'create';
            if ($action === 'create') $result = $this->controller->createCourse($payload);
            else if ($action === 'addInstructor') $result = $this->controller->addInstructor($payload);
            else if ($action === 'addStudent') $result = $this->controller->addStudent($payload);
            else if ($action === 'assignModuleLeader') $result = $this->controller->assignModuleLeader($payload);
            else $result = ['status'=>'error','message'=>'Unknown action'];

        } else if (strtoupper($method) === 'PUT') {

            $payload = $this->readJsonBody();
            $result = $this->controller->updateCourse($payload);

        } else if (strtoupper($method) === 'DELETE') {

            $payload = $this->readJsonBody();
            $result = $this->controller->deleteCourse($payload);
            
        } else {
            $statusCode = 405;
            $result = ['status' => 'error', 'message' => 'Method not allowed'];
        }

        if (!is_array($result)) $result = ['result' => $result];
        $this->respond($statusCode, $result);
    }
}

$view = new ManageCoursesView();
$view->handle();

?>
