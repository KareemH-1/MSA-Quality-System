<?php

class SessionController
{
    public function getSession(): array
    {
        session_start();

        if (!empty($_SESSION['user_id']) && !empty($_SESSION['role'])) {
            return [
                'statusCode' => 200,
                'body' => [
                    'status' => 'success',
                    'user' => [
                        'user_id' => $_SESSION['user_id'],
                        'name' => $_SESSION['name'] ?? '',
                        'role' => $_SESSION['role'],
                    ],
                ],
            ];
        }

        return [
            'statusCode' => 200,
            'body' => [
                'status' => 'success',
                'user' => null,
            ],
        ];
    }
}