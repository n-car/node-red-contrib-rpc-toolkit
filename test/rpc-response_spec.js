const test = require('node:test');
const assert = require('node:assert/strict');
const helper = require('node-red-node-test-helper');
const rpcServerNode = require('../nodes/rpc-server.js');
const rpcMethodNode = require('../nodes/rpc-method.js');
const rpcResponseNode = require('../nodes/rpc-response.js');

helper.init(require.resolve('node-red'));

function startServer() {
    return new Promise((resolve, reject) => {
        helper.startServer((error) => error ? reject(error) : resolve());
    });
}

function stopServer() {
    return new Promise((resolve, reject) => {
        helper.unload();
        helper.stopServer((error) => error ? reject(error) : resolve());
    });
}

function load(nodes, flow) {
    return new Promise((resolve, reject) => {
        helper.load(nodes, flow, (error) => error ? reject(error) : resolve());
    });
}

test('rpc-response node should route responses back to originating rpc-method', async (t) => {
    await startServer();
    t.after(stopServer);

    const flow = [
        {
            id: 'server',
            type: 'rpc-server',
            name: 'test server',
            endpoint: '/rpc'
        },
        {
            id: 'method',
            type: 'rpc-method',
            server: 'server',
            methodName: 'ping'
        },
        {
            id: 'response',
            type: 'rpc-response',
            wires: []
        }
    ];

    await load([rpcServerNode, rpcMethodNode, rpcResponseNode], flow);

    const methodNode = helper.getNode('method');
    const responseNode = helper.getNode('response');

    const requestId = 'rpc_test_1';
    const completion = new Promise((resolve, reject) => {
        methodNode.pendingRequests.set(requestId, { resolve, reject });
    });

    responseNode.receive({
        payload: 'pong',
        rpc: {
            id: requestId,
            methodNodeId: methodNode.id
        }
    });

    const result = await completion;
    assert.equal(result, 'pong');
});
