/* global L */
'use strict';


/**
 * Utility Class that creates an Earthquake Feature, which provides the URL
 * for the ShakeMapContours Feature.
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
      options.eqid + '&format=geojson'; // GeoJSON 'detail' feed
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
   * Add the JSON feed data (nothing to render).
   *
   * @param json {Object} default is {}
   */
  _this.render = function (json = {}) {
    var product = json.properties.products.shakemap[0] || {},
        shakemap = _app.Features.getFeature('shakemap-contours');

    shakemap.eqid = json.id;
    shakemap.url = product.contents?.['download/cont_mi.json']?.url || '';
  };


  _initialize(options);
  options = null;
  return _this;
};


module.exports = Earthquake;
