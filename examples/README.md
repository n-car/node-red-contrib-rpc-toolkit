# Example Flows

This directory contains ready-to-import Node-RED flows for focused RPC Toolkit tests.

Import a flow from Node-RED with **Menu > Import**, paste the JSON file contents, then deploy.

## Flow Index

| File | Purpose | Endpoint | Safe Mode |
| --- | --- | --- | --- |
| [basic-sum.json](basic-sum.json) | Minimal `sum` server with schema validation | `/rpc-basic-sum` | disabled |
| [server-standard-basic.json](server-standard-basic.json) | Standard JSON-RPC server with `ping` and `sum` | `/rpc-standard` | disabled |
| [server-safe-basic.json](server-safe-basic.json) | RPC Toolkit Safe Mode server with `ping` and `echo` | `/rpc-safe` | enabled |
| [server-validation-error.json](server-validation-error.json) | Schema validation and custom JSON-RPC error responses | `/rpc-validation` | disabled |
| [client-standard-call.json](client-standard-call.json) | `rpc-client` calling a standard JSON-RPC endpoint | uses `/rpc-standard` | disabled |
| [client-safe-call.json](client-safe-call.json) | `rpc-client` calling a Safe Mode endpoint | uses `/rpc-safe` | enabled |
| [client-error-output.json](client-error-output.json) | `rpc-client` output 2 error routing | uses `/rpc-standard` | disabled |
| [request-parser-basic.json](request-parser-basic.json) | Minimal `rpc-request` parser example | none | n/a |
| [full-local-loopback.json](full-local-loopback.json) | Self-contained server and client loopback test | `/rpc-loopback` | disabled |
| [server-bearer-auth-loopback.json](server-bearer-auth-loopback.json) | Self-contained bearer auth server and client test | `/rpc-auth` | disabled |

## Server Tests

### Standard JSON-RPC

Import [server-standard-basic.json](server-standard-basic.json), deploy, then run:

```bash
curl -X POST http://localhost:1880/rpc-standard \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"ping","id":1}'
```

Expected response:

```json
{"jsonrpc":"2.0","id":1,"result":"pong"}
```

Test the validated `sum` method:

```bash
curl -X POST http://localhost:1880/rpc-standard \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"sum","params":{"a":5,"b":7},"id":2}'
```

Expected response:

```json
{"jsonrpc":"2.0","id":2,"result":12}
```

### Safe Mode

Import [server-safe-basic.json](server-safe-basic.json), deploy, then run:

```bash
curl -X POST http://localhost:1880/rpc-safe \
  -H "Content-Type: application/json" \
  -H "X-RPC-Safe-Enabled: true" \
  -d '{"jsonrpc":"2.0","method":"ping","id":1}'
```

Expected raw HTTP response:

```json
{"jsonrpc":"2.0","id":1,"result":"S:pong"}
```

RPC Toolkit clients decode the `S:` marker automatically.

### Validation And Custom Errors

Import [server-validation-error.json](server-validation-error.json), deploy, then send invalid params:

```bash
curl -X POST http://localhost:1880/rpc-validation \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"sum","params":{"a":"x","b":7},"id":1}'
```

Expected: JSON-RPC error `-32602`.

Custom application error:

```bash
curl -X POST http://localhost:1880/rpc-validation \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"domainError","id":2}'
```

Expected: JSON-RPC error `-32042` with `error.data`.

## Client Tests

The client-only examples need a server flow deployed first.

- Import [server-standard-basic.json](server-standard-basic.json) before [client-standard-call.json](client-standard-call.json) or [client-error-output.json](client-error-output.json).
- Import [server-safe-basic.json](server-safe-basic.json) before [client-safe-call.json](client-safe-call.json).

After deploying, click the inject button in the client flow and check the debug sidebar.

Expected results:

- `client-standard-call.json`: output 1 receives `msg.payload = "pong"`.
- `client-safe-call.json`: output 1 receives decoded `msg.payload = "pong"`.
- `client-error-output.json`: output 2 receives a JSON-RPC `-32601` error.

## Full Loopback Test

Import [full-local-loopback.json](full-local-loopback.json) when you want a single self-contained flow.

It includes:

- an `rpc-server` config node
- `ping` and `sum` methods
- shared `rpc-response`
- two `rpc-client` calls
- success and error debug outputs

Deploy the flow, then click the inject buttons. Expected debug results:

- `client call ping`: `pong`
- `client call sum`: `12`

## Bearer Auth Loopback Test

Import [server-bearer-auth-loopback.json](server-bearer-auth-loopback.json) when you want to test `rpc-server` bearer authentication and `rpc-client` Authorization header handling in one local flow.

The example intentionally does not include a token in the JSON export. Tokens are stored as Node-RED credentials.

Before deploying:

- open the `Bearer RPC Server` config node and set `Auth Token` to `rpc-test-token`;
- open the `call ping with token` client node and set `Auth Token` to `rpc-test-token`;
- leave the `call ping without token` client node blank.

Deploy the flow, then click the inject buttons. Expected debug results:

- `client call ping with token`: output 1 receives `msg.payload = "pong"`;
- `client call ping without token`: output 2 receives an HTTP 401 unauthorized error.

## Request Parser Test

Import [request-parser-basic.json](request-parser-basic.json) when you want to inspect the low-level `rpc-request` node behavior.

Click the inject button and check the debug sidebar. The node parses the JSON-RPC request object and sets:

- `msg.payload` to the request `params`
- `msg.rpc.method` to the JSON-RPC method name
- `msg.rpc.id` to the request id
