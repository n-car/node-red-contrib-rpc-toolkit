# Example Flows

This directory contains example Node-RED flows demonstrating various use cases.

## Basic Examples

### 1. Simple Ping Server

```json
[
    {
        "id": "server1",
        "type": "rpc-server",
        "port": 1880,
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

### 2. Arduino Temperature Reader

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

### 3. Multi-Sensor Hub

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
