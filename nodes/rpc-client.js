/**
 * RPC Client Node for Node-RED
 * Calls remote JSON-RPC 2.0 servers
 */

const { RpcClient } = require('rpc-express-toolkit');

module.exports = function(RED) {
    function RpcClientNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // Configuration
        const serverUrl = config.serverUrl;
        const method = config.method;
        const timeout = config.timeout || 5000;
        const safeEnabled = config.safeEnabled || false;
        const authToken = config.authToken || '';
        
        // Create RPC client
        const clientOptions = {
            timeout: timeout,
            safeEnabled: safeEnabled
        };
        
        const headers = {};
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        node.client = new RpcClient(serverUrl, headers, clientOptions);
        
        node.status({ fill: "grey", shape: "ring", text: "ready" });
        
        node.on('input', async function(msg) {
            try {
                node.status({ fill: "blue", shape: "dot", text: "calling..." });
                
                const methodName = msg.method || method;
                const params = msg.payload || {};
                
                const result = await node.client.call(methodName, params);
                
                msg.payload = result;
                msg.rpc = {
                    method: methodName,
                    success: true
                };
                
                node.status({ fill: "green", shape: "dot", text: "success" });
                node.send(msg);
                
                // Clear status after 2 seconds
                setTimeout(() => {
                    node.status({ fill: "grey", shape: "ring", text: "ready" });
                }, 2000);
                
            } catch (error) {
                node.status({ fill: "red", shape: "ring", text: "error" });
                node.error(`RPC call failed: ${error.message}`, msg);
                
                msg.payload = null;
                msg.error = {
                    message: error.message,
                    code: error.code || -32603
                };
                
                node.send(msg);
            }
        });
        
        node.on('close', function() {
            node.status({});
        });
    }
    
    RED.nodes.registerType("rpc-client", RpcClientNode);
};
