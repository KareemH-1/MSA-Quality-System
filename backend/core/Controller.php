<?php
// this is parent class for controllers that has fumctions that are common to all controllers like sending json response and getting the request body
class Controller {
    protected function json($data, $status = 200) {
        // this function is used to send json response to the frontend, it will be used in all controllers to send response to the frontend
        http_response_code($status);
        header("Content-Type: application/json");
        echo json_encode($data);
    }
        
    protected function getBody() {
        //this function is used to get the request body and return it as an associative array, it will be used to decode THE json comming from the frontend
        return json_decode(file_get_contents("php://input"), true);
    }
}


?>