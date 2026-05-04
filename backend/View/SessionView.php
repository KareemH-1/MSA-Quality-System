<?php

require_once 'JsonView.php';
require_once '../Controller/SessionController.php';

class SessionView extends JsonView
{
    private SessionController $controller;

    public function __construct()
    {
        $this->controller = new SessionController();
    }

    public function current()
    {
        $result = $this->controller->getSession();
        $this->respond($result['statusCode'], $result['body']);
    }
}

$sessionView = new SessionView();
$sessionView->current();