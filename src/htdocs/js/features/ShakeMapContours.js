/* global L */
'use strict';


/**
 * Create the ShakeMap Contours Feature.
 *
 * @param options {Object}
 *     {
 *       app: {Object} Application
 *     }
 *
 * @return _this {Object}
 *     {
 *       dependencies: {Array}
 *       destroy: {Function}
 *       fetch: {Function}
 *       id: {String}
 *       mapLayer: {L.GeoJSON}
 *       name: {String}
 *       remove: {Function}
 *       render: {Function}
 *       url: {String}
 *     }
 */
var ShakeMapContours = function (options) {
  var _this,
      _initialize,

      _app,

      _onEachFeature,
      _onMouseOver,
      _style;


  _this = {};

  _initialize = function (options = {}) {
    _app = options.app;

    _this.dependencies = ['earthquake'];
    _this.id = 'shakemap-contours';
    _this.name = 'ShakeMap Contours';
    _this.url = ''; // set by Earthquake Feature
  };

  /**
   * Add the Leaflet Tooltips.
   *
   * @param feature {Object}
   * @param layer {L.Layer}
   */
  _onEachFeature = function (feature, layer) {
    var props = feature.properties,
        tooltip = props.units.toUpperCase() + ' ' + props.value;

    layer.bindTooltip(tooltip);
  };

  /**
   * Event handler for hovering on a contour line.
   *
   * @param e {Event}
   */
  _onMouseOver = function (e) {
    var tooltip = e.layer._tooltip;

    tooltip.setLatLng(e.latlng); // show Tooltip at cursor's position
  };

  /**
   * Get the Leaflet Polyline's style attributes.
   *
   * @param feature {Object}
   *
   * @return {Object}
   */
  _style = function (feature) {
    return {
      color: feature.properties.color,
      opacity: 0.8,
      pane: 'shakemap-contours', // controls stacking order
      weight: 4
    };
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
    _onMouseOver = null;
    _style = null;

    _this = null;
  };

  /**
   * Fetch the feed data.
   */
  _this.fetch = function () {
    _app.StatusBar.reset(); // purge Earthquake's loading message

    _this.mapLayer = L.geoJSON.async(_this.url, {
      app: _app,
      feature: _this,
      onEachFeature: _onEachFeature,
      style: _style
    });
  };

  /**
   * Remove the Feature.
   */
  _this.remove = function () {
    _this.mapLayer.off({
      mouseover: _onMouseOver
    });

    _app.MapPane.removeFeature(_this);
  };

  /**
   * Render the Feature.
   */
  _this.render = function () {
    _app.MapPane.addFeature(_this);

    _this.mapLayer.on({
      mouseover: _onMouseOver
    });
  };


  _initialize(options);
  options = null;
  return _this;
};


module.exports = ShakeMapContours;
