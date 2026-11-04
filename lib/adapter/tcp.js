/**
 * Licensed under the MIT License
 *
 * @author   Kanstantsin A Kamkou (2ka.by)
 * @license  http://www.opensource.org/licenses/mit-license.php The MIT License
 * @link     https://github.com/kkamkou/node-gelf-pro
 */

'use strict';

// required stuff
const _ = require('lodash'),
  net = require('net'),
  abstract = require('./abstract');

// the class itself
const adapter = Object.create(abstract);

/**
 * Sends a message to the server
 * @param {String|Array} message
 * @param {Function} callback
 * @returns {adapter}
 */
adapter.send = function (message, callback) {
  const cb = _.once(callback || _.noop),
    messages = _.reject(_.castArray(message), _.isNil);

  if (!messages.length) {
    process.nextTick(function () { cb(null, 0); });
    return this;
  }

  const timeout = this.options.timeout || 10000,
    client = this._instance(this.options);

  client.setTimeout(timeout, function () {
    client.emit('error', new Error('Timeout (' + timeout + ' ms)'));
  });

  client
    .on('error', function (err) {
      client.end();
      client.destroy();
      cb(err);
    })
    .once('connect', function () {
      const packet = Buffer.concat(_.map(messages, function (item) {
        return Buffer.from(_.toString(item).replace(/\x00/g, '') + '\x00'); // eslint-disable-line
      }));
      client.end(packet, function () {
        cb(null, packet.length);
      });
    });

  return this;
};

/**
 * @param {Object} options
 * @returns {net.Socket}
 * @access protected
 */
adapter._instance = function (options) {
  return net.connect(options);
};

// exporting outside
module.exports = adapter;
