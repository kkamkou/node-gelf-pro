node-gelf
====================
The Graylog Extended Log Format

![Build Status](https://travis-ci.org/kkamkou/node-gelf-pro.svg?branch=master)

## Installation
```
"dependencies": {
  "gelf-pro": "0.1.0"
}
```
```npm install gelf-pro```

## Initialization
```javascript
var gelf = require('gelf-pro');
```

### Configuration
```javascript
var log = require('gelf-pro');
log.setConfig({
  adapterName: 'udp', // currently supported "udp" only
  adapterOptions: {
    protocol: 'udp4', // udp adapter: udp4, udp6
    host: '127.0.0.1',
    port: 12201
  }
});
```

### Basic functionality
```javascript
var extra = {tom: 'cat', jerry: 'mouse', others: {spike: 1, tyke: 1}};
log.info("Hello world", extra, function (err, bytesSent) {});
```

### Levels
```emergency```, ```alert```, ```critical```, ```error```, ```warning```, ```notice```, ```info```, ```debug```

### Adapters

- UDP

## License
The MIT License (MIT)

Copyright (c) 2013 Kanstantsin Kamkou

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
