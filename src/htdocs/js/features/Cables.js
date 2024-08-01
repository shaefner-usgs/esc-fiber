/* global L */
'use strict';


var Cable = require('features/util/Cable');


/**
 * Create the Cables Feature, a collection of individual Cable Features.
 *
 * @param options {Object}
 *     {
 *       app: {Object} Application
 *     }
 *
 * @return _this {Object}
 *     {
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

      _onEachFeature;


  _this = {};

  _initialize = function (options = {}) {
    _app = options.app;

    _this.id = 'cables';
    _this.mapLayer = L.featureGroup();
    _this.name = 'Cables';
    _this.url = 'json/cables.json.php';
  };

  /**
   * Create and add the individual Cable Features.
   *
   * @param feature {Object}
   * @param layer {L.Layer}
   */
  _onEachFeature = function (feature, layer) {
    var cable = _app.Features.createFeature(Cable, 'base', {
      feature: feature,
      layer: layer
    });

    _this.mapLayer.addLayer(cable.mapLayer);
    _app.MapPane.fitBounds(_this.mapLayer.getBounds(), true);
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

    _onEachFeature = null;

    _this = null;
  };

  /**
   * Fetch the feed data.
   */
  _this.fetch = function () {
    L.geoJSON.async(_this.url, {
      app: _app,
      feature: _this,
      onEachFeature: _onEachFeature,
      pane: 'cables', // controls stacking order
      style: {
        color: '#208eff',
        opacity: 0.6,
        weight: 5
      }
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
   */
  _this.render = function () {
    _app.MapPane.addFeature(_this);
  };


  _initialize(options);
  options = null;
  return _this;
};


module.exports = Cables;
