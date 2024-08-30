<?php

include_once '../../conf/config.inc.php'; // app config
include_once '../../lib/_functions.inc.php'; // app functions
include_once '../../lib/classes/Db.class.php'; // db connector, queries

$cable = safeParam('cable');
$experiment = safeParam('experiment');

$db = new Db();
$rsExperiment = $db->queryExperiment($cable, $experiment);

$protocol = isset($_SERVER['HTTPS']) && strtolower($_SERVER['HTTPS']) === 'on' ?
  'https' : 'http';

$template = [
  'type' => 'FeatureCollection',
  'metadata' => [
    'count' => 0,
    'generated' => floor(microtime(true) * 1000),
    'url' => "$protocol://" . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']
  ],
  'features' => []
];

$feature = [
  'type' => 'Feature',
  'id' => '',
  'geometry' => [
    'type' => 'Point',
    'coordinates' => []
  ],
  'properties' => [
    'distance' => ''
  ]
];

$features = [];

// Store features in an Array.
while ($point = $rsExperiment->fetch(PDO::FETCH_OBJ)) {
  $feature['id'] = $point->channel_id;
  $feature['geometry']['coordinates'] = [
    floatval($point->lng),
    floatval($point->lat)
  ];
  $feature['properties']['distance'] = floatval($point->distance);

  $features[] = $feature;
}

// Render the JSON feed
$template['features'] = $features;
$template['metadata']['count'] = count($features);

setHeaders();

print json_encode($template, JSON_UNESCAPED_SLASHES);
