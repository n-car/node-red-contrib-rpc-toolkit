/**
 * RPC Server Config Node for Node-RED
 * Creates a global HTTP endpoint for JSON-RPC 2.0 requests
 */

const express = require('express');
const { RpcEndpoint } = require('rpc-express-toolkit');

module.exports = function(RED) {
    function RpcServerNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // Configuration
        const endpoint = config.endpoint || '/rpc';
        const safeEnabled = config.safeEnabled || false;
        const corsEnabled = config.corsEnabled || false;
        
        // Store endpoint for info display
        node.endpoint = endpoint;
        
        // Verify HTTP server is available
        if (!RED.httpNode) {
            node.error("HTTP server not available");
            return;
        }
        
        // Create a mini Express app for RPC
        const app = express();
        app.use(express.json());
        
        // Add CORS middleware if enabled
        if (corsEnabled) {
            app.use((req, res, next) => {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
                res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-RPC-Safe');
                
                if (req.method === 'OPTIONS') {
                    return res.sendStatus(200);
                }
                next();
            });
        }
        
        // Create RPC endpoint with the mini app
        const rpcOptions = {
            safeEnabled: safeEnabled,
            enableBatch: true,
            enableLogging: true,
            endpoint: '/'  // Use root path since we mount the app at the endpoint
        };
        
        node.rpc = new RpcEndpoint(app, {}, rpcOptions);
        
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
    
    RED.nodes.registerType("rpc-server", RpcServerNode);
    
    // Endpoint to get server info for config UI
    RED.httpAdmin.get('/rpc-server-info/:id', function(req, res) {
        const node = RED.nodes.getNode(req.params.id);
        if (node && node.rpc) {
            res.json({
                active: true,
                endpoint: node.endpoint,
                methodCount: node.registeredMethods ? node.registeredMethods.length : 0,
                methods: node.registeredMethods || []
            });
        } else {
            res.json({ active: false });
        }
    });
};
