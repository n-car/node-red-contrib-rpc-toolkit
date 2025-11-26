/**
 * RPC Server Node for Node-RED
 * Creates an HTTP server that handles JSON-RPC 2.0 requests
 */

const { RpcEndpoint } = require('rpc-express-toolkit');

module.exports = function(RED) {
    function RpcServerNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // Configuration
        const port = config.port || 1880;
        const endpoint = config.endpoint || '/rpc';
        const safeEnabled = config.safeEnabled || false;
        const corsEnabled = config.corsEnabled || false;
        
        // Create RPC endpoint
        const rpcOptions = {
            safeEnabled: safeEnabled,
            enableBatch: true,
            enableLogging: true
        };
        
        node.rpc = new RpcEndpoint(endpoint, {}, rpcOptions);
        
        // Create Express app if not exists
        if (!RED.httpNode._router) {
            node.error("HTTP server not available");
            return;
        }
        
        // Add CORS middleware if enabled
        if (corsEnabled) {
            RED.httpNode.use(endpoint, (req, res, next) => {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
                res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-RPC-Safe');
                
                if (req.method === 'OPTIONS') {
                    return res.sendStatus(200);
                }
                next();
            });
        }
        
        // Handle RPC requests
        RED.httpNode.post(endpoint, async (req, res) => {
            try {
                const body = JSON.stringify(req.body);
                const response = await node.rpc.handleRequest(body);
                
                // Emit event for monitoring
                node.send({
                    topic: 'rpc.request',
                    payload: {
                        method: req.body.method,
                        timestamp: Date.now()
                    }
                });
                
                res.json(JSON.parse(response));
            } catch (error) {
                node.error('RPC handling error: ' + error.message);
                res.status(500).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32603,
                        message: 'Internal error'
                    },
                    id: null
                });
            }
        });
        
        node.status({ fill: "green", shape: "dot", text: `listening on ${endpoint}` });
        
        node.on('close', function() {
            node.status({});
        });
    }
    
    RED.nodes.registerType("rpc-server", RpcServerNode);
};
