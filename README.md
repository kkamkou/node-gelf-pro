node-gelf pro
====================
The Graylog Extended Log Format. Pro - because of code-quality.

![Build Status](https://travis-ci.org/kkamkou/node-gelf-pro.svg?branch=master)

## Installation
```
"dependencies": {
  "gelf-pro": "~0.5"
}
```
```npm install gelf-pro```

## Initialization
```javascript
var log = require('gelf-pro');
```

### Configuration
```javascript
log.setConfig({
  fields: {facility: "example", owner: "Tom (a cat)"}, // default fields for all messages
  adapterName: 'udp', // currently supported "udp" and "tcp"
  adapterOptions: {
    protocol: 'udp4', // udp only. udp adapter: udp4, udp6
    family: 4, // tcp only, optional. Version of IP stack. Defaults to 4.
    host: '127.0.0.1',
    port: 12201
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

log.info('Oooops.', new Error('An error message'));
log.info(new Error('An error message'));
```

##### Filtering
Sometimes we have to discard a message which is not suitable for the current environment.
It is not possible to modify the data.
Internally it uses [every](https://github.com/caolan/async#every).
```javascript
log.setConfig({
  filter: [
    function (message, extra) { // rejects a "debug" message
      return (extra.level < 5);
    }
  ]
});
```

##### Broadcasting
The difference between `filtering` and `broadcasting` is that the last one gets a cloned object.
It is not possible to modify the data. `broadcasting` happens after `filtering`.

```javascript
log.setConfig({
  broadcast: [
    function (message) { // broadcasting to console
      console[message.level > 3 ? 'info' : 'log'](message.short_message, message);
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
