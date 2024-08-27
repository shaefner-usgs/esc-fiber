/* global L */
'use strict';


var AppUtil = require('util/AppUtil');


/**
 * Create the Seismic Stations Feature.
 *
 * @param options {Object}
 *     {
 *       app: {Object} Application
 *       cable: {String} cable id
 *       endtime: {ISO Date}
 *       latitude: {Number}
 *       longitude: {Number}
 *       maxradiuskm: {Number}
 *       starttime: {ISO Date}
 *     }
 *
 * @return _this {Object}
 *     {
 *       cable: {String}
 *       count: {Number}
 *       description: {String}
 *       destroy: {Function}
 *       fetch: {Function}
 *       id: {String}
 *       mapLayer: {L.FeatureGroup}
 *       name: {String}
 *       remove: {Function}
 *       render: {Function}
 *       url: {String}
 *     }
 */
var Cables = function (options) {
  var _this,
      _initialize,

      _app,

      _getUrl,
      _onEachFeature,
      _pointToLayer;


  _this = {};

  _initialize = function (options = {}) {
    _app = options.app;

    _this.cable = options.cable;
    _this.description = `within ${options.maxradiuskm} km`;
    _this.id = 'seismic-stations';
    _this.name = 'Seismic Stations';
    _this.url = _getUrl({
      endtime: options.endtime,
      latitude: options.latitude,
      longitude: options.longitude,
      maxradiuskm: options.maxradiuskm,
      starttime: options.starttime
    });
  };

  /**
   * Get the GeoJSON feed's URL.
   *
   * @param params {Object}
   *
   * @return {String}
   */
  _getUrl = function (params) {
    var baseUri = 'json/stations.json.php',
        pairs = [];

    Object.keys(params).forEach(name => {
      pairs.push(name + '=' + params[name]);
    });

    return baseUri + '?' + pairs.join('&');
  };

  /**
   * Add the Leaflet Tooltips.
   *
   * @param feature {Object}
   * @param layer {L.Layer}
   */
  _onEachFeature = function (feature, layer) {
    var props = feature.properties,
        tooltip = `${props.network}.${feature.id} - ${props.name}`;

    layer.bindTooltip(tooltip);
  };

  /**
   * Create the Leaflet Markers.
   *
   * @param feature {Object}
   * @param latlng {L.LatLng}
   *
   * @return {L.Marker}
   */
  _pointToLayer = function (feature, latlng) {
    return L.marker(latlng, {
      icon: L.divIcon({
        className: 'station',
        iconAnchor: [7, 5],
        iconSize: [14, 10]
      }),
      pane: 'seismic-stations', // controls stacking order
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

    _getUrl = null;
    _onEachFeature = null;
    _pointToLayer = null;

    _this = null;
  };

  /**
   * Fetch the feed data.
   */
  _this.fetch = function () {
    _this.mapLayer = L.geoJSON.async(_this.url, {
      app: _app,
      feature: _this,
      host: 'iris.edu', // PHP script on localhost fetches data from IRIS
      onEachFeature: _onEachFeature,
      pointToLayer: _pointToLayer
    });
  };

  /**
   * Remove the Feature.
   */
  _this.remove = function () {
    _app.MapPane.removeFeature(_this);
  };

  /**
   * Render the Feature.
   *
   * @param json {Object} default is {}
   */
  _this.render = function (json = {}) {
    if (!AppUtil.isEmpty(json)) { // initial render
      _this.count = json.features?.length;
    } else {
      _this.mapLayer.addCount();
    }

    _app.MapPane.addFeature(_this);
  };


  _initialize(options);
  options = null;
  return _this;
};


module.exports = Cables;
