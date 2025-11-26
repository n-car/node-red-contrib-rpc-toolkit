/**
 * RPC Server Config Node for Node-RED
 * Creates a global HTTP endpoint for JSON-RPC 2.0 requests
 */

const { RpcEndpoint } = require('rpc-express-toolkit');

module.exports = function(RED) {
    function RpcServerNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // Configuration
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
        
        // Verify HTTP server is available
        if (!RED.httpNode) {
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
        
        // Store the route handler so we can remove it later
        node.routeHandler = async (req, res) => {
            try {
                const body = JSON.stringify(req.body);
                const response = await node.rpc.handleRequest(body);
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
        };
        
        // Register HTTP endpoint
        RED.httpNode.post(endpoint, node.routeHandler);
        
        node.log(`RPC Server listening on ${endpoint}`);
        
        node.on('close', function(done) {
            // Remove HTTP route
            if (RED.httpNode._router && RED.httpNode._router.stack) {
                RED.httpNode._router.stack = RED.httpNode._router.stack.filter(
                    layer => layer.route?.path !== endpoint
                );
            }
            done();
        });
    }
    
    RED.nodes.registerType("rpc-server", RpcServerNode);
};
