<?php

include_once '../../conf/config.inc.php'; // app config
include_once '../../lib/_functions.inc.php'; // app functions
include_once '../../lib/classes/Db.class.php'; // db connector, queries

$cable = safeParam('cable');

$db = new Db();
$rsMetadata = $db->queryMetadata($cable);
$rsReferences = $db->queryReferences($cable);

$protocol = isset($_SERVER['HTTPS']) && strtolower($_SERVER['HTTPS']) === 'on' ?
  'https' : 'http';

$template = [
  'id' => $cable,
  'metadata' => [
    'count' => 0,
    'generated' => floor(microtime(true) * 1000),
    'url' => "$protocol://" . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']
  ],
  'experiments' => []
];

$experiments = [];
$refs = [];

// Store references in an Array.
while ($ref = $rsReferences->fetch(PDO::FETCH_OBJ)) {
  $id = 'experiment' . $ref->experiment_id;

  if (!array_key_exists($id, $refs)) {
    $refs[$id] = [];
  }

  $refs[$id][] = [
    'author' => $ref->author,
    'doi' => $ref->doi,
    'primary' => intval($ref->primary),
    'title' => $ref->title,
    'year' => $ref->year
  ];
}

// Store experiments in an Array (add add the references).
while ($exp = $rsMetadata->fetch(PDO::FETCH_OBJ)) {
  $id = 'experiment' . $exp->experiment_id;
  $path = $APP_DIR . '/htdocs/img/plots';
  $plot = $exp->cable_id . '-' . $exp->experiment_id . '.png';
  $references = []; // default

  if (!file_exists("$path/$plot")) {
    $plot = '';
  }
  if (array_key_exists($id, $refs)) {
    $references = $refs[$id];
  }

  $experiments[] = [
    'id' => $id,
    'acquisition' => [
      'channels' => $exp->channels,
      'endtime' => $exp->end_time,
      'interval' => $exp->spatial_interval,
      'length' => $exp->gauge_length,
      'rate' => $exp->sample_rate,
      'starttime' => $exp->start_time
    ],
    'interrogator' => [
      'manufacturer' => $exp->manufacturer,
      'model' => $exp->model
    ],
    'overview' => [
      'caption' => $exp->caption,
      'doi' => $exp->doi,
      'enddate' => $exp->end_date,
      'magthresh' => floatval($exp->magthresh),
      'pi' => $exp->pi,
      'pi_email' => $exp->pi_email,
      'plot' => $plot,
      'repository' => $exp->repository,
      'startdate' => $exp->start_date
    ],
    'references' => $references
  ];
}

// Render the JSON feed
$template['experiments'] = $experiments;
$template['metadata']['count'] = count($experiments);

setHeaders();

print json_encode($template, JSON_UNESCAPED_SLASHES);
