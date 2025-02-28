/* global L */
'use strict';


// Leaflet plugins and layer factories
require('leaflet-mouse-position');
require('util/leaflet/L.Control.Layers.Sorted');
require('util/leaflet/L.Control.Zoom.Reset');
// require('util/leaflet/L.DarkLayer');
require('util/leaflet/L.FaultsLayer');
require('util/leaflet/L.GeoJSON.Async');
// require('util/leaflet/L.GreyscaleLayer');
require('util/leaflet/L.Popup');
require('util/leaflet/L.SatelliteLayer');
require('util/leaflet/L.TerrainLayer-alt');


/**
 * Create the Leaflet map instance and add the initial (base) map layers.
 * Add/remove Feature layers and set the map extent based on the current state.
 *
 * @param options {Object}
 *     {
 *       app: {Object} Application
 *       el: {Element}
 *     }
 *
 * @return _this {Object}
 *     {
 *       addFeature: {Function}
 *       fitBounds: {Function}
 *       initialBounds: {L.LatLngBounds}
 *       layerControl: {L.Control.Layers}
 *       map: {L.Map}
 *       removeFeature: {Function}
 *     }
 */
var MapPane = function (options) {
  var _this,
      _initialize,

      _app,
      _bounds,
      _cable,
      _layers,

      _addControls,
      _createPane,
      _getLayers,
      _initMap,
      _setBounds;


  _this = {};

  _initialize = function (options = {}) {
    _app = options.app;
    _bounds = L.latLngBounds();
    _layers = _getLayers();

    _initMap(options.el);
  };

  /**
   * Add the map controls: layers, mouse position, scale and reset. Zoom and
   * attribution controls are added by default.
   */
  _addControls = function () {
    L.control.mousePosition().addTo(_this.map);
    L.control.scale().addTo(_this.map);
    L.control.zoom.reset({
      app: _app
    }).addTo(_this.map);

    _this.layerControl = L.control.layers.sorted(
      _layers.baseLayers,
      _layers.overlays
    ).addTo(_this.map);
  };

  /**
   * Create a custom Leaflet map pane for the given Feature, which is used to
   * control the stacking order using CSS z-index values.
   *
   * Note: set Leaflet's 'pane' option to the Feature's id value when creating
   * the map layer to render the layer in this custom pane.
   *
   * @param id {String}
   *     Feature id
   */
  _createPane = function (id) {
    if (!_this.map.getPane(id)) {
      _this.map.createPane(id, _this.map.getPane('overlayPane'));
    }
  };

  /**
   * Get the initial (static) map layers.
   *
   * @return layers {Object}
   */
  _getLayers = function () {
    var layers,
        faults = L.faultsLayer(),
        terrain = L.terrainLayer();

    layers = {
      baseLayers: {
        // 'Light': greyscale,
        // 'Dark': L.darkLayer(),
        'Satellite': L.satelliteLayer(),
        'Terrain': terrain
      },
      defaults: [
        faults,
        terrain
      ],
      overlays: {
        'Faults': faults
      }
    };

    return layers;
  };

  /**
   * Create the Leaflet map instance.
   *
   * @param el {Element}
   */
  _initMap = function (el) {
    var zoomControl;

    _this.map = L.map('map', {
      layers: _layers.defaults,
      minZoom: 1
    }).setView([40, -96], 3); // set arbitrary view so map fully initializes

    _addControls();

    // Hide the zoom control on mobile (in favor of pinch-to-zoom)
    if (L.Browser.mobile) {
      zoomControl = el.querySelector('.leaflet-control-zoom');

      zoomControl.style.display = 'none';
    }
  };

  /**
   * Set _bounds to contain the given Feature.
   *
   * @param feature {Object}
   */
  _setBounds = function (feature) {
    var bounds = feature.mapLayer.getBounds();

    if (!feature.zoomToLayer) return;

    if (feature.mode === 'experiment' && feature.cable !== _cable) { // reset
      _bounds = bounds;
      _cable = feature.cable;
    } else { // extend
      _bounds.extend(bounds);
    }
  };

  // ----------------------------------------------------------
  // Public methods
  // ----------------------------------------------------------

  /**
   * Add the given Feature to the map and layer control.
   *
   * @param feature {Object}
   */
  _this.addFeature = function (feature) {
    var status = _app.Features.getStatus(feature.mode);

    _setBounds(feature);

    if (feature.zoomToLayer && status === 'ready') {
      _this.fitBounds();

      if (feature.mode === 'experiment') {
        _app.Features.getFeature(_cable).setPopup();

        _cable = null; // reset cached value
      }
    }

    _createPane(feature.id);
    _this.map.addLayer(feature.mapLayer);
    _this.layerControl.addOverlay(feature);
  };

  /**
   * Set the map view to contain the given bounds.
   *
   * @param bounds {L.LatLngBounds} optional; default is _bounds
   * @param initial {Boolean} optional; default is false
   */
  _this.fitBounds = function (bounds = _bounds, initial = false) {
    var opts = {
      paddingTopLeft: [0, 65]
    };

    if (bounds.isValid()) {
      if (initial) {
        _this.initialBounds = bounds; // cache value
        opts.animate = false;
      }

      _this.map.fitBounds(bounds, opts);
    }
  };

  /**
   * Remove the given Feature from the map and layer control.
   *
   * @param feature {Object}
   */
  _this.removeFeature = function (feature) {
    if (feature.mapLayer) {
      _this.map.removeLayer(feature.mapLayer);
      _this.layerControl.removeLayer(feature.mapLayer);
    }
  };


  _initialize(options);
  options = null;
  return _this;
};


module.exports = MapPane;
