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
      adapterName: 'udp',
      adapterOptions: {
        protocol: 'udp4',
        host: '127.0.0.1',
        port: 12201
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
 * @param {Object} message
 * @returns {String}
 */
gelf.getStringFromObject = function (obj) {
  var result = {
    version: '1.1',
    short_message: 'No message', // eslint-disable-line
    timestamp: Date.now() / 1000,
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
  var recursion = function (input, prefix) {
    _.forOwn(input, function (value, key) {
      if ((/[^\w]/).test(key)) {
        console.warn(key + ': the key format is not valid');
      }
      if (_.isPlainObject(value)) {
        return recursion(value, prefix ? [prefix, key].join('_') : key);
      }
      result[(prefix ? [null, prefix, key] : [null, key]).join('_')] = _.toString(value);
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

// defining default functions like info(), error(), etc.
['emergency', 'alert', 'critical', 'error', 'warning', 'notice', 'info', 'debug'].forEach(
  function (lvl, idx) {
    var self = this;
    this[lvl] = function (message, extra, cb) {
      // it is possible to skip the extra variable
      if (_.isFunction(extra) && !cb) {
        cb = extra;
        extra = {};
      }

      cb = cb || _.noop;

      // trying to convert an error to readable message
      if (_.isError(message)) {
        message = message.message.toString() || 'Error';
      }
      if (_.isError(extra)) {
        extra = {error: {message: extra.message, stack: extra.stack}};
      }

      // eslint-disable-next-line
      extra = _.merge({}, {short_message: message, level: idx}, this.config.fields, extra || {});

      // filtering
      if (this.config.filter.length
        && !_.overEvery(this.config.filter)(_.cloneDeep(extra))) {
        return cb(null, 0);
      }

      // broadcasting
      if (this.config.broadcast.length) {
        _.invokeMap(this.config.broadcast, _.call, null, _.cloneDeep(extra));
      }

      extra = this.getStringFromObject(extra);

      process.nextTick(function () {
        self.send(extra, cb);
      });
    };
  }.bind(gelf)
);

// aliases to be console alike
_.forEach({log: 'debug', warn: 'warning'}, function (from, to) {
  this[to] = this[from];
}.bind(gelf));

module.exports = gelf;
