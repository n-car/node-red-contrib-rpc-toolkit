/**
 * RPC Method Node for Node-RED
 * Registers a method handler in the RPC server
 * Output 1: Request parameters (for processing)
 * Output 2: Errors during processing
 * Responses must go through the RPC Response node
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
        
        let statusText = methodName;
        if (exposeSchema) statusText += ' 📋';
        if (schema) statusText += ' ✓';

        // Register method in RPC server
        // Handler signature: (req, context, params)
        serverNode.rpc.addMethod(methodName, async (req, context, params) => {
            return new Promise((resolve, reject) => {
                const requestId = 'rpc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

                // Flash yellow status when request arrives
                node.status({ fill: "yellow", shape: "dot", text: statusText + " (processing...)" });
                
                // Send to flow - output 1 (success path)
                const msg = {
                    payload: params,
                    rpc: {
                        method: methodName,
                        id: requestId,
                        methodNodeId: node.id
                    }
                };

                // Store resolver
                node.pendingRequests.set(requestId, { resolve, reject });
                
                node.send([msg, null]); // Send to first output only
                
                // Timeout after 30 seconds
                setTimeout(() => {
                    if (node.pendingRequests.has(requestId)) {
                        node.pendingRequests.delete(requestId);
                        node.status({ fill: "red", shape: "ring", text: statusText + " (timeout)" });
                        reject(new Error('Method timeout'));
                        
                        // Return to green after 2 seconds
                        setTimeout(() => {
                            node.status({ fill: "green", shape: "dot", text: statusText });
                        }, 2000);
                    }
                }, 30000);
            });
        }, methodOptions);
        
        // Track registration in server
        if (serverNode.registerMethod) {
            serverNode.registerMethod(methodName);
        }
        
        node.status({ fill: "green", shape: "dot", text: statusText });

        node.respondToRequest = function(requestId, msg) {
            if (!requestId || !node.pendingRequests.has(requestId)) {
                node.warn('No pending request found for ID: ' + requestId);
                return;
            }

            const { resolve, reject } = node.pendingRequests.get(requestId);
            node.pendingRequests.delete(requestId);

            // Check if it's an error
            if (msg.error) {
                reject(msg.error);
                // Show red status briefly
                node.status({ fill: "red", shape: "ring", text: statusText + " (error)" });
                // Also send to error output (output 2)
                node.send([null, msg]);
                
                // Return to green after 2 seconds
                setTimeout(() => {
                    node.status({ fill: "green", shape: "dot", text: statusText });
                }, 2000);
            } else {
                resolve(msg.payload);
                // Show blue status briefly for success
                node.status({ fill: "blue", shape: "dot", text: statusText + " (success)" });
                
                // Return to green after 500ms
                setTimeout(() => {
                    node.status({ fill: "green", shape: "dot", text: statusText });
                }, 500);
            }
        };

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
