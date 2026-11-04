'use strict';

const PATH_LIB = ['..', 'lib'].join('/');

const dns = require('dns'),
  events = require('events'),
  path = require('path'),
  should = require('should'),
  sinon = require('sinon'),
  _ = require('lodash'),
  gelfOriginal = require(path.join(PATH_LIB, 'gelf-pro'));

// helper functions
const getLongMessage = function (len) {
  var i, message = '';
  for (i = 0; i <= (len || 10000); i++) {
    message += 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.' +
        ' Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an' +
        ' unknown printer took a galley of type and scrambled it to make a type specimen book.';
  }
  return message;
};

const getAdapter = function (name) {
  return Object.create(require(path.join('..', 'lib', 'adapter', name)))
    .setOptions(_.cloneDeep(gelfOriginal.config.adapterOptions));
};

module.exports = {
  'Core functionality': {
    'Set default adapter': function () {
      const gelf = _.cloneDeep(gelfOriginal),
        adapter = gelf.getAdapter(); // udp is a default one

      adapter.options.protocol.should.be.eql('udp4');
      adapter.send.should.be.a.Function();

      gelf.setAdapter({test: 1, send: sinon.spy()}).send('test');
      gelf.getAdapter().should.have.property('test', 1);
      gelf.getAdapter().send.calledWithExactly('test', _.noop).should.be.true();

      const gelf1 = _.cloneDeep(gelfOriginal),
        gelf2 = _.cloneDeep(gelfOriginal);

      gelf1.setConfig({adapterOptions: {host: 'my1.glog-server.net'}}).getAdapter();
      gelf2.setConfig({adapterOptions: {host: 'my2.glog-server.net'}}).getAdapter();
      gelf1.getAdapter().options.host.should.be.eql('my1.glog-server.net');
      gelf2.getAdapter().options.host.should.be.eql('my2.glog-server.net');

      gelf1.setConfig({adapterOptions: {host: 'my3.glog-server.net'}});
      gelf2.setConfig({adapterOptions: {host: 'my4.glog-server.net'}});
      gelf2.getAdapter().options.host.should.be.eql('my4.glog-server.net');
      gelf1.getAdapter().options.host.should.be.eql('my3.glog-server.net');
      should(gelf1.getAdapter()).not.be.equal(gelf2.getAdapter());
    },

    'Expose pre-defined levels': function () {
      const gelf = _.cloneDeep(gelfOriginal);
      const levels = {
        emergency: 0, alert: 1, critical: 2, error: 3,
        warning: 4, notice: 5, info: 6, debug: 7
      };

      sinon.spy(gelf, 'getStringFromObject');

      _.forEach(levels, function (lvl, fnc) {
        gelf[fnc]('test');
        JSON.parse(gelf.getStringFromObject.lastCall.returnValue).level.should.equal(lvl);
      });
    },

    'Modify aliases': function () {
      const gelf = _.cloneDeep(gelfOriginal);
      const verifyAliasExists = function (obj) {
        _.forEach(obj, function (lvl, fnc) {
          gelf[fnc]('test');
          JSON.parse(gelf.getStringFromObject.lastCall.returnValue).level.should.equal(lvl);
        });
      };

      sinon.spy(gelf, 'getStringFromObject');

      verifyAliasExists({log: 7, warn: 4});

      const aliases = {
        waaagh: 'emergency', oopsie: 'alert', send: 'dEBug', message: 'warning',
        setConfig: 'info', bogus: 'unknown'
      };
      gelf.setConfig({aliases: aliases});
      gelf.config.aliases.should.be.eql(aliases);
      should.not.exist(gelf.log);
      should.not.exist(gelf.warn);
      should.not.exist(gelf.bogus);

      verifyAliasExists({waaagh: 0, oopsie: 1});

      gelf.bindAliases({red: 'critical'}, ['waaagh', 'send', 'setConfig']);
      should.not.exist(gelf.waaagh);
      gelf.send.should.be.a.Function();
      gelf.setConfig.should.be.a.Function();

      verifyAliasExists({red: 2, oopsie: 1});
    },

    'Manually set level': function () {
      const gelf = _.cloneDeep(gelfOriginal),
        mock = sinon.mock(gelf);

      mock.expects('getStringFromObject').once()
        .withArgs({example: 1, level: 16, short_message: 'Test message'});

      gelf.setConfig({fields: {example: 1}}).message('Test message', 16);

      mock.verify();
    },

    'Set pre-defined fields': function () {
      const gelf = _.cloneDeep(gelfOriginal),
        mock = sinon.mock(gelf);

      mock.expects('getStringFromObject').once()
        .withArgs({example: 1, level: 6, short_message: 'Test message'});

      gelf.setConfig({fields: {example: 1}}).info('Test message');

      mock.verify();
    },

    'Validate fields': function () {
      const gelf = _.cloneDeep(gelfOriginal),
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
      const result = JSON.parse(gelf.getStringFromObject.lastCall.returnValue);
      result.should.have.properties(args);
      result.should.not.have.property('id');
      JSON.parse(gelf.getStringFromObject({id: undefined, level: undefined}))
        .should.not.have.any.keys('id', '_id', 'level', '_level');
    },

    'Validate timestamp': function () {
      const gelf = _.cloneDeep(gelfOriginal);
      sinon.spy(gelf, 'getStringFromObject');
      gelf.info('Test message');
      ("" + JSON.parse(gelf.getStringFromObject.lastCall.returnValue).timestamp)
        .should.match(/^\d{10}\.\d{1,3}$/);
    },

    'Normalize extra fields': function () {
      const mock = sinon.mock(console);
      mock.expects('warn').once().withExactArgs('the.first.value: the key format is not valid');
      mock.expects('warn').once().withExactArgs('the second value: the key format is not valid');

      const gelf = _.cloneDeep(gelfOriginal),
        extra = {
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
        };
      extra.self = extra;
      extra.level1.parent = extra.level1;
      var result = gelf.getStringFromObject(extra);

      mock.verify();

      result = JSON.parse(result);
      result.should.have.property('_value0').equal('value0');
      result.should.have.property('_level1_value1').equal('value1');
      result.should.have.property('_level1_key-with-dash').equal(1);
      result.should.have.property('_level1_level2_value2').equal('value2');
      result.should.have.property('_level1_level2_level3_value3').equal('value3');
      result.should.not.have.property('_self');
      result.should.not.have.property('_level1_parent');
    },

    'Avoid an empty message': function (done) {
      const gelf = _.cloneDeep(gelfOriginal);
      sinon.spy(gelf, 'send');
      gelf.message();
      process.nextTick(function () {
        gelf.send.calledOnce.should.be.false();
        done();
      });
    },

    'Avoid a message with null': function (done) {
      const gelf = _.cloneDeep(gelfOriginal);
      sinon.spy(gelf, 'send');
      gelf.message(null, 2, function () {
        gelf.send.calledOnce.should.be.false();
        done();
      });
    },

    'Work with dates': function () {
      const gelf = _.cloneDeep(gelfOriginal),
        date = new Date();
      JSON.parse(gelf.getStringFromObject({test: date}))._test.should.equal(date.toString());
    },

    'Work with numeric type': function () {
      const gelf = _.cloneDeep(gelfOriginal),
        fields = {aFloat: 1.1, anInteger: 0, aString: '0'},
        json = JSON.parse(gelf.getStringFromObject(fields));
      Number.isFinite(json._aFloat).should.equal(true);
      Number.isFinite(json._anInteger).should.equal(true);
      Number.isFinite(json._aString).should.equal(false);
    },

    'Transform an Error object': function () {
      [['Some error message', 'Some error message'], ['', 'Error']].forEach(function (errSet) {
        const gelf = _.cloneDeep(gelfOriginal),
          err = new Error(errSet[0]);

        sinon.spy(gelf, 'getStringFromObject');
          gelf.info(err);
          gelf.info('Example', err);
          gelf.info(err, {extraField: 1});

          JSON.parse(gelf.getStringFromObject.firstCall.returnValue)
            .should.containEql({short_message: errSet[1], full_message: err.stack});
          JSON.parse(gelf.getStringFromObject.secondCall.returnValue)
            .should.have.properties(['_error_message', '_error_stack']);
          JSON.parse(gelf.getStringFromObject.lastCall.returnValue)
            .should.containEql({short_message: errSet[1], full_message: err.stack, _extraField: 1});

          delete err.stack;
          gelf.info(err);
          JSON.parse(gelf.getStringFromObject.lastCall.returnValue)
            .should.not.have.property('full_message');
      });
    },

    'Notify in case of a bogus usage': function () {
      const mock = sinon.mock(console),
        gelf = _.cloneDeep(gelfOriginal);
      mock.expects('warn').once()
        .withExactArgs('[gelf-pro]', 'extra should be object-like or undefined');
      sinon.spy(gelf, 'getStringFromObject');
      gelf.info('Bogus call', 'example');
      mock.verify();
    },

    'Transform messages': function () {
      const gelf = _.cloneDeep(gelfOriginal),
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
      const expected = [{short_message: 'test', level: 6, world: true}],
        stub1 = sinon.stub(),
        stub2 = sinon.stub(),
        gelf = _.cloneDeep(gelfOriginal);

      gelf.setConfig({broadcast: [stub1, stub2]});
      gelf.info('test', {world: true});

      stub1.lastCall.args.should.eql(expected);
      stub2.lastCall.args.should.eql(expected);
    },

    'Filter messages': function (done) {
      const gelf = _.cloneDeep(gelfOriginal),
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
      const gelf = _.cloneDeep(gelfOriginal),
        msg = getLongMessage(140);

      msg.should.have.length(34545); // we need 32765 (32765 + 1 = 32766, which is max)

      sinon.spy(gelf, 'getStringFromObject');

      gelf.info('Test', {longField: msg});

      const field = JSON.parse(gelf.getStringFromObject.firstCall.returnValue)._longField;
      field.should.have.length(32765);
      field.should.endWith('...');
    },

    'Send messages in bulk': function (done) {
      const gelf = _.cloneDeep(gelfOriginal),
        broadcastSpy = sinon.spy(),
        sendStub = sinon.stub(gelf, 'send').yields(null, 123);

      gelf.setConfig({
        fields: {app: 'test'},
        filter: [function (msg) { return msg.level < 7; }],
        transform: [function (msg) { msg.transformed = true; }],
        broadcast: [broadcastSpy]
      });

      const result = gelf.bulk([
        null,
        {},
        {short_message: 'filtered debug', level: 7},
        {short_message: 'obj short', level: 4, extraKey: 'v1'},
        {short_message: '', message: 'obj msg', level: 'error'},
        {level: '5', onlyExtra: 'yes'},
        '{"short_message":"json string","level":5}',
        '{invalid json',
        Buffer.from('plain buffer'),
        new Error('bulk error'),
        12345,
        new Date('2020-01-01T00:00:00Z')
      ], function (err, bytes) {
        should.not.exist(err);
        bytes.should.equal(123);
        broadcastSpy.callCount.should.equal(9);
        sendStub.calledOnce.should.be.true();
        const batch = sendStub.firstCall.args[0];
        batch.should.be.an.Array().and.have.length(9);
        JSON.parse(batch[0]).should.containEql({
          short_message: 'obj short', level: 4, _extraKey: 'v1', _app: 'test', _transformed: 'true'
        });
        JSON.parse(batch[1]).should.containEql({short_message: 'obj msg', level: 3});
        JSON.parse(batch[2]).should.containEql({
          short_message: 'No message', level: 5, _onlyExtra: 'yes'
        });
        JSON.parse(batch[3]).should.containEql({short_message: 'json string', level: 5});
        JSON.parse(batch[4]).should.containEql({short_message: '{invalid json', level: 6});
        JSON.parse(batch[5]).should.containEql({short_message: 'plain buffer', level: 6});
        JSON.parse(batch[6]).should.containEql({short_message: 'bulk error', level: 6});
        JSON.parse(batch[7]).should.containEql({short_message: '12345', level: 6});
        JSON.parse(batch[8]).should.containEql({
          short_message: '2020-01-01T00:00:00.000Z', level: 6
        });
        done();
      });
      result.should.equal(gelf);
    },

    'Avoid an empty bulk call': function (done) {
      const gelf = _.cloneDeep(gelfOriginal),
        sendSpy = sinon.spy(gelf, 'send');
      var isAsync = false;

      gelf.bulk([]);
      gelf.bulk([null, undefined, {}], function (err, bytes) {
        isAsync.should.be.true();
        should.not.exist(err);
        bytes.should.equal(0);
        sendSpy.called.should.be.false();
        done();
      }).should.equal(gelf);
      isAsync = true;
    },

    'Pipe a JSON stream through stream()': function (done) {
      const gelf = _.cloneDeep(gelfOriginal),
        readable = require('stream').Readable.from([
          '{"short_message":"msg1","level":6}',
          {short_message: 'msg2', level: 4},
          {message: 'msg3', level: 'error'}
        ]);
      var sent = [];

      sinon.stub(gelf, 'send').callsFake(function (payload, cb) {
        sent = sent.concat(payload);
        cb(null, 10);
      });

      readable.pipe(gelf.stream()).on('finish', function () {
        sent.should.have.length(3);
        JSON.parse(sent[0]).should.containEql({short_message: 'msg1', level: 6});
        JSON.parse(sent[1]).should.containEql({short_message: 'msg2', level: 4});
        JSON.parse(sent[2]).should.containEql({short_message: 'msg3', level: 3});
        done();
      });
    }
  },

  'Adapter (abstract)': {
    'Exposed Functionality': function () {
      const abstract = Object.create(require(path.join(path.join(PATH_LIB, 'adapter', 'abstract'))));
      Object.keys(abstract).should.have.length(0);
      abstract.options.should.eql({});
      (function () { abstract.send('msg', _.noop); }).should.throw('Redefine me please');
    }
  },

  'Adapter UDP': {
    'Send in chunks': function (done) {
      const adapter = getAdapter('udp'),
        message = getLongMessage(15000),
        sandbox = sinon.sandbox.create();

      adapter.send(message, function (err, bytesSent) {
        should.not.exist(err);
        bytesSent.should.be.above(14500);
        sandbox.restore();
        done();
      });
    },

    'Send multiple messages in bulk': function (done) {
      const adapter = getAdapter('udp'),
        sandbox = sinon.sandbox.create();

      sandbox.spy(adapter, '_createSocket');

      adapter.send(['first message', 'second message', ''], function (err, bytesSent) {
        should.not.exist(err);
        bytesSent.should.be.above(50);
        adapter._createSocket.calledOnce.should.be.true();
        sandbox.restore();
        done();
      });
    },

    'Avoid sending an empty array in UDP': function (done) {
      const adapter = getAdapter('udp'),
        sandbox = sinon.sandbox.create();
      var isAsync = false;

      sandbox.spy(adapter, '_createSocket');

      adapter.send([], function (err, bytesSent) {
        isAsync.should.be.true();
        should.not.exist(err);
        bytesSent.should.equal(0);
        adapter._createSocket.called.should.be.false();
        sandbox.restore();
        done();
      });
      isAsync = true;
    },

    'Compression validation': function (done) {
      const adapter = getAdapter('udp');
      adapter.deflate('test', function (err, buf) {
        should.not.exist(err);
        buf.should.be.an.instanceof(Buffer);
        sinon.stub(adapter, 'deflate').yields(new Error('Deflate error'));
        adapter.send('test', function (sendErr, bytesSent) {
          sendErr.should.be.an.instanceof(Error).and.have.property('message', 'Deflate error');
          bytesSent.should.equal(0);
          done();
        });
      });
    },

    'Chunks split validation': function () {
      const adapter = getAdapter('udp'),
        msgOriginal = getLongMessage(100),
        message = Buffer.from(msgOriginal),
        result = adapter.getArrayFromBuffer(message, 100);
      var msgTmp = '';

      result.should.have.length(248);
      result.forEach(function (chunk) {
        msgTmp += (Buffer.from(chunk)).toString();
      });

      msgOriginal.should.be.exactly(msgTmp);
      adapter.getArrayFromBuffer(Buffer.alloc(200), 100).should.have.length(2);
    },

    'Chunks limitation validation': function (done) {
      const gelf = _.cloneDeep(gelfOriginal),
        message = getLongMessage(300000),
        sandbox = sinon.sandbox.create();

      sandbox.stub(gelf.getAdapter(), 'deflate').yields(null, Buffer.alloc(200000));
      gelf.getAdapter().send('test');
      sandbox.restore();
      sandbox.spy(gelf.getAdapter(), '_createSocket');

      gelf.send(message, function (err, bytesSent) {
        err.should.be.an.instanceof(Error);
        err.message.should.equal('A message MUST NOT consist of more than 128 chunks');
        bytesSent.should.equal(0);
        gelf.getAdapter()._createSocket.called.should.be.false();
        sandbox.restore();
        done();
      });
    },

    'Socket exception in the first chunk': function (done) {
      const adapter = getAdapter('udp'),
        msg = getLongMessage(10000),
        sandbox = sinon.sandbox.create();

      adapter.setOptions({
        host: 'aUnresolvableAddressMaybeBecauseOfATypo.com',
        port: 1234,
        protocol: 'udp4'
      });

      const client = adapter._createSocket();
      sandbox.stub(client, 'send').yields(new Error('Random fail'));
      sandbox.stub(adapter, '_createSocket').returns(client);

      adapter.send(msg, function (err, bytesSent) {
        err.should.be.an.instanceof(Error);
        err.message.should.equal('Random fail');
        bytesSent.should.equal(0);
        sandbox.restore();
        done();
      });
    },

    'Socket exception in the middle': function (done) {
      const adapter = getAdapter('udp'),
        msg = getLongMessage(10000),
        sandbox = sinon.sandbox.create();

      const client = adapter._createSocket();

      sandbox.stub(adapter, '_createSocket').returns(client);
      sandbox.stub(client, 'send')
        .onFirstCall().yields(null, 100)
        .onThirdCall().yields(null, 300)
        .onSecondCall().callsFake(function () {
          client.emit('error', new Error('Unable to send the chunk'));
        });

      adapter.send(msg, function (err, bytesSent) {
        err.should.be.an.instanceof(Error);
        err.message.should.equal('Unable to send the chunk');
        bytesSent.should.equal(100);
        sandbox.restore();
        done();
      });
    },

    'DNS exception': function (done) {
      const adapter = getAdapter('udp'),
        msg = getLongMessage(10000),
        sandbox = sinon.sandbox.create();

      adapter.setOptions({
        host: 'aUnresolvableAddressMaybeBecauseOfATypo.com',
        port: 1234,
        protocol: 'udp4'
      });

      sandbox.stub(dns, 'lookup').yields(new Error('DNS lookup exception'));

      adapter.send(msg, function (err, bytesSent) {
        err.should.be.an.instanceof(Error);
        err.message.should.equal('DNS lookup exception');
        bytesSent.should.equal(0);
        sandbox.restore();
        done();
      });
    },

    'Socket exception': function (done) {
      const gelf = _.cloneDeep(gelfOriginal),
        msgError = 'example',
        dgramSocket = require('dgram').createSocket('udp4'),
        mock = sinon.mock(dgramSocket).expects('close').once();

      const stub = sinon.stub(dgramSocket, 'send').callsFake(function (msg, offset, length, port, address, cb) {
        msg.should.be.an.instanceof(Buffer);
        offset.should.equal(0);
        length.should.equal(24);
        port.should.equal(12201);
        address.should.equal('127.0.0.1');
        cb(new Error(msgError), 0);
      });

      sinon.stub(gelf.getAdapter(), '_createSocket').returns(dgramSocket);

      gelf.send('test', function (err, bytesSent) {
        mock.verify();
        err.message.should.equal(msgError);
        bytesSent.should.equal(0);
        stub.restore();
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
      const adapter = getAdapter('tcp');
      adapter.setOptions({host: 'localhost', port: 5555, timeout: 1000});
      adapter.send('hello', function (err, result) {
        err.should.be.an.instanceof(Error);
        should.not.exist(result);
        done();
      });
    },

    'Valid message': function (done) {
      const self = this,
        options = {timeout: 123};

      this.eventEmitter.end.withArgs(Buffer.from([0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x00])).callsArg(1);

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

    'Send multiple messages in bulk': function (done) {
      const expected = Buffer.from([
        0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x00,
        0x77, 0x6f, 0x72, 0x6c, 0x64, 0x00,
        0x00
      ]);
      this.eventEmitter.end.withArgs(expected).callsArg(1);
      this.adapter.send(['hello', Buffer.from('wo\x00rld'), ''], function (err, result) {
        should.not.exists(err);
        result.should.equal(13);
        done();
      });
      this.eventEmitter.emit('connect');
    },

    'Avoid sending an empty array in TCP': function (done) {
      const self = this;
      var isAsync = false;
      this.adapter.send([], function (err, result) {
        isAsync.should.be.true();
        should.not.exists(err);
        result.should.equal(0);
        self.adapter._instance.called.should.be.false();
        done();
      });
      isAsync = true;
    },

    'Remove null byte': function (done) {
      this.eventEmitter.end.withArgs(Buffer.from([0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x00])).callsArg(1);
      this.adapter.send("\x00he\x00llo\x00", function (err, result) {
        should.not.exists(err);
        result.should.equal(6);
        done();
      });
      this.eventEmitter.emit('connect');
    },

    'Connection timeout': function (done) {
      this.eventEmitter.setTimeout.yieldsAsync();

      const self = this;
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
      const self = this;
      this.adapter.send('hello', function (err, results) {
        should.not.exists(results);
        self.eventEmitter.emit('error', new Error('err2'));
        self.eventEmitter.end.calledWithExactly().should.be.true();
        self.eventEmitter.destroy.calledTwice.should.be.true();
        err.should.be.instanceOf(Error).and.containEql({message: 'err1'});
        self.adapter.send('hello');
        done();
      });

      this.eventEmitter.emit('error', new Error('err1'));
    }
  },

  'Adapter TCP(TLS)': {
    'Abstract functionality': function () {
      const tls = require('tls'),
        adapter = getAdapter('tcp-tls');
      adapter._instance({host: 'google.com', port: 5555}).should.be.instanceOf(tls.TLSSocket);
    }
  }
};
