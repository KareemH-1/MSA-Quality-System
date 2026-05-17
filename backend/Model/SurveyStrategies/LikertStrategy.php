<?php

declare(strict_types=1);

require_once __DIR__ . '/SurveyStrategyInterface.php';

class LikertStrategy implements SurveyStrategyInterface
{
  public function saveAnswer(mysqli $conn, int $responseId, array $answer): bool
  {
    $questionId = (int)($answer['question_id'] ?? 0);
    $responseId = (int)$responseId;
    $likertScore = (int)($answer['answer_text'] ?? 0);

    $sql = "INSERT INTO answers (response_id, question_id, answer_text, likert_score) VALUES ({$responseId}, {$questionId}, NULL, {$likertScore})";
    $ok = $conn->query($sql);
    return $ok !== false;
  }
}

?>
