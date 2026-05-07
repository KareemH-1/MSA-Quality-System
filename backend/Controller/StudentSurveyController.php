<?php
  require_once '../Model/Database.php';
  require_once '../Model/StudentSurvey.php';

  class StudentSurveyController
  {
    private StudentSurvey $surveyModel;

    public function __construct()
    {
      $database = new Database();
      $db = $database->getConnection();
      $this->surveyModel = new StudentSurvey($db);
    }

    private function startSession()
    {
      if(session_status() === PHP_SESSION_NONE){
        session_start();
      }
    }

    private function requireStudent(): ?array
    {
      $this->startSession();

      if (empty($_SESSION['user_id']) || empty($_SESSION['role'])) {
          return [
              'statusCode' => 401,
              'body' => [
                  'status' => 'error',
                  'message' => 'Not authenticated',
              ],
          ];
      }

      if ($_SESSION['role'] !== 'Student') {
          return [
              'statusCode' => 403,
              'body' => [
                  'status' => 'error',
                  'message' => 'Forbidden',
              ],
          ];
      }

      return null; 
    }

    public function getMySurveys(): array
    {
      if($err = $this->requireStudent()) return $err;

      $studentId = (int)$_SESSION['user_id'];
      $surveys = $this->surveyModel->getStudentSurveys($studentId);

      foreach ($surveys as &$survey) {
        $survey['is_submitted'] = $survey['status'] === 'completed';
      }

      return [
        'statusCode' => 200,
        'body' => [
          'status' => 'success',
          'surveys' => $surveys,
        ],
      ];
    }

  public function getSurveyQuestions(int $surveyId, int $courseId): array
  {
    if($err = $this->requireStudent()) return $err;

    $studentId = (int)$_SESSION['user_id'];

    if($this->surveyModel->hasStudentCompletedSurvey($studentId, $surveyId, $courseId)){
      return [
        'statusCode' => 400,
        'body' => [
          'status' => 'error',
          'message' => 'Survey already completed',
        ],
      ];
    }

    if(!$this->surveyModel->isSurveyOpen($surveyId)){
      return [
        'statusCode' => 400,
        'body' => [
          'status' => 'error',
          'message' => 'Survey is not open',
        ],
      ];
    }

    $sections = $this->surveyModel->getSurveyQuestions($surveyId, $courseId);


    return [
      'statusCode' => 200,
      'body' => [
        'status' => 'success',
        'sections' => $sections,
      ],
    ];
  }

  public function submitSurvey(array $data): array 
  {
    if($err = $this->requireStudent()) return $err;

    foreach(['survey_id', 'course_id', 'answers'] as $key){
      if(!isset($data[$key]) || $data[$key] === ''){
        return [
          'statusCode' => 400,
          'body' => [
            'status' => 'error',
            'message' => "Missing field: {$key}",
          ],
        ];
      }
    }

    $studentId = (int)$_SESSION['user_id'];
    $surveyId = (int)$data['survey_id'];
    $courseId = (int)$data['course_id'];
    $answers = $data['answers'];

    if(empty($answers) || !is_array($answers)){
      return [
        'statusCode' => 400,
        'body' => [
          'status' => 'error',
          'message' => "Answers must be a non-empty array",
        ],
      ];
    }

    if($this->surveyModel->hasStudentCompletedSurvey($studentId, $surveyId, $courseId)){
      return [
        'statusCode' => 400,
        'body' => [
          'status' => 'error',
          'message' => 'Survey already completed',
        ],
      ];
    }

    if(!$this->surveyModel->isSurveyOpen($surveyId)){
      return [
        'statusCode' => 400,
        'body' => [
          'status' => 'error',
          'message' => 'Survey is not open',
        ],
      ];
    }

    if (!$this->surveyModel->isCourseLinkedToSurvey($surveyId, $courseId)) {
      return [
          'statusCode' => 403,
          'body' => ['status' => 'error', 'message' => 'This survey is not available for this course.'],
      ];
    }

    $questions = $this->surveyModel->getSurveyQuestions($surveyId, $courseId);
    $answeredIds = array_column($answers, 'question_id');

    foreach($questions as $section){
      foreach($section['questions'] as $q){
          if ($q['is_required'] && !in_array($q['question_id'], array_map('intval', $answeredIds))) {
          return [
            'statusCode' => 400,
            'body' => [
              'status' => 'error',
              'message' => "All questions must be answered. Missing question ID: {$q['question_id']}",
            ],
          ];
        }
      }
    }

    $ok = $this->surveyModel->submitSurvey($studentId, $surveyId, $courseId, $answers);

    if(!$ok){
      return [
        'statusCode' => 500,
        'body' => [
          'status' => 'error',
          'message' => 'Failed to submit survey',
        ],
      ];
    }

    return [
      'statusCode' => 200,
      'body' => [
        'status' => 'success',
        'message' => 'Survey submitted successfully',
      ],
    ];
  }
}


?>