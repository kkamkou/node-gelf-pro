/**
 * Licensed under the MIT License
 *
 * @author   Kanstantsin A Kamkou (2ka.by)
 * @license  http://www.opensource.org/licenses/mit-license.php The MIT License
 * @link     https://github.com/kkamkou/node-gelf-pro
 */

'use strict';

// required stuff
var path = require('path'),
  abstract = require(path.join(__dirname, 'abstract')),
  async = require('async'),
  net = require('net');

// the class itself
var tcp = Object.create(abstract);

/**
 * Sends a chunk to the server
 * @param {Object} packet
 * @param {Function} callback
 * @returns {tcp}
 */
tcp.send = function (message, callback) {
  var client, self = this;
  async.waterfall(
    [
      function (cb) {
        client = net.connect(self.options, cb);
      },
      function (cb) {
        if (!self.options.deflate) {
          return cb(null, new Buffer(message));
        }
        self.deflate(message, cb);
      },
      function (buffer, cb) {
        var packet = new Buffer(Array.prototype.slice.call(buffer, 0, buffer.length).concat(0x00));
        client.end(packet, function () {
          cb(null, packet.length);
        });
      }
    ],
    function (err, result) {
      return callback(err, result);
    }
  );
  return this;
};

// exporting outside
module.exports = tcp;
