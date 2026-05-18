<?php
class SystemLogsModel {
    private $conn;
    private $log;
    public function __construct() {
        $this->conn = (new Database())->getConnection();
        $this->log = new Log();
    }

    public function checkSystemHealth() {
        $databaseH = false;
        $serverH = true;
        $logsH = false;
        if ($this->conn->connect_error) {
            $databaseH = false;
        } else {
            $databaseH = true;
        }

        $couldReadInfo = is_readable('../storage/logs/app.log');
        $couldReadSecurity = is_readable('../storage/logs/security.log');
        $couldReadError = is_readable('../storage/logs/error.log');

        if ($couldReadInfo && $couldReadSecurity && $couldReadError) {
            $logsH = true;
        } else {
            $logsH = false;
        }

        return [
            'database' => $databaseH,
            'server' => $serverH,
            'FileSystem' => $logsH
        ];
    }

    private function parseLogs(array $rawLogs): array {
        $parsed = [];
        foreach ($rawLogs as $line) {
            $line = trim($line);
            if (empty($line)) continue;
            
            // Parse format: [YYYY-MM-DD HH:MM:SS] TYPE: message
            if (preg_match('/\[(.*?)\]\s+(.*?):\s+(.*)/', $line, $matches)) {
                $parsed[] = [
                    'timestamp' => $matches[1],
                    'type' => trim($matches[2]),
                    'message' => trim($matches[3])
                ];
            }
        }
        return $parsed;
    }

    public function getLast200LogsOfAll(){
        $rawInfoLogs = array_slice($this->log->getLogs('info'), -200);
        $rawSecurityLogs = array_slice($this->log->getLogs('security'), -200);
        $rawErrorLogs = array_slice($this->log->getLogs('error'), -200);

        return [
            'info' => $this->parseLogs($rawInfoLogs),
            'security' => $this->parseLogs($rawSecurityLogs),
            'error' => $this->parseLogs($rawErrorLogs)
        ];
    }
}
?>