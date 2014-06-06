/**
 * Docs:
 * [1] /graylog2-inputs/src/main/java/org/graylog2/inputs/gelf/gelf/GELFMessageChunk.java
 * [2] http://graylog2.org/gelf#specs
 */

// required stuff
var zlib = require('zlib');

// the abstract class without prototype
var abstract = Object.create(null, {options: {writable: true, value: {}}});

/**
 * Changes configurations for the current adapter
 *
 * @param {*} options
 * return this
 */
abstract.setOptions = function (options) {
  this.options = options;
  return this;
};

/**
 * Splits a buffer into chunks
 *
 * @param  {Buffer} buffer
 * @return {Array}
 */
abstract.getArrayFromBuffer = function (buffer) {
  // defaults
  var maxSize = this.options.maxChunkSize,
    chunks = [],
    i = 0;

  // message length is ok
  if (buffer.length < maxSize) {
    chunks.push(buffer);
    return chunks;
  }

  // we should split the buffer on pieces
  for (i = 0; i <= buffer.length; i += maxSize) {
    chunks.push(buffer.slice(i, maxSize));
  }
  return chunks;
};

/**
 * Sends message to the server
 *
 * @param {String} message
 * @param {*} extra
 * @param {Function} cb
 */
abstract.send = function (message, extra, cb) {
  throw Error('Redefine me please');
};

/**
 * Message compression
 *
 * @param  {String} message
 * @param  {Function} cb
 * @return {*}
 */
abstract.deflate = function (message, cb) {
  zlib.deflate(message, cb);
  return this;
};

// exporting outside
module.exports = abstract;
