<?php

/**
 * Database connector and queries.
 *
 * @author Scott Haefner <shaefner@usgs.gov>
 */
class Db {
  private $_db;

  public function __construct() {
    global $DB_DSN, $DB_PASS, $DB_USER;

    try {
      $this->_db = new PDO($DB_DSN, $DB_USER, $DB_PASS);
      $this->_db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    } catch (PDOException $e) {
      print '<p class="alert error">ERROR: ' . $e->getMessage() . '</p>';
    }
  }

  /**
   * Perform a db query.
   *
   * @param $sql {String}
   *     SQL query
   * @param $params {Array} default is NULL
   *     key-value substitution params for SQL query
   *
   * @return $stmt {Object}
   *     PDOStatement object upon success
   */
  private function _execQuery ($sql, $params=NULL) {
    try {
      $stmt = $this->_db->prepare($sql);

      // bind SQL params
      if (is_array($params)) {
        foreach ($params as $key => $value) {
          $type = $this->_getType($value);

          $stmt->bindValue($key, $value, $type);
        }
      }

      $stmt->execute();

      return $stmt;
    } catch(Exception $e) {
      print '<p class="alert error">ERROR: ' . $e->getMessage() . '</p>';
    }
  }

  /**
   * Get the data type for a SQL parameter (PDO::PARAM_* constant).
   *
   * @param $var {?}
   *     variable to identify type of
   *
   * @return $type {Integer}
   */
  private function _getType ($var) {
    $pdoTypes = [
      'boolean' => PDO::PARAM_BOOL,
      'integer' => PDO::PARAM_INT,
      'NULL' => PDO::PARAM_NULL,
      'string' => PDO::PARAM_STR
    ];
    $type = $pdoTypes['string']; // default
    $varType = gettype($var);

    if (isset($pdoTypes[$varType])) {
      $type = $pdoTypes[$varType];
    }

    return $type;
  }

  /**
   * Query the db to get the cable lines.
   *
   * @return {Function}
   */
  public function queryCables () {
    $sql = 'SELECT c.cable_id, c.lat, c.lng, n.code, n.name FROM das_cables c
      JOIN das_names n ON c.cable_id = n.cable_id ORDER BY c.id ASC';

    return $this->_execQuery($sql);
  }

  /**
   * Query the db to get the given cable and experiment's points.
   *
   * @param $cable_id {Integer}
   * @param $experiment_id {Integer}
   *
   * @return {Function}
   */
  public function queryExperiment ($cable_id, $experiment_id) {
    $sql = 'SELECT channel_id, distance, lat, lng FROM das_experiments
      WHERE cable_id = :cable_id AND experiment_id = :experiment_id
      ORDER BY channel_id ASC';

    return $this->_execQuery($sql, [
      'cable_id' => $cable_id,
      'experiment_id' => $experiment_id
    ]);
  }

  /**
   * Query the db to get the given cable's metadata.
   *
   * @param $cable_id {Integer}
   *
   * @return {Function}
   */
  public function queryMetadata ($cable_id) {
    $sql = 'SELECT * FROM das_metadata
      WHERE cable_id = :cable_id
      ORDER BY experiment_id ASC';

    return $this->_execQuery($sql, [
      'cable_id' => $cable_id
    ]);
  }

  /**
   * Query the db to get the given cable's references.
   *
   * @param $cable_id {Integer}
   *
   * @return {Function}
   */
  public function queryReferences ($cable_id) {
    $sql = 'SELECT * FROM das_references
      WHERE cable_id = :cable_id
      ORDER BY experiment_id, year DESC, author, title ASC';

    return $this->_execQuery($sql, [
      'cable_id' => $cable_id
    ]);
  }
}
