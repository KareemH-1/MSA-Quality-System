<?php

class LogoutController
{
    public function logout(): array
    {
        session_start();

        $_SESSION = [];

        setcookie(session_name(), '', time() - 3600, '/');

        session_destroy();

        return [
            'statusCode' => 200,
            'body' => [
                'status' => 'success',
                'message' => 'Logged out successfully',
            ],
        ];
    }
}