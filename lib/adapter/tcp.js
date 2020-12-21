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
  net = require('net'),
  abstract = require('./abstract');

// compatibility
var buffer = require('../compatibility/buffer');

// the class itself
var adapter = Object.create(abstract);

/**
 * Sends a message to the server
 * @param {String} message
 * @param {Function} callback
 * @returns {adapter}
 */
adapter.send = function (message, callback) {
  let cb = _.once(callback);

  let client;

  try {
    client = this._instance(this.options);
  } catch (e) {
    cb(e);
    return;
  }

  let msg = buffer.from(message.replace(/\x00/g, '')); // eslint-disable-line
  let packet = buffer.from(Array.prototype.slice.call(msg, 0, msg.length).concat(0x00));

  try {
    client.write(packet);
    cb(null, packet.length);
  } catch (e) {
    cb(e);
  }

  return this;
};

let _sockets = {};

/**
 * @param {Object} options
 * @returns {net.Socket}
 * @access protected
 */
adapter._instance = function (options) {
  const key = JSON.stringify(options);

  if (!_sockets[key]) {
    const socket = net.connect(options);
    let timeout = options.timeout || 10000;

    socket.setTimeout(timeout, function () {
      socket.emit('error', new Error('Timeout (' + timeout + ' ms)'));
    });

    socket.once('error', function (err) {// todo: communicate this somehow
      delete _sockets[key];
      socket.end();
      socket.destroy();
    });

    _sockets[key] = socket;
  }

  return _sockets[key];
};

// exporting outside
module.exports = adapter;
