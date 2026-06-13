const test = require('node:test');
const assert = require('node:assert/strict');
const helper = require('node-red-node-test-helper');
const rpcServerNode = require('../nodes/rpc-server.js');

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

test('rpc-server node should be loaded', async (t) => {
    await startServer();
    t.after(stopServer);

    const flow = [{ id: 'n1', type: 'rpc-server', name: 'test server' }];
    await load(rpcServerNode, flow);

    const n1 = helper.getNode('n1');
    assert.equal(n1.name, 'test server');
});

test('rpc-server node should create RPC endpoint', async (t) => {
    await startServer();
    t.after(stopServer);

    const flow = [
        {
            id: 'n1',
            type: 'rpc-server',
            port: 1880,
            endpoint: '/rpc',
            safeEnabled: false,
            corsEnabled: false
        }
    ];
    await load(rpcServerNode, flow);

    const n1 = helper.getNode('n1');
    assert.ok(n1.rpc);
});

test('rpc-server node should enable Safe Mode by default', async (t) => {
    await startServer();
    t.after(stopServer);

    const flow = [
        {
            id: 'n1',
            type: 'rpc-server',
            endpoint: '/rpc-default'
        }
    ];
    await load(rpcServerNode, flow);

    const n1 = helper.getNode('n1');
    assert.equal(n1.safeEnabled, true);
    assert.equal(n1.rpc.options.safeEnabled, true);
});

test('rpc-server node should allow standard JSON-RPC mode', async (t) => {
    await startServer();
    t.after(stopServer);

    const flow = [
        {
            id: 'n1',
            type: 'rpc-server',
            endpoint: '/rpc-standard',
            safeEnabled: false
        }
    ];
    await load(rpcServerNode, flow);

    const n1 = helper.getNode('n1');
    assert.equal(n1.safeEnabled, false);
    assert.equal(n1.rpc.options.safeEnabled, false);
});

test('rpc-server node should expose Node-RED CORS setting in capabilities', async (t) => {
    await startServer();
    t.after(stopServer);

    const flow = [
        {
            id: 'n1',
            type: 'rpc-server',
            endpoint: '/rpc-cors',
            corsEnabled: true
        }
    ];
    await load(rpcServerNode, flow);

    const n1 = helper.getNode('n1');
    const capabilitiesMethod = n1.rpc.getMethod('__rpc.capabilities');
    const capabilities = await capabilitiesMethod.handler();

    assert.equal(n1.corsEnabled, true);
    assert.equal(capabilities.cors, true);
});
