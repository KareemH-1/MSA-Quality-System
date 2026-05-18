<?php

require_once '../Service/Log.php';

class LogoutController
{
    private Log $log;

    public function __construct()
    {
        $this->log = new Log();
    }

    public function logout(): array
    {
        session_start();

        $userId = $_SESSION['user_id'] ?? null;
        $userName = $_SESSION['name'] ?? null;
        $userRole = $_SESSION['role'] ?? null;

        $_SESSION = [];

        setcookie(session_name(), '', time() - 3600, '/');

        session_destroy();

        if ($userId) {
            $this->log->logSecurity("User logout: {$userName} (ID: {$userId}) with role: {$userRole}");
        } else {
            $this->log->logInfo("Logout attempt without active session");
        }

        return [
            'statusCode' => 200,
            'body' => [
                'status' => 'success',
                'message' => 'Logged out successfully',
            ],
        ];
    }
}