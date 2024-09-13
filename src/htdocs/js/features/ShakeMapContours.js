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
 *       eqid: {String}
 *       fetch: {Function}
 *       id: {String}
 *       mapLayer: {L.GeoJSON}
 *       name: {String}
 *       remove: {Function}
 *       render: {Function}
 *       url: {String}
 *       zoomToLayer: {Boolean}
 *     }
 */
var ShakeMapContours = function (options) {
  var _this,
      _initialize,

      _app,

      _handleError,
      _onEachFeature,
      _onMouseOver,
      _style;


  _this = {};

  _initialize = function (options = {}) {
    _app = options.app;

    _this.dependencies = ['earthquake'];
    _this.eqid = ''; // set by Earthquake Feature
    _this.id = 'shakemap-contours';
    _this.mapLayer = L.featureGroup(); // default (useful if no data is fetched)
    _this.name = 'ShakeMap Contours';
    _this.url = ''; // set by Earthquake Feature
    _this.zoomToLayer = false;
  };

  /**
   * Show an error when Earthquake feature is missing the ShakeMap Contours URL
   * and set UI state.
   */
  _handleError = function () {
    var button = document.querySelector('.shakemap.selected'),
        earthquakes = _app.Features.getFeature('earthquakes'),
        message = `<h4>Error Loading ${_this.name}</h4><p>Error 404 (Not Found)</p>`;

    _app.StatusBar.addError({
      id: _this.id,
      message: message,
      status: 404
    });

    button.classList.remove('selected');
    earthquakes.removeShakeMap();
  };

  /**
   * Add the Leaflet Tooltips.
   *
   * @param feature {Object}
   * @param layer {L.Layer}
   */
  _onEachFeature = function (feature, layer) {
    var tooltip = 'MMI ' + feature.properties.value;

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

    _handleError = null;
    _onEachFeature = null;
    _onMouseOver = null;
    _style = null;

    _this = null;
  };

  /**
   * Fetch the feed data (if the feed URL is set).
   */
  _this.fetch = function () {
    _app.StatusBar.reset(); // purge Earthquake's loading message

    if (_this.url) {
      _this.mapLayer = L.geoJSON.async(_this.url, {
        app: _app,
        feature: _this,
        onEachFeature: _onEachFeature,
        pane: 'shakemap-contours', // controls stacking order
        style: _style
      });
    } else {
      _handleError();
    }
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
