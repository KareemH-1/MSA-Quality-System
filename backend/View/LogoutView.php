<?php

require_once 'JsonView.php';
require_once '../Controller/LogoutController.php';

class LogoutView extends JsonView
{
    private LogoutController $controller;

    public function __construct()
    {
        $this->controller = new LogoutController();
    }

    public function logout()
    {
        $result = $this->controller->logout();
        $this->respond($result['statusCode'], $result['body']);
    }
}

$logoutView = new LogoutView();
$logoutView->logout();