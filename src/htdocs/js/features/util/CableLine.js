/* global L */
'use strict';


/**
 * Utility Class that creates a single CableLine Feature.
 *
 * @param options {Object}
 *     {
 *       app: {Object} Application
 *       id: {String} cable id
 *       name: {String} cable name
 *     }
 *
 * @return _this {Object}
 *     {
 *       addContent: {Function}
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
var CableLine = function (options) {
  var _this,
      _initialize,

      _app,

      _addExperiment,
      _addListeners,
      _getPoints,
      _getPopup,
      _onPopupClose,
      _onPopupOpen,
      _removeExperiment,
      _removeListeners,
      _showMetadata,
      _style,
      _toggleExperiment;


  _this = {};

  _initialize = function (options = {}) {
    _app = options.app;

    _this.id = options.id;
    _this.mapLayer = L.featureGroup(); // polyline and points
    _this.name = options.name;
    _this.url = `json/${_this.id}.geojson`;
  };

  /**
   * Create and add the given experiment's Features.
   *
   * @param id {String}
   *     Experiment id
   */
  _addExperiment = function (id) {
    var center = _this.mapLayer.getBounds().getCenter(),
        data = _app.Features.getFeature('metadata').data[id];

    _app.StatusBar.reset(); // be certain Metadata's loading message is purged

    _app.Features.createFeatures('experiment', {
      endtime: data.endtimeISO,
      experiment: id,
      cable: _this.id,
      latitude: center.lat,
      longitude: center.lng,
      maxradiuskm: 100,
      minmagnitude: 0,
      name: _this.name,
      starttime: data.starttimeISO
    });
  };

  /**
   * Add event listeners.
   */
  _addListeners = function () {
    _this.mapLayer.on({
      popupclose: _onPopupClose,
      popupopen: _onPopupOpen
    });
  };

  /**
   * Get the Polyline's vertices as a map layer.
   *
   * @param json {Object}
   *
   * @return points {L.FeatureGroup}
   */
  _getPoints = function (json) {
    var coords = [],
        points = L.featureGroup();

    json.features.forEach(feature =>
      coords = coords.concat(feature.geometry.coordinates)
    );

    coords.forEach(coord => {
      var marker = L.circleMarker([coord[1], coord[0]], {
        interactive: false,
        opacity: .4,
        pane: 'cables', // controls stacking order
        radius: 3,
        weight: 1
      });

      points.addLayer(marker);
    });

    return points;
  };

  /**
   * Get the Popup's HTML content (a placeholder until its data is loaded).
   *
   * @return {String}
   */
  _getPopup = function () {
    return '' +
      '<div class="cablelines">' +
        `<h4>${_this.name} Experiments</h4>` +
        '<div class="spinner"></div>' +
      '<div>';
  };

  /**
   * Event handler for closing a Popup.
   *
   * @param e {Event}
   */
  _onPopupClose = function (e) {
    var el = e.popup.getElement(),
        maplayers = el.querySelectorAll('.maplayers'),
        metadata = el.querySelectorAll('.metadata');

    maplayers.forEach(button =>
      button.removeEventListener('click', _toggleExperiment)
    );

    metadata.forEach(button =>
      button.removeEventListener('click', _showMetadata)
    );
  };

  /**
   * Event handler for opening a Popup.
   */
  _onPopupOpen = function () {
    // Get the Popup's content (added via _this.addContent())
    _app.Features.createFeatures('cable', {
      id: _this.id,
      name: _this.name
    });
  };

  /**
   * Remove the existing experiment's Features.
   */
  _removeExperiment = function () {
    var features = _app.Features,
        earthquake = features.getFeature('earthquake'),
        earthquakes = features.getFeature('earthquakes'),
        experiment = features.getFeature('experiment'),
        shakemap = features.getFeature('shakemap-contours');

    if (features.isFeature(earthquakes)) {
      earthquakes.remove();
      earthquakes.destroy();
      features.deleteFeature(earthquakes.id);
    }
    if (features.isFeature(experiment)) {
      experiment.remove();
      experiment.destroy();
      features.deleteFeature(experiment.id);
    }
    if (features.isFeature(shakemap)) {
      earthquake.destroy();
      features.deleteFeature(earthquake.id);

      shakemap.remove();
      shakemap.destroy();
      features.deleteFeature(shakemap.id);
    }
  };

  /**
   * Remove event listeners.
   */
  _removeListeners = function () {
    _this.mapLayer.off({
      popupclose: _onPopupClose,
      popupopen: _onPopupOpen
    });
  };

  /**
   * Event handler for showing an experiment's metadata.
   *
   * @param e {Event}
   */
  _showMetadata = function (e) {
    var id = e.target.closest('tr').className,
        metadata = _app.Features.getFeature('metadata'),
        content = metadata.getContent(id),
        number = id.match(/\d+$/)[0],
        title = `${_this.name} Experiment ${number}`;

    metadata.lightbox.setTitle(title).setContent(content).show();
  };

  /**
   * Get the Leaflet Polyline's style attributes.
   *
   * @return {Object}
   */
  _style = function () {
    return {
      opacity: 0.6,
      pane: 'cables', // controls stacking order
      weight: 5
    };
  };

  /**
   * Event handler for toggling an experiment's map layers.
   *
   * @param e {Event}
   */
  _toggleExperiment = function (e) {
    var button = e.target,
        tr = button.closest('tr'),
        buttons = tr.closest('table').querySelectorAll('.maplayers'),
        id = tr.className;

    _removeExperiment();

    if (button.classList.contains('selected')) { // turn off
      button.classList.remove('selected');
      sessionStorage.removeItem('cable');
      sessionStorage.removeItem('experiment');
    } else {
      buttons.forEach(b => b.classList.remove('selected'));
      button.classList.add('selected');
      sessionStorage.setItem('cable', _this.id);
      sessionStorage.setItem('experiment', id);

      _addExperiment(id);
    }
  };

  // ----------------------------------------------------------
  // Public methods
  // ----------------------------------------------------------

  /**
   * Add the asynchronous Metadata content.
   *
   * @param html {String}
   */
  _this.addContent = function (html) {
    var maplayers, metadata,
        cable = sessionStorage.getItem('cable'),
        popup = _this.mapLayer.getPopup(),
        el = popup.getElement(),
        experiment = sessionStorage.getItem('experiment');

    popup.setContent(html).update();

    // Add event listeners and highlight selected button (if applicable)
    maplayers = el.querySelectorAll('.maplayers');
    metadata = el.querySelectorAll('.metadata');

    maplayers.forEach(button => {
      var id = button.closest('tr').className;

      if (cable === _this.id && experiment === id) {
        button.classList.add('selected');
      }

      button.addEventListener('click', _toggleExperiment);
    });

    metadata.forEach(button =>
      button.addEventListener('click', _showMetadata)
    );
  };

  /**
   * Destroy this Class.
   */
  _this.destroy = function () {
    _initialize = null;

    _app = null;

    _addExperiment = null;
    _addListeners = null;
    _getPoints = null;
    _getPopup = null;
    _onPopupClose = null;
    _onPopupOpen = null;
    _removeExperiment = null;
    _removeListeners = null;
    _showMetadata = null;
    _style = null;
    _toggleExperiment = null;

    _this = null;
  };

  /**
   * Fetch the feed data and add its map layer.
   */
  _this.fetch = function () {
    var line = L.geoJSON.async(_this.url, {
      app: _app,
      feature: _this,
      style: _style
    });

    _this.mapLayer.addLayer(line);
  };

  /**
   * Remove the Feature.
   */
  _this.remove = function () {
    _removeListeners();
    _app.MapPane.removeFeature(_this);
  };

  /**
   * Render the Feature.
   *
   * @param json {Object} default is {}
   */
  _this.render = function (json = {}) {
    var cables = _app.Features.getFeature('cables'),
        bounds = cables.mapLayer.getBounds();

    if (cables.getStatus() === 'ready') {
      _app.MapPane.fitBounds(bounds, true);
    }

    _this.mapLayer.addLayer(_getPoints(json))
      .bindTooltip(_this.name)
      .bindPopup(_getPopup(), {
        maxWidth: 600,
        minWidth: 300
      });

    _addListeners();
  };


  _initialize(options);
  options = null;
  return _this;
};


module.exports = CableLine;
