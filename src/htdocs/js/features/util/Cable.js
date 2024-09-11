/* global L */
'use strict';


/**
 * Utility Class that creates a single Cable Feature.
 *
 * @param options {Object}
 *     {
 *       app: {Object} Application
 *       feature: {Object} GeoJSON feature
 *       layer: {L.Layer}
 *     }
 *
 * @return _this {Object}
 *     {
 *       addContent: {Function}
 *       code: {String}
 *       destroy: {Function}
 *       id: {String}
 *       mapLayer: {L.FeatureGroup}
 *       name: {String}
 *       setPopup: {Function}
 *     }
 */
var Cable = function (options) {
  var _this,
      _initialize,

      _app,
      _details,
      _maplayers,

      _addExperiment,
      _addListeners,
      _getContent,
      _getPoints,
      _onPopupClose,
      _onPopupOpen,
      _removeExperiment,
      _render,
      _setButton,
      _showDetails,
      _toggleExperiment;


  _this = {};

  _initialize = function (options = {}) {
    var feature = options.feature;

    _app = options.app;

    _this.code = feature.properties.code;
    _this.id = feature.id;
    _this.mapLayer = L.featureGroup(); // Polyline + Points
    _this.name = feature.properties.name;

    _render(feature, options.layer);
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

    _app.Features.createFeatures('experiment', {
      cable: _this.id,
      endtime: data.endtimeISO,
      experiment: id,
      latitude: center.lat,
      longitude: center.lng,
      maxradiuskm: 100,
      minmagnitude: 0,
      name: _this.name,
      starttime: data.starttimeISO
    });

    sessionStorage.setItem('cable', _this.id);
    sessionStorage.setItem('experiment', id);
  };

  /**
   * Add event listeners.
   *
   * @param el {Element}
   */
  _addListeners = function (el) {
    _details = el.querySelectorAll('.details'),
    _maplayers = el.querySelectorAll('.maplayers');

    _details.forEach(button =>
      button.addEventListener('click', _showDetails)
    );

    _maplayers.forEach(button => {
      button.addEventListener('click', _toggleExperiment);
    });
  };

  /**
   * Get the Popup's HTML content (a placeholder until its Metadata content is
   * loaded).
   *
   * @return {String}
   */
  _getContent = function () {
    return '' +
      '<div class="cable">' +
        `<h4>${_this.name}</h4>` +
        `<p>${_this.code}</p>` +
        '<div class="spinner"></div>' +
      '<div>';
  };

  /**
   * Get the Polyline's vertices as a map layer.
   *
   * @param feature {Object}
   *
   * @return points {L.FeatureGroup}
   */
  _getPoints = function (feature) {
    var coords = feature.geometry.coordinates,
        points = L.featureGroup();

    coords.forEach(coord => {
      var marker = L.circleMarker([coord[1], coord[0]], {
        color: '#208eff',
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
   * Event handler for closing a Popup.
   */
  _onPopupClose = function () {
    _details?.forEach(button =>
      button.removeEventListener('click', _showDetails)
    );

    _maplayers?.forEach(button =>
      button.removeEventListener('click', _toggleExperiment)
    );
  };

  /**
   * Event handler for opening a Popup.
   *
   * @param e {Event}
   */
  _onPopupOpen = function (e) {
    var el = e.popup.getElement(),
        metadata = _app.Features.getFeature('metadata');

    // Fetch the Popup's content, which is added via _this.addContent()
    if (_this.id !== metadata.cable) {
      _app.Features.createFeatures('cable', {
        cable: _this.id,
        name: _this.name
      });
    } else {
      _addListeners(el);
      _setButton(el);
    }
  };

  /**
   * Remove an existing experiment's Features.
   */
  _removeExperiment = function () {
    _app.Features.removeFeatures('experiment');
    _app.Features.removeFeatures('shakemap');

    sessionStorage.removeItem('cable');
    sessionStorage.removeItem('experiment');
    sessionStorage.removeItem('shakemap');
  };

  /**
   * Render the Feature and add the Leaflet Popup, Tooltip and Events.
   *
   * @param feature {Object}
   * @param layer {L.Layer}
   */
  _render = function (feature, layer) {
    _this.mapLayer
      .addLayer(layer) // Polyline
      .addLayer(_getPoints(feature))
      .bindTooltip(_this.name)
      .bindPopup(_getContent(), {
        maxWidth: 425,
        minWidth: 300
      })
      .on({
        popupclose: _onPopupClose,
        popupopen: _onPopupOpen
      });
  };

  /**
   * Set the active map layers' button to active state (if applicable).
   *
   * @param el {Element}
   */
  _setButton = function (el) {
    var cable = sessionStorage.getItem('cable'),
        experiment = sessionStorage.getItem('experiment'),
        maplayers = el.querySelectorAll('.maplayers');

    maplayers.forEach(button => {
      var id = button.closest('tr').className;

      if (_this.id === cable && id === experiment) {
        button.classList.add('selected');
      }
    });
  };

  /**
   * Event handler for showing an experiment's metadata.
   *
   * @param e {Event}
   */
  _showDetails = function (e) {
    var id = e.target.closest('tr').className,
        metadata = _app.Features.getFeature('metadata'),
        content = metadata.getContent(id),
        number = id.match(/\d+$/)[0],
        title = `${_this.name} Experiment ${number}`;

    metadata.lightbox
      .setTitle(title)
      .setContent(content)
      .show(true);
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
    } else {
      buttons.forEach(b => b.classList.remove('selected'));
      button.classList.add('selected');

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
    var popup = _this.mapLayer.getPopup(),
        el = popup.getElement();

    popup.setContent(html).update();
    _addListeners(el);
    _setButton(el);
  };

  /**
   * Destroy this Class.
   */
  _this.destroy = function () {
    _initialize = null;

    _app = null;
    _details = null;
    _maplayers = null;

    _addExperiment = null;
    _addListeners = null;
    _getContent = null;
    _getPoints = null;
    _onPopupClose = null;
    _onPopupOpen = null;
    _removeExperiment = null;
    _render = null;
    _setButton = null;
    _showDetails = null;
    _toggleExperiment = null;

    _this = null;
  };

  /**
   * Affix Popup to Cable (becomes "detached" when the map is zoomed to fit the
   * bounds of an experiment's Features).
   */
  _this.setPopup = function () {
    if (_this.mapLayer.isPopupOpen()) {
      _this.mapLayer.closePopup().openPopup();
    }
  };


  _initialize(options);
  options = null;
  return _this;
};


module.exports = Cable;
