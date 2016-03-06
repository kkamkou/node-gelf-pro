'use strict';

var path = require('path'),
  sinon = require('sinon'),
  should = require('should'),
  _ = require('lodash'),
  gelfOriginal = require(path.join('..', 'lib', 'gelf-pro'));

// helper functions
var getLongMessage = function (len) {
  var i = 0, message = '';
  for (i = 0; i <= (len || 10000); i++) {
    message += 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.' +
        ' Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an' +
        ' unknown printer took a galley of type and scrambled it to make a type specimen book.';
  }
  return message;
};

var getAdapter = function (name) {
  return require(path.join('..', 'lib', 'adapter', name));
};

module.exports = {
  'Core functionality': {
    'Set default adapter': function () {
      var gelf = _.cloneDeep(gelfOriginal),
        adapter = gelf.getAdapter(); // udp is a default one

      adapter.options.protocol.should.be.eql('udp4');
      adapter.send.should.be.a.Function();
    },

    'Expose pre-defined levels': function () {
      var levels = {
        emergency: 0, alert: 1, critical: 2, error: 3, warning: 4, warn: 4, notice: 5, info: 6,
        debug: 7, log: 7
      };

      var gelf = _.cloneDeep(gelfOriginal);
      sinon.spy(gelf, 'getStringFromObject');

      _.forEach(levels, function (lvl, fnc) {
        gelf[fnc]('test');
        JSON.parse(gelf.getStringFromObject.lastCall.returnValue).level.should.equal(lvl);
      });
    },

    'Set pre-defined fields': function () {
      var gelf = _.cloneDeep(gelfOriginal),
        mock = sinon.mock(gelf);

      mock.expects('getStringFromObject').once()
        .withArgs({example: 1, level: 6, short_message: 'Test message'});

      gelf.setConfig({fields: {example: 1}}).info('Test message');

      mock.verify();
    },

    'Validate fields': function () {
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

      gelf.getStringFromObject.calledOnce.should.be.true();

      delete args.id;
      var result = JSON.parse(gelf.getStringFromObject.lastCall.returnValue);
      result.should.have.properties(args);
      result.should.not.have.property('id');
    },

    'Normalize extra fields': function () {
      var mock = sinon.mock(console);
      mock.expects('warn').once().withExactArgs('the first value: the key format is not valid');

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
    },

    'Transform an Error object': function () {
      var gelf = _.cloneDeep(gelfOriginal),
        err = new Error('Some error message');

      sinon.spy(gelf, 'getStringFromObject');

      gelf.info(err);
      gelf.info('Example', err);

      JSON.parse(gelf.getStringFromObject.firstCall.returnValue)
        .should.containEql({short_message: err.message.toString()});
      JSON.parse(gelf.getStringFromObject.lastCall.returnValue)
        .should.have.properties(['_error_message', '_error_stack']);
    },

    'Broadcast messages': function () {
      var expected = [{short_message: 'test', level: 6, world: true}],
        stub1 = sinon.stub(),
        stub2 = sinon.stub(),
        gelf = _.cloneDeep(gelfOriginal);

      gelf.setConfig({broadcast: [stub1, stub2]});
      gelf.info('test', {world: true});

      stub1.lastCall.args.should.eql(expected);
      stub2.lastCall.args.should.eql(expected);
    },

    'Filter messages': function (done) {
      var gelf = _.cloneDeep(gelfOriginal),
        stub = sinon.stub().returns(true),
        spyFn = sinon.spy(function (msg) { return msg.level < 4; }),
        spySend = sinon.spy(gelf, 'send');

      gelf.setConfig({filter: [stub, spyFn]});
      gelf.warn('test', function (err, bytes) {
        should.not.exist(err);
        bytes.should.be.equal(0);
        stub.lastCall.args.should.eql([{short_message: 'test', level: 4}]);
        spyFn.lastCall.returned(false).should.be.true();
        spySend.neverCalledWith().should.be.true();;
        done();
      });
    }
  },

  'Adapter UDP': {
    'Compression validation': function (done) {
      var adapter = getAdapter('udp');
      adapter.deflate('test', function (err, buf) {
        should.not.exist(err);
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
    },

    'Chunks limitation validation': function (done) {
      var gelf = _.cloneDeep(gelfOriginal),
        adapter = gelf.getAdapter(),
        message = getLongMessage(100);

      sinon.stub(adapter, 'getArrayFromBuffer', function (msg, len) {
        return new Array(adapter.specification.chunkMaxLength.udp4);
      });

      gelf.send(message, function (err, result) {
        err.should.be.an.instanceof(Error);
        should.not.exist(result);
        done();
      });
    }
  },

  'Adapter TCP': {
    'Connection error': function (done) {
      var adapter = getAdapter('tcp');
      adapter.setOptions({'host': 'unknown', port: 5555});
      adapter.send('hello', function (err, result) {
        err.should.be.an.instanceof(Error);
        should.not.exist(result);
        done();
      });
    }
  }
};
