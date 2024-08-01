<?php

date_default_timezone_set('UTC');

$CONFIG_INI_FILE = dirname(__FILE__) . '/config.ini';
if (!file_exists($CONFIG_INI_FILE)) {
  trigger_error('Application not configured. Run pre-install script.');
  exit(-1);
}

$CONFIG = parse_ini_file($CONFIG_INI_FILE);

$APP_DIR = $CONFIG['APP_DIR'];
$DB_DSN = $CONFIG['DB_DSN'];
$DB_USER = $CONFIG['DB_USER'];
$DB_PASS = $CONFIG['DB_PASS'];
$MOUNT_PATH = $CONFIG['MOUNT_PATH'];
