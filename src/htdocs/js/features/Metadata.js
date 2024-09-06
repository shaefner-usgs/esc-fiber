/* global L */
'use strict';


var AppUtil = require('util/AppUtil'),
    Lightbox = require('util/Lightbox'),
    Luxon = require('luxon');


/**
 * Create the Experiments Metadata Feature.
 *
 * @param options {Object}
 *     {
 *       app: {Object} Application
 *       cable: {String} cable id
 *       name: {String} cable name
 *     }
 *
 * @return _this {Object}
 *     {
 *       cable: {String}
 *       data: {Object}
 *       destroy: {Function}
 *       fetch: {Function}
 *       getContent: {Function}
 *       id: {String}
 *       lightbox: {Object}
 *       name: {String}
 *       render: {Function}
 *       url: {String}
 *     }
 */
var Metadata = function (options) {
  var _this,
      _initialize,

      _app,

      _getContent,
      _getData,
      _getItem,
      _getPlot,
      _getReferences;


  _this = {};

  _initialize = function (options = {}) {
    _app = options.app;

    _this.cable = options.cable;
    _this.data = {};
    _this.id = 'metadata';
    _this.lightbox = Lightbox({
      id: _this.id
    });
    _this.name = options.name;
    _this.url = `json/metadata.json.php?cable=${_this.cable}`;
  };

  /**
   * Get the HTML content that's added to the Cable Popup.
   *
   * @return html {String}
   */
  _getContent = function () {
    var html =
      '<div class="cable">' +
        `<h4>${_this.name}</h4>` +
        '<h5>Experiments</h5>';

    if (AppUtil.isEmpty(_this.data)) {
      html += '<p>None</p>';
    } else {
      html +=
        '<table>' +
          '<tr><td></td><th>Start Date</th><th>End Date</th><td></td><td></td></tr>';

      Object.keys(_this.data).forEach(id => {
        html += L.Util.template(
          '<tr class="' + id + '">' +
            '<th>{number}</th>' +
            '<td>{startdate}</td>' +
            '<td>{enddate}</td>' +
            '<td><a class="button maplayers">Map Layers</a></td>' +
            '<td><a class="button details">Details</a></td>' +
          '</tr>',
          _this.data[id]
        );
      });

      html += '</table>';
    }

    html += '</div>';

    return html;
  };

  /**
   * Get the data used to create the content.
   *
   * @param json {Object}
   *
   * @return data {Object}
   */
  _getData = function (json) {
    var data = {};

    json.experiments.forEach(experiment => {
      var enddate = Luxon.DateTime.fromSQL(experiment.overview.enddate),
          endtime = Luxon.DateTime.fromSQL(experiment.acquisition.endtime),
          startdate = Luxon.DateTime.fromSQL(experiment.overview.startdate),
          starttime = Luxon.DateTime.fromSQL(experiment.acquisition.starttime);

      data[experiment.id] = {
        channels: experiment.acquisition.channels || '',
        doi: experiment.overview.doi || '–',
        email: experiment.overview.pi_email || '',
        enddate: enddate.toFormat(_app.dateFormat),
        endtime: endtime.toFormat(_app.timeFormat),
        endtimeISO: endtime.toISO()?.slice(0, -10), // ? checks if null
        interval: experiment.acquisition.interval || '',
        length: experiment.acquisition.length || '',
        location: _this.name,
        manufacturer: experiment.interrogator.manufacturer || '',
        model: experiment.interrogator.model || '',
        name: experiment.overview.pi || '',
        number: experiment.id.match(/\d+$/)[0],
        plot: experiment.overview.plot || '',
        rate: experiment.acquisition.rate || '',
        reference: experiment.overview.reference || '–',
        references: experiment.references,
        startdate: startdate.toFormat(_app.dateFormat),
        starttime: starttime.toFormat(_app.timeFormat),
        starttimeISO: starttime.toISO()?.slice(0, -10) // ? checks if null
      };
    });

    return data;
  };

  /**
   * Get the HTML list item for the given reference.
   *
   * @param reference {Object}
   *
   * @return {String}
   */
  _getItem = function (reference) {
    return L.Util.template(
      '<li>' +
        '{author}, <a href="{doi}" target="new">{title}</a>, {year}.' +
      '</li>',
      reference
    );
  };

  /**
   * Get the HTML for the given experiment's plot.
   *
   * @param id {String}
   *     Experiment id
   *
   * @return html {String}
   */
  _getPlot = function (id) {
    var html = '', // default
        plot = _this.data[id].plot;

    if (plot) {
      html =
        '<h4>Data Quality</h4>' +
        `<img src="img/plots/${plot}" alt="waterfall plot">`;
    }

    return html;
  };

  /**
   * Get the HTML for the given experiment's references list.
   *
   * @param id {String}
   *     Experiment id
   *
   * @return html {String}
   */
  _getReferences = function (id) {
    var additional = '',
        html = '',
        primary = '';

    _this.data[id].references.forEach(reference => {
      if (reference.primary) {
        primary = _getItem(reference);
      } else {
        additional += _getItem(reference);
      }
    });

    if (primary) {
      html =
        '<h4>Primary Reference</h4>' +
        '<ul class="refs">' +
          primary +
        '</ul>';
    }

    if (additional) {
      html +=
        '<h4>Additional References</h4>' +
        '<ul class="refs">' +
          additional +
        '</ul>';
    }

    return html;
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

    _getContent = null;
    _getData = null;
    _getItem = null;
    _getPlot = null;
    _getReferences = null;

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
   * Get the Lightbox's HTML content.
   *
   * @param id {String}
   *     Experiment id
   *
   * @return {String}
   */
  _this.getContent = function (id) {
    var name,
        data = Object.assign({}, _this.data[id]),
        plot = _getPlot(id),
        references = _getReferences(id);

    if (data.doi !== '–') {
      name = data.doi.split('doi.org/')[1];
      data.doi = `<a href="${data.doi}" target="new">${name}</a>`;
    }
    if (data.reference !== '–') {
      name = new URL(data.reference).hostname,
      data.reference = `<a href="${data.reference}" target="new">${name}</a>`;
    }

    return L.Util.template(
      '<div class="columns">' +
        '<section>' +
          '<h4>Overview</h4>' +
          '<dl class="props alt">' +
            '<dt>Location</dt>' +
            '<dd>{location}</dd>' +
            '<dt>Principle Investigator</dt>' +
            '<dd>{name}</dd>' +
            '<dt>Start Date</dt>' +
            '<dd>{startdate}</dd>' +
            '<dt>End Date</dt>' +
            '<dd>{enddate}</dd>' +
          '</dl>' +
        '</section>' +
        '<section>' +
          '<h4>Instrument</h4>' +
          '<dl class="props alt">' +
            '<dt>Manufacturer</dt>' +
            '<dd>{manufacturer}</dd>' +
            '<dt>Model</dt>' +
            '<dd>{model}</dd>' +
          '</dl>' +
        '</section>' +
        '<section>' +
          '<h4>Acquisition</h4>' +
          '<dl class="props alt">' +
            '<dt>Start Time</dt>' +
            '<dd>{starttime}</dd>' +
            '<dt>End Time</dt>' +
            '<dd>{endtime}</dd>' +
            '<dt>Sample Rate</dt>' +
            '<dd>{rate}</dd>' +
            '<dt>Channels</dt>' +
            '<dd>{channels}</dd>' +
            '<dt>Spatial Interval</dt>' +
            '<dd>{interval}</dd>' +
            '<dt>Gauge Length</dt>' +
            '<dd>{length}</dd>' +
          '</dl>' +
        '</section>' +
      '</div>' +
      plot +
      '<h4>Data Archive</h4>' +
      '<dl class="citation props">' +
        '<dt>DOI</dt>' +
        '<dd>{doi}</dd>' +
        '<dt>Repository</dt>' +
        '<dd>{reference}</dd>' +
      '</dl>' +
      references,
      data
    );
  };

  /**
   * Render the Feature.
   *
   * @param json {Object} default is {}
   */
  _this.render = function (json = {}) {
    var cable = _app.Features.getFeature(_this.cable),
        lightbox = document.getElementById(_this.id);

    _this.data = _getData(json);

    if (!lightbox) {
      _this.lightbox.render();
    }

    cable.addContent(_getContent());
  };


  _initialize(options);
  options = null;
  return _this;
};


module.exports = Metadata;
