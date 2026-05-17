<?php

declare(strict_types=1);

require_once __DIR__ . '/LikertStrategy.php';
require_once __DIR__ . '/TextStrategy.php';

class SurveyStrategyFactory
{
  public static function make(string $type): SurveyStrategyInterface
  {
    $type = strtolower(trim($type));
    switch ($type) {
      case 'likert':
        return new LikertStrategy();
      case 'text':
        return new TextStrategy();
      default:
        throw new Exception("Unknown survey question type: {$type}");
    }
  }
}

?>
