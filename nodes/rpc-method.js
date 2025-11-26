/**
 * RPC Method Node for Node-RED
 * Registers a method handler in the RPC server
 * This node only OUTPUTS requests, use rpc-response to send back results
 */

module.exports = function(RED) {
    function RpcMethodNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // Configuration
        const methodName = config.methodName;
        const serverNode = RED.nodes.getNode(config.server);
        
        if (!serverNode) {
            node.error("RPC Server not configured");
            return;
        }
        
        if (!serverNode.rpc) {
            node.error("RPC Server not initialized");
            return;
        }
        
        // Store pending requests in server node (shared across response nodes)
        if (!serverNode.pendingRequests) {
            serverNode.pendingRequests = new Map();
        }
        
        // Register method in RPC server
        serverNode.rpc.addMethod(methodName, async (params) => {
            return new Promise((resolve, reject) => {
                const requestId = 'rpc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                
                node.warn('RPC Method handler called - Method: ' + methodName + ', Params: ' + JSON.stringify(params));
                
                // Send to flow - params should be the actual RPC parameters
                const msg = {
                    payload: params,  // This should be {a: 1, b: 2} not the HTTP request
                    rpc: {
                        method: methodName,
                        id: requestId
                    }
                };
                
                // Store resolver in server node (accessible by response nodes)
                serverNode.pendingRequests.set(requestId, { resolve, reject });
                
                node.send(msg);
                
                // Timeout after 30 seconds
                setTimeout(() => {
                    if (serverNode.pendingRequests.has(requestId)) {
                        serverNode.pendingRequests.delete(requestId);
                        reject(new Error('Method timeout'));
                    }
                }, 30000);
            });
        });
        
        node.status({ fill: "green", shape: "dot", text: `registered: ${methodName}` });
        
        node.on('close', function() {
            node.status({});
        });
    }
    
    RED.nodes.registerType("rpc-method", RpcMethodNode);
};
