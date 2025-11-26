/**
 * RPC Response Node for Node-RED
 * Completes RPC requests initiated by RPC Method nodes
 */

module.exports = function(RED) {
    function RpcResponseNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.status({ fill: "grey", shape: "ring", text: "waiting" });

        node.on('input', function(msg) {
            const requestId = msg.rpc?.id;
            const methodNodeId = msg.rpc?.methodNodeId;

            if (!requestId) {
                node.warn('Missing RPC request id');
                return;
            }

            if (!methodNodeId) {
                node.warn('Missing RPC method reference for request ' + requestId);
                return;
            }

            const methodNode = RED.nodes.getNode(methodNodeId);

            if (!methodNode || typeof methodNode.respondToRequest !== 'function') {
                node.warn('Unable to locate RPC Method node for request ' + requestId);
                return;
            }

            methodNode.respondToRequest(requestId, msg);
            node.status({ fill: msg.error ? "red" : "green", shape: msg.error ? "ring" : "dot", text: msg.error ? "error" : "sent" });

            setTimeout(() => node.status({ fill: "grey", shape: "ring", text: "waiting" }), 1500);
        });

        node.on('close', function() {
            node.status({});
        });
    }

    RED.nodes.registerType("rpc-response", RpcResponseNode);
};
