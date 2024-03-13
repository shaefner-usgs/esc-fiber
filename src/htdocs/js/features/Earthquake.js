/* global L */
'use strict';


/**
 * Create an Earthquake Feature from the GeoJSON 'detail' feed, which includes
 * additional properties not included in Earthquakes.
 *
 * @param options {Object}
 *     {
 *       app: {Object} Application
 *       eqid: {String}
 *     }
 *
 * @return _this {Object}
 *     {
 *       destroy: {Function}
 *       fetch: {Function}
 *       id: {String}
 *       name: {String}
 *       render: {Function}
 *       url: {String}
 *     }
 */
var Earthquake = function (options) {
  var _this,
      _initialize,

      _app;


  _this = {};

  _initialize = function (options = {}) {
    _app = options.app;

    _this.id = 'earthquake';
    _this.name = 'Earthquake';
    _this.url = 'https://earthquake.usgs.gov/fdsnws/event/1/query?eventid=' +
      options.eqid + '&format=geojson';
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

    _this = null;
  };

  /**
   * Fetch the feed data.
   */
  _this.fetch = function () {
    L.geoJSON.async(_this.url, {
      app: _app,
      feature: _this
    });
  };

  /**
   * Add the JSON feed data and set the URL (nothing to render).
   *
   * @param json {Object} default is {}
   */
  _this.render = function (json = {}) {
    var shakemap = _app.Features.getFeature('shakemap-contours'),
        product = json.properties.products.shakemap[0] || {};

    shakemap.url = product.contents?.['download/cont_mmi.json']?.url || '';
  };


  _initialize(options);
  options = null;
  return _this;
};


module.exports = Earthquake;
