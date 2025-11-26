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
        const description = config.description || '';
        const exposeSchema = config.exposeSchema || false;
        const serverNode = RED.nodes.getNode(config.server);
        const validateSchema = config.validateSchema;
        let schema = null;
        
        // Parse schema if validation is enabled
        if (validateSchema && config.schema) {
            try {
                schema = JSON.parse(config.schema);
            } catch (e) {
                node.error("Invalid JSON Schema: " + e.message);
                return;
            }
        }
        
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
        
        // Prepare method options with description and exposeSchema
        const methodOptions = {
            description: description,
            exposeSchema: exposeSchema
        };
        if (schema) {
            methodOptions.schema = schema;
        }
        
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
        }, methodOptions);
        
        // Track registration in server
        if (serverNode.registerMethod) {
            serverNode.registerMethod(methodName);
        }
        
        let statusText = methodName;
        if (exposeSchema) statusText += ' 📋';
        if (schema) statusText += ' ✓';
        
        node.status({ fill: "green", shape: "dot", text: statusText });
        
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
