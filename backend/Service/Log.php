<?php
class Log {
    private $info_path = __DIR__ . '/../storage/logs/app.log';
    private $security_path = __DIR__ . '/../storage/logs/security.log';
    private $error_path = __DIR__ . '/../storage/logs/error.log';

    public function __construct() {
        if (!file_exists($this->info_path)) {
            file_put_contents($this->info_path, '');
        }
        if (!file_exists($this->security_path)) {
            file_put_contents($this->security_path, '');
        }
        if (!file_exists($this->error_path)) {
            file_put_contents($this->error_path, '');
        }
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