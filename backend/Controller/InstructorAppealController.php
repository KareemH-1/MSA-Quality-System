<?php

require_once __DIR__ . '/../Model/Database.php';
require_once __DIR__ . '/../Model/InstructorAppeal.php';

class InstructorAppealController
{
  private InstructorAppeal $appealModel;

  public function __construct()
  {
    $database = new Database();
    $db = $database->getConnection();
    $this->appealModel = new InstructorAppeal($db);
  }

  private function startSession()
  {
    if(session_status() === PHP_SESSION_NONE){
      session_start();
    }
  }

  private function requireInstructor(): ?array
  {
    $this->startSession();

    if(empty($_SESSION['user_id']) || empty($_SESSION['role'])) {
        return [
            'statusCode' => 401,
            'body' => [
                'status' => 'error',
                'message' => 'Not authenticated',
            ]
        ];
      }

    if($_SESSION['role'] !== 'Instructor') {
        return [
            'statusCode' => 403,
            'body' => [
                'status' => 'error',
                'message' => 'Forbidden',
            ]
        ];
    }

    return null;
  }

  public function getAssignedAppeals(): array
  {
    $authError = $this->requireInstructor();
    if($authError) return $authError;

    $instructorId = (int)$_SESSION['user_id'];
    $appeals = $this->appealModel->getAssignedAppeals($instructorId);
    return [
      'statusCode' => 200,
      'body' => [
          'status' => 'success',
          'appeals' => $appeals,
      ]
    ];
  }
}