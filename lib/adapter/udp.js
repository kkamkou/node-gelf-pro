// required stuff
var abstract = require(__dirname + '/abstract'),
  dgram = require('dgram'),
  async = require('async'),
  udp;

udp = Object.create(abstract, {
  metadata: {
    value: {
      magicBytes: [0x1e, 0x0f],
      chunkMaxCount: 128,
      chunkMaxSize: {
        udp4: 1388, // 1428 - 20 - 8 - 12 (@see [1])
        udp6: 1368 // 1428 - 40 - 8 - 12 (@see [1])
      }
    }
  }
});

udp.getClient = function (cb) {
  var socket = dgram.createSocket(udp.options.protocol);

  /*socket.on('listening', function () {
    return cb(null, socket);
  });*/

  socket.on('error', function (err) {
    return cb(err);
  });

  socket.on("message", function (msg, rinfo) {
    console.log("server got: " + msg);
  });

  cb(null, socket);
  return this;
};


udp.send = function (message, extra, callback) {
  var self = this;

  udp.getClient(function (err, client) {
    if (err) {
      return callback(err);
    }

    async.waterfall(
      [
        function (cb) {
          self.deflate(message, cb);
        },

        function (buffer, cb) {
          console.log(111);
          var chunks = self.getArrayFromBuffer(buffer),
            packetId = self.getUniqueId(),
            bytesFirst = self.metadata.magicBytes;

          chunks.forEach(function (chunk, idx) {
            var packet = ''.concat(bytesFirst, packetId, idx, chunks.length, chunk);
            return cb(null, packet);
          });
        },

        function (packet, cb) {
          console.log(packet);
          client.send(packet, 0, packet.length, udp.options.port, udp.options.host, cb);
        },

        function (bytes, cb) {
          cb(null, bytes);
        }
      ],

      function (err, result) {
        console.log(111);
        client.close();
        return callback(err, result);
      }
    );
  });
};

// exporting outside
module.exports = udp;
