<?php

/**
 * Translator for IRIS/NSF SAGE Seismic Station metadata from CSV to GeoJSON.
 *
 * See: https://service.iris.edu/fdsnws/station/1/
 *
 * @author Scott Haefner <shaefner@usgs.gov>
 */
class Stations {
  private $_features,
          $_template,
          $_url;

  public function __construct($params, $uri) {
    $this->_features = [];
    $this->_url = $this->_getUrl($params);
    $this->_template = $this->_getTemplate($uri);

    $this->_search();
  }

  /**
   * Get the GeoJSON feature for the given station.
   *
   * @param $station {Array}
   *
   * @return {Array}
   */
  private function _getFeature ($station) {
    $x = floatval($station[3]);
    $y = floatval($station[2]);
    $z = floatval($station[4]);

    return [
      'type' => 'Feature',
      'id' => $station[1],
      'geometry' => [
        'type' => 'Point',
        'coordinates' => [$x, $y, $z]
      ],
      'properties' => [
        'name' => $station[5],
        'network' => $station[0]
      ]
    ];
  }

  /**
   * Get the radius in degrees (convert from km).
   *
   * @param $km {Number}
   *
   * @return {Number}
   */
  private function _getRadius ($km) {
    $radius = 6371; // Earth's mean radius

    return $km * 180 / (M_PI * $radius);
  }

  /**
   * Get the GeoJSON feed template.
   *
   * @param $uri {String}
   *   REQUEST_URI of calling script
   *
   * @return {Array}
   */
  private function _getTemplate ($uri) {
    $protocol = isset($_SERVER['HTTPS']) && strtolower($_SERVER['HTTPS']) === 'on' ?
      'https' : 'http';

    return [
      'type' => 'FeatureCollection',
      'metadata' => [
        'count' => 0,
        'generated' => floor(microtime(true) * 1000),
        'sourceUrl' => $this->_url,
        'url' => "$protocol://" . $_SERVER['HTTP_HOST'] . $uri
      ],
      'features' => []
    ];
  }

  /**
   * Get the feed URL for the FDSN station web service.
   *
   * @param $params {Array}
   *
   * @return {String}
   */
  private function _getUrl ($params) {
    // Add 'static' params
    $params['format'] = 'text';
    $params['level'] = 'station';

    // API only accepts radius values in degrees
    $params['maxradius'] = $this->_getRadius($params['maxradiuskm']);
    unset($params['maxradiuskm']);

    $queryString = http_build_query($params);

    return 'https://service.iris.edu/fdsnws/station/1/query?' . $queryString;
  }

  /**
   * Search the catalog and store the results.
   */
  private function _search () {
    $row = 0;
    $stream = fopen($this->_url, 'r');

    // Throw exception if response code is not 2xx
    if (!preg_match('/2\d{2}/', $http_response_header[0])) {
      throw new Exception('Request failed');
    }

    if ($stream) {
      while ($station = fgetcsv($stream, 500, '|')) {
        $row ++;

        if ($row === 1) continue; // skip header row

        $this->_features[] = $this->_getFeature($station);
      }
    }
  }

  /**
   * Render the GeoJSON.
   */
  public function render () {
    $this->_template['features'] = $this->_features;
    $this->_template['metadata']['count'] = count($this->_features);

    print json_encode($this->_template, JSON_UNESCAPED_SLASHES);
  }
}
