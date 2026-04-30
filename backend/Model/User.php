<?php
class User {
    private $conn;
    private $table_name = "users";

    public function __construct($db) {
        $this->conn = $db;
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
}
?>