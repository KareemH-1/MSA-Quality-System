<?php
class Ticket {
   
        private $conn;
    
        public function __construct($db) {
            $this->conn = $db;
        }

        public function createTicket($userId, $userName, $userEmail, $message, $type) {
            if ($userId === null) {
                $sql = "INSERT INTO support_tickets (user_id, user_name, user_email, message, type) VALUES (NULL, ?, ?, ?, ?)";

                $stmt = $this->conn->prepare($sql);
                if (!$stmt) {
                    return ['status' => 'error', 'message' => 'Database error: ' . $this->conn->error];
                }

                $stmt->bind_param('ssss', $userName, $userEmail, $message, $type);
            } else {
                $sql = "INSERT INTO support_tickets (user_id, user_name, user_email, message, type) VALUES (?, ?, ?, ?, ?)";

                $stmt = $this->conn->prepare($sql);
                if (!$stmt) {
                    return ['status' => 'error', 'message' => 'Database error: ' . $this->conn->error];
                }

                $stmt->bind_param('issss', $userId, $userName, $userEmail, $message, $type);
            }

            if ($stmt->execute()) {
                return ['status' => 'success', 'message' => 'Ticket created successfully'];
            } else {
                return ['status' => 'error', 'message' => 'Failed to create ticket: ' . $stmt->error];
            }
        }

        public function getTickets() {
            $sql = "SELECT ticket_id AS id, user_id, user_name, user_email, message, type, priority, status, reply_message, created_at FROM support_tickets ORDER BY created_at DESC";
            $result = $this->conn->query($sql);
    
            if ($result === false) {
                return ['status' => 'error', 'message' => 'Database error: ' . $this->conn->error];
            }
    
            $tickets = [];
            while ($row = $result->fetch_assoc()) {
                $tickets[] = $row;
            }
    
            return ['status' => 'success', 'tickets' => $tickets];
        }

        public function deleteTicket($ticketId) {
            $sql = "DELETE FROM support_tickets WHERE ticket_id = ?";
    
            $stmt = $this->conn->prepare($sql);
            if (!$stmt) {
                return ['status' => 'error', 'message' => 'Database error: ' . $this->conn->error];
            }
    
            $stmt->bind_param('i', $ticketId);
    
            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    return ['status' => 'success', 'message' => 'Ticket deleted successfully'];
                } else {
                    return ['status' => 'error', 'message' => 'Ticket not found'];
                }
            } else {
                return ['status' => 'error', 'message' => 'Failed to delete ticket: ' . $stmt->error];
            }
        }

        public function updateTicket($ticketId, $message, $type) {
            $sql = "UPDATE support_tickets SET message = ?, type = ? WHERE ticket_id = ?";
    
            $stmt = $this->conn->prepare($sql);
            if (!$stmt) {
                return ['status' => 'error', 'message' => 'Database error: ' . $this->conn->error];
            }
    
            $stmt->bind_param('ssi', $message, $type, $ticketId);
    
            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    return ['status' => 'success', 'message' => 'Ticket updated successfully'];
                } else {
                    return ['status' => 'error', 'message' => 'Ticket not found or no changes made'];
                }
            } else {
                return ['status' => 'error', 'message' => 'Failed to update ticket: ' . $stmt->error];
            }
        }

        public function updatePriority($ticketId, $priority) {
            $sql = "UPDATE support_tickets SET priority = ? WHERE ticket_id = ?";
    
            $stmt = $this->conn->prepare($sql);
            if (!$stmt) {
                return ['status' => 'error', 'message' => 'Database error: ' . $this->conn->error];
            }
    
            $stmt->bind_param('si', $priority, $ticketId);
    
            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    return ['status' => 'success', 'message' => 'Ticket priority updated successfully'];
                } else {
                    return ['status' => 'error', 'message' => 'Ticket not found or no changes made'];
                }
            } else {
                return ['status' => 'error', 'message' => 'Failed to update ticket priority: ' . $stmt->error];
            }
        }

        public function updateStatus($ticketId, $status) {
            $sql = "UPDATE support_tickets SET status = ? WHERE ticket_id = ?";

            $stmt = $this->conn->prepare($sql);
            if (!$stmt) {
                return ['status' => 'error', 'message' => 'Database error: ' . $this->conn->error];
            }

            $stmt->bind_param('si', $status, $ticketId);

            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    if (strtolower($status) === 'resolved') {
                        $userId = $this->getTicketUserId($ticketId);
                        if ($userId !== null) {
                            require_once __DIR__ . '/../Service/NotificationService.php';
                            $svc = NotificationService::createWithoutEmail($this->conn);
                            $title = "Your support ticket #{$ticketId} has been resolved — please check your email.";
                            $svc->send($title, (int)$userId, 'support', null, false, false);
                        }
                    }

                    return ['status' => 'success', 'message' => 'Ticket status updated successfully'];
                } else {
                    return ['status' => 'error', 'message' => 'Ticket not found or no changes made'];
                }
            } else {
                return ['status' => 'error', 'message' => 'Failed to update ticket status: ' . $stmt->error];
            }
        }

        public function filterByType($type) {
            $sql = "SELECT ticket_id AS id, user_id, user_name, user_email, message, type, priority, status, reply_message, created_at FROM support_tickets WHERE type = ? ORDER BY created_at DESC";
    
            $stmt = $this->conn->prepare($sql);
            if (!$stmt) {
                return ['status' => 'error', 'message' => 'Database error: ' . $this->conn->error];
            }
    
            $stmt->bind_param('s', $type);
    
            if ($stmt->execute()) {
                $result = $stmt->get_result();
                $tickets = [];
                while ($row = $result->fetch_assoc()) {
                    $tickets[] = $row;
                }
                return ['status' => 'success', 'tickets' => $tickets];
            } else {
                return ['status' => 'error', 'message' => 'Failed to filter tickets: ' . $stmt->error];
            }
        }

        public function replyToTicket($ticketId, $replyMessage) {
            $sql = "UPDATE support_tickets SET reply_message = ? WHERE ticket_id = ?";
    
            $stmt = null;
            try {
                $stmt = $this->conn->prepare($sql);
            } catch (\mysqli_sql_exception $e) {
                // If reply_message column does not exist, attempt to add it and retry
                if (stripos($e->getMessage(), 'unknown column') !== false || stripos($e->getMessage(), '1054') !== false) {
                    $alter = "ALTER TABLE support_tickets ADD COLUMN reply_message TEXT NULL AFTER message";
                    try {
                        $this->conn->query($alter);
                        $stmt = $this->conn->prepare($sql);
                    } catch (\Exception $altErr) {
                        return ['status' => 'error', 'message' => 'Database error adding column: ' . $altErr->getMessage()];
                    }
                } else {
                    return ['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()];
                }
            }
            
            if (!$stmt) {
                return ['status' => 'error', 'message' => 'Failed to prepare statement'];
            }
    
            $stmt->bind_param('si', $replyMessage, $ticketId);
    
            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    // send email to user, then return success
                    $emailResult = $this->sendEmailToUser($ticketId, $replyMessage);
                    $userId = $this->getTicketUserId($ticketId);
                    if ($userId !== null) {
                        require_once __DIR__ . '/../Service/NotificationService.php';
                        $svc = NotificationService::createWithoutEmail($this->conn);
                        $title = "Your support ticket #{$ticketId} has a reply — please check your email.";
                        $svc->send($title, (int)$userId, 'support', null, false, false);
                    }
                    $resp = ['status' => 'success', 'message' => 'Reply added to ticket successfully', 'email_sent' => $emailResult === true];
                    if (is_string($emailResult) && $emailResult !== '') {
                        $resp['email_error'] = $emailResult;
                    }
                    return $resp;
                } else {
                    return ['status' => 'error', 'message' => 'Ticket not found or no changes made'];
                }
            } else {
                return ['status' => 'error', 'message' => 'Failed to add reply to ticket: ' . $stmt->error];
            }
        }

        private function getTicketUserId($ticketId) {
            $sql = "SELECT user_id FROM support_tickets WHERE ticket_id = ? LIMIT 1";
            $stmt = $this->conn->prepare($sql);
            if (!$stmt) return null;
            $stmt->bind_param('i', $ticketId);
            if (!$stmt->execute()) return null;
            $row = $stmt->get_result()->fetch_assoc();
            if (!$row) return null;
            return $row['user_id'] === null ? null : (int)$row['user_id'];
        }

        public function sendEmailToUser($ticketId, $replyMessage, $admin_name = 'Support Team') {
            $sql = "SELECT user_name, user_email FROM support_tickets WHERE ticket_id = ?";
    
            $stmt = $this->conn->prepare($sql);
            if (!$stmt) {
                return ['status' => 'error', 'message' => 'Database error: ' . $this->conn->error];
            }
    
            $stmt->bind_param('i', $ticketId);
    
            if ($stmt->execute()) {
                $result = $stmt->get_result();
                if ($result->num_rows > 0) {
                    $row = $result->fetch_assoc();
                    $userEmail = $row['user_email'];
    
                    require_once __DIR__ . '/../Service/EmailNotificationObserver.php';
                    $to = $userEmail;
                    $subject = "Reply to your support ticket #$ticketId";
                    $body = "Dear {$row['user_name']},\n\nThis is {$admin_name},\n\nWe have replied to your support ticket:\n\n{$replyMessage}\n\nBest regards,\n{$admin_name}";
                    $sent = EmailNotificationObserver::sendDirectMail($to, $subject, nl2br(htmlspecialchars($body, ENT_QUOTES, 'UTF-8')), true);
                    if ($sent === true) return true;
                    $err = EmailNotificationObserver::getLastError();
                    return is_string($err) && $err !== '' ? $err : 'Unknown email send error';
                }
                return false;
            }
            return false;
        }
}