'use strict';


// Static object with utility methods
var AppUtil = function () {};


/**
 * Add commas to large numbers (10,000 and greater).
 *
 * @param num {Number}
 *
 * @return {String}
 */
AppUtil.addCommas = function (num) {
  var decStr = '',
      numStr = String(num),
      parts = numStr.split('.'),
      intStr = parts[0],
      regex = /(\d+)(\d{3})/;

  if (!num && num !== 0) {
    return '';
  }

  if (parts.length > 1) {
    decStr = '.' + parts[1];
  }

  if (numStr.length > 4) {
    while (regex.test(intStr)) {
      intStr = intStr.replace(regex, '$1' + ',' + '$2');
    }
  }

  return intStr + decStr;
};

/**
 * Async fetch with timeout support.
 *
 * Adapted from: https://dmitripavlutin.com/timeout-fetch-request/
 *
 * @param resource {String}
 * @param options {Object} optional; default is {}
 */
AppUtil.fetchWithTimeout = async function (resource, options = {}) {
  const { timeout = 30000 } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const response = await fetch(resource, {
    ...options,
    signal: controller.signal
  });
  clearTimeout(timer);

  return response;
};

/**
 * Get a formatted lat/lon coordinate pair.
 *
 * @param coords {Array} default is []
 *
 * @return {String}
 */
AppUtil.formatLatLon = function (coords = []) {
  var lat = Math.abs(Number(coords[1])).toFixed(3),
      latHemisphere = (Number(coords[1]) < 0) ? 'S' : 'N',
      lon = Math.abs(Number(coords[0])).toFixed(3),
      lonHemisphere = (Number(coords[0]) < 0) ? 'W' : 'E';

  return `${lat}°${latHemisphere}, ${lon}°${lonHemisphere}`;
};

/**
 * Check if an Object is empty.
 *
 * @param obj {Object}
 *
 * @return {Boolean}
 */
AppUtil.isEmpty = function (obj) {
  if (typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).length === 0;
  }
};

/**
 * Convert a number to a roman numeral.
 *
 * @param num {Number}
 *
 * @return {String}
 */
AppUtil.romanize = function (num) {
  var digits,
      i = 3,
      key = [
        '', 'C', 'CC', 'CCC', 'CD', 'D', 'DC', 'DCC', 'DCCC', 'CM',
        '', 'X', 'XX', 'XXX', 'XL', 'L', 'LX', 'LXX', 'LXXX', 'XC',
        '', 'I' ,'II' ,'III' ,'IV' ,'V' ,'VI' ,'VII' ,'VIII' ,'IX'
      ],
      roman = '';

  if (typeof num !== 'number') {
    return ''; // ignore non-number values
  } else if (num === 0) {
    return 'N/A';
  }

  num = Math.round(num) || 1; // return 'I' for values less than 1
  digits = String(num).split('');

  while (i--) {
    roman = (key[+digits.pop() + (i * 10)] || '') + roman;
  }

  return Array(+digits.join('') + 1).join('M') + roman;
};

/**
 * Round a number and return the result with exactly the given precision's
 * number of digits following the decimal place.
 *
 * @param num {Number}
 * @param precision {Number} default is 0
 *     number of decimal places
 * @param empty {String} default is '–'
 *     string to return if num is null
 *
 * @return {String}
 *     NOTE: does not return a Number
 */
AppUtil.round = function (num, precision = 0, empty = '–') {
  var rounded,
      multiplier = Math.pow(10, precision);

  if (!num && num !== 0 || num === 'null') { // in case 'null' value is a string
    return empty;
  }

  num = Number(num);
  rounded = Math.round(num * multiplier) / multiplier;

  return rounded.toFixed(precision);
};

module.exports = AppUtil;
