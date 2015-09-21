/**
 * Licensed under the MIT License
 *
 * @author   Kanstantsin A Kamkou (2ka.by)
 * @license  http://www.opensource.org/licenses/mit-license.php The MIT License
 * @link     https://github.com/kkamkou/node-gelf-pro
 */

'use strict';

// required stuff
var _ = require('lodash'),
  os = require('os');

// default configuration and the class itself
var gelf = Object.create(null, {
  specification: {
    enumerable: true,
    value: {
      version: '1.1',
      levels: ['emergency', 'alert', 'critical', 'error', 'warning', 'notice', 'info', 'debug']
    }
  },
  config: {
    enumerable: true,
    writable: true,
    value: {
      fields: {},
      adapterName: 'udp',
      adapterOptions: {
        protocol: 'udp4',
        host: '127.0.0.1',
        port: 12201
      }
    }
  }
});

// the adapter holder (opened on test purpose)
gelf.adapter = null;

/**
 * Updates the config object
 *
 * @param {Object} conf
 * @returns {gelf}
 */
gelf.setConfig = function (conf) {
  this.config = _.merge({}, this.config, conf);
  return this;
};

/**
 * Creates and return adapter
 *
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
 * Converts an object to string, adds custom fields
 *
 * @param {Object} message
 * @returns {String}
 */
gelf.getStringFromObject = function (obj) {
  var result = {
    version: this.specification.version,
    short_message: 'No message', // eslint-disable-line
    timestamp: Date.now() / 1000,
    host: os.hostname()
  };

  // it is not possible to send the id field
  if (!_.isUndefined(obj.id)) {
    delete obj.id;
  }

  // some fields should be copied without change
  ['full_message', 'short_message', 'level', 'host', 'timestamp']
    .forEach(function (key) {
      if (!_.isUndefined(obj[key])) {
        result[key] = obj[key];
        delete obj[key];
      }
    });

  // recursion function for key-value aggregation
  var recursion = function (input, prefix) {
    _.forOwn(input, function (value, key) {
      if (_.isObject(value)) {
        return recursion(value, key);
      }
      result[(prefix ? [null, prefix, key] : [null, key]).join('_')] = value;
    });
  };

  // gathering the first level
  recursion(obj);

  return JSON.stringify(result);
};

/**
 * Sends message
 *
 * @param {String} message
 * @param {Function} cb
 * @returns {gelf}
 */
gelf.send = function (message, cb) {
  this.getAdapter().send(message, cb);
  return this;
};

// defining default functions like info(), error(), etc.
gelf.specification.levels.forEach(function (lvl, idx) {
  var self = this;
  this[lvl] = function (message, extra, cb) {
    // it is possible to skip the extra variable
    if (_.isFunction(extra) && !cb) {
      cb = extra;
      extra = {};
    }

    // creating string from object
    extra = this.getStringFromObject(
      _.merge(
        {}, {short_message: message, level: idx}, // eslint-disable-line
        this.config.fields, extra || {}
      )
    );

    // runs before any other I/O events fire
    process.nextTick(function () {
      return self.send(extra, cb || _.noop);
    });
  };
}.bind(gelf));

// exporting functionality outside
module.exports = gelf;
