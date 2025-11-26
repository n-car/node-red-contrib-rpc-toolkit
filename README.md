# node-red-contrib-rpc-toolkit

[![npm version](https://badge.fury.io/js/node-red-contrib-rpc-toolkit.svg)](https://www.npmjs.com/package/node-red-contrib-rpc-toolkit)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node-RED](https://img.shields.io/badge/Node--RED-%3E%3D3.0.0-red.svg)](https://nodered.org/)

JSON-RPC 2.0 client and server nodes for Node-RED. Build powerful automation flows with RPC communication to Express, PHP, .NET, Arduino, and ESP32 devices.

![Node-RED RPC Toolkit](https://raw.githubusercontent.com/n-car/node-red-contrib-rpc-toolkit/main/docs/images/banner.png)

## 🎯 Features

### Core Nodes
- **RPC Server** - Expose Node-RED flows as RPC methods via HTTP
- **RPC Client** - Call remote RPC servers (Express, PHP, .NET, Arduino)
- **RPC Method** - Register method handlers in flows
- **RPC Request** - Parse incoming RPC requests
- **RPC Response** - Send RPC responses

### Advanced Features
- ✅ **JSON-RPC 2.0 Compliance** - Full specification support
- ✅ **Cross-Platform** - Works with entire RPC Toolkit ecosystem
- ✅ **Safe Mode** - Type-safe serialization with prefixes
- ✅ **Batch Requests** - Process multiple requests efficiently
- ✅ **Error Handling** - Structured error responses
- ✅ **Authentication** - JWT and custom auth support
- ✅ **CORS** - Cross-origin resource sharing
- ✅ **Rate Limiting** - Protect your endpoints
- ✅ **Logging** - Built-in debug and logging

## 📦 Installation

### Via Node-RED Palette Manager
1. Open Node-RED
2. Go to **Menu → Manage Palette**
3. Click **Install** tab
4. Search for `node-red-contrib-rpc-toolkit`
5. Click **Install**

### Via npm
```bash
cd ~/.node-red
npm install node-red-contrib-rpc-toolkit
```

### Via command line
```bash
npm install -g node-red-contrib-rpc-toolkit
```

Then restart Node-RED.

## 🚀 Quick Start

### Example 1: Simple RPC Server

Create a flow that exposes a `ping` method:

```
[RPC Server] → [RPC Method: "ping"] → [Function: return "pong"] → [RPC Response]
```

**Configuration:**
1. Add **RPC Server** node, set port `1880`, endpoint `/rpc`
2. Add **RPC Method** node, set name `ping`
3. Add **Function** node with: `msg.payload = "pong"; return msg;`
4. Connect to **RPC Response** node

**Test:**
```bash
curl -X POST http://localhost:1880/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"ping","id":1}'
```

**Response:**
```json
{"jsonrpc":"2.0","result":"pong","id":1}
```

### Example 2: Call Arduino/ESP32

```
[Inject] → [RPC Client] → [Debug]
```

**RPC Client Configuration:**
- Server URL: `http://192.168.1.100:8080`
- Method: `readTemp`
- Timeout: `5000` ms

**Output:** `msg.payload = 25.5`

### Example 3: IoT Sensor Hub

```
[RPC Method: "getAllSensors"]
  ↓
[MQTT In] → [Parse Sensors] → [Format Response]
  ↓
[RPC Response]
```

Register method that aggregates data from multiple sensors via MQTT.

## 📚 Node Documentation

### RPC Server Node

Creates an HTTP server that handles JSON-RPC 2.0 requests.

**Properties:**
- **Port** - Server port (default: `1880`)
- **Endpoint** - URL path (default: `/rpc`)
- **Safe Mode** - Enable type-safe serialization
- **CORS** - Enable cross-origin requests
- **Auth** - Enable authentication
- **Rate Limit** - Requests per minute

**Output:** Emits events for monitoring

### RPC Client Node

Calls remote RPC servers.

**Properties:**
- **Server URL** - Target server (e.g., `http://localhost:3000/rpc`)
- **Method** - RPC method name
- **Timeout** - Request timeout in ms
- **Auth Token** - Optional authentication
- **Safe Mode** - Enable type-safe mode

**Input:** `msg.payload` = method parameters
**Output:** `msg.payload` = result or error

### RPC Method Node

Registers a method handler in the RPC server.

**Properties:**
- **Server** - Link to RPC Server node
- **Method Name** - Name of the method (e.g., `getStatus`)
- **Schema** - Optional JSON Schema for validation

**Input:** `msg.payload` = method parameters
**Output:** Pass result to RPC Response node

### RPC Request Node

Parses incoming RPC request from HTTP.

**Output:**
- `msg.payload` - Method parameters
- `msg.rpc.method` - Method name
- `msg.rpc.id` - Request ID
- `msg.rpc.jsonrpc` - Protocol version

### RPC Response Node

Sends RPC response back to client.

**Input:**
- `msg.payload` - Result to return
- `msg.rpc.id` - Request ID (from RPC Request)
- `msg.error` - Error object (if error occurred)

## 🎨 Example Flows

### Home Automation Hub

Control smart devices via RPC:

```json
[
  {
    "id": "server1",
    "type": "rpc-server",
    "name": "Home Hub",
    "port": 1880,
    "endpoint": "/rpc",
    "cors": true
  },
  {
    "id": "method1",
    "type": "rpc-method",
    "name": "setLight",
    "server": "server1",
    "wires": [["mqtt1"]]
  },
  {
    "id": "mqtt1",
    "type": "mqtt out",
    "topic": "home/light/set",
    "wires": [["response1"]]
  },
  {
    "id": "response1",
    "type": "rpc-response"
  }
]
```

**Usage:**
```javascript
// From browser or mobile app
const client = new RpcClient('http://home-hub:1880/rpc');
await client.call('setLight', { room: 'bedroom', state: true });
```

### Multi-Device Orchestration

Call multiple devices in parallel:

```
[Inject]
  ↓
[RPC Batch]
  ├→ [RPC Client: Arduino 1] → readTemp
  ├→ [RPC Client: Arduino 2] → readHumidity
  └→ [RPC Client: ESP32] → readPressure
  ↓
[Join] → [Function: aggregate] → [Dashboard]
```

### Database Query Service

```
[RPC Method: "getUser"]
  ↓
[SQL Query]
  ↓
[Transform Data]
  ↓
[RPC Response]
```

### ESP32 Bridge

Forward requests to ESP32 devices:

```
[RPC Server :1880]
  ↓
[RPC Method: "device.*"]
  ↓
[Switch: by method]
  ├→ device.led → [RPC Client: ESP32 :8080]
  ├→ device.temp → [RPC Client: ESP32 :8080]
  └→ device.status → [RPC Client: ESP32 :8080]
  ↓
[RPC Response]
```

## 🔧 Configuration Examples

### Enable Authentication

```javascript
// In RPC Server node settings
{
  "auth": {
    "enabled": true,
    "secret": "your-jwt-secret",
    "validateToken": function(token) {
      // Validate JWT or custom token
      return isValidToken(token);
    }
  }
}
```

### Enable Rate Limiting

```javascript
{
  "rateLimit": {
    "enabled": true,
    "maxRequests": 100,
    "windowMs": 60000  // 1 minute
  }
}
```

### Custom Error Handling

```javascript
// In Function node before RPC Response
if (error) {
  msg.error = {
    code: -32000,
    message: "Custom error message",
    data: { details: "..." }
  };
}
return msg;
```

## 🌐 Cross-Platform Integration

### Call PHP Server

```javascript
// RPC Client node → PHP backend
{
  "url": "http://api.example.com/rpc",
  "method": "user.create",
  "params": {
    "name": "John",
    "email": "john@example.com"
  }
}
```

### Call .NET Service

```javascript
// RPC Client node → .NET microservice
{
  "url": "http://services.example.com:5000/api/rpc",
  "method": "order.process",
  "params": {
    "orderId": 12345
  }
}
```

### Call Arduino/ESP32

```javascript
// RPC Client node → ESP32 device
{
  "url": "http://192.168.1.100:8080",
  "method": "readSensors",
  "params": {}
}
```

### Dashboard Integration

Use with **node-red-dashboard**:

```
[UI Button: "Read Temp"]
  ↓
[RPC Client: ESP32]
  ↓
[UI Chart: Temperature]
```

## 📊 Monitoring & Debugging

### Enable Logging

Set log level in RPC Server node:
- **Error** - Only errors
- **Warn** - Warnings and errors
- **Info** - General information
- **Debug** - Detailed debugging

### View RPC Traffic

Connect **Debug** nodes to RPC Server output:

```
[RPC Server]
  ↓ (events)
[Debug: "RPC Traffic"]
```

Shows all incoming requests and responses.

### Metrics

RPC Server emits metrics:
- `msg.rpc.metrics.requestCount`
- `msg.rpc.metrics.errorCount`
- `msg.rpc.metrics.avgResponseTime`

## 🔗 Compatible Projects

This toolkit works seamlessly with:
- ✅ **[rpc-express-toolkit](https://github.com/n-car/rpc-express-toolkit)** - Node.js/Express
- ✅ **[rpc-php-toolkit](https://github.com/n-car/rpc-php-toolkit)** - PHP
- ✅ **[rpc-dotnet-toolkit](https://github.com/n-car/rpc-dotnet-toolkit)** - .NET
- ✅ **[rpc-arduino-toolkit](https://github.com/n-car/rpc-arduino-toolkit)** - Arduino/ESP32

## 🎯 Use Cases

### IoT & Home Automation
- Smart home control hub
- Sensor data aggregation
- Device orchestration
- Real-time monitoring

### Microservices
- Service orchestration
- API gateway
- Event-driven workflows
- Data transformation

### Industrial Automation
- PLC communication
- SCADA integration
- Equipment monitoring
- Process control

### Prototyping
- Rapid API development
- Mock servers
- Testing tools
- Demo systems

## 📖 API Reference

### Safe Mode

Enable type-safe serialization:

**Server:**
```javascript
{
  "safeMode": true
}
```

**Client:**
```javascript
{
  "safeMode": true
}
```

**Behavior:**
- Strings: `"hello"` → `"S:hello"`
- Dates: ISO string → `"D:2025-11-26T10:30:00Z"`
- BigInt: `9007199254740992` → `"9007199254740992n"`

### Batch Requests

Send multiple requests at once:

```javascript
// msg.payload
[
  {"method": "readTemp", "id": 1},
  {"method": "readHumidity", "id": 2},
  {"method": "readPressure", "id": 3}
]
```

### Notifications

Fire-and-forget (no response):

```javascript
// RPC Client with no response expected
{
  "method": "log.event",
  "params": {"level": "info", "msg": "User login"},
  "notification": true  // No ID, no response
}
```

## 🛠️ Development

### Clone Repository

```bash
git clone https://github.com/n-car/node-red-contrib-rpc-toolkit.git
cd node-red-contrib-rpc-toolkit
npm install
```

### Link for Development

```bash
npm link
cd ~/.node-red
npm link node-red-contrib-rpc-toolkit
```

### Run Tests

```bash
npm test
```

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built on [rpc-express-toolkit](https://github.com/n-car/rpc-express-toolkit)
- Compatible with the entire RPC Toolkit ecosystem
- Inspired by the Node-RED community

---

**node-red-contrib-rpc-toolkit** - Bring JSON-RPC 2.0 to your Node-RED flows.
