<?php
class Log {
    private $info_path;
    private $security_path;
    private $error_path;

    public function __construct() {
        $logDir = __DIR__ . '/../../storage/logs';

        // Create the directory if it doesn't exist
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }

        $this->info_path = $logDir . '/app.log';
        $this->security_path = $logDir . '/security.log';
        $this->error_path = $logDir . '/error.log';

        if (!file_exists($this->info_path)) file_put_contents($this->info_path, '');
        if (!file_exists($this->security_path)) file_put_contents($this->security_path, '');
        if (!file_exists($this->error_path)) file_put_contents($this->error_path, '');
    }

    public function logInfo($message) {
        $timestamp = date('Y-m-d H:i:s');
        file_put_contents($this->info_path, "[$timestamp] INFO: $message\n", FILE_APPEND);
    }

    public function logSecurity($message) {
        $timestamp = date('Y-m-d H:i:s');
        file_put_contents($this->security_path, "[$timestamp] SECURITY: $message\n", FILE_APPEND);
    }

    public function logError($message) {
        $timestamp = date('Y-m-d H:i:s');
        file_put_contents($this->error_path, "[$timestamp] ERROR: $message\n", FILE_APPEND);
    }

    public function getLogs($type) {
        $path = '';
        switch ($type) {
            case 'info':
                $path = $this->info_path;
                break;
            case 'security':
                $path = $this->security_path;
                break;
            case 'error':
                $path = $this->error_path;
                break;
            default:
                return [];
        }

        if (file_exists($path)) {
            return file($path);
        }
        return [];
    }

    public function clearLogs($type) {
        $path = '';
        switch ($type) {
            case 'info':
                $path = $this->info_path;
                break;
            case 'security':
                $path = $this->security_path;
                break;
            case 'error':
                $path = $this->error_path;
                break;
            default:
                return false;
        }

        if (file_exists($path)) {
            file_put_contents($path, '');
            return true;
        }
        return false;
    }
}