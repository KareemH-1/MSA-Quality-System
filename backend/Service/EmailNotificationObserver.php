<?php

declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/NotificationObserver.php';
require_once __DIR__ . '/../Model/Notification.php';
require_once __DIR__ . '/../config/email.php';
require_once __DIR__ . '/../../vendor/autoload.php';


class EmailNotificationObserver implements NotificationObserver
{
  private Notification $notificationModel;

  public function __construct(mysqli $db)
  {
    $this->notificationModel = new Notification($db);
  }

  public function update(string $event, array $data): void
  {
    if(empty($data['notify_by_email']) || !$data['notify_by_email']) {
        return; 
    }

    $email = $this->notificationModel->getEmail($data['receiver_id']);
    if($email === '') return;

    $this->sendMail($email, $data['title']);
  }

  private function sendMail(string $to, string $subject): void
  {
    try{
      $mail = new PHPMailer(true);

      $mail->isSMTP();
      $mail->Host = SMTP_HOST;
      $mail->SMTPAuth = true;
      $mail->Username = SMTP_USERNAME;
      $mail->Password = SMTP_PASSWORD;
      $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
      $mail->Port = SMTP_PORT;

      $mail->setFrom(SMTP_FROM, SMTP_FROM_NAME);
      $mail->addAddress($to);

      $mail->isHTML(true);
      $mail->Subject = $subject;
      $mail->Body = "
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
      
      $mail->send(); 
    } catch (Exception $e) {
      error_log("Email could not be sent to {$to}. Error: {$e->getMessage()}");
    }
  }
}