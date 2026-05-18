<?php

require_once '../Service/Log.php';
require_once '../Model/Database.php';
require_once '../Model/LogsView.php';

class LogsViewController
{
    private $model = null;
    private $log = null;

    public function __construct()
    {
        $this->log = new Log();
        $this->model = new SystemLogsModel();
    }

    public function getData(): array
    {
        try {
            $data = $this->model->getLast200LogsOfAll();
            $health = $this->model->checkSystemHealth();

            if (!$health['database'] || !$health['server'] || !$health['FileSystem']) {
                $this->log->logError("System health check failed...");
            }

            return [
                'statusCode' => 200,
                'body' => [
                    'status'  => 'success',
                    'ErrorLogs'=> $data['error'] ?? [],
                    'SecurityLogs' => $data['security'] ?? [],
                    'AppLogs'   => $data['info'] ?? [],
                    'serverConn'  => $health['server']    ? 'OK' : 'ERROR',
                    'databaseConn' => $health['database']  ? 'OK' : 'ERROR',
                    'fileSystem'  => $health['FileSystem'] ? 'OK' : 'ERROR',
                ],
            ];
        } catch (Exception $e) {
            $this->log->logError("LogsViewController error: " . $e->getMessage());
            return [
                'statusCode' => 500,
                'body' => [
                    'status'  => 'error',
                    'message' => 'Failed to retrieve logs',
                    'ErrorLogs' => [],
                    'SecurityLogs' => [],
                    'AppLogs' => [],
                    'serverConn'  => 'ERROR',
                    'databaseConn' => 'ERROR',
                    'fileSystem'  => 'ERROR',
                ],
            ];
        }
    }
}
