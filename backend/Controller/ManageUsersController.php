<?php

class ManageUsersController
{
    private $model;
    public function __construct()
    {
        require_once '../Model/Database.php';
        require_once '../Model/ManageUsers.php';
        $dba = new Database();
        $db = $dba->getConnection();
        $this->model = new ManageUsers($db);
    }

    private function decontructDataByRole($data)
    {
        $role = $data['role'] ?? null;
        if ($role === 'ModuleLeader') {
            $role = 'Module_Leader';
        }
        $rd = $data['role_details'] ?? [];
        if ($role === 'Student') {
            return [
                'name' => $data['name'] ?? null,
                'email' => $data['email'] ?? null,
                'password' => $data['password'] ?? null,
                'role' => $role,
                "faculty" => $rd["faculty"] ?? null,
                "level" => $rd["level"] ?? null,
                "courses" => $rd["courses"] ?? null,
            ];
        } else if ($role === 'Instructor') {
            return [
                'name' => $data['name'] ?? null,
                'email' => $data['email'] ?? null,
                'password' => $data['password'] ?? null,
                'role' => $role,
                "faculty" => $rd["faculty"] ?? null,
                "courses" => $rd["courses"] ?? null,
             ];
        } else if($role === 'Module_Leader') {
            return [
                'name' => $data['name'] ?? null,
                'email' => $data['email'] ?? null,
                'password' => $data['password'] ?? null,
                'role' => $role,
                "faculty" => $rd["faculty"] ?? null,
                "courses" => $rd["courses"] ?? null,
                "Managed_Courses" => $rd["Managed_Courses"] ?? null,
            ];
        }
        else if($role === "Dean"){
            return [
                'name' => $data['name'] ?? null,
                'email' => $data['email'] ?? null,
                'password' => $data['password'] ?? null,
                'role' => $role,
                "faculty" => $rd["faculty"] ?? null,
            ];
        }
        else if($role === "QA_Admin"){
            return [
                'name' => $data['name'] ?? null,
                'email' => $data['email'] ?? null,
                'password' => $data['password'] ?? null,
                'role' => $role,
            ];
        }
        else if($role === "Admin"){
            return [
                'name' => $data['name'] ?? null,
                'email' => $data['email'] ?? null,
                'password' => $data['password'] ?? null,
                'role' => $role,
            ];
        }
        else {
            return [
                'name' => $data['name'] ?? null,
                'email' => $data['email'] ?? null,
                'password' => $data['password'] ?? null,
                'role' => $role,
            ];
        }
    }

    public function createUser($userData)
    {
        if(isset($userData["bulk"]) && $userData["bulk"] == true){
            $results = [];
            foreach($userData["users"] as $user){
                $user = $this->decontructDataByRole($user);
                $results[] = $this->model->createUser($user["name"], $user["email"], $user["password"], $user["role"], $user["faculty"] ?? null, $user["level"] ?? null, $user["courses"] ?? null, $user["Managed_Courses"] ?? null);
            }
            return $results;
        }
        else {
            $userData = $this->decontructDataByRole($userData);
            return $this->model->createUser($userData["name"], $userData["email"], $userData["password"], $userData["role"], $userData["faculty"] ?? null, $userData["level"] ?? null, $userData["courses"] ?? null, $userData["Managed_Courses"] ?? null);
        }
    }

    public function deleteUser($userData)
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $email = $userData['email'] ?? null;
        if (!$email) {
            return ['status' => 'error', 'message' => 'Email is required'];
        }

        $currentRole = $_SESSION['role'] ?? null;
        $currentEmail = $_SESSION['email'] ?? null;

        if (!$currentRole || !$currentEmail) {
            return [
                'statusCode' => 401,
                'body' => ['status' => 'error', 'message' => 'Not authenticated'],
            ];
        }

        $targetRole = $this->model->getUserRoleByEmail($email);
        if ($targetRole === null) {
            return [
                'statusCode' => 404,
                'body' => ['status' => 'error', 'message' => 'User not found'],
            ];
        }

        if ($currentRole === 'Admin' && $targetRole === 'Admin') {
            return [
                'statusCode' => 403,
                'body' => ['status' => 'error', 'message' => 'Admins cannot delete another admin'],
            ];
        }

        return [
            'statusCode' => 200,
            'body' => $this->model->deleteUser($email),
        ];
    }

    public function updateUser($userData)
    {
        $userData = $this->decontructDataByRole($userData);
        return $this->model->updateUser($userData["email"], $userData["name"], $userData["password"]);
    }

    public function getUsers($data)
    {
        $getType = $data["get_type"] ?? null;
        if($getType == "getFacultyStatus"){

            return $this->model->getFacultyStatus($data["faculty"] ?? null);
        }
        else if($getType == "getCourseStatus"){
            return $this->model->getCourseStatus($data["course"] ?? null);
        }
        else{
            return $this->model->getUsers();
        }
    }
}
?>
