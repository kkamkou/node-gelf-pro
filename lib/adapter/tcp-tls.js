/**
 * Licensed under the MIT License
 *
 * @author   Kanstantsin A Kamkou (2ka.by)
 * @license  http://www.opensource.org/licenses/mit-license.php The MIT License
 * @link     https://github.com/kkamkou/node-gelf-pro
 */

'use strict';

// required stuff
var tls = require('tls'),
  tcp = require('./tcp');

// the class itself
var adapter = Object.create(tcp);

/**
 * @param {Object} options
 * @returns {tls.TLSSocket}
 * @access protected
 */
adapter._instance = function (options) {
  return tls.connect(options);
};

// exporting outside
module.exports = adapter;
