`gelf-pro`
=============
[Graylog2](https://github.com/Graylog2/graylog2-server) client library for Node.js. Sends logs to Graylog2 server in GELF (Graylog Extended Log Format) format.

**Features:**
- JS object marshalling.
- UDP/TCP/TLS support.
- Bulk messaging and Node.js Stream piping.
- Filtering, Transforming, Broadcasting.
- Custom aliases.

![Build Status](https://github.com/kkamkou/node-gelf-pro/actions/workflows/node.js.yml/badge.svg?branch=master)
![Coverage Status](https://coveralls.io/repos/github/kkamkou/node-gelf-pro/badge.svg?branch=master)

[Installation](#installation) | [Initialization](#initialization) | [Adapters](#adapters) | [Configuration](#configuration) | [Basic functionality](#basic-functionality) | [Bulk messaging](#bulk-messaging) | [Stream piping](#stream-piping) | [Levels](#levels-1-2-3) | [Aliases](#aliases) | [Third-party adapters](#third-party-adapters) | [Tests](#tests) | [Contributors](#contributors) | [License](#license)

## Installation
```json
"dependencies": {
  "gelf-pro": "~1.4", // proven by years of stable operation
  "gelf-pro": "~2.0"  // future-oriented and volatile
}
```

`npm install gelf-pro`:
- `~1.4` (**ALL** Node.js versions are supported `[0.x to 2x.x]`)
- `~2.0` (Node.js versions `[22.x to 2x.x]` are supported)

Library only depends on: `lodash#~4.18`

## Initialization
```javascript
var log = require('gelf-pro');
```

### Adapters

> [!WARNING]
> To ensure consistent behavior, **none of the existing adapters re-use the socket connection**. Re-using socket connections can lead to resource leakage, complexity in state management, concurrency issues, security risks, and may not always provide significant performance benefits.
> It's often simpler and safer to establish new connections as needed rather than re-using existing ones, ensuring better resource utilization and reducing potential complications in network communication.
>
> There are multiple ([1](https://github.com/kkamkou/node-gelf-pro/pull/68), [2](https://github.com/fdelayen/node-gelf-pro/commit/b52b4b6b1ff26772314b8673dd6fd724c0937caa)) variants available for you to borrow from and create a new adapter. [See related section](#third-party-adapters).

- UDP (with deflation and chunking)
  - Input: `GELF UDP`
- TCP
  - Input: `GELF TCP` (with `Null frame delimiter`)
- TCP via TLS(SSL)
  - Input: `GELF TCP` (with `Null frame delimiter` and `Enable TLS`)


> [!NOTE]
> Within a more or less stable network (which is most likely), I would recommend using the `udp` adapter.
> I would also recommend it for an average to high-loaded project.
> For sensitive information, the `tcp-tls` adapter is recommended.

### Configuration
```javascript
// simple
log.setConfig({adapterOptions: {host: 'my.glog-server.net'}});

// advanced
log.setConfig({
  fields: {facility: "example", owner: "Tom (a cat)"}, // optional; default fields for all messages
  filter: [], // optional; filters to discard a message
  transform: [], // optional; transformers for a message
  broadcast: [], // optional; listeners of a message
  aliases: {}, // optional; default: see the aliases section below
  adapterName: 'udp', // optional; currently supported "udp", "tcp" and "tcp-tls"; default: udp
  adapterOptions: { // this object is passed to the adapter.setOptions() method
    // common
    host: '127.0.0.1', // optional; default: 127.0.0.1
    port: 12201, // optional; default: 12201
    // ... and so on

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
> `log.setConfig` merges the data. Therefore, you can call it multiple times.

### Basic functionality
```javascript
var extra = {tom: 'cat', jerry: 'mouse', others: {spike: 1, tyke: 1}};

log.info("Hello world", extra, function (err, bytesSent) {});
log.info("Hello world", function (err, bytesSent) {});
log.info("Hello world", extra);
log.info("Hello world");

log.error('Oooops.', new Error('An error message'));
// ^-- extra becomes: {short_message: 'Oooops.', _error_message: 'An error message', _error_stack: Error's stack}

log.error(new Error('An error message'));
// ^-- extra becomes: {short_message: 'An error message', full_message: Error's stack}

log.error(new Error('An error message'), {tom: 'cat'});
// ^-- extra becomes: {short_message: 'An error message', full_message: Error's stack, _tom: 'cat'}

log.message(new Error('An error message'), 3); // same as log.error(new Error('An error message'))
```

#### Extra
In case `extra` [is a plain object](https://lodash.com/docs#isPlainObject),
the library converts it to a readable format. Other values [are converted to string](https://lodash.com/docs#toString).
The acceptable format of a key is: `^[\w-]+$`
```javascript
log.info(
  'a new msg goes here',
  {me: {fname: 'k', lname: 'k', bdate: new Date(2000, 1, 1)}}
);
// ^-- extra becomes: {_me_fname: 'k', _me_lname: 'k', _me_bdate: 'Tue Feb 01 2000 00:00:00 GMT+0100 (CET)'}
```

#### Filtering
Sometimes we have to discard a message which is not suitable for the current environment. It is `NOT ALLOWED` to modify the data.
```javascript
log.setConfig({
  filter: [
    function (message) { // rejects a "debug" message
      return (message.level < 7);
    }
  ]
});
```

#### Transforming
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

#### Broadcasting
`broadcasting` happens after `transforming`. It is `NOT ALLOWED` to modify the data.

```javascript
log.setConfig({
  broadcast: [
    function (message) { // broadcasting to console
      console[message.level > 3 ? 'log' : 'error'](message.short_message, message);
    }
  ]
});
```

### Bulk messaging
Dispatches an array of messages over a single socket connection while running every item through configured `filter`, `transform`, and `broadcast` hooks. Accepts plain objects (`short_message` or `message`, numeric or named `level`), JSON strings, `Buffer` instances, `Error` objects, and primitives.

```javascript
log.bulk([
  {short_message: 'First message', level: 6, extraField: 'value'},
  {message: 'Second message', level: 'error'},
  '{"short_message": "Serialized JSON message", "level": 4}',
  new Error('An error message')
], function (err, bytesSent) {});
```

### Stream piping
Exposes a Node.js `stream.Writable` in `objectMode` with native `_writev` batching and backpressure. Any JSON stream or object stream can be piped directly into `log.stream()`, automatically coalescing concurrent chunks into bulk socket dispatches.

```javascript
jsonStream.pipe(log.stream());

// with optional stream.Writable options (e.g. highWaterMark) and lifecycle listeners
jsonStream
  .pipe(log.stream({highWaterMark: 64}))
  .on('error', function (err) {})
  .on('finish', function () {});
```

### Levels ([1](https://httpd.apache.org/docs/current/mod/core.html#loglevel), [2](https://logging.apache.org/log4j/2.0/log4j-api/apidocs/org/apache/logging/log4j/Level.html), [3](https://stackoverflow.com/questions/2031163/when-to-use-the-different-log-levels))
> [!WARNING]
> It is `NOT ALLOWED` to modify the levels. If you need it, consider `<2.0` version.

| Level     | Severity  |
|-----------|-----------|
| emergency | 0         |
| alert     | 1         |
| critical  | 2         |
| error     | 3         |
| warning   | 4         |
| notice    | 5         |
| info      | 6         |
| debug     | 7         |

### Aliases
**Default:** `log -> debug`, `warn -> warning`

Custom example:

> [!WARNING]
> It is `NOT ALLOWED` to redefine a name [used by the library](lib/gelf-pro.js#L290).

```javascript
// via config
log.setConfig({aliases: {waaagh: 'emergency', oopsie: 'alert'}}); // (!) overwrite existing
log.waaagh('Da ooman base iz got walls an');

// via api (aliasMapping: Object<String, String>, aliasesToRemove: Array<String>)
log.bindAliases({waaagh: 'emergency', oopsie: 'alert'}, /*optional*/ ['warn', 'log']);
```

### Third-party adapters
You can force a custom adapter by calling `setAdapter` right after initialization. See the adapter [signature](lib/adapter/abstract.js).
```javascript
var log = require('gelf-pro');
var myFancyAdapter = require('...');
log.setAdapter(myFancyAdapter);
// (!) adapterName and adapterOptions will be ignored
```

## Tests
### CLI
```bash
npm install
npm test
```

### Docker
```bash
[sudo] docker build --no-cache -t node-gelf-pro .
[sudo] docker run -ti --rm -v "${PWD}:/opt/app" -w "/opt/app" node-gelf-pro
```

## Contributors

- [corbinu](https://github.com/corbinu)
- [joelharkes](https://github.com/joelharkes)
- [mkalam-alami](https://github.com/mkalam-alami)

## License

[MIT](LICENSE)
