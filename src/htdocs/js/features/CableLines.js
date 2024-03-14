/* global L */
'use strict';


var CableLine = require('features/util/CableLine');


/**
 * Create the CableLines Feature, a collection of individual CableLine Features.
 *
 * @param options {Object}
 *     {
 *       app: {Object} Application
 *     }
 *
 * @return _this {Object}
 *     {
 *       destroy: {Function}
 *       getStatus: {Function}
 *       id: {String}
 *       mapLayer: {L.FeatureGroup}
 *       name: {String}
 *       remove: {Function}
 *       render: {Function}
 *     }
 */
var CableLines = function (options) {
  var _this,
      _initialize,

      _app,
      _cables,

      _addCables,
      _getCables;


  _this = {};

  _initialize = function (options = {}) {
    _app = options.app;
    _cables = _getCables();

    _this.id = 'cables';
    _this.mapLayer = L.featureGroup();
    _this.name = 'Cables';

    _addCables();
  };

  /**
   * Create and add the individual CableLine Features.
   */
  _addCables = function () {
    _cables.forEach(cable => {
      var feature = _app.Features.createFeature(CableLine, 'base', {
        id: cable.id,
        name: cable.name
      });

      _this.mapLayer.addLayer(feature.mapLayer);
    });
  };

  /**
   * Get the individual cable line Features' properties.
   *
   * @return {Array}
   */
  _getCables = function () {
    return [
      {
        id: 'arcata',
        name: 'Arcata, CA'
      },
      {
        id: 'cordova',
        name: 'Cordova, AK'
      },
      {
        id: 'calipatria',
        name: 'Calipatria, CA'
      }
    ];
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
    _cables = null;

    _addCables = null;
    _getCables = null;

    _this = null;
  };

  /**
   * Get the collective loading status of the individual cable lines.
   *
   * @return status {String}
   */
  _this.getStatus = function () {
    var feature,
        status = 'ready'; // default

    _cables.forEach(cable => {
      feature = _app.Features.getFeature(cable.id);

      if (!_app.Features.isFeature(feature)) {
        status = 'loading';
      }
    });

    return status;
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


module.exports = CableLines;
