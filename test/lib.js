/**
 * Licensed under the MIT License
 *
 * @author   Kanstantsin A Kamkou (2ka.by), Alexander Günther
 * @license  http://www.opensource.org/licenses/mit-license.php The MIT License
 * @link     https://github.com/kkamkou/node-gelf-pro
 */

// required stuff
var path = require('path'),
  gelf = require(path.join('..', 'lib', 'gelf-pro'));

var getLongMessage = function () {
  var i = 0, message = '';
  for (i = 0; i <= 10000; i++) {
    message += "Lorem Ipsum is simply dummy text of the printing and typesetting industry." +
        " Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an" +
        " unknown printer took a galley of type and scrambled it to make a type specimen book.";
  }
  return message;
};

// tests
module.exports = {
  before: function () {

  },

 'Testing methods': function () {
    gelf.info('worldaaaaaaaaaaaaaaaaaaaa sdasd', {aa: 4, bb: 5}, function (err) {
      console.log(err);
    });
  },

  /*'Long message split': function () {
    var message = getLongMessage();

    gelf.deflate(message, function (err, buffer) {
      gelf.getArrayFromBuffer(buffer).should.have.length(7);
    });
  },*/

  /*'Unique Id generation': function () {
    var out = [], i, curr;
    for (i = 0; i <= 1000; i++) {
      curr = gelf.getUniqueId();
      out.should.not.containEql(curr);
      curr.should.have.length(8);
      out.push(curr);
    }
  }*/
}
