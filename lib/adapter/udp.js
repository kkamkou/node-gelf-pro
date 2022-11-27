/**
 * Licensed under the MIT License
 *
 * @author   Kanstantsin A Kamkou (2ka.by)
 * @license  http://www.opensource.org/licenses/mit-license.php The MIT License
 * @link     https://github.com/kkamkou/node-gelf-pro
 */

'use strict';

var _ = require('lodash'),
  crypto = require('crypto'),
  dgram = require('dgram'),
  abstract = require('./abstract');

// compatibility
var buffer = require('../compatibility/buffer');

/**
 * [1] /src/main/java/org/graylog2/inputs/codecs/gelf/GELFMessageChunk.java
 *  at https://github.com/Graylog2/graylog2-server/blob/master/graylog2-server
 * [2] https://www.graylog.org/resources/gelf/
 */
var adapter = Object.create(abstract, {
  specification: {
    value: {
      version: '1.1',
      magicBytes: [0x1e, 0x0f],
      chunkMaxCount: 128,
      chunkMaxLength: {
        udp4: 1388, // 1428 - 20 - 8 - 12 (@see [1])
        udp6: 1368  // 1428 - 40 - 8 - 12 (@see [1])
      }
    }
  }
});

/**
 * Creates a new dgram.Socket object
 * @returns {dgram.Socket}
 * @private
 */
adapter._createSocket = function () {
  return dgram.createSocket(this.options.protocol);
};

/**
 * Splits a buffer into chunks
 * @param {Buffer} buffer
 * @param {Number} maxSize
 * @return {Array}
 */
adapter.getArrayFromBuffer = function (buffer, maxSize) {
  var chunks = [], i;
  for (i = 0; i <= buffer.length; i += maxSize) {
    chunks.push(Array.prototype.slice.call(buffer, i, i + maxSize));
  }
  return chunks;
};

/**
 * Sends a chunk to the server
 * @param {String} message
 * @param {Function} callback
 * @returns {adapter}
 */
adapter.send = function (message, callback) {
  var bytesSentTotal = 0,
    client = this._createSocket(),
    isInterrupted = false,
    self = this;

  var callbackOnce = _.once(callback),
    cbResults = function (err, result) {
      client.close();
      return callbackOnce(err, result);
    };

  client.on('error', function (err) {
    isInterrupted = true;
    cbResults(err, bytesSentTotal);
  });


  self.deflate(message, function (err, buf) {
    if (err) { return cbResults(err, 0); }

    var chunkMaxLength = self.specification.chunkMaxLength[self.options.protocol],
      chunks = self.getArrayFromBuffer(buf, chunkMaxLength),
      chunksCount = chunks.length;

    if (chunksCount > self.specification.chunkMaxCount) {
      return cbResults(
        new Error(
          'A message MUST NOT consist of more than %d chunks'.replace(
            '%d', self.specification.chunkMaxCount
          )
        ), 0
      );
    }

    var packetId = Array.prototype.slice.call(crypto.randomBytes(8)),
      chunksSent = 0;
    for (var idx in chunks) {
      if (isInterrupted) {
        break;
      }

      var chunk = chunks[idx],
        packet = buffer
          .from(self.specification.magicBytes.concat(packetId, idx, chunksCount, chunk));
      client.send(
        packet, 0, packet.length, self.options.port, self.options.host,
        function (err, bytesSent) {
          if (err) { return cbResults(err, 0); }
          bytesSentTotal += bytesSent;
          /* istanbul ignore else */
          if (++chunksSent >= chunksCount) {
            cbResults(err, bytesSentTotal);
          }
        }
      );
    }
  });

  return this;
};

// exporting outside
module.exports = adapter;
