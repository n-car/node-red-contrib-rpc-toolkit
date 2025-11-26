# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-11-26

### Changed
- **BREAKING**: RPC Server is now a config node (not visible in flow)
- Server automatically starts with Node-RED and uses built-in HTTP server
- Simplified configuration with focus on endpoint and essential options
- Removed redundant port configuration (uses Node-RED's port)
- Removed unnecessary features from server UI (auth, rate limiting - to be added in future)

### Improved
- Better UX: server doesn't clutter the flow workspace
- Consistent with Node-RED patterns (like HTTP In/Out nodes)
- Method nodes reference server config node directly
- Clearer separation between local server and remote clients

## [1.0.0] - 2025-11-26

### Added
- Initial release of node-red-contrib-rpc-toolkit
- RPC Server node for exposing JSON-RPC 2.0 endpoints
- RPC Client node for calling remote RPC servers
- RPC Method node for registering method handlers
- RPC Request node for parsing incoming requests
- RPC Response node for sending responses
- Safe Mode support with type prefixes (S:, D:, n)
- CORS support for cross-origin requests
- Batch request handling
- Comprehensive examples and documentation
- Cross-platform compatibility (Express, PHP, .NET, Arduino)

### Features
- Full JSON-RPC 2.0 specification compliance
- Visual flow-based RPC method registration
- Async/await support for handlers
- Error handling with standard error codes
- Authentication support (JWT ready)
- Rate limiting configuration
- Request/response monitoring
- Timeout handling
- Debug and logging capabilities

### Documentation
- Complete README with quick start guide
- Node help pages integrated in Node-RED
- Example flows for IoT, automation, and microservices
- Cross-platform integration examples
- API reference
