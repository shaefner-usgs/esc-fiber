<?php

/**
 * Set HTTP Headers.
 *
 * @param $header {String}
 *     Optional additional header to set
 */
function setHeaders($header = '') {
  if ($header) {
    header($header);
  } else { // default headers (for all responses)
    header('Cache-control: no-cache, must-revalidate');
    header('Content-Type: application/json');
    header('Expires: ' . date(DATE_RFC2822));
  }
}

/**
 * Sanitize a URL parameter value.
 *
 * @param $name {String}
 *     The parameter name
 * @param $default {?} default is ''
 *     Optional default value if the given parameter value does not exist
 *
 * @return $value {String}
 */
function safeParam ($name, $default='') {
  $value = $default;

  if (isSet($_GET[$name]) && $_GET[$name] !== '') {
    $value = filter_input(INPUT_GET, $name, FILTER_UNSAFE_RAW, [
      'flags' => FILTER_FLAG_STRIP_BACKTICK
    ]);
  }

  return $value;
}
