'use strict';

var PATH_LIB = ['..', 'lib'].join('/');

var path = require('path'),
  sinon = require('sinon'),
  events = require('events'),
  should = require('should'),
  _ = require('lodash'),
  gelfOriginal = require(path.join(PATH_LIB, 'gelf-pro'));

// helper functions
var getLongMessage = function (len) {
  var i, message = '';
  for (i = 0; i <= (len || 10000); i++) {
    message += 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.' +
        ' Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an' +
        ' unknown printer took a galley of type and scrambled it to make a type specimen book.';
  }
  return message;
};

var getAdapter = function (name) {
  return Object.create(require(path.join('..', 'lib', 'adapter', name)));
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

    'Manually set level': function () {
      var gelf = _.cloneDeep(gelfOriginal),
        mock = sinon.mock(gelf);

      mock.expects('getStringFromObject').once()
        .withArgs({example: 1, level: 16, short_message: 'Test message'});

      gelf.setConfig({fields: {example: 1}}).message('Test message', 16);

      mock.verify();
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
      mock.expects('warn').once().withExactArgs('the.first.value: the key format is not valid');
      mock.expects('warn').once().withExactArgs('the second value: the key format is not valid');

      var gelf = _.cloneDeep(gelfOriginal),
        result = gelf.getStringFromObject({
          value0: 'value0',
          'the.first.value': 'string',
          'the second value': 'string',
          level1: {
            value1: 'value1',
            level2: {
              level3: {value3: 'value3'},
              value2: 'value2'
            },
            'key-with-dash': 1
          }
        });

      mock.verify();

      result = JSON.parse(result);
      result.should.have.property('_value0').equal('value0');
      result.should.have.property('_level1_value1').equal('value1');
      result.should.have.property('_level1_key-with-dash').equal(1);
      result.should.have.property('_level1_level2_value2').equal('value2');
      result.should.have.property('_level1_level2_level3_value3').equal('value3');

    },

    'Avoid an empty message': function (done) {
      var gelf = _.cloneDeep(gelfOriginal);
      sinon.spy(gelf, 'send');
      gelf.message();
      process.nextTick(function () {
        gelf.send.calledOnce.should.be.false();
        done();
      });
    },

    'Avoid a message with null': function (done) {
      var gelf = _.cloneDeep(gelfOriginal);
      sinon.spy(gelf, 'send');
      gelf.message(null, 2, function () {
        gelf.send.calledOnce.should.be.false();
        done();
      });
    },

    'Work with dates': function () {
      var gelf = _.cloneDeep(gelfOriginal),
        date = new Date();
      JSON.parse(gelf.getStringFromObject({test: date}))._test.should.equal(date.toString());
    },

    'Work with numeric type': function () {
      var gelf = _.cloneDeep(gelfOriginal),
        fields = {aFloat: 1.1, anInteger: 0, aString: '0'},
        json = JSON.parse(gelf.getStringFromObject(fields));
      Number.isFinite(json._aFloat).should.equal(true);
      Number.isFinite(json._anInteger).should.equal(true);
      Number.isFinite(json._aString).should.equal(false);
    },

    'Transform an Error object': function () {
      [['Some error message', 'Some error message'], ['', 'Error']].forEach(function (errSet) {
        var gelf = _.cloneDeep(gelfOriginal),
          err = new Error(errSet[0]);

        sinon.spy(gelf, 'getStringFromObject');
          gelf.info(err);
          gelf.info('Example', err);

          JSON.parse(gelf.getStringFromObject.firstCall.returnValue)
            .should.containEql({short_message: errSet[1]});
          JSON.parse(gelf.getStringFromObject.lastCall.returnValue)
            .should.have.properties(['_error_message', '_error_stack']);
      });
    },

    'Notify in case of a bogus usage': function () {
      var mock = sinon.mock(console),
        gelf = _.cloneDeep(gelfOriginal);
      mock.expects('warn').once().withExactArgs('Extra should be object-like or undefined');
      sinon.spy(gelf, 'getStringFromObject');
      gelf.info('Bogus call', 'example');
      mock.verify();
    },

    'Transform messages': function () {
      var gelf = _.cloneDeep(gelfOriginal),
        err = new Error('E!'),
        expected = {
          short_message: 'expected',
          level: 6,
          _world: 'hello',
          _error_message: err.message,
          _error_stack: err.stack
        },
        transform1 = function (extra) {
          return _.merge(
            extra,
            {short_message: expected.short_message, level: expected.level, world: expected._world}
          );
        },
        transform2 = function (extra) {
          if (_.isError(extra.error)) {
            extra.error = {message: extra.error.message, stack: extra.error.stack};
          }
          return extra;
        };

      sinon.spy(gelf, 'getStringFromObject');

      gelf.setConfig({transform: [transform1, transform2]});
      gelf.notice('original', {world: false, error: err});

      JSON.parse(gelf.getStringFromObject.lastCall.returnValue).should.containEql(expected);
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
        spySend.neverCalledWith().should.be.true();
        done();
      });
    },

    'Normalization of a long field': function () {
      var gelf = _.cloneDeep(gelfOriginal),
        msg = getLongMessage(140);

      msg.should.have.length(34545); // we need 32765 (32765 + 1 = 32766, which is max)

      sinon.spy(gelf, 'getStringFromObject');

      gelf.info('Test', {longField: msg});

      var field = JSON.parse(gelf.getStringFromObject.firstCall.returnValue)._longField;
      field.should.have.length(32765);
      field.should.endWith('...');
    }
  },

  'Adapter (abstract)': {
    'Exposed Functionality': function () {
      var abstract = Object.create(require(path.join(path.join(PATH_LIB, 'adapter', 'abstract'))));
      Object.keys(abstract).should.have.length(0);
      abstract.options.should.eql({});
      (function () { abstract.send('msg', _.noop); }).should.throw('Redefine me please');
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
        message = getLongMessage(100),
        sandbox = sinon.sandbox.create();

      sandbox.stub(adapter, 'getArrayFromBuffer').value(function () {
        return new Array(adapter.specification.chunkMaxLength.udp4);
      });

      gelf.send(message, function (err, result) {
        err.should.be.an.instanceof(Error);
        should.not.exist(result);
        sandbox.restore();
        done();
      });
    },

    'Socket exception in the first chunk': function (done) {
      var adapter = getAdapter('udp'),
        msg = getLongMessage(10000);
      adapter.setOptions({
        host: 'aUnresolvableAddressMaybeBecauseOfATypo.com',
        port: 1234,
        protocol: 'udp4'
      });

      var client = adapter._createSocket();
      sinon.stub(client, 'send').yields(new Error('Random fail'));
      sinon.stub(adapter, '_createSocket').returns(client);

      adapter.send(msg, function (err, bytesSent) {
        err.should.be.an.instanceof(Error);
        should.not.exist(bytesSent);
      });

      done();
    },

    'Socket exception': function (done) {
      var gelf = _.cloneDeep(gelfOriginal),
        msgError = 'example',
        dgramSocket = require('dgram').createSocket('udp4'),
        mock = sinon.mock(dgramSocket).expects('close').once();

      sinon.stub(dgramSocket, 'send').callsFake(function (msg, offset, length, port, address, cb) {
        msg.should.be.an.instanceof(Buffer);
        offset.should.equal(0);
        length.should.equal(24);
        port.should.equal(12201);
        address.should.equal('127.0.0.1');
        cb(new Error(msgError));
      });

      sinon.stub(gelf.getAdapter(), '_createSocket').returns(dgramSocket);

      gelf.send('test', function (err, result) {
        mock.verify();
        err.message.should.equal(msgError);
        should.not.exist(result);
        done();
      });
    }
  },

  'Adapter TCP': {
    beforeEach: function () {
      this.adapter = getAdapter('tcp');

      this.eventEmitter = new events.EventEmitter();
      this.eventEmitter.destroy = sinon.stub();
      this.eventEmitter.end = sinon.stub();
      this.eventEmitter.setTimeout = sinon.stub();

      sinon.stub(this.adapter, '_instance').returns(this.eventEmitter);
    },

    'Abstract functionality': function (done) {
      var adapter = getAdapter('tcp');
      adapter.setOptions({host: 'google.com', port: 5555, timeout: 1000});
      adapter.send('hello', function (err, result) {
        err.should.be.an.instanceof(Error);
        should.not.exist(result);
        done();
      });
    },

    'Valid message': function (done) {
      var self = this,
        options = {timeout: 123};

      this.eventEmitter.end.withArgs(new Buffer([0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x00])).callsArg(1);

      this.adapter.setOptions(options);
      this.adapter.send('hello', function (err, result) {
        should.not.exists(err);
        result.should.equal(6);
        self.eventEmitter.setTimeout
          .withArgs(options.timeout, sinon.match.func).calledOnce.should.be.true();
        done();
      });

      this.eventEmitter.emit('connect');
    },

    'Connection timeout': function (done) {
      this.eventEmitter.setTimeout.yieldsAsync();

      var self = this;
      this.adapter.setOptions({timeout: 1000});
      this.adapter.send('hello', function (err, results) {
        should.not.exists(results);
        self.eventEmitter.end.calledWithExactly().should.be.true();
        self.eventEmitter.destroy.calledOnce.should.be.true();
        err.should.be.instanceOf(Error).and.containEql({message: 'Timeout (1000 ms)'});
        done();
      });
    },

    'Connection error': function (done) {
      var self = this;
      this.adapter.send('hello', function (err, results) {
        should.not.exists(results);
        self.eventEmitter.end.calledWithExactly().should.be.true();
        self.eventEmitter.destroy.calledOnce.should.be.true();
        err.should.be.instanceOf(Error).and.containEql({message: 'err1'});
        done();
      });

      this.eventEmitter.emit('error', new Error('err1'));
    }
  },

  'Adapter TCP(TLS)': {
    'Abstract functionality': function () {
      var tls = require('tls'),
        adapter = getAdapter('tcp-tls');
      adapter._instance({host: 'google.com', port: 5555}).should.be.instanceOf(tls.TLSSocket);
    }
  }
};
