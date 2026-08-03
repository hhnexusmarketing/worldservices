<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'POST only']);
  exit;
}

$target = __DIR__ . '/mail-config.php';
if (is_file($target)) {
  echo json_encode(['ok' => true, 'message' => 'already configured']);
  exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
  $data = $_POST;
}

$token = (string)($data['token'] ?? '');
$pass = (string)($data['smtp_pass'] ?? '');
if ($token !== 'world-mail-setup-2026' || $pass === '') {
  http_response_code(403);
  echo json_encode(['ok' => false, 'error' => 'Forbidden']);
  exit;
}

$php = "<?php\nreturn [\n"
  . "  'smtp_host' => 'smtp.hostinger.com',\n"
  . "  'smtp_port' => 465,\n"
  . "  'smtp_user' => 'info@hhnexusmarketing.com',\n"
  . "  'smtp_pass' => " . var_export($pass, true) . ",\n"
  . "  'from_email' => 'info@hhnexusmarketing.com',\n"
  . "  'from_name' => 'world Service Hub',\n"
  . "  'notify_email' => 'info@hhnexusmarketing.com',\n"
  . "];\n";

if (file_put_contents($target, $php) === false) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Could not write config']);
  exit;
}

echo json_encode(['ok' => true, 'configured' => true]);
