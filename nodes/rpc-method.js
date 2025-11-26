/**
 * RPC Method Node for Node-RED
 * Registers a method handler in the RPC server
 * Output 1: Request parameters (for processing)
 * Output 2: Errors during processing
 * Input: Result to send back to caller
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
        
        // Store pending requests
        node.pendingRequests = new Map();
        
        // Register method in RPC server
        // Handler signature: (req, context, params)
        serverNode.rpc.addMethod(methodName, async (req, context, params) => {
            return new Promise((resolve, reject) => {
                const requestId = 'rpc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                
                // Send to flow - output 1 (success path)
                const msg = {
                    payload: params,
                    rpc: {
                        method: methodName,
                        id: requestId
                    }
                };
                
                // Store resolver
                node.pendingRequests.set(requestId, { resolve, reject });
                
                node.send([msg, null]); // Send to first output only
                
                // Timeout after 30 seconds
                setTimeout(() => {
                    if (node.pendingRequests.has(requestId)) {
                        node.pendingRequests.delete(requestId);
                        reject(new Error('Method timeout'));
                    }
                }, 30000);
            });
        });
        
        // Track registration in server
        if (serverNode.registerMethod) {
            serverNode.registerMethod(methodName);
        }
        
        node.status({ fill: "green", shape: "dot", text: `registered: ${methodName}` });
        
        // Handle responses from flow (input)
        node.on('input', function(msg) {
            const requestId = msg.rpc?.id;
            
            if (!requestId || !node.pendingRequests.has(requestId)) {
                node.warn('No pending request found for ID: ' + requestId);
                return;
            }
            
            const { resolve, reject } = node.pendingRequests.get(requestId);
            node.pendingRequests.delete(requestId);
            
            // Check if it's an error
            if (msg.error) {
                reject(msg.error);
                // Also send to error output (output 2)
                node.send([null, msg]);
            } else {
                resolve(msg.payload);
            }
        });
        
        node.on('close', function() {
            // Reject all pending requests
            for (const [id, { reject }] of node.pendingRequests) {
                reject(new Error('Node closed'));
            }
            node.pendingRequests.clear();
            
            // Unregister from server
            if (serverNode.unregisterMethod) {
                serverNode.unregisterMethod(methodName);
            }
            
            node.status({});
        });
    }
    
    RED.nodes.registerType("rpc-method", RpcMethodNode);
};
