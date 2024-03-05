/* global L */
'use strict';


/**
 * Create the Experiment Feature.
 *
 * @param options {Object}
 *     {
 *       app: {Object} Application
 *       cable: {String} cable id
 *       experiment: {String} experiment id
 *       name: {String} cable name
 *     }
 *
 * @return _this {Object}
 *     {
 *       cable: {String}
 *       destroy: {Function}
 *       id: {String}
 *       mapLayer: {L.GeoJSON}
 *       name: {String}
 *       remove: {Function}
 *       render: {Function}
 *       url: {String}
 *     }
 */
var Experiment = function (options) {
  var _this,
      _initialize,

      _app,

      _fetch,
      _onEachFeature,
      _pointToLayer;


  _this = {};

  _initialize = function (options) {
    var number = options.experiment.match(/\d+$/)[0];

    _app = options.app;

    _this.cable = options.cable;
    _this.id = 'experiment';
    _this.name = `${options.name} Experiment ${number}`;
    _this.url = `json/${options.cable}-${options.experiment}.geojson`;

    _fetch();
  };

  /**
   * Fetch the feed data.
   */
  _fetch = function () {
    _this.mapLayer = L.geoJSON.async(_this.url, {
      app: _app,
      feature: _this,
      onEachFeature: _onEachFeature,
      pointToLayer: _pointToLayer
    });
  };

  /**
   * Add the Leaflet Tooltips.
   *
   * @param feature {Object}
   * @param layer {L.Layer}
   */
  _onEachFeature = function (feature, layer) {
    layer.bindTooltip('Channel ' + feature.properties.Channel_id);
  };

  /**
   * Create the Leaflet Markers.
   *
   * @param feature {Object}
   * @param latlng {L.LatLng}
   *
   * @return {L.CircleMarker}
   */
  _pointToLayer = function (feature, latlng) {
    return L.circleMarker(latlng, {
      color: '#fc9',
      pane: _this.id, // controls stacking order
      radius: 5,
      weight: 2
    });
  };

  // ----------------------------------------------------------
  // Public methods
  // ----------------------------------------------------------

  /**
   * Destroy this Class.
   */
  _this.destroy = function () {
    _initialize = null;

    _app = null;

    _fetch = null;
    _onEachFeature = null;
    _pointToLayer = null;

    _this = null;
  };

  /**
   * Remove the Feature.
   */
  _this.remove = function () {
    _app.MapPane.removeFeature(_this);
  };

  /**
   * Render the Feature.
   */
  _this.render = function () {
    _app.MapPane.addFeature(_this);
  };


  _initialize(options);
  options = null;
  return _this;
};


module.exports = Experiment;
