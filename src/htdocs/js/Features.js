'use strict';


var CableLines = require('features/CableLines'),
    Earthquakes = require('features/Earthquakes'),
    Experiment = require('features/Experiment'),
    Metadata = require('features/Metadata');


var _MODULES = {
  base: [ // Features added when app is loaded
    CableLines
  ],
  cable: [ // Features added when a cable is selected
    Metadata
  ],
  experiment: [ // Features added when an experiment is selected
    Earthquakes,
    Experiment
  ]
};


/**
 * Create, add, store, reload, get, remove, and delete Features.
 *
 * @param options {Object}
 *     {
 *       app: {Object} Application
 *     }
 *
 * @return _this {Object}
 *     {
 *       createFeature: {Function}
 *       createFeatures: {Function}
 *       deleteFeature: {Function}
 *       getFeature: {Function}
 *       getFeatures: {Function}
 *       getStatus: {Function}
 *       isFeature: {Function}
 *       reloadFeature: {Function}
 *       reset: {Function}
 *       storeFeature: {Function}
 *     }
 */
var Features = function (options) {
  var _this,
      _initialize,

      _app,
      _features,
      _modules,
      _opts,

      _getMode,
      _getOptions,
      _initFeatures,
      _removeFeatures;


  _this = {};

  _initialize = function (options = {}) {
    _app = options.app;
    _modules = {};
    _opts = {};

    _initFeatures();
  };

  /**
   * Get the display mode for the given Feature.
   *
   * @param id {String}
   *     Feature id
   *
   * @return match {String <base|cable|experiment>} default is ''
   */
  _getMode = function (id) {
    var match = ''; // default

    Object.keys(_features).forEach(mode => {
      if (mode !== 'loading') { // skip Features that aren't ready
        Object.keys(_features[mode]).forEach(featureId => {
          if (id === featureId) {
            match = mode;
          }
        });
      }
    });

    return match;
  };

  /**
   * Get the reload options for the given Feature.
   *
   * @param id {String}
   *     Feature id
   * @param mode {String}
   *     Feature mode
   *
   * @return opts {Object}
   */
  _getOptions = function (id, mode) {
    var feature = _this.getFeature(id),
        opts = Object.assign({}, _opts[mode] || {}, {
          deferFetch: false // always reload immediately
        });

    if (_this.isFeature(feature)) { // refreshing existing Feature
      opts.isRefreshing = true;
    }

    return opts;
  };

  /**
   * Initialize _features, which stores Features grouped by their display mode.
   */
  _initFeatures = function () {
    var base;

    if (typeof _features === 'object') {
      base = _features.base;
    }

    _features = {
      base: base || {}, // leave existing 'base' Features intact
      cable: {},
      experiment: {},
      loading: {} // temporary storage for Features that aren't ready
    };
  };

  /**
   * Remove all Features, except 'base' Features.
   */
  _removeFeatures = function () {
    try {
      Object.keys(_features).forEach(mode => {
        if (mode !== 'base') {
          Object.keys(_features[mode]).forEach(id => {
            var feature = _features[mode][id];

            if (feature.remove) {
              feature.remove();
            }

            feature.destroy();
          });
        }
      });
    } catch (error) {
      console.error(error);
    }
  };

  // ----------------------------------------------------------
  // Public methods
  // ----------------------------------------------------------

  /**
   * Create a new Feature using the given module and mode and store its module.
   *
   * @param module {Object}
   *     Feature's module
   *
   *     {
   *       Required props:
   *
   *         destroy: {Function} free references
   *         id: {String} unique id
   *         name: {String} display name
   *
   *       Auto-set props:
   *
   *         mode: {String <base|cable>|experiment} display mode
   *         status: {String <error|initialized|loading|ready>} loading status
   *         updated: {Number} fetch/creation time (milliseconds)
   *     }
   * @param mode {String <base|cable|experiment>}
   * @param opts {Object} optional; default is {}
   *
   * @return feature {Object}
   */
  _this.createFeature = function (module, mode, opts = {}) {
    var feature = {};

    try {
      feature = module(Object.assign(opts, {
        app: _app
      }));

      Object.assign(feature, {
        mode: mode,
        status: 'initialized',
        updated: 0
      });

      _features.loading[feature.id] = feature;
      _modules[feature.id] = module;

      if (feature.deferFetch || !feature.url) {
        _this.storeFeature(feature); // Feature ready; no data to load

        if (feature.render) {
          feature.render();
        }
      }
    } catch (error) {
      console.error(error);
    }

    return feature;
  };

  /**
   * Wrapper method that creates all of the Features for the given display mode.
   *
   * @param mode {String <base|cable|experiment>}
   * @param opts {Object} default is {}
   */
  _this.createFeatures = function (mode, opts = {}) {
    if (mode === 'experiment') {
      _features.experiment = {}; // reset previous experiment's Features
    }

    _opts[mode] = opts; // cache to enable reloading after a failed request

    _MODULES[mode].forEach(module => {
      _this.createFeature(module, mode, opts);
    });
  };

  /**
   * Delete the given stored Feature.
   *
   * @param id {String}
   *     Feature id
   */
  _this.deleteFeature = function (id) {
    var mode = _getMode(id);

    if (mode) { // Feature was stored
      delete _features[mode][id];
    }
  };

  /**
   * Get the Feature matching the given id.
   *
   * Note: Features are stored when their feed data has finished loading.
   * Features with no feed data (or with deferFetch set) are stored immediately.
   *
   * @param id {String}
   *     Feature id
   *
   * @return feature {Object}
   */
  _this.getFeature = function (id) {
    var feature = {}, // default
        mode = _getMode(id);

    if (mode) { // Feature exists and is ready
      feature = _features[mode][id];
    }

    return feature;
  };

  /**
   * Get all Features matching the given display mode, keyed by their id values.
   *
   * @param mode {String <base|cable|experiment>} default is 'experiment'
   *
   * @return {Object}
   */
  _this.getFeatures = function (mode = 'experiment') {
    return _features[mode] || {};
  };

  /**
   * Get the collective loading status of all Features for the given display
   * mode.
   *
   * @param mode {String <base|cable|experiment>} default is 'experiment'
   *
   * @return status {String}
   */
  _this.getStatus = function (mode = 'experiment') {
    var numFeatures = Object.keys(_features[mode]).length,
        numModules = _MODULES[mode].length,
        status = 'loading'; // default

    if (numFeatures === numModules) {
      status = 'ready';
    }

    return status;
  };

  /**
   * Check if the given feature exists/contains the required properties.
   *
   * @param feature {Object} default is {}
   *
   * @return {Boolean}
   */
  _this.isFeature = function (feature = {}) {
    var required = ['destroy', 'id', 'name'];

    return required.every(prop => feature[prop]);
  };

  /**
   * Reload the given Feature.
   *
   * @param id {Object}
   *     Feature id
   * @param mode {String} optional; default is ''
   *     Feature mode - REQUIRED when reloading after a failed request
   */
  _this.reloadFeature = function (id, mode = '') {
    mode = mode || _getMode(id);

    _this.createFeature(_modules[id], mode, _getOptions(id, mode));
  };

  /**
   * Reset to default state.
   */
  _this.reset = function () {
    _removeFeatures();
    _initFeatures();
  };

  /**
   * Store the given Feature and delete it from the list of loading Features.
   *
   * @param feature {Object}
   */
  _this.storeFeature = function (feature) {
    feature.status = 'ready';
    _features[feature.mode][feature.id] = feature;

    delete _features.loading[feature.id];
  };


  _initialize(options);
  options = null;
  return _this;
};


module.exports = Features;
