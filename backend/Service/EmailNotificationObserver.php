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

    $this->sendMail(
      $email,
      $data['title'],
      !empty($data['styled_email']) && $data['styled_email'] === true
    );
  }

  private function sendMail(string $to, string $subject, bool $styledEmail = false): void
  {
    $this->sendMailContent($to, $subject, null, $styledEmail);
  }

  public static function sendDirectMail(string $to, string $subject, ?string $customBody = null, bool $styledEmail = false): bool
  {
    try {
      $mail = new PHPMailer(true);
      
      if ($customBody) {
        $body = $customBody;
      } else {
        $message = htmlspecialchars($subject, ENT_QUOTES, 'UTF-8');
        $portalUrl = htmlspecialchars(APP_URL, ENT_QUOTES, 'UTF-8');
        
        $plainBody = "
          <div style='font-family:Arial,sans-serif;line-height:1.6;color:#1f2937'>
            <p>{$message}</p>
            <p>Website: <a href='{$portalUrl}'>{$portalUrl}</a></p>
            <p>This is an automated message. Please do not reply.</p>
          </div>
        ";

        $styledBody = "
          <div style='font-family:Arial,sans-serif;background:#f5f7fb;padding:24px'>
            <div style='max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb'>
              <div style='background:linear-gradient(135deg,#1e3a5f,#2b5b8a);color:#fff;padding:28px 32px'>
                <h2 style='margin:0;font-size:24px'>MSA Quality Assurance</h2>
                <p style='margin:8px 0 0;color:#dbeafe'>Account notification</p>
              </div>
              <div style='padding:32px'>
                <p style='font-size:16px;color:#111827;margin:0 0 16px'>Hello,</p>
                <p style='font-size:16px;color:#374151;line-height:1.7;margin:0 0 24px'>{$message}</p>
                <a href='{$portalUrl}' style='display:inline-block;background:#1e3a5f;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600'>Open the website</a>
                <p style='margin:24px 0 0;font-size:13px;color:#6b7280'>If the button does not work, use this link: <a href='{$portalUrl}' style='color:#1e3a5f'>{$portalUrl}</a></p>
              </div>
              <div style='padding:18px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280'>
                This is an automated message. Please do not reply.
              </div>
            </div>
          </div>
        ";
        
        $body = $styledEmail ? $styledBody : $plainBody;
      }

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
      $mail->Body = $body;
      
      $mail->send();
      return true;
    } catch (Exception $e) {
      error_log("Email could not be sent to {$to}. Error: {$e->getMessage()}");
      return false;
    }
  }

  private function sendMailContent(string $to, string $subject, ?string $customBody = null, bool $styledEmail = false): void
  {
    self::sendDirectMail($to, $subject, $customBody, $styledEmail);
  }
}