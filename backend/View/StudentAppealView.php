<?php

require_once 'JsonView.php';
require_once '../Controller/StudentAppealController.php';

class StudentAppealView extends JsonView
{
	private StudentAppealController $controller;

	public function __construct()
	{
		$this->controller = new StudentAppealController();
	}

	public function handle(): void
	{
		header('Content-Type: application/json');

		$action = $_GET['action'] ?? '';
		$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

		switch ($action) {
			case 'sessions': {
				$result = $this->controller->getSessions();
				break;
			}
			case 'enrolled-courses': {
				$semester = null;
				if (isset($_GET['semester']) && $_GET['semester'] !== '') {
					$semester = (string)$_GET['semester'];
				}
				$result = $this->controller->getEnrolledCourses($semester);
				break;
			}
			case 'my-appeals': {
				$result = $this->controller->getMyAppeals();
				break;
			}
			case 'submit': {
				if (strtoupper($method) !== 'POST') {
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
				$result = $this->controller->submit($data);
				break;
			}
			default: {
				$result = [
					'statusCode' => 400,
					'body' => [
						'status' => 'error',
						'message' => 'Unknown action',
						'allowed' => ['sessions', 'enrolled-courses', 'my-appeals', 'submit'],
					],
				];
				break;
			}
		}

		$this->respond($result['statusCode'], $result['body']);
	}
}

$view = new StudentAppealView();
$view->handle();

