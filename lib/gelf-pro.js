/**
 * Licensed under the MIT License
 *
 * @author   Kanstantsin A Kamkou (2ka.by), Alexander Günther
 * @license  http://www.opensource.org/licenses/mit-license.php The MIT License
 * @link     https://github.com/kkamkou/node-gelf-pro
 */

/**
 * Docs:
 * [1] /graylog2-inputs/src/main/java/org/graylog2/inputs/gelf/gelf/GELFMessageChunk.java
 * [2] http://graylog2.org/gelf#specs
 */

// required stuff
var _ = require('lodash'),
  dgram = require('dgram'),
  zlib = require('zlib');

// the class itself
var gelf = Object.create(null, {
  specification: {
    value: {
      version: '1.1',
      levels: ['emergency', 'alert', 'critical', 'error', 'warning', 'notice', 'info', 'debug'],
      chunk: {
        'magicBytes': [0x1e, 0x0f],
        'maxCount': 128,
        'maxSizeUdp': {
          ip4: 1388, // 1428 - 20 - 8 - 12 (@see [1])
          ip6: 1368 // 1428 - 40 - 8 - 12 (@see [1])
        }
      }
    }
  },
  config: {
    writable: true,
    value: {
      key: null
    }
  }
});

/**
 * Generates a random number
 *
 * @returns {Number}
 */
gelf.getUniqueId = function () {
  var str = '';
  for (var i = 0, r; i < 6; i++) {
    if ((i & 0x03) === 0) {
      r = Math.random() * 0x100000000;
    }
    str += r >>> ((i & 0x03) << 3) & 0xff;
  }
  return str.substr(0, 8);
};

gelf.getArrayFromBuffer = function (buffer) {
  // defaults
  var maxSize = gelf.specification.chunk.maxSizeUdp.ip4,
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

gelf.getClient = function () {
  return dgram.createSocket("udp4");
};

gelf.deflate = function (message, cb) {
  zlib.deflate(message, cb);
  return this;
};

gelf.send = function (message, extra, cb) {
  var self = this;

  this.deflate(message, function (err, buffer) {
    var chunks = self.getArrayFromBuffer(buffer),
      packetId = self.getUniqueId(),
      bytesFirst = gelf.specification.chunk.magicBytes;

    chunks.forEach(function (chunk, idx) {
      var packet =  ''.concat(bytesFirst, packetId, idx, chunks.length, chunk);
      console.log(packet.length);
    });
  });

  return;

  var client = this.getClient();
  client.send(message, 0, message.length, 41234, "localhost", function(err, bytes) {
    client.close();
  });

  console.log(message, extra, cb);
};

gelf.specification.levels.forEach(function (lvl) {
  gelf[lvl] = function (message, extra, cb) {
    process.nextTick(function() {
      gelf.send(message, extra, cb);
    });
  };
});

// exporting outside
module.exports = gelf;
