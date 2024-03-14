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

      _getData,
      _getPopup;


  _this = {};

  _initialize = function (options = {}) {
    _app = options.app;

    _this.cable = options.cable;
    _this.data = {};
    _this.id = 'metadata';
    _this.name = options.name + ' Experiments';
    _this.lightbox = Lightbox({
      id: _this.id
    });
    _this.url = `json/${options.cable}.json`;
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

    Object.keys(json).forEach(id => {
      var experiment = json[id],
          enddate = experiment.Overview.end_date,
          endtime = experiment.Acquisition.acquisition_end_time,
          startdate = experiment.Overview.start_date,
          starttime = experiment.Acquisition.acquisition_start_time;

      data[id] = {
        channels: experiment.Acquisition.number_of_channels || '',
        doi: experiment.Overview.digital_object_identifier || '–',
        email: experiment.Overview.principal_investigator_email || '',
        enddate: Luxon.DateTime.fromSQL(enddate).toFormat(_app.dateFormat),
        endtime: Luxon.DateTime.fromISO(endtime).toFormat(_app.timeFormat),
        endtimeISO: endtime.slice(0, -5),
        experiment: id,
        gauge_length: experiment.Acquisition.gauge_length || '',
        gauge_length_unit: experiment.Acquisition.gauge_length_unit || '',
        interval: experiment.Acquisition.spatial_sampling_interval,
        interval_unit: experiment.Acquisition.spatial_sampling_interval_unit || '',
        location: experiment.Overview.location || '',
        manufacturer: experiment.Interrogator.manufacturer || '',
        model: experiment.Interrogator.model || '',
        name: experiment.Overview.principal_investigator_name || '',
        number: id.match(/\d+$/)[0],
        rate: experiment.Acquisition.acquisition_sample_rate,
        rate_unit: experiment.Acquisition.acquisition_sample_rate_unit || '',
        reference: experiment.Overview.comment || '–',
        startdate: Luxon.DateTime.fromSQL(startdate).toFormat(_app.dateFormat),
        starttime: Luxon.DateTime.fromISO(starttime).toFormat(_app.timeFormat),
        starttimeISO: starttime.slice(0, -5)
      };
    });

    return data;
  };

  /**
   * Get the CableLine Popup's HTML content.
   *
   * @return html {String}
   */
  _getPopup = function () {
    var html =
      '<div class="cablelines">' +
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
            '<td><a class="button metadata">Details</a></td>' +
          '</tr>',
          _this.data[id]
        );
      });

      html +=
        '</table>' +
      '</div>';
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

    _getData = null;
    _getPopup = null;

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
   * Get the Lightbox content.
   *
   * @param id {String}
   *
   * @return {String}
   */
  _this.getContent = function (id) {
    var data = Object.assign({}, _this.data[id]);

    if (data.doi !== '–') {
      data.doi = `<a href="${data.doi}">${data.doi}</a>`;
    }
    if (data.reference !== '–') {
      data.reference = `<a href="${data.reference}">${data.reference}</a>`;
    }

    return L.Util.template(
      '<div class="columns">' +
        '<section>' +
          '<h4>Overview</h4>' +
          '<dl class="props alt">' +
            '<dt>Location</dt>' +
            '<dd>{location}</dd>' +
            '<dt>Principle Investigator</dt>' +
            '<dd><a href="mailto:{email}">{name}</a></dd>' +
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
            '<dd>{rate} {rate_unit}</dd>' +
            '<dt>Channels</dt>' +
            '<dd>{channels}</dd>' +
            '<dt>Spatial Interval</dt>' +
            '<dd>{interval} {interval_unit}</dd>' +
            '<dt>Gauge Length</dt>' +
            '<dd>{gauge_length} {gauge_length_unit}</dd>' +
          '</dl>' +
        '</section>' +
      '</div>' +
      '<h4>Citation</h4>' +
      '<dl class="props">' +
        '<dt>DOI</dt>' +
        '<dd>{doi}</dd>' +
        '<dt>Reference</dt>' +
        '<dd>{reference}</dd>' +
      '</dl>' +
      '<h4>Data Archive</h4>' +
      '<p>Placeholder</p>' +
      '<h4>Data Quality</h4>' +
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

    cable.addContent(_getPopup());
  };


  _initialize(options);
  options = null;
  return _this;
};


module.exports = Metadata;
