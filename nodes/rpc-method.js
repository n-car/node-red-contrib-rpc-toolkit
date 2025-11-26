/**
 * RPC Method Node for Node-RED
 * Registers a method handler in the RPC server
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
        serverNode.rpc.addMethod(methodName, async (params, context) => {
            return new Promise((resolve, reject) => {
                const requestId = Date.now() + Math.random();
                
                // Send to flow (without context to avoid circular refs)
                const msg = {
                    payload: params,
                    rpc: {
                        method: methodName,
                        id: requestId
                    }
                };
                
                // Store resolver
                node.pendingRequests.set(requestId, { resolve, reject });
                
                node.send(msg);
                
                // Timeout after 30 seconds
                setTimeout(() => {
                    if (node.pendingRequests.has(requestId)) {
                        node.pendingRequests.delete(requestId);
                        reject(new Error('Method timeout'));
                    }
                }, 30000);
            });
        });
        
        node.status({ fill: "green", shape: "dot", text: `registered: ${methodName}` });
        
        // Handle responses from flow
        node.on('input', function(msg) {
            node.warn('RPC Method received input - ID: ' + msg.rpc?.id + ', Payload: ' + JSON.stringify(msg.payload));
            
            const requestId = msg.rpc?.id;
            
            if (requestId && node.pendingRequests.has(requestId)) {
                node.warn('Found pending request for ID: ' + requestId);
                const { resolve, reject } = node.pendingRequests.get(requestId);
                node.pendingRequests.delete(requestId);
                
                if (msg.error) {
                    reject(msg.error);
                } else {
                    node.warn('Resolving with: ' + JSON.stringify(msg.payload));
                    resolve(msg.payload);
                }
            } else {
                node.warn('No pending request found for ID: ' + requestId + ', Pending: ' + Array.from(node.pendingRequests.keys()).join(', '));
            }
        });
        
        node.on('close', function() {
            // Reject all pending requests
            for (const [id, { reject }] of node.pendingRequests) {
                reject(new Error('Node closed'));
            }
            node.pendingRequests.clear();
            node.status({});
        });
    }
    
    RED.nodes.registerType("rpc-method", RpcMethodNode);
};
