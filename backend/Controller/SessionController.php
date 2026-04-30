<?php

require_once '../config/config.php';

session_start();

if (!empty($_SESSION['user_id']) && !empty($_SESSION['role'])) {
    echo json_encode([
        "status" => "success",
        "user" => [
            "user_id" => $_SESSION['user_id'],
            "name" => $_SESSION['name'] ?? '',
            "role" => $_SESSION['role'],
        ]
    ]);
    exit();
}

echo json_encode([
    "status" => "success",
    "user" => null
]);