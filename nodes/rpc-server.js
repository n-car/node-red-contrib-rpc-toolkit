/**
 * RPC Server Config Node for Node-RED
 * Creates a global HTTP endpoint for JSON-RPC 2.0 requests
 */

const crypto = require('crypto');
const express = require('express');
const { RpcEndpoint } = require('rpc-express-toolkit');

function normalizeBearerHeader(authToken) {
    if (!authToken) {
        return '';
    }

    return authToken.startsWith('Bearer ')
        ? authToken
        : `Bearer ${authToken}`;
}

function timingSafeEqualString(left, right) {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);

    return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function sendUnauthorized(res) {
    res.set('WWW-Authenticate', 'Bearer');
    return res.status(401).json({
        jsonrpc: '2.0',
        id: null,
        error: {
            code: -32001,
            message: 'Unauthorized'
        }
    });
}

module.exports = function(RED) {
    function parseBoolean(value, defaultValue) {
        if (value === undefined || value === null || value === '') {
            return defaultValue;
        }
        return value !== false && value !== 'false';
    }

    function RpcServerNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Configuration
        const endpoint = config.endpoint || '/rpc';
        const safeEnabled = parseBoolean(config.safeEnabled, true);
        const corsEnabled = parseBoolean(config.corsEnabled, false);
        const authMode = config.authMode || (parseBoolean(config.authEnabled, false) ? 'bearer' : 'none');
        const authEnabled = authMode === 'bearer';
        const authToken = (node.credentials && node.credentials.authToken) || config.authToken || '';
        const expectedAuthorization = normalizeBearerHeader(authToken);

        // Store endpoint for info display
        node.endpoint = endpoint;
        node.safeEnabled = safeEnabled;
        node.corsEnabled = corsEnabled;
        node.authMode = authMode;
        node.authEnabled = authEnabled;
        
        // Verify HTTP server is available
        if (!RED.httpNode) {
            node.error("HTTP server not available");
            return;
        }
        
        // Create a mini Express app for RPC
        const app = express();

        // Add CORS middleware if enabled
        if (corsEnabled) {
            app.use((req, res, next) => {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
                res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-RPC-Safe-Enabled');
                
                if (req.method === 'OPTIONS') {
                    return res.sendStatus(200);
                }
                next();
            });
        }

        if (authEnabled && !expectedAuthorization) {
            node.warn("RPC Server bearer authentication is enabled but no token is configured; requests will be rejected");
        }

        if (authEnabled) {
            app.use((req, res, next) => {
                if (req.method === 'OPTIONS') {
                    return next();
                }

                if (!expectedAuthorization) {
                    return sendUnauthorized(res);
                }

                const authorization = req.get('authorization') || '';
                if (!timingSafeEqualString(authorization, expectedAuthorization)) {
                    return sendUnauthorized(res);
                }

                next();
            });
        }

        app.use(express.json());

        // Create RPC endpoint with the mini app
        const rpcOptions = {
            safeEnabled: safeEnabled,
            enableBatch: true,
            enableLogging: true,
            enableIntrospection: true,  // Enable __rpc.* methods
            validation: {},
            endpoint: '/'  // Use root path since we mount the app at the endpoint
        };

        node.rpc = new RpcEndpoint(app, {}, rpcOptions);
        const capabilitiesMethod = node.rpc.getMethod('__rpc.capabilities');
        if (capabilitiesMethod && typeof capabilitiesMethod === 'object' && typeof capabilitiesMethod.handler === 'function') {
            const baseCapabilitiesHandler = capabilitiesMethod.handler;
            capabilitiesMethod.handler = async (...args) => ({
                ...(await baseCapabilitiesHandler(...args)),
                cors: corsEnabled,
                auth: authMode
            });
        }
        
        // Initialize tracking
        node.pendingRequests = new Map();
        node.registeredMethods = [];
        
        // Mount the RPC app at the configured endpoint
        RED.httpNode.use(endpoint, app);
        
        node.log(`RPC Server listening on ${endpoint}`);
        
        // Expose method registration tracking
        node.registerMethod = function(methodName) {
            if (!node.registeredMethods.includes(methodName)) {
                node.registeredMethods.push(methodName);
                node.log(`Method registered: ${methodName} (${node.registeredMethods.length} total)`);
            }
        };
        
        node.unregisterMethod = function(methodName) {
            const index = node.registeredMethods.indexOf(methodName);
            if (index > -1) {
                node.registeredMethods.splice(index, 1);
                node.log(`Method unregistered: ${methodName} (${node.registeredMethods.length} total)`);
            }
        };
        
        node.on('close', function(done) {
            // Remove HTTP route
            if (RED.httpNode._router && RED.httpNode._router.stack) {
                RED.httpNode._router.stack = RED.httpNode._router.stack.filter(
                    layer => layer.handle !== app
                );
            }
            done();
        });
    }
    
    RED.nodes.registerType("rpc-server", RpcServerNode, {
        credentials: {
            authToken: { type: "password" }
        }
    });
    
    // Endpoint to get server info for config UI
    RED.httpAdmin.get('/rpc-server-info/:id', function(req, res) {
        const node = RED.nodes.getNode(req.params.id);
        if (node && node.rpc) {
            res.json({
                active: true,
	                endpoint: node.endpoint,
	                safeEnabled: node.safeEnabled,
	                corsEnabled: node.corsEnabled,
                    authEnabled: node.authEnabled,
                    authMode: node.authMode,
	                methodCount: node.registeredMethods ? node.registeredMethods.length : 0,
                methods: node.registeredMethods || []
            });
        } else {
            res.json({ active: false });
        }
    });
};
