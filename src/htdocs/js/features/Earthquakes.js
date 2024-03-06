/* global L */
'use strict';


var AppUtil = require('util/AppUtil'),
    Luxon = require('luxon');


var _AGE,
    _DEFAULTS,
    _DEPTH,
    _MARKERS,
    _NOW;

_AGE = { // fill colors
  older: '#ffffe6',
  pastday: '#f90',
  pasthour: '#f00',
  pastweek: '#ff0'
};
_NOW = Luxon.DateTime.now();
_DEFAULTS = {
  colorBy: 'age',
  endtime: _NOW.toUTC().toISO().slice(0, -5),
  latitude: null,
  longitude: null,
  maxlatitude: 90,
  maxlongitude: 180,
  maxradiuskm: null,
  minlatitude: -90,
  minlongitude: -180,
  minmagnitude: 3.5,
  starttime: _NOW.minus({months: 1}).toUTC().toISO().slice(0, -5)
};
_DEPTH = { // fill colors
  level1: '#f90',    // 0-33km
  level2: '#ff0',    // 33-70km
  level3: '#0f0',    // 70-150km
  level4: '#00f',    // 150-300km
  level5: '#c10aff', // 300-500km
  level6: '#f00'     // 500-800km
};
_MARKERS = {
  color: '#000', // stroke
  fillOpacity: 0.85,
  opacity: 0.6, // stroke
  weight: 1 // stroke
};


/**
 * Create the Earthquakes Feature.
 *
 * @param options {Object}
 *     {
 *       app: {Object} Application
 *       cable: {String} cable id
 *       colorBy: {String <age|depth>}
 *       endtime: {ISO Date} optional
 *       latitude: {Number} optional
 *       longitude: {Number} optional
 *       maxlatitude: {Number} optional
 *       maxlongitude: {Number} optional
 *       maxradiuskm: {Number} optional
 *       minlatitude: {Number} optional
 *       minlongitude: {Number} optional
 *       minmagnitude: {Number} optional
 *       starttime: {ISO Date} optional
 *     }
 *
 * @return _this {Object}
 *     {
 *       cable: {String}
 *       count: {Number}
 *       description: {String}
 *       destroy: {Function}
 *       id: {String}
 *       mapLayer: {L.GeoJSON}
 *       name: {String}
 *       remove: {Function}
 *       render: {Function}
 *       url: {String}
 *     }
 */
var Earthquakes = function (options) {
  var _this,
      _initialize,

      _app,
      _colorBy,

      _addBubbles,
      _deleteParams,
      _fetch,
      _getAge,
      _getEq,
      _getFillColor,
      _getLevel,
      _getPopup,
      _getRadius,
      _getTooltip,
      _getUrl,
      _onEachFeature,
      _pointToLayer;


  _this = {};

  _initialize = function (options = {}) {
    options = Object.assign({}, _DEFAULTS, options);

    _app = options.app;
    _colorBy = options.colorBy;

    _this.cable = options.cable;
    _this.count = 0;
    _this.description = `within ${options.maxradiuskm} km`;
    _this.id = 'earthquakes';
    _this.name = 'M 0+ Earthquakes';
    _this.url = _getUrl({
      endtime: options.endtime,
      latitude: options.latitude,
      longitude: options.longitude,
      maxlatitude: options.maxlatitude,
      maxlongitude: options.maxlongitude,
      maxradiuskm: options.maxradiuskm,
      minlatitude: options.minlatitude,
      minlongitude: options.minlongitude,
      minmagnitude: options.minmagnitude,
      starttime: options.starttime
    });

    _fetch();
  };

  /**
   * Add the the given earthquake's relevant 'impact bubbles' HTML, keyed by
   * type.
   *
   * @param eq {Object}
   */
  _addBubbles = function (eq) {
    Object.assign(eq, { // defaults
      alertBubble: '',
      cdiBubble: '',
      mmiBubble: '',
      tsunamiBubble: ''
    });

    if (eq.alert) { // PAGER
      eq.alertBubble = L.Util.template(
        '<a href="{url}/pager" class="pager-alertlevel-{alert} impact-bubble" ' +
          'target="new" title="Estimated impact alert level">' +
          '<strong class="roman">{alert}</strong>' +
          '<abbr title="Prompt Assessment of Global Earthquakes for Response">PAGER</abbr>' +
        '</a>',
        eq
      );
    }

    if (eq.cdi) { // DYFI
      eq.cdiBubble = L.Util.template(
        '<a href="{url}/dyfi" class="mmi{cdi} impact-bubble" target="new" ' +
          'title="Maximum reported intensity ({felt} responses)">' +
          '<strong class="roman">{cdi}</strong>' +
          '<abbr title="Did You Feel It?">DYFI?</abbr>' +
        '</a>',
        eq
      );
    }

    if (eq.mmi) { // ShakeMap
      eq.mmiBubble = L.Util.template(
        '<a href="{url}/shakemap" class="mmi{mmi} impact-bubble" target="new" ' +
          'title="Maximum estimated intensity">' +
          '<strong class="roman">{mmi}</strong>' +
          '<abbr title="ShakeMap">ShakeMap</abbr>' +
        '</a>',
        eq
      );
    }

    if (eq.tsunami) {
      eq.tsunamiBubble =
        '<a href="https://www.tsunami.gov/" class="tsunami impact-bubble" ' +
          'target="new" title="Tsunami Warning Center">' +
          '<span class="hover"></span>' +
          '<img src="img/tsunami.png" alt="Tsunami Warning Center">' +
        '</a>';
    }
  };

  /**
   * Delete extraneous location parameters (use a circle or rectangle, not both).
   *
   * @param params {Object}
   */
  _deleteParams = function (params) {
    if (params.latitude && params.longitude && params.maxradiuskm) {
      delete params.maxlatitude;
      delete params.maxlongitude;
      delete params.minlatitude;
      delete params.minlongitude;
    } else {
      delete params.latitude;
      delete params.longitude;
      delete params.maxradiuskm;
    }
  };

  /**
   * Fetch the feed data.
   */
  _fetch = function () {
    _this.mapLayer = L.geoJSON.async(_this.url, {
      app: _app,
      feature: _this,
      onEachFeature: _onEachFeature,
      pointToLayer: _pointToLayer
    });
  };

  /**
   * Get the 'age' of an earthquake (i.e. 'pasthour', 'pastday', etc).
   *
   * @param datetime {Object}
   *     Luxon datetime
   *
   * @return age {String}
   */
  _getAge = function (datetime) {
    var age = 'older',
        pastday = _NOW.minus({ days: 1 }),
        pasthour = _NOW.minus({ hours: 1 }),
        pastweek = _NOW.minus({ weeks: 1 });

    if (datetime >= pasthour) {
      age = 'pasthour';
    } else if (datetime >= pastday) {
      age = 'pastday';
    } else if (datetime >= pastweek) {
      age = 'pastweek';
    }

    return age;
  };

  /**
   * Get the earthquake (with convenience props set) for the given GeoJSON
   * feature, which is used to create the map layer.
   *
   * @param feature {Object}
   *
   * @return eq {Object}
   */
  _getEq = function (feature) {
    var eq, localTimeDisplay, statusIcon,
        props = feature.properties || {},
        cdi = AppUtil.romanize(Number(props.cdi) || ''),
        coords = feature.geometry?.coordinates || [0, 0, 0],
        datetime = Luxon.DateTime.fromMillis(Number(props.time)),
        magDisplay = AppUtil.round(props.mag, 1), // String
        mag = parseFloat(magDisplay) || 0,
        magType = props.magType || 'M',
        mmi = AppUtil.romanize(Number(props.mmi) || ''),
        status = (props.status || '').toLowerCase(),
        time = '<time datetime="{isoTime}" class="utc">{utcTimeDisplay}</time>' +
          '<time datetime="{isoTime}" class="user">{userTimeDisplay}</time>',
        title = magType + ' ' + magDisplay,
        utcOffset = Number(datetime.toFormat('Z')),
        userTimeDisplay = datetime.toFormat(_app.timeFormat) +
          ` <span class="tz">(UTC${utcOffset})</span>`,
        utcTimeDisplay = datetime.toUTC().toFormat(_app.timeFormat) +
          ' <span class="tz">(UTC)</span>';

    if (props.place) {
      title += '—' + props.place;
    }

    if (props.tz) { // local time (at epicenter)
      localTimeDisplay = datetime.toUTC(props.tz).toFormat(_app.timeFormat) +
        ' <span class="tz">at the epicenter</span>';
      time += '<time datetime="{isoTime}" class="local">{localTimeDisplay}</time>';
    }

    if (status === 'reviewed') {
      statusIcon = '<i class="icon-check"></i>';
    }

    eq = {
      alert: props.alert || '', // PAGER
      cdi: cdi || '', // DYFI
      coords: coords,
      datetime: datetime,
      depth: coords[2],
      depthDisplay: AppUtil.round(coords[2], 1) + '<span> km</span>',
      felt: AppUtil.addCommas(props.felt), // DYFI felt reports
      id: feature.id || '', // eqid
      isoTime: datetime.toUTC().toISO(),
      localTimeDisplay: localTimeDisplay || '',
      location: AppUtil.formatLatLon(coords),
      mag: mag,
      magDisplay: magDisplay,
      magType: magType,
      mmi: mmi || '', // ShakeMap
      radius: _getRadius(mag),
      status: status,
      statusIcon: statusIcon || '',
      title: title,
      tsunami: Boolean(props.tsunami),
      url: props.url || '',
      userTimeDisplay: userTimeDisplay,
      utcOffset: utcOffset,
      utcTimeDisplay: utcTimeDisplay
    };

    // Add additional props that depend on other props being set first
    _addBubbles(eq);
    eq.fillColor = _getFillColor(eq);
    eq.timeDisplay = L.Util.template(time, eq);

    return eq;
  };

  /**
   * Get the fill color for the given earthquake, symobolized by age or depth.
   *
   * @param eq {Object}
   *
   * @return {String}
   */
  _getFillColor = function (eq) {
    if (_colorBy === 'depth') {
      return _DEPTH[_getLevel(eq.depth)];
    } else {
      return _AGE[_getAge(eq.datetime)];
    }
  };

  /**
   * Get the depth 'level' of an earthquake.
   *
   * @param depth {Number}
   */
  _getLevel = function (depth) {
    switch (true) {
      case depth < 33: return 'level1';
      case depth < 70: return 'level2';
      case depth < 150: return 'level3';
      case depth < 300: return 'level4';
      case depth < 500: return 'level5';
      default: return 'level6';
    }
  };

  /**
   * Get the HTML content for the given earthquake's Leaflet Popup.
   *
   * @param eq {Object}
   *
   * @return {String}
   */
  _getPopup = function (eq) {
    return L.Util.template(
      '<div id="{id}" class="earthquake">' +
        '<h4>' +
          '<a href="https://earthquake.usgs.gov/response/?eqid={id}" target="new">{title}</a>' +
        '</h4>' +
        '<div class="impact-bubbles">' +
          '{cdiBubble}{mmiBubble}{alertBubble}{tsunamiBubble}' +
        '</div>' +
        '<dl class="props">' +
          '<dt class="time">Time</dt>' +
          '<dd class="time">{timeDisplay}</dd>' +
          '<dt>Depth</dt>' +
          '<dd>{depthDisplay}</dd>' +
          '<dt>Location</dt>' +
          '<dd>{location}</dd>' +
          '<dt class="status">Status</dt>' +
          '<dd class="status">{status}{statusIcon}</dd>' +
        '</dl>' +
      '</div>',
      eq
    );
  };

  /**
   * Get the circle marker radius for the given eq magnitude, rounded to the
   * nearest tenth.
   *
   * @param mag {Number}
   *
   * @return {Number}
   */
  _getRadius = function (mag) {
    var radius = 2 * Math.pow(10, (0.15 * Number(mag)));

    return Math.round(radius * 10) / 10;
  };

  /**
   * Get the HTML content for the given earthquake's Leaflet Tooltip.
   *
   * @param eq {Object}
   *
   * @return {String}
   */
  _getTooltip = function(eq) {
    return L.Util.template(
      '{magType} {magDisplay}—' +
      '<time datetime="{isoTime}" class="user">{userTimeDisplay}</time>' +
      '<time datetime="{isoTime}" class="utc">{utcTimeDisplay}</time>',
      eq
    );
  };

  /**
   * Get the GeoJSON feed's URL.
   *
   * @param params {Object}
   *     see API Documentation at https://earthquake.usgs.gov/fdsnws/event/1/
   *
   * @return {String}
   */
  _getUrl = function (params) {
    var baseUri = 'https://earthquake.usgs.gov/fdsnws/event/1/query',
        pairs = [];

    _deleteParams(params);

    Object.assign(params, {
      format: 'geojson',
      orderby: 'time-asc'
    });

    Object.keys(params).forEach(name => {
      var value = params[name];

      if (name === 'minmagnitude') {
        value -= 0.05; // account for rounding to tenths
      } else if (name === 'latitude' || name === 'longitude') {
        value = AppUtil.round(value, 3);
      }

      pairs.push(name + '=' + value);
    });

    return baseUri + '?' + pairs.join('&');
  };

  /**
   * Add the Leaflet Popups and Tooltips.
   *
   * @param feature {Object}
   * @param layer {L.Layer}
   */
  _onEachFeature = function (feature, layer) {
    var div = L.DomUtil.create('div'),
        eq = _getEq(feature);

    div.innerHTML = _getPopup(eq);

    layer.bindPopup(div, {
      minWidth: 365
    }).bindTooltip(_getTooltip(eq));
  };

  /**
   * Create the Leaflet Markers.
   *
   * @param feature {Object}
   * @param latlng {L.LatLng}
   *
   * @return {L.CircleMarker}
   */
  _pointToLayer = function (feature, latlng) {
    var eq = _getEq(feature),
        opts = Object.assign({}, _MARKERS, {
          fillColor: eq.fillColor,
          pane: _this.id, // controls stacking order
          radius: eq.radius
        });

    return L.circleMarker(latlng, opts);
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
    _colorBy = null;

    _addBubbles = null;
    _deleteParams = null;
    _fetch = null;
    _getAge = null;
    _getEq = null;
    _getFillColor = null;
    _getLevel = null;
    _getPopup = null;
    _getRadius = null;
    _getTooltip = null;
    _getUrl = null;
    _onEachFeature = null;
    _pointToLayer = null;

    _this = null;
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
  _this.render = function (json) {
    _app.MapPane.addFeature(_this);

    _this.count = json.features.length;
  };


  _initialize(options);
  options = null;
  return _this;
};


module.exports = Earthquakes;