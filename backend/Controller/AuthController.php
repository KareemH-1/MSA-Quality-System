<?php

require_once '../Model/Database.php';
require_once '../Model/User.php';

class AuthController
{
    private function hasUppercase($str) {
        for ($i = 0; $i < strlen($str); $i++) {
            if ($str[$i] >= 'A' && $str[$i] <= 'Z') return true;
        }
        return false;
    }

    private function hasLowercase($str) {
        for ($i = 0; $i < strlen($str); $i++) {
            if ($str[$i] >= 'a' && $str[$i] <= 'z') return true;
        }
        return false;
    }

    private function hasDigit($str) {
        for ($i = 0; $i < strlen($str); $i++) {
            if ($str[$i] >= '0' && $str[$i] <= '9') return true;
        }
        return false;
    }

    private function hasSpecialChar($str) {
        $specialChars = '!@#$%^&*()_+-=[]{};\':\",./<>?\\|`~';
        for ($i = 0; $i < strlen($str); $i++) {
            if (strpos($specialChars, $str[$i]) !== false) return true;
        }
        return false;
    }

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
        $_SESSION['email'] = $data['email'];
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

    public function resetPassword(array $data): array
    {
        if (empty($data['token']) || empty($data['password']) || empty($data['confirmPassword'])) {
            return [
                'statusCode' => 400,
                'body' => [
                    'status' => 'error',
                    'message' => 'Token, password, and confirm password are required',
                ],
            ];
        }

        $password = $data['password'];
        
        if (strlen($password) < 8) {
            return [
                'statusCode' => 400,
                'body' => [
                    'status' => 'error',
                    'message' => 'Password must be at least 8 characters long',
                ],
            ];
        }

        if (!$this->hasUppercase($password)) {
            return [
                'statusCode' => 400,
                'body' => [
                    'status' => 'error',
                    'message' => 'Password must contain at least one uppercase letter',
                ],
            ];
        }

        if (!$this->hasLowercase($password)) {
            return [
                'statusCode' => 400,
                'body' => [
                    'status' => 'error',
                    'message' => 'Password must contain at least one lowercase letter',
                ],
            ];
        }

        if (!$this->hasDigit($password)) {
            return [
                'statusCode' => 400,
                'body' => [
                    'status' => 'error',
                    'message' => 'Password must contain at least one number',
                ],
            ];
        }

        if (!$this->hasSpecialChar($password)) {
            return [
                'statusCode' => 400,
                'body' => [
                    'status' => 'error',
                    'message' => 'Password must contain at least one special character (!@#$%^&* etc.)',
                ],
            ];
        }

        if ($data['password'] !== $data['confirmPassword']) {
            return [
                'statusCode' => 400,
                'body' => [
                    'status' => 'error',
                    'message' => 'Passwords do not match',
                ],
            ];
        }

        $database = new Database();
        $db = $database->getConnection();
        $user = new User($db);

        $result = $user->verifyAndResetPassword($data['token'], $data['password']);

        if ($result['status'] === 'error') {
            return [
                'statusCode' => 400,
                'body' => $result,
            ];
        }

        return [
            'statusCode' => 200,
            'body' => $result,
        ];
    }

    public function forgetPassword(array $data): array
    {
        try {
            if (empty($data['email'])) {
                return [
                    'statusCode' => 400,
                    'body' => [
                        'status' => 'error',
                        'message' => 'Email is required',
                    ],
                ];
            }

            $database = new Database();
            $db = $database->getConnection();
            $user = new User($db);

            $result = $user->forgetPassword($data['email']);

            if ($result['status'] === 'error') {
                return [
                    'statusCode' => 400,
                    'body' => $result,
                ];
            }

            $token = $result['token'] ?? null;
            if ($token) {
                $emailSent = $user->sendEmailPasswordReset($data['email'], $token);
                if ($emailSent === false) {
                    return [
                        'statusCode' => 500,
                        'body' => [
                            'status' => 'error',
                            'message' => 'Token created but failed to send email. Please try again.',
                        ],
                    ];
                }
            }

            return [
                'statusCode' => 200,
                'body' => [
                    'status' => 'success',
                    'message' => 'Password reset instructions sent to your email',
                ],
            ];
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'body' => [
                    'status' => 'error',
                    'message' => 'Server error: ' . $e->getMessage(),
                ],
            ];
        }
    }

    public function verifyToken(array $data): array
    {
        try {
            if (empty($data['token'])) {
                return [
                    'statusCode' => 400,
                    'body' => [
                        'status' => 'error',
                        'message' => 'Token is required',
                    ],
                ];
            }

            $database = new Database();
            $db = $database->getConnection();
            $user = new User($db);

            $isValid = $user->verifyResetToken($data['token']);

            if (!$isValid) {
                return [
                    'statusCode' => 400,
                    'body' => [
                        'status' => 'error',
                        'message' => 'This password reset link is invalid or has expired. Please request a new one.',
                    ],
                ];
            }

            return [
                'statusCode' => 200,
                'body' => [
                    'status' => 'success',
                    'message' => 'Token is valid',
                ],
            ];
        } catch (Exception $e) {
            return [
                'statusCode' => 500,
                'body' => [
                    'status' => 'error',
                    'message' => 'Server error: ' . $e->getMessage(),
                ],
            ];
        }
    }
}