node-gelf pro
====================
node-gelf - Graylog2 client library for Node.js. Pro - because of code-quality. GELF - The Graylog Extended Log Format.

![Build Status](https://travis-ci.org/kkamkou/node-gelf-pro.svg?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/kkamkou/node-gelf-pro/badge.svg?branch=master)](https://coveralls.io/github/kkamkou/node-gelf-pro?branch=master)
[![Code Climate](https://codeclimate.com/github/kkamkou/node-gelf-pro/badges/gpa.svg)](https://codeclimate.com/github/kkamkou/node-gelf-pro)
[![Dependency Status](https://www.versioneye.com/user/projects/56eca2764fb9b0000e68bce1/badge.svg?style=flat)](https://www.versioneye.com/user/projects/56eca2764fb9b0000e68bce1)

## Installation
```
"dependencies": {
  "gelf-pro": "~1.1" // see the "releases" section
}
```
```npm install gelf-pro``` (**ALL** node.js versions are supported :)

## Initialization
```javascript
var log = require('gelf-pro');
```

### Configuration
```javascript
// simple
log.setConfig({host: 'my.glog-server.net'});

// advanced
log.setConfig({
  fields: {facility: "example", owner: "Tom (a cat)"}, // optional; default fields for all messages
  filter: [], // optional; filters to discard a message
  transform: [], // optional; transformers for a message
  broadcast: [], // optional; listeners of a message
  levels: {}, // optional; default: see the levels section below
  adapterName: 'udp', // optional; currently supported "udp", "tcp" and "tcp-tls"; default: udp
  adapterOptions: { // this object is passed to the adapter.connect() method
    // common
    host: '127.0.0.1', // optional; default: 127.0.0.1
    port: 12201, // optional; default: 12201
    // ... and so on, for  :
    
    // tcp adapter example
    family: 4, // tcp only; optional; version of IP stack; default: 4
    timeout: 1000, // tcp only; optional; default: 10000 (10 sec)
    
    // udp adapter example
    protocol: 'udp4', // udp only; optional; udp adapter: udp4, udp6; default: udp4
    
    // tcp-tls adapter example
    key: fs.readFileSync('client-key.pem'), // tcp-tls only; optional; only if using the client certificate authentication
    cert: fs.readFileSync('client-cert.pem'), // tcp-tls only; optional; only if using the client certificate authentication
    ca: [fs.readFileSync('server-cert.pem')] // tcp-tls only; optional; only for the self-signed certificate
  }
});
```

### Basic functionality
```javascript
var extra = {tom: 'cat', jerry: 'mouse', others: {spike: 1, tyke: 1}};

log.info("Hello world", extra, function (err, bytesSent) {});
log.info("Hello world", function (err, bytesSent) {});
log.info("Hello world", extra);
log.info("Hello world");

log.error('Oooops.', new Error('An error message'));
log.error(new Error('An error message'));

log.message(new Error('An error message'), 3); // same as previous
```

##### Extra
In case `extra` [is a plain object](https://lodash.com/docs#isPlainObject),
the library converts it to a readable format. Other values [are converted to string](https://lodash.com/docs#toString).
Acceptable format of a key is: `^[\w-]$`
```javascript
log.info(
  'a new msg goes here',
  {me: {fname: 'k', lname: 'k', bdate: new Date(2000, 01, 01)}}
);
// the extra becomes:
// {_me_fname: 'k', _me_lname: 'k', _me_bdate: 'Tue Feb 01 2000 00:00:00 GMT+0100 (CET)'}
```

##### Filtering
Sometimes we have to discard a message which is not suitable for the current environment. It is `NOT` possible to modify the data.
```javascript
log.setConfig({
  filter: [
    function (message) { // rejects a "debug" message
      return (message.level < 7);
    }
  ]
});
```

##### Transforming
`transforming` happens after `filtering`. It is possible to modify the data.

```javascript
log.setConfig({
  transform: [
    function (message) { // unwind an error
      if (_.isError(message.error)) {
        message.error = {message: message.error.message, stack: message.error.stack};
      }
      return message;
    }
  ]
});
```

##### Broadcasting
`broadcasting` happens after `transforming`. It is `NOT` possible to modify the data.

```javascript
log.setConfig({
  broadcast: [
    function (message) { // broadcasting to console
      console[message.level > 3 ? 'log' : 'error'](message.short_message, message);
    }
  ]
});
```

### Levels ([1](https://httpd.apache.org/docs/current/mod/core.html#loglevel), [2](https://logging.apache.org/log4j/2.0/log4j-api/apidocs/org/apache/logging/log4j/Level.html), [3](http://stackoverflow.com/questions/2031163/when-to-use-the-different-log-levels))
`emergency`, `alert`, `critical`, `error`, `warning` (`warn`), `notice`, `info`, `debug` (`log`)

### Adapters

- UDP (with deflation and chunking)
- TCP
- TCP via TLS(SSL)

### Tests
#### Cli
```bash
npm install
npm test
```

#### Docker
```bash
[sudo] docker build --no-cache -t node-gelf-pro .
[sudo] docker run -ti --rm -v "${PWD}:/opt/app" -w "/opt/app" node-gelf-pro
```

#### Contributors

- [corbinu](https://github.com/corbinu)
- [jucrouzet](https://github.com/jucrouzet)

## License
The MIT License (MIT)

Copyright (c) 2013-2017 Kanstantsin Kamkou
