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
  tls = require('tls'),
  tcp = require(path.join(__dirname, 'tcp'));

// the class itself
var adapter = Object.create(tcp);

/**
 * @param {Object} options
 * @returns {net.Socket}
 * @access private
 */
adapter._instance = function (options) {
  return tls.connect(options);
};

// exporting outside
module.exports = adapter;
