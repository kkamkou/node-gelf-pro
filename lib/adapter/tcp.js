/**
 * Licensed under the MIT License
 *
 * @author   Kanstantsin A Kamkou (2ka.by)
 * @license  http://www.opensource.org/licenses/mit-license.php The MIT License
 * @link     https://github.com/kkamkou/node-gelf-pro
 */

'use strict';

// required stuff
var _ = require('lodash'),
  path = require('path'),
  net = require('net'),
  abstract = require(path.join(__dirname, 'abstract'));

// the class itself
var adapter = Object.create(abstract);

/**
 * Sends a message to the server
 * @param {String} message
 * @param {Function} callback
 * @returns {adapter}
 */
adapter.send = function (message, callback) {
  var cb = _.once(callback),
    timeout = this.options.timeout || 10000,
    client = this._instance(this.options);

  client.setTimeout(timeout, function () {
    client.emit('error', new Error('Timeout (' + timeout + ' ms)'));
  });

  client
    .once('error', function (err) {
      client.end();
      client.destroy();
      cb(err);
    })
    .once('connect', function () {
      var msg = new Buffer(message), // @todo! 1h add deflation with GELF 2.0
        packet = new Buffer(Array.prototype.slice.call(msg, 0, msg.length).concat(0x00));
      client.end(packet, function () {
        cb(null, packet.length);
      });
    });

  return this;
};

/**
 * @param {Object} options
 * @returns {net.Socket}
 * @access private
 */
adapter._instance = function (options) {
  return net.connect(options);
};

// exporting outside
module.exports = adapter;
