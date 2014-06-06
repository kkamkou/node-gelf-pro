// required stuff
var path = require('path'),
  gelf = require(path.join('..', 'lib', 'gelf-pro'));

// helper functions
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
    // tbd...
  }
}
