// required stuff
var path = require('path'),
  sinon = require('sinon'),
  _ = require('lodash'),
  gelfOriginal = require(path.join('..', 'lib', 'gelf-pro'));

// helper functions
var getLongMessage = function (len) {
  var i = 0, message = '';
  for (i = 0; i <= (len || 10000); i++) {
    message += "Lorem Ipsum is simply dummy text of the printing and typesetting industry." +
        " Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an" +
        " unknown printer took a galley of type and scrambled it to make a type specimen book.";
  }
  return message;
};

var getAdapter = function (name) {
  return require(path.join('..', 'lib', 'adapter', name));
};

// tests
module.exports = {
  before: function () {},
  beforeEach: function () {},
  afterEach: function () {},

  'Core functionality': {
    'Default adapter functionality': function () {
      var gelf = _.cloneDeep(gelfOriginal),
        adapter = gelf.getAdapter(); // udp is a default one

      adapter.options.protocol.should.be.eql('udp4');
      adapter.send.should.be.a.Function;
    },

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
    },

    'Extra fileds normalization': function () {
      var mock = sinon.mock(console);
      mock.expects('warn').once().withArgs('the first value: the key format is not valid');

      var gelf = _.cloneDeep(gelfOriginal),
        result = gelf.getStringFromObject({
          value0: 'value0',
          'the first value': 'string',
          level1: {
            value1: 'value1',
            level2: {
              level3: {value3: 'value3'},
              value2: 'value2'
            }
          }
        });

      mock.verify();

      result = JSON.parse(result);
      result.should.have.property('_value0').equal('value0');
      result.should.have.property('_level1_value1').equal('value1');
      result.should.have.property('_level1_level2_value2').equal('value2');
      result.should.have.property('_level1_level2_level3_value3').equal('value3');
    }
  },

  'Adapter UDP': {
    'Compression validation': function (done) {
      var adapter = getAdapter('udp');
      adapter.deflate('test', function (err, buf) {
        (err === null).should.be.true;
        buf.should.be.an.instanceof(Buffer);
        done();
      });
    },

    'Chunks split validation': function () {
      var adapter = getAdapter('udp'),
        msgOriginal = getLongMessage(100),
        msgTmp = '',
        message = new Buffer(msgOriginal),
        result = adapter.getArrayFromBuffer(message, 100);

      result.should.have.length(248);
      result.forEach(function (chunk) {
        msgTmp += (new Buffer(chunk)).toString();
      });

      msgOriginal.should.be.exactly(msgTmp);
    }
  }
};
