<?php

$router->get('/api/test', function () {
    echo json_encode(["message" => "API working"]);
});

//example login : $router->post('/api/login', ['controllers/AuthController', 'login']);

?>