# Example Flows

This directory contains example Node-RED flows demonstrating various use cases.

## Basic Examples

### 1. Simple Sum Method

A basic example showing how to create a local RPC server with a `sum` method that adds two numbers.

**Flow JSON:**
```json
[
    {
        "id": "rpc-config-1",
        "type": "rpc-server",
        "name": "Local RPC Server",
        "endpoint": "/rpc",
        "safeEnabled": false,
        "corsEnabled": true
    },
    {
        "id": "rpc-method-sum",
        "type": "rpc-method",
        "name": "Sum Method",
        "server": "rpc-config-1",
        "methodName": "sum",
        "x": 300,
        "y": 200,
        "wires": [["function-add"]]
    },
    {
        "id": "function-add",
        "type": "function",
        "name": "Add Numbers",
        "func": "// Input: msg.payload = { a: 5, b: 3 }\nconst { a, b } = msg.payload;\nmsg.payload = a + b;\nreturn msg;",
        "x": 500,
        "y": 200,
        "wires": [["rpc-method-sum"]]
    }
]
```

**How it works:**
1. RPC Server config node exposes endpoint at `http://localhost:1880/rpc`
2. RPC Method node registers the `sum` method
3. When called, it outputs `{ a: 5, b: 3 }` to the function
4. Function calculates `a + b` and returns result
5. Result goes back to RPC Method input to send response

**Test with curl:**
```bash
curl -X POST http://localhost:1880/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"sum","params":{"a":5,"b":3},"id":1}'

# Response:
# {"jsonrpc":"2.0","result":8,"id":1}
```

**Test with JavaScript:**
```javascript
const response = await fetch('http://localhost:1880/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'sum',
        params: { a: 10, b: 20 },
        id: 1
    })
});
const data = await response.json();
console.log(data.result); // 30
```

### 2. Simple Ping Server

```json
[
    {
        "id": "server1",
        "type": "rpc-server",
        "name": "Ping Server",
        "endpoint": "/rpc"
    },
    {
        "id": "method1",
        "type": "rpc-method",
        "server": "server1",
        "methodName": "ping"
    },
    {
        "id": "function1",
        "type": "function",
        "func": "msg.payload = 'pong';\nreturn msg;",
        "wires": [["method1"]]
    }
]
```

### 3. Arduino Temperature Reader

### 3. Arduino Temperature Reader

```json
[
    {
        "id": "inject1",
        "type": "inject",
        "repeat": "10",
        "topic": ""
    },
    {
        "id": "client1",
        "type": "rpc-client",
        "serverUrl": "http://192.168.1.100:8080",
        "method": "readTemp",
        "timeout": 5000
    },
    {
        "id": "debug1",
        "type": "debug",
        "name": "Temperature"
    }
]
```

### 4. Multi-Sensor Hub

```json
[
    {
        "id": "server1",
        "type": "rpc-server",
        "port": 1880,
        "endpoint": "/sensors"
    },
    {
        "id": "method1",
        "type": "rpc-method",
        "server": "server1",
        "methodName": "getAllSensors"
    },
    {
        "id": "function1",
        "type": "function",
        "func": "msg.payload = {\n  temp: 25.5,\n  humidity: 60,\n  pressure: 1013\n};\nreturn msg;"
    }
]
```

## Advanced Examples

### 4. Database Query Service

Expose database queries via RPC.

### 5. Home Automation Hub

Control smart devices through RPC calls.

### 6. ESP32 Device Bridge

Forward RPC calls to ESP32 devices.

## Import Instructions

1. Copy the JSON flow
2. In Node-RED, click menu → Import
3. Paste the JSON
4. Deploy the flow

## Testing

Use curl or the RPC client to test:

```bash
curl -X POST http://localhost:1880/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"ping","id":1}'
```
