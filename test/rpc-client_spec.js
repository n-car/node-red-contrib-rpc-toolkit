const test = require('node:test');
const assert = require('node:assert/strict');
const helper = require('node-red-node-test-helper');
const rpcClientNode = require('../nodes/rpc-client.js');

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

test('rpc-client node should be loaded', async (t) => {
    await startServer();
    t.after(stopServer);

    const flow = [
        {
            id: 'n1',
            type: 'rpc-client',
            name: 'test client',
            serverUrl: 'http://localhost:3000/rpc',
            method: 'testMethod',
            timeout: 5000
        }
    ];
    await load(rpcClientNode, flow);

    const n1 = helper.getNode('n1');
    assert.equal(n1.name, 'test client');
});

test('rpc-client node should create RPC client', async (t) => {
    await startServer();
    t.after(stopServer);

    const flow = [
        {
            id: 'n1',
            type: 'rpc-client',
            serverUrl: 'http://localhost:3000/rpc',
            method: 'testMethod',
            timeout: 5000,
            safeEnabled: false
        }
    ];
    await load(rpcClientNode, flow);

    const n1 = helper.getNode('n1');
    assert.ok(n1.client);
});
