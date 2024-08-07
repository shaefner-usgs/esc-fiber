'use strict';


/**
 * Show the loading status of fetched data as well as any errors encountered.
 *
 * @param options {Object}
 *     {
 *       app: {Object} Application
 *       el: {Element}
 *     }
 *
 * @return _this {Object}
 *     {
 *       addError: {Function}
 *       addItem: {Function}
 *       removeItem: {Function}
 *       reset: {Function}
 *     }
 */
var StatusBar = function (options) {
  var _this,
      _initialize,

      _app,
      _el,

      _addListeners,
      _getMessage,
      _hide,
      _reloadFeature,
      _removeItem,
      _removeListeners,
      _removeNode,
      _show;


  _this = {};

  _initialize = function (options = {}) {
    _app = options.app;
    _el = options.el;
  };

  /**
   * Add event listeners.
   *
   * @param el {Element}
   * @param error {Object}
   */
  _addListeners = function (el, error) {
    var close = el.querySelector('.close'),
        reload = el.querySelector('.reload');

    close?.addEventListener('click', e => _removeItem(e, error));
    reload?.addEventListener('click', e => _reloadFeature(e, error));
  };

  /**
   * Get the loading message, including the ellipsis loader.
   *
   * @param item {Object}
   * @param opts {Object}
   *
   * @return {String}
   */
  _getMessage = function (item, opts) {
    var loader = '<span class="ellipsis"><span>.</span><span>.</span><span>.</span></span>',
        msg = '';

    if (item.name) {
      msg += item.name;
    }
    if (opts.append) {
      msg += ' ' + opts.append;
    }
    if (opts.prepend) {
      msg = opts.prepend + ' ' + msg;
    }

    return msg + loader;
  };

  /**
   * Hide the StatusBar.
   */
  _hide = function () {
    _el.classList.add('hide');
  };

  /**
   * Event handler that reloads a Feature (or the app if necessary).
   *
   * @param e {Event}
   * @param error {Object}
   */
  _reloadFeature = function (e, error) {
    e.preventDefault();

    if (e.target.classList.contains('app')) {
      location.reload(); // reload app
    } else {
      _this.removeItem(error.id, false);
      _app.Features.reloadFeature(error.id, error.mode);
    }
  };

  /**
   * Event handler that removes an item from the StatusBar.
   *
   * @param e {Event}
   * @param error {Object}
   */
  _removeItem = function (e, error) {
    e.preventDefault();
    _this.removeItem(error.id, false);
  };

  /**
   * Remove event listeners.
   *
   * @param el {Element}
   */
  _removeListeners = function (el) {
    var close = el.querySelector('.close'),
        reload = el.querySelector('.reload');

    close?.removeEventListener('click', _removeItem);
    reload?.removeEventListener('click', _reloadFeature);
  };

  /**
   * Remove the given node from the DOM.
   *
   * @param el {Element}
   */
  _removeNode = function (el) {
    var parent = el.parentNode;

    _removeListeners(el);

    if (parent) {
      parent.removeChild(el);

      // Due to CSS transition timing, 'hide' class is not always set
      if (!_el.hasChildNodes()) {
        _el.style.display = 'none';
      }
    }
  };

  /**
   * Show the StatusBar.
   */
  _show = function () {
    _el.style.display = 'block'; // undo setting of 'none' in _removeNode()

    _el.classList.remove('hide');
  };

  // ----------------------------------------------------------
  // Public methods
  // ----------------------------------------------------------

  /**
   * Add an error and show the StatusBar.
   *
   * @param error {Object}
   *     {
   *       id: {String}
   *           Feature id
   *       message: {String}
   *       mode: {String} optional (req'd for reload button)
   *           display mode
   *       status: {Mixed <Number|String>} optional (req'd for reload button)
   *           status code or 'invalid'
   *     }
   */
  _this.addError = function (error) {
    var content = error.message,
        div = document.createElement('div');

    if (error.id !== 'rtf') {
      if (error.status === 200) {
        content += '<a href="#" class="reload app"></a>';
      } else if (
        error.status !== 400 &&
        error.status !== 404 &&
        error.status !== 'invalid'
      ) {
        content += '<a href="#" class="reload"></a>';
      }
    }

    content += '<a href="#" class="close"></a>';

    div.innerHTML = content;
    div.classList.add(error.id, 'error');

    // Remove any 'leftover' items with this id, then add it
    _this.removeItem(error.id);
    _el.appendChild(div);
    _addListeners(div, error);
    _show();
  };

  /**
   * Add an item and show the StatusBar.
   *
   * @param item {Object}
   *     {
   *       id: {String} Feature id
   *       name: {String} optional
   *     }
   * @param opts {Object}
   *     {
   *       append: {String} optional
   *       prepend: {String} optional
   *     }
   */
  _this.addItem = function (item, opts) {
    var message,
        div = document.createElement('div');

    opts = Object.assign({
      append: '',
      prepend: 'Loading'
    }, opts);
    message = _getMessage(item, opts);

    div.innerHTML = '<h4>' + message + '</h4>';
    div.classList.add(item.id);

    // Remove any 'leftover' items with this id, then add it
    _this.removeItem(item.id);
    _el.appendChild(div);
    _show();
  };

  /**
   * Remove the item with the given id (and hide the StatusBar when it's empty).
   *
   * @param id {String}
   *     Feature id
   * @param delay {Boolean} optional; default is true
   *     Delays removal so CSS transition can finish first
   */
  _this.removeItem = function (id, delay = true) {
    var items = _el.querySelectorAll('.' + id); // also remove duplicate items

    items.forEach(item => {
      if (_el.children.length === 1) {
        _hide();

        if (delay) {
          setTimeout(_removeNode, 1500, item);
        } else {
          _removeNode(item);
        }
      } else {
        _removeNode(item);
      }
    });
  };

  /**
   * Reset to default state.
   */
  _this.reset = function () {
    _el.innerHTML = '';

    _hide();
  };


  _initialize(options);
  options = null;
  return _this;
};


module.exports = StatusBar;
