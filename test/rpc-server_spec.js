const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');
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

function load(nodes, flow, credentials) {
    return new Promise((resolve, reject) => {
        helper.load(nodes, flow, credentials || {}, (error) => error ? reject(error) : resolve());
    });
}

function createServerHarness(config, credentials) {
    let ServerConstructor;
    const nodesById = {};
    const httpNode = express();
    const httpAdmin = express();
    const nodeCredentials = credentials || {};
    const RED = {
        httpNode,
        httpAdmin,
        nodes: {
            createNode(node, nodeConfig) {
                node.id = nodeConfig.id;
                node.type = nodeConfig.type;
                node.name = nodeConfig.name || '';
                node.credentials = nodeCredentials[nodeConfig.id] || {};
                node.log = () => {};
                node.warn = () => {};
                node.error = () => {};
                node.on = () => {};
                nodesById[node.id] = node;
            },
            registerType(type, constructor) {
                if (type === 'rpc-server') {
                    ServerConstructor = constructor;
                }
            },
            getNode(id) {
                return nodesById[id];
            }
        }
    };

    rpcServerNode(RED);
    const node = new ServerConstructor(config);

    return { httpNode, node };
}

function postJsonRpc(app, endpoint, headers) {
    return request(app)
        .post(endpoint)
        .set(headers || {})
        .send({
            jsonrpc: '2.0',
            method: '__rpc.capabilities',
            id: 1
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

test('rpc-server node should disable authentication by default', async (t) => {
    const { httpNode, node } = createServerHarness({
        id: 'n1',
        type: 'rpc-server',
        endpoint: '/rpc-no-auth',
        safeEnabled: false
    });
    const response = await postJsonRpc(httpNode, '/rpc-no-auth');

    assert.equal(node.authEnabled, false);
    assert.equal(node.authMode, 'none');
    assert.equal(response.status, 200);
    assert.equal(response.body.result.auth, 'none');
});

test('rpc-server node should protect endpoint with bearer token credentials', async (t) => {
    const { httpNode, node } = createServerHarness({
        id: 'n1',
        type: 'rpc-server',
        endpoint: '/rpc-auth',
        safeEnabled: false,
        authMode: 'bearer'
    }, {
        n1: {
            authToken: 'server-secret'
        }
    });

    const missing = await postJsonRpc(httpNode, '/rpc-auth');
    assert.equal(missing.status, 401);
    assert.equal(missing.headers['www-authenticate'], 'Bearer');
    assert.equal(missing.body.error.code, -32001);

    const invalid = await postJsonRpc(httpNode, '/rpc-auth', {
        Authorization: 'Bearer wrong-secret'
    });
    assert.equal(invalid.status, 401);

    const valid = await postJsonRpc(httpNode, '/rpc-auth', {
        Authorization: 'Bearer server-secret'
    });

    assert.equal(node.authEnabled, true);
    assert.equal(node.authMode, 'bearer');
    assert.equal(valid.status, 200);
    assert.equal(valid.body.result.auth, 'bearer');
});

test('rpc-server node should fail closed when bearer auth has no token', async (t) => {
    const { httpNode } = createServerHarness({
        id: 'n1',
        type: 'rpc-server',
        endpoint: '/rpc-auth-missing-token',
        safeEnabled: false,
        authMode: 'bearer'
    });

    const response = await postJsonRpc(httpNode, '/rpc-auth-missing-token', {
        Authorization: 'Bearer anything'
    });

    assert.equal(response.status, 401);
    assert.equal(response.body.error.message, 'Unauthorized');
});
