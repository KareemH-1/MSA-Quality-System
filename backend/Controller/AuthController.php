<?php

require_once '../Model/Database.php';
require_once '../Model/User.php';

class AuthController
{
    public function login(array $data): array
    {
        if (empty($data['email']) || empty($data['password'])) {
            return [
                'statusCode' => 400,
                'body' => [
                    'status' => 'error',
                    'message' => 'Email and Password are required',
                ],
            ];
        }

        $database = new Database();
        $db = $database->getConnection();
        $user = new User($db);

        $foundUser = $user->login($data['email'], $data['password']);

        if (!$foundUser) {
            return [
                'statusCode' => 401,
                'body' => [
                    'status' => 'error',
                    'message' => 'Invalid Email or Password',
                ],
            ];
        }

            $lifetime = 0;
            if (!empty($data['rememberMe'])) {
                $lifetime = 60 * 60 * 24 * 30;
            }

        session_set_cookie_params([
            'lifetime' => $lifetime,
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);

        session_start();
        $_SESSION['user_id'] = $foundUser['user_id'];
        $_SESSION['name'] = $foundUser['name'];
        $_SESSION['role'] = $foundUser['role'];

        return [
            'statusCode' => 200,
            'body' => [
                'status' => 'success',
                'user' => [
                    'name' => $foundUser['name'],
                    'role' => $foundUser['role'],
                ],
            ],
        ];
    }
}