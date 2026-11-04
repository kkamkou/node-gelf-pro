/**
 * Licensed under the MIT License
 *
 * @author   Kanstantsin A Kamkou (2ka.by)
 * @license  http://www.opensource.org/licenses/mit-license.php The MIT License
 * @link     https://github.com/kkamkou/node-gelf-pro
 */

'use strict';

const os = require('os'),
  stream = require('stream'),
  _ = require('lodash');

// default configuration and the class itself
const gelf = Object.create(null, {
  config: {
    enumerable: true,
    writable: true,
    value: {
      fields: {},
      filter: [],
      broadcast: [],
      transform: [],
      adapterName: 'udp',
      adapterOptions: {
        protocol: 'udp4',
        host: '127.0.0.1',
        port: 12201
      },
      aliases: {
        log: 'debug',
        warn: 'warning'
      }
    }
  },
  levels: {
    enumerable: true,
    value: {
      emergency: 0,
      alert: 1,
      critical: 2,
      error: 3,
      warning: 4,
      notice: 5,
      info: 6,
      debug: 7
    }
  },
  adapter: {
    writable: true // the adapter holder (opened on test purpose)
  }
});

/**
 * Updates the config object
 * @param {Object} conf
 * @returns {gelf}
 */
gelf.setConfig = function (conf) {
  if (conf.aliases) {
    this.bindAliases(conf.aliases, _.keys(this.config.aliases));
    delete this.config.aliases;
  }
  this.config = _.merge({}, this.config, conf);
  this.adapter = null;
  return this;
};

/**
 * Creates and return adapter (singleton)
 * @returns {Object}
 */
gelf.getAdapter = function () {
  if (!this.adapter) {
    this.adapter = Object.create(require('./adapter/' + this.config.adapterName));
    this.adapter.setOptions(this.config.adapterOptions);
  }
  return this.adapter;
};

/**
 * Force using custom adapter
 * @param {Object} adapter
 * @returns {gelf}
 */
gelf.setAdapter = function (adapter) {
  this.adapter = adapter;
  return this;
};

/**
 * Converts an object to a string, adds custom fields
 * @param {Object} obj
 * @returns {String}
 */
gelf.getStringFromObject = function (obj) {
  const result = {
    version: '1.1',
    short_message: 'No message', // eslint-disable-line
    timestamp: _.round(Date.now() / 1000, 3),
    host: os.hostname()
  };

  // it is not possible to send the id field
  delete obj.id;

  // some fields should be copied without change
  ['full_message', 'short_message', 'level', 'host', 'timestamp'].forEach(function (key) {
    if (!_.isUndefined(obj[key])) {
      result[key] = obj[key];
    }
    delete obj[key];
  });

  // recursion function for key-value aggregation
  // 32766 bytes is the maximum length for a field
  const recursion = function (input, prefix, seen) {
    seen = (seen || []).concat(input);
    _.forOwn(input, function (value, key) {
      if ((/[^\w-]/).test(key)) {
        console.warn(key + ': the key format is not valid');
      }
      if (_.isPlainObject(value)) {
        return _.includes(seen, value)
          ? null
          : recursion(value, prefix ? [prefix, key].join('_') : key, seen);
      }
      result[(prefix ? [null, prefix, key] : [null, key]).join('_')] =
        _.isFinite(value) ? value : _.truncate(_.toString(value), {length: 32765}); // 32765 + 1
    });
  };

  recursion(obj);

  return JSON.stringify(result);
};

/**
 * Sends a message
 * @param {String|Array} message
 * @param {Function} cb
 * @returns {gelf}
 */
gelf.send = function (message, cb) {
  this.getAdapter().send(message, cb || _.noop);
  return this;
};

/**
 * Formats, filters, transforms, broadcasts, and serializes a message
 * @param {*} message
 * @param {Number} lvl
 * @param {Object} [extra]
 * @returns {String|null}
 * @private
 */
gelf._prepare = function (message, lvl, extra) {
  // empty call, usually triggered by a thoughtless programmer
  if (_.isNil(message)) { return null; }

  // cleaning up a bogus call
  if (!_.isUndefined(extra) && !_.isObjectLike(extra)) {
    console.warn('[gelf-pro]', 'extra should be object-like or undefined');
    extra = {};
  }

  // trying to convert an error to readable message
  if (_.isError(message)) {
    if (message.stack) {
      extra = _.merge({full_message: message.stack}, extra);
    }
    message = message.message.toString() || 'Error';
  }
  if (_.isError(extra)) {
    extra = {error: {message: extra.message, stack: extra.stack}};
  }

  extra = _.merge(
    {short_message: _.isDate(message) ? message.toISOString() : _.toString(message), level: lvl},
    this.config.fields,
    extra || {}
  );

  // filtering
  if (this.config.filter.length
    && !_.overEvery(this.config.filter)(_.cloneDeep(extra))) {
    return null;
  }

  // transforming
  if (this.config.transform.length) {
    _.invokeMap(this.config.transform, _.call, null, extra);
  }

  // broadcasting
  if (this.config.broadcast.length) {
    _.invokeMap(this.config.broadcast, _.call, null, _.cloneDeep(extra));
  }

  return this.getStringFromObject(extra);
};

/**
 * Sends a formatted message
 * @param {String} message
 * @param {Number} lvl
 * @param {Object|Function} extra
 * @param {Function} cb
 * @returns {gelf}
 */
gelf.message = function (message, lvl, extra, cb) {
  // it is possible to skip the extra variable
  if (_.isFunction(extra) && !cb) {
    cb = extra;
    extra = {};
  }

  cb = cb || _.noop;

  const payload = this._prepare(message, lvl, extra),
    self = this;
  process.nextTick(function () {
    if (_.isNull(payload)) { return cb(null, 0); }
    self.send(payload, cb);
  });
  return this;
};

/**
 * Sends an array of messages in a single batch
 * @param {Array} messages
 * @param {Function} [cb]
 * @returns {gelf}
 */
gelf.bulk = function (messages, cb) {
  const self = this;
  cb = cb || _.noop;

  const payloads = _.compact(_.map(_.castArray(messages), function (item) {
    if (Buffer.isBuffer(item)) {
      item = item.toString();
    }
    if (_.isString(item) && _.startsWith(_.trim(item), '{')) {
      const parsed = _.attempt(JSON.parse, item);
      if (_.isPlainObject(parsed)) { item = parsed; }
    }
    if (_.isPlainObject(item)) {
      if (_.isEmpty(item)) { return null; }
      const extra = _.omit(item, ['short_message', 'message', 'level']),
        numLvl = _.parseInt(item.level),
        lvl = _.isFinite(numLvl) ? numLvl : _.get(self.levels, item.level, self.levels.info),
        msg = _.defaultTo(_.find([item.short_message, item.message], function (v) {
          return !_.isNil(v) && v !== '';
        }), 'No message');
      return self._prepare(msg, lvl, extra);
    }
    return self._prepare(item, self.levels.info);
  }));

  process.nextTick(function () {
    if (!payloads.length) { return cb(null, 0); }
    self.send(payloads, cb);
  });
  return this;
};

/**
 * Creates a Writable stream for piping log messages in bulk
 * @param {Object} [options]
 * @returns {stream.Writable}
 */
gelf.stream = function (options) {
  const self = this;
  return new stream.Writable(_.merge({
    objectMode: true,
    write: function (chunk, encoding, cb) {
      self.bulk([chunk], cb);
    },
    writev: function (chunks, cb) {
      self.bulk(_.map(chunks, 'chunk'), cb);
    }
  }, options));
};

/**
 * Defines custom aliases for log levels
 * @param {Object} aliasMapping
 * @param {Array} [aliasesToRemove]
 * @returns {gelf}
 */
gelf.bindAliases = function (aliasMapping, aliasesToRemove) {
  const self = this,
    blacklist = _(self.levels).keys().concat([
    '_prepare', 'adapter', 'bindaliases', 'bulk', 'config', 'getadapter',
    'getstringfromobject', 'levels', 'message', 'send', 'setadapter', 'setconfig', 'stream'
  ]).value();

  _(aliasesToRemove).filter(function (alias) {
    return !_.includes(blacklist, _.toLower(alias));
  }).forEach(function (alias) {
    self[alias] && delete self[alias];
  });
  _(aliasMapping).toPairs().filter(function (p) {
    return !_.includes(blacklist, _.toLower(p[0])) && _.has(self.levels, p[1]);
  }).forEach(function (p) {
    Object.defineProperty(
      self, p[0], {configurable: true, enumerable: true, writable: true, value: self[p[1]]}
    );
  });
  return this;
};

// defining default functions like info(), error(), etc.
_.forEach(gelf.levels, function (idx, lvl) {
  this[lvl] = function (message, extra, cb) {
    return this.message(message, idx, extra, cb);
  };
}.bind(gelf));

module.exports = gelf.bindAliases(gelf.config.aliases);
