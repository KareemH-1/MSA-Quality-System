<?php 

session_start();
require_once 'JsonView.php';
require_once '../Controller/ManageUsersController.php';
class ManageUsersView extends JsonView
{
    private ManageUsersController $controller;
    public function __construct()
    {
        $this->controller = new ManageUsersController();
    }

    public function manageUsers()
    {
        header('Content-Type: application/json');
        
        $method = $_SERVER['REQUEST_METHOD'];

        if (strtoupper($method) === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        

        $statusCode = 200;
        $result = null;

        if (strtoupper($method) == "POST") {
            $result = $this->controller->createUser($this->readJsonBody());
        }
        else if (strtoupper($method) == "DELETE") {
            $result = $this->controller->deleteUser($this->readJsonBody());
        }
        else if (strtoupper($method) == "PUT") {
            $result = $this->controller->updateUser($this->readJsonBody());
        }
        else if (strtoupper($method) == "GET") {
            $result = $this->controller->getUsers($this->readJsonBody());
        }
        else {
            $statusCode = 405;
            $result = ['status' => 'error', 'message' => 'Method not allowed'];
        }


        if (!is_array($result)) {
            $result = ['result' => $result];
        }

        $this->respond($statusCode, $result);
    }
}
?>
<?php
$manageUsersView = new ManageUsersView();
$manageUsersView->manageUsers();
?>