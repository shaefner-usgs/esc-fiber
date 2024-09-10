<?php

include_once '../../conf/config.inc.php'; // app config
include_once '../../lib/_functions.inc.php'; // app functions
include_once '../../lib/classes/Db.class.php'; // db connector, queries

$db = new Db();
$rsCables = $db->queryCables();

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
    'type' => 'LineString',
    'coordinates' => []
  ],
  'properties' => [
    'code' => '',
    'name' => ''
  ]
];

$cables = [];
$features = [];

// Store cable data in an Array.
while ($point = $rsCables->fetch(PDO::FETCH_OBJ)) {
  $id = $point->cable_id;

  if (!array_key_exists($id, $cables)) {
    $cables[$id] = [
      'code' => $point->code,
      'coords' => [],
      'name' => $point->name
    ];
  }

  $cables[$id]['coords'][] = [
    floatval($point->lng),
    floatval($point->lat)
  ];
}

// Store features in an Array.
foreach($cables as $id => $cable) {
  $feature['id'] = $id;
  $feature['geometry']['coordinates'] = $cable['coords'];
  $feature['properties']['code'] = $cable['code'];
  $feature['properties']['name'] = $cable['name'];

  $features[] = $feature;
}

// Render the JSON feed
$template['features'] = $features;
$template['metadata']['count'] = count($features);

setHeaders();

print json_encode($template, JSON_UNESCAPED_SLASHES);
