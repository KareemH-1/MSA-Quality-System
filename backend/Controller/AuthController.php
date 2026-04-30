<?php

require_once '../config/config.php';

include_once '../Model/Database.php';
include_once '../Model/User.php';

$database = new Database();
$db = $database->getConnection();
$user = new User($db);

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->email) && !empty($data->password)) {
    $foundUser = $user->login($data->email, $data->password);
    
    if($foundUser) {

        $lifetime = 0; // if user doesnt want to remember,then cookie will act like a session and stp when browser get closed
        if(isset($data->rememberMe) && $data->rememberMe) {
            $lifetime = 60 * 60 * 24 * 30; // 30 days in seconds
        }

        session_set_cookie_params([
            'lifetime' => $lifetime,
            'path' => '/',
            'httponly' => true, //stop xss
            'samesite' => 'Lax'
        ]);

        session_start();
        $_SESSION['user_id'] = $foundUser['user_id'];
            $_SESSION['name'] = $foundUser['name'];
        $_SESSION['role'] = $foundUser['role'];

        echo json_encode([
            "status" => "success",
            "user" => [
                "name" => $foundUser['name'],
                "role" => $foundUser['role']
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Invalid Email or Password"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Email and Password are required"]);
}
?>