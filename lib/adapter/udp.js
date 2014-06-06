/**
 * Licensed under the MIT License
 *
 * @author   Kanstantsin A Kamkou (2ka.by)
 * @license  http://www.opensource.org/licenses/mit-license.php The MIT License
 * @link     https://github.com/kkamkou/node-gelf-pro
 */

/**
 * Docs:
 * [1] /graylog2-inputs/src/main/java/org/graylog2/inputs/gelf/gelf/GELFMessageChunk.java
 * [2] http://graylog2.org/gelf#specs
 */

// required stuff
var abstract = require(__dirname + '/abstract'),
  dgram = require('dgram'),
  async = require('async'),
  crypto = require('crypto');

// the class itself
var udp = Object.create(abstract, {
  metadata: {
    value: {
      magicBytes: [0x1e, 0x0f],
      chunkMaxCount: 128,
      chunkMaxLength: {
        udp4: 1388, // 1428 - 20 - 8 - 12 (@see [1])
        udp6: 1368 // 1428 - 40 - 8 - 12 (@see [1])
      }
    }
  }
});

/**
 * Sends message to a server
 *
 * @param {String} message
 * @param {Function} callback
 * @returns {udp}
 */
udp.send = function (message, callback) {
  var self = this,
    client = dgram.createSocket(this.options.protocol);

  // business logic
  async.waterfall(
    [
      // chunk compression
      function (cb) {
        self.deflate(message, cb);
      },

      // trying to build and send a message
      function (buffer, cb) {
        var packetId = Array.prototype.slice.call(crypto.randomBytes(8)),
          bytesFirst = self.metadata.magicBytes,
          chunks = self.getArrayFromBuffer(
            buffer, self.metadata.chunkMaxLength[self.options.protocol]
          );

        // there is some limitations
        if (chunks.length > self.metadata.chunkMaxCount) {
          return cb(
            new Error(
              'A message MUST NOT consist of more than ' + self.metadata.chunkMaxCount + ' chunks'
            )
          );
        }

        // sending each chunk
        chunks.forEach(function (chunk, idx) {
          var packet = new Buffer(bytesFirst.concat(packetId, idx, chunks.length, chunk));
          client.send(packet, 0, packet.length, self.options.port, self.options.host, cb);
        });
      }
    ],

    // the final function
    function (err, result) {
      client.close();
      return callback(err, result);
    }
  );

  return this;
};

// exporting outside
module.exports = udp;
