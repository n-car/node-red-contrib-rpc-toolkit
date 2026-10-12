const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
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

for (const safeEnabled of [false, true]) {
    for (const publicError of [false, true]) {
        const mode = safeEnabled ? 'Safe Mode' : 'standard mode';
        const behavior = publicError ? 'preserves public errors' : 'sanitizes internal errors';
        test(`rpc-response ${behavior} over HTTP in ${mode}`, async (t) => {
            await startServer();
            t.after(stopServer);

            const flow = [
                { id: 'server', type: 'rpc-server', endpoint: '/rpc-errors', safeEnabled },
                { id: 'method', type: 'rpc-method', server: 'server',
                    methodName: 'flowError', wires: [['processor'], []] },
                { id: 'processor', type: 'helper' },
                { id: 'response', type: 'rpc-response', wires: [] }
            ];
            let httpNode;
            await load([(RED) => {
                // The helper supplies an isolated app, not node-red's singleton app.
                httpNode = RED.httpNode;
                rpcServerNode(RED);
            }, rpcMethodNode, rpcResponseNode], flow);

            helper.getNode('processor').on('input', (msg) => {
                msg.error = publicError
                    ? { code: -32042, message: 'Domain failure', data: { reason: 'expected' },
                        stack: 'private-stack-marker' }
                    : Object.assign(new Error('private-message-marker'), {
                        data: { detail: 'private-data-marker' }, stack: 'private-stack-marker'
                    });
                helper.getNode('response').receive(msg);
            });

            const response = await request(httpNode)
                .post('/rpc-errors')
                .set('X-RPC-Safe-Enabled', String(safeEnabled))
                .send({ jsonrpc: '2.0', id: 1, method: 'flowError', params: {} })
                .timeout({ response: 4000, deadline: 6000 });

            assert.equal(response.status, 200);
            assert.equal(response.body.jsonrpc, '2.0');
            assert.equal(response.body.id, 1);
            assert.deepEqual(response.body.error, publicError
                ? { code: -32042, message: 'Domain failure',
                    data: { reason: safeEnabled ? 'S:expected' : 'expected' } }
                : { code: -32603, message: 'Internal error' });
            assert.doesNotMatch(JSON.stringify(response.body), /private-(message|data|stack)-marker/);
        });
    }
}
