<?php

declare(strict_types=1);

interface SurveyStrategyInterface
{
  /**
   * Persist a single answer for a response.
   * @param mysqli $conn
   * @param int $responseId
   * @param array $answer
   * @return bool
   */
  public function saveAnswer(mysqli $conn, int $responseId, array $answer): bool;
}

?>
