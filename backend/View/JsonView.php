<?php

abstract class JsonView
{
    protected function readJsonBody()
    {
        $raw = file_get_contents('php://input');
        if ($raw === false || trim($raw) === '') {
            return [];
        }

        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            return $decoded;
        }

        return [];
    }

    protected function respond(int $statusCode, array $body)
    {
        http_response_code($statusCode);
        echo json_encode($body);
    }
}
