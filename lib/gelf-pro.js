/**
 * Licensed under the MIT License
 *
 * @author   Kanstantsin A Kamkou (2ka.by), Alexander Günther
 * @license  http://www.opensource.org/licenses/mit-license.php The MIT License
 * @link     https://github.com/kkamkou/node-gelf-pro
 */

// required stuff
var _ = require('lodash');

// default configuration and the class itself
var gelf = Object.create(null, {
  specification: {
    value: {
      version: '1.1',
      levels: ['emergency', 'alert', 'critical', 'error', 'warning', 'notice', 'info', 'debug']
    }
  },
  config: {
    writable: true,
    value: {
      adapterName: 'udp',
      adapterOptions: {
        protocol: 'udp4',
        host: '10.23.46.6',
        port: 12201
      }
    }
  }
});

// the adapter holder
var adapter = null;

/**
 * Generates a random number
 *
 * @returns {Number}
 */
gelf.getUniqueId = function () {
  var str = '';
  for (var i = 0, r; i < 6; i++) {
    if ((i & 0x03) === 0) {
      r = Math.random() * 0x100000000;
    }
    str += r >>> ((i & 0x03) << 3) & 0xff;
  }
  return str.substr(0, 8);
};

gelf.getClient = function () {
  if (!adapter) {
    adapter = require('./adapter/' + this.config.adapterName);
    adapter.setOptions(gelf.config.adapterOptions);
  }
  return adapter;
};

gelf.send = function (message, extra, cb) {
  this.getClient().send(message, extra, cb);
  return this;
};

// defining default functions like info(), error(), etc.
gelf.specification.levels.forEach(function (lvl) {
  gelf[lvl] = function (message, extra, cb) {
    //process.nextTick(function () {
      gelf.send(message, extra, cb);
    //});
  };
});

// exporting functionality outside
module.exports = gelf;
