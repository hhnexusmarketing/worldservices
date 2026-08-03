<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
  exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
  $data = $_POST;
}

$name = trim((string)($data['name'] ?? ''));
$email = trim((string)($data['email'] ?? $data['contact'] ?? ''));
$city = trim((string)($data['city'] ?? ''));
$service = trim((string)($data['service'] ?? ''));
$detail = trim((string)($data['detail'] ?? $data['message'] ?? ''));
$page = trim((string)($data['page'] ?? ''));

if ($name === '' || $email === '' || $service === '') {
  http_response_code(422);
  echo json_encode(['ok' => false, 'error' => 'Name, email, and service are required.']);
  exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(422);
  echo json_encode(['ok' => false, 'error' => 'Invalid email address.']);
  exit;
}

$toTeam = 'info@hhnexusmarketing.com';
$from = 'info@hhnexusmarketing.com';
$subject = 'world Service Hub lead — ' . $service;

$body = "New inquiry from world Service Hub chatbot\n\n"
  . "Name: {$name}\n"
  . "City: {$city}\n"
  . "Email: {$email}\n"
  . "Service: {$service}\n\n"
  . "Requirements:\n{$detail}\n\n"
  . "Page: {$page}\n";

$headersTeam = [
  'MIME-Version: 1.0',
  'Content-Type: text/plain; charset=UTF-8',
  'From: world Service Hub <' . $from . '>',
  'Reply-To: ' . $email,
];

$teamOk = @mail($toTeam, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $headersTeam));

$userSubject = 'We received your inquiry — world Service Hub';
$userBody = "Hi {$name},\n\n"
  . "Thanks for contacting world Service Hub. We received your details and will reply shortly.\n\n"
  . "Summary\n"
  . "Service: {$service}\n"
  . "City: {$city}\n"
  . "Your email: {$email}\n\n"
  . "Requirements:\n{$detail}\n\n"
  . "This confirmation was sent automatically so you can see how email lead automation works.\n\n"
  . "— world Service Hub\n";

$headersUser = [
  'MIME-Version: 1.0',
  'Content-Type: text/plain; charset=UTF-8',
  'From: world Service Hub <' . $from . '>',
  'Reply-To: ' . $toTeam,
];

$userOk = @mail($email, '=?UTF-8?B?' . base64_encode($userSubject) . '?=', $userBody, implode("\r\n", $headersUser));

if (!$teamOk) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Could not send lead email']);
  exit;
}

echo json_encode([
  'ok' => true,
  'team' => true,
  'user' => (bool)$userOk,
]);
