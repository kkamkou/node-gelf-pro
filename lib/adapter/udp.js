/**
 * Licensed under the MIT License
 *
 * @author   Kanstantsin A Kamkou (2ka.by)
 * @license  http://www.opensource.org/licenses/mit-license.php The MIT License
 * @link     https://github.com/kkamkou/node-gelf-pro
 */

'use strict';

const _ = require('lodash'),
  crypto = require('crypto'),
  dgram = require('dgram'),
  abstract = require('./abstract');

/**
 * [1] /src/main/java/org/graylog2/inputs/codecs/gelf/GELFMessageChunk.java
 *  at https://github.com/Graylog2/graylog2-server/blob/master/graylog2-server
 * [2] https://www.graylog.org/resources/gelf/
 */
const adapter = Object.create(abstract, {
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
  const chunks = [];
  for (var i = 0; i < buffer.length; i += maxSize) {
    chunks.push(Array.prototype.slice.call(buffer, i, i + maxSize));
  }
  return chunks;
};

/**
 * Sends a chunk to the server
 * @param {String|Array} message
 * @param {Function} callback
 * @returns {adapter}
 */
adapter.send = function (message, callback) {
  const messages = _.reject(_.castArray(message), _.isNil),
    packets = [],
    self = this;
  var bytesSentTotal = 0,
    client,
    deflated = 0,
    isInterrupted = false;

  const cbResults = _.once(function (err, result) {
    isInterrupted = true;
    if (client) { client.close(); }
    return (callback || _.noop)(err, result);
  });

  if (!messages.length) {
    process.nextTick(function () { cbResults(null, 0); });
    return this;
  }

  _.forEach(messages, function (item, mIdx) {
    self.deflate(item, function (err, buf) {
      if (err) { return cbResults(err, 0); }

      const chunkMaxLength = self.specification.chunkMaxLength[self.options.protocol],
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

      const packetId = Array.prototype.slice.call(crypto.randomBytes(8));
      packets[mIdx] = _.map(chunks, function (chunk, idx) {
        return Buffer.from(
          self.specification.magicBytes.concat(packetId, idx, chunksCount, chunk)
        );
      });

      if (isInterrupted || ++deflated < messages.length) {
        return;
      }

      client = self._createSocket().on('error', function (sockErr) {
        cbResults(sockErr, bytesSentTotal);
      });

      const allPackets = _.flatten(packets);
      var packetsSent = 0;
      _.forEach(allPackets, function (packet) {
        if (isInterrupted) {
          return false;
        }
        client.send(
          packet, 0, packet.length, self.options.port, self.options.host,
          function (sendErr, bytesSent) {
            if (sendErr) { return cbResults(sendErr, 0); }
            bytesSentTotal += bytesSent;
            if (++packetsSent >= allPackets.length) {
              cbResults(null, bytesSentTotal);
            }
          }
        );
      });
    });
  });

  return this;
};

// exporting outside
module.exports = adapter;
