<?php

require_once 'JsonView.php';
require_once '../Controller/TicketController.php';

class TicketView extends JsonView
{
    private TicketController $controller;

    public function __construct()
    {
        $this->controller = new TicketController();
    }

    public function handle(): void
    {
        header('Content-Type: application/json');

        $method = strtoupper($_SERVER['REQUEST_METHOD']);
        if ($method === 'OPTIONS') {
            http_response_code(200);
            exit;
        }

        $action = $_GET['action'] ?? 'create';

        switch ($action) {
            case 'create':
                if ($method !== 'POST') {
                    $result = ['statusCode' => 405, 'body' => ['status' => 'error', 'message' => 'POST required']];
                    break;
                }
                $result = $this->controller->createTicket($this->readJsonBody());
                break;

            case 'list':
                if ($method !== 'GET') {
                    $result = ['statusCode' => 405, 'body' => ['status' => 'error', 'message' => 'GET required']];
                    break;
                }
                $result = $this->controller->getTickets();
                break;

            case 'delete':
                if ($method !== 'POST') {
                    $result = ['statusCode' => 405, 'body' => ['status' => 'error', 'message' => 'POST required']];
                    break;
                }
                $data = $this->readJsonBody();
                $ticketId = isset($data['ticket_id']) ? (int)$data['ticket_id'] : 0;
                $result = $this->controller->deleteTicket($ticketId);
                break;

            case 'update':
                if ($method !== 'POST') {
                    $result = ['statusCode' => 405, 'body' => ['status' => 'error', 'message' => 'POST required']];
                    break;
                }
                $result = $this->controller->updateTicket($this->readJsonBody());
                break;

            case 'priority':
                if ($method !== 'POST') {
                    $result = ['statusCode' => 405, 'body' => ['status' => 'error', 'message' => 'POST required']];
                    break;
                }
                $result = $this->controller->updatePriority($this->readJsonBody());
                break;

            case 'filter':
                if ($method !== 'GET') {
                    $result = ['statusCode' => 405, 'body' => ['status' => 'error', 'message' => 'GET required']];
                    break;
                }
                $result = $this->controller->filterByType($_GET['type'] ?? '');
                break;

            case 'reply':
                if ($method !== 'POST') {
                    $result = ['statusCode' => 405, 'body' => ['status' => 'error', 'message' => 'POST required']];
                    break;
                }
                $result = $this->controller->replyToTicket($this->readJsonBody());
                break;

            default:
                $result = [
                    'statusCode' => 400,
                    'body' => [
                        'status' => 'error',
                        'message' => 'Unknown action',
                        'allowed' => ['create', 'list', 'delete', 'update', 'priority', 'filter', 'reply'],
                    ],
                ];
        }

        $this->respond($result['statusCode'], $result['body']);
    }
}

$view = new TicketView();
$view->handle();