<?php

require_once __DIR__ . '/../Model/Database.php';
require_once __DIR__ . '/../Model/Instructor.php';

class InstructorController
{
  private Instructor $instructorModel;

  public function __construct()
  {
    $database = new Database();
    $db = $database->getConnection();
    $this->instructorModel = new Instructor($db);
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

    if($_SESSION['role'] !== 'Instructor' && $_SESSION['role'] !== 'Module_Leader'){
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
    $appeals = $this->instructorModel->getAssignedAppeals($instructorId);
    return [
      'statusCode' => 200,
      'body' => [
          'status' => 'success',
          'appeals' => $appeals,
      ]
    ];
  }

  public function reviewAppeal(array $data): array
  {
    $authError = $this->requireInstructor();
    if($authError) return $authError;
    
    if (empty($data['appeal_id']) || empty($data['status'])) {
      return [
          'statusCode' => 400,
          'body' => [
              'status' => 'error',
              'message' => 'appeal_id and status are required',
          ]
      ];
    }

    $allowedStatuses = ['Under Review', 'Resolved', 'Rejected'];
    if (!in_array($data['status'], $allowedStatuses)) {
        return [
            'statusCode' => 400,
            'body' => [
                'status' => 'error',
                'message' => 'Invalid status',
            ]
        ];
    }

    $instructorId = (int)$_SESSION['user_id'];
    $appealId = (int)$data['appeal_id'];
    $newStatus = (string)$data['status'];
    $newGrade = $data['new_grade'] ?? null;
    $note = $data['note'] ?? null;

    $ok = $this->instructorModel->reviewAppeal($appealId, $instructorId, $newStatus, $newGrade, $note);

    if(!$ok) {
        return [
            'statusCode' => 500,
            'body' => [
                'status' => 'error',
                'message' => 'Failed to update appeal',
            ]
        ];
    }

    return [
        'statusCode' => 200,
        'body' => [
            'status' => 'success',
        ]
    ];
  }
}