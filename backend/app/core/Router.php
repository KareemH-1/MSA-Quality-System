<?php

class Router {

    /*
        structure of the routes array:
        [
            "GET" => [
                "/path1" => callback1,
                "/path2" => callback2,
                ...
            ],
            "POST" => [
                "/path3" => callback3,
                "/path4" => callback4,
            ],
        ]

    */

    // This array stores ALL routes in the app so that we can easily check if a route exists or not.
    // we will use the request method as the first key and the path as the second key.
    private $routes = [];

    //add a Get route the the class

    public function get($path, $callback) {
        if (!isset($this->routes['GET'])) {
            $this->routes['GET'] = [];
        }

        $this->routes['GET'][$path] = $callback;
    }

    // add a Post route the the class

    public function post($path, $callback) {
        if (!isset($this->routes['POST'])) {
            $this->routes['POST'] = [];
        }

        $this->routes['POST'][$path] = $callback;
    }

    public function handleRequest() {
        // 1. Get request method
        // 2. Get full URI
        // 3. clean the URI (remove query parameters and trailing slashes) so that we can see if the route exists or not
        // 4. Check if there are any routes for the request method
        // 5. Check if the route exists for the request method
        // 6. If the route exists, call the callback function
    
        $requestMethod = $_SERVER['REQUEST_METHOD'];

        $fullUri = $_SERVER['REQUEST_URI'];
        
        $questionMarkPos = strpos($fullUri, '?');
        if ($questionMarkPos !== false) {
            $uri = substr($fullUri, 0, $questionMarkPos);
        } else {
            $uri = $fullUri;
        }

        if ($uri !== '/' && substr($uri, -1) === '/') {
            $uri = substr($uri, 0, -1);
        }

        if (!isset($this->routes[$requestMethod])) {
            http_response_code(404);
            echo json_encode(["error" => "No routes for this method"]);
            return;
        }

        if (!isset($this->routes[$requestMethod][$uri])) {
            http_response_code(404);
            echo json_encode(["error" => "Route not found"]);
            return;
        }

        $callback = $this->routes[$requestMethod][$uri];

        if (is_array($callback)) {
            $controllerName = $callback[0];
            $methodName = $callback[1];

            $controller = new $controllerName();

            $controller->$methodName();
        } else {
            $callback();
        }
    }
}