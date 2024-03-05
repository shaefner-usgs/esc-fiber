/* global L */
'use strict';


/**
 * This class extends L.Control to reset the map extent to the initial view.
 *
 * @param options {Object}
 */
L.Control.Zoom.Reset = L.Control.extend({
  options: { // defaults
    app: {},
    position: 'topleft'
  },

  initialize: function (options) {
    L.setOptions(this, options);
  },

  /**
   * Override onAdd from L.Control.
   *
   * @return container {Element}
   */
  onAdd: function () {
    var divClasses = [
          'leaflet-control-reset',
          'leaflet-bar',
          'leaflet-control'
        ],
        container = L.DomUtil.create('div', divClasses.join(' '));

    this._createButton(container);

    return container;
  },

  /**
   * Create the control button and add its listeners.
   *
   * @param container {Element}
   */
  _createButton: function (container) {
    var button = L.DomUtil.create('a', 'leaflet-control-reset-globe', container),
        title = 'Zoom map to full extent';

    button.href = '#';
    button.innerHTML = '<i class="icon-globe">';
    button.title = title;

    // Force screen readers to read this as e.g. "Zoom in - button"
    button.setAttribute('role', 'button');
    button.setAttribute('aria-label', title);

    L.DomEvent.on(button, 'click', this._setExtent, this);
  },

  /**
   * Click handler for the button.
   */
  _setExtent: function () {
    var app = this.options.app,
        bounds = app.MapPane.initialBounds;

    app.MapPane.fitBounds(bounds);
  }
});


L.control.zoom.reset = function (options) {
  return new L.Control.Zoom.Reset(options);
};
