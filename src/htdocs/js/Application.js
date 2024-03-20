'use strict';


require('leaflet');

var Features = require('Features'),
    MapPane = require('MapPane'),
    StatusBar = require('StatusBar');


/**
 * Distributed Acoustic Sensing Data Application
 *
 * Instantiate the app's "primary" Classes and bind them together via the 'app'
 * property that is passed to all Classes. This makes their public properties
 * and methods accessible to each other.
 *
 * @param options {Object}
 *     {
 *       mapPane: {Element}
 *       statusBar: {Element}
 *     }
 */
var Application = function (options) {
  var _this,
      _initialize,

      _initialReset,

      _initClasses;


  _this = {};

  _initialize = function (options = {}) {
    _initialReset = true;

    _this.dateFormat = 'LLL d, yyyy';
    _this.timeFormat = 'LLL d, yyyy TT';

    _this.reset();
    _initClasses(options);
    _this.Features.createFeatures('base');
  };

  /**
   * Instantiate the app's 'primary' Classes and store/share their public
   * methods/props via the 'app' property.
   *
   * @param els {Object}
   */
  _initClasses = function (els) {
    var appClasses = {
      Features: Features,
      MapPane: MapPane,
      StatusBar: StatusBar
    };

    Object.keys(appClasses).forEach(name => {
      var key = name.charAt(0).toLowerCase() + name.slice(1);

      _this[name] = appClasses[name]({
        app: _this,
        el: els[key] || null
      });
    });
  };

  // ----------------------------------------------------------
  // Public methods
  // ----------------------------------------------------------

  /**
   * Reset the app.
   */
  _this.reset = function () {
    sessionStorage.clear();

    if (!_initialReset) {
      _this.Features.reset();
      _this.StatusBar.reset();
    }

    _initialReset = false;
  };


  _initialize(options);
  options = null;
};


module.exports = Application;
