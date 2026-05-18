<?php

require_once '../Service/Log.php';

class ManageUsersController
{
    private $model;
    private $log;
    
    public function __construct()
    {
        require_once '../Model/Database.php';
        require_once '../Model/ManageUsers.php';
        $dba = new Database();
        $db = $dba->getConnection();
        $this->model = new ManageUsers($db);
        $this->log = new Log();
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
            $count = 0;
            foreach($userData["users"] as $user){
                $user = $this->decontructDataByRole($user);
                $result = $this->model->createUser($user["name"], $user["email"], $user["password"], $user["role"], $user["faculty"] ?? null, $user["level"] ?? null, $user["courses"] ?? null, $user["Managed_Courses"] ?? null);
                $results[] = $result;
                if ($result['status'] === 'success') {
                    $count++;
                    $this->log->logInfo("User created in bulk - Email: {$user['email']}, Role: {$user['role']}");
                } else {
                    $this->log->logError("Bulk user creation failed - Email: {$user['email']}, Error: {$result['message']}");
                }
            }
            $this->log->logSecurity("Bulk user creation completed - {$count} users created out of " . count($userData["users"]));
            return $results;
        }
        else {
            $userData = $this->decontructDataByRole($userData);
            $result = $this->model->createUser($userData["name"], $userData["email"], $userData["password"], $userData["role"], $userData["faculty"] ?? null, $userData["level"] ?? null, $userData["courses"] ?? null, $userData["Managed_Courses"] ?? null);
            if ($result['status'] === 'success') {
                $this->log->logSecurity("User created - Email: {$userData['email']}, Role: {$userData['role']}");
            } else {
                $this->log->logError("User creation failed - Email: {$userData['email']}, Error: {$result['message']}");
            }
            return $result;
        }
    }

    public function deleteUser($userData)
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $email = $userData['email'] ?? null;
        if (!$email) {
            $this->log->logSecurity("User deletion attempt without email");
            return ['status' => 'error', 'message' => 'Email is required'];
        }

        $currentRole = $_SESSION['role'] ?? null;
        $currentEmail = $_SESSION['email'] ?? null;

        if (!$currentRole || !$currentEmail) {
            $this->log->logSecurity("Unauthorized user deletion attempt");
            return [
                'statusCode' => 401,
                'body' => ['status' => 'error', 'message' => 'Not authenticated'],
            ];
        }

        $targetRole = $this->model->getUserRoleByEmail($email);
        if ($targetRole === null) {
            $this->log->logSecurity("User deletion attempt for non-existent user: {$email}");
            return [
                'statusCode' => 404,
                'body' => ['status' => 'error', 'message' => 'User not found'],
            ];
        }

        if ($currentRole === 'Admin' && $targetRole === 'Admin') {
            $this->log->logSecurity("Admin attempted to delete another admin - Deleted by: {$currentEmail}, Target: {$email}");
            return [
                'statusCode' => 403,
                'body' => ['status' => 'error', 'message' => 'Admins cannot delete another admin'],
            ];
        }

        $result = $this->model->deleteUser($email);
        if ($result['status'] === 'success') {
            $this->log->logSecurity("User deleted - Email: {$email}, Role: {$targetRole}, Deleted by: {$currentEmail}");
        } else {
            $this->log->logError("User deletion failed - Email: {$email}, Error: {$result['message']}");
        }

        return [
            'statusCode' => 200,
            'body' => $result,
        ];
    }

    public function updateUser($userData)
    {
        $userData = $this->decontructDataByRole($userData);
        $result = $this->model->updateUser($userData["email"], $userData["name"], $userData["password"]);
        if ($result['status'] === 'success') {
            $this->log->logSecurity("User updated - Email: {$userData['email']}, Role: {$userData['role']}");
        } else {
            $this->log->logError("User update failed - Email: {$userData['email']}, Error: {$result['message']}");
        }
        return $result;
    }

    public function getUsers($data)
    {
        $getType = $data["get_type"] ?? null;
        if($getType == "getFacultyStatus"){
            $faculty = $data["faculty"] ?? null;
            $this->log->logInfo("Faculty status retrieved for faculty: {$faculty}");
            return $this->model->getFacultyStatus($faculty);
        }
        else if($getType == "getCourseStatus"){
            $course = $data["course"] ?? null;
            $this->log->logInfo("Course status retrieved for course: {$course}");
            return $this->model->getCourseStatus($course);
        }
        else{
            $this->log->logInfo("All users retrieved");
            return $this->model->getUsers();
        }
    }
}
?>
