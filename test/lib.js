/**
 * Licensed under the MIT License
 *
 * @author   Kanstantsin A Kamkou (2ka.by), Alexander Günther
 * @license  http://www.opensource.org/licenses/mit-license.php The MIT License
 * @link     https://github.com/kkamkou/node-gelf-pro
 */

// required stuff
var path = require('path'),
  should = require('should'),
  gelf = require(path.join('..', 'lib', 'gelf-pro'));

// tests
module.exports = {
  before: function () {

  },

  'Testing methods': function () {
    gelf.info('world', {aa: 4, bb: 5}, function (err) {
      console.log('Sent!');
    });
  },

  'Unique Id generation': function () {
    var out = [], i, curr;
    for (i = 0; i <= 1000; i++) {
      curr = gelf.getUniqueId();
      out.should.not.containEql(curr);
      out.push(curr);
    }
  }
}
