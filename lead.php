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

function load_mail_config() {
  $path = __DIR__ . '/mail-config.php';
  if (!is_file($path)) {
    return null;
  }
  $cfg = require $path;
  return is_array($cfg) ? $cfg : null;
}

function smtp_send($cfg, $to, $subject, $body, $replyTo = '') {
  $host = $cfg['smtp_host'] ?? 'smtp.hostinger.com';
  $port = (int)($cfg['smtp_port'] ?? 465);
  $user = $cfg['smtp_user'] ?? '';
  $pass = $cfg['smtp_pass'] ?? '';
  $from = $cfg['from_email'] ?? $user;
  $fromName = $cfg['from_name'] ?? 'world Service Hub';

  if ($user === '' || $pass === '') {
    return false;
  }

  $errno = 0;
  $errstr = '';
  $socket = @stream_socket_client(
    "ssl://{$host}:{$port}",
    $errno,
    $errstr,
    30,
    STREAM_CLIENT_CONNECT
  );
  if (!$socket) {
    return false;
  }

  $read = function () use ($socket) {
    $data = '';
    while ($line = fgets($socket, 515)) {
      $data .= $line;
      if (isset($line[3]) && $line[3] === ' ') {
        break;
      }
    }
    return $data;
  };

  $write = function ($cmd) use ($socket) {
    fwrite($socket, $cmd . "\r\n");
  };

  $read();
  $write('EHLO worldservices');
  $read();
  $write('AUTH LOGIN');
  $read();
  $write(base64_encode($user));
  $read();
  $write(base64_encode($pass));
  $auth = $read();
  if (strpos($auth, '235') === false) {
    fclose($socket);
    return false;
  }

  $write('MAIL FROM:<' . $from . '>');
  $read();
  $write('RCPT TO:<' . $to . '>');
  $read();
  $write('DATA');
  $read();

  $headers = [];
  $headers[] = 'From: ' . $fromName . ' <' . $from . '>';
  $headers[] = 'To: <' . $to . '>';
  $headers[] = 'Subject: =?UTF-8?B?' . base64_encode($subject) . '?=';
  $headers[] = 'MIME-Version: 1.0';
  $headers[] = 'Content-Type: text/plain; charset=UTF-8';
  $headers[] = 'Content-Transfer-Encoding: 8bit';
  if ($replyTo !== '') {
    $headers[] = 'Reply-To: ' . $replyTo;
  }
  $headers[] = 'Date: ' . date('r');

  $message = implode("\r\n", $headers) . "\r\n\r\n" . str_replace("\n.", "\n..", $body) . "\r\n.";
  $write($message);
  $dataResp = $read();
  $write('QUIT');
  fclose($socket);

  return strpos($dataResp, '250') !== false;
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
  echo json_encode(['ok' => false, 'error' => 'Name, contact, and service are required.']);
  exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
  http_response_code(422);
  echo json_encode(['ok' => false, 'error' => 'Invalid email address.']);
  exit;
}

$cfg = load_mail_config();
if (!$cfg) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Mail config missing']);
  exit;
}

$toTeam = $cfg['notify_email'] ?? 'info@hhnexusmarketing.com';
$subject = 'world Service Hub lead — ' . $service;
$body = "New inquiry from world Service Hub chatbot\n\n"
  . "Name: {$name}\n"
  . "City: {$city}\n"
  . "Email: {$email}\n"
  . "Service: {$service}\n\n"
  . "Requirements:\n{$detail}\n\n"
  . "Page: {$page}\n";

$teamOk = smtp_send($cfg, $toTeam, $subject, $body, $email);

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

$userOk = smtp_send($cfg, $email, $userSubject, $userBody, $toTeam);

if (!$teamOk) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Could not send lead email via SMTP']);
  exit;
}

echo json_encode([
  'ok' => true,
  'team' => true,
  'user' => (bool)$userOk,
]);
