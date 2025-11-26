# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Server status info panel in config node editor
- Real-time display of registered methods and endpoint
- HTTP admin endpoint for config UI data 

### Changed
- **BREAKING**: RPC Method node no longer accepts direct replies; use the RPC Response node to finish calls
- RPC Method node now uses dual-output pattern (request, error)
- RPC Client node now uses dual-output pattern (success, error)
- Simplified flow patterns - no need to check msg.error

### Improved
- Cleaner flow design with output routing instead of conditional logic
- Better error handling with separate output ports
- Server tracking of registered methods

## [1.1.1] - 2025-11-26

### Fixed
- Fixed RpcEndpoint initialization error (router.get is not a function)
- RPC Server now creates a mini Express app for proper RpcEndpoint integration
- Improved route cleanup on node close

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
