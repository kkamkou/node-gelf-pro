/**
 * Licensed under the MIT License
 *
 * @author   Kanstantsin A Kamkou (2ka.by)
 * @license  http://www.opensource.org/licenses/mit-license.php The MIT License
 * @link     https://github.com/kkamkou/node-gelf-pro
 */

'use strict';

var zlib = require('zlib');

var abstract = Object.create(null, {
  options: {enumerable: true, writable: true, value: {}}
});

/**
 * Changes the configuration of the current adapter
 * @param {Object} options
 * @return {abstract}
 */
abstract.setOptions = function (options) {
  this.options = options;
  return this;
};

/**
 * Message compression
 * @param  {String} message
 * @param  {Function} cb
 * @return {abstract}
 */
abstract.deflate = function (message, cb) {
  zlib.deflate(message, cb);
  return this;
};

/**
 * Sends a message to the server
 * @param {String} message
 * @param {Function} cb
 */
abstract.send = function (message, cb) { // eslint-disable-line
  throw new Error('Redefine me please');
};

// exporting outside
module.exports = abstract;
