<?php

require_once __DIR__ . '/../Service/NotificationService.php';
class User {
    private $conn;
    private $table_name = "users";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function forgetPassword($email){
        //check if email exists
        $sql = "SELECT user_id FROM " . $this->table_name . " WHERE email = ? LIMIT 1";
        $stmt = $this->conn->prepare($sql);
        if (!$stmt) {
            return ['status' => 'error', 'message' => 'Database error checking email: ' . $this->conn->error];
        }

        $stmt->bind_param("s", $email);
        if (!$stmt->execute()) {
            $stmt->close();
            return ['status' => 'error', 'message' => 'Database error executing email check: ' . $stmt->error];
        }
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            $stmt->close();
            return ['status' => 'error', 'message' => 'Email not found in system'];
        }
        $stmt->close();

        //check if user has a password reset token that is still valid (not expired)
        $checkTokenSql = "SELECT token, expires_at FROM password_resets WHERE email = ? LIMIT 1";
        $checkTokenStmt = $this->conn->prepare($checkTokenSql);
        if (!$checkTokenStmt) {
            return ['status' => 'error', 'message' => 'Database error preparing token check: ' . $this->conn->error];
        }
        $checkTokenStmt->bind_param("s", $email);
        if (!$checkTokenStmt->execute()) {
            $checkTokenStmt->close();
            return ['status' => 'error', 'message' => 'Database error executing token check: ' . $checkTokenStmt->error];
        }
        
        $token = null;
        $expiresAt = null;
        $checkTokenStmt->bind_result($token, $expiresAt);
        
        if ($checkTokenStmt->fetch()) {
            $currentTime = new DateTime();
            $expiresAtTime = new DateTime($expiresAt);
            if ($expiresAtTime > $currentTime) {
                $checkTokenStmt->close();
                return ['status' => 'success', 'message' => 'Password reset token already exists', 'token' => $token];
            }
            else {
                //delete old token if expired and generate new one
                $deleteTokenSql = "DELETE FROM password_resets WHERE email = ?";
                $deleteTokenStmt = $this->conn->prepare($deleteTokenSql);
                if (!$deleteTokenStmt) {
                    $checkTokenStmt->close();
                    return ['status' => 'error', 'message' => 'Database error preparing token delete: ' . $this->conn->error];
                }
                $deleteTokenStmt->bind_param("s", $email);
                if (!$deleteTokenStmt->execute()) {
                    $deleteTokenStmt->close();
                    $checkTokenStmt->close();
                    return ['status' => 'error', 'message' => 'Database error deleting old token: ' . $deleteTokenStmt->error];
                }
                $deleteTokenStmt->close();

                $token = bin2hex(random_bytes(16));
                $expiresAt = (new DateTime())->modify('+1 hour')->format('Y-m-d H:i:s');
                
                $insertTokenSql = "INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)";
                $insertTokenStmt = $this->conn->prepare($insertTokenSql);
                if (!$insertTokenStmt) {
                    $checkTokenStmt->close();
                    return ['status' => 'error', 'message' => 'Database error preparing token insert: ' . $this->conn->error];
                }
                $insertTokenStmt->bind_param("sss", $email, $token, $expiresAt);
                if (!$insertTokenStmt->execute()) {
                    $insertTokenStmt->close();
                    $checkTokenStmt->close();
                    return ['status' => 'error', 'message' => 'Database error inserting token (expired): ' . $insertTokenStmt->error];
                }
                $insertTokenStmt->close();
                $checkTokenStmt->close();
                return ['status' => 'success', 'message' => 'Password reset token generated', 'token' => $token];
            }
        } else {
            $checkTokenStmt->close();
            $token = bin2hex(random_bytes(16));
            $expiresAt = (new DateTime())->modify('+1 hour')->format('Y-m-d H:i:s');
            
            $insertTokenSql = "INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)";
            $insertTokenStmt = $this->conn->prepare($insertTokenSql);
            if (!$insertTokenStmt) {
                return ['status' => 'error', 'message' => 'Database error preparing token insert: ' . $this->conn->error];
            }
            $insertTokenStmt->bind_param("sss", $email, $token, $expiresAt);
            if (!$insertTokenStmt->execute()) {
                $insertTokenStmt->close();
                return ['status' => 'error', 'message' => 'Database error inserting new token: ' . $insertTokenStmt->error];
            }
            $insertTokenStmt->close();
            return ['status' => 'success', 'message' => 'Password reset token generated', 'token' => $token];
        }
    }

    function sendEmailPasswordReset($email, $token){
        require_once __DIR__ . '/../Service/EmailNotificationObserver.php';
        
        $resetLink = (defined('APP_URL') ? APP_URL : 'http://localhost:5173') . "/reset-password?token=" . $token;
        
        $customBody = "
            <div style='font-family:Arial,sans-serif;background:#f5f7fb;padding:24px'>
              <div style='max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb'>
                <div style='background:linear-gradient(135deg,#1e3a5f,#2b5b8a);color:#fff;padding:28px 32px'>
                  <h2 style='margin:0;font-size:24px'>MSA Quality Assurance</h2>
                  <p style='margin:8px 0 0;color:#dbeafe'>Password Reset</p>
                </div>
                <div style='padding:32px'>
                  <p style='font-size:16px;color:#111827;margin:0 0 16px'>Hello,</p>
                  <p style='font-size:16px;color:#374151;line-height:1.7;margin:0 0 24px'>You requested a password reset for your account. Click the button below to reset your password. This link will expire in 1 hour.</p>
                  <a href='{$resetLink}' style='display:inline-block;background:#1e3a5f;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600'>Reset Password</a>
                  <p style='margin:24px 0 0;font-size:13px;color:#6b7280'>If the button does not work, use this link: <a href='{$resetLink}' style='color:#1e3a5f;text-decoration:none'>{$resetLink}</a></p>
                  <p style='margin:16px 0 0;font-size:13px;color:#ef4444'>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
                </div>
                <div style='padding:18px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280'>
                  This is an automated message. Please do not reply.
                </div>
              </div>
            </div>
        ";

        return \EmailNotificationObserver::sendDirectMail($email, 'Password Reset Request', $customBody, true);
    }
    public function login($email, $password) {
        $sql = "SELECT user_id, name, password, role FROM " . $this->table_name . " WHERE email = ? LIMIT 1";

        $stmt = $this->conn->prepare($sql);
        if (!$stmt) {
            return false;
        }

        if (!$stmt->bind_param("s", $email) || !$stmt->execute()) {
            $stmt->close();
            return false;
        }

        $userId = null;
        $name = null;
        $hashedPassword = null;
        $role = null;

        $stmt->bind_result($userId, $name, $hashedPassword, $role);

        if ($stmt->fetch() && password_verify($password, $hashedPassword)) {
            $stmt->close();

            return [
                'user_id' => $userId,
                'name' => $name,
                'role' => $role,
            ];
        }

        $stmt->close();
        return false;
    }

    public function verifyResetToken($token) {
        $sql = "SELECT email, expires_at FROM password_resets WHERE token = ? LIMIT 1";
        $stmt = $this->conn->prepare($sql);
        if (!$stmt) {
            return ['status' => 'error', 'message' => 'Database error'];
        }

        $stmt->bind_param("s", $token);
        $stmt->execute();

        $email = null;
        $expiresAt = null;
        $stmt->bind_result($email, $expiresAt);

        if ($stmt->fetch()) {
            $currentTime = new DateTime();
            $expiresAtTime = new DateTime($expiresAt);
            
            if ($expiresAtTime > $currentTime) {
                $stmt->close();
                return [
                    'status' => 'success',
                    'message' => 'Token is valid',
                    'email' => $email,
                ];
            } else {
                $stmt->close();
                return [
                    'status' => 'error',
                    'message' => 'Token has expired',
                ];
            }
        }

        $stmt->close();
        return [
            'status' => 'error',
            'message' => 'Invalid token',
        ];
    }

    public function verifyAndResetPassword($token, $newPassword) {
        $tokenVerification = $this->verifyResetToken($token);
        if ($tokenVerification['status'] === 'error') {
            return $tokenVerification;
        }

        $email = $tokenVerification['email'];
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

        $updateSql = "UPDATE " . $this->table_name . " SET password = ? WHERE email = ?";
        $updateStmt = $this->conn->prepare($updateSql);
        if (!$updateStmt) {
            return [
                'status' => 'error',
                'message' => 'Database error: ' . $this->conn->error,
            ];
        }

        $updateStmt->bind_param("ss", $hashedPassword, $email);
        if (!$updateStmt->execute()) {
            $updateStmt->close();
            return [
                'status' => 'error',
                'message' => 'Failed to update password',
            ];
        }
        $updateStmt->close();

        $deleteSql = "DELETE FROM password_resets WHERE token = ?";
        $deleteStmt = $this->conn->prepare($deleteSql);
        if (!$deleteStmt) {
            return [
                'status' => 'error',
                'message' => 'Database error',
            ];
        }

        $deleteStmt->bind_param("s", $token);
        $deleteStmt->execute();
        $deleteStmt->close();

        return [
            'status' => 'success',
            'message' => 'Password reset successfully',
        ];
    }
}
?>