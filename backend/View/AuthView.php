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
}

$authView = new AuthView();
$authView->login();