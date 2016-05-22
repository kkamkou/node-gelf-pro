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
  "gelf-pro": "~0.8" // see the "releases" section
}
```
```npm install gelf-pro```

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
  broadcast: [], // optional; listeners of a message
  levels: {}, // optional; default: see the levels section below 
  adapterName: 'udp', // optional; currently supported "udp" and "tcp"; default: udp
  adapterOptions: {
    protocol: 'udp4', // udp only; optional; udp adapter: udp4, udp6; default: udp4
    family: 4, // tcp only; optional; version of IP stack; default: 4
    host: '127.0.0.1', // optional; default: 127.0.0.1
    port: 12201 // optional; default: 12201
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

log.message(new Error('An error message'), 3);
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
Sometimes we have to discard a message which is not suitable for the current environment.
```javascript
// it is not possible to modify the data.
log.setConfig({
  filter: [
    function (message) { // rejects a "debug" message
      return (message.level < 7);
    }
  ]
});
```

##### Broadcasting
It is not possible to modify the data. `broadcasting` happens after `filtering`.

```javascript
// it is not possible to modify the data.
log.setConfig({
  broadcast: [
    function (message) { // broadcasting to console
      console[message.level > 3 ? 'log' : 'error'](message.short_message, message);
    }
  ]
});
```

### Levels
`emergency`, `alert`, `critical`, `error`, `warning` (`warn`), `notice`, `info`, `debug` (`log`)

### Adapters

- UDP (with deflation and chunking)
- TCP

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

## License
The MIT License (MIT)

Copyright (c) 2013-2016 Kanstantsin Kamkou

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
