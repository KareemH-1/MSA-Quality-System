<?php

declare(strict_types=1);

require_once '../Model/Database.php';
require_once '../Model/Ticket.php';

class TicketController
{
    private Ticket $ticketModel;

    public function __construct()
    {
        $database = new Database();
        $db = $database->getConnection();
        $this->ticketModel = new Ticket($db);
    }

    private function startSession(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    private function getSessionUserId(): ?int
    {
        $this->startSession();

        if (empty($_SESSION['user_id'])) {
            return null;
        }

        return (int)$_SESSION['user_id'];
    }

    private function requireAuth(): ?array
    {
        $this->startSession();

        if (empty($_SESSION['user_id'])) {
            return [
                'statusCode' => 401,
                'body' => ['status' => 'error', 'message' => 'Not authenticated'],
            ];
        }

        return null;
    }

    private function getField(array $data, array $keys): string
    {
        foreach ($keys as $key) {
            if (isset($data[$key])) {
                $value = trim((string)$data[$key]);
                if ($value !== '') {
                    return $value;
                }
            }
        }

        return '';
    }

    public function createTicket(array $data): array
    {
        $this->startSession();

        $userId = $this->getSessionUserId();
        $userName = $this->getField($data, ['user_name', 'fullName', 'name']) ?: ($_SESSION['name'] ?? '');
        $userEmail = $this->getField($data, ['user_email', 'email']) ?: ($_SESSION['email'] ?? '');
        $message = $this->getField($data, ['message']);
        $type = $this->getField($data, ['type', 'category']);

        if ($userName === '' || $userEmail === '' || $message === '' || $type === '') {
            return [
                'statusCode' => 400,
                'body' => [
                    'status' => 'error',
                    'message' => 'Name, email, message, and type are required',
                ],
            ];
        }

        $result = $this->ticketModel->createTicket($userId, $userName, $userEmail, $message, $type);

        return [
            'statusCode' => $result['status'] === 'success' ? 201 : 500,
            'body' => $result,
        ];
    }

    public function getTickets(): array
    {
        if ($err = $this->requireAuth()) {
            return $err;
        }

        $result = $this->ticketModel->getTickets();

        return [
            'statusCode' => $result['status'] === 'success' ? 200 : 500,
            'body' => $result,
        ];
    }

    public function deleteTicket(int $ticketId): array
    {
        if ($err = $this->requireAuth()) {
            return $err;
        }

        $result = $this->ticketModel->deleteTicket($ticketId);

        return [
            'statusCode' => $result['status'] === 'success' ? 200 : 404,
            'body' => $result,
        ];
    }

    public function updateTicket(array $data): array
    {
        if ($err = $this->requireAuth()) {
            return $err;
        }

        $ticketId = isset($data['ticket_id']) ? (int)$data['ticket_id'] : 0;
        $message = $this->getField($data, ['message']);
        $type = $this->getField($data, ['type']);

        if ($ticketId <= 0 || $message === '' || $type === '') {
            return [
                'statusCode' => 400,
                'body' => ['status' => 'error', 'message' => 'ticket_id, message, and type are required'],
            ];
        }

        $result = $this->ticketModel->updateTicket($ticketId, $message, $type);

        return [
            'statusCode' => $result['status'] === 'success' ? 200 : 404,
            'body' => $result,
        ];
    }

    public function updatePriority(array $data): array
    {
        if ($err = $this->requireAuth()) {
            return $err;
        }

        $ticketId = isset($data['ticket_id']) ? (int)$data['ticket_id'] : 0;
        $priority = $this->getField($data, ['priority']);

        if ($ticketId <= 0 || $priority === '') {
            return [
                'statusCode' => 400,
                'body' => ['status' => 'error', 'message' => 'ticket_id and priority are required'],
            ];
        }

        $result = $this->ticketModel->updatePriority($ticketId, $priority);

        return [
            'statusCode' => $result['status'] === 'success' ? 200 : 404,
            'body' => $result,
        ];
    }

    public function updateStatus(array $data): array
    {
        if ($err = $this->requireAuth()) {
            return $err;
        }

        $ticketId = isset($data['ticket_id']) ? (int)$data['ticket_id'] : 0;
        $status = $this->getField($data, ['status']);

        if ($ticketId <= 0 || $status === '') {
            return [
                'statusCode' => 400,
                'body' => ['status' => 'error', 'message' => 'ticket_id and status are required'],
            ];
        }

        $result = $this->ticketModel->updateStatus($ticketId, $status);

        return [
            'statusCode' => $result['status'] === 'success' ? 200 : 404,
            'body' => $result,
        ];
    }

    public function filterByType(string $type): array
    {
        if ($err = $this->requireAuth()) {
            return $err;
        }

        if ($type === '') {
            return [
                'statusCode' => 400,
                'body' => ['status' => 'error', 'message' => 'type is required'],
            ];
        }

        $result = $this->ticketModel->filterByType($type);

        return [
            'statusCode' => $result['status'] === 'success' ? 200 : 500,
            'body' => $result,
        ];
    }

    public function replyToTicket(array $data): array
    {
        if ($err = $this->requireAuth()) {
            return $err;
        }

        $ticketId = isset($data['ticket_id']) ? (int)$data['ticket_id'] : 0;
        $replyMessage = $this->getField($data, ['reply_message', 'replyMessage']);

        if ($ticketId <= 0 || $replyMessage === '') {
            return [
                'statusCode' => 400,
                'body' => ['status' => 'error', 'message' => 'ticket_id and reply_message are required'],
            ];
        }

        $result = $this->ticketModel->replyToTicket($ticketId, $replyMessage);

        return [
            'statusCode' => $result['status'] === 'success' ? 200 : 404,
            'body' => $result,
        ];
    }
}