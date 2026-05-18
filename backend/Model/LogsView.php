<?php
class LogsView {
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

        $couldReadInfo = is_readable('../logs/info.log');
        $couldReadSecurity = is_readable('../logs/security.log');
        $couldReadError = is_readable('../logs/error.log');

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

    public function getLast200LogsOfAll(){
        
        $infoLogs = array_slice($this->log->getLogs('info'), -200);
        $securityLogs = array_slice($this->log->getLogs('security'), -200);
        $errorLogs = array_slice($this->log->getLogs('error'), -200);

        return [
            'info' => $infoLogs,
            'security' => $securityLogs,
            'error' => $errorLogs
        ];
    }
}
?>