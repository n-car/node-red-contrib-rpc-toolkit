const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
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

function load(nodes, flow, credentials) {
    return new Promise((resolve, reject) => {
        helper.load(nodes, flow, credentials || {}, (error) => error ? reject(error) : resolve());
    });
}

function startRpcServer(handler) {
    return new Promise((resolve, reject) => {
        const server = http.createServer((req, res) => {
            const chunks = [];

            req.on('data', chunk => chunks.push(chunk));
            req.on('end', async () => {
                try {
                    const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
                    const result = await handler(req, body);

                    if (result === null) {
                        res.writeHead(204);
                        res.end();
                        return;
                    }

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        jsonrpc: '2.0',
                        id: body.id,
                        result
                    }));
                } catch (error) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        jsonrpc: '2.0',
                        id: null,
                        error: {
                            code: -32603,
                            message: error.message
                        }
                    }));
                }
            });
        });

        server.on('error', reject);
        server.listen(0, '127.0.0.1', () => {
            const address = server.address();
            resolve({
                server,
                url: `http://127.0.0.1:${address.port}/rpc`
            });
        });
    });
}

function closeServer(server) {
    return new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
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

test('rpc-client node should store auth token as Node-RED credential', async (t) => {
    await startServer();
    t.after(stopServer);

    let receivedAuthorization;
    const rpcServer = await startRpcServer((req, body) => {
        receivedAuthorization = req.headers.authorization;
        assert.equal(body.method, 'ping');
        return 'pong';
    });
    t.after(() => closeServer(rpcServer.server));

    const flow = [
        {
            id: 'n1',
            type: 'rpc-client',
            serverUrl: rpcServer.url,
            method: 'ping',
            timeout: 5000,
            safeEnabled: false,
            wires: [['n2'], []]
        },
        { id: 'n2', type: 'helper' }
    ];
    await load(rpcClientNode, flow, {
        n1: {
            authToken: 'credential-token'
        }
    });

    const n1 = helper.getNode('n1');
    const n2 = helper.getNode('n2');
    const message = new Promise(resolve => n2.on('input', resolve));

    n1.receive({ payload: {} });
    const result = await message;

    assert.equal(result.payload, 'pong');
    assert.equal(receivedAuthorization, 'Bearer credential-token');
});

test('rpc-client node should keep legacy config authToken fallback', async (t) => {
    await startServer();
    t.after(stopServer);

    let receivedAuthorization;
    const rpcServer = await startRpcServer((req) => {
        receivedAuthorization = req.headers.authorization;
        return 'pong';
    });
    t.after(() => closeServer(rpcServer.server));

    const flow = [
        {
            id: 'n1',
            type: 'rpc-client',
            serverUrl: rpcServer.url,
            method: 'ping',
            timeout: 5000,
            safeEnabled: false,
            authToken: 'Bearer legacy-token',
            wires: [['n2'], []]
        },
        { id: 'n2', type: 'helper' }
    ];
    await load(rpcClientNode, flow);

    const n1 = helper.getNode('n1');
    const n2 = helper.getNode('n2');
    const message = new Promise(resolve => n2.on('input', resolve));

    n1.receive({ payload: {} });
    await message;

    assert.equal(receivedAuthorization, 'Bearer legacy-token');
});

test('rpc-client introspection should use saved credential when editor sends password placeholder', async (t) => {
    await startServer();
    t.after(stopServer);

    let receivedAuthorization;
    const rpcServer = await startRpcServer((req, body) => {
        receivedAuthorization = req.headers.authorization;
        assert.equal(body.method, '__rpc.listMethods');
        return ['ping'];
    });
    t.after(() => closeServer(rpcServer.server));

    const flow = [
        {
            id: 'n1',
            type: 'rpc-client',
            serverUrl: rpcServer.url,
            method: 'ping',
            timeout: 5000,
            safeEnabled: false
        }
    ];
    await load(rpcClientNode, flow, {
        n1: {
            authToken: 'saved-token'
        }
    });

    const response = await helper.request()
        .post('/rpc-client/introspect')
        .send({
            serverUrl: rpcServer.url,
            authToken: '__PWRD__',
            safeEnabled: false,
            nodeId: 'n1'
        });

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, {
        success: true,
        methods: ['ping']
    });
    assert.equal(receivedAuthorization, 'Bearer saved-token');
});
