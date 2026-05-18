<?php

declare(strict_types=1);

interface SurveyStrategyInterface
{

  public function saveAnswer(mysqli $conn, int $responseId, array $answer): bool;
}

?>
