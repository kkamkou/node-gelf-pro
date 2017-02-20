/**
 * Licensed under the MIT License
 *
 * @author   Kanstantsin A Kamkou (2ka.by)
 * @license  http://www.opensource.org/licenses/mit-license.php The MIT License
 * @link     https://github.com/kkamkou/node-gelf-pro
 */

'use strict';

var path = require('path'),
  abstract = require(path.join(__dirname, 'abstract')),
  async = require('async'),
  crypto = require('crypto'),
  dgram = require('dgram');

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
      chunkMaxCount: 20,
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
 * @param {Object} packet
 * @param {Function} cb
 * @returns {adapter}
 */
adapter.send = function (message, callback) {
  var client = this._createSocket(),
    bytesSentTotal = 0,
    self = this;

  async.waterfall(
    [
      function (cb) {
        self.deflate(message, cb);
      },
      function (buf, cb) {
        var chunks = self.getArrayFromBuffer(
            buf, self.specification.chunkMaxLength[self.options.protocol]
          ),
          chunksCount = chunks.length;

        if (chunksCount > self.specification.chunkMaxCount) {
          return cb(
            new Error(
              'A message MUST NOT consist of more than %d chunks'.replace(
                '%d', self.specification.chunkMaxCount
              )
            )
          );
        }

        var packetId = Array.prototype.slice.call(crypto.randomBytes(8));

        chunks.forEach(function (chunk, idx) {
          var packet = new Buffer(
            self.specification.magicBytes.concat(packetId, idx, chunksCount, chunk)
          );
          client.send(
            packet, 0, packet.length, self.options.port, self.options.host,
            function (err, bytesSent) {
              if (err) { return cb(err); }
              bytesSentTotal += bytesSent;
              if (idx >= chunksCount - 1) {
                cb(err, bytesSentTotal);
              }
            }
          );
        });
      }
    ],
    function (err, result) {
      client.close();
      return callback(err, result);
    }
  );
  return this;
};

// exporting outside
module.exports = adapter;
