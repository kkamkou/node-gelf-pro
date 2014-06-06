/**
 * Licensed under the MIT License
 *
 * @author   Kanstantsin A Kamkou (2ka.by)
 * @license  http://www.opensource.org/licenses/mit-license.php The MIT License
 * @link     https://github.com/kkamkou/node-gelf-pro
 */

// required stuff
var zlib = require('zlib');

// the abstract class without prototype
var abstract = Object.create(null, {options: {writable: true, value: {}}});

/**
 * Changes the configuration of the current adapter
 *
 * @param {Object} options
 * @return {abstract}
 */
abstract.setOptions = function (options) {
  this.options = options;
  return this;
};

/**
 * Splits a buffer into chunks
 *
 * @param {Buffer} buffer
 * @param {Number} maxSize
 * @return {Array}
 */
abstract.getArrayFromBuffer = function (buffer, maxSize) {
  // defaults
  var i, chunks = [];

  // we should split the buffer on pieces
  for (i = 0; i <= buffer.length; i += maxSize) {
    chunks.push(Array.prototype.slice.call(buffer, i, i + maxSize));
  }

  return chunks;
};

/**
 * Sends message to a server
 *
 * @param {String} message
 * @param {Function} cb
 */
abstract.send = function (message, cb) {
  throw new Error('Redefine me please');
};

/**
 * Message compression
 *
 * @param  {String} message
 * @param  {Function} cb
 * @return {abstract}
 */
abstract.deflate = function (message, cb) {
  zlib.deflate(message, cb);
  return this;
};

// exporting outside
module.exports = abstract;
