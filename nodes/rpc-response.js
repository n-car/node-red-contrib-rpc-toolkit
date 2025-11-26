/**
 * RPC Response Node for Node-RED
 * Sends RPC responses back to the caller (completes the promise)
 */

module.exports = function(RED) {
    function RpcResponseNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // Get server config to access pendingRequests
        const serverNode = RED.nodes.getNode(config.server);
        
        if (!serverNode) {
            node.error("RPC Server not configured");
            return;
        }
        
        node.on('input', function(msg) {
            try {
                const requestId = msg.rpc?.id;
                
                if (!requestId) {
                    node.error("Missing RPC ID in message");
                    return;
                }
                
                // Find the pending request
                if (!serverNode.pendingRequests || !serverNode.pendingRequests.has(requestId)) {
                    node.warn(`No pending request found for ID: ${requestId}`);
                    return;
                }
                
                const { resolve, reject } = serverNode.pendingRequests.get(requestId);
                serverNode.pendingRequests.delete(requestId);
                
                // Resolve or reject based on msg.error
                if (msg.error) {
                    reject(msg.error);
                    node.status({ fill: "red", shape: "dot", text: "error sent" });
                } else {
                    resolve(msg.payload);
                    node.status({ fill: "green", shape: "dot", text: "response sent" });
                }
                
                // Clear status after 2 seconds
                setTimeout(() => {
                    node.status({});
                }, 2000);
                
            } catch (error) {
                node.error(`Failed to send RPC response: ${error.message}`, msg);
                node.status({ fill: "red", shape: "ring", text: "error" });
            }
        });
    }
    
    RED.nodes.registerType("rpc-response", RpcResponseNode);
};
