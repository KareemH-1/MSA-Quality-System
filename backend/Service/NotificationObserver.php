<?php

declare(strict_types=1);

interface NotificationObserver
{
  public function update(string $event, array $data): void;
}