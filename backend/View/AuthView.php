<?php

require_once 'JsonView.php';
require_once '../Controller/AuthController.php';

class AuthView extends JsonView
{
    private AuthController $controller;

    public function __construct()
    {
        $this->controller = new AuthController();
    }

    public function login()
    {
        $result = $this->controller->login($this->readJsonBody());
        $this->respond($result['statusCode'], $result['body']);
    }

    public function resetPassword()
    {
        $result = $this->controller->resetPassword($this->readJsonBody());
        $this->respond($result['statusCode'], $result['body']);
    }

    public function forgetPassword()
    {
        $result = $this->controller->forgetPassword($this->readJsonBody());
        $this->respond($result['statusCode'], $result['body']);
    }

    public function verifyToken()
    {
        $result = $this->controller->verifyToken($this->readJsonBody());
        $this->respond($result['statusCode'], $result['body']);
    }
}

$authView = new AuthView();

$action = $_GET['action'] ?? null;

match ($action) {
    'reset-password' => $authView->resetPassword(),
    'forget-password' => $authView->forgetPassword(),
    'verify-token' => $authView->verifyToken(),
    default => $authView->login(),
};
