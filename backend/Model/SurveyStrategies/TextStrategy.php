<?php

declare(strict_types=1);

require_once __DIR__ . '/SurveyStrategyInterface.php';

class TextStrategy implements SurveyStrategyInterface
{
  public function saveAnswer(mysqli $conn, int $responseId, array $answer): bool
  {
    $questionId = (int)($answer['question_id'] ?? 0);
    $responseId = (int)$responseId;
    $answerText = (string)($answer['answer_text'] ?? '');
    $escaped = $conn->real_escape_string($answerText);

    $sql = "INSERT INTO answers (response_id, question_id, answer_text, likert_score) VALUES ({$responseId}, {$questionId}, '{$escaped}', NULL)";
    $ok = $conn->query($sql);
    return $ok !== false;
  }
}

?>
