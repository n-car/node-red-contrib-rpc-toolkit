/**
 * RPC Client Node for Node-RED
 * Calls remote JSON-RPC 2.0 servers
 * Output 1: Successful responses
 * Output 2: Errors
 */

const { RpcClient } = require('rpc-express-toolkit');

function getConfiguredAuthToken(node, config) {
    return (node.credentials && node.credentials.authToken) || config.authToken || '';
}

function getRequestAuthToken(RED, requestBody) {
    const bodyToken = requestBody.authToken || '';

    if (bodyToken && bodyToken !== '__PWRD__') {
        return bodyToken;
    }

    if (!requestBody.nodeId || typeof RED.nodes.getCredentials !== 'function') {
        return bodyToken === '__PWRD__' ? '' : bodyToken;
    }

    const credentials = RED.nodes.getCredentials(requestBody.nodeId) || {};
    return credentials.authToken || '';
}

function createAuthorizationHeaders(authToken) {
    if (!authToken) {
        return {};
    }

    return {
        Authorization: authToken.startsWith('Bearer ')
            ? authToken
            : `Bearer ${authToken}`
    };
}

module.exports = function(RED) {
    function RpcClientNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        
        // Configuration
        const serverUrl = config.serverUrl;
        const method = config.method;
        const timeout = config.timeout || 5000;
        const safeEnabled = config.safeEnabled !== false; // default to true unless explicitly disabled
        const authToken = getConfiguredAuthToken(node, config);
        
        // Create RPC client
        const clientOptions = {
            timeout: timeout,
            safeEnabled: safeEnabled
        };
        
        const headers = createAuthorizationHeaders(authToken);
        
        node.client = new RpcClient(serverUrl, headers, clientOptions);
        
        node.status({ fill: "grey", shape: "ring", text: "ready" });
        
        node.on('input', async function(msg) {
            try {
                node.status({ fill: "blue", shape: "dot", text: "calling..." });
                
                const methodName = msg.method || method;
                const params = msg.payload || {};
                
                const result = await node.client.call(methodName, params);
                
                // Success - send to output 1
                msg.payload = result;
                msg.rpc = {
                    method: methodName,
                    success: true
                };
                
                node.status({ fill: "green", shape: "dot", text: "success" });
                node.send([msg, null]); // Output 1 only
                
                // Clear status after 2 seconds
                setTimeout(() => {
                    node.status({ fill: "grey", shape: "ring", text: "ready" });
                }, 2000);
                
            } catch (error) {
                node.status({ fill: "red", shape: "ring", text: "error" });
                
                // Error - send to output 2
                const errorMsg = {
                    ...msg,
                    payload: null,
                    error: {
                        message: error.message,
                        code: error.code || -32603
                    }
                };
                
                node.send([null, errorMsg]); // Output 2 only
                
                // Clear status after 2 seconds
                setTimeout(() => {
                    node.status({ fill: "grey", shape: "ring", text: "ready" });
                }, 2000);
            }
        });
        
        node.on('close', function() {
            node.status({});
        });
    }
    
    RED.nodes.registerType("rpc-client", RpcClientNode, {
        credentials: {
            authToken: { type: "password" }
        }
    });

    // Admin endpoint used by editor UI to load method list via RpcClient
    RED.httpAdmin.post('/rpc-client/introspect', async function(req, res) {
        const requestBody = req.body || {};
        const { serverUrl, safeEnabled } = requestBody;

        if (!serverUrl) {
            return res.status(400).json({ success: false, error: { message: 'Missing serverUrl' } });
        }

        try {
            const authToken = getRequestAuthToken(RED, requestBody);
            const headers = createAuthorizationHeaders(authToken);

            const client = new RpcClient(serverUrl, headers, {
                timeout: 5000,
                safeEnabled: safeEnabled !== false
            });

            const methods = await client.call('__rpc.listMethods', {});
            res.json({ success: true, methods });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: {
                    message: error.message,
                    code: error.code || -32603
                }
            });
        }
    });
};
