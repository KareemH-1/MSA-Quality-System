<?php

declare(strict_types=1);

require_once __DIR__ . '/NotificationObserver.php';
require_once __DIR__ . '/InAppNotificationObserver.php';
require_once __DIR__ . '/EmailNotificationObserver.php';

class NotificationService
{
  private array $observers = [];

  public function attach(NotificationObserver $observer): void
  {
    $this->observers[] = $observer;
  }

  public function notify(string $event, array $data): void
  {
    foreach ($this->observers as $observer) {
      $observer->update($event, $data);
    }
  }

  public function send(
    string $title,
    int $receiverId,
    ?string $senderType = 'system',
    ?int $senderId = null,
    bool $notifyByEmail = false,
    bool $styledEmail = false
  ): void {
    $this->notify('new_notification', [
      'title' => $title,
      'receiver_id' => $receiverId,
      'sender_type' => $senderType,
      'sender_id' => $senderId,
      'notify_by_email' => $notifyByEmail,
      'styled_email' => $styledEmail
    ]);
  }

  public static function create(mysqli $db): self
  {
    $service = new self();
    $service->attach(new InAppNotificationObserver($db));
    $service->attach(new EmailNotificationObserver($db));
    return $service;
  }
   
  public static function createWithoutEmail(mysqli $db): self
  {
    $service = new self();
    $service->attach(new InAppNotificationObserver($db));
    return $service;
  }

  public function appealSessionOpened(mysqli $db, string $sessionType, bool $sendEmail = true): void
  {
    $sql = "SELECT DISTINCT student_id FROM course_students";
    $stmt = $db->prepare($sql);
    if (!$stmt) return;

    $stmt->execute();
    $students = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    foreach ($students as $s) {
      $this->send(
          "{$sessionType} appeal session is now open.",
          (int)$s['student_id'],
          'appeal',
          null,
          $sendEmail
      );
    }
  }

  public function surveyAssigned(mysqli $db, int $courseId, string $surveyTitle, bool $sendEmail = true): void
  {
    $sql = "SELECT student_id FROM course_students WHERE course_id = ?";
    $stmt = $db->prepare($sql);
    if (!$stmt) return;

    $stmt->bind_param('i', $courseId);
    $stmt->execute();
    $students = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    foreach ($students as $s) {
      $this->send(
          "A new survey is available: {$surveyTitle}.",
          (int)$s['student_id'],
          'survey',
          null,
          $sendEmail
      );
    }
  }

  public function appealSubmitted(int $studentId, string $courseName): void
  {
    $this->send(
        "Your grade appeal for {$courseName} has been submitted successfully.",
        $studentId,
        'appeal',
        null,
        false
    );
  }
}

?>