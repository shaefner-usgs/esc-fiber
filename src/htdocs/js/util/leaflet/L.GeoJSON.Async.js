/* global L */
'use strict';


require('leaflet-geojson-dateline');

var AppUtil = require('util/AppUtil');


var _DEFAULTS = {
  app: {},
  feature: {},
  pointToLayer: function() {} // only fetch and return JSON data by default
};

/**
 * This class extends L.GeoJSON.DateLine to load a JSON feed asynchronously and
 * then add the fetched data and optionally render the Feature. It accepts all
 * Leaflet GeoJSON options but returns an empty L.GeoJSON layer by default.
 *
 * Note: if no map layer is being created, it's not necessary for the fetched
 * JSON data to be in GeoJSON format.
 *
 * @param url {String}
 *     URL of JSON data feed
 * @param options {Object}
 *     L.GeoJSON options (optional), plus:
 *
 *     { // enables additional functionality if components (like StatusBar) exist
 *       app: {Object} optional
 *       feature: {Object} optional
 *     }
 */
L.GeoJSON.Async = L.GeoJSON.DateLine.extend({
  initialize: function (url, options) {
    var path = /.*\//.exec(location.pathname)[0];

    options = Object.assign({}, _DEFAULTS, options);

    this._app = options.app;
    this._feature = options.feature;
    this._json = {};
    this._url = new URL(url, location.origin + path);

    this._fetch();

    // Delete internal, non-L.GeoJSON options
    delete options.app;
    delete options.feature;

    L.GeoJSON.prototype.initialize.call(this, null, options);
  },

  /**
   * Add the count value next to the given Feature's name (if applicable).
   *
   * @param feature {Object}
   */
  _addCount: function (feature) {
    var count, value;

    if (Object.hasOwn(feature, 'count')) {
      value = AppUtil.addCommas(feature.count);
      count = `<span class="count">${value}</span>`;

      this._app.MapPane?.layerControl?.addCount(count, feature.id);
    }
  },

  /**
   * Add the fetched data (if GeoJSON) and store the Feature. Also render the
   * Feature and add its count value, if applicable.
   */
  _addData: function () {
    var feature = this._feature,
        json = this._json;

    feature.updated = this._getUpdated();

    if (this._isGeoJson()) {
      this.addData(json);
    }

    this._app.Features?.storeFeature(feature);

    if (feature.render) {
      feature.render(json);
    }

    this._addCount(feature);
  },

  /**
   * Add a detailed error message in the StatusBar and console when loading
   * fails.
   *
   * @param error {Object}
   * @param response {Object}
   * @param type {String <network|notfound|timeout>} optional; default is ''
   */
  _addError: function (error, response, type = '') {
    var feature = this._feature,
        message = `<h4>Error Loading ${feature.name || 'Feature'}</h4>`;

    if (type === 'notfound') {
      message += '<p>Resource not found (Error 404)</p>';
    } else if (type === 'timeout') {
      message += `<p>Request timed out (can’t connect to ${this._url.hostname})</p>`;
    } else if (type === 'network') {
      message += '<p>Network error</p>';
    } else if (response.status !== 200) {
      message += `<p>Error code: ${response.status} (${response.statusText})</p>`;
    } else { // generic error message
      message += `<p>${error.message}</p>`;
    }

    this._app.StatusBar?.addError({
      id: feature.id,
      message: message,
      mode: feature.mode,
      status: response.status
    });

    console.error(error);
  },

  /**
   * Clean up after a failed fetch request.
   */
  _cleanup: function () {
    var feature = this._feature;

    this._app.Features?.deleteFeature(feature.id);

    if (feature.remove) {
      feature.remove();
    }
    if (feature.destroy) {
      feature.destroy();
    }
  },

  /**
   * Fetch and add the JSON data; set the error type on failure.
   */
  _fetch: async function () {
    var type,
        feature = this._feature,
        response = {};

    feature.status = 'loading';

    this._app.StatusBar?.addItem({
      id: feature.id,
      name: feature.name
    });

    try {
      response = await AppUtil.fetchWithTimeout(this._url.href);
      this._json = await response.clone().json();

      this._app.StatusBar?.removeItem(feature.id);
      this._addData();
    } catch (error) {
      feature.status = 'error';

      if (error.name === 'AbortError') {
        type = 'timeout';
      } else if (error.name === 'TypeError') {
        type = 'network';
      } else if (response.status === 404) {
        type = 'notfound';
      }

      this._addError(error, response, type);
      this._cleanup();
    }
  },

  /**
   * Get the updated time.
   *
   * @return millisecs {Integer}
   */
  _getUpdated: function () {
    var generated = this._json.metadata?.generated,
        millisecs = Date.now(); // default

    if (generated) { // use feed's generated time
      millisecs = parseInt(generated, 10);
    }

    return millisecs;
  },

  /**
   * Check if the feed data is in GeoJSON format.
   */
  _isGeoJson: function () {
    var json = this._json,
        geometry = json.type === 'Feature' ? json.geometry : json,
        types = [
          'FeatureCollection',
          'GeometryCollection',
          'LineString',
          'MultiLineString',
          'MultiPoint',
          'MultiPolygon',
          'Point',
          'Polygon'
        ];

    if (types.includes(geometry.type)) {
      return true;
    }
  }
});


L.geoJSON.async = function (url, options) {
  return new L.GeoJSON.Async(url, options);
};
