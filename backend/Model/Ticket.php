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
            $sql = "SELECT ticket_id AS id, user_id, user_name, user_email, message, type, priority, status, created_at FROM support_tickets ORDER BY created_at DESC";
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

        public function filterByType($type) {
            $sql = "SELECT ticket_id AS id, user_id, user_name, user_email, message, type, priority, status, created_at FROM support_tickets WHERE type = ? ORDER BY created_at DESC";
    
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
    
            $stmt = $this->conn->prepare($sql);
            if (!$stmt) {
                return ['status' => 'error', 'message' => 'Database error: ' . $this->conn->error];
            }
    
            $stmt->bind_param('si', $replyMessage, $ticketId);
    
            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    // send email to user, then return success
                    $this->sendEmailToUser($ticketId, $replyMessage);
                    return ['status' => 'success', 'message' => 'Reply added to ticket successfully'];
                } else {
                    return ['status' => 'error', 'message' => 'Ticket not found or no changes made'];
                }
            } else {
                return ['status' => 'error', 'message' => 'Failed to add reply to ticket: ' . $stmt->error];
            }
        }

        public function sendEmailToUser($ticketId, $replyMessage, $admin_name = 'Support Team') {
            // Get user email from the ticket
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
    
                    // Send email to user
                    $to = $userEmail;
                    $subject = "Reply to your support ticket #$ticketId";
                    $message = "Dear $row[user_name]\nThis is $admin_name,\n\nWe have replied to your support ticket:\n\n$replyMessage\n\nBest regards,\n$admin_name";
                    $headers = "From: sgaffairs@msa.edu.eg";
    
                    mail($to, $subject, $message, $headers);
                }
            }
        }
}