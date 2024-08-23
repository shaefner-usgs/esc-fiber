<?php

include_once '../../conf/config.inc.php'; // app config
include_once '../../lib/_functions.inc.php'; // app functions
include_once '../../lib/classes/Stations.class.php'; // CSV -> GeoJSON translator

// Store the sanitized URL parameters in an Array.
$pairs = explode('&', $_SERVER['QUERY_STRING']);
$params = [];

foreach($pairs as $pair) {
  list($name, $value) = explode('=', $pair);

  $params[$name] = safeParam($name);
}

// Render the JSON feed or an error.
try {
  $stations = new Stations($params, $_SERVER['REQUEST_URI']);

  setHeaders();

  $stations->render();
} catch (Exception $e) {
  setHeaders('HTTP/1.0 500 Internal Server Error');

  print '<p class="alert error">ERROR: ' . $e->getMessage() . '</p>';
}
