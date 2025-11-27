/**
 * RPC Request Node for Node-RED
 * Parses incoming RPC requests from HTTP
 */

module.exports = function(RED) {
    function RpcRequestNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        node.on('input', function(msg) {
            try {
                // Parse RPC request from HTTP body
                const request = msg.req?.body || msg.payload;
                
                if (!request || !request.jsonrpc) {
                    node.error("Invalid RPC request");
                    return;
                }
                
                // Extract request components
                msg.payload = request.params || {};
                msg.rpc = {
                    jsonrpc: request.jsonrpc,
                    method: request.method,
                    id: request.id
                };
                
                node.send(msg);
                
            } catch (error) {
                node.error(`Failed to parse RPC request: ${error.message}`, msg);
            }
        });
    }
    
    RED.nodes.registerType("rpc-request", RpcRequestNode);
};
