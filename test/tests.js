// required stuff
var path = require('path'),
  sinon = require('sinon'),
  _ = require('lodash'),
  gelfOriginal = require(path.join('..', 'lib', 'gelf-pro'));

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
  before: function () {},
  beforeEach: function () {},
  afterEach: function () {},

  'Basic functionality': {
    'Predefined fields': function () {
      var gelf = _.cloneDeep(gelfOriginal),
        mock = sinon.mock(gelf);

      mock.expects('getStringFromObject').once()
        .withArgs({example: 1, level: 6, short_message: 'Test message'});

      gelf.setConfig({fields: {example: 1}}).info('Test message');

      mock.verify();
    },

    'Field validation': function () {
      var gelf = _.cloneDeep(gelfOriginal),
        mock = sinon.mock(gelf),
        args = {
          short_message: 'Short message',
          full_message: 'Full message',
          level: 10,
          host: 'myhost',
          timestamp: Date.now() / 1000,
          id: 1
        };

      sinon.spy(gelf, 'getStringFromObject');

      gelf.info('Test message', args);

      gelf.getStringFromObject.calledOnce.should.be.true;

      delete args.id;
      var result = JSON.parse(gelf.getStringFromObject.lastCall.returnValue);
      result.should.have.properties(args);
      result.should.not.have.property('id');
    }
  }
};
