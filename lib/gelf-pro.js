/**
 * Licensed under the MIT License
 *
 * @author   Kanstantsin A Kamkou (2ka.by)
 * @license  http://www.opensource.org/licenses/mit-license.php The MIT License
 * @link     https://github.com/kkamkou/node-gelf-pro
 */

'use strict';

var os = require('os'),
  _ = require('lodash');

// default configuration and the class itself
var gelf = Object.create(null, {
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
      levels: {
        emergency: 0,
        alert: 1,
        critical: 2,
        error: 3,
        warning: 4,
        notice: 5,
        info: 6,
        debug: 7
      },
      aliases: {
        log: 'debug',
        warn: 'warning'
      }
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
  this.config = _.merge({}, this.config, conf);
  return this;
};

/**
 * Creates and return adapter (singleton)
 * @returns {Object}
 */
gelf.getAdapter = function () {
  if (!this.adapter) {
    this.adapter = require('./adapter/' + this.config.adapterName);
    this.adapter.setOptions(this.config.adapterOptions);
  }
  return this.adapter;
};

/**
 * Converts an object to a string, adds custom fields
 * @param {Object} obj
 * @returns {String}
 */
gelf.getStringFromObject = function (obj) {
  var result = {
    version: '1.1',
    short_message: 'No message', // eslint-disable-line
    timestamp: _.round(Date.now() / 1000, 3),
    host: os.hostname()
  };

  // it is not possible to send the id field
  if (!_.isUndefined(obj.id)) {
    delete obj.id;
  }

  // some fields should be copied without change
  ['full_message', 'short_message', 'level', 'host', 'timestamp'].forEach(function (key) {
    if (!_.isUndefined(obj[key])) {
      result[key] = obj[key];
      delete obj[key];
    }
  });

  // recursion function for key-value aggregation
  // 32766 bytes is the maximum length for a field
  var recursion = function (input, prefix) {
    _.forOwn(input, function (value, key) {
      if ((/[^\w-]/).test(key)) {
        console.warn(key + ': the key format is not valid');
      }
      if (_.isPlainObject(value)) {
        return recursion(value, prefix ? [prefix, key].join('_') : key);
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
 * @param {String} message
 * @param {Function} cb
 * @returns {gelf}
 */
gelf.send = function (message, cb) {
  this.getAdapter().send(message, cb);
  return this;
};

/**
 * Sends a formatted message
 * @param {String} message
 * @param {Number} lvl
 * @param {Object|Function} extra
 * @param {Function} cb
 */
gelf.message = function (message, lvl, extra, cb) {
  // it is possible to skip the extra variable
  if (_.isFunction(extra) && !cb) {
    cb = extra;
    extra = {};
  }

  cb = cb || _.noop;

  // empty call, usually triggered by a thoughtless programmer
  if (_.isNil(message)) { return cb(null, 0); }

  // cleaning up a bogus call
  if (!_.isUndefined(extra) && !_.isObjectLike(extra)) {
    console.warn('[gelf-pro]', 'extra should be object-like or undefined');
    extra = {};
  }

  // trying to convert an error to readable message
  if (_.isError(message)) {
    /* istanbul ignore else */
    if (_.isEmpty(extra) && message.stack) {
      extra = {full_message: message.stack};
    }
    message = message.message.toString() || 'Error';
  }
  if (_.isError(extra)) {
    extra = {error: {message: extra.message, stack: extra.stack}};
  }

  extra = _.merge({short_message: message, level: lvl}, this.config.fields, extra || {});

  // filtering
  if (this.config.filter.length
    && !_.overEvery(this.config.filter)(_.cloneDeep(extra))) {
    return cb(null, 0);
  }

  // transforming
  if (this.config.transform.length) {
    _.invokeMap(this.config.transform, _.call, null, extra);
  }

  // broadcasting
  if (this.config.broadcast.length) {
    _.invokeMap(this.config.broadcast, _.call, null, _.cloneDeep(extra));
  }

  extra = this.getStringFromObject(extra);

  var self = this;
  process.nextTick(function () {
    self.send(extra, cb);
  });
};

// defining default functions like info(), error(), etc.
_.forEach(gelf.config.levels, function (idx, lvl) {
  this[lvl] = function (message, extra, cb) {
    this.message(message, idx, extra, cb);
  };
}.bind(gelf));

// aliases to be console alike
_.forEach(gelf.config.aliases, function (from, to) {
  this[to] = this[from];
}.bind(gelf));

module.exports = gelf;
