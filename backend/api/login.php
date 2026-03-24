<?php

// Keep API responses JSON-only even if warnings happen in development.
ini_set("display_errors", "0");

// Allow local Vite dev origins (5173/5174) so fetch is not blocked by CORS.
$allowedOrigins = ["http://localhost:5173", "http://localhost:5174"];
$origin = $_SERVER["HTTP_ORIGIN"] ?? "";

if (in_array($origin, $allowedOrigins, true)) {
  header("Access-Control-Allow-Origin: {$origin}");
}

header("Vary: Origin");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
  http_response_code(204);
  exit;
}

class Database {
  private $host = "127.0.0.1";
  private $db = "msa_quality_system";
  private $username = "root";
  private $password = "";

  public function connect() {
    return new PDO(
      "mysql:host={$this->host};dbname={$this->db};charset=utf8mb4",
      $this->username,
      $this->password,
      [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
      ]
    );
  }
}

function jsonResponse($data, $statusCode = 200) {
  http_response_code($statusCode);
  echo json_encode($data);
  exit;
}

$input = json_decode(file_get_contents("php://input"), true);

$email = trim($input["email"] ?? "");
$password = $input["password"] ?? "";
$role = $input["role"] ?? "";

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  jsonResponse(["message" => "Invalid email format"], 400);
}

if ($password === "") {
  jsonResponse(["message" => "Password is required"], 400);
}

$allowedRoles = ["student", "staff"];
if (!in_array($role, $allowedRoles, true)) {
  jsonResponse(["message" => "Invalid role"], 400);
}

try {
  $db = (new Database())->connect();

  $stmt = $db->prepare("SELECT id, full_name, email, role, password_hash FROM users WHERE email = ? AND role = ? AND is_active = 1 LIMIT 1");
  $stmt->execute([$email, $role]);
  $user = $stmt->fetch();

  if (!$user) {
    jsonResponse(["message" => "Invalid credentials"], 401);
  }

  if (!password_verify($password, $user["password_hash"])) {
    jsonResponse(["message" => "Invalid credentials"], 401);
  }

  $token = bin2hex(random_bytes(32));
  $tokenHash = hash("sha256", $token);
  $expiresAt = date("Y-m-d H:i:s", strtotime("+7 days"));

  $stmt = $db->prepare("INSERT INTO auth_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)");
  $stmt->execute([$user["id"], $tokenHash, $expiresAt]);

  jsonResponse([
    "message" => "Login successful",
    "token" => $token,
    "user" => [
      "id" => $user["id"],
      "name" => $user["full_name"],
      "email" => $user["email"],
      "role" => $user["role"]
    ]
  ], 200);

} catch (Exception $e) {
  jsonResponse(["message" => "Server error"], 500);
}