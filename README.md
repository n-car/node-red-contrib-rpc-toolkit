# node-red-contrib-rpc-toolkit

[![CI](https://github.com/n-car/node-red-contrib-rpc-toolkit/actions/workflows/ci.yml/badge.svg)](https://github.com/n-car/node-red-contrib-rpc-toolkit/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/node-red-contrib-rpc-toolkit.svg)](https://www.npmjs.com/package/node-red-contrib-rpc-toolkit)
[![npm downloads](https://img.shields.io/npm/dm/node-red-contrib-rpc-toolkit.svg)](https://www.npmjs.com/package/node-red-contrib-rpc-toolkit)
[![Node-RED](https://img.shields.io/badge/Node--RED-flow%20library-red.svg)](https://flows.nodered.org/node/node-red-contrib-rpc-toolkit)
[![node](https://img.shields.io/node/v/node-red-contrib-rpc-toolkit.svg)](https://www.npmjs.com/package/node-red-contrib-rpc-toolkit)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-stable-green.svg)](https://flows.nodered.org/node/node-red-contrib-rpc-toolkit)

JSON-RPC 2.0 client and server nodes for Node-RED, with optional RPC Toolkit Safe Mode interoperability.

**Turn Node-RED flows into structured JSON-RPC methods - and call JSON-RPC services from your flows.**

`node-red-contrib-rpc-toolkit` lets you expose Node-RED flows as named JSON-RPC methods and call JSON-RPC / RPC Toolkit services from your flows.

Use it when you want method names, structured errors, schema validation, introspection, and service-style communication instead of wiring custom HTTP endpoints manually.

Safe Mode is enabled by default because it makes interoperability with the RPC Toolkit libraries smoother. It does not change how you build Node-RED flows, and you can disable it when you want a plain JSON-RPC 2.0 endpoint for generic clients.

The package is designed to connect Node-RED flows with RPC Toolkit endpoints such as `rpc-express-toolkit`, `rpc-php-toolkit`, `rpc-dotnet-toolkit`, `rpc-python-toolkit`, `rpc-java-toolkit`, and `rpc-arduino-toolkit`.

## Why use this?

Use `node-red-contrib-rpc-toolkit` when you want Node-RED to expose or call structured JSON-RPC methods instead of wiring custom HTTP endpoints manually.

Typical use cases:

- expose Node-RED flows as callable RPC methods;
- call services written with `rpc-express-toolkit`, .NET, PHP, Python, Java, or Arduino/ESP32;
- build small local automation APIs;
- connect edge, IoT, and industrial services;
- validate method parameters with JSON Schema;
- discover available methods through built-in introspection;
- preserve string/date intent with optional Safe Mode.

## Try it in 60 seconds

### 1. Install

Install from the Node-RED Palette Manager, or from your Node-RED user directory:

```bash
cd ~/.node-red
npm install node-red-contrib-rpc-toolkit
```

Restart Node-RED after installing from the command line.

### 2. Create a simple RPC method

Create this flow:

```text
[RPC Method: "ping"] -> [Function: msg.payload = "pong"] -> [RPC Response]
```

Configure an `rpc-server` config node with endpoint `/rpc`, then configure the `rpc-method` node to use that server and method name `ping`.

Function node:

```javascript
msg.payload = 'pong';
return msg;
```

### 3. Test with the default Safe Mode

Safe Mode is enabled by default for RPC Toolkit interoperability. For this simple example, a raw HTTP client only needs to send the `X-RPC-Safe-Enabled` header. RPC Toolkit clients handle Safe Mode encoding and decoding automatically:

```bash
curl -X POST http://localhost:1880/rpc \
  -H "Content-Type: application/json" \
  -H "X-RPC-Safe-Enabled: true" \
  -d '{"jsonrpc":"2.0","method":"ping","id":1}'
```

Raw Safe Mode response:

```json
{"jsonrpc":"2.0","id":1,"result":"S:pong"}
```

The `S:` prefix is expected only when looking at raw HTTP responses from a Safe Mode endpoint. RPC Toolkit clients decode Safe Mode values automatically, so application flows receive normal values.

### 4. Test as plain JSON-RPC

For generic JSON-RPC clients, disable Safe Mode on the `rpc-server` config node and call the endpoint without the Safe Mode header:

```bash
curl -X POST http://localhost:1880/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"ping","id":1}'
```

Expected response:

```json
{"jsonrpc":"2.0","id":1,"result":"pong"}
```

## Installation

### Palette Manager

1. Open Node-RED.
2. Go to **Menu > Manage palette**.
3. Open the **Install** tab.
4. Search for `node-red-contrib-rpc-toolkit`.
5. Click **Install**.

### Node-RED user directory

```bash
cd ~/.node-red
npm install node-red-contrib-rpc-toolkit
```

Restart Node-RED after installing from the command line.

## When not to use this

Use the built-in Node-RED HTTP nodes if you only need one or two simple REST endpoints.

Use this package when you want named methods, structured JSON-RPC errors, schema validation, introspection, or interoperability with RPC Toolkit services.

## Nodes

- `rpc-server` - configuration node that mounts a JSON-RPC HTTP endpoint on the Node-RED HTTP server.
- `rpc-method` - registers a flow-backed JSON-RPC method on an `rpc-server`.
- `rpc-response` - completes a pending request started by an `rpc-method`.
- `rpc-client` - calls a remote JSON-RPC HTTP endpoint.
- `rpc-request` - parses an incoming JSON-RPC request from an existing HTTP flow.

## Typical flows

Create an RPC endpoint with a flow-backed method:

```text
[rpc-method: ping] -> [function: msg.payload = "pong"] -> [rpc-response]
```

Call a remote endpoint from a flow:

```text
[inject params] -> [rpc-client: ping] -> [debug result]
```

Parse an existing HTTP flow manually only when you need custom routing outside the `rpc-server` config node:

```text
[http in] -> [rpc-request] -> [function] -> [http response]
```

## JSON-RPC modes

### Standard JSON-RPC mode

Disable Safe Mode on the `rpc-server` or `rpc-client` node when you want normal JSON-RPC 2.0 payloads for generic clients and services.

In this mode:

- requests do not need the `X-RPC-Safe-Enabled` header;
- strings and dates are returned as normal JSON values;
- JSON-RPC errors, notifications, batch requests, and introspection still work.

### RPC Toolkit Safe Mode

Safe Mode is useful when both sides use RPC Toolkit libraries. It preserves application-level value intent across JSON, for example strings that could otherwise be confused with encoded date or numeric marker values.

In this mode:

- RPC Toolkit clients and servers handle encoding and decoding automatically;
- raw HTTP clients need to add `X-RPC-Safe-Enabled: true`;
- raw HTTP responses may show marker strings such as `S:hello`;
- Node-RED flow code still reads and writes normal `msg.payload` values.

## Implemented features

- JSON-RPC 2.0 calls, errors, notifications, and batch requests.
- Flow-backed method registration.
- Built-in introspection through `__rpc.listMethods`, `__rpc.describe`, `__rpc.describeAll`, `__rpc.version`, and `__rpc.capabilities`.
- Per-method JSON Schema validation when a method schema is configured.
- Optional RPC Toolkit Safe Mode over HTTP.
- Explicit Safe Mode header handling on the server when Safe Mode is enabled.
- CORS support on the server node.
- Optional Authorization header passthrough on the client node.
- Client editor helper for loading remote methods through introspection.

Not currently implemented by this package:

- Server-side JWT authentication middleware.
- Server-side rate limiting configuration.
- WebSocket transport.
- A dedicated visual batch node. Batch requests are supported by the JSON-RPC endpoint, but not exposed as a separate Node-RED node.

## Node details

### RPC Server

Creates a JSON-RPC endpoint under the Node-RED HTTP server.

Configuration:

- `Endpoint` - HTTP path, for example `/rpc`.
- `CORS` - enables CORS headers, including `X-RPC-Safe-Enabled`.
- `Safe Mode` - enabled by default for RPC Toolkit interoperability. Disable it to expose a standard JSON-RPC 2.0 endpoint for generic clients.

When Safe Mode is enabled, the server expects the `X-RPC-Safe-Enabled` header so both sides know encoded values are in use. Requests without that header are rejected with JSON-RPC error `-32600`.

When Safe Mode is disabled, the endpoint does not require the header and returns raw JSON values without `S:` or `D:` prefixes.

### RPC Method

Registers a method on an `rpc-server`.

Configuration:

- `Server` - target `rpc-server` config node.
- `Method Name` - JSON-RPC method name.
- `Description` - optional introspection text.
- `Expose Schema` - makes schema metadata visible via `__rpc.describe`.
- `Validate Schema` - validates params before invoking the flow.
- `Schema` - JSON Schema generated by the editor UI or provided manually.

The node sends incoming method params on output 1. The flow must keep `msg.rpc` intact and pass the final result to an `rpc-response` node.

### RPC Response

Completes a pending request created by an `rpc-method`.

Input:

- `msg.payload` - successful result.
- `msg.error` - optional JSON-RPC error object.
- `msg.rpc.id` and `msg.rpc.methodNodeId` - routing metadata from `rpc-method`.

Example custom error:

```javascript
msg.error = {
  code: -32042,
  message: 'Domain failure',
  data: {
    reason: 'intentional-test-error'
  }
};
return msg;
```

### RPC Client

Calls a remote JSON-RPC HTTP endpoint.

Configuration:

- `Server URL` - full endpoint URL, for example `http://localhost:3000/api`.
- `Method` - default method name.
- `Timeout` - request timeout in milliseconds.
- `Auth Token` - optional token sent as an `Authorization` header.
- `Safe Mode` - enabled by default.

Input:

- `msg.payload` - method params.
- `msg.method` - optional method override.

Outputs:

- Output 1: successful result in `msg.payload`.
- Output 2: error object in `msg.error`.

### RPC Request

Parses a JSON-RPC request from an existing HTTP flow. Use this only when you are building a custom HTTP flow instead of the `rpc-server` config node.

## Introspection

The server supports:

- `__rpc.listMethods`
- `__rpc.describe`
- `__rpc.describeAll`
- `__rpc.version`
- `__rpc.capabilities`

Example:

```bash
curl -X POST http://localhost:1880/rpc \
  -H "Content-Type: application/json" \
  -H "X-RPC-Safe-Enabled: true" \
  -d '{"jsonrpc":"2.0","method":"__rpc.listMethods","id":1}'
```

Raw Safe Mode response:

```json
{"jsonrpc":"2.0","id":1,"result":["S:ping","S:sum"]}
```

## Safe Mode notes

Safe Mode is an RPC Toolkit extension for preserving application-level value intent across plain JSON. It is mainly relevant at the HTTP boundary; inside Node-RED flows you continue working with normal `msg.payload` values.

- HTTP requests and responses use `X-RPC-Safe-Enabled` when Safe Mode is enabled.
- The Node-RED server defaults to Safe Mode enabled for RPC Toolkit interoperability.
- Raw HTTP clients must send `X-RPC-Safe-Enabled` when calling a Safe Mode server.
- Raw HTTP responses from a Safe Mode server contain encoded string values such as `S:hello`.
- Disable Safe Mode on the server when generic JSON-RPC clients need unprefixed JSON strings.
- RPC Toolkit clients decode these values automatically.
- Date and BigInt marker handling follows `rpc-express-toolkit` behavior.
- BigInt markers are transported as marker strings; Node-RED flows do not receive JavaScript `BigInt` values automatically.

## Example flows

Ready-to-import Node-RED flows are available in [examples](examples/README.md).

The examples are grouped by test type:

- standard JSON-RPC server;
- Safe Mode server;
- validation and custom error responses;
- standard JSON-RPC client;
- Safe Mode client;
- client error output;
- request parser;
- full local server/client loopback.

## Status and compatibility

- Published on npm as `node-red-contrib-rpc-toolkit`.
- Indexed in the Node-RED Flow Library and installable through Palette Manager.
- Requires Node.js 18 or newer.
- Tested locally with Node-RED 5.0.0 in unit tests and Node-RED 4.1.0 in the Docker interoperability harness.
- Public Node-RED Flow Library scorecard is green.
- Runtime dependency audit is checked before release.

## Local development

```bash
git clone https://github.com/n-car/node-red-contrib-rpc-toolkit.git
cd node-red-contrib-rpc-toolkit
npm install
npm test
```

Useful checks:

```bash
npm run audit:runtime
npm run pack:check
```

## Related projects

- [rpc-express-toolkit](https://github.com/n-car/rpc-express-toolkit) - Node.js/Express implementation
- [rpc-php-toolkit](https://github.com/n-car/rpc-php-toolkit) - PHP implementation
- [rpc-dotnet-toolkit](https://github.com/n-car/rpc-dotnet-toolkit) - .NET implementation
- [rpc-python-toolkit](https://github.com/n-car/rpc-python-toolkit) - Python implementation
- [rpc-java-toolkit](https://github.com/n-car/rpc-java-toolkit) - Java implementation
- [rpc-arduino-toolkit](https://github.com/n-car/rpc-arduino-toolkit) - Arduino/ESP32 implementation

## License

MIT. See [LICENSE](LICENSE).
