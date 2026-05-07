<?php

declare(strict_types=1);

require_once __DIR__ . '/../Model/Notification.php';

class NotificationService
{
  public static function send(
    mysqli $db,
    string $title,
    int $receiverId,
    string  $type = 'system',  
    ?int $senderId = null,
    bool $sendEmail = false
  ): bool {
    $model = new Notification($db);
    $inserted = $model->insert($title, $receiverId, $type, $senderId, $sendEmail);

    if ($inserted && $sendEmail) {
        $email = $model->getStudentEmail($receiverId);
        if ($email !== '') {
            self::mail($email, $title);
        }
    }

    return $inserted;
  }

  public static function appealSubmitted(mysqli $db, int $studentId, string $courseName): void
  {
    self::send(
        $db,
        "Your appeal for {$courseName} has been submitted successfully.",
        $studentId,
        'appeal'
    );
  }  

  public static function appealResolved(
      mysqli $db,
      int $studentId,
      string $courseName,
      string $newStatus,   
      bool $sendEmail = true
  ): void {
      self::send(
          $db,
          "Your appeal for {$courseName} has been {$newStatus}.",
          $studentId,
          'appeal',
          null,
          $sendEmail
      );
  }

  public static function appealSessionOpened(
    mysqli $db,
    string $sessionType, 
    bool $sendEmail = true
    ): void {
    $sql  = "SELECT DISTINCT student_id FROM course_students";
    $stmt = $db->prepare($sql);
    if (!$stmt) return;

    $stmt->execute();
    $students = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    foreach ($students as $s) {
        self::send(
            $db,
            "{$sessionType} appeal session is now open. Submit your appeals before the deadline.",
            (int)$s['student_id'],
            'appeal',
            null,
            $sendEmail
        );
    }
  }

  public static function surveyAssigned(
    mysqli $db,
    int $courseId,
    string $surveyTitle,
    bool $sendEmail = true
    ): void {
    $sql = "SELECT student_id FROM course_students WHERE course_id = ?";
    $stmt = $db->prepare($sql);
    if (!$stmt) return;

    $stmt->bind_param('i', $courseId);
    $stmt->execute();
    $students = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    foreach ($students as $s) {
      self::send(
          $db,
          "A new survey is available: {$surveyTitle}. Please complete it before the deadline.",
          (int)$s['student_id'],
          'survey',
          null,
          $sendEmail
      );
    }
  }

  private static function mail(string $to, string $subject): void
  {
    $from = 'noreply@msa-qa.edu';   
    
    $headers = implode("\r\n", [
        "From: MSA Quality Assurance <{$from}>",
        "Reply-To: {$from}",
        "Content-Type: text/html; charset=UTF-8",
        "MIME-Version: 1.0",
    ]);

    $body = "
        <div style='font-family:sans-serif;max-width:600px;margin:auto'>
          <h2 style='color:#1e3a5f'>MSA Quality Assurance</h2>
          <p>{$subject}</p>
          <hr>
          <p style='color:#888;font-size:12px'>
            Log in to your portal to view details.
            This is an automated message — please do not reply.
          </p>
        </div>
    ";

    @mail($to, $subject, $body, $headers);
  }

}

?>