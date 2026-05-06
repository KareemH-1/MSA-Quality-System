<?php
require_once 'JsonView.php';
require_once '../Controller/StudentSurveyController.php';


class StudentSurveyView extends JsonView
{
  private StudentSurveyController $controller;

  public function __construct()
  {
    $this->controller = new StudentSurveyController();
  }

  public function handle(): void
  {
    header('Content-Type: application/json');

    $action = $_GET['action'] ?? '';
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    switch($action){
      case 'my-surveys': {
        $result = $this->controller->getMySurveys();
        break;
      }

      case 'survey-questions': {
        $surveyId = isset($_GET['surveyId']) ? (int)$_GET['surveyId'] : 0;
        $courseId = isset($_GET['courseId']) ? (int)$_GET['courseId'] : 0;

        if(!$surveyId || !$courseId){
          $result = [
            'statusCode' => 400,
            'body' => [
              'status' => 'error',
              'message' => 'Missing surveyId or courseId parameter',
            ],
          ];
          break;
        }

        $result = $this->controller->getSurveyQuestions($surveyId, $courseId);
        break;
      }

      case 'submit': {
        if($method !== 'POST'){
            $result = [
            'statusCode' => 405,
            'body' => [
              'status' => 'error',
              'message' => 'Method not allowed',
            ],
          ];
          break;
        }

        $data = $this->readJsonBody();
        $result = $this->controller->submitSurvey($data);
        break;
      }
    }
  }
}


?>