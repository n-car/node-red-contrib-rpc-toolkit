/**
 * RPC Response Node for Node-RED
 * Sends RPC responses back to client
 */

module.exports = function(RED) {
    function RpcResponseNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        node.on('input', function(msg) {
            try {
                const rpcId = msg.rpc?.id;
                
                if (rpcId === undefined) {
                    node.error("Missing RPC ID in message");
                    return;
                }
                
                // Build response
                const response = {
                    jsonrpc: '2.0',
                    id: rpcId
                };
                
                if (msg.error) {
                    response.error = {
                        code: msg.error.code || -32603,
                        message: msg.error.message || 'Internal error',
                        data: msg.error.data
                    };
                } else {
                    response.result = msg.payload;
                }
                
                // Send via HTTP response
                if (msg.res) {
                    msg.res.json(response);
                } else {
                    msg.payload = response;
                    node.send(msg);
                }
                
            } catch (error) {
                node.error(`Failed to send RPC response: ${error.message}`, msg);
            }
        });
    }
    
    RED.nodes.registerType("rpc-response", RpcResponseNode);
};
