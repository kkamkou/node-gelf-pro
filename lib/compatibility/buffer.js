/**
 * Licensed under the MIT License
 *
 * @author   Kanstantsin A Kamkou (2ka.by)
 * @license  http://www.opensource.org/licenses/mit-license.php The MIT License
 * @link     https://github.com/kkamkou/node-gelf-pro
 */

'use strict';

module.exports = {
  from: function (arrayBuffer, byteOffset, length) {
    return Buffer.from
      ? Buffer.from(arrayBuffer, byteOffset, length)
      : new Buffer(arrayBuffer, byteOffset, length);
  }
};
