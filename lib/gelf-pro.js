/**
 * Licensed under the MIT License
 *
 * @author   Kanstantsin A Kamkou (2ka.by), Alexander Günther
 * @license  http://www.opensource.org/licenses/mit-license.php The MIT License
 * @link     https://github.com/kkamkou/node-gelf-pro
 */

// https://raw.githubusercontent.com/Graylog2/graylog2-server/master/graylog2-inputs/src/main/java/org/graylog2/inputs/gelf/gelf/GELFMessageChunk.java
// https://github.com/Graylog2/graylog2-server/issues/21
// http://sd.wareonearth.com/~phil/net/overhead/

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
      chunked: {
        'magicBytes': [0x1e, 0x0f],
        'chunkMaxCount': 128,
        'chunkMaxSizeUdp': 1420
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
 * @returns {String}
 */
gelf.getUniqueId = function () {
  var str = '';
  for (var i = 0, r; i < 6; i++) {
    if ((i & 0x03) === 0) {
      r = Math.random() * 0x100000000;
    }
    str += r >>> ((i & 0x03) << 3) & 0xff;
  }
  return str + process.pid;
};

gelf.getArrayFromBuffer = function () {

};

gelf.getClient = function () {
  return dgram.createSocket("udp4");
};

gelf.send = function (message, extra, cb) {
  zlib.deflate(message, function (err, buffer) {
    console.log(buffer, buffer.length);
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
