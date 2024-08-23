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
      _location,

      _getContent,
      _getData,
      _getPlot,
      _getReferences;


  _this = {};

  _initialize = function (options = {}) {
    _app = options.app;
    _location = options.name;

    _this.cable = options.cable;
    _this.data = {};
    _this.id = 'metadata';
    _this.lightbox = Lightbox({
      id: _this.id
    });
    _this.name = _location + ' Experiments';
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
        `<h4>${_this.name}</h4>`;

    if (AppUtil.isEmpty(_this.data)) {
      html += '<p>None</p>';
    } else {
      html +=
        '<table>' +
          '<tr><td></td><th>Start Date</th><th>End Date</th><td></td><td></td></tr>';

      Object.keys(_this.data).forEach(id => {
        html += L.Util.template(
          '<tr class="{experiment}">' +
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
    var data = {},
        experiments = json.experiments;

    Object.keys(experiments).forEach(id => {
      var experiment = experiments[id],
          enddate = Luxon.DateTime.fromSQL(experiment.Overview.enddate),
          endtime = Luxon.DateTime.fromSQL(experiment.Acquisition.endtime),
          startdate = Luxon.DateTime.fromSQL(experiment.Overview.startdate),
          starttime = Luxon.DateTime.fromSQL(experiment.Acquisition.starttime);

      data[id] = {
        channels: experiment.Acquisition.channels || '',
        doi: experiment.Overview.doi || '–',
        email: experiment.Overview.pi_email || '',
        enddate: enddate.toFormat(_app.dateFormat),
        endtime: endtime.toFormat(_app.timeFormat),
        endtimeISO: endtime.toISO()?.slice(0, -10), // ? checks if null
        experiment: id,
        interval: experiment.Acquisition.interval || '',
        length: experiment.Acquisition.length || '',
        location: _location,
        manufacturer: experiment.Interrogator.manufacturer || '',
        model: experiment.Interrogator.model || '',
        name: experiment.Overview.pi || '',
        number: id.match(/\d+$/)[0],
        plot: experiment.Overview.plot || '',
        rate: experiment.Acquisition.rate || '',
        reference: experiment.Overview.reference || '–',
        references: experiment.References,
        startdate: startdate.toFormat(_app.dateFormat),
        starttime: starttime.toFormat(_app.timeFormat),
        starttimeISO: starttime.toISO()?.slice(0, -10) // ? checks if null
      };
    });

    return data;
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
    var html = '',
        lis = '';

    _this.data[id].references.forEach(reference => {
      lis += L.Util.template(
        '<li>' +
          '{author}, <a href="{doi}" target="new">{title}</a>, {year}.' +
        '</li>',
        reference
      );
    });

    if (lis) {
      html =
        '<h4>Additional References</h4>' +
        '<ul class="refs">' +
          lis +
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
    _location = null;

    _getContent = null;
    _getData = null;
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
    var data = Object.assign({}, _this.data[id]),
        plot = _getPlot(id),
        references = _getReferences(id);

    if (data.doi !== '–') {
      data.doi = `<a href="${data.doi}" target="new">${data.doi}</a>`;
    }
    if (data.reference !== '–') {
      data.reference = `<a href="${data.reference}" target="new">${data.reference}</a>`;
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
      '<h4>Citation</h4>' +
      '<dl class="citation props">' +
        '<dt>DOI</dt>' +
        '<dd>{doi}</dd>' +
        '<dt>Reference</dt>' +
        '<dd>{reference}</dd>' +
      '</dl>' +
      references +
      '<h4>Data Archive</h4>' +
      '<p>Placeholder</p>',
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
