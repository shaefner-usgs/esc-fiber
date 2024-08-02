<?php

include_once '../../conf/config.inc.php'; // app config
include_once '../../lib/_functions.inc.php'; // app functions
include_once '../../lib/classes/Db.class.php'; // db connector, queries

setHeaders();

$cable = safeParam('cable');

$db = new Db();
$rsMetadata = $db->queryMetadata($cable);
$rsReferences = $db->queryReferences($cable);

$protocol = isset($_SERVER['HTTPS']) && strtolower($_SERVER['HTTPS']) === 'on' ?
  'https' : 'http';

$template = [
  'id' => $cable,
  'metadata' => [
    'generated' => floor(microtime(true) * 1000),
    'url' => "$protocol://" . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']
  ],
  'experiments' => []
];

$references = [];

// Store references in an Array.
while ($ref = $rsReferences->fetch(PDO::FETCH_OBJ)) {
  $key = 'experiment' . $ref->experiment_id;

  if (!array_key_exists($key, $references)) {
    $references[$key] = [];
  }

  $references[$key][] = [
    'author' => $ref->author,
    'doi' => $ref->doi,
    'title' => $ref->title,
    'year' => $ref->year
  ];
}

// Add experiments to template.
while ($exp = $rsMetadata->fetch(PDO::FETCH_OBJ)) {
  $key = 'experiment' . $exp->experiment_id;
  $path = $APP_DIR . '/htdocs/img/plots';
  $plot = $exp->cable_id . '-' . $exp->experiment_id . '.png';

  if (!file_exists("$path/$plot")) {
    $plot = '';
  }

  if (array_key_exists($key, $references)) {
    $references = $references[$key];
  }

  $template['experiments'][$key] = [
    'Acquisition' => [
      'channels' => $exp->channels,
      'endtime' => $exp->end_time,
      'interval' => $exp->spatial_interval,
      'length' => $exp->gauge_length,
      'rate' => $exp->sample_rate,
      'starttime' => $exp->start_time
    ],
    'Interrogator' => [
      'manufacturer' => $exp->manufacturer,
      'model' => $exp->model
    ],
    'Overview' => [
      'doi' => $exp->doi,
      'enddate' => $exp->end_date,
      'pi' => $exp->pi,
      'pi_email' => $exp->pi_email,
      'plot' => $plot,
      'reference' => $exp->reference,
      'startdate' => $exp->start_date
    ],
    'References' => $references
  ];
}

print json_encode($template, JSON_UNESCAPED_SLASHES);
