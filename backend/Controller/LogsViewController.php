<?php

require_once '../Service/Log.php';
require_once '../Model/Database.php';
require_once '../Model/LogsView.php';
class LogsViewController
{
    private $model = null;

    public function __construct()
    {
        $this->log = new Log();
        $this->model = new LogsView();
    }


    public function getData(): array
    {

        $data = $this->model->getLast200LogsOfAll();

        $health = $this->model->checkSystemHealth();
        if (!$health['database'] || !$health['server'] || !$health['FileSystem']) {
            $this->log->logError("System health check failed - Database: {$health['database']}, Server: {$health['server']}, FileSystem: {$health['FileSystem']}");
        }
        return [
            'statusCode' => 200,
            'body' => [
                'status' => 'success',
                'data' => $data,
                'health' => $health
            ],
        ];
                    
    }
}